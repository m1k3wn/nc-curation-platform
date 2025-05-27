const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

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
  const processedItems = processItems(items);

  return {
    total: totalResults,
    items: processedItems,
    allItems: processedItems, 
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

  try {

    const baseItem = processItemDetails(apiData);
    const organisedItem = organisItemForDisplay(baseItem);

    return organisedItem;
  } catch (error) {
    console.error("Error adapting item details:", error.message);

    // Fall back 
    try {
      const processedItem = processItemDetails(apiData);
      return processedItem;
    } catch (fallbackError) {
      console.error("Error in fallback processing:", fallbackError.message);

      return {
        id: apiData.id || "unknown",
        title: apiData.title || "Unknown Item",
        _rawApiResponse: apiData,
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

    const str = String(text);
    // Remove common HTML tags: <I>, </I>, <em>, </em>
    let cleanedText = str.replace(/<\/?[^>]+(>|$)/g, "");
    // Handle parentheses that might remain after tag removal
    cleanedText = cleanedText.replace(/\(\s*\)/g, "");
    cleanedText = cleanedText.replace(/^\s*\((.*)\)\s*$/, "$1");
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

  if (dateString.includes("s")) {
    const decadePattern = /\d+s/g;
    const decades = dateString.match(decadePattern);

    if (decades && decades.length > 1) {
      return `${decades[0]}–${decades[decades.length - 1]}`;
    }
  }

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
      
        const imageData = extractBestImages(item);
        const id = item.id || item.url || "";

        return {
          id: id,
          recordId: id,
          title: cleanHtmlTags(item.title) || "Untitled",
          description:
            cleanHtmlTags(item.content?.descriptiveNonRepeating?.description) ||
            "",
          imageUrl: imageData.fullImage,
          screenImageUrl: imageData.screenImage,
          thumbnailUrl: imageData.thumbnail,
          source: "smithsonian", 
          museum: getMuseumName(item.unitCode) || "Smithsonian Institution", 
          datePublished: getDate(item),
          url: item.content?.descriptiveNonRepeating?.record_link || "",
          dataSource: "",
        };
      } catch {
        return {
          id: item.id || "",
          title: item.title || "Untitled Item",
          thumbnailUrl: "",
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
    const mediaContent =
      item.content?.descriptiveNonRepeating?.online_media?.media;

    if (!mediaContent || mediaContent.length === 0) {
      return { thumbnail, screenImage, fullImage };
    }
    
    const media = mediaContent[0];

    // For the full res image
    if (media.idsId) {
      fullImage = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
    } else if (media.content) {
      fullImage = media.content;
    }

    // Extract different image sizes from resources
    if (media.resources && media.resources.length > 0) {

      const screenResource = media.resources.find(
        (res) =>
          res.label === "Screen Image" ||
          (res.url && res.url.includes("_screen"))
      );

      if (screenResource && screenResource.url) {
        screenImage = screenResource.url;
      }

      const thumbResource = media.resources.find(
        (res) =>
          res.label === "Thumbnail Image" ||
          (res.url && res.url.includes("_thumb"))
      );

      if (thumbResource && thumbResource.url) {
        thumbnail = thumbResource.url;
      }
    }


    if (!screenImage && media.idsId) {
      screenImage = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_screen`;
    }

    if (!thumbnail && media.idsId) {
      thumbnail = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_thumb`;
    }

    if (!thumbnail && media.thumbnail && media.thumbnail !== fullImage) {
      thumbnail = media.thumbnail;
    }

    if (!screenImage && fullImage) {
      screenImage = fullImage; 
    }

    if (!thumbnail && screenImage) {
      thumbnail = screenImage; 
    } else if (!thumbnail && fullImage) {
      thumbnail = fullImage; 
    }
  } catch {
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

    const data = rawItemData.response || rawItemData;
    const imageData = extractBestImages(data);
    const freetext = data.content?.freetext || {};

    const creatorInfo = freetext.name
      ? freetext.name.map((item) => ({
          label: item.label,
          content: item.content,
        }))
      : [];

    const rawSetNames = getFreetextContent(freetext, "setName").map(
      (item) => item.content
    );

    const collectionTypes = extractCollectionTypes(rawSetNames);

    return {
      id: data.id || "",
      title: cleanHtmlTags(
        data.title ||
          data.content?.descriptiveNonRepeating?.title?.content ||
          "Untitled"
      ),
      url: data.content?.descriptiveNonRepeating?.record_link || "",
      source: "smithsonian", 
      museum:
        getMuseumName(
          data.unitCode || data.content?.descriptiveNonRepeating?.unit_code
        ) || "Smithsonian Institution", 
      dataSource:
        getFreetextContent(freetext, "dataSource")?.[0]?.content || "",
      recordId: data.content?.descriptiveNonRepeating?.record_ID || "",

      // Images
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

      // Location 
      place:
        getFreetextContent(freetext, "place")?.[0]?.content ||
        (Array.isArray(data.content?.indexedStructured?.place)
          ? data.content?.indexedStructured?.place.join(", ")
          : data.content?.indexedStructured?.place) ||
        "",
      geoLocation: data.content?.indexedStructured?.geoLocation || null,

      // Maker
      creatorInfo: creatorInfo || [],

      // People
      collectors: getFreetextContent(freetext, "name", "Collector") || [],
      curatorName: getFreetextContent(freetext, "name", "Curator") || [],
      bioRegion:
        getFreetextContent(freetext, "name", "Biogeographical Region") || [],

      // Collection 
      setNames: rawSetNames || [],
      collectionTypes: collectionTypes || [],

      // Identifiers
      identifiers: getFreetextContent(freetext, "identifier") || [],

      // Notes
      notes: combineNotesByLabel(getFreetextContent(freetext, "notes")) || [],

      // Raw API response (for debugging)
      _rawApiResponse: rawItemData,
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error("Error processing item details:", error.message);
    }
    return {
      id: rawItemData.id || rawItemData.response?.id || "",
      title:
        rawItemData.title || rawItemData.response?.title || "Untitled Item",
      _rawApiResponse: rawItemData,
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

    const groupedNotes = {};
    notes.forEach((note) => {
      if (!note || !note.label) return;

      if (!groupedNotes[note.label]) {
        groupedNotes[note.label] = [];
      }

      if (note.content) {
        groupedNotes[note.label].push(note.content);
      }
    });

    // Convert back to array format in paragraphs
    return Object.entries(groupedNotes).map(([label, contents]) => ({
      label,
      content: contents.join("\n\n"), 
    }));
  } catch {
    return [];
  }
}

/**
 * Organise item data into clear categories for UI display
 * @param {Object} item - Processed item data
 * @returns {Object} - Organised item data for UI
 */
function organiseItemForDisplay(item) {
  if (!item) return null;

  try {
  
    return {
      id: item.id || "",
      title: item.title || "Untitled",
      recordId: item.recordId || item.id || "",

      ...item,

      media: {
        primaryImage: item.screenImageUrl || item.imageUrl || "",
        fullImage: item.imageUrl || "", 
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

      creators: organiseCreatorInfo(item.creatorInfo),

      collection: {
        name: getMainCollection(item.setNames),
        types: item.collectionTypes || [],
        collectors: formatNameList(item.collectors),
        curatorName: formatNameList(item.curatorName),
        bioRegion: formatNameList(item.bioRegion),
        allCollections: item.setNames || [],
      },

      descriptions: organiseDescriptions(item.notes),
    };
  } catch {
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
 * Organise creator information into a structured format
 * @param {Array} creatorInfo - Creator information from the API
 * @returns {Array} - Structured creator information
 */
function organiseCreatorInfo(creatorInfo) {
  try {
    if (
      !creatorInfo ||
      !Array.isArray(creatorInfo) ||
      creatorInfo.length === 0
    ) {
      return [];
    }

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
 * Organise descriptions into a more UI-friendly format
 * @param {Array} notes - Notes from the API
 * @returns {Array} - Structured descriptions
 */
function organiseDescriptions(notes) {
  try {
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return [];
    }


    return notes
      .map((note) => {
        if (!note) return null;

        return {
          title: note.label || "Description",
          content: note.content || "",
          paragraphs: note.content ? note.content.split("\n\n") : [],
        };
      })
      .filter(Boolean); 
  } catch {
    return [];
  }
}
