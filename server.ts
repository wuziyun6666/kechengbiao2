import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/extract-schedule", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "Missing image data or mimeType" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured on server" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: "Extract the class schedule from this image. Return an array of classes. For each class, provide the course name, day of the week (1=Monday, 7=Sunday), start time (HH:MM in 24h format), end time (HH:MM in 24h format), location (if available), teacher (if available), and weeks. For 'weeks', provide an array of integers representing the weeks this class occurs (e.g., [1, 3, 5] for odd weeks, or [1, 2, 3, 4] for weeks 1-4). If the image does not specify weeks, assume it runs for weeks 1 through 20 and return an array [1, 2, 3, ..., 20]. If the image doesn't contain a schedule, return an empty array. Make sure to accurately capture all sessions, even if a course has multiple sessions in a week.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                courseName: { type: Type.STRING },
                dayOfWeek: { type: Type.INTEGER, description: "1 for Monday, 7 for Sunday" },
                startTime: { type: Type.STRING, description: "HH:MM format, 24-hour" },
                endTime: { type: Type.STRING, description: "HH:MM format, 24-hour" },
                location: { type: Type.STRING },
                teacher: { type: Type.STRING },
                weeks: { 
                  type: Type.ARRAY, 
                  items: { type: Type.INTEGER },
                  description: "Array of week numbers when this class occurs"
                }
              },
              required: ["courseName", "dayOfWeek", "startTime", "endTime", "weeks"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        return res.json({ schedule: [] });
      }
      
      const parsed = JSON.parse(text);
      res.json({ schedule: parsed });
    } catch (error) {
      console.error("Error extracting schedule:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to extract schedule" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
