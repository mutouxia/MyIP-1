import { cacheBust, fetchJson, fetchText, loadScript, RequestError } from "../lib/http";
import { builtInCloudflareProbes, homeCloudflareProbeIds } from "../config/cloudflare-probes";
import { errorMessage, measure } from "../lib/timing";
import type { GeoResult, ProbeProvider, ProbeResult } from "../types";
import { queryCloudflareProbe } from "./cloudflare";
import {
  type IpSbResponse,
  type IpapiResponse,
  type IpbaseResponse,
  type PchomeResponse,
  type UApiProMyIpResponse,
  normalizeIpSbGeo,
  normalizeIpapiGeo,
  normalizeIpbaseGeo,
  normalizeUApiProGeo,
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
    id: "netease-cdn",
    name: "网易",
    group: "国内",
    homepage: "https://necaptcha.nosdn.127.net/",
    description: "从网易验证码 CDN 的响应头获取出口 IP。",
    async query() {
      return headerProbe("netease-cdn", "https://necaptcha.nosdn.127.net/ab7f4275c1744aa28e0a8f3a1c58c532.png", [
        "cdn-user-ip",
      ]);
    },
  },
  {
    id: "bytedance-cn",
    name: "字节跳动",
    group: "国内",
    homepage: "https://perfops.byte-test.com/",
    description: "从字节跳动 perfops 测试资源响应头获取出口 IP。",
    async query() {
      return headerProbe("bytedance-cn", "https://perfops.byte-test.com/500b-bench.jpg", ["x-request-ip", "x-response-cinfo"]);
    },
  },
  ...homeCloudflareProbeIds.map((id) => cloudflareProbeProvider(id)),
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
    name: "ipip.net",
    group: "国内",
    homepage: "https://myip.ipip.net/",
    description: "从 ipip.net 查询当前访问该服务时的出口 IP。",
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
    id: "uapipro",
    name: "UApiPro",
    group: "国内",
    homepage: "https://uapis.cn/docs/api-reference/get-network-myip",
    description: "从 UApiPro 查询当前中国出口 IP 和网络归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() =>
          fetchJson<UApiProMyIpResponse>("https://uapis.cn/api/v1/network/myip"),
        );
        if (!data.ip) {
          throw new Error("UApiPro 未返回 IP");
        }
        return {
          providerId: "uapipro",
          ip: data.ip,
          geo: { ...normalizeUApiProGeo(data), durationMs },
          raw: data,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("uapipro", Math.round(performance.now() - startedAt), error);
      }
    },
  },
  {
    id: "ip-sb",
    name: "ip.sb",
    group: "海外",
    homepage: "https://ip.sb/",
    description: "从 ip.sb 查询出口 IP 和内置归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() => fetchJson<IpSbResponse>("https://api.ip.sb/geoip"));
        if (!data.ip) {
          throw new Error("ip.sb 未返回 IP");
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
    id: "ipapi",
    name: "ipapi.co",
    group: "海外",
    homepage: "https://ipapi.co/",
    description: "从 ipapi.co 查询出口 IP 和内置归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() => fetchJson<IpapiResponse>("https://ipapi.co/json"));
        if (!data.ip) {
          throw new Error("ipapi.co 未返回 IP");
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
  {
    id: "ipbase",
    name: "ipbase.com",
    group: "海外",
    homepage: "https://ipbase.com/",
    description: "从 ipbase.com 查询出口 IP 和内置归属信息。",
    async query() {
      const startedAt = performance.now();
      try {
        const { value: data, durationMs } = await measure(() =>
          fetchJson<IpbaseResponse>("https://api.ipbase.com/v1/json"),
        );
        if (!data.ip) {
          throw new Error("ipbase.com 未返回 IP");
        }
        return {
          providerId: "ipbase",
          ip: data.ip,
          geo: { ...normalizeIpbaseGeo(data), durationMs },
          raw: data,
          status: "success",
          durationMs,
        };
      } catch (error) {
        return failure("ipbase", Math.round(performance.now() - startedAt), error);
      }
    },
  },
];

function cloudflareProbeProvider(id: string): ProbeProvider {
  const probe = builtInCloudflareProbes.find((candidate) => candidate.id === id);
  if (!probe) {
    throw new Error(`Cloudflare 探测配置不存在：${id}`);
  }
  return {
    id: probe.id,
    name: probe.name,
    group: "海外",
    homepage: probe.traceUrl,
    description: `从 ${new URL(probe.traceUrl).hostname} 的 Cloudflare trace 获取出口 IP。`,
    async query() {
      return queryCloudflareProbe(probe);
    },
  };
}

async function headerProbe(providerId: string, url: string, headerNames: string[]): Promise<ProbeResult> {
  const startedAt = performance.now();
  try {
    const { value: response, durationMs } = await measure(() => fetchHead(url, 5000));
    const rawHeaders = Object.fromEntries(headerNames.map((name) => [name, response.headers.get(name)]));
    const headerValue = headerNames.map((name) => response.headers.get(name)).find(Boolean);
    const ip = extractIp(headerValue || "");
    if (!ip) {
      throw new Error("响应头未返回 IP");
    }
    return {
      providerId,
      ip,
      raw: rawHeaders,
      status: "success",
      durationMs,
    };
  } catch (error) {
    return failure(providerId, Math.round(performance.now() - startedAt), error);
  }
}

async function fetchHead(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(cacheBust(url), {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new RequestError(`HTTP ${response.status}`, response.status);
    }
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RequestError("请求超时");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

export function extractIp(value: string): string | undefined {
  const ipv4 = value.match(/[0-9]{1,3}(?:\.[0-9]{1,3}){3}/g)?.find(isIpv4);
  if (ipv4) {
    return ipv4;
  }

  return value
    .match(/[a-f0-9:]+/gi)
    ?.filter((candidate) => candidate.includes(":"))
    .find(isIpv6);
}

function isIpv4(candidate: string): boolean {
  return candidate.split(".").every((part) => Number(part) <= 255);
}

function isIpv6(candidate: string): boolean {
  if ((candidate.match(/::/g) || []).length > 1) {
    return false;
  }

  const hasCompression = candidate.includes("::");
  const parts = candidate.split(":");
  const hextets = parts.filter(Boolean);
  if (!hextets.every((part) => /^[a-f0-9]{1,4}$/i.test(part))) {
    return false;
  }

  return hasCompression ? hextets.length < 8 : hextets.length === 8;
}

async function fetchCnIp(): Promise<{ ip: string; locationText: string; raw: string; source: string }> {
  try {
    const text = await fetchText("https://my.ip.cn/", 5000);
    return {
      ...parseIpCnText(text),
      raw: text,
      source: "ip.cn",
    };
  } catch {
    // Fall back to IP138 if ip.cn is unavailable.
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
