// -----------------------------------------------------------------------------
// HikeReady data layer — resilient DB access.
//
// STRATEGY:
//   * PRIMARY: Prisma / PostgreSQL (Supabase).
//   * FALLBACK: the JSON files (lib/jsonDb.js).
// If the database is unreachable or a query errors, we automatically serve from
// the JSON files instead — so the site NEVER goes down. The active source is
// tracked so the footer can show "Live database" vs "Offline mode (JSON)".
//
// Public API is unchanged (Prisma-shaped), so pages/queries need no edits:
//   db.questions.findMany({ where }) / findUnique(where) / findById(id)
//   db.questions.count({ where }) / create(data) / update(id, data) / remove(id)
//
// Server-only.
// -----------------------------------------------------------------------------

import { prisma } from "./prisma.js";
import { jsonDb, DbError } from "./jsonDb.js";
import { models, enums } from "./schema.js";

export { DbError };
export { models, enums } from "./schema.js";

// --- Active data-source tracking --------------------------------------------
// "db" = served from Postgres, "json" = served from JSON fallback, "unknown"
// before the first query runs.
let activeSource = "unknown";
export function getActiveSource() {
  return activeSource;
}
function markSource(src) {
  activeSource = src;
}

// Map JSON collection name (plural) -> Prisma model delegate (singular).
const PRISMA_MODEL = {
  categories: "category",
  topics: "topic",
  questions: "question",
  users: "user",
  bookmarks: "bookmark",
  progress: "progress",
  comments: "comment",
  plans: "plan",
  subscriptions: "subscription",
  payments: "payment",
};

// Run a Prisma operation; on ANY DB error, fall back to the JSON layer.
// `validationError` (a DbError) must NOT trigger fallback — it's a real user
// error (bad input / constraint), so we rethrow it.
async function withFallback(prismaFn, jsonFn) {
  try {
    const result = await prismaFn();
    markSource("db");
    return result;
  } catch (err) {
    // Validation/constraint errors from our own layer are real — don't fall back.
    if (err instanceof DbError) throw err;
    // Prisma "known request errors" like unique-violation are also real input
    // errors, not outages — surface them as DbError instead of falling back.
    if (err?.code && /^P2\d{3}$/.test(err.code)) {
      throw new DbError(err.message, err.code);
    }
    // Otherwise it's likely an outage/connection issue -> serve from JSON.
    console.error("[db] Prisma failed, falling back to JSON:", err?.message || err);
    markSource("json");
    return jsonFn();
  }
}

function makeCollection(modelName) {
  const delegateName = PRISMA_MODEL[modelName];
  const json = jsonDb[modelName];

  const delegate = () => prisma[delegateName];

  return {
    findMany({ where } = {}) {
      return withFallback(
        () => delegate().findMany(where ? { where } : undefined),
        () => json.findMany({ where })
      );
    },

    findById(id) {
      return withFallback(
        () => delegate().findUnique({ where: { id } }),
        () => json.findById(id)
      );
    },

    // Accepts any unique key object, e.g. { id }, { slug }, { email }.
    findUnique(where) {
      return withFallback(
        () => delegate().findUnique({ where }),
        () => json.findUnique(where)
      );
    },

    count({ where } = {}) {
      return withFallback(
        () => delegate().count(where ? { where } : undefined),
        () => json.count({ where })
      );
    },

    create(data) {
      // Writes go to the DB. If the DB is down, we also write to JSON so the
      // action still succeeds locally (and stays consistent with the fallback).
      return withFallback(
        () => delegate().create({ data }),
        () => json.create(data)
      );
    },

    update(id, data) {
      return withFallback(
        async () => {
          try {
            return await delegate().update({ where: { id }, data });
          } catch (err) {
            // Not found -> return null (matches JSON layer behavior).
            if (err?.code === "P2025") return null;
            throw err;
          }
        },
        () => json.update(id, data)
      );
    },

    remove(id) {
      return withFallback(
        async () => {
          try {
            await delegate().delete({ where: { id } });
            return true;
          } catch (err) {
            if (err?.code === "P2025") return false; // not found
            throw err;
          }
        },
        () => json.remove(id)
      );
    },
  };
}

// Build db.<modelName> for every model in the schema.
export const db = Object.fromEntries(
  Object.keys(models).map((name) => [name, makeCollection(name)])
);

// Lightweight health probe used by the footer status indicator. Returns
// "db" if a trivial query succeeds, otherwise "json".
export async function getDataSourceStatus() {
  try {
    await prisma.category.count();
    return "db";
  } catch {
    return "json";
  }
}
