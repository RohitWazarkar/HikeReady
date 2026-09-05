// -----------------------------------------------------------------------------
// Page-level read queries for HikeReady.
//
// These compose the low-level db.* primitives (lib/db.js) into the exact shapes
// the pages need. Keeping them here means:
//   - page components stay clean (one import, one call)
//   - when we move to Prisma, we rewrite only this file + lib/db.js
//
// Server-only (they read the JSON files via lib/db.js). Import from server
// components / route handlers, never from client components.
// -----------------------------------------------------------------------------

import { db } from "./db.js";

const byName = (a, b) => a.name.localeCompare(b.name);
const byTitle = (a, b) => a.title.localeCompare(b.title);

// All categories, alphabetized, each with a topic count for the home cards.
export async function getCategoriesWithCounts() {
  const [categories, topics] = await Promise.all([
    db.categories.findMany(),
    db.topics.findMany(),
  ]);
  return categories
    .map((c) => ({
      ...c,
      topicCount: topics.filter((t) => t.categoryId === c.id).length,
    }))
    .sort(byName);
}

// A single category by slug, with its topics (each topic includes a question
// count). Returns null if the category doesn't exist.
export async function getCategoryBySlug(slug) {
  const category = await db.categories.findUnique({ slug });
  if (!category) return null;

  const [topics, questions] = await Promise.all([
    db.topics.findMany({ where: { categoryId: category.id } }),
    db.questions.findMany(),
  ]);

  const topicsWithCounts = topics
    .map((t) => ({
      ...t,
      questionCount: questions.filter(
        (q) => q.topicId === t.id && q.status === "Published"
      ).length,
    }))
    .sort(byName);

  return { ...category, topics: topicsWithCounts };
}

// A single topic by slug, with its parent category and its Published questions.
// Returns null if the topic doesn't exist.
export async function getTopicBySlug(slug) {
  const topic = await db.topics.findUnique({ slug });
  if (!topic) return null;

  const [category, questions] = await Promise.all([
    db.categories.findById(topic.categoryId),
    db.questions.findMany({ where: { topicId: topic.id } }),
  ]);

  const publishedQuestions = questions
    .filter((q) => q.status === "Published")
    .sort(byTitle);

  return { ...topic, category, questions: publishedQuestions };
}

// Full navigation tree for the sidebar: every category with its topics nested.
// Shape: [{ id, name, slug, topics: [{ id, name, slug }] }]
export async function getNavTree() {
  const [categories, topics] = await Promise.all([
    db.categories.findMany(),
    db.topics.findMany(),
  ]);
  return categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      topics: topics
        .filter((t) => t.categoryId === c.id)
        .map((t) => ({ id: t.id, name: t.name, slug: t.slug }))
        .sort(byName),
    }))
    .sort(byName);
}

// A single question by slug, with its parent topic and category (for the
// breadcrumb). Returns null if not found.
export async function getQuestionBySlug(slug) {
  const question = await db.questions.findUnique({ slug });
  if (!question) return null;

  const topic = await db.topics.findById(question.topicId);
  const category = topic ? await db.categories.findById(topic.categoryId) : null;

  return { ...question, topic, category };
}

// Increment a question's view count by id. Best-effort: never throws to the
// page (a failed view bump shouldn't break rendering).
export async function incrementQuestionViews(id) {
  try {
    const q = await db.questions.findById(id);
    if (!q) return;
    await db.questions.update(id, { views: (q.views ?? 0) + 1 });
  } catch {
    // ignore — view counting is non-critical
  }
}

// Search Published questions by title (and tags) for the header search box.
// Returns lightweight suggestion objects including the topic slug so the UI can
// link to the right topic page. `limit` caps the number of suggestions.
export async function searchQuestions(rawQuery, limit = 8) {
  const q = (rawQuery || "").trim().toLowerCase();
  if (!q) return [];

  const [questions, topics] = await Promise.all([
    db.questions.findMany({ where: { status: "Published" } }),
    db.topics.findMany(),
  ]);
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const scored = [];
  for (const question of questions) {
    const title = question.title.toLowerCase();
    const tags = (question.tags || []).join(" ").toLowerCase();

    let score = 0;
    if (title.startsWith(q)) score = 3;
    else if (title.includes(q)) score = 2;
    else if (tags.includes(q)) score = 1;
    if (score === 0) continue;

    const topic = topicById.get(question.topicId);
    scored.push({
      id: question.id,
      title: question.title,
      slug: question.slug,
      difficulty: question.difficulty,
      isPremium: question.isPremium,
      topicSlug: topic?.slug ?? null,
      topicName: topic?.name ?? null,
      score,
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
