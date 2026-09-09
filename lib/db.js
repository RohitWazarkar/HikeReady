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
import { getDataSourceMode } from "./dataSourceMode.js";

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
  sections: "section",
  domains: "domain",
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

// CONTENT is served from JSON files (fast, no DB round-trip, no connection
// limits). The DB stays available for user/logic collections (users, bookmarks,
// progress, comments, plans, subscriptions, payments) which need real writes.
// To move a collection back onto the DB later, remove it from this set.
const CONTENT_COLLECTIONS = new Set([
  "sections",
  "domains",
  "categories",
  "topics",
  "questions",
  "contactMessages",
]);

// Run a Prisma operation; on ANY DB error, fall back to the JSON layer.
// Honors the user's data-source mode:
//   "offline" -> JSON only (skip Prisma entirely)
//   "online"/"auto" -> DB first, JSON fallback on failure
// A DbError (validation/constraint) is a real user error, so it's rethrown.
async function withFallback(prismaFn, jsonFn) {
  const mode = await getDataSourceMode();

  // Forced offline: read straight from JSON, never touch the DB.
  if (mode === "offline") {
    markSource("json");
    return jsonFn();
  }

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

  // JSON-only when:
  //  - it's a content collection (questions etc. — served from JSON by design), OR
  //  - Prisma has no model for it yet (e.g. sections/domains).
  const jsonOnly =
    CONTENT_COLLECTIONS.has(modelName) ||
    !delegateName ||
    typeof prisma[delegateName] === "undefined";
  if (jsonOnly) {
    markSource("json");
    return {
      findMany: (opts) => json.findMany(opts ?? {}),
      findById: (id) => json.findById(id),
      findUnique: (where) => json.findUnique(where),
      count: (opts) => json.count(opts ?? {}),
      create: (data) => json.create(data),
      update: (id, data) => json.update(id, data),
      remove: (id) => json.remove(id),
    };
  }

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

// Lightweight health probe used by the status indicators. Returns "db" if
// serving from Postgres, "json" if forced offline or the DB is unreachable.
// Never hangs: if there's no DATABASE_URL, or the probe takes too long, it
// falls back to "json" so rendering (and the build) can't stall on the DB.
export async function getDataSourceStatus() {
  const mode = await getDataSourceMode();
  if (mode === "offline") return "json";
  if (!process.env.DATABASE_URL) return "json";
  try {
    const probe = prisma.category.count();
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("probe timeout")), 3000)
    );
    await Promise.race([probe, timeout]);
    return "db";
  } catch {
    return "json";
  }
}
