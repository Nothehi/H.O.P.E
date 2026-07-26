/**
 * Build-time PeerJS configuration.
 *
 * The app is a static site with no backend of its own, so the signaling
 * server and STUN/TURN relays must be supplied from outside. These are read
 * from `NEXT_PUBLIC_*` env vars, which Next.js inlines into the client bundle
 * at build time (see the deploy workflow / .env.example).
 *
 * When nothing is configured we fall back to PeerJS's public defaults
 * (`0.peerjs.com` broker + Google STUN + `*.turn.peerjs.com`). Those defaults
 * are rate-limited and unreliable across networks — fine for a quick local
 * try, but a real deployment should point at its own signaling host and TURN.
 *
 * NOTE: TURN credentials given here end up in the public JS bundle. That is
 * inherent to browser WebRTC — the client always sees them. Use a provider
 * that issues long-lived static credentials for this, or short-lived tokens
 * if you later add a backend to mint them.
 */

import type { PeerOptions } from "peerjs";

const DEFAULT_STUN = "stun:stun.l.google.com:19302";

/** Split a comma/whitespace-separated env value into a clean URL list. */
function urlList(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

function iceServers(): RTCIceServer[] | undefined {
  const stun = process.env.NEXT_PUBLIC_STUN_URLS;
  const turn = process.env.NEXT_PUBLIC_TURN_URLS;

  // Nothing configured: let PeerJS use its built-in (public) defaults.
  if (!stun && !turn) return undefined;

  const servers: RTCIceServer[] = [
    { urls: urlList(stun || DEFAULT_STUN) },
  ];

  if (turn) {
    servers.push({
      urls: urlList(turn),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  return servers;
}

/**
 * PeerJS options for every `new Peer(...)` in the app. Both the beacon and
 * mesh peers of a room must share these so they meet on the same signaling
 * server and negotiate over the same ICE servers.
 */
export function peerOptions(): PeerOptions {
  const options: PeerOptions = {};

  const host = process.env.NEXT_PUBLIC_PEER_HOST;
  if (host) {
    options.host = host;
    options.port = Number(process.env.NEXT_PUBLIC_PEER_PORT) || 443;
    options.path = process.env.NEXT_PUBLIC_PEER_PATH || "/";
    // Secure (wss/https) by default; opt out only for local plaintext dev.
    options.secure = process.env.NEXT_PUBLIC_PEER_SECURE !== "false";
    if (process.env.NEXT_PUBLIC_PEER_KEY) {
      options.key = process.env.NEXT_PUBLIC_PEER_KEY;
    }
  }

  const ice = iceServers();
  if (ice) options.config = { iceServers: ice };

  return options;
}
