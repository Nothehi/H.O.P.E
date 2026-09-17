import { PeerServer } from "peer";
import os from "node:os";

const PORT = Number(process.env.PEER_PORT) || 9000;
const PATH = process.env.PEER_PATH || "/hope";

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

try {
  const server = PeerServer({
    port: PORT,
    path: PATH,
    allow_discovery: true,
  });

  server.on("connection", (client) => {
    console.log(`[PeerServer] 🟢 Client connected: ${client.getId()}`);
  });

  server.on("disconnect", (client) => {
    console.log(`[PeerServer] 🔴 Client disconnected: ${client.getId()}`);
  });

  const localIps = getLocalIps();
  const primaryIp = localIps.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) || localIps[0] || "127.0.0.1";

  console.log("\n========================================================");
  console.log("🚀  H.O.P.E. LOCAL SIGNALING SERVER (PeerServer) IS READY! ");
  console.log("========================================================");
  console.log(`📡 Port: ${PORT} | Path: ${PATH}`);
  console.log(`🔒 Secure (SSL): Disabled (Native local LAN plaintext)`);
  console.log("\n📍 Local Network Access (Wi-Fi / Hotspot):");
  for (const ip of localIps) {
    console.log(`   👉 ws://${ip}:${PORT}${PATH}`);
  }
  console.log("\n🎮 Share this game link with other players on your Wi-Fi:");
  console.log(`   👉 http://${primaryIp}:3000`);
  console.log("========================================================\n");
} catch (err) {
  console.error("❌ Failed to start PeerServer:", err);
  process.exit(1);
}
