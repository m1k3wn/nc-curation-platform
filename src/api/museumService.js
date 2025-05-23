import axios from "axios";
import { smithsonianConfig } from "./config";
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

/**
 * Supported API sources
 */
const SUPPORTED_SOURCES = ["smithsonian", "europeana"];

/**
 * Validates if a source is supported
 */
const isSourceSupported = (source) => {
  return SUPPORTED_SOURCES.includes(source);
};

/**
 * Generic error handler for API operations
 * @param {Error} error - The error object
 * @param {string} source - The API source ("smithsonian" or "europeana")
 * @param {string} operation - The operation being performed ("fetching", "searching", etc.)
 * @param {string|null} id - Optional ID for item-specific operations
 * @returns {Object} - Standardised error response object
 */
const handleApiError = (error, source, operation, id = null) => {
  // Handle cancelled requests
  if (axios.isCancel(error)) {
    if (isDevelopment()) {
      console.log(
        `${source} ${operation} request cancelled${id ? ` for ${id}` : ""}`
      );
    }
    throw error;
  }

  // Log error in development
  if (isDevelopment()) {
    console.error(
      `Error ${operation} ${source}${id ? ` item ${id}` : ""}: ${error.message}`
    );
  }

  // Return standardised error object
  const baseErrorObj = {
    error: error.message,
    source,
    _rawApiResponse: {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    },
  };

  // Add item-specific fields if ID provided
  if (id) {
    return {
      id,
      title: `Item ${id}`,
      ...baseErrorObj,
      rawData: baseErrorObj._rawApiResponse, // Smithsonian compatibility
    };
  }

  return baseErrorObj;
};

/**
 * Search for museum items - SIMPLIFIED VERSION
 * Searches through ALL batches and returns complete results
 */
export const searchItems = async (
  source = "smithsonian",
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
 * Determine the source from item ID
 * @param {string} itemId - The item ID
 * @returns {string} - The source ("smithsonian" or "europeana")
 */
const determineSource = (itemId) => {
  if (!itemId) return "smithsonian";

  const europeanaPatterns = [
    /^\d+\/.*/, // digits/path pattern
    /^\/\d+\/.*/, // leading slash + digits/path
  ];

  return europeanaPatterns.some((pattern) => pattern.test(itemId))
    ? "europeana"
    : "smithsonian";
};

/**
 * Get detailed information for a specific item (automatically detects source)
 */
export const getItemDetails = async (id, cancelToken = null) => {
  if (!id) {
    throw new Error("Item ID is required");
  }

  // Automatically determine source from ID format
  const source = determineSource(id);

  if (isDevelopment()) {
    console.log(`Auto-detected source "${source}" for item ID: ${id}`);
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
 * Get detailed information for a specific item (with explicit source - for legacy/specific use)
 */
export const getItemDetailsBySource = async (
  source = "smithsonian",
  id,
  cancelToken = null
) => {
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

  // Ensure backward compatibility fields
  if (!adaptedData.rawData) {
    adaptedData.rawData = rawData;
  }
  if (!adaptedData._rawApiResponse) {
    adaptedData._rawApiResponse = rawData;
  }

  return adaptedData;
}

/**
 * Get item details from Europeana API
 */
async function getEuropeanaItemDetails(id, cancelToken = null) {
  if (isDevelopment()) {
    console.log(`Fetching Europeana item details for ID: ${id}`);
  }

  // Always use 'rich' profile for detailed item views
  const rawData = await europeanaRepository.getRecord(id, {
    profile: "rich",
  });
  const adaptedData = adaptEuropeanaItemDetails(rawData);

  return adaptedData;
}

/**
 * Search Europeana API (simplified for now)
 */
async function searchEuropeanaComplete(query, progressCallback = null) {
  try {
    // For now, just do a basic search - can be enhanced later
    const response = await europeanaRepository.search(query, {
      rows: 50, // Get a decent number of results
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
      source: "europeana",
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
      batchResponse,
      batchNum + 1,
      batchSize
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
 * SIMPLIFIED: Search Smithsonian API and return ALL results with images
 */
async function searchSmithsonianComplete(query, progressCallback = null) {
  try {
    // Step 1: Get total count
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

    // Update progress
    if (progressCallback) {
      progressCallback({
        message: `Searching through ${totalResults} results for items with images...`,
        itemsFound: 0,
        totalResults,
      });
    }

    // Step 2: Search through ALL batches in parallel (with concurrency limit)
    let allItemsWithImages = [];
    const maxConcurrent = smithsonianConfig.maxParallelRequests; // Use config value

    for (
      let groupStart = 0;
      groupStart < totalBatches;
      groupStart += maxConcurrent
    ) {
      const groupEnd = Math.min(groupStart + maxConcurrent, totalBatches);

      // Create promises for this group of batches
      const batchPromises = [];
      for (let batchNum = groupStart; batchNum < groupEnd; batchNum++) {
        const offset = batchNum * batchSize;
        batchPromises.push(fetchBatch(query, offset, batchSize, batchNum));
      }

      // Process this group in parallel
      const batchResults = await Promise.all(batchPromises);

      // Add all items from this group and update progress after each batch
      for (let i = 0; i < batchResults.length; i++) {
        const batchItems = batchResults[i];
        if (batchItems.length > 0) {
          allItemsWithImages = [...allItemsWithImages, ...batchItems];
        }

        // Update progress after each batch for more responsive UX
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

    // Step 3: Return complete results
    if (isDevelopment()) {
      console.log(
        `Search complete. Found ${allItemsWithImages.length} items with images`
      );
    }

    return {
      total: totalResults,
      items: allItemsWithImages,
      source: "smithsonian",
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error searching Smithsonian API: ${error.message}`);
    }
    throw error;
  }
}
