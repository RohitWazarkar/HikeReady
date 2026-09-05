"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoadingOverlay } from "./LoadingOverlay";

// Shows the blurred book-loader overlay during client-side route navigation.
//
// How it works:
//  - We listen for clicks on internal links (same-origin <a> that change the
//    path). On such a click we show the overlay immediately for instant feedback.
//  - When usePathname() changes (the new page has rendered), we hide it.
//  - A safety timeout hides the overlay if navigation is cancelled/very fast,
//    so it can never get stuck on screen.
export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Hide whenever the path actually changes (navigation finished).
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e) {
      // Ignore modified clicks (new tab, etc.) and non-left clicks.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = e.target.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || target === "_blank") return;
      // Only intercept internal path navigations.
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Ignore pure hash links / same-page anchors.
      if (href.startsWith("#")) return;

      // Strip hash for comparison; skip if navigating to the same path.
      const [hrefPath] = href.split("#");
      if (hrefPath === pathname) return;

      setLoading(true);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  // Safety net: never let the overlay linger more than a few seconds.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;
  return <LoadingOverlay />;
}
