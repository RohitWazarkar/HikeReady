import { BookLoader } from "./BookLoader";

// Full-screen blurred backdrop with the book loader centered.
// Used both by the client navigation trigger and Next.js loading.js files.
export function LoadingOverlay({ caption = "Turning the page…" }) {
  return (
    <div className="loading-overlay">
      <BookLoader caption={caption} />
    </div>
  );
}
