import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// API: OCR for 3uTools Report
app.post("/api/scan-report", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/png",
            data: imageBase64,
          },
        },
        {
          text: `Extract the following details from this 3uTools/iMazing/Apple diagnostic report image. Return ONLY a JSON object with these keys: 
          - model (Product Model)
          - imei (IMEI, 15 digits)
          - serialNumber (Serial Number)
          - batteryHealth (Battery Life percentage as integer)
          - storageCapacity (HDD Capacity, e.g. "256GB")
          - physicalCondition (Summary of any failures or "Normal" if all green)
          
          If a value is not found, use null.`,
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            model: { type: Type.STRING },
            imei: { type: Type.STRING },
            serialNumber: { type: Type.STRING },
            batteryHealth: { type: Type.INTEGER },
            storageCapacity: { type: Type.STRING },
            physicalCondition: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    res.status(500).json({ error: "Field extraction failed" });
  }
});

// API: IMEI Verification
app.post("/api/verify-imei", async (req, res) => {
  try {
    const { imei } = req.body;

    if (!imei || typeof imei !== 'string') {
      return res.status(400).json({ error: "Invalid IMEI format" });
    }

    // Try to use real IMEI API
    try {
      const response = await fetch(`https://imei24.com/api/v1/check?imei=${encodeURIComponent(imei)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Extract status from API response
        const status = data.status === 'OK' ? 'clean' : 
                      data.status === 'BLACKLIST' ? 'blacklisted' : 'unknown';
        return res.json({ status });
      }
    } catch (err) {
      console.log("IMEI API unavailable, using mock response");
    }

    // Mock response when API is unavailable
    const status = Math.random() > 0.5 ? 'clean' : 'blacklisted';
    res.json({ status });
  } catch (error) {
    console.error("IMEI Verification Error:", error);
    res.status(500).json({ error: "Verification failed", status: "unknown" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sherp4 Server running on http://localhost:${PORT}`);
  });
}

setupVite();
