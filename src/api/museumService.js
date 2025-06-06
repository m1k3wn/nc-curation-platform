import axios from "axios";
import { smithsonianConfig, europeanaConfig, supportedSources } from "./config";
import * as smithsonianRepository from "./repositories/smithsonianRepository";
import * as smithsonianAdapter from "./adapters/smithsonianAdapter";
import { europeanaRepository } from "./repositories/europeanaRepository";
import { adaptEuropeanaItemDetails, adaptEuropeanaSearchResults } from "./adapters/europeanaAdapter";
import searchResultsManager from "../utils/searchResultsManager";

/**
 * UNIFIED FETCH FUNCTION 
 * Search all museum sources with progressive results
 */
export const searchAllSources = async (query, progressCallback = null) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  const results = {
    items: [],
    totalSmithsonian: 0,
    totalEuropeana: 0,
    errors: [],
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
        query: query, 
        errors: results.errors,
      });
    }
  };

  updateProgress("Searching museum collections...", false);

  // Search Europeana first (faster)
  const europeanaPromise = searchEuropeanaComplete(query)
    .then((europeanaResponse) => {
      if (europeanaResponse.success) {
        results.totalEuropeana = europeanaResponse.data.total || 0;
        
        if (europeanaResponse.data.items?.length > 0) {
          results.items.push(...europeanaResponse.data.items);
          updateProgress(`Found ${results.items.length} results, searching for more...`);
        }
      } else {
        results.errors.push({
          source: 'Europeana',
          error: europeanaResponse.error
        });
        updateProgress("Europeana temporarily unavailable, searching other sources...", false);
      }
      
      return europeanaResponse;
    })
    .catch((error) => {
      results.errors.push({
        source: 'Europeana',
        error: { type: 'unknown', message: 'Europeana search failed unexpectedly' }
      });
      return { success: false, error: { type: 'unknown', message: 'Search failed' } };
    });

  // Search Smithsonian in parallel
  const smithsonianPromise = searchSmithsonianComplete(query, (progress) => {
    if (progress.itemsFound > 0) {
      updateProgress(`Found ${results.items.length + progress.itemsFound} results, searching for more...`);
    }
  })
    .then((smithsonianResponse) => {
      if (smithsonianResponse.success) {
        results.totalSmithsonian = smithsonianResponse.data.total || 0;
        
        if (smithsonianResponse.data.items?.length > 0) {
          results.items.push(...smithsonianResponse.data.items);
        }
      } else {
        results.errors.push({
          source: 'Smithsonian',
          error: smithsonianResponse.error
        });
      }

      return smithsonianResponse;
    })
    .catch((error) => {
      results.errors.push({
        source: 'Smithsonian',
        error: { type: 'unknown', message: 'Smithsonian search failed unexpectedly' }
      });
      return { success: false, error: { type: 'unknown', message: 'Search failed' } };
    });

  // Wait for Europeana
  await europeanaPromise;

  // If we have some results, return: Smithsonian completes in background
  if (results.items.length > 0) {
    smithsonianPromise.then(() => {
      updateProgress(`Search complete: ${results.items.length} results found`);
    });

    return {
      success: true,
      data: {
        total: results.total,
        items: [...results.items],
        errors: results.errors
      },
      smithsonianPromise, 
    };
  }

  // No Europeana results, wait for Smithsonian
  await smithsonianPromise;
  
  // Determine success
  const hasResults = results.items.length > 0;
  const hasErrors = results.errors.length > 0;
  
  updateProgress(`Search complete: ${results.items.length} results found`);
  
  if (!hasResults && hasErrors) {
    // Complete failure
    return {
      success: false,
      error: {
        type: 'api',
        message: 'All museum sources are temporarily unavailable',
        details: results.errors
      }
    };
  }
  
  return {
    success: true,
    data: {
      total: results.total,
      items: results.items,
      errors: results.errors
    }
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
 * Get item details
 */
export const getItemDetails = async (source, id, cancelToken = null) => {
  if (!id) {
    return {
      success: false,
      error: { type: 'validation', message: 'Item ID is required' }
    };
  }

  if (!isSourceSupported(source)) {
    return {
      success: false,
      error: { type: 'validation', message: `Unsupported source: ${source}` }
    };
  }

  try {
    switch (source) {
      case "smithsonian":
        return await getSmithsonianItemDetails(id, cancelToken);
      case "europeana":
        return await getEuropeanaItemDetails(id, cancelToken);
      default:
        return {
          success: false,
          error: { type: 'validation', message: `Source implementation not found: ${source}` }
        };
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      return {
        success: false,
        error: { type: 'cancelled', message: 'Request cancelled' }
      };
    }
    
    return {
      success: false,
      error: { 
        type: 'unknown', 
        message: 'Failed to fetch item details',
        details: error.message 
      }
    };
  }
};

// ================ SINGLE ITEM FETCH ================

async function getSmithsonianItemDetails(id, cancelToken = null) {
  const result = await smithsonianRepository.getSmithsonianItemDetails(id, cancelToken);
  
  if (!result.success) {
    return result;
  }

  try {
    const adaptedData = smithsonianAdapter.adaptSmithsonianItemDetails(result.data);
    adaptedData.rawData = result.data; // debug
    
    return {
      success: true,
      data: adaptedData
    };
  } catch (error) {
    console.error('Error adapting Smithsonian item data:', error);
    return {
      success: false,
      error: { 
        type: 'data', 
        message: 'Item data could not be processed' 
      }
    };
  }
}

async function getEuropeanaItemDetails(id, cancelToken = null) {
  const result = await europeanaRepository.getRecord(id, {
    profile: "rich",
  });
  
  if (!result.success) {
    return result;
  }

  if (!result.data) {
    return {
      success: false,
      error: { type: 'not_found', message: 'Item not found' }
    };
  }

  try {
    const adaptedData = adaptEuropeanaItemDetails(result.data);
    adaptedData.rawData = result.data; // debug
    
    return {
      success: true,
      data: adaptedData
    };
  } catch (error) {
    console.error('Error adapting Europeana item data:', error);
    return {
      success: false,
      error: { 
        type: 'data', 
        message: 'Item data could not be processed' 
      }
    };
  }
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
      
      const result = await europeanaRepository.search(query, searchOptions);
      
      if (!result.success) {
        // Return error for first batch, continue for subsequent batches
        if (batch === 0) {
          return result;
        } else {
          console.warn(`Europeana batch ${batch} failed:`, result.error);
          break;
        }
      }

      if (batch === 0) {
        totalResults = result.data.totalResults || 0;
      }
      
      const adaptedBatch = adaptEuropeanaSearchResults(result.data);
      if (adaptedBatch.items?.length > 0) {
        allItems.push(...adaptedBatch.items);
      }
      
      if ((result.data.itemsCount || 0) < batchSize) {
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

    // Cache results
    if (allItems.length > 0) {
      searchResultsManager.storeResults(query, allItems, totalResults, "europeana");
    }
    
    return {
      success: true,
      data: {
        total: totalResults,
        items: allItems,
      }
    };
  } catch (error) {
    console.error('Europeana search failed:', error);
    return {
      success: false,
      error: { 
        type: 'unknown', 
        message: 'Europeana search failed unexpectedly' 
      }
    };
  }
}

async function searchSmithsonianComplete(query, progressCallback = null) {
  try {
    const initialResult = await smithsonianRepository.searchSmithsonianItems(query, 0, 1);
    
    if (!initialResult.success) {
      return initialResult;
    }

    if (!initialResult.data?.response?.rowCount) {
      return { 
        success: true, 
        data: { total: 0, items: [] } 
      };
    }

    const totalResults = initialResult.data.response.rowCount;
    const batchSize = smithsonianConfig.batchSize;
    const maxBatches = smithsonianConfig.maxBatches; 
    const totalBatches = Math.min(Math.ceil(totalResults / batchSize), maxBatches);

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

    // Cache results
    if (allItemsWithImages.length > 0) {
      searchResultsManager.storeResults(query, allItemsWithImages, totalResults, "smithsonian");
    }
    
    return {
      success: true,
      data: {
        total: totalResults,
        items: allItemsWithImages, 
      }
    };
  } catch (error) {
    console.error('Smithsonian search failed:', error);
    return {
      success: false,
      error: { 
        type: 'unknown', 
        message: 'Smithsonian search failed unexpectedly' 
      }
    };
  }
}

// ================ UTILS ================

const isSourceSupported = (source) => {
  return supportedSources.includes(source);
};

async function fetchBatch(query, offset, batchSize, batchNum) {
  try {
    const result = await smithsonianRepository.searchSmithsonianItems(
      query,
      offset,
      batchSize
    );

    if (!result.success) {
      console.log(`❌ Batch ${batchNum + 1} failed:`, result.error.message);
      return [];
    }

    const adaptedBatch = smithsonianAdapter.adaptSmithsonianSearchResults(result.data);
    return adaptedBatch.items || [];
  } catch (error) {
    console.log(`❌ Batch ${batchNum + 1} failed:`, error.message);
    return [];
  }
}