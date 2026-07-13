import { waitUntil } from "@vercel/functions";

// Run work after the response is sent, without blocking it. On Vercel,
// waitUntil keeps the function alive until the promise settles; locally the
// detached promise just runs on the long-lived dev/start process.
export function afterResponse(work) {
  const p = Promise.resolve()
    .then(work)
    .catch((e) => console.error("[refresh] background error:", e?.message || e));
  try {
    waitUntil(p);
  } catch {
    // Not on Vercel — detached promise is enough.
  }
}
