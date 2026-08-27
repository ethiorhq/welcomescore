import { NextResponse } from "next/server";
import { isLoungeGatewayConfigured } from "@/lib/loungeGateway";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isLoungeGatewayConfigured()) {
    return NextResponse.json({ ready: false }, { headers: { "Cache-Control": "no-store" } });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ready: false }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
    const baseUrl = `${url.replace(/\/$/, "")}/rest/v1`;
    const [columnsResponse, rateFunctionResponse] = await Promise.all([
      fetch(`${baseUrl}/lounge_messages?select=topic,community_context,visibility_state&limit=1`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${baseUrl}/rpc/consume_lounge_rate_event`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_session_hash: "health-probe",
          p_action: "context",
          p_limit: 0,
          p_window_seconds: 0,
        }),
        cache: "no-store",
      }),
    ]);
    return NextResponse.json(
      { ready: columnsResponse.ok && rateFunctionResponse.ok },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ready: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
