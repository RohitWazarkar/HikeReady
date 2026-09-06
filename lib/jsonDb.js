// -----------------------------------------------------------------------------
// JSON-file data layer for HikeReady (the OFFLINE FALLBACK).
//
// This reads/writes plain JSON files under /data and enforces schema rules
// (enums, required, unique, relations, defaults). It used to be the primary
// data source; now lib/db.js uses Prisma (Supabase) as primary and falls back
// to THIS layer if the database is unavailable — so the site never goes down.
//
// Public API (matches lib/db.js):
//   jsonDb.questions.findMany({ where }) / findUnique(where) / findById(id)
//   jsonDb.questions.count({ where }) / create(data) / update(id, data) / remove(id)
//
// Server-only (uses Node's fs).
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { models, enums } from "./schema.js";

const DATA_DIR = path.join(process.cwd(), "data");

// Error type thrown on constraint/validation failures so callers can catch it.
export class DbError extends Error {
  constructor(message, code = "DB_ERROR") {
    super(message);
    this.name = "DbError";
    this.code = code;
  }
}

// --- Low-level file IO ------------------------------------------------------
async function readFileArray(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeFileArray(fileName, items) {
  const filePath = path.join(DATA_DIR, fileName);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(items, null, 2) + "\n", "utf8");
}

// --- Validation helpers -----------------------------------------------------
function resolveDefault(def) {
  return typeof def === "function" ? def() : def;
}

function validateField(modelName, fieldName, def, value) {
  switch (def.type) {
    case "string":
      if (typeof value !== "string")
        throw new DbError(`${modelName}.${fieldName} must be a string`, "TYPE");
      return value;
    case "int":
      if (!Number.isInteger(value))
        throw new DbError(`${modelName}.${fieldName} must be an integer`, "TYPE");
      return value;
    case "float":
      if (typeof value !== "number")
        throw new DbError(`${modelName}.${fieldName} must be a number`, "TYPE");
      return value;
    case "bool":
      if (typeof value !== "boolean")
        throw new DbError(`${modelName}.${fieldName} must be a boolean`, "TYPE");
      return value;
    case "string[]":
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string"))
        throw new DbError(`${modelName}.${fieldName} must be an array of strings`, "TYPE");
      return value;
    case "datetime":
      if (typeof value !== "string" || Number.isNaN(Date.parse(value)))
        throw new DbError(`${modelName}.${fieldName} must be an ISO date string`, "TYPE");
      return value;
    case "enum": {
      const allowed = enums[def.enum] ?? [];
      if (!allowed.includes(value))
        throw new DbError(
          `${modelName}.${fieldName} must be one of: ${allowed.join(", ")}`,
          "ENUM"
        );
      return value;
    }
    default:
      return value;
  }
}

function buildRecord(modelName, spec, data, { partial = false } = {}) {
  const out = {};
  for (const [fieldName, def] of Object.entries(spec.fields)) {
    const provided = Object.prototype.hasOwnProperty.call(data, fieldName);

    if (!provided) {
      if (partial) continue;
      if (def.default !== undefined) {
        out[fieldName] = resolveDefault(def.default);
        continue;
      }
      if (def.required)
        throw new DbError(`${modelName}.${fieldName} is required`, "REQUIRED");
      continue;
    }

    const value = data[fieldName];
    if (value === null || value === undefined) {
      if (def.required)
        throw new DbError(`${modelName}.${fieldName} is required`, "REQUIRED");
      continue;
    }
    out[fieldName] = validateField(modelName, fieldName, def, value);
  }
  return out;
}

function checkUnique(spec, modelName, items, candidate, excludeId = null) {
  for (const constraint of spec.unique ?? []) {
    const cols = Array.isArray(constraint) ? constraint : [constraint];
    if (cols.some((c) => candidate[c] === undefined)) continue;
    const clash = items.find(
      (row) => row.id !== excludeId && cols.every((c) => row[c] === candidate[c])
    );
    if (clash) {
      throw new DbError(
        `${modelName} unique constraint failed on: ${cols.join(" + ")}`,
        "UNIQUE"
      );
    }
  }
}

async function checkRelations(spec, modelName, candidate) {
  for (const [fieldName, rel] of Object.entries(spec.relations ?? {})) {
    const fk = candidate[fieldName];
    if (fk === undefined || fk === null) continue;
    const target = await readFileArray(models[rel.model].file);
    const exists = target.some((row) => row[rel.onField] === fk);
    if (!exists) {
      throw new DbError(
        `${modelName}.${fieldName} references missing ${rel.model} (${fk})`,
        "RELATION"
      );
    }
  }
}

function matchesWhere(row, where) {
  return Object.entries(where).every(([key, val]) => {
    const cell = row[key];
    if (Array.isArray(cell)) return cell.includes(val);
    return cell === val;
  });
}

function makeCollection(modelName, spec) {
  const { file, prefix } = spec;
  const ts = spec.timestamps ?? { createdAt: true, updatedAt: false };

  return {
    async findMany({ where } = {}) {
      const items = await readFileArray(file);
      return where ? items.filter((row) => matchesWhere(row, where)) : items;
    },
    async findById(id) {
      const items = await readFileArray(file);
      return items.find((row) => row.id === id) ?? null;
    },
    async findUnique(where) {
      const items = await readFileArray(file);
      return items.find((row) => matchesWhere(row, where)) ?? null;
    },
    async count({ where } = {}) {
      const items = await readFileArray(file);
      return where ? items.filter((row) => matchesWhere(row, where)).length : items.length;
    },
    async create(data) {
      const items = await readFileArray(file);
      const record = buildRecord(modelName, spec, data);
      record.id = `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
      if (ts.createdAt) record.createdAt = new Date().toISOString();
      if (ts.updatedAt) record.updatedAt = record.createdAt ?? new Date().toISOString();
      await checkRelations(spec, modelName, record);
      checkUnique(spec, modelName, items, record);
      items.push(record);
      await writeFileArray(file, items);
      return record;
    },
    async update(id, data) {
      const items = await readFileArray(file);
      const index = items.findIndex((row) => row.id === id);
      if (index === -1) return null;
      const patch = buildRecord(modelName, spec, data, { partial: true });
      const merged = { ...items[index], ...patch };
      if (ts.updatedAt) merged.updatedAt = new Date().toISOString();
      await checkRelations(spec, modelName, merged);
      checkUnique(spec, modelName, items, merged, id);
      items[index] = merged;
      await writeFileArray(file, items);
      return merged;
    },
    async remove(id) {
      const items = await readFileArray(file);
      const next = items.filter((row) => row.id !== id);
      if (next.length === items.length) return false;
      await writeFileArray(file, next);
      return true;
    },
  };
}

// The JSON fallback db, keyed by model name (same shape as lib/db.js).
export const jsonDb = Object.fromEntries(
  Object.entries(models).map(([name, spec]) => [name, makeCollection(name, spec)])
);
