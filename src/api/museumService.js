import axios from "axios";
import { smithsonianConfig, europeanaConfig, supportedSources } from "./config";
import * as smithsonianRepository from "./repositories/smithsonianRepository";
import * as smithsonianAdapter from "./adapters/smithsonianAdapter";
import { europeanaRepository } from "./repositories/europeanaRepository";
import { adaptEuropeanaItemDetails, adaptEuropeanaSearchResults } from "./adapters/europeanaAdapter";


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
    throw error;
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
 * UNIFIED FETCH FUNCTION 
 * Search all museum sources with progressive results
 * Europeana results come first, then Smithsonian results are added
 */
export const searchAllSources = async (query, progressCallback = null) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  const results = {
    items: [],
    totalSmithsonian: 0,
    totalEuropeana: 0,
    get total() {
      return this.totalSmithsonian + this.totalEuropeana;
    }
  };

  const updateProgress = (message, includeResults = true) => {
    if (progressCallback) {
      progressCallback({
        message,
        itemsFound: includeResults ? results.items.length : 0,
        totalResults: results.total,
        currentResults: includeResults ? [...results.items] : [],
        query: query, // Include the query in progress data
      });
    }
  };

  updateProgress("Searching museum collections...", false);

  const europeanaPromise = searchEuropeanaComplete(query)
    .then((europeanaResponse) => {
      results.totalEuropeana = europeanaResponse.total || 0;
      
      if (europeanaResponse.items?.length > 0) {
        results.items.push(...europeanaResponse.items);
        updateProgress(`Found ${results.items.length} results, searching for more...`);
      }
      
      return europeanaResponse;
    })
    .catch((error) => {
      return { total: 0, items: [] };
    });

const smithsonianPromise = searchSmithsonianComplete(query, (progress) => {
  if (progress.itemsFound > 0) {
    updateProgress(`Found ${results.items.length + progress.itemsFound} results, searching for more...`);
  }
})
    .then((smithsonianResponse) => {
      results.totalSmithsonian = smithsonianResponse.total || 0;
      
      if (smithsonianResponse.items?.length > 0) {
        results.items.push(...smithsonianResponse.items);
      }
      
      return smithsonianResponse;
    })
    .catch((error) => {
      return { total: 0, items: [] };
    });

  await europeanaPromise;

  if (results.items.length > 0) {
    smithsonianPromise.then(() => {
      updateProgress(`Search complete: ${results.items.length} results found`);
    });

    return {
      total: results.total,
      items: [...results.items], 
      smithsonianPromise, 
    };
  }

  await smithsonianPromise;
  updateProgress(`Search complete: ${results.items.length} results found`);

  return {
    total: results.total,
    items: results.items,
  };
};

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
    throw error;
  }
};

/**
 * Choose which API to call based on source
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

// ================ SINGLE ITEM FETCH ================

async function getSmithsonianItemDetails(id, cancelToken = null) {
  const rawData = await smithsonianRepository.getSmithsonianItemDetails(
    id,
    cancelToken
  );
  const adaptedData = smithsonianAdapter.adaptSmithsonianItemDetails(rawData);
  // Debugging - raw response 
  adaptedData.rawData = rawData;
  return adaptedData;
}

async function getEuropeanaItemDetails(id, cancelToken = null) {
  const rawData = await europeanaRepository.getRecord(id, {
    profile: "rich",
  });
  const adaptedData = adaptEuropeanaItemDetails(rawData);
    // Debugging - raw response 
  adaptedData.rawData = rawData;
  return adaptedData;
}

// ================ FULL RECORDS SEARCH ================

async function searchEuropeanaComplete(query, progressCallback = null) {
  try {
    const maxResults = europeanaConfig.maxResults || 1000;
    const batchSize = europeanaConfig.batchSize || 100;
    const totalBatches = Math.ceil(maxResults / batchSize);
    
    let allItems = [];
    let totalResults = 0;

    for (let batch = 0; batch < totalBatches; batch++) {
      const start = batch * batchSize;
      const searchOptions = {
      rows: batchSize,
    };

  if (start > 0) {
    searchOptions.start = start;
  }
      
      const response = await europeanaRepository.search(query, searchOptions);

      if (batch === 0) {
        totalResults = response.totalResults || 0;
      }
      const adaptedBatch = adaptEuropeanaSearchResults(response);
      if (adaptedBatch.items?.length > 0) {
        allItems.push(...adaptedBatch.items);
      }
      if ((response.itemsCount || 0) < batchSize) {
        break;
      }

      if (progressCallback) {
        progressCallback({
          message: `Found ${allItems.length} Europeana results...`,
          itemsFound: allItems.length,
          totalResults: totalResults,
        });
      }
    }

    return {
      total: totalResults,
      items: allItems,
    };
  } catch (error) {
    throw error;
  }
}

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
    const maxBatches = smithsonianConfig.maxBatches; 
    const totalBatches = Math.min(Math.ceil(totalResults / batchSize), maxBatches);

    // debugging
        console.log("🔍 Smithsonian Debug:");
    console.log("  - totalResults:", totalResults);
    console.log("  - batchSize:", batchSize);
    console.log("  - maxBatches:", maxBatches);
    console.log("  - totalBatches:", totalBatches);

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
// Debugging
    console.log("🎯 Smithsonian Final Results:", allItemsWithImages.length, "items");

    return {
      total: totalResults,
      items: allItemsWithImages,
    };
  } catch (error) {
    throw error;
  }
}

// ================ UTILS ================

const isSourceSupported = (source) => {
  return supportedSources.includes(source);
};

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

    // Debugging
        console.log(`📦 Batch ${batchNum + 1}: offset=${offset}, got ${adaptedBatch.items?.length || 0} items`);


    return adaptedBatch.items || [];
  } catch (error) {
        console.log(`❌ Batch ${batchNum + 1} failed:`, error.message);

    return [];
  }
}