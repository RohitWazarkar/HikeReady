import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { getNavTree } from "@/lib/queries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HikeReady",
  description: "HikeReady - interview prep to level up your career.",
};

export default async function RootLayout({ children }) {
  const nav = await getNavTree();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <AppShell nav={nav}>
          {children}
          <Footer />
        </AppShell>
      </body>
    </html>
  );
}
