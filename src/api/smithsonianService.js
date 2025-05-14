// src/api/smithsonianService.js
import axios from "axios";

// Environment-aware base URL
// In production: use relative URLs (same server)
// In development: use local Express server
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

// Create an axios instance
const smithsonianAPI = axios.create({
  baseURL: API_URL,
});

// test function DEV
export const testSmithsonianAPI = async (query = "mask") => {
  console.log("Starting Smithsonian API test via proxy server...");
  console.log(
    "Environment:",
    import.meta.env.PROD ? "Production" : "Development"
  );
  console.log("Using API base URL:", API_URL || "Same origin (relative URL)");

  try {
    // Call your Express server endpoint, not Smithsonian directly
    const response = await smithsonianAPI.get("/api/smithsonian/search", {
      params: {
        q: query,
        rows: 3,
      },
    });

    console.log("API Request successful!");
    console.log("Response status:", response.status);
    console.log("Full response data:", response.data);

    // Log specific parts of the response to understand structure
    if (response.data && response.data.response) {
      console.log("Total results:", response.data.response.rowCount);
      console.log("First result:", response.data.response.rows[0]);

      // Try to extract important fields from first result
      const firstItem = response.data.response.rows[0];
      if (firstItem) {
        console.log("Extracted data from first item:");
        console.log("- ID:", firstItem.id);
        console.log("- Title:", firstItem.title);
        console.log(
          "- Description:",
          firstItem.content?.descriptiveNonRepeating?.description
        );

        // Try to find image URL
        const mediaContent =
          firstItem.content?.descriptiveNonRepeating?.online_media?.media;
        if (mediaContent && mediaContent.length > 0) {
          console.log(
            "- Image URL:",
            mediaContent[0].content || mediaContent[0].thumbnail
          );
        } else {
          console.log("- No image found");
        }
      }
    }

    return response.data;
  } catch (error) {
    console.error("Error testing Smithsonian API:", error);
    if (error.response) {
      // The request was made and server responded with an error status
      console.error("Response error data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      // The request was made but no response received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request
      console.error("Error message:", error.message);
    }
    throw error;
  }
};

// MAIN CODE

// Search the Smithsonian collections
export const searchSmithsonian = async (query, page = 1, pageSize = 10) => {
  try {
    const response = await smithsonianAPI.get("/api/smithsonian/search", {
      params: {
        q: query,
        page,
        rows: pageSize,
      },
    });

    return formatSearchResults(response.data);
  } catch (error) {
    console.error("Error searching Smithsonian API:", error);
    throw error;
  }
};

// Get details for a specific item
export const getItemDetails = async (id) => {
  try {
    const response = await smithsonianAPI.get(`/api/smithsonian/content/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching item details:", error);
    throw error;
  }
};

// Helper function to format the search results into a consistent format
const formatSearchResults = (data) => {
  const { response } = data;

  if (!response || !response.rows) {
    return {
      total: 0,
      items: [],
    };
  }

  return {
    total: response.rowCount,
    items: response.rows.map((item) => ({
      id: item.id,
      title: item.title || "Untitled",
      description: item.content?.descriptiveNonRepeating?.description || "",
      imageUrl: getImageUrl(item),
      source: "Smithsonian",
      datePublished: getDate(item),
      url: item.content?.descriptiveNonRepeating?.record_link || "",
      museum: item.unitCode || "Smithsonian",
    })),
  };
};

// Helper function to get the best available image
const getImageUrl = (item) => {
  if (
    item.content?.descriptiveNonRepeating?.online_media?.media &&
    item.content.descriptiveNonRepeating.online_media.media.length > 0
  ) {
    const media = item.content.descriptiveNonRepeating.online_media.media[0];
    return media.content || media.thumbnail || "";
  }
  return "";
};

// Helper function to get the date
const getDate = (item) => {
  if (item.content?.indexedStructured?.date) {
    return item.content.indexedStructured.date;
  }
  return "";
};
