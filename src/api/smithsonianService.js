import axios from "axios";

// Environment-aware base URL
// In production: use relative URLs (same server)
// In development: use local Express server
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

const smithsonianAPI = axios.create({
  baseURL: API_URL,
});

// Safely check if we're in development mode
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

export const searchSmithsonian = async (
  query,
  page = 1,
  pageSize = 20,
  progressCallback = null,
  completionCallback = null
) => {
  try {
    if (isDevelopment()) {
      // DEBUGGING
      console.log(
        `SearchSmithsonian called with query: "${query}", page: ${page}, pageSize: ${pageSize}`
      );
      console.log("Searching for:", query);
    }

    // Step 1: initial API call to get total count
    const initialResponse = await smithsonianAPI.get(
      "/api/smithsonian/search",
      {
        params: {
          q: query,
          rows: 1,
          online_media_type: "Images",
        },
      }
    );

    // Check for valid response
    if (!initialResponse.data?.response?.rowCount) {
      if (isDevelopment()) {
        console.log("No results from API");
      }
      return { total: 0, items: [], allItems: [] };
    }

    // Get total results count and calculate batches
    const totalResults = initialResponse.data.response.rowCount;
    const batchSize = 150; // Fetch 150 items per batch for efficiency - can handle 500 +
    const totalBatches = Math.ceil(totalResults / batchSize);

    // Limit to 25 batches maximum (2000 items) to prevent excessive requests
    const maxBatches = Math.min(totalBatches, 25);

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

    // Step 2: Fetch the first batch quickly to show initial results
    const firstBatchResponse = await smithsonianAPI.get(
      "/api/smithsonian/search",
      {
        params: {
          q: query,
          rows: batchSize,
          online_media_type: "Images",
          start: 0,
        },
      }
    );

    // Process the first batch
    let allProcessedItems = [];

    if (
      firstBatchResponse.data?.response?.rows &&
      firstBatchResponse.data.response.rows.length > 0
    ) {
      const firstBatchItems = processItems(
        firstBatchResponse.data.response.rows
      );
      allProcessedItems = [...firstBatchItems];

      if (isDevelopment()) {
        console.log(
          `First batch found ${firstBatchItems.length} items with images`
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

        // Process the second batch synchronously to get at least some results
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

    // Step 3: Fetch remaining batches in parallel
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

    // Process all remaining batches (but don't block the initial return)
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
      allItems: allProcessedItems, // Initial items, will be extended in background
    };
  } catch (error) {
    console.error("Error searching Smithsonian API:", error);
    throw error;
  }
};

/**
 * Fetches and processes a single batch
 */
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

    const batchResponse = await smithsonianAPI.get("/api/smithsonian/search", {
      params: {
        q: query,
        rows: batchSize,
        online_media_type: "Images",
        start: offset,
      },
    });

    if (
      batchResponse.data?.response?.rows &&
      batchResponse.data.response.rows.length > 0
    ) {
      const batchItems = processItems(batchResponse.data.response.rows);

      if (isDevelopment()) {
        console.log(
          `Batch ${batchNum + 1} found ${batchItems.length} items with images`
        );
      }

      return batchItems;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching batch ${batchNum + 1}:`, error);
    return []; // Return empty array on error
  }
}

//  HELPER FUNCTIONS

/**
 * Clean HTML tags from text
 * @param {string} text - Text that might contain HTML tags
 * @returns {string} Cleaned text without HTML tags
 */
function cleanHtmlTags(text) {
  if (!text) return "";

  // Convert to string just in case
  const str = String(text);

  // Remove common HTML tags like <I>, </I>, <em>, </em>, etc.
  let cleanedText = str.replace(/<\/?[^>]+(>|$)/g, "");

  // Also handle parentheses that might remain after tag removal
  // For patterns like "(**text**)" or "(text)" that might be leftover
  cleanedText = cleanedText.replace(/\(\s*\)/g, ""); // Empty parentheses
  cleanedText = cleanedText.replace(/^\s*\((.*)\)\s*$/, "$1"); // Text entirely in parentheses

  // Trim any excess whitespace
  return cleanedText.trim();
}

// Process items and extract image URLs with thumbnails
function processItems(items) {
  return items
    .map((item) => {
      // Enhanced image processing logic
      const imageData = extractBestImages(item);

      return {
        id: item.id,
        title: item.title || "Untitled",
        description:
          cleanHtmlTags(item.content?.descriptiveNonRepeating?.description) ||
          "",
        imageUrl: imageData.fullImage, // Full resolution for detail view
        thumbnailUrl: imageData.thumbnail, // Smaller version for item cards
        source: item.unitCode || "Smithsonian",
        datePublished: getDate(item),
        url: item.content?.descriptiveNonRepeating?.record_link || "",
        museum: item.unitCode || "Smithsonian",
      };
    })
    .filter((item) => item.thumbnailUrl && item.thumbnailUrl.length > 0);
}

/**
 * Extract the best available images from a Smithsonian item
 * @param {Object} item - The raw item from the Smithsonian API
 * @returns {Object} Object containing thumbnail and fullImage URLs
 */
function extractBestImages(item) {
  let fullImage = "";
  let thumbnail = "";

  // Extract image URL from the media content
  const mediaContent =
    item.content?.descriptiveNonRepeating?.online_media?.media;

  if (!mediaContent || mediaContent.length === 0) {
    return { thumbnail, fullImage };
  }

  // Use the first media item (primary image)
  const media = mediaContent[0];

  // For the full image, prioritize:
  // 1. IDS delivery service with the IDS ID
  // 2. Direct content URL
  if (media.idsId) {
    fullImage = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
  } else if (media.content) {
    fullImage = media.content;
  }

  // For the thumbnail, try multiple sources in order of preference:
  // 1. Dedicated thumbnail URL
  if (media.thumbnail) {
    thumbnail = media.thumbnail;
  }
  // 2. Thumbnail resource in the resources array
  else if (media.resources && media.resources.length > 0) {
    // Look for explicit thumbnail resource
    const thumbResource = media.resources.find(
      (res) =>
        res.label === "Thumbnail Image" ||
        (res.url && res.url.includes("_thumb"))
    );

    if (thumbResource && thumbResource.url) {
      thumbnail = thumbResource.url;
    }
    // 3. Screen-sized image as fallback
    else {
      const screenResource = media.resources.find(
        (res) =>
          res.label === "Screen Image" ||
          (res.url && res.url.includes("_screen"))
      );

      if (screenResource && screenResource.url) {
        thumbnail = screenResource.url;
      }
    }
  }

  // 4. Construct thumbnail URL from IDS ID if nothing else is available
  if (!thumbnail && media.idsId) {
    thumbnail = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_thumb`;
  }

  // 5. Use full image as last resort fallback for thumbnail
  if (!thumbnail && fullImage) {
    thumbnail = fullImage;
  }

  return { thumbnail, fullImage };
}

// Get details for a specific item
export const getItemDetails = async (id) => {
  try {
    const response = await smithsonianAPI.get(`/api/smithsonian/content/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching item details:", error);
    throw error;
  }
};

// Helper function to get the date
const getDate = (item) => {
  if (item.content?.indexedStructured?.date) {
    return item.content.indexedStructured.date;
  }
  return "";
};
