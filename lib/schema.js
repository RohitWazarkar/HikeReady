// -----------------------------------------------------------------------------
// HikeReady data schema (JSON-file edition).
//
// This file is the JSON equivalent of prisma/schema.prisma. It describes every
// "model" (collection), its enums, unique constraints, indexes, and relations.
// lib/db.js reads this metadata to validate writes and enforce constraints that
// a real database would normally handle for us.
//
// When we migrate to Prisma later, this file maps 1:1 to schema.prisma:
//   - `enums` here            -> `enum` blocks in Prisma
//   - each `models` entry     -> a `model` block
//   - `unique`                -> @unique / @@unique
//   - `indexes`               -> @@index
//   - `relations`             -> relation fields + foreign keys
// -----------------------------------------------------------------------------

// --- Enums (allowed value sets, like Postgres enum types) -------------------
export const enums = {
  Difficulty: ["Easy", "Medium", "Hard"],
  QuestionStatus: ["Draft", "Published", "Archived"],
  UserRole: ["Learner", "Pro", "Admin"],
  ProgressState: ["Solved", "Attempted", "ToReview"],
  SubscriptionStatus: ["Active", "Cancelled", "Expired", "Pending"],
  PaymentStatus: ["Created", "Paid", "Failed", "Refunded"],
};

// --- Models -----------------------------------------------------------------
// For each model:
//   file      : the JSON file under /data
//   prefix    : id prefix (ids look like "cat_1a2b3c4d")
//   fields    : field name -> definition
//                 type     : "string" | "int" | "float" | "bool" | "string[]"
//                            | "datetime" | "enum"
//                 enum     : name of the enum in `enums` (when type === "enum")
//                 required : must be present & non-empty on create (default false)
//                 default  : value (or () => value) applied when omitted
//   unique    : array of unique constraints. Each entry is a field name (single
//               column) or an array of field names (composite unique).
//   indexes   : array of fields (or field arrays) that are frequently queried.
//               In JSON these are advisory (documented for the Prisma migration)
//               but db.js also builds in-memory maps for them.
//   relations : field -> { model, onField } describing a foreign key. Used to
//               validate that the referenced record exists.
//
// `id`, `createdAt`, and `updatedAt` are handled automatically by db.js, so you
// generally don't list them in `fields` unless you want a specific type note.
export const models = {
  categories: {
    file: "categories.json",
    prefix: "cat",
    fields: {
      name: { type: "string", required: true },
      slug: { type: "string", required: true },
      description: { type: "string" },
    },
    unique: ["slug", "name"],
    indexes: ["slug"],
    relations: {},
  },

  topics: {
    file: "topics.json",
    prefix: "top",
    fields: {
      categoryId: { type: "string", required: true },
      name: { type: "string", required: true },
      slug: { type: "string", required: true },
    },
    unique: ["slug"],
    indexes: ["categoryId", "slug"],
    relations: {
      categoryId: { model: "categories", onField: "id" },
    },
  },

  questions: {
    file: "questions.json",
    prefix: "q",
    fields: {
      topicId: { type: "string", required: true },
      title: { type: "string", required: true },
      slug: { type: "string", required: true },
      bodyMd: { type: "string", default: "" },
      answerMd: { type: "string", default: "" },
      difficulty: { type: "enum", enum: "Difficulty", default: "Easy" },
      tags: { type: "string[]", default: () => [] },
      isPremium: { type: "bool", default: false },
      status: { type: "enum", enum: "QuestionStatus", default: "Draft" },
      views: { type: "int", default: 0 },
    },
    unique: ["slug"],
    indexes: ["topicId", "slug", "status", "difficulty"],
    relations: {
      topicId: { model: "topics", onField: "id" },
    },
    // questions get an updatedAt maintained automatically
    timestamps: { createdAt: true, updatedAt: true },
  },

  users: {
    file: "users.json",
    prefix: "u",
    fields: {
      // Links to the Supabase Auth user id (set on first login). Optional now.
      supabaseId: { type: "string" },
      name: { type: "string", required: true },
      email: { type: "string", required: true },
      role: { type: "enum", enum: "UserRole", default: "Learner" },
      avatarUrl: { type: "string" },
      lastLoginAt: { type: "datetime" },
    },
    unique: ["email", "supabaseId"],
    indexes: ["email", "role", "supabaseId"],
    relations: {},
  },

  bookmarks: {
    file: "bookmarks.json",
    prefix: "bm",
    fields: {
      userId: { type: "string", required: true },
      questionId: { type: "string", required: true },
    },
    // A user can bookmark a question only once.
    unique: [["userId", "questionId"]],
    indexes: ["userId", "questionId"],
    relations: {
      userId: { model: "users", onField: "id" },
      questionId: { model: "questions", onField: "id" },
    },
  },

  progress: {
    file: "progress.json",
    prefix: "prg",
    fields: {
      userId: { type: "string", required: true },
      questionId: { type: "string", required: true },
      state: { type: "enum", enum: "ProgressState", required: true },
    },
    // One progress row per user+question.
    unique: [["userId", "questionId"]],
    indexes: ["userId", "questionId", "state"],
    relations: {
      userId: { model: "users", onField: "id" },
      questionId: { model: "questions", onField: "id" },
    },
    timestamps: { createdAt: true, updatedAt: true },
  },

  comments: {
    file: "comments.json",
    prefix: "cm",
    fields: {
      userId: { type: "string", required: true },
      questionId: { type: "string", required: true },
      body: { type: "string", required: true },
    },
    unique: [],
    indexes: ["userId", "questionId"],
    relations: {
      userId: { model: "users", onField: "id" },
      questionId: { model: "questions", onField: "id" },
    },
  },

  plans: {
    file: "plans.json",
    prefix: "pl",
    fields: {
      name: { type: "string", required: true },
      price: { type: "int", required: true }, // store in paise/cents (integer)
      durationDays: { type: "int", required: true },
      features: { type: "string[]", default: () => [] },
    },
    unique: ["name"],
    indexes: ["name"],
    relations: {},
  },

  subscriptions: {
    file: "subscriptions.json",
    prefix: "sub",
    fields: {
      userId: { type: "string", required: true },
      planId: { type: "string", required: true },
      status: { type: "enum", enum: "SubscriptionStatus", default: "Pending" },
      startDate: { type: "datetime", default: () => new Date().toISOString() },
      endDate: { type: "datetime" },
    },
    unique: [],
    indexes: ["userId", "planId", "status"],
    relations: {
      userId: { model: "users", onField: "id" },
      planId: { model: "plans", onField: "id" },
    },
  },

  payments: {
    file: "payments.json",
    prefix: "pay",
    fields: {
      userId: { type: "string", required: true },
      orderId: { type: "string", required: true }, // Razorpay order id
      paymentId: { type: "string", default: "" }, // Razorpay payment id
      amount: { type: "int", required: true }, // in paise/cents
      currency: { type: "string", default: "INR" },
      status: { type: "enum", enum: "PaymentStatus", default: "Created" },
    },
    unique: ["orderId"],
    indexes: ["userId", "orderId", "paymentId", "status"],
    relations: {
      userId: { model: "users", onField: "id" },
    },
  },
};
