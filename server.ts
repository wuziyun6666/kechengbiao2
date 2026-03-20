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
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `You are an expert data extractor and OCR specialist. Analyze this university class schedule image and extract ALL course sessions with maximum accuracy.
Return ONLY a valid JSON object with a 'schedule' array containing objects with these exact keys:
- courseName (string)
- dayOfWeek (number, 1-7 where 1 is Monday, 7 is Sunday)
- startTime (string, "HH:MM" 24-hour format)
- endTime (string, "HH:MM" 24-hour format)
- location (string, optional)
- teacher (string, optional)
- weeks (array of numbers, e.g., [1,2,3,4,5])

CRITICAL RULES FOR ACCURACY:
1. EXTRACT EVERY SINGLE CLASS: Scan the image meticulously, row by row and column by column. Do not miss any class block, including evening classes, weekend classes, or classes with faint text.
2. MULTIPLE SESSIONS: If the same course appears multiple times in a week, create a SEPARATE object for EACH appearance.
3. WEEKS PARSING (EXTREMELY IMPORTANT): Carefully parse week strings (e.g., "1-16周", "1-15单周", "2-16双周", "1,3,5-8周"). 
   - "1-16" -> [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
   - "单周" (Odd weeks) -> [1,3,5,7,9,11,13,15]
   - "双周" (Even weeks) -> [2,4,6,8,10,12,14,16]
   - "1,3,5-8" -> [1,3,5,6,7,8]
   - If no weeks are specified, default to [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].
4. TIME ESTIMATION: If exact clock times (e.g., 08:00) are missing but period numbers (e.g., "第1-2节", "1-2节", "[1-2节]") are present, use standard Chinese university times:
   - 1-2节: 08:00-09:40
   - 3-4节: 10:00-11:40
   - 5-6节: 14:00-15:40
   - 7-8节: 16:00-17:40
   - 9-10节: 18:30-20:10
   - 11-12节: 20:20-22:00
   - 1-4节: 08:00-11:40
   - 5-8节: 14:00-17:40
5. MERGE CONTIGUOUS BLOCKS: If a class spans multiple consecutive periods (e.g., 1-2节 and 3-4节 for the same course), combine them into one session (08:00-11:40).
6. NO HALLUCINATIONS: Only extract what is visible. If location or teacher is missing, omit the field or leave it empty.
7. TEXT CLEANUP: Remove unnecessary brackets, newlines, or extra spaces from course names, teachers, and locations. Ensure course names are clean.
8. OVERLAPPING CLASSES: Sometimes two classes share the same time slot but on different weeks. Extract BOTH as separate sessions with their respective 'weeks' arrays.`,
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
    } catch (error: any) {
      console.error("Error extracting schedule:", error);
      let errorMessage = "Failed to extract schedule";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific API key errors
        if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
          errorMessage = "您的 API 密钥无效。请检查您在 Render 的 Environment 环境变量中填写的 GEMINI_API_KEY 是否正确，确保没有多余的空格，并且是从 Google AI Studio 生成的最新密钥。";
        } else {
          try {
            // Try to parse the error message if it's a JSON string from the API
            const parsedError = JSON.parse(error.message);
            if (parsedError.error && parsedError.error.message) {
              errorMessage = parsedError.error.message;
              if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
                errorMessage = "您的 API 密钥无效。请检查您在 Render 的 Environment 环境变量中填写的 GEMINI_API_KEY 是否正确，确保没有多余的空格，并且是从 Google AI Studio 生成的最新密钥。";
              }
            }
          } catch (e) {
            // If it's not JSON, just use the original message
          }
        }
      }
      
      res.status(500).json({ error: errorMessage });
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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
