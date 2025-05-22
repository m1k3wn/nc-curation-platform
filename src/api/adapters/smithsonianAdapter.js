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

// Import museum code mappings
import { getMuseumName } from "./smithsonianMuseumCodes";

/**
 * Adapt search results from Smithsonian API to common format
 *
 * @param {Object} apiData - Raw API response
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @returns {Object} - Adapted search results
 */
export const adaptSmithsonianSearchResults = (
  apiData,
  page = 1,
  pageSize = 25
) => {
  if (!apiData || !apiData.response) {
    return { total: 0, items: [], allItems: [] };
  }

  const totalResults = apiData.response.rowCount || 0;
  const items = apiData.response.rows || [];

  // Process items to extract only those with images and in a clean format
  const processedItems = processItems(items);

  return {
    total: totalResults,
    items: processedItems,
    allItems: processedItems, // Initially the same as items
  };
};

/**
 * Adapt single item details from Smithsonian API to common format
 *
 * @param {Object} apiData - Raw API response
 * @returns {Object} - Adapted item details
 */
export const adaptSmithsonianItemDetails = (apiData) => {
  if (!apiData) return null;

  // Store the raw API response
  const rawApiResponse = apiData._rawApiResponse || apiData;

  try {
    // Get the base processed item
    const baseItem = processItemDetails(apiData);

    // Further organize data into clear categories for UI
    const organizedItem = organizeItemForDisplay(baseItem);

    // Add raw API response
    return {
      ...organizedItem,
      _rawApiResponse: rawApiResponse,
    };
  } catch (error) {
    console.error("Error adapting item details:", error.message);

    // Fall back to the basic processed item if organization fails
    try {
      const processedItem = processItemDetails(apiData);
      return {
        ...processedItem,
        _rawApiResponse: rawApiResponse,
      };
    } catch (fallbackError) {
      console.error("Error in fallback processing:", fallbackError.message);

      // Return a minimal valid object as last resort
      return {
        id: apiData.id || "unknown",
        title: apiData.title || "Unknown Item",
        rawData: apiData.response || apiData,
        _rawApiResponse: rawApiResponse,
      };
    }
  }
};

/* ----------------------- HELPER FUNCTIONS ----------------------- */

/**
 * Clean HTML tags from text
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanHtmlTags(text) {
  if (!text) return "";

  try {
    // Convert to string
    const str = String(text);

    // Remove common HTML tags: <I>, </I>, <em>, </em>
    let cleanedText = str.replace(/<\/?[^>]+(>|$)/g, "");

    // Handle parentheses that might remain after tag removal
    cleanedText = cleanedText.replace(/\(\s*\)/g, ""); // Empty parentheses
    cleanedText = cleanedText.replace(/^\s*\((.*)\)\s*$/, "$1"); // Text entirely in parentheses

    // Trim excess whitespace
    return cleanedText.trim();
  } catch {
    return String(text || "");
  }
}

/**
 * Format dates for display
 * @param {string} dateStr - Raw date string
 * @returns {string} - Formatted date
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return "";
  const dateString = String(dateStr);

  // Extract date ranges for decades
  if (dateString.includes("s")) {
    const decadePattern = /\d+s/g;
    const decades = dateString.match(decadePattern);

    // If multiple decades, show range
    if (decades && decades.length > 1) {
      return `${decades[0]}–${decades[decades.length - 1]}`;
    }
  }

  // Truncate long dates
  if (dateString.length > 12) {
    return dateString.substring(0, 12) + "...";
  }
  return dateString;
}

/**
 * Process items from search results and extract only those with images
 * @param {Array} items - Raw item array from search results
 * @returns {Array} - Processed items with consistent structure
 */
function processItems(items) {
  if (!items || !Array.isArray(items)) return [];

  return items
    .map((item) => {
      try {
        // Extract image URLs
        const imageData = extractBestImages(item);

        // We prioritize item.id and item.url as they work with the content endpoint
        const id = item.id || item.url || "";

        return {
          id: id,
          recordId: item.content?.descriptiveNonRepeating?.record_ID || "",
          title: cleanHtmlTags(item.title) || "Untitled",
          description:
            cleanHtmlTags(item.content?.descriptiveNonRepeating?.description) ||
            "",
          imageUrl: imageData.fullImage,
          screenImageUrl: imageData.screenImage,
          thumbnailUrl: imageData.thumbnail,
          source: item.unitCode || "Smithsonian", // Code for internal use
          museum: getMuseumName(item.unitCode) || "Smithsonian Institution", // Readable name for display
          datePublished: getDate(item),
          url: item.content?.descriptiveNonRepeating?.record_link || "",
          dataSource: "", // Not available in search results
        };
      } catch {
        // Return minimal data on error
        return {
          id: item.id || "",
          title: item.title || "Untitled Item",
          thumbnailUrl: "", // Will be filtered out due to empty thumbnail
        };
      }
    })
    .filter((item) => item.thumbnailUrl && item.thumbnailUrl.length > 0);
}

/**
 * Extract the best available images from an item
 * @param {Object} item - Item from search results
 * @returns {Object} - Object with fullImage, screenImage, and thumbnail URLs
 */
function extractBestImages(item) {
  let fullImage = "";
  let screenImage = "";
  let thumbnail = "";

  try {
    // Extract image URL from the media content
    const mediaContent =
      item.content?.descriptiveNonRepeating?.online_media?.media;

    if (!mediaContent || mediaContent.length === 0) {
      return { thumbnail, screenImage, fullImage };
    }

    // Use the first media item
    const media = mediaContent[0];

    // For the full resolution image
    if (media.idsId) {
      fullImage = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
    } else if (media.content) {
      fullImage = media.content;
    }

    // Extract different image sizes from resources
    if (media.resources && media.resources.length > 0) {
      // Look for screen image (medium resolution)
      const screenResource = media.resources.find(
        (res) =>
          res.label === "Screen Image" ||
          (res.url && res.url.includes("_screen"))
      );

      if (screenResource && screenResource.url) {
        screenImage = screenResource.url;
      }

      // Look for actual thumbnail resource
      const thumbResource = media.resources.find(
        (res) =>
          res.label === "Thumbnail Image" ||
          (res.url && res.url.includes("_thumb"))
      );

      if (thumbResource && thumbResource.url) {
        thumbnail = thumbResource.url;
      }
    }

    // Fallback: Construct URLs from IDS ID if resources not found
    if (!screenImage && media.idsId) {
      screenImage = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_screen`;
    }

    if (!thumbnail && media.idsId) {
      thumbnail = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_thumb`;
    }

    // Use media.thumbnail if it's different from fullImage and we don't have a proper thumbnail
    if (!thumbnail && media.thumbnail && media.thumbnail !== fullImage) {
      thumbnail = media.thumbnail;
    }

    // Final fallbacks
    if (!screenImage && fullImage) {
      screenImage = fullImage; // Use full image as screen fallback
    }

    if (!thumbnail && screenImage) {
      thumbnail = screenImage; // Use screen as thumbnail fallback
    } else if (!thumbnail && fullImage) {
      thumbnail = fullImage; // Use full image as last resort
    }
  } catch {
    // Silent fail - return empty strings
  }

  return { thumbnail, screenImage, fullImage };
}

/**
 * Extract publication date from item and format for display
 * @param {Object} item - Item from search results
 * @returns {string} - Formatted date or empty string
 */
function getDate(item) {
  try {
    let dateStr = "";

    if (item.content?.indexedStructured?.date) {
      dateStr = Array.isArray(item.content.indexedStructured.date)
        ? item.content.indexedStructured.date[0]
        : item.content.indexedStructured.date;
    }

    return formatDateForDisplay(dateStr);
  } catch {
    return "";
  }
}

/**
 * Process detailed information for a single item
 * @param {Object} rawItemData - Raw item data from API
 * @returns {Object} - Processed item with consistent structure
 */
function processItemDetails(rawItemData) {
  if (!rawItemData) return null;

  try {
    // Extract the item from response
    const data = rawItemData.response || rawItemData;

    // Process image data using the same improved logic
    const imageData = extractBestImages(data);

    // Extract free text fields by label
    const freetext = data.content?.freetext || {};

    // Extract creator information
    const creatorInfo = freetext.name
      ? freetext.name.map((item) => ({
          label: item.label,
          content: item.content,
        }))
      : [];

    // Institution and collection sorting
    const rawSetNames = getFreetextContent(freetext, "setName").map(
      (item) => item.content
    );

    // Extract collection types with error handling
    const collectionTypes = extractCollectionTypes(rawSetNames);

    // Build the processed item
    return {
      // Basic identification
      id: data.id || "",
      title: cleanHtmlTags(
        data.title ||
          data.content?.descriptiveNonRepeating?.title?.content ||
          "Untitled"
      ),
      url: data.content?.descriptiveNonRepeating?.record_link || "",

      // Source information
      source:
        data.unitCode ||
        data.content?.descriptiveNonRepeating?.unit_code ||
        "Smithsonian", // Code for internal use
      museum:
        getMuseumName(
          data.unitCode || data.content?.descriptiveNonRepeating?.unit_code
        ) || "Smithsonian Institution", // Readable name for display
      dataSource:
        getFreetextContent(freetext, "dataSource")?.[0]?.content || "",
      recordId: data.content?.descriptiveNonRepeating?.record_ID || "",

      // Images - now using improved extraction with multiple sizes
      imageUrl: imageData.fullImage || "",
      screenImageUrl: imageData.screenImage || "",
      thumbnailUrl: imageData.thumbnail || "",

      // Dates
      dateCollected:
        formatDateForDisplay(
          getFreetextContent(freetext, "date", "Collection Date")?.[0]
        ) || "",
      datePublished:
        formatDateForDisplay(
          (Array.isArray(data.content?.indexedStructured?.date)
            ? data.content?.indexedStructured?.date[0]
            : data.content?.indexedStructured?.date) ||
            getFreetextContent(freetext, "date")?.[0]?.content
        ) || "",

      // Location information
      place:
        getFreetextContent(freetext, "place")?.[0]?.content ||
        (Array.isArray(data.content?.indexedStructured?.place)
          ? data.content?.indexedStructured?.place.join(", ")
          : data.content?.indexedStructured?.place) ||
        "",
      geoLocation: data.content?.indexedStructured?.geoLocation || null,

      // Maker
      creatorInfo: creatorInfo || [],

      // People and organizations
      collectors: getFreetextContent(freetext, "name", "Collector") || [],
      curatorName: getFreetextContent(freetext, "name", "Curator") || [],
      bioRegion:
        getFreetextContent(freetext, "name", "Biogeographical Region") || [],

      // Collection information
      setNames: rawSetNames || [],
      collectionTypes: collectionTypes || [],

      // Identifiers
      identifiers: getFreetextContent(freetext, "identifier") || [],

      // Notes and additional information
      notes: combineNotesByLabel(getFreetextContent(freetext, "notes")) || [],

      // Raw data (for debugging)
      rawData: data,
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error("Error processing item details:", error.message);
    }

    // Return minimal information if processing fails
    return {
      id: rawItemData.id || rawItemData.response?.id || "",
      title:
        rawItemData.title || rawItemData.response?.title || "Untitled Item",
      rawData: rawItemData.response || rawItemData,
    };
  }
}

/**
 * Get content from a freetext field by label
 * @param {Object} freetext - The freetext object from API response
 * @param {string} field - Field name to extract
 * @param {string|null} label - Optional label to filter by
 * @returns {Array} - Array of content items
 */
function getFreetextContent(freetext, field, label = null) {
  try {
    if (!freetext || !freetext[field]) return [];

    if (label) {
      return freetext[field]
        .filter((item) => item.label === label || item.label.includes(label))
        .map((item) => item.content);
    }

    return freetext[field].map((item) => ({
      label: item.label,
      content: item.content,
    }));
  } catch {
    return [];
  }
}

/**
 * Extract collection types from set names
 * @param {Array} rawSetNames - Array of set names
 * @returns {Array} - Array of collection types
 */
function extractCollectionTypes(rawSetNames) {
  try {
    return rawSetNames.map((str) => {
      if (!str) return "";
      const parts = str.split(",");
      // If there's a comma, return ONLY the first part after the comma
      return parts.length > 1 ? parts[1].trim() : str;
    });
  } catch {
    return [];
  }
}

/**
 * Combine multiple notes with the same label
 * @param {Array} notes - Array of note objects
 * @returns {Array} - Array of combined notes
 */
function combineNotesByLabel(notes) {
  try {
    if (!notes || !Array.isArray(notes) || notes.length === 0) return [];

    // Create an object to group notes by label
    const groupedNotes = {};

    // Group all notes with the same label
    notes.forEach((note) => {
      if (!note || !note.label) return;

      if (!groupedNotes[note.label]) {
        groupedNotes[note.label] = [];
      }

      if (note.content) {
        groupedNotes[note.label].push(note.content);
      }
    });

    // Convert back to array format but combine multiple contents into paragraphs
    return Object.entries(groupedNotes).map(([label, contents]) => ({
      label,
      content: contents.join("\n\n"), // Join with double newlines for paragraph separation
    }));
  } catch {
    return [];
  }
}

/**
 * Organize item data into clear categories for UI display
 * @param {Object} item - Processed item data
 * @returns {Object} - Organized item data for UI
 */
function organizeItemForDisplay(item) {
  if (!item) return null;

  try {
    // Create sections that will be easy to render in the UI
    return {
      // Basic info - always needed
      id: item.id || "",
      title: item.title || "Untitled",
      recordId: item.recordId || item.id || "",

      // Preserve original format keys for backward compatibility
      ...item,

      // Enhanced organized data
      media: {
        primaryImage: item.screenImageUrl || item.imageUrl || "", // Use screen image for main display
        fullImage: item.imageUrl || "", // Keep full-res for zoom
        thumbnail: item.thumbnailUrl || "",
      },

      dates: {
        created: item.dateCreated || "",
        collected: item.dateCollected || "",
        published: item.datePublished || "",
        display: item.dateCollected || item.datePublished || "",
      },

      location: {
        place: item.place || "",
        geoLocation: item.geoLocation || null,
      },

      creators: organizeCreatorInfo(item.creatorInfo),

      collection: {
        name: getMainCollection(item.setNames),
        types: item.collectionTypes || [],
        collectors: formatNameList(item.collectors),
        curatorName: formatNameList(item.curatorName),
        bioRegion: formatNameList(item.bioRegion),
        allCollections: item.setNames || [],
      },

      descriptions: organizeDescriptions(item.notes),

      // Raw data (for debugging)
      rawData: item.rawData || item,
    };
  } catch {
    // Return the original item to avoid breaking the UI
    return item;
  }
}

/**
 * Format a list of names into a comma-separated string
 * @param {Array|string} names - List of names
 * @returns {string} - Formatted name list
 */
function formatNameList(names) {
  try {
    if (!names) return "";
    if (Array.isArray(names) && names.length > 0) {
      return names.join(", ");
    }
    return String(names);
  } catch {
    return "";
  }
}

/**
 * Get the main collection from a list of set names
 * @param {Array} setNames - List of collection set names
 * @returns {string} - Main collection name
 */
function getMainCollection(setNames) {
  try {
    if (!setNames || !Array.isArray(setNames) || setNames.length === 0) {
      return "";
    }

    const collections = [...setNames].sort((a, b) => a.length - b.length);
    return collections[0] || "";
  } catch {
    return "";
  }
}

/**
 * Organize creator information into a structured format
 * @param {Array} creatorInfo - Creator information from the API
 * @returns {Array} - Structured creator information
 */
function organizeCreatorInfo(creatorInfo) {
  try {
    if (
      !creatorInfo ||
      !Array.isArray(creatorInfo) ||
      creatorInfo.length === 0
    ) {
      return [];
    }

    // Group creators by role/label
    const groupedCreators = {};

    creatorInfo.forEach((creator) => {
      if (!creator) return;

      const role = creator.label || "Creator";
      if (!groupedCreators[role]) {
        groupedCreators[role] = [];
      }

      if (creator.content) {
        groupedCreators[role].push(creator.content);
      }
    });

    // Convert back to array format for UI
    return Object.entries(groupedCreators).map(([role, names]) => ({
      role,
      names: Array.isArray(names) ? names : [names],
      displayText: Array.isArray(names) ? names.join(", ") : String(names),
    }));
  } catch {
    return [];
  }
}

/**
 * Organize descriptions into a more UI-friendly format
 * @param {Array} notes - Notes from the API
 * @returns {Array} - Structured descriptions
 */
function organizeDescriptions(notes) {
  try {
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return [];
    }

    // Process notes into a more UI-friendly format
    return notes
      .map((note) => {
        if (!note) return null;

        return {
          title: note.label || "Description",
          content: note.content || "",
          paragraphs: note.content ? note.content.split("\n\n") : [],
        };
      })
      .filter(Boolean); // Remove null entries
  } catch {
    return [];
  }
}
