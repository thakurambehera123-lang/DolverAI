import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables. Gemini calls will fail.");
}

// Initialize the Gemini client as recommended in guidelines
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Check overall system health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: Generate a smart chat title using Gemini based on first user message
  app.post("/api/gemini/generate-title", async (req, res) => {
    const { firstMessage } = req.body;
    if (!firstMessage) {
      return res.status(400).json({ error: "firstMessage is required" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this first user message of a chat conversation and generate an elegant, extremely concise title representing it. The title must be 2 to 4 words maximum, completely natural, direct, and without any quotation marks or preamble text like 'Title: '. If the query is extremely short, just base it directly on that query.
User message: "${firstMessage}"`,
      });

      const title = response.text ? response.text.trim().replace(/^["':\s]+|["':\s]+$/g, "") : "New Chat";
      res.json({ title: title || "New Chat" });
    } catch (e: any) {
      console.error("Gemini title generation error:", e);
      res.json({ title: "New Conversation" });
    }
  });

  // API Route: Stream completions using Gemini API
  app.post("/api/gemini/chat", async (req, res) => {
    const { messages, systemInstruction, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    try {
      // Set response headers to enable Server-Sent Events (SSE) streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Format messages into Google GenAI format (user and model) including multi-modal attachments
      const formattedContents = messages.map((m: { role: string; content: string; attachments?: { name: string; type: string; size: number; url: string }[] }) => {
        const parts: any[] = [];
        
        // Add content text part
        parts.push({ text: m.content || "" });

        // Add companion attachment parts if they exist
        if (m.attachments && Array.isArray(m.attachments)) {
          for (const att of m.attachments) {
            if (att.url && att.url.startsWith("data:")) {
              const commaIdx = att.url.indexOf(",");
              if (commaIdx !== -1) {
                const mimeType = att.type || "application/octet-stream";
                const base64Data = att.url.slice(commaIdx + 1);
                parts.push({
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                });
              }
            }
          }
        }

        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: parts,
        };
      });

      // Set model name. Standard text tasks use gemini-3.5-flash
      const selectedModel = model || "gemini-3.5-flash";

      // Call streaming API
      const stream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          // Send formatted chunk in line-delimited JSON format
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Gemini API Error in backend:", error);
      // In case stream fails after connection is open
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Internal server error during generating AI response." });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || "An unexpected error occurred during streaming." })}\n\n`);
        res.end();
      }
    }
  });

  // Vite Integration for Hot Middleware or Production static serving
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
    console.log(`Dolver AI local server running on http://localhost:${PORT}`);
  });
}

startServer();
