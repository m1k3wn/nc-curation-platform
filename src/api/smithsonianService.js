import axios from "axios";
import { smithsonianConfig } from "./config";

/* 
Environment-aware base URL
  In production: relative URLs (same server)
  In development: local Express server
*/
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

const smithsonianAPI = axios.create({
  baseURL: API_URL,
});

// Check if in development mode
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

//  Fetch search results in async batches
export const searchSmithsonian = async (
  query,
  page = 1,
  pageSize = smithsonianConfig.defaultPageSize,
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

    // Initial API call to get total count of searchable items
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

    // Defined in config.js
    const totalResults = initialResponse.data.response.rowCount;
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

    // Process first batch
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
};

// Fetches and processes a single batch
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
    return [];
  }
}

// Fetch details for a specific item ID -   BASIC VERSION FOR DEV
// Update this in smithsonianService.js
export const getItemDetails = async (id) => {
  try {
    const response = await smithsonianAPI.get(`/api/smithsonian/content/${id}`);

    // Log the raw response for debugging
    if (isDevelopment()) {
      console.log(
        "Raw item details response:",
        JSON.stringify(response.data, null, 2)
      );
    }

    // Process the raw data into our formatted structure
    const processedItem = processItemDetails(response.data);

    // Log the processed item for debugging
    if (isDevelopment()) {
      console.log("Processed item:", processedItem);
    }

    return processedItem;
  } catch (error) {
    console.error("Error fetching item details:", error);
    throw error;
  }
};

// Process detailed SINGLE item data
export function processItemDetails(rawItemData) {
  // If no data, return null
  if (!rawItemData) return null;

  // Extract the item from response
  const data = rawItemData.response || rawItemData;

  /* Processing data points */

  // Process image data
  const mediaContent =
    data.content?.descriptiveNonRepeating?.online_media?.media;
  const imageData =
    mediaContent && mediaContent.length > 0
      ? {
          fullImage: mediaContent[0].content,
          thumbnail: mediaContent[0].thumbnail,
        }
      : { fullImage: "", thumbnail: "" };

  // Extract free text fields by label
  const freetext = data.content?.freetext || {};

  // Get content from a freetext field by label
  const getFreetextContent = (field, label = null) => {
    if (!freetext[field]) return [];

    if (label) {
      return freetext[field]
        .filter((item) => item.label === label || item.label.includes(label))
        .map((item) => item.content);
    }

    return freetext[field].map((item) => ({
      label: item.label,
      content: item.content,
    }));
  };

  // Concatenate multiple description entries
  function combineNotesByLabel(notes) {
    // Create an object to group notes by label
    const groupedNotes = {};

    // Group all notes with the same label
    notes.forEach((note) => {
      if (!groupedNotes[note.label]) {
        groupedNotes[note.label] = [];
      }
      groupedNotes[note.label].push(note.content);
    });

    // Convert back to array format but combine multiple contents into paragraphs
    return Object.entries(groupedNotes).map(([label, contents]) => ({
      label,
      content: contents.join("\n\n"), // Join with double newlines for paragraph separation
    }));
  }

  // Extract creator information
  const creatorInfo = freetext.name
    ? freetext.name.map((item) => ({
        label: item.label,
        content: item.content,
      }))
    : [];

  // Institution and collection sorting
  const rawSetNames = getFreetextContent("setName").map((item) => item.content);
  const collectionTypes = rawSetNames.map((str) => {
    const parts = str.split(",");
    // If there's a comma, return ONLY the first part after the comma
    return parts.length > 1 ? parts[1].trim() : str;
  });

  // Build the processed item
  const processedItem = {
    // Basic identification
    id: data.id,
    title:
      data.title ||
      data.content?.descriptiveNonRepeating?.title?.content ||
      "Untitled",
    url: data.content?.descriptiveNonRepeating?.record_link || "",

    // Source information
    source:
      data.unitCode ||
      data.content?.descriptiveNonRepeating?.unit_code ||
      "Smithsonian",
    dataSource: getFreetextContent("dataSource")?.[0]?.content || "",
    museum: data.unitCode || "Smithsonian",
    recordId: data.content?.descriptiveNonRepeating?.record_ID || "",

    // Images
    imageUrl: imageData.fullImage,
    thumbnailUrl: imageData.thumbnail,

    // Dates
    dateCollected: getFreetextContent("date", "Collection Date")?.[0] || "",
    datePublished:
      data.content?.indexedStructured?.date?.[0] ||
      getFreetextContent("date")?.[0]?.content ||
      "",

    // Location information
    place:
      getFreetextContent("place")?.[0]?.content ||
      data.content?.indexedStructured?.place?.join(", ") ||
      "",
    geoLocation: data.content?.indexedStructured?.geoLocation,

    // Maker
    creatorInfo: creatorInfo,

    // People and organizations
    collectors: getFreetextContent("name", "Collector"),
    curatorName: getFreetextContent("name", "Curator"),
    bioRegion: getFreetextContent("name", "Biogeographical Region"),

    // Collection information
    setNames: rawSetNames,
    collectionTypes: collectionTypes,

    // Identifiers
    identifiers: getFreetextContent("identifier"),

    // Notes and additional information
    notes: combineNotesByLabel(getFreetextContent("notes")),

    // Raw data (for debugging)
    rawData: data,
  };

  return processedItem;
}

/*  HELPER FUNCTIONS */

// Clean HTML tags from text
function cleanHtmlTags(text) {
  if (!text) return "";

  // Convert to string
  const str = String(text);

  // Remove common HTML tags: <I>, </I>, <em>, </em>
  let cleanedText = str.replace(/<\/?[^>]+(>|$)/g, "");

  // Handle parentheses that might remain after tag removal
  cleanedText = cleanedText.replace(/\(\s*\)/g, ""); // Empty parentheses
  cleanedText = cleanedText.replace(/^\s*\((.*)\)\s*$/, "$1"); // Text entirely in parentheses

  // Trim excess whitespace
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
        thumbnailUrl: imageData.thumbnail, // Thumbnail for ItemCard
        source: item.unitCode || "Smithsonian",
        datePublished: getDate(item),
        url: item.content?.descriptiveNonRepeating?.record_link || "",
        museum: item.unitCode || "Smithsonian",
      };
    })
    .filter((item) => item.thumbnailUrl && item.thumbnailUrl.length > 0);
}

// Extract the best available images from item
function extractBestImages(item) {
  let fullImage = "";
  let thumbnail = "";

  // Extract image URL from the media content
  const mediaContent =
    item.content?.descriptiveNonRepeating?.online_media?.media;

  if (!mediaContent || mediaContent.length === 0) {
    return { thumbnail, fullImage };
  }

  // Use the first media item
  const media = mediaContent[0];

  // For the full image
  if (media.idsId) {
    fullImage = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
  } else if (media.content) {
    fullImage = media.content;
  }

  // For the thumbnail, try multiple sources:
  // 1. Dedicated thumbnail URL
  if (media.thumbnail) {
    thumbnail = media.thumbnail;
  }
  // 2. Thumbnail resource in the resources array
  else if (media.resources && media.resources.length > 0) {
    // Look for thumbnail resource
    const thumbResource = media.resources.find(
      (res) =>
        res.label === "Thumbnail Image" ||
        (res.url && res.url.includes("_thumb"))
    );

    if (thumbResource && thumbResource.url) {
      thumbnail = thumbResource.url;
    }
    // 3. Full res image as fallback
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

  // 5. Use full image as fallback for thumbnail
  if (!thumbnail && fullImage) {
    thumbnail = fullImage;
  }

  return { thumbnail, fullImage };
}

// Helper function to get the date
const getDate = (item) => {
  if (item.content?.indexedStructured?.date) {
    return item.content.indexedStructured.date;
  }
  return "";
};
