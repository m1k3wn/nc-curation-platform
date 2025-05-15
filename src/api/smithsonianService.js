// src/api/smithsonianService.js
import axios from "axios";

// Environment-aware base URL
// In production: use relative URLs (same server)
// In development: use local Express server
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

// Create an axios instance
const smithsonianAPI = axios.create({
  baseURL: API_URL,
});

// test function DEV
// Update the testSmithsonianAPI function
// Simple diagnostic test function
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

// MAIN CODE

// BASTARD
export const searchSmithsonian = async (query, page = 1, pageSize = 10) => {
  try {
    console.log("Searching for:", query);

    // Initial API call to get total count and first batch
    const initialResponse = await smithsonianAPI.get(
      "/api/smithsonian/search",
      {
        params: {
          q: query,
          rows: 100, // Fetch 100 items per request (a reasonable batch size for efficiency)
          online_media_type: "Images", // Filter for items with images
          start: 0, // Start from the beginning
        },
      }
    );

    // Check if we got a valid response
    if (!initialResponse.data?.response?.rowCount) {
      console.log("No results from API");
      return { total: 0, items: [] };
    }

    // Get total results count
    const totalResults = initialResponse.data.response.rowCount;
    console.log(`Total results from API: ${totalResults}`);

    // Process first batch
    let allItems = [];

    if (
      initialResponse.data.response?.rows &&
      initialResponse.data.response.rows.length > 0
    ) {
      const firstBatch = processItems(initialResponse.data.response.rows);
      allItems = [...firstBatch];
      console.log(
        `Processed first batch: ${firstBatch.length} items with images`
      );
    }

    // Calculate how many more requests we need
    const batchSize = 100; // Keep batch size at 100 for efficiency
    const totalBatches = Math.ceil(totalResults / batchSize);
    console.log(`Need to fetch ${totalBatches} batches in total`);

    // Fetch remaining batches (start from 1 since we already fetched the first batch)
    for (let batchNum = 1; batchNum < totalBatches; batchNum++) {
      const offset = batchNum * batchSize;
      console.log(
        `Fetching batch ${batchNum + 1}/${totalBatches} (offset: ${offset})`
      );

      const batchResponse = await smithsonianAPI.get(
        "/api/smithsonian/search",
        {
          params: {
            q: query,
            rows: batchSize,
            online_media_type: "Images",
            start: offset,
          },
        }
      );

      if (
        batchResponse.data?.response?.rows &&
        batchResponse.data.response.rows.length > 0
      ) {
        const batchItems = processItems(batchResponse.data.response.rows);
        allItems = [...allItems, ...batchItems];
        console.log(
          `Batch ${batchNum + 1} added ${
            batchItems.length
          } items with images (total: ${allItems.length})`
        );
      } else {
        console.log(`Batch ${batchNum + 1} returned no items, stopping`);
        break; // Stop if we get an empty batch
      }
    }

    console.log(`Found a total of ${allItems.length} items with usable images`);

    // Paginate the results for this specific page request
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedItems = allItems.slice(startIdx, endIdx);

    return {
      total: allItems.length, // Total count of items WITH images (not total API results)
      items: paginatedItems,
      allItemsCount: allItems.length, // For debugging
    };
  } catch (error) {
    console.error("Error searching Smithsonian API:", error);
    throw error;
  }
};

// Helper function to process items and filter for those with usable images
function processItems(items) {
  const processedItems = items.map((item) => {
    let imageUrl = "";

    // Extract image URL from the media content
    const mediaContent =
      item.content?.descriptiveNonRepeating?.online_media?.media;

    if (mediaContent && mediaContent.length > 0) {
      // First priority: Use idsId if available (most reliable)
      if (mediaContent[0].idsId) {
        imageUrl = `https://ids.si.edu/ids/deliveryService?id=${mediaContent[0].idsId}`;
      }
      // Second priority: Use content URL if it exists
      else if (mediaContent[0].content) {
        imageUrl = mediaContent[0].content;

        // Ensure it uses the deliveryService endpoint
        if (!imageUrl.includes("deliveryService")) {
          // Handle various URL formats
          if (imageUrl.includes("id=")) {
            // Extract the ID parameter
            const idMatch = imageUrl.match(/id=([^&]+)/);
            if (idMatch && idMatch[1]) {
              imageUrl = `https://ids.si.edu/ids/deliveryService?id=${idMatch[1]}`;
            }
          } else if (imageUrl.includes("/ids/")) {
            // Try to convert other formats
            imageUrl = imageUrl.replace(
              /\/ids\/[^\/]+\//,
              "/ids/deliveryService?id="
            );
          }
        }
      }
      // Last resort: use thumbnail
      else if (mediaContent[0].thumbnail) {
        imageUrl = mediaContent[0].thumbnail;
      }
    }

    return {
      id: item.id,
      title: item.title || "Untitled",
      description: item.content?.descriptiveNonRepeating?.description || "",
      imageUrl,
      source: item.unitCode || "Smithsonian",
      datePublished: getDate(item),
      url: item.content?.descriptiveNonRepeating?.record_link || "",
      museum: item.unitCode || "Smithsonian",
    };
  });

  // Filter for items that have valid image URLs
  return processedItems.filter(
    (item) => item.imageUrl && item.imageUrl.length > 0
  );
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
