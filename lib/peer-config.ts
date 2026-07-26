/**
 * PeerJS configuration: signaling host + STUN/TURN ICE servers.
 *
 * The app is a static site with no backend of its own, so this infrastructure
 * must be supplied from outside. Two sources, in precedence order:
 *
 * 1. Runtime fetch (preferred for TURN providers with short-lived
 *    credentials). If `NEXT_PUBLIC_ICE_SERVERS_URL` is set, we fetch ICE
 *    servers from it at connect time. This can point directly at a provider's
 *    client-side credentials API (e.g. Metered's, which is CORS-open and
 *    returns a bare array) or at the proxy worker in `worker/` (which keeps a
 *    provider API token server-side and returns `{ iceServers, ttl }`).
 * 2. Build-time env. `NEXT_PUBLIC_*` STUN/TURN vars are inlined into the
 *    bundle at build time — simplest, but only works with providers that
 *    issue long-lived static credentials, which then sit in the public JS.
 *
 * With neither set we fall back to PeerJS's public defaults (`0.peerjs.com`
 * broker + Google STUN + `*.turn.peerjs.com`), which are rate-limited and
 * unreliable across networks — fine for a quick local try only.
 */

import type { PeerOptions } from "peerjs";

const DEFAULT_STUN = "stun:stun.l.google.com:19302";

/** Refetch this fraction into the credential lifetime, before it expires. */
const ICE_REFRESH_RATIO = 0.9;
const ICE_FETCH_TIMEOUT_MS = 5_000;

/** Split a comma/whitespace-separated env value into a clean URL list. */
function urlList(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

/** ICE servers from build-time env, or undefined to use PeerJS defaults. */
function staticIceServers(): RTCIceServer[] | undefined {
  const stun = process.env.NEXT_PUBLIC_STUN_URLS;
  const turn = process.env.NEXT_PUBLIC_TURN_URLS;

  if (!stun && !turn) return undefined;

  const servers: RTCIceServer[] = [{ urls: urlList(stun || DEFAULT_STUN) }];

  if (turn) {
    servers.push({
      urls: urlList(turn),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  return servers;
}

/** Signaling-server options; empty object means PeerJS's public cloud. */
function signalingOptions(): PeerOptions {
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
  return options;
}

// Cache the fetched ICE servers for their (near-)lifetime so all peers in one
// membership share a set without hammering the endpoint. Refreshed once the
// credentials approach expiry (relevant for long sessions / host migration).
let iceCache: { servers: RTCIceServer[]; expiresAt: number } | null = null;

async function fetchIceServers(url: string): Promise<RTCIceServer[] | null> {
  if (iceCache && Date.now() < iceCache.expiresAt) return iceCache.servers;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ICE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`ICE endpoint returned ${res.status}`);
    const data:
      | RTCIceServer[]
      | { iceServers?: RTCIceServer | RTCIceServer[]; ttl?: number } =
      await res.json();
    // Two response shapes are accepted: a bare array (e.g. Metered's
    // credentials API) or an object with an `iceServers` field (our worker /
    // Cloudflare style, where iceServers may be a single combined object).
    const raw = Array.isArray(data) ? data : data.iceServers;
    if (!raw) throw new Error("ICE endpoint returned no iceServers");
    const servers = Array.isArray(raw) ? raw : [raw];
    const ttl = Array.isArray(data) ? undefined : data.ttl;
    const ttlMs = (Number(ttl) || 3600) * 1000;
    iceCache = { servers, expiresAt: Date.now() + ttlMs * ICE_REFRESH_RATIO };
    return servers;
  } catch (err) {
    // Fall back to static/default ICE rather than failing the whole join.
    console.warn("Could not fetch ICE servers; falling back.", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the PeerJS options for every `new Peer(...)` in the app. Both the
 * beacon and mesh peers of a room must share these so they meet on the same
 * signaling server and negotiate over the same ICE servers.
 *
 * Async because ICE servers may be fetched at runtime; the result is cached,
 * so calling this per-peer is cheap.
 */
export async function resolvePeerOptions(): Promise<PeerOptions> {
  const options = signalingOptions();

  const iceUrl = process.env.NEXT_PUBLIC_ICE_SERVERS_URL;
  const ice = iceUrl ? await fetchIceServers(iceUrl) : null;
  const servers = ice ?? staticIceServers();
  if (servers) options.config = { iceServers: servers };

  return options;
}
