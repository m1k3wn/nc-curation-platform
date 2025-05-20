// src/api/adapters/smithsonianAdapter.js

// Check if in development mode (for logging)
const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

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

  if (isDevelopment()) {
    console.log(
      `Adapter: Processed ${processedItems.length} items with images`
    );
  }

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
    console.error("Error adapting Smithsonian item details:", error);

    // Fall back to the basic processed item if organization fails
    try {
      const processedItem = processItemDetails(apiData);
      return {
        ...processedItem,
        _rawApiResponse: rawApiResponse,
      };
    } catch (fallbackError) {
      console.error("Error in fallback processing:", fallbackError);

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

/*  HELPER FUNCTIONS */

// Clean HTML tags from text
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
  } catch (error) {
    console.error("Error cleaning HTML tags:", error);
    return String(text || "");
  }
}

// Process items and extract image URLs with thumbnails
// Updated processItems function for smithsonianAdapter.js

function processItems(items) {
  if (!items || !Array.isArray(items)) return [];

  return items
    .map((item) => {
      try {
        // Enhanced image processing logic
        const imageData = extractBestImages(item);

        // IMPORTANT: Based on our testing, we know that item.id and item.url
        // both work with the content endpoint, while record_ID does not.
        // We prioritize item.id and item.url
        const id = item.id || item.url || "";

        return {
          //  Use the ID that works with the content endpoint
          id: id,
          //  Store the record_ID as a separate property for reference
          recordId: item.content?.descriptiveNonRepeating?.record_ID || "",
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
      } catch (error) {
        console.error("Error processing search item:", error);
        // Return at least an ID and title for the item
        return {
          id: item.id || "",
          title: item.title || "Untitled Item",
          thumbnailUrl: "", // Will be filtered out due to empty thumbnail
        };
      }
    })
    .filter((item) => item.thumbnailUrl && item.thumbnailUrl.length > 0);
}

// Extract the best available images from item
function extractBestImages(item) {
  let fullImage = "";
  let thumbnail = "";

  try {
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
  } catch (error) {
    console.error("Error extracting images:", error);
  }

  return { thumbnail, fullImage };
}

// Helper function to get the date
const getDate = (item) => {
  try {
    if (item.content?.indexedStructured?.date) {
      return Array.isArray(item.content.indexedStructured.date)
        ? item.content.indexedStructured.date[0]
        : item.content.indexedStructured.date;
    }
    return "";
  } catch (error) {
    console.error("Error getting date:", error);
    return "";
  }
};

// Process detailed SINGLE item data
function processItemDetails(rawItemData) {
  // If no data, return null
  if (!rawItemData) return null;

  try {
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
      try {
        if (!freetext[field]) return [];

        if (label) {
          return freetext[field]
            .filter(
              (item) => item.label === label || item.label.includes(label)
            )
            .map((item) => item.content);
        }

        return freetext[field].map((item) => ({
          label: item.label,
          content: item.content,
        }));
      } catch (error) {
        console.error(`Error extracting freetext field ${field}:`, error);
        return [];
      }
    };

    // Concatenate multiple description entries
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
      } catch (error) {
        console.error("Error combining notes:", error);
        return [];
      }
    }

    // Extract creator information
    const creatorInfo = freetext.name
      ? freetext.name.map((item) => ({
          label: item.label,
          content: item.content,
        }))
      : [];

    // Institution and collection sorting
    const rawSetNames = getFreetextContent("setName").map(
      (item) => item.content
    );

    // Extract collection types with error handling
    let collectionTypes = [];
    try {
      collectionTypes = rawSetNames.map((str) => {
        if (!str) return "";
        const parts = str.split(",");
        // If there's a comma, return ONLY the first part after the comma
        return parts.length > 1 ? parts[1].trim() : str;
      });
    } catch (error) {
      console.error("Error extracting collection types:", error);
    }

    // Build the processed item
    const processedItem = {
      // Basic identification
      id: data.id || "",
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
      imageUrl: imageData.fullImage || "",
      thumbnailUrl: imageData.thumbnail || "",

      // Dates
      dateCollected: getFreetextContent("date", "Collection Date")?.[0] || "",
      datePublished:
        (Array.isArray(data.content?.indexedStructured?.date)
          ? data.content?.indexedStructured?.date[0]
          : data.content?.indexedStructured?.date) ||
        getFreetextContent("date")?.[0]?.content ||
        "",

      // Location information
      place:
        getFreetextContent("place")?.[0]?.content ||
        (Array.isArray(data.content?.indexedStructured?.place)
          ? data.content?.indexedStructured?.place.join(", ")
          : data.content?.indexedStructured?.place) ||
        "",
      geoLocation: data.content?.indexedStructured?.geoLocation || null,

      // Maker
      creatorInfo: creatorInfo || [],

      // People and organizations
      collectors: getFreetextContent("name", "Collector") || [],
      curatorName: getFreetextContent("name", "Curator") || [],
      bioRegion: getFreetextContent("name", "Biogeographical Region") || [],

      // Collection information
      setNames: rawSetNames || [],
      collectionTypes: collectionTypes || [],

      // Identifiers
      identifiers: getFreetextContent("identifier") || [],

      // Notes and additional information
      notes: combineNotesByLabel(getFreetextContent("notes")) || [],

      // Raw data (for debugging)
      rawData: data,
    };

    return processedItem;
  } catch (error) {
    console.error("Error processing item details:", error);
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
 * Organize item data into clear categories for UI display
 * This moves formatting logic out of the UI component
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
      // This ensures the component will work with either data format
      ...item,

      // Enhanced organized data
      media: {
        primaryImage: item.imageUrl || "",
        thumbnail: item.thumbnailUrl || "",
      },

      source: {
        name: item.source || item.museum || "Smithsonian",
        url: item.url || "",
        dataSource: item.dataSource || "",
        institution: item.museum || item.source || "Smithsonian",
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
        coordinates: formatCoordinates(item.geoLocation),
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

      descriptions: organiseDescriptions(item.notes),

      // Raw data (for debugging)
      rawData: item.rawData || item,
    };
  } catch (error) {
    console.error("Error organizing item for display:", error);
    // Return the original item to avoid breaking the UI
    return item;
  }
}

// Helper functions with better error handling

function formatCoordinates(geoLocation) {
  if (!geoLocation) return null;

  try {
    if (Array.isArray(geoLocation) && geoLocation.length >= 2) {
      return `${geoLocation[0]}, ${geoLocation[1]}`;
    }
  } catch (error) {
    console.error("Error formatting coordinates:", error);
  }

  return null;
}

function formatNameList(names) {
  try {
    if (!names) return "";
    if (Array.isArray(names) && names.length > 0) {
      return names.join(", ");
    }
    return String(names);
  } catch (error) {
    console.error("Error formatting name list:", error);
    return "";
  }
}

function getMainCollection(setNames) {
  try {
    if (!setNames || !Array.isArray(setNames) || setNames.length === 0) {
      return "";
    }

    const collections = [...setNames].sort((a, b) => a.length - b.length);
    return collections[0] || "";
  } catch (error) {
    console.error("Error getting main collection:", error);
    return "";
  }
}

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
  } catch (error) {
    console.error("Error organizing creator info:", error);
    return [];
  }
}

function organiseDescriptions(notes) {
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
  } catch (error) {
    console.error("Error organizing descriptions:", error);
    return [];
  }
}
