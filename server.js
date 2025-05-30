import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SMITHSONIAN_API_KEY = process.env.SMITHSONIAN_API_KEY;
const PORT = process.env.PORT || 3000;

if (!SMITHSONIAN_API_KEY) {
  console.error("Error: Smithsonian API key is not set!");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Smithsonian API proxy running" });
});

// Smithsonian search proxy
app.get("/api/smithsonian/search", async (req, res) => {
  try {
    const response = await axios.get("https://api.si.edu/openaccess/api/v1.0/search", {
      params: { 
        ...req.query, 
        api_key: SMITHSONIAN_API_KEY 
      },
      timeout: 30000,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Smithsonian search error:", error.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Smithsonian item details proxy
app.get("/api/smithsonian/content/:id", async (req, res) => {
  try {
    const response = await axios.get(`https://api.si.edu/openaccess/api/v1.0/content/${req.params.id}`, {
      params: { 
        api_key: SMITHSONIAN_API_KEY 
      },
      timeout: 30000,
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Smithsonian item error for ${req.params.id}:`, error.message);
    res.status(500).json({ error: "Failed to fetch item details" });
  }
});

app.listen(PORT, () => {
  console.log(`Smithsonian API proxy running on port ${PORT}`);
});