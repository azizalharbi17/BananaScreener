import { gtStats } from "@/lib/gtClient";

// Observability endpoint for the GT cache layer (hit/miss/stale counters).
// Counters are per server instance and reset on restart/cold start.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(gtStats());
}
