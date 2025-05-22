/**
 * Smithsonian Institution Museum Codes and Names
 * Maps internal codes to full readable museum names
 */

export const SMITHSONIAN_MUSEUMS = {
  // Main Museums
  AAA: "Archives of American Art",
  ACM: "Anacostia Community Museum",
  CHNDM: "Cooper Hewitt, Smithsonian Design Museum",
  HMSG: "Hirshhorn Museum and Sculpture Garden",
  NASM: "National Air and Space Museum",
  NMAAHC: "National Museum of African American History and Culture",
  NMAH: "National Museum of American History",
  NMAI: "National Museum of the American Indian",
  NMAfA: "National Museum of African Art",
  NMNH: "National Museum of Natural History",
  NPG: "National Portrait Gallery",
  NPM: "National Postal Museum",
  NZP: "Smithsonian's National Zoo & Conservation Biology Institute",
  SAAM: "Smithsonian American Art Museum",

  // Specialized Collections & Archives
  CFCHFOLKLIFE: "Ralph Rinzler Folklife Archives and Collections",
  EEPA: "Eliot Elisofon Photographic Archives",
  FBR: "Smithsonian Field Book Project",
  FSG: "Freer Gallery of Art and Arthur M. Sackler Gallery",
  HAC: "Smithsonian Gardens",
  HSFA: "Human Studies Film Archives",
  NAA: "National Anthropological Archives",
  SIA: "Smithsonian Institution Archives",
  SIL: "Smithsonian Libraries",

  // NMNH Departmental Collections
  NMNHANTHRO: "NMNH - Anthropology Dept.",
  NMNHBIRDS: "NMNH - Vertebrate Zoology - Birds Division",
  NMNHBOTANY: "NMNH - Botany Dept.",
  NMNHEDUCATION: "NMNH - Education & Outreach",
  NMNHENTO: "NMNH - Entomology Dept.",
  NMNHFISHES: "NMNH - Vertebrate Zoology - Fishes Division",
  NMNHHERPS: "NMNH - Vertebrate Zoology - Herpetology Division",
  NMNHINV: "NMNH - Invertebrate Zoology Dept.",
  NMNHMAMMALS: "NMNH - Vertebrate Zoology - Mammals Division",
  NMNHMINSCI: "NMNH - Mineral Sciences Dept.",
  NMNHPALEO: "NMNH - Paleobiology Dept.",
};

/**
 * Get the full museum name from a code
 * @param {string} code - Museum code (e.g., "NASM", "NMAH")
 * @returns {string} - Full museum name or original code if not found
 */
export const getMuseumName = (code) => {
  if (!code) return "Smithsonian Institution";

  // Return full name if code exists, otherwise return the original code
  return SMITHSONIAN_MUSEUMS[code] || code;
};

/**
 * Check if a code is a valid Smithsonian museum code
 * @param {string} code - Museum code to check
 * @returns {boolean} - True if code exists in our mapping
 */
export const isValidMuseumCode = (code) => {
  return (
    code && Object.prototype.hasOwnProperty.call(SMITHSONIAN_MUSEUMS, code)
  );
};

/**
 * Get all museum codes
 * @returns {string[]} - Array of all museum codes
 */
export const getAllMuseumCodes = () => {
  return Object.keys(SMITHSONIAN_MUSEUMS);
};

/**
 * Get all museum names
 * @returns {string[]} - Array of all museum names
 */
export const getAllMuseumNames = () => {
  return Object.values(SMITHSONIAN_MUSEUMS);
};
