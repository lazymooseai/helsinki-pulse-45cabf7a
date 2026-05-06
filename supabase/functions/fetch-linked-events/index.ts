import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkedEvent {
  id: string;
  [key: string]: unknown;
}

interface LinkedResponse {
  data?: LinkedEvent[];
}

type QueryBody = {
  queries?: Record<string, string>[];
};

async function fetchLinkedPage(query: Record<string, string>): Promise<LinkedEvent[]> {
  const params = new URLSearchParams(query);
  const res = await fetch(`https://api.hel.fi/linkedevents/v1/event/?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HelsinkiTaxiPulse/2.0",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) throw new Error(`LinkedEvents ${res.status}`);
  const json = (await res.json()) as LinkedResponse;
  return Array.isArray(json.data) ? json.data : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as QueryBody;
    const queries = (body.queries ?? []).slice(0, 24);

    const settled = await Promise.allSettled(queries.map(fetchLinkedPage));
    const byId = new Map<string, LinkedEvent>();
    let failures = 0;

    for (const result of settled) {
      if (result.status === "fulfilled") {
        for (const event of result.value) byId.set(event.id, event);
      } else {
        failures += 1;
      }
    }

    return new Response(
      JSON.stringify({
        data: [...byId.values()],
        count: byId.size,
        failures,
        source: "linkedevents-proxy",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        data: [],
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});