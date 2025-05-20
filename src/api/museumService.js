import axios from "axios";
import { smithsonianConfig } from "./config";
import * as smithsonianRepository from "./repositories/smithsonianRepository";
import * as smithsonianAdapter from "./adapters/smithsonianAdapter";

// Check if in development mode (for logging)
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
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
  try {
    // Currently only handling Smithsonian, but will expand
    if (source === "smithsonian") {
      return await searchSmithsonian(
        query,
        page,
        pageSize,
        progressCallback,
        completionCallback
      );
    }

    // Add other APIs here in the future

    throw new Error(`Unsupported source: ${source}`);
  } catch (error) {
    console.error(`Error searching ${source}:`, error);
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
  try {
    if (source === "smithsonian") {
      try {
        console.log(`Fetching item details for ID: ${id}`);
        // Get the raw data from repository
        const rawData = await smithsonianRepository.getSmithsonianItemDetails(
          id,
          cancelToken
        );
        console.log(`Got raw data for ID: ${id}`);

        // Keep a copy of the original raw data
        const originalRawData = { ...rawData };

        // Adapt the raw data for display
        const adaptedData =
          smithsonianAdapter.adaptSmithsonianItemDetails(rawData);
        console.log(`Adapted data for ID: ${id}`);

        // Make sure the raw data is preserved
        if (!adaptedData.rawData) {
          adaptedData.rawData = originalRawData;
        }
        if (!adaptedData._rawApiResponse) {
          adaptedData._rawApiResponse = originalRawData;
        }

        return adaptedData;
      } catch (error) {
        // If this is a cancellation, just forward the error
        if (axios.isCancel(error)) {
          throw error;
        }

        console.error(`Error in Smithsonian getItemDetails for ${id}:`, error);

        // Check if we have a meaningful error response
        const errorData = error.response?.data;

        // Create a minimal item with error details
        return {
          id: id,
          title: `Item ${id}`,
          error: error.message,
          // Include raw error data for debugging
          rawData: {
            error: error.message,
            status: error.response?.status,
            data: errorData,
          },
          _rawApiResponse: {
            error: error.message,
            status: error.response?.status,
            data: errorData,
          },
        };
      }
    }

    // Add other APIs here in the future

    throw new Error(`Unsupported source: ${source}`);
  } catch (error) {
    console.error(`Error fetching item details from ${source}:`, error);
    throw error;
  }
};

/**
 * Search Smithsonian API with batch processing
 * (This retains the batch logic from your original smithsonianService.js)
 */
async function searchSmithsonian(
  query,
  page = 1,
  pageSize = smithsonianConfig.defaultPageSize,
  progressCallback = null,
  completionCallback = null
) {
  try {
    if (isDevelopment()) {
      console.log(
        `SearchSmithsonian called with query: "${query}", page: ${page}, pageSize: ${pageSize}`
      );
    }

    // Initial API call to get total count of searchable items
    const initialResponse = await smithsonianRepository.searchSmithsonianItems(
      query,
      0,
      1
    );

    // Check for valid response
    if (!initialResponse?.response?.rowCount) {
      if (isDevelopment()) {
        console.log("No results from API");
      }
      return { total: 0, items: [], allItems: [] };
    }

    // Defined in config.js
    const totalResults = initialResponse.response.rowCount;
    const batchSize = smithsonianConfig.batchSize;
    const totalBatches = Math.ceil(totalResults / batchSize);
    const maxBatches = Math.min(totalBatches, smithsonianConfig.maxBatches);

    // Dev DEBUGGING
    if (isDevelopment()) {
      console.log(`Total results from API: ${totalResults}`);
      console.log(`Will fetch in ${maxBatches} batches of ${batchSize} items`);
    }

    // Update progress
    if (progressCallback) {
      progressCallback({
        current: 0,
        total: maxBatches,
        itemsFound: 0,
        message: `Found ${totalResults} results. Retrieving items with images...`,
      });
    }

    // Fetch the first batch, show initial results to user
    const firstBatchResponse =
      await smithsonianRepository.searchSmithsonianItems(query, 0, batchSize);

    // Process first batch
    let allProcessedItems = [];

    const firstBatchAdapted = smithsonianAdapter.adaptSmithsonianSearchResults(
      firstBatchResponse,
      1,
      batchSize
    );

    if (firstBatchAdapted.items.length > 0) {
      allProcessedItems = [...firstBatchAdapted.items];

      if (isDevelopment()) {
        console.log(
          `First batch found ${firstBatchAdapted.items.length} items with images`
        );
      }

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

    // Check if more batches needed to find items with images
    let needMoreBatches = allProcessedItems.length === 0 && maxBatches > 1;

    // If first batch has no results AND we have more batches,
    // fetch the second batch synchronously before returning
    if (needMoreBatches) {
      try {
        if (isDevelopment()) {
          console.log(
            "First batch had no items with images, trying second batch"
          );
        }

        // Process the second batch synchronously to get quick results
        const secondBatchItems = await fetchAndProcessBatch(
          query,
          batchSize,
          batchSize,
          1, // batchNum
          maxBatches
        );

        if (secondBatchItems.length > 0) {
          allProcessedItems = [...secondBatchItems];

          if (isDevelopment()) {
            console.log(
              `Second batch found ${secondBatchItems.length} items with images`
            );
          }

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
        console.error("Error fetching second batch:", error);
      }
    }

    // For the requested page, prepare results
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageItems = allProcessedItems.slice(startIdx, endIdx);

    // Adjust remaining batches to skip ones already processed
    const firstBatchToProcess = needMoreBatches ? 2 : 1;

    // Fetch remaining batches in parallel
    const remainingBatchPromises = [];

    for (
      let batchNum = firstBatchToProcess;
      batchNum < maxBatches;
      batchNum++
    ) {
      const offset = batchNum * batchSize;

      // Create promise for this batch
      const batchPromise = fetchAndProcessBatch(
        query,
        offset,
        batchSize,
        batchNum,
        maxBatches
      ).then((batchItems) => {
        // Update progress when each batch completes
        if (progressCallback) {
          const updatedItemCount = allProcessedItems.length + batchItems.length;
          progressCallback({
            current: batchNum + 1,
            total: maxBatches,
            itemsFound: updatedItemCount,
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
        let completeItems = [...allProcessedItems];

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
          completionCallback(completeItems, totalResults, query);
        }
      })
      .catch((error) => {
        console.error("Error processing remaining batches:", error);
      });

    // Return the requested page results immediately
    if (isDevelopment()) {
      console.log(
        `Returning from searchSmithsonian: total=${totalResults}, items=${pageItems.length}, allItems=${allProcessedItems.length}`
      );
    }

    return {
      total: totalResults,
      items: pageItems,
      allItems: allProcessedItems, // Initial items; will be extended in background
    };
  } catch (error) {
    console.error("Error searching Smithsonian API:", error);
    throw error;
  }
}

// Helper function for batch processing
async function fetchAndProcessBatch(
  query,
  offset,
  batchSize,
  batchNum,
  totalBatches
) {
  try {
    if (isDevelopment()) {
      console.log(
        `Fetching batch ${batchNum + 1}/${totalBatches} (offset: ${offset})`
      );
    }

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
      if (isDevelopment()) {
        console.log(
          `Batch ${batchNum + 1} found ${
            adaptedBatch.items.length
          } items with images`
        );
      }

      return adaptedBatch.items;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching batch ${batchNum + 1}:`, error);
    return [];
  }
}
