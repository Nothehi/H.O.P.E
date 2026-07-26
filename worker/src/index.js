/**
 * TURN credential endpoint for H.O.P.E.
 *
 * A minimal Cloudflare Worker that mints short-lived ICE server credentials
 * from Cloudflare Realtime TURN and returns them to the browser. The provider
 * API token stays here as a Worker secret and never reaches the client.
 *
 * The frontend calls this at connect time via NEXT_PUBLIC_ICE_SERVERS_URL
 * (see lib/peer-config.ts). Response shape: { iceServers, ttl }.
 *
 * Bindings (see wrangler.toml + README.md):
 * - TURN_KEY_ID         (secret) Cloudflare TURN key id
 * - TURN_KEY_API_TOKEN  (secret) Cloudflare TURN key API token
 * - ALLOWED_ORIGIN      (var)    exact browser origin to allow, or "*"
 * - CREDENTIAL_TTL      (var)    lifetime of minted credentials, seconds
 */

const CF_TURN_API = "https://rtc.live.cloudflare.com/v1/turn/keys";

const worker = {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, cors);
    }
    if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) {
      return json({ error: "TURN key not configured" }, 500, cors);
    }

    const ttl = Number(env.CREDENTIAL_TTL) || 86_400; // 24h default

    let upstream;
    try {
      upstream = await fetch(
        `${CF_TURN_API}/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl }),
        },
      );
    } catch (err) {
      return json({ error: "Upstream request failed", detail: String(err) }, 502, cors);
    }

    if (!upstream.ok) {
      const detail = await upstream.text();
      return json({ error: "Credential generation failed", detail }, 502, cors);
    }

    const data = await upstream.json();
    return json(
      { iceServers: data.iceServers, ttl },
      200,
      { ...cors, "Cache-Control": "no-store" },
    );
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export default worker;
