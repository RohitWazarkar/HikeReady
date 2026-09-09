import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { getNavTree, getDomainsForSection, INTERVIEW_SECTION_ID } from "@/lib/queries";
import { SITE, getSiteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rich SEO metadata. Next.js turns this into <title>, <meta>, Open Graph, and
// Twitter tags automatically. metadataBase makes relative URLs absolute.
export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    // Child pages set just their name; this appends the brand.
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  category: "education",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: getSiteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Render at request time, never at build time. This app reads the database and
// a cookie (data-source mode), so it must not be statically prerendered — that
// would make `next build` try to connect to the DB and fail.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const [nav, domains] = await Promise.all([
    getNavTree(),
    getDomainsForSection(INTERVIEW_SECTION_ID),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <ToastProvider>
          <AppShell nav={nav} domains={domains}>
            {children}
            <Footer />
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
