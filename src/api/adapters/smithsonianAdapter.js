const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

import { getMuseumName } from "./smithsonianMuseumCodes";

/**
 * @param {Object} apiData - Raw API response
 * @returns {Object} - Adapted search results
 */
export const adaptSmithsonianSearchResults = (apiData) => {
  if (!apiData || !apiData.response) {
    return { total: 0, items: [] };
  }

  const totalResults = apiData.response.rowCount || 0;
  const items = apiData.response.rows || [];
  const processedItems = processItems(items);

  return {
    total: totalResults,
    items: processedItems,
  };
};

/**
 * @param {Object} apiData - Raw API response
 * @returns {Object} - Adapted item details
 */
export const adaptSmithsonianItemDetails = (apiData) => {
  if (!apiData) return null;

  try {
    const baseItem = processItemDetails(apiData);
    const organisedItem = organiseItemForDisplay(baseItem);

    return organisedItem;
  } catch (error) {
    console.error("Error adapting item details:", error.message);

    try {
      const processedItem = processItemDetails(apiData);
      return processedItem;
    } catch (fallbackError) {
      console.error("Error in fallback processing:", fallbackError.message);

      return {
        id: apiData.id || "unknown",
        title: apiData.title || "Unknown Item",
      };
    }
  }
};

/* ----------------------- HELPER FUNCTIONS ----------------------- */

/**
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanHtmlTags(text) {
  if (!text) return "";

  try {
    const str = String(text);

    let cleanedText = str.replace(/<\/?[^>]+(>|$)/g, "");
    cleanedText = cleanedText.replace(/\(\s*\)/g, "");
    cleanedText = cleanedText.replace(/^\s*\((.*)\)\s*$/, "$1");
    return cleanedText.trim();
  } catch {
    return String(text || "");
  }
}

/**
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
 * Process items from search results and extract those with images
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
 * @param {Object} item - Item from search results
 * @returns {Object} - Object with fullImage, screenImage, and thumbnail URLs
 */
function extractBestImages(item) {
  try {
    const mediaContent =
      item.content?.descriptiveNonRepeating?.online_media?.media;

    if (!mediaContent || mediaContent.length === 0) {
      return { thumbnail: "", screenImage: "", fullImage: "" };
    }

    const media = mediaContent[0];

    // Build URLs from idsId
    if (media.idsId) {
      return {
        fullImage: `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`,
        screenImage: `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_screen`,
        thumbnail: `https://ids.si.edu/ids/deliveryService?id=${media.idsId}_thumb`,
      };
    }

    // Fallback to direct content URLs
    return {
      fullImage: media.content || "",
      screenImage: media.content || "",
      thumbnail: media.thumbnail || media.content || "",
    };
  } catch {
    return { thumbnail: "", screenImage: "", fullImage: "" };
  }
}

/**
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

    // Extract only descriptive notes (not all notes)
    const descriptiveNotes = extractDescriptiveNotes(freetext);

    return {
      id: data.id || "",
      title: cleanHtmlTags(
        data.title ||
          data.content?.descriptiveNonRepeating?.title?.content ||
          "Untitled"
      ),
      description:
        cleanHtmlTags(data.content?.descriptiveNonRepeating?.description) || "",
      url: data.content?.descriptiveNonRepeating?.record_link || "",
      source: "smithsonian",
      museum:
        getMuseumName(
          data.unitCode || data.content?.descriptiveNonRepeating?.unit_code
        ) || "Smithsonian Institution",
      recordId: data.id || "",

      imageUrl: imageData.fullImage || "",
      screenImageUrl: imageData.screenImage || "",
      thumbnailUrl: imageData.thumbnail || "",

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

      place:
        getFreetextContent(freetext, "place")?.[0]?.content ||
        (Array.isArray(data.content?.indexedStructured?.place)
          ? data.content?.indexedStructured?.place.join(", ")
          : data.content?.indexedStructured?.place) ||
        "",
      geoLocation: data.content?.indexedStructured?.geoLocation || null,

      creatorInfo: creatorInfo || [],

      collectors: getFreetextContent(freetext, "name", "Collector") || [],
      curatorName: getFreetextContent(freetext, "name", "Curator") || [],
      bioRegion:
        getFreetextContent(freetext, "name", "Biogeographical Region") || [],

      setNames: rawSetNames || [],
      collectionTypes: collectionTypes || [],

      identifiers: getFreetextContent(freetext, "identifier") || [],

      // Include only descriptive notes for descriptions
      notes: descriptiveNotes || [],
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error("Error processing item details:", error.message);
    }
    return {
      id: rawItemData.id || rawItemData.response?.id || "",
      title:
        rawItemData.title || rawItemData.response?.title || "Untitled Item",
    };
  }
}

/**
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
 * Extract meaningful description content from freetext notes
 * @param {Object} freetext - The freetext object from API response
 * @returns {Array} - Array of filtered description notes
 */
function extractDescriptiveNotes(freetext) {
  try {
    if (!freetext || !freetext.notes) return [];

    // Labels that contain actual descriptive content we want to display
    const descriptiveLabels = [
      "Label",
      "Luce Center Label", 
      "Museum Label",
      "Description",
      "Summary",
      "About",
      "Exhibition Label"
    ];

    return freetext.notes
      .filter((note) => {
        if (!note || !note.label || !note.content) return false;
        return descriptiveLabels.some(label => 
          note.label.includes(label) || label.includes(note.label)
        );
      })
      .map((note) => ({
        label: note.label,
        content: note.content,
      }));
  } catch {
    return [];
  }
}

/**
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
      description: item.description || "",

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