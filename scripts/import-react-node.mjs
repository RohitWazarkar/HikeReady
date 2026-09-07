// -----------------------------------------------------------------------------
// Import the React & Node.js handwritten notes into HikeReady as a new
// "React & Node" category. Renders in the existing UI (sidebar, search,
// accordions) automatically because it goes through the normal db layer.
//
// File format:
//   # PART A — REACT / # PART B — NODE.JS          (grouping, ignored as topics)
//   ## 🟢 BASIC — React fundamentals               (topic + difficulty)
//   ## 🟡 MEDIUM — Hooks, performance, and patterns
//   ### Q. <title>                                  (a question; no emoji)
//   ...answer markdown...
//   ## ⭐ Rapid Revision / ## 💬 Mock Interview      (STOP — summaries, skipped)
//
// Difficulty comes from the section emoji: 🟢 -> Easy, 🟡 -> Medium, 🔴 -> Hard.
// Topic name = the section text after the emoji/keyword.
//
// Idempotent: skips questions whose slug already exists; does NOT wipe data.
//
// Usage:
//   node scripts/import-react-node.mjs "C:\\path\\to\\React_Node_Interview_Notes.md"
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import { db } from "../lib/db.js";

const NOTES_PATH =
  process.argv[2] ||
  "C:\\Users\\2006997\\Desktop\\ChatGpt\\StudyMaterial\\React_Node_Interview_Notes.md";

const CATEGORY_NAME = "React & Node";
const CATEGORY_SLUG = "react-node";
const CATEGORY_DESC = "React and Node.js interview questions";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[`*_>#|&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

function difficultyFromSection(line) {
  const u = line.toUpperCase();
  if (line.includes("🔴") || u.includes("ADVANCED") || u.includes("HARD")) return "Hard";
  if (line.includes("🟡") || u.includes("MEDIUM") || u.includes("INTERMEDIATE")) return "Medium";
  return "Easy"; // 🟢 / BASIC / default
}

// Turn a "## 🟡 MEDIUM — Hooks, performance, and patterns" into a clean topic
// name like "Hooks, performance, and patterns" (falls back to the whole text).
function topicNameFromSection(line) {
  const stripped = line
    .replace(/^##\s+/, "")
    .replace(/[🟢🟡🔴⭐💬]/g, "")
    .trim();
  const dashIdx = stripped.search(/[—-]/);
  if (dashIdx !== -1) {
    const after = stripped.slice(dashIdx + 1).trim();
    if (after) return after;
  }
  return stripped;
}

function deriveTags(topicName, title, answer) {
  const dict = [
    "jsx", "props", "state", "hook", "usestate", "useeffect", "usememo",
    "usecallback", "context", "virtual dom", "component", "render", "key",
    "event loop", "async", "await", "promise", "express", "middleware",
    "stream", "buffer", "npm", "module", "callback", "error", "cluster",
  ];
  const hay = `${topicName} ${title} ${answer}`.toLowerCase();
  const tags = dict.filter((d) => hay.includes(d)).map((d) => d.replace(/\s+/g, "-"));
  return [...new Set(["react", "nodejs", ...tags])].slice(0, 6);
}

function parseNotes(md) {
  const lines = md.split(/\r?\n/);
  const questions = [];
  let currentDifficulty = "Easy";
  let currentTopic = "General";
  let current = null;

  const isStop = (line) =>
    /^##\s+/.test(line) &&
    (line.includes("Rapid Revision") ||
      line.includes("Mock Interview") ||
      line.startsWith("## ⭐") ||
      line.startsWith("## 💬"));

  const flush = () => {
    if (current) {
      questions.push({
        topic: current.topic,
        difficulty: current.difficulty,
        title: current.title,
        answerMd: current.bodyLines.join("\n").trim(),
      });
      current = null;
    }
  };

  for (const line of lines) {
    if (isStop(line)) {
      flush();
      break;
    }

    // ## section = topic + difficulty
    if (/^##\s+/.test(line)) {
      flush();
      currentDifficulty = difficultyFromSection(line);
      currentTopic = topicNameFromSection(line);
      continue;
    }

    // # PART headers are just grouping — ignore (don't reset topic).
    if (/^#\s+[^#]/.test(line)) continue;

    // ### Q. <title>
    const qMatch = line.match(/^###\s+Q\.\s+(.*)$/);
    if (qMatch) {
      flush();
      current = {
        topic: currentTopic,
        difficulty: currentDifficulty,
        title: qMatch[1].trim(),
        bodyLines: [],
      };
      continue;
    }

    // Other ### heading ends the current question.
    if (/^###\s+/.test(line) && current) {
      flush();
      continue;
    }

    if (current) current.bodyLines.push(line);
  }
  flush();
  return questions;
}

async function main() {
  const md = await fs.readFile(NOTES_PATH, "utf8");
  const parsed = parseNotes(md);
  console.log(`Parsed ${parsed.length} question blocks.`);

  // Ensure category.
  let category = await db.categories.findUnique({ slug: CATEGORY_SLUG });
  if (!category) {
    category = await db.categories.create({
      name: CATEGORY_NAME,
      slug: CATEGORY_SLUG,
      description: CATEGORY_DESC,
    });
    console.log(`Created category: ${CATEGORY_NAME}`);
  } else {
    console.log(`Category exists: ${CATEGORY_NAME}`);
  }

  // Cache topics by name.
  const topicCache = new Map();
  async function getTopic(name) {
    if (topicCache.has(name)) return topicCache.get(name);
    const slug = `rn-${slugify(name)}`;
    let topic = await db.topics.findUnique({ slug });
    if (!topic) {
      topic = await db.topics.create({
        categoryId: category.id,
        name,
        slug,
      });
      console.log(`  + topic: ${name}`);
    }
    topicCache.set(name, topic);
    return topic;
  }

  let created = 0;
  let skipped = 0;

  for (const q of parsed) {
    const slug = `rn-${slugify(q.title)}`;
    if (!slug || slug === "rn-") {
      skipped++;
      continue;
    }
    const existing = await db.questions.findUnique({ slug });
    if (existing) {
      skipped++;
      continue;
    }
    const topic = await getTopic(q.topic);
    await db.questions.create({
      topicId: topic.id,
      title: q.title,
      slug,
      bodyMd: `**${q.title}**`,
      answerMd: q.answerMd,
      difficulty: q.difficulty,
      tags: deriveTags(q.topic, q.title, q.answerMd),
      isPremium: false,
      status: "Published",
    });
    created++;
  }

  console.log(
    `Import complete: ${created} created, ${skipped} skipped, ${topicCache.size} topics.`
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
