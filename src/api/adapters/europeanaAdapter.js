
// ================ MAIN ADAPTER FUNCTIONS ================

/**
 * Adapt search results from Europeana Search API
 * @param {Object} apiData - Raw API response from Europeana Search API
 * @returns {Object} - Adapted search results for ItemCard
 */
export const adaptEuropeanaSearchResults = (apiData) => {
  if (!apiData || !apiData.items) {
    return { total: 0, items: [] };
  }

  const totalResults = apiData.totalResults || 0;
  const items = apiData.items || [];

  const processedItems = items
    .map((item) => {
      try {
        // Extract thumbnail - skip items without thumbnails ? DEBUG THIS
        const thumbnailUrl = getFirst(item.edmPreview);
        if (!thumbnailUrl || thumbnailUrl.trim() === '') {
          return null;
        }

        return {
          id: cleanId(item.id),
          title: getFirst(item.title) || getMultilingual(item.dcTitleLangAware) || "Untitled",
          source: "europeana",
          museum: getFirst(item.dataProvider) || "European Institution",
          dateCreated: getFirst(item.year) || "",
          media: {
            thumbnail: thumbnailUrl,
            primaryImage: thumbnailUrl,
            fullImage: thumbnailUrl
          },
          country: getFirst(item.country) || "",
        };
      } catch (error) {
        if (isDevelopment()) {
          console.warn("Error processing Europeana search item:", error);
        }
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
 * Adapt single item details from Europeana Record API
 * @param {Object} apiData - Raw API response from Europeana Record API
 * @returns {Object} - Adapted item details for SingleItemCard
 */
export const adaptEuropeanaItemDetails = (apiData) => {
  if (!apiData || !apiData.object) {
    return null;
  }

  try {
    const record = apiData.object;
    const images = extractRecordImages(record);
    const dates = extractRecordDates(record);
    const creators = extractCreators(record);
    const { notes, descriptions } = extractDescriptions(record);
    const place = extractLocation(record);

    return {
      id: cleanId(record.about) || "",
      title: extractRecordTitle(record),
      url: extractExternalUrl(record),
      source: "europeana",
      museum: extractRecordMuseum(record),
      dateCreated: dates.created,

      media: {
        thumbnail: images.thumbnailUrl,
        primaryImage: images.screenImageUrl || images.imageUrl,
        fullImage: images.imageUrl
      },
      location: { place },
      creators,
      notes,
      descriptions,
      identifiers: extractIdentifiers(record),
    };

  } catch (error) {
    if (isDevelopment()) {
      console.error("Error adapting Europeana record:", error);
    }

    return {
      id: cleanId(apiData.object?.about) || "",
      title: extractRecordTitle(apiData.object) || "Untitled Item",
      source: "europeana",
      museum: "European Institution",
      dateCreated: "",
      media: {
        thumbnail: "",
        primaryImage: "",
        fullImage: ""
      },
      location: { place: "" },
      creators: [],
      notes: [],
      descriptions: [],
      identifiers: [],
    };
  }
};

// ================ UTILITY FUNCTIONS ================

/**
 * Safe array access
 */
const getFirst = (value) => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
};


const getMultilingual = (field, preferredLangs = ['en', 'def']) => {
  if (!field || typeof field !== 'object') {
    return getFirst(field);
  }

  for (const lang of preferredLangs) {
    if (field[lang]) {
      const value = getFirst(field[lang]);
      if (value && value.trim()) return value;
    }
  }

  return null;
};


const cleanId = (id) => {
  if (!id || typeof id !== 'string') return '';
  return id.startsWith('/') ? id.substring(1) : id;
};

// ================ RECORD-SPECIFIC EXTRACTORS ================


const extractRecordTitle = (record) => {
  if (record.proxies && Array.isArray(record.proxies)) {
    for (const proxy of record.proxies) {
      if (proxy.dcTitle) {
        const title = getMultilingual(proxy.dcTitle);
        if (title) return title;
      }
    }

    // Fallback to description as title
    for (const proxy of record.proxies) {
      if (proxy.dcDescription) {
        const desc = getMultilingual(proxy.dcDescription);
        if (desc && desc.trim()) {
          return desc.length > 50 ? desc.substring(0, 50) + "..." : desc;
        }
      }
    }
  }

  return "Untitled";
};


const extractRecordImages = (record) => {
  const images = { imageUrl: "", screenImageUrl: "", thumbnailUrl: "" };

  if (record.aggregations && Array.isArray(record.aggregations)) {
    const aggregation = record.aggregations[0];
    if (aggregation) {
      images.imageUrl = getFirst(aggregation.edmIsShownBy) || "";
      images.screenImageUrl = getFirst(aggregation.edmObject) || "";
    }
  }

  if (record.europeanaAggregation && record.europeanaAggregation.edmPreview) {
    images.thumbnailUrl = record.europeanaAggregation.edmPreview;
  }

  if (!images.screenImageUrl && images.imageUrl) {
    images.screenImageUrl = images.imageUrl;
  }

  return images;
};


const extractRecordDates = (record) => {
  let dateStr = "";

  if (record.proxies && Array.isArray(record.proxies)) {
    for (const proxy of record.proxies) {
      if (proxy.dcDate) {
        dateStr = getMultilingual(proxy.dcDate);
        if (dateStr) break;
      }
      if (!dateStr && proxy.dctermsCreated) {
        dateStr = getMultilingual(proxy.dctermsCreated);
        if (dateStr) break;
      }
    }
  }

  if (!dateStr && record.timespans && Array.isArray(record.timespans)) {
    const timespan = record.timespans[0];
    if (timespan && timespan.prefLabel) {
      dateStr = getMultilingual(timespan.prefLabel);
    }
  }

  return {
    created: dateStr || "",
  };
};


const extractCreators = (record) => {
  const creators = [];

  if (record.proxies && Array.isArray(record.proxies)) {
    for (const proxy of record.proxies) {
      if (proxy.dcCreator) {
        const creatorEntries = Object.entries(proxy.dcCreator);
        
        for (const [lang, values] of creatorEntries) {
          if (lang === 'en' || lang === 'def') { 
            const creatorArray = Array.isArray(values) ? values : [values];
            
            for (const creator of creatorArray) {
              if (creator && creator.trim()) {
                creators.push({
                  role: "Creator",
                  names: [creator],      
                  displayText: creator   
                });
              }
            }
          }
        }
      }
    }
  }

  return creators;
};


const extractDescriptions = (record) => {
  const notes = [];         
  const descriptions = [];  

  if (record.proxies && Array.isArray(record.proxies)) {
    for (const proxy of record.proxies) {
      if (proxy.dcDescription && proxy.dcDescription.en) {
        const descArray = Array.isArray(proxy.dcDescription.en) ? proxy.dcDescription.en : [proxy.dcDescription.en];
        
        for (const desc of descArray) {
          if (desc && desc.trim()) {
            descriptions.push({
              title: "Description",   
              content: desc,          
              paragraphs: desc.split("\n\n").filter(p => p.trim())
            });
          }
        }
      }
    }
  }


  if (record.concepts && Array.isArray(record.concepts)) {
    for (const concept of record.concepts) {
      if (concept.note && concept.note.en) {
        const noteArray = Array.isArray(concept.note.en) ? concept.note.en : [concept.note.en];
        
        for (const note of noteArray) {
          if (note && note.trim()) {
            notes.push({
              text: note,
              conceptLabel: getMultilingual(concept.prefLabel) || ""
            });
          }
        }
      }
    }
  }

  return { notes, descriptions };
};


const extractLocation = (record) => {
  let place = "";

  if (record.proxies && Array.isArray(record.proxies)) {
    for (const proxy of record.proxies) {
      if (proxy.dctermsSpatial) {
        place = getMultilingual(proxy.dctermsSpatial);
        if (place) break;
      }
      if (!place && proxy.edmCurrentLocation) {
        place = getMultilingual(proxy.edmCurrentLocation);
        if (place) break;
      }
    }
  }

  return place;
};


const extractRecordMuseum = (record) => {
  if (record.organizations && Array.isArray(record.organizations)) {
    for (const org of record.organizations) {
      if (org.prefLabel) {
        const name = getMultilingual(org.prefLabel);
        if (name) return name;
      }
    }
  }

  if (record.aggregations && Array.isArray(record.aggregations)) {
    const aggregation = record.aggregations[0];
    if (aggregation && aggregation.edmDataProvider) {
      const provider = getMultilingual(aggregation.edmDataProvider);
      if (provider) return provider;
    }
  }

  return "European Institution";
};


const extractIdentifiers = (record) => {
  const identifiers = [];

  if (record.proxies && Array.isArray(record.proxies)) {
    for (const proxy of record.proxies) {
      if (proxy.dcIdentifier) {
        const idEntries = Object.entries(proxy.dcIdentifier);
        
        for (const [lang, values] of idEntries) {
          const idArray = Array.isArray(values) ? values : [values];
          
          for (const identifier of idArray) {
            if (identifier && identifier.trim()) {
              identifiers.push({
                label: "Identifier",
                content: identifier,
              });
            }
          }
        }
      }
    }
  }

  return identifiers;
};


const extractExternalUrl = (record) => {
  if (record.europeanaAggregation && record.europeanaAggregation.edmLandingPage) {
    return record.europeanaAggregation.edmLandingPage;
  }

  if (record.aggregations && Array.isArray(record.aggregations)) {
    const aggregation = record.aggregations[0];
    if (aggregation && aggregation.edmIsShownAt) {
      return getFirst(aggregation.edmIsShownAt);
    }
  }

  return "";
};