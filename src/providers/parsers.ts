import type { GeoResult } from "../types";

export interface IpipNetParsed {
  ip: string;
  locationText: string;
}

export interface TraceParsed {
  ip: string;
  locationCode?: string;
  colo?: string;
  raw: Record<string, string>;
}

export interface IpCnParsed {
  ip: string;
  locationText: string;
}

export interface PchomeResponse {
  ip?: string;
  pro?: string;
  city?: string;
  region?: string;
  addr?: string;
  err?: string;
}

export interface IpSbResponse {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  organization?: string;
}

export interface IpapiResponse {
  ip?: string;
  country_name?: string;
  region?: string;
  city?: string;
  org?: string;
}

export interface MoeIpResponse {
  country?: string;
  area?: string;
  provider?: string;
}

export function parseIpipNetText(text: string): IpipNetParsed {
  const normalized = text.trim().replace(/^当前\s*IP：?/, "");
  const [ip = "", locationText = ""] = normalized.split(/\s+来自于：?\s*/);

  if (!ip.trim()) {
    throw new Error("IPIP.net 未返回 IP");
  }

  return {
    ip: ip.trim(),
    locationText: locationText.trim() || "未知归属",
  };
}

export function parseCloudflareTrace(text: string): TraceParsed {
  const raw = Object.fromEntries(
    text
      .trim()
      .split("\n")
      .map((line) => {
        const [key = "", ...value] = line.split("=");
        return [key, value.join("=")];
      })
      .filter(([key]) => key),
  );

  if (!raw.ip) {
    throw new Error("Cloudflare trace 未返回 IP");
  }

  return {
    ip: raw.ip,
    locationCode: raw.loc?.toLowerCase(),
    colo: raw.colo,
    raw,
  };
}

export function parseIpCnText(text: string): IpCnParsed {
  const match = text.match(/ip：?\s*([0-9.]+)\s+归属地：?\s*(.+)/i);
  if (!match?.[1]) {
    throw new Error("IP.cn 未返回 IPv4");
  }

  return {
    ip: match[1],
    locationText: match[2]?.trim() || "未知归属",
  };
}

export function parsePchomeResponse(data: PchomeResponse): IpCnParsed {
  if (!data.ip || data.err) {
    throw new Error("PChome 未返回 IP");
  }

  return {
    ip: data.ip,
    locationText: data.addr?.trim() || compact([data.pro, data.city, data.region]),
  };
}

export function normalizeIpSbGeo(data: IpSbResponse, providerId = "ip-sb"): GeoResult {
  return {
    providerId,
    locationText: compact([data.country, data.region, data.city, data.organization]),
    country: data.country,
    region: data.region,
    city: data.city,
    isp: data.organization,
    raw: data,
    status: "success",
    durationMs: 0,
  };
}

export function normalizeIpapiGeo(data: IpapiResponse, providerId = "ipapi"): GeoResult {
  return {
    providerId,
    locationText: compact([data.country_name, data.region, data.city, data.org]),
    country: data.country_name,
    region: data.region,
    city: data.city,
    isp: data.org,
    raw: data,
    status: "success",
    durationMs: 0,
  };
}

export function normalizeMoeIpGeo(data: MoeIpResponse, providerId = "moe-ip"): GeoResult {
  return {
    providerId,
    locationText: compact([data.country, data.area, data.provider]),
    country: data.country,
    region: data.area,
    isp: data.provider,
    raw: data,
    status: "success",
    durationMs: 0,
  };
}

export function compact(parts: Array<string | undefined>): string {
  const text = parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return text || "未知归属";
}
