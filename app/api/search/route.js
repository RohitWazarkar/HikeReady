// GET /api/search?q=<term>  -> live question suggestions for the header search.
import { searchQuestions } from "@/lib/queries";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const results = await searchQuestions(q, 8);
  return Response.json({ results });
}
