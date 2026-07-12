import { formatCloudflareColo } from "../config/cloudflare-colos";
import type { CloudflareProbeDefinition } from "../config/cloudflare-probes";
import { fetchText } from "../lib/http";
import { errorMessage, measure } from "../lib/timing";
import type { GeoResult, ProbeResult } from "../types";
import { parseCloudflareTrace } from "./parsers";

export async function queryCloudflareProbe(probe: CloudflareProbeDefinition): Promise<ProbeResult> {
  const startedAt = performance.now();
  try {
    return await queryUrl(probe.id, probe.traceUrl, startedAt);
  } catch (error) {
    if (probe.fallbackTraceUrl) {
      try {
        return await queryUrl(probe.id, probe.fallbackTraceUrl, startedAt);
      } catch {
        // The fallback is only a rescue path; report the primary failure.
      }
    }
    return {
      providerId: probe.id,
      status: "error",
      durationMs: Math.round(performance.now() - startedAt),
      error: errorMessage(error),
    };
  }
}

export async function validateCloudflareTraceUrl(traceUrl: string): Promise<void> {
  const result = await queryCloudflareProbe({ id: "validation", name: "validation", traceUrl });
  if (result.status !== "success") {
    throw new Error(result.error || "不是有效的 Cloudflare Trace 地址");
  }
}

async function queryUrl(providerId: string, url: string, startedAt: number): Promise<ProbeResult> {
  const { value: text, durationMs } = await measure(() => fetchText(url, 8000));
  const parsed = parseCloudflareTrace(text);
  const geo: GeoResult = {
    providerId,
    locationText: traceLocationText(parsed.colo, parsed.locationCode),
    raw: parsed.raw,
    status: "success",
    durationMs: 0,
  };
  return {
    providerId,
    ip: parsed.ip,
    geo,
    raw: parsed.raw,
    status: "success",
    durationMs: Math.round(performance.now() - startedAt) || durationMs,
  };
}

function traceLocationText(colo?: string, locationCode?: string): string {
  const normalizedColo = colo?.toUpperCase();
  if (normalizedColo) {
    return `Cloudflare ${formatCloudflareColo(normalizedColo)}`;
  }
  return locationCode ? `Cloudflare ${locationCode.toUpperCase()}` : "未知归属";
}
