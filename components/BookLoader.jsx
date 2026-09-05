// The page loader. Uses a GIF asset (public/loader.gif) with the pulsing
// caption underneath. Kept the name "BookLoader" so callers don't change.
//
// Note: a plain <img> is used (not next/image) because animated GIFs are not
// optimized/animated by next/image — <img> preserves the animation.
export function BookLoader({ caption = "Loading…" }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <img
        src="/loader.gif"
        alt="Loading"
        width={96}
        height={96}
        className="h-24 w-24 object-contain"
        aria-hidden="true"
      />
      {caption ? <span className="loading-caption">{caption}</span> : null}
    </div>
  );
}
