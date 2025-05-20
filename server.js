import express from "express";
import cors from "cors";
import axios from "axios";
import { fileURLToPath } from "url";
// import path from "path";
import { dirname } from "path";
import dotenv from "dotenv";

// Load .envs
dotenv.config();

// Root paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Keys
const SMITHSONIAN_API_KEY = process.env.VITE_SMITHSONIAN_API_KEY;
const PORT = 3000;

// Check if API key is available
if (!SMITHSONIAN_API_KEY) {
  console.error(
    "Warning: Smithsonian API key is not set in environment variables!"
  );
}

const app = express();

// Enable CORS for all origins during development
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Healthcheck endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
    apiKeySet: SMITHSONIAN_API_KEY ? true : false,
  });
});

// DEBUG Endpoint to get raw search results for analysis
app.get("/api/smithsonian/raw-search", async (req, res) => {
  if (!SMITHSONIAN_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    const query = req.query.q || "art";

    const response = await axios.get(
      "https://api.si.edu/openaccess/api/v1.0/search",
      {
        params: {
          q: query,
          api_key: SMITHSONIAN_API_KEY,
          rows: 3, // Just get a few items
        },
      }
    );

    // Get the raw rows
    const items = response.data?.response?.rows || [];

    // Extract just the ID-related fields from the first item for clarity
    const firstItemIds =
      items.length > 0
        ? {
            id: items[0].id,
            url: items[0].url,
            title: items[0].title,
            unitCode: items[0].unitCode,
            type: items[0].type,
            record_ID: items[0].content?.descriptiveNonRepeating?.record_ID,
            record_link: items[0].content?.descriptiveNonRepeating?.record_link,

            // For ease of testing, construct content endpoint URLs for each ID field
            testUrls: {
              id: `https://api.si.edu/openaccess/api/v1.0/content/${items[0].id}`,
              record_ID: `https://api.si.edu/openaccess/api/v1.0/content/${
                items[0].content?.descriptiveNonRepeating?.record_ID || ""
              }`,
              url: `https://api.si.edu/openaccess/api/v1.0/content/${
                items[0].url || ""
              }`,

              // Also test with just the accession number if record_ID follows a pattern
              accessionNumber: items[0].content?.descriptiveNonRepeating
                ?.record_ID
                ? `https://api.si.edu/openaccess/api/v1.0/content/${
                    items[0].content.descriptiveNonRepeating.record_ID.split(
                      "_"
                    )[1] || ""
                  }`
                : "",
            },
          }
        : {};

    // Return both the extracted ID fields and the full raw items
    res.json({
      query,
      firstItemIds,
      rawItems: items,
    });
  } catch (error) {
    console.error("Error in raw-search:", error);
    res.status(500).json({
      error: "Failed to get raw search results",
      message: error.message,
    });
  }
});

// Add this to server.js - endpoint to test all ID fields from a search item

// Endpoint to test all ID fields from a search result
app.get("/api/smithsonian/test-all-ids", async (req, res) => {
  if (!SMITHSONIAN_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    const query = req.query.q || "art";

    // First, get a search result
    const searchResponse = await axios.get(
      "https://api.si.edu/openaccess/api/v1.0/search",
      {
        params: {
          q: query,
          api_key: SMITHSONIAN_API_KEY,
          rows: 1, // Just get 1 item
        },
      }
    );

    // Get the first item from the search
    const item = searchResponse.data?.response?.rows?.[0];

    if (!item) {
      return res.status(404).json({ error: "No search results found" });
    }

    // Extract all potentially relevant ID fields
    const idFields = {
      id: item.id,
      url: item.url,
      record_ID: item.content?.descriptiveNonRepeating?.record_ID,
      record_link: item.content?.descriptiveNonRepeating?.record_link,

      // Also try extracting just the accession number from record_ID if it follows a pattern
      accessionNumber: item.content?.descriptiveNonRepeating?.record_ID
        ? item.content.descriptiveNonRepeating.record_ID.split("_")[1] || ""
        : "",
    };

    // Test each ID field with the content endpoint
    const results = {};

    for (const [fieldName, value] of Object.entries(idFields)) {
      if (!value) continue; // Skip empty values

      try {
        console.log(`Testing field "${fieldName}" with value "${value}"`);

        const response = await axios.get(
          `https://api.si.edu/openaccess/api/v1.0/content/${value}`,
          {
            params: { api_key: SMITHSONIAN_API_KEY },
            timeout: 5000, // 5 second timeout
          }
        );

        results[fieldName] = {
          value,
          success: true,
          status: response.status,
          title: response.data?.response?.title || "Unknown",
        };

        console.log(`Success with field "${fieldName}"`);
      } catch (error) {
        results[fieldName] = {
          value,
          success: false,
          status: error.response?.status,
          error: error.message,
        };

        console.log(`Failed with field "${fieldName}": ${error.message}`);
      }
    }

    // Return the item and test results
    res.json({
      query,
      title: item.title,
      idFields,
      results,
    });
  } catch (error) {
    console.error("Error in test-all-ids:", error);
    res.status(500).json({
      error: "Failed to test all ID fields",
      message: error.message,
    });
  }
});

// Smithsonian API proxy endpoint
app.get("/api/smithsonian/search", async (req, res) => {
  if (!SMITHSONIAN_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    // Log the query parameters for debugging
    console.log("Request query:", req.query);

    // Request to Smithsonian API
    const apiResponse = await axios.get(
      "https://api.si.edu/openaccess/api/v1.0/search",
      {
        params: {
          ...req.query,
          api_key: SMITHSONIAN_API_KEY,
        },
      }
    );

    // Log for debugging
    console.log("Smithsonian API response status:", apiResponse.status);
    console.log("Total results:", apiResponse.data.response?.rowCount || 0);

    // Check for images (rows with online_media)
    let itemsWithMedia = 0;
    if (apiResponse.data.response?.rows) {
      apiResponse.data.response.rows.forEach((item) => {
        const hasMedia =
          item.content?.descriptiveNonRepeating?.online_media?.media;
        if (hasMedia && hasMedia.length > 0) {
          itemsWithMedia++;
          // Log the first item with media for debugging
          // if (itemsWithMedia === 1) {
          //   console.log(
          //     "Example media item:",
          //     JSON.stringify(hasMedia[0], null, 2)
          //   );
          // }
        }
      });
      console.log(
        `Found ${itemsWithMedia} items with media out of ${apiResponse.data.response.rows.length} results`
      );
    }

    // Response
    res.json(apiResponse.data);
  } catch (error) {
    console.error("Smithsonian API error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch data from Smithsonian API",
      details: error.response?.data || error.message,
    });
  }
});

// Route for item details
app.get("/api/smithsonian/content/:id", async (req, res) => {
  if (!SMITHSONIAN_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    const { id } = req.params;

    // Log the exact URL being called
    const url = `https://api.si.edu/openaccess/api/v1.0/content/${id}`;
    console.log(`Server attempting to fetch from: ${url}`);

    const response = await axios.get(url, {
      params: {
        api_key: SMITHSONIAN_API_KEY,
      },
    });

    console.log(`Success! Response for ID ${id}:`, response.data);

    // Store successful response for debugging
    res.locals.rawApiResponse = response.data;

    // Include additional debug info in development
    if (process.env.NODE_ENV === "development") {
      response.data._debug = {
        id,
        requestUrl: url,
        timestamp: new Date().toISOString(),
      };
    }

    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching item ${req.params.id}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error details:`, error.response.data);
    }

    res.status(error.response?.status || 500).json({
      error: "Failed to fetch item details",
      id: req.params.id,
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`API key configured: ${SMITHSONIAN_API_KEY ? "Yes" : "No"}`);
});
