/**
 * Parse year from dateCreated string
 * @param {string} dateCreated - Date string from item
 * @returns {number|null} - Parsed year as integer (negative for BCE), or null if no valid year found
 */
export const parseYearForFiltering = (dateCreated) => {
  if (!dateCreated || typeof dateCreated !== 'string') return null;
  
  const dateStr = dateCreated.trim();
  
  // Handle BCE dates: "900 BCE" or "BCE 900"
  const bceMatch = dateStr.match(/(?:BCE\s+(\d+)|(\d+)\s+BCE)/i);
  if (bceMatch) {
    const year = parseInt(bceMatch[1] || bceMatch[2]);
    return year ? -year : null;
  }
  
  // Handle BC dates: "900 BC" or "BC 900"  
  const bcMatch = dateStr.match(/(?:BC\s+(\d+)|(\d+)\s+BC)/i);
  if (bcMatch) {
    const year = parseInt(bcMatch[1] || bcMatch[2]);
    return year ? -year : null;
  }
  
  // Handle CE dates: "200 CE" or "CE 200" 
  const ceMatch = dateStr.match(/(?:CE\s+(\d+)|(\d+)\s+CE)/i);
  if (ceMatch) {
    const year = parseInt(ceMatch[1] || ceMatch[2]);
    return year || null;
  }
  
  // Handle century mentions: "15th century" -> 1450 (midpoint)
  const centuryMatch = dateStr.match(/(\d+)(?:st|nd|rd|th)\s+century/i);
  if (centuryMatch) {
    const century = parseInt(centuryMatch[1]);
    return (century - 1) * 100 + 50; // midpoint of century
  }
  
  // Handle ranges with BC: "4000-2500BC" -> calculate midpoint and make negative
  const bcRangeMatch = dateStr.match(/(\d+)(?:s)?[-–—](\d+)(?:s)?\s*BC/i);
  if (bcRangeMatch) {
    const start = parseInt(bcRangeMatch[1]);
    const end = parseInt(bcRangeMatch[2]);
    return -Math.round((start + end) / 2);
  }
  
  // Handle ranges: "1850s–1900s" or "1850-1900" -> calculate midpoint
  const rangeMatch = dateStr.match(/(\d+)(?:s)?[-–—](\d+)(?:s)?/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    return Math.round((start + end) / 2);
  }
  
  // Handle decades: "1890s" -> 1890
  const decadeMatch = dateStr.match(/(\d+)s/);
  if (decadeMatch) {
    return parseInt(decadeMatch[1]);
  }
  
  // Handle approximations: "c. 1920" or "ca. 1920" -> 1920
  const approxMatch = dateStr.match(/(?:c\.?\s*|ca\.?\s*|circa\s+)(\d+)/i);
  if (approxMatch) {
    return parseInt(approxMatch[1]);
  }
  
  // Handle years with leading zeros: "0200" -> 200
  const paddedYearMatch = dateStr.match(/\b0*(\d{1,4})\b/);
  if (paddedYearMatch) {
    const year = parseInt(paddedYearMatch[1]);
    // Only accept if it's a reasonable year (1-3000)
    if (year >= 1 && year <= 3000) {
      return year;
    }
  }
  
  // Standard 4-digit year: "1890"
  const yearMatch = dateStr.match(/\b\d{4}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  
  // 3-digit year: "200" (but not if it's part of a larger number)
  const shortYearMatch = dateStr.match(/\b(\d{3})\b/);
  if (shortYearMatch) {
    const year = parseInt(shortYearMatch[1]);
    // Only accept if it's a reasonable early year (100-999)
    if (year >= 100 && year <= 999) {
      return year;
    }
  }
  
  return null;
};

/**
 * Format display date from filterDate
 * @param {number} filterDate - Numeric year (negative for BCE)
 * @returns {string} - Formatted display date
 */
export const formatDisplayDate = (filterDate) => {
  if (!filterDate && filterDate !== 0) return "";
  
  // Handle BCE dates (negative numbers)
  if (filterDate < 0) {
    return `${Math.abs(filterDate)} BCE`;
  }
  
  // Handle early CE dates (1-999) 
  if (filterDate >= 1 && filterDate <= 999) {
    return `${filterDate} CE`;
  }
  
  // Modern dates don't need CE suffix
  return filterDate.toString();
};

/**
 * Categorise year into century periods
 * @param {number} year - Year as integer (negative for BCE)
 * @returns {string} - Century category
 */
export const categoriseYear = (year) => {
  if (!year || typeof year !== 'number') return 'unknown';
  
  // BCE dates (negative years)
  if (year < 0) return 'ancient';
  
  // CE dates
  if (year >= 1 && year <= 99) return '1st';
  if (year >= 100 && year <= 199) return '2nd';
  if (year >= 200 && year <= 299) return '3rd';
  if (year >= 300 && year <= 399) return '4th';
  if (year >= 400 && year <= 499) return '5th';
  if (year >= 500 && year <= 599) return '6th';
  if (year >= 600 && year <= 699) return '7th';
  if (year >= 700 && year <= 799) return '8th';
  if (year >= 800 && year <= 899) return '9th';
  if (year >= 900 && year <= 999) return '10th';
  if (year >= 1000 && year <= 1099) return '11th';
  if (year >= 1100 && year <= 1199) return '12th';
  if (year >= 1200 && year <= 1299) return '13th';
  if (year >= 1300 && year <= 1399) return '14th';
  if (year >= 1400 && year <= 1499) return '15th';
  if (year >= 1500 && year <= 1599) return '16th';
  if (year >= 1600 && year <= 1699) return '17th';
  if (year >= 1700 && year <= 1799) return '18th';
  if (year >= 1800 && year <= 1899) return '19th';
  if (year >= 1900 && year <= 1999) return '20th';
  if (year >= 2000) return '21st';
  
  return 'unknown';
};

/**
 * Get label for century category
 * @param {string} category - Century category
 * @returns {string} - Human-readable label
 */
export const getCenturyLabel = (category) => {
  const labels = {
    'all': 'All periods',
    'ancient': 'Ancient (BCE)',
    '1st': '1st Century',
    '2nd': '2nd Century',
    '3rd': '3rd Century',
    '4th': '4th Century',
    '5th': '5th Century',
    '6th': '6th Century',
    '7th': '7th Century',
    '8th': '8th Century',
    '9th': '9th Century',
    '10th': '10th Century',
    '11th': '11th Century',
    '12th': '12th Century',
    '13th': '13th Century',
    '14th': '14th Century',
    '15th': '15th Century',
    '16th': '16th Century',
    '17th': '17th Century',
    '18th': '18th Century',
    '19th': '19th Century',
    '20th': '20th Century',
    '21st': '21st Century',
    'unknown': 'Unknown date'
  };
  
  return labels[category] || category;
};

/**
 * Calculate count of items in each century category
 * @param {Array} items - Array of search result items
 * @returns {Object} - Object with centuries property containing counts
 */
export const calculateCenturyCounts = (items) => {
  const centuries = {
    all: items.length,
    ancient: 0,
    '1st': 0,
    '2nd': 0,
    '3rd': 0,
    '4th': 0,
    '5th': 0,
    '6th': 0,
    '7th': 0,
    '8th': 0,
    '9th': 0,
    '10th': 0,
    '11th': 0,
    '12th': 0,
    '13th': 0,
    '14th': 0,
    '15th': 0,
    '16th': 0,
    '17th': 0,
    '18th': 0,
    '19th': 0,
    '20th': 0,
    '21st': 0,
    unknown: 0,
  };

  items.forEach((item) => {
    const year = parseYearForFiltering(item.dateCreated);
    const category = categoriseYear(year);
    centuries[category]++;
  });

  return { centuries };
};