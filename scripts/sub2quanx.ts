/**
 * Fetch a proxy subscription and convert nodes to QuantumultX format.
 *
 * Usage:
 *   npx tsx scripts/sub2quanx.ts <subscription-url>
 *   npx tsx scripts/sub2quanx.ts "https://jmssub.net/members/getsub.php?service=..."
 *
 * Output: data/quanx_servers.conf
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProxyNode {
  type: "ss" | "vmess" | "trojan" | "ssr";
  name: string;
  server: string;
  port: number;
  // SS / SSR
  method?: string;
  password?: string;
  // SSR extra
  protocol?: string;
  protocolParam?: string;
  obfs?: string;
  obfsParam?: string;
  // VMess
  uuid?: string;
  alterId?: number;
  vmessMethod?: string;
  network?: string; // tcp / ws / h2 / grpc
  wsPath?: string;
  wsHost?: string;
  tls?: boolean;
  sni?: string;
  // Trojan
  trojanPassword?: string;
  trojanSni?: string;
  allowInsecure?: boolean;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function decodeSafeBase64(str: string): string {
  // Handle URL-safe base64 and missing padding
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return Buffer.from(s, "base64").toString("utf-8");
}

function parseSS(uri: string): ProxyNode | null {
  // ss://base64(method:password)@server:port#name
  // or ss://base64(method:password@server:port)#name (SIP002)
  try {
    const hashIdx = uri.indexOf("#");
    const name = hashIdx >= 0 ? decodeURIComponent(uri.slice(hashIdx + 1)) : "Unnamed";
    const body = hashIdx >= 0 ? uri.slice(5, hashIdx) : uri.slice(5);

    // Try SIP002: base64(method:password)@server:port
    const atIdx = body.lastIndexOf("@");
    if (atIdx > 0) {
      const userInfo = decodeSafeBase64(body.slice(0, atIdx));
      const serverPart = body.slice(atIdx + 1);
      const colonIdx = userInfo.indexOf(":");
      const method = userInfo.slice(0, colonIdx);
      const password = userInfo.slice(colonIdx + 1);
      const [server, portStr] = serverPart.split(":");
      return { type: "ss", name, server, port: Number(portStr), method, password };
    }

    // Legacy: base64(method:password@server:port)
    const decoded = decodeSafeBase64(body);
    const match = decoded.match(/^(.+?):(.+)@(.+):(\d+)$/);
    if (!match) return null;
    return {
      type: "ss",
      name,
      server: match[3],
      port: Number(match[4]),
      method: match[1],
      password: match[2],
    };
  } catch {
    return null;
  }
}

function parseSSR(uri: string): ProxyNode | null {
  // ssr://base64(server:port:protocol:method:obfs:base64pass/?params)
  try {
    const decoded = decodeSafeBase64(uri.slice(6));
    const qIdx = decoded.indexOf("/?");
    const mainPart = qIdx >= 0 ? decoded.slice(0, qIdx) : decoded;
    const paramsPart = qIdx >= 0 ? decoded.slice(qIdx + 2) : "";

    const parts = mainPart.split(":");
    if (parts.length < 6) return null;
    const server = parts[0];
    const port = Number(parts[1]);
    const protocol = parts[2];
    const method = parts[3];
    const obfs = parts[4];
    const password = decodeSafeBase64(parts[5]);

    const params = new URLSearchParams(paramsPart);
    const name = params.has("remarks") ? decodeSafeBase64(params.get("remarks")!) : "Unnamed";
    const obfsParam = params.has("obfsparam") ? decodeSafeBase64(params.get("obfsparam")!) : undefined;
    const protocolParam = params.has("protoparam") ? decodeSafeBase64(params.get("protoparam")!) : undefined;

    return {
      type: "ssr",
      name,
      server,
      port,
      method,
      password,
      protocol,
      protocolParam,
      obfs,
      obfsParam,
    };
  } catch {
    return null;
  }
}

function parseVMess(uri: string): ProxyNode | null {
  // vmess://base64(json)
  try {
    const json = JSON.parse(decodeSafeBase64(uri.slice(8)));
    return {
      type: "vmess",
      name: json.ps || json.remarks || "Unnamed",
      server: json.add,
      port: Number(json.port),
      uuid: json.id,
      alterId: Number(json.aid || 0),
      vmessMethod: json.scy || "auto",
      network: json.net || "tcp",
      wsPath: json.path || "/",
      wsHost: json.host || "",
      tls: json.tls === "tls",
      sni: json.sni || json.host || "",
    };
  } catch {
    return null;
  }
}

function parseTrojan(uri: string): ProxyNode | null {
  // trojan://password@server:port?params#name
  try {
    const url = new URL(uri);
    const name = decodeURIComponent(url.hash.slice(1)) || "Unnamed";
    const password = decodeURIComponent(url.username);
    const server = url.hostname;
    const port = Number(url.port);
    const params = url.searchParams;
    const sni = params.get("sni") || params.get("peer") || server;
    const allowInsecure = params.get("allowInsecure") === "1" || params.get("allowinsecure") === "1";

    return {
      type: "trojan",
      name,
      server,
      port,
      trojanPassword: password,
      trojanSni: sni,
      allowInsecure,
    };
  } catch {
    return null;
  }
}

function parseLine(line: string): ProxyNode | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("ss://")) return parseSS(trimmed);
  if (trimmed.startsWith("ssr://")) return parseSSR(trimmed);
  if (trimmed.startsWith("vmess://")) return parseVMess(trimmed);
  if (trimmed.startsWith("trojan://")) return parseTrojan(trimmed);
  return null;
}

// ---------------------------------------------------------------------------
// QuantumultX formatters
// ---------------------------------------------------------------------------

function toQuanXSS(n: ProxyNode): string {
  return `shadowsocks=${n.server}:${n.port}, method=${n.method}, password=${n.password}, fast-open=false, udp-relay=false, tag=${n.name}`;
}

function toQuanXVMess(n: ProxyNode): string {
  const parts: string[] = [`vmess=${n.server}:${n.port}`];
  parts.push(`method=${n.vmessMethod === "auto" ? "chacha20-ietf-poly1305" : n.vmessMethod}`);
  parts.push(`password=${n.uuid}`);

  if (n.network === "ws") {
    parts.push(`obfs=ws`);
    parts.push(`obfs-host=${n.wsHost || n.server}`);
    parts.push(`obfs-uri=${n.wsPath || "/"}`);
  } else if (n.network === "http") {
    parts.push(`obfs=http`);
    parts.push(`obfs-host=${n.wsHost || n.server}`);
    parts.push(`obfs-uri=${n.wsPath || "/"}`);
  }

  parts.push(`over-tls=${n.tls ? "true" : "false"}`);
  if (n.tls && n.sni) {
    parts.push(`tls-host=${n.sni}`);
  }
  parts.push(`tls-verification=false`);
  parts.push(`fast-open=false`);
  parts.push(`udp-relay=false`);
  parts.push(`tag=${n.name}`);

  return parts.join(", ");
}

function toQuanXTrojan(n: ProxyNode): string {
  const parts: string[] = [`trojan=${n.server}:${n.port}`];
  parts.push(`password=${n.trojanPassword}`);
  parts.push(`over-tls=true`);
  if (n.trojanSni) {
    parts.push(`tls-host=${n.trojanSni}`);
  }
  parts.push(`tls-verification=${n.allowInsecure ? "false" : "true"}`);
  parts.push(`fast-open=false`);
  parts.push(`udp-relay=false`);
  parts.push(`tag=${n.name}`);

  return parts.join(", ");
}

function toQuanXSSR(n: ProxyNode): string {
  // QuantumultX supports SSR via shadowsocks with ssr-protocol
  const parts: string[] = [`shadowsocks=${n.server}:${n.port}`];
  parts.push(`method=${n.method}`);
  parts.push(`password=${n.password}`);
  if (n.obfs && n.obfs !== "plain") {
    parts.push(`obfs=${n.obfs}`);
    if (n.obfsParam) parts.push(`obfs-host=${n.obfsParam}`);
  }
  if (n.protocol && n.protocol !== "origin") {
    parts.push(`ssr-protocol=${n.protocol}`);
    if (n.protocolParam) parts.push(`ssr-protocol-param=${n.protocolParam}`);
  }
  parts.push(`fast-open=false`);
  parts.push(`udp-relay=false`);
  parts.push(`tag=${n.name}`);

  return parts.join(", ");
}

function nodeToQuanX(node: ProxyNode): string {
  switch (node.type) {
    case "ss":
      return toQuanXSS(node);
    case "ssr":
      return toQuanXSSR(node);
    case "vmess":
      return toQuanXVMess(node);
    case "trojan":
      return toQuanXTrojan(node);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/sub2quanx.ts <subscription-url>");
    process.exit(1);
  }

  console.log("Fetching subscription...");
  const res = await fetch(url, {
    headers: { "User-Agent": "ClashForAndroid/2.5.12" },
  });
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const raw = await res.text();

  // Subscription content is usually base64 encoded
  let content: string;
  try {
    content = Buffer.from(raw, "base64").toString("utf-8");
    // Verify it's valid decoded content (should contain :// URIs)
    if (!content.includes("://")) {
      content = raw; // If not base64, use as-is
    }
  } catch {
    content = raw;
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  console.log(`Found ${lines.length} lines in subscription`);

  const nodes: ProxyNode[] = [];
  const failed: string[] = [];

  for (const line of lines) {
    const node = parseLine(line);
    if (node) {
      nodes.push(node);
    } else if (line.includes("://")) {
      failed.push(line.slice(0, 60) + "...");
    }
  }

  console.log(`Parsed ${nodes.length} nodes (${failed.length} failed)`);
  if (failed.length > 0) {
    console.log("Failed lines:");
    for (const f of failed) console.log(`  ${f}`);
  }

  if (nodes.length === 0) {
    console.error("No nodes parsed. Check your subscription URL.");
    process.exit(1);
  }

  // Group by type for summary
  const typeCounts: Record<string, number> = {};
  for (const n of nodes) {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  }
  console.log("\nNode types:");
  for (const [t, c] of Object.entries(typeCounts)) {
    console.log(`  ${t}: ${c}`);
  }

  // Generate QuantumultX config
  const quanxLines = nodes.map(nodeToQuanX);
  const output = [
    "# QuantumultX Server Configuration",
    `# Generated: ${new Date().toISOString()}`,
    `# Total nodes: ${nodes.length}`,
    "",
    "[server_local]",
    ...quanxLines,
    "",
  ].join("\n");

  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  const outPath = path.join(dataDir, "quanx_servers.conf");
  await writeFile(outPath, output, "utf-8");

  console.log(`\nSaved to ${outPath}`);
  console.log("\nNode list:");
  for (const n of nodes) {
    console.log(`  [${n.type.toUpperCase()}] ${n.name} -> ${n.server}:${n.port}`);
  }
}

main().catch(console.error);
