import { spawn } from "node:child_process";
import { PeerServer } from "peer";
import os from "node:os";

const PEER_PORT = Number(process.env.PEER_PORT) || 9000;
const PEER_PATH = process.env.PEER_PATH || "/hope";
const NEXT_PORT = Number(process.env.PORT) || 3000;

function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// 1. Start Local PeerServer
let peerServer = null;
try {
  peerServer = PeerServer({
    port: PEER_PORT,
    path: PEER_PATH,
    allow_discovery: true,
    corsOptions: { origin: true },
  });

  peerServer.on("connection", (client) => {
    console.log(`[PeerServer] 🟢 New peer connected: ${client.getId()}`);
  });

  peerServer.on("disconnect", (client) => {
    console.log(`[PeerServer] 🔴 Peer disconnected: ${client.getId()}`);
  });

  peerServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`[PeerServer] ℹ️  Port ${PEER_PORT} is already running an active signaling instance.`);
    } else {
      console.error("[PeerServer] Error:", err);
    }
  });

  const localIps = getLocalIps();
  const primaryIp = localIps.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) || localIps[0] || "localhost";

  console.log("\n========================================================");
  console.log("🚀  H.O.P.E. LOCAL MULTIPLAYER (LAN + NEXT.JS) ACTIVE! ");
  console.log("========================================================");
  console.log(`📡 Local Signaling Server: ws://${primaryIp}:${PEER_PORT}${PEER_PATH}`);
  console.log(`🎮 Game Address for all LAN players: http://${primaryIp}:${NEXT_PORT}`);
  console.log("========================================================\n");
} catch (err) {
  if (err.code === "EADDRINUSE") {
    console.log(`[PeerServer] ℹ️  Port ${PEER_PORT} is already in use (existing server active).`);
  } else {
    console.error("❌ Failed to start PeerServer:", err);
  }
}

// 2. Start Next.js dev server bound to 0.0.0.0
const nextProcess = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", String(NEXT_PORT)], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_PEER_PORT: String(PEER_PORT),
    NEXT_PUBLIC_PEER_PATH: PEER_PATH,
    NEXT_PUBLIC_PEER_SECURE: "false",
  },
});

function cleanup() {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

nextProcess.on("exit", (code) => {
  process.exit(code ?? 0);
});
