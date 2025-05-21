import express from "express";
import cors from "cors";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Paths and configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SMITHSONIAN_API_KEY = process.env.VITE_SMITHSONIAN_API_KEY;
const PORT = process.env.PORT || 3000;
const SMITHSONIAN_API_BASE = "https://api.si.edu/openaccess/api/v1.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_DEV = NODE_ENV === "development";

// Ensure required environment variables exist
if (!SMITHSONIAN_API_KEY) {
  console.error(
    "Error: Smithsonian API key is not set in environment variables!"
  );
  process.exit(1);
}

//  Add in Europeana check

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Log messages only in development mode
 */
const devLog = (...args) => {
  if (IS_DEV) {
    console.log(...args);
  }
};

/**
 * Healthcheck endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiAvailable: true,
    environment: NODE_ENV,
  });
});

/**
 * Smithsonian API proxy search endpoint
 */
app.get("/api/smithsonian/search", async (req, res) => {
  try {
    devLog("Smithsonian search query:", req.query);

    // Request to Smithsonian API
    const apiResponse = await axios.get(`${SMITHSONIAN_API_BASE}/search`, {
      params: {
        ...req.query,
        api_key: SMITHSONIAN_API_KEY,
      },
    });

    // Log statistics in dev mode
    if (IS_DEV) {
      const totalResults = apiResponse.data.response?.rowCount || 0;
      const rows = apiResponse.data.response?.rows || [];

      // Count items with media
      let itemsWithMedia = 0;
      rows.forEach((item) => {
        const hasMedia =
          item.content?.descriptiveNonRepeating?.online_media?.media;
        if (hasMedia && hasMedia.length > 0) {
          itemsWithMedia++;
        }
      });

      devLog(
        `Found ${itemsWithMedia} items with media out of ${rows.length} results (total: ${totalResults})`
      );
    }

    // Return API response
    res.json(apiResponse.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message;

    console.error(`Smithsonian search API error (${status}):`, errorMessage);

    res.status(status).json({
      error: "Failed to fetch data from Smithsonian API",
      details: IS_DEV ? errorMessage : "An unexpected error occurred",
    });
  }
});

/**
 * Smithsonian API proxy content endpoint (for single item details)
 */
app.get("/api/smithsonian/content/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    devLog(`Fetching item details for ID: ${id}`);

    // Request to Smithsonian API
    const response = await axios.get(`${SMITHSONIAN_API_BASE}/content/${id}`, {
      params: {
        api_key: SMITHSONIAN_API_KEY,
      },
    });

    devLog(`Successfully retrieved data for item ID: ${id}`);

    // Add debug info in development mode
    if (IS_DEV) {
      response.data._debug = {
        id,
        timestamp: new Date().toISOString(),
      };
    }

    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message;

    console.error(`Error fetching item ${req.params.id}: ${errorMessage}`);

    res.status(status).json({
      error: "Failed to fetch item details",
      id: req.params.id,
      details: IS_DEV ? errorMessage : "An unexpected error occurred",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`API key configured: ${SMITHSONIAN_API_KEY ? "Yes" : "No"}`);
});
