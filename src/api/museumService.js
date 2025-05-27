import axios from "axios";
import { smithsonianConfig, europeanaConfig } from "./config";
import * as smithsonianRepository from "./repositories/smithsonianRepository";
import * as smithsonianAdapter from "./adapters/smithsonianAdapter";
import { europeanaRepository } from "./repositories/europeanaRepository";
import { adaptEuropeanaItemDetails } from "./adapters/europeanaAdapter";

/**
 * Check if application is running in development mode
 */
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

const SUPPORTED_SOURCES = ["smithsonian", "europeana"];

const isSourceSupported = (source) => {
  return SUPPORTED_SOURCES.includes(source);
};

/**
 * Error Handling
 * @param {Error} error - The error object
 * @param {string} source - The API source ("smithsonian" or "europeana")
 * @param {string} operation - The operation being performed ("fetching", "searching", etc.)
 * @param {string|null} id - Optional ID for item-specific operations
 * @returns {Object} - Standardised error response object
 */
const handleApiError = (error, source, operation, id = null) => {
  if (axios.isCancel(error)) {
    if (isDevelopment()) {
      console.log(
        `${source} ${operation} request cancelled${id ? ` for ${id}` : ""}`
      );
    }
    throw error;
  }
  if (isDevelopment()) {
    console.error(
      `Error ${operation} ${source}${id ? ` item ${id}` : ""}: ${error.message}`
    );
  }
  const baseErrorObj = {
    error: error.message,
    source,
    rawData: {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    },
  };

  if (id) {
    return {
      id,
      title: `Item ${id}`,
      ...baseErrorObj,
    };
  }

  return baseErrorObj;
};

/**
 Search for museum items from specified source
 */
export const searchItems = async (
  source,
  query,
  progressCallback = null
) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  if (!isSourceSupported(source)) {
    throw new Error(`Unsupported source: ${source}`);
  }

  try {
    switch (source) {
      case "smithsonian":
        return await searchSmithsonianComplete(query, progressCallback);
      case "europeana":
        return await searchEuropeanaComplete(query, progressCallback);
      default:
        throw new Error(`Source implementation not found: ${source}`);
    }
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error searching ${source}: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Routing and orchestration - determines which API to call based on source
 */
export const getItemDetails = async (source, id, cancelToken = null) => {
  if (!id) {
    throw new Error("Item ID is required");
  }

  if (!isSourceSupported(source)) {
    throw new Error(`Unsupported source: ${source}`);
  }

  try {
    switch (source) {
      case "smithsonian":
        return await getSmithsonianItemDetails(id, cancelToken);
      case "europeana":
        return await getEuropeanaItemDetails(id, cancelToken);
      default:
        throw new Error(`Source implementation not found: ${source}`);
    }
  } catch (error) {
    return handleApiError(error, source, "fetching", id);
  }
};

/**
 * Get item details from Smithsonian API
 */
async function getSmithsonianItemDetails(id, cancelToken = null) {
  if (isDevelopment()) {
    console.log(`Fetching Smithsonian item details for ID: ${id}`);
  }

  const rawData = await smithsonianRepository.getSmithsonianItemDetails(
    id,
    cancelToken
  );
  const adaptedData = smithsonianAdapter.adaptSmithsonianItemDetails(rawData);

  // Attach raw data for debugging and compatibility
  adaptedData.rawData = rawData;

  return adaptedData;
}

/**
 * Get item details from Europeana API
 */
async function getEuropeanaItemDetails(id, cancelToken = null) {
  if (isDevelopment()) {
    console.log(`Fetching Europeana item details for ID: ${id}`);
  }

  const rawData = await europeanaRepository.getRecord(id, {
    profile: "rich",
  });
  const adaptedData = adaptEuropeanaItemDetails(rawData);

  // Attach raw data for debugging and compatibility
  adaptedData.rawData = rawData;

  return adaptedData;
}

/**
 * Search Europeana API 
 */
async function searchEuropeanaComplete(query, progressCallback = null) {
  try {
    const response = await europeanaRepository.search(query, {
      rows: europeanaConfig.defaultSearchRows,
    });

    if (progressCallback) {
      progressCallback({
        message: `Found ${response.totalResults} Europeana results`,
        itemsFound: response.itemsCount || 0,
        totalResults: response.totalResults || 0,
      });
    }

    return {
      total: response.totalResults || 0,
      items: response.items || [],
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error searching Europeana API: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Helper function to fetch and process a single batch
 */
async function fetchBatch(query, offset, batchSize, batchNum) {
  try {
    const batchResponse = await smithsonianRepository.searchSmithsonianItems(
      query,
      offset,
      batchSize
    );

    const adaptedBatch = smithsonianAdapter.adaptSmithsonianSearchResults(
      batchResponse
    );

    return adaptedBatch.items || [];
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error fetching batch ${batchNum + 1}: ${error.message}`);
    }
    return [];
  }
}

/**
 * Search Smithsonian API and return ALL results with images
 */
async function searchSmithsonianComplete(query, progressCallback = null) {
  try {
    const initialResponse = await smithsonianRepository.searchSmithsonianItems(
      query,
      0,
      1
    );

    if (!initialResponse?.response?.rowCount) {
      return { total: 0, items: [] };
    }

    const totalResults = initialResponse.response.rowCount;
    const batchSize = smithsonianConfig.batchSize;
    const totalBatches = Math.ceil(totalResults / batchSize);

    if (isDevelopment()) {
      console.log(
        `Found ${totalResults} total results, processing in ${totalBatches} batches`
      );
    }

    if (progressCallback) {
      progressCallback({
        message: `Searching through ${totalResults} results for items with images...`,
        itemsFound: 0,
        totalResults,
      });
    }

    let allItemsWithImages = [];
    const maxConcurrent = smithsonianConfig.maxParallelRequests;

    for (
      let groupStart = 0;
      groupStart < totalBatches;
      groupStart += maxConcurrent
    ) {
      const groupEnd = Math.min(groupStart + maxConcurrent, totalBatches);

      const batchPromises = [];
      for (let batchNum = groupStart; batchNum < groupEnd; batchNum++) {
        const offset = batchNum * batchSize;
        batchPromises.push(fetchBatch(query, offset, batchSize, batchNum));
      }

      const batchResults = await Promise.all(batchPromises);

      for (let i = 0; i < batchResults.length; i++) {
        const batchItems = batchResults[i];
        if (batchItems.length > 0) {
          allItemsWithImages = [...allItemsWithImages, ...batchItems];
        }

        if (progressCallback) {
          const currentBatch = groupStart + i + 1;
          progressCallback({
            message: `Searching through ${totalResults.toLocaleString()} items...`,
            itemsFound: allItemsWithImages.length,
            totalResults,
            batchesProcessed: currentBatch,
            totalBatches,
          });
        }
      }
    }

    if (isDevelopment()) {
      console.log(
        `Search complete. Found ${allItemsWithImages.length} items with images`
      );
    }

    return {
      total: totalResults,
      items: allItemsWithImages,
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error searching Smithsonian API: ${error.message}`);
    }
    throw error;
  }
}