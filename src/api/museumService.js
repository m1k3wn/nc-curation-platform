// src/api/museumService.js
import axios from "axios";
import { smithsonianConfig } from "./config";
import * as smithsonianRepository from "./repositories/smithsonianRepository";
import * as smithsonianAdapter from "./adapters/smithsonianAdapter";

/**
 * Check if application is running in development mode
 * @returns {boolean} True if in development mode
 */
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

/**
 * Supported API sources
 * Add new sources here as they become available
 */
const SUPPORTED_SOURCES = ["smithsonian"];

/**
 * Validates if a source is supported
 * @param {string} source - API source to validate
 * @returns {boolean} - True if source is supported
 */
const isSourceSupported = (source) => {
  return SUPPORTED_SOURCES.includes(source);
};

/**
 * Search for museum items across supported APIs
 *
 * @param {string} source - API source (e.g., 'smithsonian')
 * @param {string} query - Search query
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @param {Function} progressCallback - Callback for search progress
 * @param {Function} completionCallback - Callback for search completion
 * @returns {Promise<Object>} - Search results
 */
export const searchItems = async (
  source = "smithsonian",
  query,
  page = 1,
  pageSize = smithsonianConfig.defaultPageSize,
  progressCallback = null,
  completionCallback = null
) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  if (!isSourceSupported(source)) {
    throw new Error(
      `Unsupported source: ${source}. Supported sources are: ${SUPPORTED_SOURCES.join(
        ", "
      )}`
    );
  }

  try {
    // Route to appropriate source-specific implementation
    switch (source) {
      case "smithsonian":
        return await searchSmithsonian(
          query,
          page,
          pageSize,
          progressCallback,
          completionCallback
        );

      // Add other API cases here as needed
      // case "met":
      //   return await searchMet(query, page, pageSize, progressCallback, completionCallback);

      default:
        // This shouldn't happen due to the isSourceSupported check, but just in case
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
 * Get detailed information for a specific item
 *
 * @param {string} source - API source (e.g., 'smithsonian')
 * @param {string} id - Item ID
 * @param {CancelToken} cancelToken - Optional Axios cancel token
 * @returns {Promise<Object>} - Item details
 */
export const getItemDetails = async (
  source = "smithsonian",
  id,
  cancelToken = null
) => {
  if (!id) {
    throw new Error("Item ID is required");
  }

  if (!isSourceSupported(source)) {
    throw new Error(
      `Unsupported source: ${source}. Supported sources are: ${SUPPORTED_SOURCES.join(
        ", "
      )}`
    );
  }

  try {
    // Route to appropriate source-specific implementation
    switch (source) {
      case "smithsonian":
        return await getSmithsonianItemDetails(id, cancelToken);

      // Add other API cases here as needed
      // case "met":
      //   return await getMetItemDetails(id, cancelToken);

      default:
        // This shouldn't happen due to the isSourceSupported check, but just in case
        throw new Error(`Source implementation not found: ${source}`);
    }
  } catch (error) {
    // Only log non-cancellation errors
    if (!axios.isCancel(error)) {
      if (isDevelopment()) {
        console.error(
          `Error fetching item details from ${source}: ${error.message}`
        );
      }
    }
    throw error;
  }
};

/**
 * Get item details from Smithsonian API
 *
 * @param {string} id - Item ID
 * @param {CancelToken} cancelToken - Optional Axios cancel token
 * @returns {Promise<Object>} - Item details
 */
async function getSmithsonianItemDetails(id, cancelToken = null) {
  try {
    if (isDevelopment()) {
      console.log(`Fetching Smithsonian item details for ID: ${id}`);
    }

    // Get the raw data from repository
    const rawData = await smithsonianRepository.getSmithsonianItemDetails(
      id,
      cancelToken
    );

    // Adapt the raw data for display
    const adaptedData = smithsonianAdapter.adaptSmithsonianItemDetails(rawData);

    // Make sure the raw data is preserved
    if (!adaptedData.rawData) {
      adaptedData.rawData = rawData;
    }
    if (!adaptedData._rawApiResponse) {
      adaptedData._rawApiResponse = rawData;
    }

    return adaptedData;
  } catch (error) {
    // Handle cancellation errors silently
    if (axios.isCancel(error)) {
      if (isDevelopment()) {
        console.log(`Request for Smithsonian item ${id} was cancelled`);
      }
      throw error;
    }

    if (isDevelopment()) {
      console.error(`Error fetching Smithsonian item ${id}: ${error.message}`);
    }

    // Create a minimal item with error details
    return {
      id: id,
      title: `Item ${id}`,
      error: error.message,
      source: "smithsonian",
      // Include raw error data for debugging
      rawData: {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
      _rawApiResponse: {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    };
  }
}

/**
 * Search Smithsonian API with batch processing
 *
 * @param {string} query - Search query
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @param {Function} progressCallback - Callback for search progress
 * @param {Function} completionCallback - Callback for search completion
 * @returns {Promise<Object>} - Search results
 */
async function searchSmithsonian(
  query,
  page = 1,
  pageSize = smithsonianConfig.defaultPageSize,
  progressCallback = null,
  completionCallback = null
) {
  try {
    //  Dev debug logs
    // if (isDevelopment()) {
    //   console.log(
    //     `Searching Smithsonian: "${query}", page=${page}, pageSize=${pageSize}`
    //   );
    // }

    // Initial API call to get total count of searchable items
    const initialResponse = await smithsonianRepository.searchSmithsonianItems(
      query,
      0,
      1
    );

    // Check for valid response
    if (!initialResponse?.response?.rowCount) {
      return { total: 0, items: [], allItems: [] };
    }

    // Get configuration values
    const totalResults = initialResponse.response.rowCount;
    const batchSize = smithsonianConfig.batchSize;
    const totalBatches = Math.ceil(totalResults / batchSize);
    const maxBatches = Math.min(totalBatches, smithsonianConfig.maxBatches);

    // Dev logs
    // if (isDevelopment()) {
    //   console.log(
    //     `Found ${totalResults} total results, processing in ${maxBatches} batches`
    //   );
    // }

    // Initialize progress
    if (progressCallback) {
      progressCallback({
        current: 0,
        total: maxBatches,
        itemsFound: 0,
        message: `Found ${totalResults} results. Retrieving items with images...`,
      });
    }

    // Fetch and process first batch
    const firstBatchResponse =
      await smithsonianRepository.searchSmithsonianItems(query, 0, batchSize);

    const firstBatchAdapted = smithsonianAdapter.adaptSmithsonianSearchResults(
      firstBatchResponse,
      1,
      batchSize
    );

    // Store processed items
    let allProcessedItems = [];

    if (firstBatchAdapted.items.length > 0) {
      allProcessedItems = [...firstBatchAdapted.items];

      // Update progress
      if (progressCallback) {
        progressCallback({
          current: 1,
          total: maxBatches,
          itemsFound: allProcessedItems.length,
          message: `Found ${allProcessedItems.length} items with images so far...`,
        });
      }
    }

    // Check if we need to fetch a second batch immediately
    const needMoreBatches = allProcessedItems.length === 0 && maxBatches > 1;

    // If first batch has no results, fetch second batch synchronously
    if (needMoreBatches) {
      try {
        const secondBatchItems = await fetchSmithsonianBatch(
          query,
          batchSize,
          batchSize,
          1, // batchNum
          maxBatches
        );

        if (secondBatchItems.length > 0) {
          allProcessedItems = [...secondBatchItems];

          // Update progress
          if (progressCallback) {
            progressCallback({
              current: 2,
              total: maxBatches,
              itemsFound: allProcessedItems.length,
              message: `Found ${allProcessedItems.length} items with images so far...`,
            });
          }
        }
      } catch (error) {
        if (isDevelopment()) {
          console.error(`Error fetching second batch: ${error.message}`);
        }
      }
    }

    // Prepare results for the requested page
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageItems = allProcessedItems.slice(startIdx, endIdx);

    // Determine which batches to fetch next
    const firstBatchToProcess = needMoreBatches ? 2 : 1;

    // Fetch remaining batches in parallel
    if (maxBatches > firstBatchToProcess) {
      fetchRemainingSmithsonianBatches(
        query,
        batchSize,
        maxBatches,
        firstBatchToProcess,
        allProcessedItems,
        progressCallback,
        completionCallback
      );
    } else if (completionCallback) {
      // If no more batches to fetch, call completion callback
      completionCallback(allProcessedItems, totalResults, query);
    }

    // Return current results immediately
    return {
      total: totalResults,
      items: pageItems,
      allItems: allProcessedItems,
      source: "smithsonian",
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error searching Smithsonian API: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Fetch remaining batches from Smithsonian API in parallel
 *
 * @param {string} query - Search query
 * @param {number} batchSize - Size of each batch
 * @param {number} maxBatches - Maximum number of batches to process
 * @param {number} startBatchNum - Batch number to start from
 * @param {Array} currentItems - Currently processed items
 * @param {Function} progressCallback - Callback for progress updates
 * @param {Function} completionCallback - Callback for completion
 */
async function fetchRemainingSmithsonianBatches(
  query,
  batchSize,
  maxBatches,
  startBatchNum,
  currentItems,
  progressCallback,
  completionCallback
) {
  const remainingBatchPromises = [];

  // Create promises for all remaining batches
  for (let batchNum = startBatchNum; batchNum < maxBatches; batchNum++) {
    const offset = batchNum * batchSize;

    // Create promise for this batch
    const batchPromise = fetchSmithsonianBatch(
      query,
      offset,
      batchSize,
      batchNum,
      maxBatches
    ).then((batchItems) => {
      // Update progress when each batch completes
      if (progressCallback) {
        progressCallback({
          current: batchNum + 1,
          total: maxBatches,
          itemsFound: currentItems.length + batchItems.length,
          message: `Processing batch ${batchNum + 1}/${maxBatches}...`,
        });
      }
      return batchItems;
    });

    remainingBatchPromises.push(batchPromise);
  }

  // Process all remaining batches
  Promise.all(remainingBatchPromises)
    .then((batchResults) => {
      // Combine all batch results
      let completeItems = [...currentItems];

      batchResults.forEach((batchItems) => {
        completeItems = [...completeItems, ...batchItems];
      });

      if (isDevelopment()) {
        console.log(
          `All batches complete. Found ${completeItems.length} total items with images`
        );
      }

      // Call completion callback with the full results
      if (completionCallback) {
        completionCallback(completeItems, completeItems.length, query);
      }
    })
    .catch((error) => {
      if (isDevelopment()) {
        console.error(`Error processing remaining batches: ${error.message}`);
      }

      // Still call completion callback with partial results
      if (completionCallback) {
        completionCallback(currentItems, currentItems.length, query);
      }
    });
}

/**
 * Fetch and process a single batch from Smithsonian API
 *
 * @param {string} query - Search query
 * @param {number} offset - Starting offset for this batch
 * @param {number} batchSize - Size of the batch
 * @param {number} batchNum - Batch number (zero-based)
 * @param {number} totalBatches - Total number of batches
 * @returns {Promise<Array>} - Processed items from this batch
 */
async function fetchSmithsonianBatch(
  query,
  offset,
  batchSize,
  batchNum,
  totalBatches
) {
  try {
    // Debug dev log
    // if (isDevelopment()) {
    //   console.log(
    //     `Fetching Smithsonian batch ${
    //       batchNum + 1
    //     }/${totalBatches} (offset: ${offset})`
    //   );
    // }

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

    if (adaptedBatch.items.length > 0) {
      //  Dev debug log
      // if (isDevelopment()) {
      //   console.log(
      //     `Batch ${batchNum + 1} found ${
      //       adaptedBatch.items.length
      //     } items with images`
      //   );
      // }
      return adaptedBatch.items;
    }

    return [];
  } catch (error) {
    if (isDevelopment()) {
      console.error(`Error fetching batch ${batchNum + 1}: ${error.message}`);
    }
    return [];
  }
}

// Template for adding a new API source
/*
export const addNewApiSource = () => {
  // 1. Create a repository file (e.g., metRepository.js)
  // 2. Create an adapter file (e.g., metAdapter.js)
  // 3. Add the source to SUPPORTED_SOURCES array above
  // 4. Implement source-specific methods like:
  //    - getMetItemDetails()
  //    - searchMet()
  // 5. Add the source case to switch statements in searchItems() and getItemDetails()
}
*/
