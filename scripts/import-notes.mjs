// -----------------------------------------------------------------------------
// Import a "handwritten notes" Markdown file into HikeReady as real questions.
//
// The notes file is structured as:
//   ## <emoji> BASIC / INTERMEDIATE / ADVANCED  ...     <- difficulty sections
//   ### Q. <question title>                             <- a question block
//   ### `[Added]` Q. <question title>                   <- also a question block
//   ...answer markdown (spoken answer, code, tables, follow-ups)...
//
// Each Q block becomes one question:
//   title    = the text after "Q."
//   bodyMd   = the question restated (so the detail page has a prompt)
//   answerMd = everything under the heading (answer + code + tables + follow-ups)
//   difficulty = mapped from the current section (Basic->Easy, etc.)
//
// It is idempotent: questions whose slug already exists are skipped, and it does
// NOT wipe any existing data. Adds a "DBMS -> Interview Q&A" topic if missing.
//
// Usage:
//   node scripts/import-notes.mjs "C:\\path\\to\\Notes.md"
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import { db } from "../lib/db.js";

const NOTES_PATH =
  process.argv[2] ||
  "C:\\Users\\2006997\\Desktop\\ChatGpt\\StudyMaterial\\DBMS_SQL_Interview_Notes.md";

const CATEGORY_SLUG = "dbms";
const TOPIC_NAME = "Interview Q&A";
const TOPIC_SLUG = "dbms-interview-qa";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[`*_>#|]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

// Map a section heading to our Difficulty enum.
function difficultyFromSection(heading) {
  const h = heading.toUpperCase();
  if (h.includes("BASIC")) return "Easy";
  if (h.includes("INTERMEDIATE")) return "Medium";
  if (h.includes("ADVANCED")) return "Hard";
  return "Easy";
}

// Pull simple tags out of the answer text (best-effort, keeps them relevant).
function deriveTags(title, answer) {
  const dict = [
    "index", "join", "transaction", "normalization", "trigger", "view",
    "constraint", "key", "null", "deadlock", "isolation", "locking",
    "window function", "cte", "aggregate", "stored procedure", "acid",
    "union", "truncate",
  ];
  const hay = `${title} ${answer}`.toLowerCase();
  const tags = dict.filter((d) => hay.includes(d)).map((d) => d.replace(/\s+/g, "-"));
  return [...new Set(["sql", "dbms", ...tags])].slice(0, 6);
}

// Parse the markdown into an array of { title, difficulty, answerMd }.
function parseNotes(md) {
  const lines = md.split(/\r?\n/);
  const questions = [];
  let currentDifficulty = "Easy";
  let current = null; // { title, bodyLines: [] }

  const isStopSection = (line) =>
    /^##\s+/.test(line) &&
    (line.includes("Rapid Revision") ||
      line.includes("Mock Interview") ||
      line.startsWith("## ⭐") ||
      line.startsWith("## 💬"));

  const flush = () => {
    if (current) {
      questions.push({
        title: current.title,
        difficulty: currentDifficulty,
        answerMd: current.bodyLines.join("\n").trim(),
      });
      current = null;
    }
  };

  for (const line of lines) {
    // Stop collecting once we reach the summary/mock sections.
    if (isStopSection(line)) {
      flush();
      break;
    }

    // Difficulty section header, e.g. "## 🟢 BASIC — Foundational Concepts"
    if (/^##\s+/.test(line)) {
      flush();
      currentDifficulty = difficultyFromSection(line);
      continue;
    }

    // Question heading: "### Q. ..." or "### `[Added]` Q. ..."
    const qMatch = line.match(/^###\s+(?:`\[Added\]`\s+)?Q\.\s+(.*)$/);
    if (qMatch) {
      flush();
      current = { title: qMatch[1].trim(), bodyLines: [] };
      continue;
    }

    // Any other heading (### that isn't a Q) ends the current question.
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
  console.log(`Parsed ${parsed.length} question blocks from notes.`);

  // Resolve category + ensure topic exists.
  const category = await db.categories.findUnique({ slug: CATEGORY_SLUG });
  if (!category) {
    throw new Error(`Category "${CATEGORY_SLUG}" not found. Seed data first.`);
  }

  let topic = await db.topics.findUnique({ slug: TOPIC_SLUG });
  if (!topic) {
    topic = await db.topics.create({
      categoryId: category.id,
      name: TOPIC_NAME,
      slug: TOPIC_SLUG,
    });
    console.log(`Created topic: ${TOPIC_NAME}`);
  } else {
    console.log(`Topic already exists: ${TOPIC_NAME}`);
  }

  let created = 0;
  let skipped = 0;

  for (const q of parsed) {
    const slug = slugify(q.title);
    if (!slug) {
      skipped++;
      continue;
    }
    const existing = await db.questions.findUnique({ slug });
    if (existing) {
      skipped++;
      continue;
    }

    const bodyMd = `**${q.title}**`;
    await db.questions.create({
      topicId: topic.id,
      title: q.title,
      slug,
      bodyMd,
      answerMd: q.answerMd,
      difficulty: q.difficulty,
      tags: deriveTags(q.title, q.answerMd),
      isPremium: false,
      status: "Published",
    });
    created++;
  }

  console.log(`Import complete: ${created} created, ${skipped} skipped (existing/empty).`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
