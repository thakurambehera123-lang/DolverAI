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
  console.log("CHAT HIT");
  const { messages, systemInstruction, model } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    // SSE headers (stream start)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // format messages
    const formattedContents = messages.map((m: any) => {
      const parts: any[] = [];

      parts.push({ text: m.content || "" });

      if (m.attachments && Array.isArray(m.attachments)) {
        for (const att of m.attachments) {
          if (att.url?.startsWith("data:")) {
            const base64 = att.url.split(",")[1];
            parts.push({
              inlineData: {
                mimeType: att.type || "application/octet-stream",
                data: base64,
              },
            });
          }
        }
      }

      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    const selectedModel = model || "gemini-1.5-flash";

    const stream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      },
    });

    // STREAM OUTPUT (FIXED FORMAT FOR FRONTEND)
    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${chunk.text}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    } else {
      res.write(`data: ERROR\n\n`);
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
