import { fetchJson } from "../lib/http";
import { errorMessage, measure } from "../lib/timing";
import type { GeoProvider, GeoResult } from "../types";
import {
  type IpSbResponse,
  type IpapiResponse,
  type MoeIpResponse,
  normalizeIpSbGeo,
  normalizeIpapiGeo,
  normalizeMoeIpGeo,
} from "./parsers";

function withGeoFailure(providerId: string, durationMs: number, error: unknown): GeoResult {
  return {
    providerId,
    locationText: "查询失败",
    status: "error",
    durationMs,
    error: errorMessage(error),
  };
}

function createGeoProvider<T>(
  provider: Omit<GeoProvider, "lookup">,
  getUrl: (ip: string) => string,
  normalize: (data: T, providerId: string) => GeoResult,
): GeoProvider {
  const cache = new Map<string, Promise<GeoResult>>();

  return {
    ...provider,
    async lookup(ip) {
      const cacheKey = ip.trim();
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const lookupPromise = lookupGeo(cacheKey);
      cache.set(cacheKey, lookupPromise);
      return lookupPromise;
    },
  };

  async function lookupGeo(ip: string): Promise<GeoResult> {
      const startedAt = performance.now();
      try {
        const { value, durationMs } = await measure(() => fetchJson<T>(getUrl(ip), 8000, { cacheBust: false }));
        return {
          ...normalize(value, provider.id),
          durationMs,
          status: "success",
        };
      } catch (error) {
        return withGeoFailure(provider.id, Math.round(performance.now() - startedAt), error);
      }
  }
}

export const geoProviders: GeoProvider[] = [
  createGeoProvider<MoeIpResponse>(
    {
      id: "moe-ip",
      name: "Moe IP",
      homepage: "https://ip.mcr.moe/",
    },
    (ip) => `https://ip.mcr.moe/?ip=${encodeURIComponent(ip)}&unicode`,
    normalizeMoeIpGeo,
  ),
  createGeoProvider<IpapiResponse>(
    {
      id: "ipapi",
      name: "ipapi",
      homepage: "https://ipapi.co/",
    },
    (ip) => `https://ipapi.co/${encodeURIComponent(ip)}/json`,
    normalizeIpapiGeo,
  ),
  createGeoProvider<IpSbResponse>(
    {
      id: "ip-sb",
      name: "IP.SB",
      homepage: "https://ip.sb/",
    },
    (ip) => `https://api.ip.sb/geoip/${encodeURIComponent(ip)}`,
    normalizeIpSbGeo,
  ),
];

export const preferredGeoProviders = {
  moeIp: geoProviders[0],
  ipapi: geoProviders[1],
  ipSb: geoProviders[2],
};
