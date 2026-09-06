// -----------------------------------------------------------------------------
// One-time migration: copy data/*.json into the Postgres (Supabase) database
// via Prisma. Keeps the existing JSON ids so all foreign keys line up.
//
// - FK-safe order: categories -> topics -> questions -> users -> plans ->
//   bookmarks/progress/comments -> subscriptions -> payments.
// - Idempotent: uses upsert, so re-running won't duplicate.
// - Does NOT delete the JSON files (kept as an offline fallback).
//
// Run (Windows, behind corporate proxy needs the TLS flag):
//   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; node scripts/migrate-json-to-db.mjs
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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

// Coerce an ISO string (or undefined) to a Date (or undefined).
const d = (v) => (v ? new Date(v) : undefined);

async function main() {
  console.log("Migrating JSON -> Postgres...\n");

  const [
    categories,
    topics,
    questions,
    users,
    plans,
    bookmarks,
    progress,
    comments,
    subscriptions,
    payments,
  ] = await Promise.all([
    readJson("categories"),
    readJson("topics"),
    readJson("questions"),
    readJson("users"),
    readJson("plans"),
    readJson("bookmarks"),
    readJson("progress"),
    readJson("comments"),
    readJson("subscriptions"),
    readJson("payments"),
  ]);

  // 1. Categories
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        createdAt: d(c.createdAt),
      },
    });
  }
  console.log(`categories: ${categories.length}`);

  // 2. Topics
  for (const t of topics) {
    await prisma.topic.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        slug: t.slug,
        categoryId: t.categoryId,
        createdAt: d(t.createdAt),
      },
    });
  }
  console.log(`topics: ${topics.length}`);

  // 3. Questions
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        title: q.title,
        slug: q.slug,
        bodyMd: q.bodyMd ?? "",
        answerMd: q.answerMd ?? "",
        difficulty: q.difficulty ?? "Easy",
        tags: Array.isArray(q.tags) ? q.tags : [],
        isPremium: !!q.isPremium,
        status: q.status ?? "Draft",
        views: q.views ?? 0,
        topicId: q.topicId,
        createdAt: d(q.createdAt),
        updatedAt: d(q.updatedAt) ?? d(q.createdAt),
      },
    });
  }
  console.log(`questions: ${questions.length}`);

  // 4. Users
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        supabaseId: u.supabaseId ?? null,
        name: u.name,
        email: u.email,
        role: u.role ?? "Learner",
        avatarUrl: u.avatarUrl || null,
        createdAt: d(u.createdAt),
        lastLoginAt: d(u.lastLoginAt),
      },
    });
  }
  console.log(`users: ${users.length}`);

  // 5. Plans
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        price: p.price,
        durationDays: p.durationDays,
        features: Array.isArray(p.features) ? p.features : [],
        createdAt: d(p.createdAt),
      },
    });
  }
  console.log(`plans: ${plans.length}`);

  // 6a. Bookmarks
  for (const b of bookmarks) {
    await prisma.bookmark.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        userId: b.userId,
        questionId: b.questionId,
        createdAt: d(b.createdAt),
      },
    });
  }
  console.log(`bookmarks: ${bookmarks.length}`);

  // 6b. Progress
  for (const pr of progress) {
    await prisma.progress.upsert({
      where: { id: pr.id },
      update: {},
      create: {
        id: pr.id,
        state: pr.state,
        userId: pr.userId,
        questionId: pr.questionId,
        createdAt: d(pr.createdAt),
        updatedAt: d(pr.updatedAt) ?? d(pr.createdAt),
      },
    });
  }
  console.log(`progress: ${progress.length}`);

  // 6c. Comments
  for (const cm of comments) {
    await prisma.comment.upsert({
      where: { id: cm.id },
      update: {},
      create: {
        id: cm.id,
        body: cm.body,
        userId: cm.userId,
        questionId: cm.questionId,
        createdAt: d(cm.createdAt),
      },
    });
  }
  console.log(`comments: ${comments.length}`);

  // 7. Subscriptions
  for (const s of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        status: s.status ?? "Pending",
        startDate: d(s.startDate),
        endDate: d(s.endDate),
        userId: s.userId,
        planId: s.planId,
        createdAt: d(s.createdAt),
      },
    });
  }
  console.log(`subscriptions: ${subscriptions.length}`);

  // 8. Payments
  for (const pay of payments) {
    await prisma.payment.upsert({
      where: { id: pay.id },
      update: {},
      create: {
        id: pay.id,
        orderId: pay.orderId,
        paymentId: pay.paymentId ?? "",
        amount: pay.amount,
        currency: pay.currency ?? "INR",
        status: pay.status ?? "Created",
        userId: pay.userId,
        createdAt: d(pay.createdAt),
      },
    });
  }
  console.log(`payments: ${payments.length}`);

  console.log("\nMigration complete.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
