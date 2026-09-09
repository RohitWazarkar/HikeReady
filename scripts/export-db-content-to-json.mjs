// -----------------------------------------------------------------------------
// Export CONTENT (categories, topics, questions) from the DB into data/*.json so
// JSON becomes the complete source of truth for questions. Some content (e.g.
// React & Node) exists only in the DB — this recovers it into JSON.
//
// - Merges DB rows into the existing JSON (DB wins on id; keeps any JSON-only rows).
// - Backfills sectionId=sec_interview and domainId=dom_it on categories that
//   have none (so the section/domain layer keeps working).
// - Does NOT touch users/bookmarks/progress/etc. — only content collections.
//
// Run:  node scripts/export-db-content-to-json.mjs
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../lib/prisma.js";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson(name) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeJson(name, arr) {
  await fs.writeFile(
    path.join(DATA_DIR, `${name}.json`),
    JSON.stringify(arr, null, 2) + "\n",
    "utf8"
  );
}

// Merge DB rows into existing JSON by id (DB is authoritative; keep JSON-only).
function mergeById(jsonRows, dbRows) {
  const map = new Map(jsonRows.map((r) => [r.id, r]));
  for (const row of dbRows) map.set(row.id, { ...map.get(row.id), ...row });
  return [...map.values()];
}

// Convert Prisma Date fields to ISO strings (JSON layer expects strings).
const iso = (v) => (v instanceof Date ? v.toISOString() : v);

async function main() {
  console.log("Exporting DB content -> JSON...");

  const [dbCategories, dbTopics, dbQuestions] = await Promise.all([
    prisma.category.findMany(),
    prisma.topic.findMany(),
    prisma.question.findMany(),
  ]);
  console.log(
    `DB: ${dbCategories.length} categories, ${dbTopics.length} topics, ${dbQuestions.length} questions`
  );

  const [jsonCategories, jsonTopics, jsonQuestions] = await Promise.all([
    readJson("categories"),
    readJson("topics"),
    readJson("questions"),
  ]);

  // Normalize categories: add section/domain defaults if missing.
  const catRows = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    sectionId: c.sectionId || "sec_interview",
    domainId: c.domainId || "dom_it",
    createdAt: iso(c.createdAt),
  }));

  const topicRows = dbTopics.map((t) => ({
    id: t.id,
    categoryId: t.categoryId,
    name: t.name,
    slug: t.slug,
    createdAt: iso(t.createdAt),
  }));

  const questionRows = dbQuestions.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    title: q.title,
    slug: q.slug,
    bodyMd: q.bodyMd ?? "",
    answerMd: q.answerMd ?? "",
    difficulty: q.difficulty,
    tags: Array.isArray(q.tags) ? q.tags : [],
    isPremium: !!q.isPremium,
    status: q.status,
    views: q.views ?? 0,
    createdAt: iso(q.createdAt),
    updatedAt: iso(q.updatedAt),
  }));

  const mergedCategories = mergeById(jsonCategories, catRows);
  const mergedTopics = mergeById(jsonTopics, topicRows);
  const mergedQuestions = mergeById(jsonQuestions, questionRows);

  await writeJson("categories", mergedCategories);
  await writeJson("topics", mergedTopics);
  await writeJson("questions", mergedQuestions);

  console.log(
    `JSON now: ${mergedCategories.length} categories, ${mergedTopics.length} topics, ${mergedQuestions.length} questions`
  );
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Export failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
