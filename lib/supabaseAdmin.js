// Server-side Supabase clients. Import from API routes and lib/ only — never
// from client components (keys must not reach the browser).
//
// Reads use the anon key (tables keep public read policies); writes REQUIRE
// the service-role key. When SUPABASE_SERVICE_ROLE_KEY is absent,
// supabaseWrite is null and the store's write paths skip gracefully — the
// site keeps serving whatever is cached, it just stops refreshing.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

const mk = (key) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Next.js patches global fetch and will cache GET responses in its
      // Data Cache — which would freeze every Supabase read at its
      // first-ever value. Always bypass it: our freshness model lives in
      // the rows themselves (updated_at + TTLs), not in an HTTP cache.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });

/** Read client: service role when available (one connection pool), else anon. */
export const supabase = url && (serviceKey || anonKey) ? mk(serviceKey || anonKey) : null;

/** Write client: service role ONLY. Null when the key isn't configured. */
export const supabaseWrite = url && serviceKey ? supabase : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and a key"
    );
  }
  return supabase;
}

let warnedNoWrite = false;
/** Returns the write client, or null (with a one-time log) when unavailable. */
export function writeClient() {
  if (!supabaseWrite && !warnedNoWrite) {
    warnedNoWrite = true;
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY not set — cache writes disabled, serving reads only"
    );
  }
  return supabaseWrite;
}
