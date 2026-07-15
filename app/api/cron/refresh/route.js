import { refreshTrending, seedFromSnapshot } from "@/lib/refreshers";
import { readCached } from "@/lib/screenerStore";

// Daily seeding cron (vercel.json). Vercel Hobby allows one daily run; this
// guarantees the DB is never empty — minute-level freshness comes from the
// stale-while-revalidate reads. Seeds trending for every chain plus the top
// trending tokens per chain (no per-token GT calls: rows come from the
// snapshot payloads themselves).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TIME_BUDGET_MS = 45_000;
const GT_PACE_MS = 1_200; // stay under GT's per-minute rate limit
const NETWORKS = ["", "solana", "eth", "bsc", "base", "robinhood", "arbitrum", "polygon_pos", "avax", "optimism", "linea", "fantom", "pulsechain", "ronin"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function GET(req) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET> when the env var is
  // set. In production the secret is mandatory; locally it may be unset.
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 401 });
  }
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const results = [];

  // Page 2 of the all-networks list widens coverage of the homepage.
  const jobs = [...NETWORKS.map((n) => ({ network: n, page: 1 })), { network: "", page: 2 }];

  for (const { network, page } of jobs) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      results.push({ network: network || "all", page, status: "skipped:time" });
      continue;
    }
    try {
      let snapshot = await refreshTrending(network, page);
      if (snapshot === false) {
        // Cooldown held (recent visitor refresh) — snapshot in DB is fresh.
        snapshot = (await readCached("trending", { network, page }))?.payload;
      }
      const seeded = snapshot ? await seedFromSnapshot(network, snapshot) : { tokens: 0 };
      results.push({ network: network || "all", page, status: "ok", seededTokens: seeded.tokens });
    } catch (e) {
      results.push({ network: network || "all", page, status: `error:${e?.status || e?.message || "unknown"}` });
    }
    await sleep(GT_PACE_MS);
  }

  const summary = { tookMs: Date.now() - started, results };
  console.log("[cron/refresh]", JSON.stringify(summary));
  return Response.json(summary);
}
