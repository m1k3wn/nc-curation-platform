// server.js
import express from "express";
import cors from "cors";
import axios from "axios";
import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get API key from environment variable
const SMITHSONIAN_API_KEY = process.env.VITE_SMITHSONIAN_API_KEY;
const PORT = 3000; // Changed to port 3000

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

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
    apiKeySet: SMITHSONIAN_API_KEY ? true : false,
  });
});

// Smithsonian API proxy endpoint
// Clean, simple endpoint for Smithsonian API
app.get("/api/smithsonian/search", async (req, res) => {
  if (!SMITHSONIAN_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    // Log the query parameters for debugging
    console.log("Request query:", req.query);

    // Make request to Smithsonian API
    const apiResponse = await axios.get(
      "https://api.si.edu/openaccess/api/v1.0/search",
      {
        params: {
          ...req.query,
          api_key: SMITHSONIAN_API_KEY,
        },
      }
    );

    // Log response info for debugging
    console.log("Smithsonian API response status:", apiResponse.status);
    console.log("Total results:", apiResponse.data.response?.rowCount || 0);

    // Check if we have any rows with online_media
    let itemsWithMedia = 0;
    if (apiResponse.data.response?.rows) {
      apiResponse.data.response.rows.forEach((item) => {
        const hasMedia =
          item.content?.descriptiveNonRepeating?.online_media?.media;
        if (hasMedia && hasMedia.length > 0) {
          itemsWithMedia++;
          // Log the first item with media for debugging
          if (itemsWithMedia === 1) {
            console.log(
              "Example media item:",
              JSON.stringify(hasMedia[0], null, 2)
            );
          }
        }
      });
      console.log(
        `Found ${itemsWithMedia} items with media out of ${apiResponse.data.response.rows.length} results`
      );
    }

    // Return the unmodified response
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

    const response = await axios.get(
      `https://api.si.edu/openaccess/api/v1.0/content/${id}`,
      {
        params: {
          api_key: SMITHSONIAN_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching Smithsonian item details:`, error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch item details",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`API key configured: ${SMITHSONIAN_API_KEY ? "Yes" : "No"}`);
});
