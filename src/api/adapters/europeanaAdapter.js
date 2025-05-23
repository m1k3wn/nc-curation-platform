import { europeanaConfig } from "../config";

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

/**
 * Adapt search results from Europeana API to common format (matching Smithsonian structure)
 *
 * @param {Object} apiData - Raw API response from Europeana Search API
 * @param {number} page - Current page number (optional)
 * @param {number} pageSize - Items per page (optional)
 * @returns {Object} - Adapted search results in consistent format
 */
export const adaptEuropeanaSearchResults = (
  apiData,
  page = 1,
  pageSize = europeanaConfig.defaultPageSize
) => {
  if (!apiData || !apiData.items) {
    return { total: 0, items: [], allItems: [] };
  }

  const totalResults = apiData.totalResults || 0;
  const items = apiData.items || [];

  // Process items to match Smithsonian adapter format
  const processedItems = processSearchItems(items);

  return {
    total: totalResults,
    items: processedItems,
    allItems: processedItems, // Initially the same as items
  };
};

/**
 * Adapt single item details from Europeana Record API to common format
 *
 * @param {Object} apiData - Raw API response from Europeana Record API
 * @returns {Object} - Adapted item details matching Smithsonian structure
 */
export const adaptEuropeanaItemDetails = (apiData) => {
  if (!apiData || !apiData.object) {
    return null;
  }

  try {
    const record = apiData.object;

    // Extract basic info
    const id = cleanId(record.about) || "";
    const title = extractRecordTitle(record) || "Untitled";

    // Extract images from aggregations
    const imageData = extractRecordImages(record);

    // Extract creator information
    const creators = extractCreators(record);

    // Extract dates
    const dates = extractRecordDates(record);

    // Extract location info
    const location = extractLocation(record);

    // Extract descriptions
    const descriptions = extractDescriptions(record);

    // Extract collection/provider info
    const museum = extractRecordMuseum(record);
    const collectionInfo = extractCollectionInfo(record);

    // Build the adapted item matching Smithsonian structure
    return {
      // Basic identification
      id: id,
      recordId: record.about || id, // Keep original for reference
      title: title,

      // URLs
      url: extractExternalUrl(record),

      // Source information
      source: "europeana",
      museum: museum,
      dataSource: museum,

      // Images - multiple formats
      imageUrl: imageData.fullImage || "",
      screenImageUrl: imageData.screenImage || imageData.fullImage || "",
      thumbnailUrl: imageData.thumbnail || "",

      // Dates (matching Smithsonian structure)
      dateCollected: "",
      datePublished: dates.published || "",

      // Location
      place: location.place || "",
      geoLocation: location.geoLocation || null,

      // Creator information (original format for backward compatibility)
      creatorInfo: creators.original || [],

      // Collection info
      setNames: collectionInfo.setNames || [],
      collectionTypes: collectionInfo.types || [],
      collectors: [],
      curatorName: [],
      bioRegion: [],

      // Identifiers
      identifiers: extractIdentifiers(record),

      // Notes/descriptions (original format)
      notes: descriptions.notes || [],

      // Enhanced organized structure (matching Smithsonian)
      media: {
        primaryImage: imageData.screenImage || imageData.fullImage || "",
        fullImage: imageData.fullImage || "",
        thumbnail: imageData.thumbnail || "",
      },

      dates: {
        created: dates.created || "",
        collected: "",
        published: dates.published || "",
        display: dates.display || dates.published || "",
      },

      location: {
        place: location.place || "",
        geoLocation: location.geoLocation || null,
      },

      creators: creators.structured || [],

      collection: {
        name: collectionInfo.mainCollection || "",
        types: collectionInfo.types || [],
        collectors: "",
        curatorName: "",
        bioRegion: "",
        allCollections: collectionInfo.setNames || [],
      },

      descriptions: descriptions.structured || [],

      // Raw API response for debugging
      _rawApiResponse: apiData,
    };
  } catch (error) {
    if (isDevelopment()) {
      console.error("Error adapting Europeana record:", error);
    }

    // Return minimal structure on error
    return {
      id: cleanId(apiData.object?.about) || "",
      title: extractRecordTitle(apiData.object) || "Untitled Item",
      source: "europeana",
      museum: "European Institution",
      _rawApiResponse: apiData,
    };
  }
};

/* ----------------------- HELPER FUNCTIONS ----------------------- */

/**
 * Process items from Europeana search results to match Smithsonian format
 * @param {Array} items - Raw item array from Europeana search results
 * @returns {Array} - Processed items with consistent structure for ItemCard
 */
function processSearchItems(items) {
  if (!items || !Array.isArray(items)) return [];

  return items
    .map((item) => {
      try {
        return {
          // Basic identification (required for ItemCard)
          id: cleanId(item.id), // Clean the Europeana ID format
          recordId: item.id, // Keep original for Record API calls
          title: extractTitle(item) || "Untitled",

          // Images (required for ItemCard)
          thumbnailUrl: extractThumbnailUrl(item),
          imageUrl: extractImageUrl(item), // Full-size image
          screenImageUrl: extractImageUrl(item), // Use same for now

          // Institution info (required for ItemCard)
          source: "europeana", // Code for internal use
          museum: extractMuseum(item), // Readable name for display

          // Date info (optional but good to have)
          datePublished: extractDate(item),

          // Description (may not be available in search results)
          description: "", // Not typically in search results

          // URL for external link
          url: item.guid || "",

          // Additional Europeana-specific fields we might want later
          dataSource: "", // Not in search results
          country: extractCountry(item),
          rights: extractRights(item),
        };
      } catch (error) {
        if (isDevelopment()) {
          console.warn("Error processing Europeana item:", error);
        }

        // Return minimal data on error
        return {
          id: item.id || "",
          title: extractTitle(item) || "Untitled Item",
          thumbnailUrl: "",
          source: "europeana",
          museum: "European Institution",
        };
      }
    })
    .filter((item) => item.thumbnailUrl && item.thumbnailUrl.length > 0); // Only items with thumbnails
}

/**
 * Extract and clean the title from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Clean title
 */
function extractTitle(item) {
  try {
    // Handle both search results (title array) and record format (dcTitle)
    if (item.title && Array.isArray(item.title)) {
      return item.title[0] || "";
    }

    if (item.dcTitleLangAware && item.dcTitleLangAware.en) {
      return item.dcTitleLangAware.en[0] || "";
    }

    if (typeof item.title === "string") {
      return item.title;
    }

    return "";
  } catch {
    return "";
  }
}

/**
 * Extract thumbnail URL from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Thumbnail URL
 */
function extractThumbnailUrl(item) {
  try {
    if (item.edmPreview && Array.isArray(item.edmPreview)) {
      return item.edmPreview[0] || "";
    }

    if (typeof item.edmPreview === "string") {
      return item.edmPreview;
    }

    return "";
  } catch {
    return "";
  }
}

/**
 * Extract full image URL from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Full image URL
 */
function extractImageUrl(item) {
  try {
    if (item.edmIsShownBy && Array.isArray(item.edmIsShownBy)) {
      return item.edmIsShownBy[0] || "";
    }

    if (typeof item.edmIsShownBy === "string") {
      return item.edmIsShownBy;
    }

    // Fallback to thumbnail if no full image
    return extractThumbnailUrl(item);
  } catch {
    return "";
  }
}

/**
 * Extract museum/institution name from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Museum name
 */
function extractMuseum(item) {
  try {
    if (item.dataProvider && Array.isArray(item.dataProvider)) {
      return item.dataProvider[0] || "European Institution";
    }

    if (typeof item.dataProvider === "string") {
      return item.dataProvider;
    }

    return "European Institution";
  } catch {
    return "European Institution";
  }
}

/**
 * Extract date from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Formatted date
 */
function extractDate(item) {
  try {
    if (item.year && Array.isArray(item.year)) {
      return item.year[0] || "";
    }

    if (typeof item.year === "string") {
      return item.year;
    }

    return "";
  } catch {
    return "";
  }
}

/**
 * Extract country from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Country name
 */
function extractCountry(item) {
  try {
    if (item.country && Array.isArray(item.country)) {
      return item.country[0] || "";
    }

    if (typeof item.country === "string") {
      return item.country;
    }

    return "";
  } catch {
    return "";
  }
}

/**
 * Extract rights information from Europeana item
 * @param {Object} item - Europeana item
 * @returns {string} - Rights statement
 */
function extractRights(item) {
  try {
    if (item.rights && Array.isArray(item.rights)) {
      return item.rights[0] || "";
    }

    if (typeof item.rights === "string") {
      return item.rights;
    }

    return "";
  } catch {
    return "";
  }
}

/**
 * Clean Europeana ID for use in routing
 * Europeana IDs start with "/" which can cause routing issues
 * @param {string} id - Raw Europeana ID
 * @returns {string} - Cleaned ID
 */
function cleanId(id) {
  if (!id) return "";

  // Remove leading slash and encode for URL safety
  return id.startsWith("/") ? id.substring(1) : id;
}

/* ----------------------- RECORD API HELPER FUNCTIONS ----------------------- */

/**
 * Extract title from detailed record (different structure than search)
 * @param {Object} record - Europeana record object
 * @returns {string} - Title
 */
function extractRecordTitle(record) {
  try {
    // Check proxies for title information
    if (record.proxies && Array.isArray(record.proxies)) {
      for (const proxy of record.proxies) {
        if (proxy.dcTitle) {
          if (proxy.dcTitle.en && Array.isArray(proxy.dcTitle.en)) {
            return proxy.dcTitle.en[0];
          }
          if (proxy.dcTitle.def && Array.isArray(proxy.dcTitle.def)) {
            return proxy.dcTitle.def[0];
          }
          // Handle other language variants
          const titleKeys = Object.keys(proxy.dcTitle);
          if (titleKeys.length > 0) {
            const firstKey = titleKeys[0];
            const titleValue = proxy.dcTitle[firstKey];
            return Array.isArray(titleValue) ? titleValue[0] : titleValue;
          }
        }
      }
    }

    // Fallback to basic title extraction
    return extractTitle(record);
  } catch {
    return "";
  }
}

/**
 * Extract images from record aggregations
 * @param {Object} record - Europeana record object
 * @returns {Object} - Image URLs
 */
function extractRecordImages(record) {
  const images = { fullImage: "", screenImage: "", thumbnail: "" };

  try {
    // Check aggregations for image info
    if (record.aggregations && Array.isArray(record.aggregations)) {
      const aggregation = record.aggregations[0]; // Use first aggregation

      if (aggregation.edmIsShownBy) {
        images.fullImage = Array.isArray(aggregation.edmIsShownBy)
          ? aggregation.edmIsShownBy[0]
          : aggregation.edmIsShownBy;
      }

      if (aggregation.edmObject) {
        images.screenImage = Array.isArray(aggregation.edmObject)
          ? aggregation.edmObject[0]
          : aggregation.edmObject;
      }
    }

    // Check europeanaAggregation for preview
    if (record.europeanaAggregation && record.europeanaAggregation.edmPreview) {
      images.thumbnail = record.europeanaAggregation.edmPreview;
    }

    // Use fullImage as screenImage fallback
    if (!images.screenImage && images.fullImage) {
      images.screenImage = images.fullImage;
    }

    return images;
  } catch {
    return images;
  }
}

/**
 * Extract creator information from record
 * @param {Object} record - Europeana record object
 * @returns {Object} - Creator info in both original and structured format
 */
function extractCreators(record) {
  const creators = { original: [], structured: [] };

  try {
    if (record.proxies && Array.isArray(record.proxies)) {
      for (const proxy of record.proxies) {
        if (proxy.dcCreator) {
          const creatorEntries = Object.entries(proxy.dcCreator);

          creatorEntries.forEach(([lang, values]) => {
            const creatorArray = Array.isArray(values) ? values : [values];

            creatorArray.forEach((creator) => {
              // Original format (for backward compatibility)
              creators.original.push({
                label: "Creator",
                content: creator,
              });

              // Structured format (for new UI)
              creators.structured.push({
                role: "Creator",
                names: [creator],
                displayText: creator,
              });
            });
          });
        }
      }
    }

    return creators;
  } catch {
    return creators;
  }
}

/**
 * Extract date information from record
 * @param {Object} record - Europeana record object
 * @returns {Object} - Date information
 */
function extractRecordDates(record) {
  const dates = { created: "", published: "", display: "" };

  try {
    if (record.proxies && Array.isArray(record.proxies)) {
      for (const proxy of record.proxies) {
        if (proxy.dcDate || proxy.dctermsCreated) {
          const dateSource = proxy.dcDate || proxy.dctermsCreated;

          if (dateSource.def && Array.isArray(dateSource.def)) {
            dates.published = dateSource.def[0];
            dates.display = dateSource.def[0];
          } else if (dateSource.en && Array.isArray(dateSource.en)) {
            dates.published = dateSource.en[0];
            dates.display = dateSource.en[0];
          }
        }
      }
    }

    // Check timespans for more date info
    if (record.timespans && Array.isArray(record.timespans)) {
      const timespan = record.timespans[0];
      if (timespan && timespan.prefLabel) {
        const labelKeys = Object.keys(timespan.prefLabel);
        if (labelKeys.length > 0) {
          const dateValue = timespan.prefLabel[labelKeys[0]];
          if (!dates.published && Array.isArray(dateValue)) {
            dates.published = dateValue[0];
            dates.display = dateValue[0];
          }
        }
      }
    }

    return dates;
  } catch {
    return dates;
  }
}

/**
 * Extract location information from record
 * @param {Object} record - Europeana record object
 * @returns {Object} - Location information
 */
function extractLocation(record) {
  const location = { place: "", geoLocation: null };

  try {
    if (record.proxies && Array.isArray(record.proxies)) {
      for (const proxy of record.proxies) {
        if (proxy.dctermsSpatial) {
          const spatialKeys = Object.keys(proxy.dctermsSpatial);
          if (spatialKeys.length > 0) {
            const spatialValue = proxy.dctermsSpatial[spatialKeys[0]];
            location.place = Array.isArray(spatialValue)
              ? spatialValue[0]
              : spatialValue;
          }
        }

        if (proxy.edmCurrentLocation) {
          const locationKeys = Object.keys(proxy.edmCurrentLocation);
          if (locationKeys.length > 0 && !location.place) {
            const locationValue = proxy.edmCurrentLocation[locationKeys[0]];
            location.place = Array.isArray(locationValue)
              ? locationValue[0]
              : locationValue;
          }
        }
      }
    }

    return location;
  } catch {
    return location;
  }
}

/**
 * Extract descriptions from record
 * @param {Object} record - Europeana record object
 * @returns {Object} - Description information
 */
function extractDescriptions(record) {
  const descriptions = { notes: [], structured: [] };

  try {
    if (record.proxies && Array.isArray(record.proxies)) {
      for (const proxy of record.proxies) {
        if (proxy.dcDescription) {
          const descriptionEntries = Object.entries(proxy.dcDescription);

          descriptionEntries.forEach(([lang, values]) => {
            const descArray = Array.isArray(values) ? values : [values];

            descArray.forEach((desc) => {
              if (desc.trim()) {
                // Original format
                descriptions.notes.push({
                  label: "Description",
                  content: desc,
                });

                // Structured format
                descriptions.structured.push({
                  title: "Description",
                  content: desc,
                  paragraphs: desc.split("\n\n").filter((p) => p.trim()),
                });
              }
            });
          });
        }
      }
    }

    return descriptions;
  } catch {
    return descriptions;
  }
}

/**
 * Extract museum/institution name from detailed record
 * @param {Object} record - Europeana record object
 * @returns {string} - Museum name
 */
function extractRecordMuseum(record) {
  try {
    // Check organizations first
    if (record.organizations && Array.isArray(record.organizations)) {
      for (const org of record.organizations) {
        if (org.prefLabel) {
          const labelKeys = Object.keys(org.prefLabel);
          if (labelKeys.length > 0) {
            const orgName = org.prefLabel[labelKeys[0]];
            return Array.isArray(orgName) ? orgName[0] : orgName;
          }
        }
      }
    }

    // Fallback to aggregation data provider
    if (record.aggregations && Array.isArray(record.aggregations)) {
      const aggregation = record.aggregations[0];
      if (aggregation.edmDataProvider && aggregation.edmDataProvider.def) {
        return Array.isArray(aggregation.edmDataProvider.def)
          ? aggregation.edmDataProvider.def[0]
          : aggregation.edmDataProvider.def;
      }
    }

    return "European Institution";
  } catch {
    return "European Institution";
  }
}

/**
 * Extract collection information from record
 * @param {Object} record - Europeana record object
 * @returns {Object} - Collection information
 */
function extractCollectionInfo(record) {
  const collection = { setNames: [], types: [], mainCollection: "" };

  try {
    if (record.edmDatasetName && Array.isArray(record.edmDatasetName)) {
      collection.setNames = [...record.edmDatasetName];
      collection.mainCollection = record.edmDatasetName[0] || "";
    }

    if (
      record.europeanaCollectionName &&
      Array.isArray(record.europeanaCollectionName)
    ) {
      collection.types = [...record.europeanaCollectionName];
    }

    return collection;
  } catch {
    return collection;
  }
}

/**
 * Extract identifiers from record
 * @param {Object} record - Europeana record object
 * @returns {Array} - Identifier information
 */
function extractIdentifiers(record) {
  const identifiers = [];

  try {
    if (record.proxies && Array.isArray(record.proxies)) {
      for (const proxy of record.proxies) {
        if (proxy.dcIdentifier) {
          const identifierEntries = Object.entries(proxy.dcIdentifier);

          identifierEntries.forEach(([lang, values]) => {
            const idArray = Array.isArray(values) ? values : [values];

            idArray.forEach((identifier) => {
              identifiers.push({
                label: "Identifier",
                content: identifier,
              });
            });
          });
        }
      }
    }

    return identifiers;
  } catch {
    return identifiers;
  }
}

/**
 * Extract external URL from record
 * @param {Object} record - Europeana record object
 * @returns {string} - External URL
 */
function extractExternalUrl(record) {
  try {
    if (
      record.europeanaAggregation &&
      record.europeanaAggregation.edmLandingPage
    ) {
      return record.europeanaAggregation.edmLandingPage;
    }

    if (record.aggregations && Array.isArray(record.aggregations)) {
      const aggregation = record.aggregations[0];
      if (aggregation.edmIsShownAt) {
        return Array.isArray(aggregation.edmIsShownAt)
          ? aggregation.edmIsShownAt[0]
          : aggregation.edmIsShownAt;
      }
    }

    return "";
  } catch {
    return "";
  }
}
