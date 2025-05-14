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
app.get("/api/smithsonian/search", async (req, res) => {
  if (!SMITHSONIAN_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    console.log("Making request to Smithsonian API with query:", req.query);

    // Make request to Smithsonian API
    const response = await axios.get(
      "https://api.si.edu/openaccess/api/v1.0/search",
      {
        params: {
          ...req.query,
          api_key: SMITHSONIAN_API_KEY,
        },
      }
    );

    console.log("Smithsonian API response status:", response.status);
    res.json(response.data);
  } catch (error) {
    console.error("Smithsonian API error:", error.message);

    if (error.response) {
      // Forward the error details
      return res.status(error.response.status).json({
        error: "Error from Smithsonian API",
        details: error.response.data,
        status: error.response.status,
      });
    }

    res.status(500).json({
      error: "Failed to fetch data from Smithsonian API",
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
