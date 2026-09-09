// POST /api/contact — store a contact form submission AND email it.
// Body: { name, email, subject, message }
import { Resend } from "resend";
import { db, DbError, enums } from "@/lib/db";

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Best-effort email delivery. Never throws — the message is already stored, so
// a failed/absent email must not fail the request.
async function sendContactEmail({ name, email, subject, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.warn("[/api/contact] RESEND_API_KEY or CONTACT_TO_EMAIL not set — skipping email.");
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      // Free tier: this shared sender works without verifying a domain.
      from: "HikeReady Contact <onboarding@resend.dev>",
      to: [to],
      replyTo: email, // reply goes straight to the person who wrote in
      subject: `[HikeReady] ${subject} — from ${name}`,
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;font-size:14px;color:#18181b">
          <h2 style="margin:0 0 12px">New contact message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p style="margin-top:16px"><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:8px">${escapeHtml(message)}</p>
        </div>
      `,
      text: `New contact message\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });
    return true;
  } catch (err) {
    console.error("[/api/contact] email send failed:", err?.message || err);
    return false;
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body?.name || "").toString().trim();
  const email = (body?.email || "").toString().trim();
  const message = (body?.message || "").toString().trim();
  let subject = (body?.subject || "General").toString();
  if (!enums.ContactSubject.includes(subject)) subject = "General";

  // Validation.
  if (name.length < 2) {
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (message.length < 10) {
    return Response.json(
      { error: "Message should be at least 10 characters." },
      { status: 400 }
    );
  }

  // Store the message (best-effort — don't fail if the JSON store is read-only,
  // e.g. on serverless), then email it.
  let savedId = null;
  try {
    const saved = await db.contactMessages.create({ name, email, subject, message });
    savedId = saved.id;
  } catch (err) {
    if (err instanceof DbError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("[/api/contact] store failed:", err?.message || err);
    // Continue — we still try to email so the message isn't lost.
  }

  const emailed = await sendContactEmail({ name, email, subject, message });

  return Response.json({ ok: true, id: savedId, emailed }, { status: 201 });
}
