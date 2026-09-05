// Demo API route backed by the JSON "database" (lib/db.js + lib/schema.js).
// GET  /api/questions  -> list questions (optional ?status=Published filter)
// POST /api/questions  -> create a question
//     body: { topicId, title, slug, bodyMd?, answerMd?, difficulty?, tags?,
//             isPremium?, status? }
//
// When we move to Prisma later, only lib/db.js changes; this file stays the same.

import { db, DbError } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = status ? { status } : undefined;
  const questions = await db.questions.findMany({ where });
  return Response.json({ questions });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const question = await db.questions.create({
      topicId: body?.topicId,
      title: body?.title,
      slug: body?.slug,
      bodyMd: body?.bodyMd,
      answerMd: body?.answerMd,
      difficulty: body?.difficulty,
      tags: body?.tags,
      isPremium: body?.isPremium,
      status: body?.status,
    });
    return Response.json({ question }, { status: 201 });
  } catch (err) {
    if (err instanceof DbError) {
      // Validation / constraint errors -> 400 with a clear message.
      return Response.json({ error: err.message, code: err.code }, { status: 400 });
    }
    throw err;
  }
}
