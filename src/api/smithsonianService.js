
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

// test function DEV
export const testSmithsonianAPI = async (query = "painting") => {
  try {
    console.log("Making API request with query:", query);

    // Make basic request with minimal parameters
    const response = await smithsonianAPI.get("/api/smithsonian/search", {
      params: {
        q: query,
        rows: 5,
        online_media_type: "Images",
      },
    });

    console.log("API response received:", response.status);
    console.log("Total results:", response.data.response?.rowCount || 0);

    // Directly examine the raw response structure
    const rows = response.data.response?.rows || [];
    console.log(`Received ${rows.length} rows in response`);

    // Check each item for media
    const itemsWithMedia = [];

    rows.forEach((item, index) => {
      console.log(`\nExamining item ${index + 1}: ${item.title || "Untitled"}`);

      // Output the full content structure for debugging
      console.log("Full item structure:", JSON.stringify(item, null, 2));

      // Try to find media
      const mediaPath = item.content?.descriptiveNonRepeating?.online_media;
      console.log("Media path exists:", !!mediaPath);

      if (mediaPath && mediaPath.media && mediaPath.media.length > 0) {
        console.log("Found media items:", mediaPath.media.length);
        console.log("First media item:", mediaPath.media[0]);

        itemsWithMedia.push({
          index,
          id: item.id,
          title: item.title || "Untitled",
          media: mediaPath.media.map((m) => ({
            type: m.type,
            url: m.content,
            thumbnail: m.thumbnail,
            idsId: m.idsId,
          })),
        });
      } else {
        console.log("No media found in this item");
      }
    });

    return {
      totalResults: response.data.response?.rowCount || 0,
      itemsWithMedia,
    };
  } catch (error) {
    console.error("Error in diagnostic test:", error);
    throw error;
  }
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

    // Step 1: Make initial API call to get total count
    const initialResponse = await smithsonianAPI.get(
      "/api/smithsonian/search",
      {
        params: {
          q: query,
          rows: 1, // Just getting the total count here
          online_media_type: "Images",
        },
      }
    );

    // Check if we got a valid response
    if (!initialResponse.data?.response?.rowCount) {
      if (isDevelopment()) {
        console.log("No results from API");
      }
      return { total: 0, items: [], allItems: [] };
    }

    // Get total results count and calculate batches
    const totalResults = initialResponse.data.response.rowCount;
    const batchSize = 100; // Fetch 100 items per batch for efficiency
    const totalBatches = Math.ceil(totalResults / batchSize);

    // Limit to 20 batches maximum (2000 items) to prevent excessive requests
    const maxBatches = Math.min(totalBatches, 20);

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

    // Check if we need more batches to find items with images
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
          batchSize, // offset for second batch
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

    // Adjust remaining batches to skip the ones we've already processed
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

// Helper function to process items and extract image URLs with thumbnails
function processItems(items) {
  return items
    .map((item) => {
      let imageUrl = ""; // Full image for detail view
      let thumbnailUrl = ""; // Thumbnail for item cards

      // Extract image URL from the media content
      const mediaContent =
        item.content?.descriptiveNonRepeating?.online_media?.media;

      if (mediaContent && mediaContent.length > 0) {
        const media = mediaContent[0];

        // Try to find the best thumbnail

        // 1. Check if there's a dedicated thumbnail URL
        if (media.thumbnail) {
          thumbnailUrl = media.thumbnail;
        }

        // 2. Check for thumbnail in resources array
        if (media.resources && media.resources.length > 0) {
          // Look for explicit thumbnail resource
          const thumbResource = media.resources.find(
            (res) =>
              res.label === "Thumbnail Image" ||
              (res.url && res.url.includes("_thumb"))
          );

          if (thumbResource && thumbResource.url) {
            thumbnailUrl = thumbResource.url;
          }
          // If no thumbnail, try screen-sized image
          else {
            const screenResource = media.resources.find(
              (res) =>
                res.label === "Screen Image" ||
                (res.url && res.url.includes("_screen"))
            );

            if (screenResource && screenResource.url) {
              thumbnailUrl = screenResource.url;
            }
          }
        }

        // 3. Attempt to construct a thumbnail URL if none found
        if (!thumbnailUrl && media.idsId) {
          thumbnailUrl = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_thumb`;
        }

        // 4. Set full image URL for detail view
        if (media.idsId) {
          imageUrl = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
        } else if (media.content) {
          imageUrl = media.content;
        }

        // 5. If no thumbnail was found, use the full image as fallback
        if (!thumbnailUrl) {
          thumbnailUrl = imageUrl;
        }
      }

      return {
        id: item.id,
        title: item.title || "Untitled",
        description: item.content?.descriptiveNonRepeating?.description || "",
        imageUrl, // Full resolution for detail view
        thumbnailUrl, // Smaller version for item cards
        source: item.unitCode || "Smithsonian",
        datePublished: getDate(item),
        url: item.content?.descriptiveNonRepeating?.record_link || "",
        museum: item.unitCode || "Smithsonian",
      };
    })
    .filter((item) => item.thumbnailUrl && item.thumbnailUrl.length > 0);
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
