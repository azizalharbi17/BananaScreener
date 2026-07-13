// Server-side Supabase client. Import from API routes and lib/ only — never
// from client components (the service key must not reach the browser).
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          // Next.js patches global fetch and will cache GET responses in its
          // Data Cache — which would freeze every Supabase read at its
          // first-ever value. Always bypass it: our freshness model lives in
          // the rows themselves (updated_at + TTLs), not in an HTTP cache.
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and a key"
    );
  }
  return supabase;
}
