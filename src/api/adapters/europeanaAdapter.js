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
        const thumbnailUrl = getFirst(item.edmPreview);

        if (!thumbnailUrl || thumbnailUrl.trim() === '') {
          return null;
        }

        return {
          id: cleanId(item.id),
          title: getMultilingual(item.dcTitleLangAware) || getFirst(item.title) || "Untitled",
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

const extractFromProxies = (record, extractorFn) => {
  if (!record.proxies || !Array.isArray(record.proxies)) {
    return null;
  }

  for (const proxy of record.proxies) {
    const result = extractorFn(proxy);
    if (result !== null && result !== undefined) {
      return result;
    }
  }

  return null;
};


const extractLanguageAwareEntries = (field, preferredLangs = ['en', 'def']) => {
  if (!field || typeof field !== 'object') return [];

  const results = [];
  const entries = Object.entries(field);

  for (const [lang, values] of entries) {
    if (preferredLangs.includes(lang)) {
      const valueArray = Array.isArray(values) ? values : [values];
      results.push(...valueArray.filter(v => v && v.trim()));
    }
  }

  return results;
};

const getFirstAggregation = (record) => {
  if (!record.aggregations || !Array.isArray(record.aggregations)) {
    return null;
  }
  return record.aggregations[0];
};


const safeExtract = (obj, field, extractor = getFirst) => {
  if (!obj || !obj[field]) return null;
  return extractor(obj[field]);
};
const extractRecordTitle = (record) => {
  const title = extractFromProxies(record, (proxy) => {
    return safeExtract(proxy, 'dcTitle', getMultilingual);
  });

  if (title) return title;
  const description = extractFromProxies(record, (proxy) => {
    return safeExtract(proxy, 'dcDescription', getMultilingual);
  });

  if (description && description.trim()) {
    return description.length > 50 ? description.substring(0, 50) + "..." : description;
  }

  return "Untitled";
};


const extractRecordImages = (record) => {
  const images = { imageUrl: "", screenImageUrl: "", thumbnailUrl: "" };

  const aggregation = getFirstAggregation(record);
  if (aggregation) {
    images.imageUrl = safeExtract(aggregation, 'edmIsShownBy') || "";
    images.screenImageUrl = safeExtract(aggregation, 'edmObject') || "";
  }

  if (record.europeanaAggregation?.edmPreview) {
    images.thumbnailUrl = record.europeanaAggregation.edmPreview;
  }

  if (!images.screenImageUrl && images.imageUrl) {
    images.screenImageUrl = images.imageUrl;
  }

  return images;
};

const extractRecordDates = (record) => {
  let dateStr = extractFromProxies(record, (proxy) => {
    return safeExtract(proxy, 'dcDate', getMultilingual);
  });

  if (!dateStr) {
    dateStr = extractFromProxies(record, (proxy) => {
      return safeExtract(proxy, 'dctermsCreated', getMultilingual);
    });
  }

  if (!dateStr && record.timespans?.length > 0) {
    const timespan = record.timespans[0];
    if (timespan?.prefLabel) {
      dateStr = getMultilingual(timespan.prefLabel);
    }
  }

  return { created: dateStr || "" };
};


const extractCreators = (record) => {
  const creators = [];

  extractFromProxies(record, (proxy) => {
    if (proxy.dcCreator) {
      const creatorNames = extractLanguageAwareEntries(proxy.dcCreator);
      
      creatorNames.forEach(name => {
        creators.push({
          role: "Creator",
          names: [name],
          displayText: name
        });
      });
    }
    return null; 
  });

  return creators;
};


const extractDescriptions = (record) => {
  const notes = [];
  const descriptions = [];

  extractFromProxies(record, (proxy) => {
    if (proxy.dcDescription?.en) {
      const descArray = Array.isArray(proxy.dcDescription.en) ? 
        proxy.dcDescription.en : [proxy.dcDescription.en];
      
      descArray.forEach(desc => {
        if (desc && desc.trim()) {
          descriptions.push({
            title: "Description",
            content: desc,
            paragraphs: desc.split("\n\n").filter(p => p.trim())
          });
        }
      });
    }
    return null; 
  });

  if (record.concepts?.length > 0) {
    record.concepts.forEach(concept => {
      if (concept.note?.en) {
        const noteArray = Array.isArray(concept.note.en) ? 
          concept.note.en : [concept.note.en];
        
        noteArray.forEach(note => {
          if (note && note.trim()) {
            notes.push({
              text: note,
              conceptLabel: getMultilingual(concept.prefLabel) || ""
            });
          }
        });
      }
    });
  }

  return { notes, descriptions };
};


const extractLocation = (record) => {
  let place = extractFromProxies(record, (proxy) => {
    return safeExtract(proxy, 'dctermsSpatial', getMultilingual);
  });

  if (!place) {
    place = extractFromProxies(record, (proxy) => {
      return safeExtract(proxy, 'edmCurrentLocation', getMultilingual);
    });
  }

  return place || "";
};


const extractRecordMuseum = (record) => {
  if (record.organizations?.length > 0) {
    for (const org of record.organizations) {
      if (org.prefLabel) {
        const name = getMultilingual(org.prefLabel);
        if (name) return name;
      }
    }
  }

  const aggregation = getFirstAggregation(record);
  if (aggregation?.edmDataProvider) {
    const provider = getMultilingual(aggregation.edmDataProvider);
    if (provider) return provider;
  }

  return "European Institution";
};


const extractIdentifiers = (record) => {
  const identifiers = [];

  extractFromProxies(record, (proxy) => {
    if (proxy.dcIdentifier) {
      const identifierValues = extractLanguageAwareEntries(proxy.dcIdentifier);
      
      identifierValues.forEach(identifier => {
        identifiers.push({
          label: "Identifier",
          content: identifier,
        });
      });
    }
    return null; 
  });

  return identifiers;
};


const extractExternalUrl = (record) => {
  if (record.europeanaAggregation?.edmLandingPage) {
    return record.europeanaAggregation.edmLandingPage;
  }

  const aggregation = getFirstAggregation(record);
  if (aggregation?.edmIsShownAt) {
    return getFirst(aggregation.edmIsShownAt);
  }

  return "";
};
