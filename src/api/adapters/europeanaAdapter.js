import { parseYearForFiltering, categoriseYear } from "../../utils/dateUtils";

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

        const dateCreated = extractSearchDates(item);
        const filterDate = parseYearForFiltering(dateCreated);
        const century = categoriseYear(filterDate);

        return {
          id: cleanId(item.id),
          title: getMultilingual(item.dcTitleLangAware) || getFirst(item.title) || "Untitled",
          source: "europeana",
          museum: getFirst(item.dataProvider) || "European Institution",
          dateCreated,
          filterDate,
          century,
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
    const filterDate = parseYearForFiltering(dates.created);
    const century = categoriseYear(filterDate);

    return {
      id: cleanId(record.about) || "",
      title: extractRecordTitle(record),
      url: extractExternalUrl(record),
      source: "europeana",
      museum: extractRecordMuseum(record),
      dateCreated: dates.created,
      filterDate,
      century,
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
    const basicTitle = extractRecordTitle(apiData.object) || "Untitled Item";
    const basicDateCreated = "";
    const basicFilterDate = parseYearForFiltering(basicDateCreated);
    const basicCentury = categoriseYear(basicFilterDate);

    return {
      id: cleanId(apiData.object?.about) || "",
      title: basicTitle,
      source: "europeana",
      museum: "European Institution",
      dateCreated: basicDateCreated,
      filterDate: basicFilterDate,
      century: basicCentury,
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

const removeDuplicates = (array, keyFn) => {
  const seen = new Set();
  return array.filter(item => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getFirst = (value) => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
};

// extracts languages starting with preferred languages 
const getMultilingual = (languageMap, returnArray = false) => {
  if (!languageMap || typeof languageMap !== 'object') {
    const value = getFirst(languageMap);
    return returnArray ? (value ? [value] : []) : value;
  }

  const preferredLangs = ['en', 'def'];
  const results = [];

  for (const lang of preferredLangs) {
    if (languageMap[lang]) {
      const values = Array.isArray(languageMap[lang]) ? languageMap[lang] : [languageMap[lang]];
      const validValues = values.filter(v => v && v.trim());
      
      if (returnArray) {
        results.push(...validValues);
      } else if (validValues.length > 0) {
        return validValues[0];
      } 
    }
  }

  for (const [lang, values] of Object.entries(languageMap)) {
    if (!preferredLangs.includes(lang)) {
      const valueArray = Array.isArray(values) ? values : [values];
      const validValues = valueArray.filter(v => v && v.trim());
      
      if (returnArray) {
        results.push(...validValues);
      } else if (validValues.length > 0) {
        return validValues[0];
      }
    }
  }

  return returnArray ? results : null;
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

//  For Search API response items
const extractSearchDates = (record) => {
  let dateStr = getFirst(record.year) || 
                getFirst(record.dcDate) || 
                getFirst(record.date) || 
                getFirst(record.edmTimespanLabel);
  
  let year = extractYear(dateStr);
  
  if (!year && record.timestamp_created && 
    //  filter out Unix epoch placeholders
      record.timestamp_created !== "1970-01-01T00:00:00.000Z") {
    const timestampYear = new Date(record.timestamp_created).getFullYear();
    if (timestampYear > 1970) year = `${timestampYear} (digitised)`;
  }
  
  return year || "";
};

//  For Records API response item
const extractRecordDates = (record) => {
  let dateStr = extractFromProxies(record, (proxy) => {
    return safeExtract(proxy, 'dcDate', getMultilingual) ||
           safeExtract(proxy, 'dctermsCreated', getMultilingual) ||
           safeExtract(proxy, 'dctermsIssued', getMultilingual);
  });

  let year = extractYear(dateStr);

  if (!year && record.timespans?.[0]?.prefLabel) {
    year = extractYear(getMultilingual(record.timespans[0].prefLabel));
  }

  if (!year) {
    const title = extractFromProxies(record, (proxy) => {
      return safeExtract(proxy, 'dcTitle', getMultilingual);
    });
    year = extractYear(title);
  }

  if (!year && record.timestamp_created && 
      record.timestamp_created !== "1970-01-01T00:00:00.000Z") {
    const timestampYear = new Date(record.timestamp_created).getFullYear();
    if (timestampYear > 1970) year = `${timestampYear} (digitised)`;
  }

  return { created: year || "" };
};

const extractYear = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("(digitised)")) return dateStr;
  const yearMatch = dateStr.match(/\b\d{4}\b/);
  return yearMatch?.[0] || "";
};

const extractCreators = (record) => {
  const creators = [];

  extractFromProxies(record, (proxy) => {
    if (proxy.dcCreator) {
      const creatorNames = getMultilingual(proxy.dcCreator, true);
      
      creatorNames.forEach(name => {
        if (!isUrlOrMeaningless(name)) {
          creators.push({
            role: "Creator",
            names: [name],
            displayText: name
          });
        }
      });
    }
    return null; 
  });

  return removeDuplicates(creators, creator => `${creator.role}:${creator.displayText}`);
};

const isUrlOrMeaningless = (text) => {
  if (!text || typeof text !== 'string') return true;
    if (text.startsWith('http://') || text.startsWith('https://')) return true;
    if (text.trim().length < 2) return true;
    if (/^\d+$/.test(text.trim())) return true;
  
  return false;
};

const extractDescriptions = (record) => {
  const notes = [];
  
  // Get descriptions using standard "first match wins" pattern
  const descriptions = extractFromProxies(record, (proxy) => {
    if (proxy.dcDescription) {
      const descriptionText = getMultilingual(proxy.dcDescription);
      
      if (descriptionText && descriptionText.trim()) {
        return [{
          title: "Description",
          content: descriptionText,
          paragraphs: descriptionText.split("\n\n").filter(p => p.trim())
        }];
      }
    }
    return null; // Continue to next proxy if no description found
  }) || []; // Default to empty array if no descriptions found

  // Handle notes from concepts (separate from proxy logic)
  if (record.concepts?.length > 0) {
    record.concepts.forEach(concept => {
      if (concept.note) {
        const noteText = getMultilingual(concept.note);
        
        if (noteText && noteText.trim()) {
          notes.push({
            text: noteText,
            conceptLabel: getMultilingual(concept.prefLabel) || ""
          });
        }
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
      const identifierValues = getMultilingual(proxy.dcIdentifier, true); 
      
      identifierValues.forEach(identifier => {
        identifiers.push({
          label: "Identifier",
          content: identifier,
        });
      });
    }
    return null; 
  });

  return removeDuplicates(identifiers, 'content');
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