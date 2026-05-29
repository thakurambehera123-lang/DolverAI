import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "Messages required" });
    }

    const formatted = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const stream = await ai.models.generateContentStream({
      model: "gemini-1.5-flash",
      contents: formatted,
    });

    res.setHeader("Content-Type", "text/plain");

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI response failed" });
  }
}