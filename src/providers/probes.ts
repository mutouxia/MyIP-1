import { fetchJson, fetchText, loadScript } from "../lib/http";
import { errorMessage, measure } from "../lib/timing";
import type { GeoResult, ProbeProvider, ProbeResult } from "../types";
import {
  type IpSbResponse,
  type IpapiResponse,
  type PchomeResponse,
  normalizeIpSbGeo,
  normalizeIpapiGeo,
  parseCloudflareTrace,
  parseIpCnText,
  parseIpipNetText,
  parsePchomeResponse,
} from "./parsers";

declare global {
  interface Window {
    webkitRTCPeerConnection?: typeof RTCPeerConnection;
  }
}

function embeddedGeo(providerId: string, locationText: string, raw?: unknown): GeoResult {
  return {
    providerId,
    locationText,
    raw,
    status: "success",
    durationMs: 0,
  };
}

function failure(providerId: string, durationMs: number, error: unknown): ProbeResult {
  return {
    providerId,
    status: "error",
    durationMs,
    error: errorMessage(error),
  };
}

export const probeProviders: ProbeProvider[] = [
  {
    id: "cn-ipv4",
    name: "中国出口 IPv4",
    group: "国内",
    homepage: "https://my.ip.cn/",
    description: "从国内 IP 查询站点获取当前中国出口 IPv4。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value, durationMs } = await measure(fetchCnIp);
        return {
          providerId: "cn-ipv4",
          ip: value.ip,
          geo: embeddedGeo("cn-ipv4", value.locationText, value.raw),
          raw: value.raw,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("cn-ipv4", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "cloudflare-trace",
    name: "Cloudflare 出口 IP",
    group: "海外",
    homepage: "https://1.1.1.1/cdn-cgi/trace",
    description: "从 1.1.1.1 的 Cloudflare trace 获取访问 Cloudflare 时的出口 IP。",
    async query() {
      return traceProbe("cloudflare-trace", "https://1.1.1.1/cdn-cgi/trace");
    },
  },
  {
    id: "claude-trace",
    name: "Claude AI 出口 IP",
    group: "海外",
    homepage: "https://claude.ai/cdn-cgi/trace",
    description: "从 claude.ai 的 Cloudflare trace 获取访问 Claude AI 时的出口 IP。",
    async query() {
      return traceProbe("claude-trace", "https://claude.ai/cdn-cgi/trace");
    },
  },
  {
    id: "webrtc",
    name: "WebRTC",
    group: "本机",
    homepage: "https://developer.mozilla.org/docs/Web/API/WebRTC_API",
    description: "从本机 WebRTC ICE candidate 中尝试读取本地泄露 IP。",
    async query() {
      const startedAt = performance.now();
      try {
        const ip = await getWebrtcIp();
        return {
          providerId: "webrtc",
          ip,
          geo: embeddedGeo("webrtc", "WebRTC Leaked IP"),
          status: "success",
          durationMs: Math.round(performance.now() - startedAt),
        };
      } catch (error) {
        return failure("webrtc", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "pchome",
    name: "PChome",
    group: "国内",
    homepage: "https://whois.pconline.com.cn/",
    description: "从 PChome 查询当前出口 IP 和归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value, durationMs } = await measure(fetchPchomeIp);
        return {
          providerId: "pchome",
          ip: value.ip,
          geo: embeddedGeo("pchome", value.locationText, value.raw),
          raw: value.raw,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("pchome", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "ipipnet",
    name: "IPIP.net",
    group: "国内",
    homepage: "https://myip.ipip.net/",
    description: "从 IPIP.net 查询当前访问该服务时的出口 IP。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: text, durationMs } = await measure(() => fetchText("https://myip.ipip.net/"));
        const parsed = parseIpipNetText(text);
        return {
          providerId: "ipipnet",
          ip: parsed.ip,
          geo: embeddedGeo("ipipnet", parsed.locationText, text),
          raw: text,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("ipipnet", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "ip-sb",
    name: "IP.SB",
    group: "海外",
    homepage: "https://ip.sb/",
    description: "从 IP.SB 查询出口 IP 和内置归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() => fetchJson<IpSbResponse>("https://api.ip.sb/geoip"));
        if (!data.ip) {
          throw new Error("IP.SB 未返回 IP");
        }
        return {
          providerId: "ip-sb",
          ip: data.ip,
          geo: { ...normalizeIpSbGeo(data), durationMs },
          raw: data,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("ip-sb", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "ipify",
    name: "ipify",
    group: "海外",
    homepage: "https://www.ipify.org/",
    description: "从 ipify 获取出口 IP。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() => fetchJson<{ ip?: string }>("https://api.ipify.org/?format=json"));
        if (!data.ip) {
          throw new Error("ipify 未返回 IP");
        }
        return {
          providerId: "ipify",
          ip: data.ip,
          raw: data,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("ipify", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "ipapi",
    name: "ipapi",
    group: "海外",
    homepage: "https://ipapi.co/",
    description: "从 ipapi 查询出口 IP 和内置归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() => fetchJson<IpapiResponse>("https://ipapi.co/json"));
        if (!data.ip) {
          throw new Error("ipapi 未返回 IP");
        }
        return {
          providerId: "ipapi",
          ip: data.ip,
          geo: { ...normalizeIpapiGeo(data), durationMs },
          raw: data,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("ipapi", Math.round(performance.now() - startedAt), error);
      }
    },
  },
];

async function traceProbe(providerId: string, url: string): Promise<ProbeResult> {
  const startedAt = performance.now();
  try {
    const { value: text, durationMs } = await measure(() => fetchText(url, 5000));
    const parsed = parseCloudflareTrace(text);
    return {
      providerId,
      ip: parsed.ip,
      geo: embeddedGeo(providerId, traceLocationText(parsed.colo, parsed.locationCode), parsed.raw),
      raw: parsed.raw,
      status: "success",
      durationMs,
    };
  } catch (error) {
    return failure(providerId, Math.round(performance.now() - startedAt), error);
  }
}

function traceLocationText(colo?: string, locationCode?: string): string {
  const coloNameByCode: Record<string, string> = {
    SJC: "San Jose",
  };
  const normalizedColo = colo?.toUpperCase();
  if (normalizedColo) {
    return `Cloudflare ${coloNameByCode[normalizedColo] || normalizedColo} (${normalizedColo})`;
  }
  return locationCode ? `Cloudflare ${locationCode.toUpperCase()}` : "未知归属";
}

async function fetchCnIp(): Promise<{ ip: string; locationText: string; raw: string; source: string }> {
  try {
    const text = await fetchText("https://my.ip.cn/", 5000);
    return {
      ...parseIpCnText(text),
      raw: text,
      source: "IP.cn",
    };
  } catch {
    // Fall back to IP138 if IP.cn is unavailable.
  }

  try {
    const text = await fetchText("https://2026.ip138.com/", 5000);
    const match = text.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (match?.[1]) {
      return {
        ip: match[1],
        locationText: "未知归属",
        raw: text,
        source: "IP138",
      };
    }
  } catch {
    // IP138 may redirect or reject cross-origin requests.
  }

  throw new Error("中国出口 IPv4 获取失败");
}

async function fetchPchomeIp(): Promise<{ ip: string; locationText: string; raw: PchomeResponse; source: string }> {
  const callbackName = `__myipPchome${Date.now()}${Math.floor(Math.random() * 100000)}`;

  try {
    const data = await new Promise<PchomeResponse>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("PChome 请求超时"));
      }, 8000);

      function cleanup() {
        window.clearTimeout(timeout);
        Reflect.deleteProperty(window, callbackName);
      }

      Object.defineProperty(window, callbackName, {
        configurable: true,
        value: (payload: PchomeResponse) => {
          cleanup();
          resolve(payload);
        },
      });

      loadScript(`https://whois.pconline.com.cn/ipJson.jsp?callback=${callbackName}`, 8000, {
        charset: "GBK",
        referrerPolicy: "no-referrer",
      }).catch((error: unknown) => {
        cleanup();
        reject(error);
      });
    });
    return {
      ...parsePchomeResponse(data),
      raw: data,
      source: "PChome",
    };
  } finally {
    Reflect.deleteProperty(window, callbackName);
  }
}

function getWebrtcIp(timeoutMs = 3000): Promise<string> {
  return new Promise((resolve, reject) => {
    const PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (!PeerConnection) {
      reject(new Error("N/A"));
      return;
    }

    const connection = new PeerConnection({ iceServers: [] });
    const timer = window.setTimeout(() => {
      connection.close();
      reject(new Error("N/A"));
    }, timeoutMs);

    connection.createDataChannel("");
    connection
      .createOffer()
      .then((offer) => connection.setLocalDescription(offer))
      .catch(() => {
        window.clearTimeout(timer);
        connection.close();
        reject(new Error("N/A"));
      });

    connection.onicecandidate = (event) => {
      const candidate = event.candidate?.candidate;
      if (!candidate) {
        return;
      }

      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/i.exec(candidate);
      if (match?.[1]) {
        window.clearTimeout(timer);
        connection.onicecandidate = null;
        connection.close();
        resolve(match[1]);
      }
    };
  });
}
