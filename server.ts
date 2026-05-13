import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI endpoints
app.post("/api/ai/research", async (req, res) => {
  try {
    const { url, topic } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a content strategist. 
      Analyze the competitor article at ${url} (topic: ${topic || 'general'}).
      Provide:
      1. A concise summary of the main points.
      2. A detailed article outline for a new, original article based on this source.
      3. A title for the new article.`,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            outline: { type: Type.STRING },
          },
          required: ["title", "summary", "outline"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI Research Error:", error);
    res.status(500).json({ error: "Failed to generate research" });
  }
});

app.post("/api/ai/pinterest", async (req, res) => {
  try {
    const { title, summary } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create 3 Pinterest pin ideas for an article titled "${title}". 
      Summary of article: ${summary}
      For each pin, provide a creative image idea and a highly engaging, keyword-rich caption with hashtags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pins: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  idea: { type: Type.STRING, description: "Visual idea for the pin" },
                  caption: { type: Type.STRING, description: "Engagement-optimized caption" }
                },
                required: ["idea", "caption"]
              }
            }
          },
          required: ["pins"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI Pinterest Error:", error);
    res.status(500).json({ error: "Failed to generate Pinterest ideas" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
