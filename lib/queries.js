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

// Common words to ignore when matching individual keywords (so a natural
// question like "explain acid properties" still finds the ACID question).
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "of", "to", "in", "on", "for",
  "and", "or", "what", "whats", "how", "why", "when", "which", "explain",
  "describe", "tell", "me", "about", "difference", "between", "vs", "do", "does",
  "can", "you", "your", "with", "give", "define", "definition", "please",
]);

// Search Published questions for both the header search box and the chatbot.
// Matches the whole query as a phrase (strongest) AND individual keywords, so
// natural-language questions ("explain ACID properties") still find the right
// question. Returns lightweight objects incl. the topic slug for linking.
// `limit` caps the number of results.
export async function searchQuestions(rawQuery, limit = 8) {
  const q = (rawQuery || "").trim().toLowerCase();
  if (!q) return [];

  // Meaningful keywords: length >= 3 and not a stop word.
  const keywords = [
    ...new Set(
      q
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    ),
  ];

  const [questions, topics] = await Promise.all([
    db.questions.findMany({ where: { status: "Published" } }),
    db.topics.findMany(),
  ]);
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const scored = [];
  for (const question of questions) {
    const title = question.title.toLowerCase();
    const tags = (question.tags || []).join(" ").toLowerCase();
    const hay = `${title} ${tags}`;

    let score = 0;
    // Whole-phrase matches (strongest).
    if (title.startsWith(q)) score += 6;
    else if (title.includes(q)) score += 4;
    else if (tags.includes(q)) score += 2;

    // Per-keyword matches (so full-sentence questions still hit).
    for (const kw of keywords) {
      if (title.includes(kw)) score += 2;
      else if (hay.includes(kw)) score += 1;
    }

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

// Dashboard-style stats + highlights for the home page.
export async function getHomeStats() {
  const [categories, topics, questions] = await Promise.all([
    db.categories.findMany(),
    db.topics.findMany(),
    db.questions.findMany({ where: { status: "Published" } }),
  ]);

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const catById = new Map(categories.map((c) => [c.id, c]));

  // Difficulty breakdown.
  const difficulty = { Easy: 0, Medium: 0, Hard: 0 };
  for (const q of questions) {
    if (difficulty[q.difficulty] !== undefined) difficulty[q.difficulty] += 1;
  }

  // Per-category counts (topics + questions), sorted by question count desc.
  const categoryStats = categories
    .map((c) => {
      const catTopics = topics.filter((t) => t.categoryId === c.id);
      const catTopicIds = new Set(catTopics.map((t) => t.id));
      const qCount = questions.filter((q) => catTopicIds.has(q.topicId)).length;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        topicCount: catTopics.length,
        questionCount: qCount,
      };
    })
    .sort((a, b) => b.questionCount - a.questionCount);

  // "Recently added" — newest questions by createdAt.
  const recent = [...questions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .map((q) => {
      const topic = topicById.get(q.topicId);
      const cat = topic ? catById.get(topic.categoryId) : null;
      return {
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        isPremium: q.isPremium,
        topicSlug: topic?.slug ?? null,
        categoryName: cat?.name ?? null,
      };
    });

  return {
    totals: {
      categories: categories.length,
      topics: topics.length,
      questions: questions.length,
      premium: questions.filter((q) => q.isPremium).length,
    },
    difficulty,
    categoryStats,
    recent,
  };
}

// All categories for the /practice page, each with topic + question counts and
// a difficulty spread. Sorted by question count (richest first).
export async function getPracticeCategories() {
  const [categories, topics, questions] = await Promise.all([
    db.categories.findMany(),
    db.topics.findMany(),
    db.questions.findMany({ where: { status: "Published" } }),
  ]);

  return categories
    .map((c) => {
      const catTopics = topics.filter((t) => t.categoryId === c.id);
      const catTopicIds = new Set(catTopics.map((t) => t.id));
      const catQuestions = questions.filter((q) => catTopicIds.has(q.topicId));
      const difficulty = { Easy: 0, Medium: 0, Hard: 0 };
      for (const q of catQuestions) {
        if (difficulty[q.difficulty] !== undefined) difficulty[q.difficulty] += 1;
      }
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        topicCount: catTopics.length,
        questionCount: catQuestions.length,
        difficulty,
      };
    })
    .sort((a, b) => b.questionCount - a.questionCount);
}
