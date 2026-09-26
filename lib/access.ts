import { networkInterfaces } from "os";

export const OPERATOR_PORT = Number(process.env.PORT) || 3737;

/** IPv4 addresses other devices on this Wi-Fi can use. */
export function lanAddresses(): string[] {
  const nets = networkInterfaces();
  const found: string[] = [];
  for (const addrs of Object.values(nets)) {
    if (!addrs) continue;
    for (const net of addrs) {
      const family = String(net.family);
      if ((family === "IPv4" || family === "4") && !net.internal) {
        found.push(net.address);
      }
    }
  }
  return [...new Set(found)];
}

export function accessUrls(): { local: string; lan: string[] } {
  const port = OPERATOR_PORT;
  return {
    local: `http://127.0.0.1:${port}`,
    lan: lanAddresses().map((ip) => `http://${ip}:${port}`),
  };
}
