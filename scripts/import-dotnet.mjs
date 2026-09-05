// -----------------------------------------------------------------------------
// Import the .NET / C# handwritten notes into HikeReady.
//
// This notes file has a DIFFERENT layout from the DBMS one:
//   # N. SECTION NAME            <- top-level headings = TOPICS
//   ### 🟢 Q. <title>            <- green  = Easy
//   ### 🟡 Q. <title>            <- yellow = Medium
//   ### 🔴 Q. <title>            <- red    = Hard
//   ...answer markdown...
//
// So difficulty is read from the emoji on each question heading, and topics come
// from the numbered section headers. Creates a ".NET" category if missing.
//
// Idempotent: skips questions whose slug already exists; never wipes data.
// Slugs are prefixed "dotnet-" to avoid collisions with other categories.
//
// Usage:
//   node scripts/import-dotnet.mjs "C:\\path\\to\\DotNet_Interview_Notes.md"
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import { db } from "../lib/db.js";

const NOTES_PATH =
  process.argv[2] ||
  "C:\\Users\\2006997\\Desktop\\ChatGpt\\StudyMaterial\\DotNet_Interview_Notes.md";

const CATEGORY_NAME = ".NET";
const CATEGORY_SLUG = "dotnet";
const CATEGORY_DESC = ".NET & C# interview questions";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[`*_>#|]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

// Emoji -> difficulty.
function difficultyFromEmoji(line) {
  if (line.includes("🟢")) return "Easy";
  if (line.includes("🟡")) return "Medium";
  if (line.includes("🔴")) return "Hard";
  return "Easy";
}

function deriveTags(sectionName, title, answer) {
  const dict = [
    "clr", "jit", "garbage collection", "async", "await", "linq", "delegate",
    "interface", "inheritance", "polymorphism", "middleware", "controller",
    "entity framework", "dbcontext", "repository", "serialization", "rest",
    "api", "boxing", "generics", "dependency injection", "mvc", "assembly",
    "value type", "reference type",
  ];
  const hay = `${sectionName} ${title} ${answer}`.toLowerCase();
  const tags = dict
    .filter((d) => hay.includes(d))
    .map((d) => d.replace(/\s+/g, "-"));
  return [...new Set(["dotnet", "csharp", ...tags])].slice(0, 6);
}

// Parse into [{ section, title, difficulty, answerMd }].
function parseNotes(md) {
  const lines = md.split(/\r?\n/);
  const questions = [];
  let currentSection = "General";
  let current = null;

  const flush = () => {
    if (current) {
      questions.push({
        section: current.section,
        title: current.title,
        difficulty: current.difficulty,
        answerMd: current.bodyLines.join("\n").trim(),
      });
      current = null;
    }
  };

  for (const line of lines) {
    // Top-level section header: "# 1. .NET BASICS" (but skip the file title).
    const sectionMatch = line.match(/^#\s+(\d+\.\s*)?(.+)$/);
    if (sectionMatch && !/^#\s+\.NET\s*\/\s*C#/.test(line)) {
      // Only treat as a topic if it's a numbered section OR an ALL-CAPS-ish
      // header; the file title is excluded above.
      const isTopic = /^#\s+\d+\./.test(line);
      if (isTopic) {
        flush();
        currentSection = sectionMatch[2].trim();
        continue;
      }
    }

    // Question heading with emoji difficulty.
    const qMatch = line.match(/^###\s+(?:🟢|🟡|🔴)?\s*Q\.\s+(.*)$/);
    if (qMatch) {
      flush();
      current = {
        section: currentSection,
        title: qMatch[1].trim(),
        difficulty: difficultyFromEmoji(line),
        bodyLines: [],
      };
      continue;
    }

    // Any other ### heading that isn't a Q ends the current block.
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

  // Ensure the .NET category exists.
  let category = await db.categories.findUnique({ slug: CATEGORY_SLUG });
  if (!category) {
    category = await db.categories.create({
      name: CATEGORY_NAME,
      slug: CATEGORY_SLUG,
      description: CATEGORY_DESC,
    });
    console.log(`Created category: ${CATEGORY_NAME}`);
  } else {
    console.log(`Category already exists: ${CATEGORY_NAME}`);
  }

  // Cache topics by section name so we create each once.
  const topicCache = new Map();
  async function getTopic(sectionName) {
    if (topicCache.has(sectionName)) return topicCache.get(sectionName);
    const slug = `dotnet-${slugify(sectionName)}`;
    let topic = await db.topics.findUnique({ slug });
    if (!topic) {
      topic = await db.topics.create({
        categoryId: category.id,
        name: sectionName,
        slug,
      });
      console.log(`  + topic: ${sectionName}`);
    }
    topicCache.set(sectionName, topic);
    return topic;
  }

  let created = 0;
  let skipped = 0;

  for (const q of parsed) {
    const slug = `dotnet-${slugify(q.title)}`;
    if (!slug || slug === "dotnet-") {
      skipped++;
      continue;
    }
    const existing = await db.questions.findUnique({ slug });
    if (existing) {
      skipped++;
      continue;
    }

    const topic = await getTopic(q.section);
    await db.questions.create({
      topicId: topic.id,
      title: q.title,
      slug,
      bodyMd: `**${q.title}**`,
      answerMd: q.answerMd,
      difficulty: q.difficulty,
      tags: deriveTags(q.section, q.title, q.answerMd),
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
