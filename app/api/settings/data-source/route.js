// POST /api/settings/data-source  { mode: "auto" | "online" | "offline" }
// Sets the data-source cookie so server components read from the chosen source.
import { cookies } from "next/headers";
import { DATA_SOURCE_COOKIE, MODES } from "@/lib/dataSourceMode";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = body?.mode;
  if (!MODES.includes(mode)) {
    return Response.json(
      { error: `mode must be one of: ${MODES.join(", ")}` },
      { status: 400 }
    );
  }

  const store = await cookies();
  store.set(DATA_SOURCE_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  return Response.json({ ok: true, mode });
}
