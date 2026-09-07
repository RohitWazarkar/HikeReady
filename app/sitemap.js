// Generates /sitemap.xml automatically from the data so Google can discover
// every category and topic page. Next.js serves this at /sitemap.xml.

import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";

// Generate at request time so the build never has to connect to the DB.
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const base = getSiteUrl();
  const now = new Date();

  // If the DB is unreachable, still return a valid sitemap (home only).
  let categories = [];
  let topics = [];
  try {
    [categories, topics] = await Promise.all([
      db.categories.findMany(),
      db.topics.findMany(),
    ]);
  } catch {
    // ignore — return the minimal sitemap below
  }

  const staticUrls = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  const categoryUrls = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const topicUrls = topics.map((t) => ({
    url: `${base}/topic/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticUrls, ...categoryUrls, ...topicUrls];
}
