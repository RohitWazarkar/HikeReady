// POST /api/chat  — HikeReady's chatbot.
//
// Primary mode: Gemini 2.5 Flash with RAG (answers grounded in our own content).
// Fallback mode: if the key is missing OR Gemini fails for ANY reason (network /
// corporate TLS / rate limit / etc.), we DON'T show an error — instead we reply
// with a search-backed answer built from the most relevant HikeReady questions.
// So the assistant always returns something useful.
//
// The GEMINI_API_KEY lives only here on the server.

import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { searchQuestions } from "@/lib/queries";

// Retrieve the most relevant Q&As for a message (used by both modes).
async function retrieve(message) {
  const matches = await searchQuestions(message, 5);
  const items = [];
  for (const m of matches) {
    const full = await db.questions.findById(m.id);
    if (!full) continue;
    items.push({
      title: full.title,
      difficulty: full.difficulty,
      answerMd: full.answerMd || "",
      slug: full.slug,
      topicSlug: m.topicSlug,
      topicName: m.topicName,
    });
  }
  return items;
}

// Build a friendly Markdown answer purely from our own content (no AI).
// Shows the single best match's answer in full, then lists related questions.
function buildFallbackAnswer(message, items) {
  if (items.length === 0) {
    return `I couldn't find anything in HikeReady's questions matching **"${message}"**.\n\nTry rephrasing, or browse the categories in the sidebar (DSA, DBMS, .NET, JavaScript).`;
  }

  const [best, ...rest] = items;
  let out = `Here's what I found in HikeReady for **"${message}"**:\n\n`;
  out += `## ${best.title}  \n_${best.difficulty}${best.topicName ? ` · ${best.topicName}` : ""}_\n\n`;
  out += `${best.answerMd}\n`;

  if (rest.length) {
    out += `\n---\n\n**Related questions:**\n`;
    for (const r of rest) {
      const link = r.topicSlug ? `/topic/${r.topicSlug}` : "#";
      out += `- [${r.title}](${link}) _(${r.difficulty})_\n`;
    }
  }
  return out;
}

// Stream a plain string back to the client (same shape as the Gemini stream).
function streamText(text) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

const SYSTEM_INSTRUCTION = `You are HikeReady's friendly interview-prep assistant.
- Prefer the provided CONTEXT (HikeReady's own vetted interview answers) when it is relevant.
- If the context doesn't cover the question, you may answer from general knowledge, but briefly note that it's outside HikeReady's curated content.
- Keep answers concise, practical, and interview-focused. Use Markdown: short paragraphs, bullet points, and fenced code blocks for code.
- Do not invent facts.`;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = (body?.message || "").toString().trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];
  if (!message) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  // Retrieve relevant content once — powers both the AI context and the fallback.
  const items = await retrieve(message);
  const apiKey = process.env.GEMINI_API_KEY;

  // No key -> go straight to the search-backed answer.
  if (!apiKey) {
    return streamText(buildFallbackAnswer(message, items));
  }

  // Try Gemini; on ANY failure, fall back to the search-backed answer.
  try {
    const context = items
      .map((i) => `### ${i.title} (${i.difficulty})\n${i.answerMd}`)
      .join("\n\n---\n\n");

    const ai = new GoogleGenAI({ apiKey });
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "") }],
      })),
      {
        role: "user",
        parts: [
          {
            text: context
              ? `CONTEXT (HikeReady interview answers):\n${context}\n\n---\nUser question: ${message}`
              : `User question: ${message}`,
          },
        ],
      },
    ];

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const encoder = new TextEncoder();
    let produced = false;
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              produced = true;
              controller.enqueue(encoder.encode(text));
            }
          }
          // If Gemini returned nothing usable, fall back inline.
          if (!produced) {
            controller.enqueue(encoder.encode(buildFallbackAnswer(message, items)));
          }
        } catch (err) {
          console.error("[/api/chat] stream error, using fallback:", err?.message || err);
          // Mid-stream failure: give the fallback so the user still gets an answer.
          if (!produced) {
            controller.enqueue(encoder.encode(buildFallbackAnswer(message, items)));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Gemini failed to even start (no network / cert / rate limit / bad key).
    console.error("[/api/chat] Gemini unavailable, using fallback:", err?.message || err);
    return streamText(buildFallbackAnswer(message, items));
  }
}
