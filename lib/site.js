// Central site config used for SEO (metadata, canonical URLs, sitemap, robots).
//
// Set NEXT_PUBLIC_SITE_URL to your real domain in production (e.g. on Vercel:
//   NEXT_PUBLIC_SITE_URL=https://hikeready.vercel.app
// It falls back to localhost for local development.

export const SITE = {
  name: "HikeReady",
  // Short tagline used in titles/descriptions.
  tagline: "Interview prep to level up your career",
  description:
    "HikeReady is a free interview-prep site with curated questions and clear answers across DSA, DBMS, .NET, and JavaScript — with code samples, difficulty levels, and an AI assistant.",
  // Keywords help describe the site (minor SEO signal).
  keywords: [
    "interview preparation",
    "coding interview questions",
    "DSA interview",
    "DBMS interview questions",
    "SQL interview",
    ".NET interview questions",
    "C# interview",
    "JavaScript interview questions",
    "technical interview prep",
  ],
};

// The canonical base URL, without a trailing slash.
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

// Build an absolute URL for a path.
export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
