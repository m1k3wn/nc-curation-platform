const isDevelopment = () => {
  return (
    import.meta.env?.DEV === true ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );
};

import { getMuseumName } from "./smithsonianMuseumCodes";

// ================ MAIN ADAPTER FUNCTIONS ================

/**
 * Adapt search results from Smithsonian Search API
 * @param {Object} apiData - Raw API response from Smithsonian Search API
 * @returns {Object} - Adapted search results for ItemCard
 */
export const adaptSmithsonianSearchResults = (apiData) => {
  if (!apiData || !apiData.response) {
    return { total: 0, items: [] };
  }
  console.log("lands in adapter")

  const totalResults = apiData.response.rowCount || 0;
  const items = apiData.response.rows || [];
  
  const processedItems = items
    .map((item) => {
      try {
        const imageData = extractBestImages(item);
        const id = item.id || item.url || "";

        if (!imageData.thumbnail) {
          return null;
        }

        return {
          id: id,
          title: cleanHtmlTags(item.title) || "Untitled",
          source: "smithsonian",
          museum: getMuseumName(item.unitCode) || "Smithsonian Institution",
          dateCreated: getSearchDate(item),
          media: {
            thumbnail: imageData.thumbnail,
            primaryImage: imageData.screenImage || imageData.fullImage,
            fullImage: imageData.fullImage
          },
          url: item.content?.descriptiveNonRepeating?.record_link || "",
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return {
    total: totalResults,
    items: processedItems,
  };
};

/**
 * Adapt single item details from Smithsonian Record API
 * @param {Object} apiData - Raw API response from Smithsonian Record API
 * @returns {Object} - Adapted item details for SingleItemCard
 */
export const adaptSmithsonianItemDetails = (apiData) => {
  if (!apiData) return null;

  try {
    const data = apiData.response || apiData;
    const imageData = extractBestImages(data);
    const freetext = data.content?.freetext || {};
    const creators = extractCreators(freetext);
    const descriptions = extractDescriptions(freetext);
    const dateCreated = extractItemDate(data, freetext);
    const place = extractPlace(data, freetext);

    return {
      // Basic info
      id: data.id || "",
      title: cleanHtmlTags(
        data.title ||
          data.content?.descriptiveNonRepeating?.title?.content ||
          "Untitled"
      ),
      url: data.content?.descriptiveNonRepeating?.record_link || "",
      source: "smithsonian",
      museum: getMuseumName(
        data.unitCode || data.content?.descriptiveNonRepeating?.unit_code
      ) || "Smithsonian Institution",
      dateCreated,

      media: {
        thumbnail: imageData.thumbnail,
        primaryImage: imageData.screenImage || imageData.fullImage,
        fullImage: imageData.fullImage
      },
      location: { 
        place,
        geoLocation: processGeoLocation(data.content?.indexedStructured?.geoLocation)
      },
      creators,
      descriptions,
      notes: [], // Smithsonian doesn't have concept notes like Europeana

      identifiers: extractIdentifiers(freetext),
      collection: extractCollectionInfo(data, freetext),
    };

  } catch (error) {
    if (isDevelopment()) {
      console.error("Error adapting Smithsonian record:", error);
    }

    return {
      id: apiData.id || apiData.response?.id || "",
      title: apiData.title || apiData.response?.title || "Untitled Item",
      source: "smithsonian",
      museum: "Smithsonian Institution",
      dateCreated: "",
      media: {
        thumbnail: "",
        primaryImage: "",
        fullImage: ""
      },
      location: { place: "", geoLocation: null },
      creators: [],
      descriptions: [],
      notes: [],
      identifiers: [],
      collection: {},
    };
  }
};

// ================ UTILITY FUNCTIONS ================

const cleanHtmlTags = (text) => {
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
};

const formatDateForDisplay = (dateStr) => {
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
};

const extractBestImages = (item) => {
  try {
    const mediaContent = item.content?.descriptiveNonRepeating?.online_media?.media;

    if (!mediaContent || mediaContent.length === 0) {
      return { thumbnail: "", screenImage: "", fullImage: "" };
    }

    const media = mediaContent[0];

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
};

const getSearchDate = (item) => {
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
};

const extractItemDate = (data, freetext) => {
  try {
    if (data.content?.indexedStructured?.date) {
      const dateStr = Array.isArray(data.content.indexedStructured.date)
        ? data.content.indexedStructured.date[0]
        : data.content.indexedStructured.date;
      
      if (dateStr) return formatDateForDisplay(dateStr);
    }

    const freetextDates = getFreetextContent(freetext, "date");
    for (const dateItem of freetextDates) {
      if (dateItem.label && dateItem.content) {
        if (!dateItem.label.toLowerCase().includes('collection')) {
          return formatDateForDisplay(dateItem.content);
        }
      }
    }

    if (freetextDates.length > 0) {
      return formatDateForDisplay(freetextDates[0].content);
    }

    return "";
  } catch {
    return "";
  }
};


const extractPlace = (data, freetext) => {
  try {
    const freetextPlace = getFreetextContent(freetext, "place");
    if (freetextPlace.length > 0) {
      return freetextPlace[0].content || "";
    }
    if (data.content?.indexedStructured?.place) {
      const place = data.content.indexedStructured.place;
      return Array.isArray(place) ? place.join(", ") : place;
    }

    return "";
  } catch {
    return "";
  }
};


const processGeoLocation = (geoLocation) => {
  try {
    if (!geoLocation || !Array.isArray(geoLocation)) return null;

    const places = [];
    const coordinates = [];

    geoLocation.forEach(item => {
      if (item.Other && item.Other.content) {
        places.push(item.Other.content);
      }
      
      if (item.points && item.points.point) {
        const point = item.points.point;
        if (point.latitude && point.longitude) {
          coordinates.push({
            lat: parseFloat(point.latitude.content),
            lng: parseFloat(point.longitude.content)
          });
        }
      }
    });

    const result = {};
    if (places.length > 0) {
      result.places = places;
    }
    if (coordinates.length > 0) {
      result.coordinates = coordinates;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
};

const extractCreators = (freetext) => {
  try {
    const creatorInfo = freetext.name || [];
    
    if (!Array.isArray(creatorInfo) || creatorInfo.length === 0) {
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
};

const extractDescriptions = (freetext) => {
  try {
    if (!freetext || !freetext.notes) return [];

    const descriptiveLabels = [
      "Label",
      "Luce Center Label", 
      "Museum Label",
      "Description",
      "Summary",
      "About",
      "Exhibition Label"
    ];

    const descriptiveNotes = freetext.notes
      .filter((note) => {
        if (!note || !note.label || !note.content) return false;
        return descriptiveLabels.some(label => 
          note.label.includes(label) || label.includes(note.label)
        );
      });

    if (descriptiveNotes.length === 0) return [];

    const allContent = descriptiveNotes.map(note => note.content).join("\n\n");
    const allParagraphs = descriptiveNotes.map(note => note.content).filter(content => content && content.trim());

    return [{
      title: "Description",
      content: allContent,
      paragraphs: allParagraphs,
    }];
  } catch {
    return [];
  }
};


const extractIdentifiers = (freetext) => {
  try {
    return getFreetextContent(freetext, "identifier").map(item => ({
      label: item.label || "Identifier",
      content: item.content,
    }));
  } catch {
    return [];
  }
};


const extractCollectionInfo = (data, freetext) => {
  try {
    const rawSetNames = getFreetextContent(freetext, "setName").map(item => item.content);
    const uniqueSetNames = [...new Set(rawSetNames)];
    
    const collectionTypes = uniqueSetNames
      .filter(name => name && !name.includes("National Museum")) 
      .map((str) => {
        if (!str) return "";
        const parts = str.split(",");
        return parts[0].trim();
      })
      .filter(type => type && type.length > 0);

    const uniqueCollectionTypes = [...new Set(collectionTypes)];

    return {
      name: uniqueSetNames.length > 0 ? uniqueSetNames.sort((a, b) => a.length - b.length)[0] : "",
      types: uniqueCollectionTypes,
      collectors: getFreetextContent(freetext, "name", "Collector").join(", "),
      curatorName: getFreetextContent(freetext, "name", "Curator").join(", "),
      bioRegion: getFreetextContent(freetext, "name", "Biogeographical Region").join(", "),
      allCollections: uniqueSetNames,
    };
  } catch {
    return {};
  }
};

const getFreetextContent = (freetext, field, label = null) => {
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
};