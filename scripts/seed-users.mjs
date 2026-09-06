// Seeds sample users (one per role), a Pro plan, and an active subscription for
// the Pro user — so the structure is clear ahead of the Supabase migration.
//
// Idempotent: skips records whose unique key already exists. Does NOT touch
// questions/categories/topics.
//
// Run:  node scripts/seed-users.mjs

import { db } from "../lib/db.js";

async function ensureUser(data) {
  const existing = await db.users.findUnique({ email: data.email });
  if (existing) {
    console.log(`  user exists: ${data.email}`);
    return existing;
  }
  const u = await db.users.create(data);
  console.log(`  + user: ${data.email} (${data.role})`);
  return u;
}

async function ensurePlan(data) {
  const existing = await db.plans.findUnique({ name: data.name });
  if (existing) {
    console.log(`  plan exists: ${data.name}`);
    return existing;
  }
  const p = await db.plans.create(data);
  console.log(`  + plan: ${data.name}`);
  return p;
}

async function main() {
  console.log("Seeding sample users, plan, subscription...");

  // One user per role. supabaseId left blank for now; it gets set on first
  // real login once Supabase Auth is wired up.
  const admin = await ensureUser({
    name: "HikeReady Admin",
    email: "admin@hikeready.dev",
    role: "Admin",
    avatarUrl: "",
  });

  const learner = await ensureUser({
    name: "Sample Learner",
    email: "learner@hikeready.dev",
    role: "Learner",
    avatarUrl: "",
  });

  const pro = await ensureUser({
    name: "Sample Pro",
    email: "pro@hikeready.dev",
    role: "Pro",
    avatarUrl: "",
  });

  // A Pro plan (price in paise: 49900 = ₹499).
  const plan = await ensurePlan({
    name: "Pro Monthly",
    price: 49900,
    durationDays: 30,
    features: [
      "Access to all Hard questions",
      "All premium questions unlocked",
      "Priority AI assistant",
    ],
  });

  // An ACTIVE subscription for the Pro user (endDate 30 days out).
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const existingSub = (await db.subscriptions.findMany({
    where: { userId: pro.id },
  })).find((s) => s.status === "Active");

  if (existingSub) {
    console.log("  subscription exists for Pro user");
  } else {
    await db.subscriptions.create({
      userId: pro.id,
      planId: plan.id,
      status: "Active",
      startDate: now.toISOString(),
      endDate: end.toISOString(),
    });
    console.log("  + active subscription for Pro user");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
