export type ResultStatus = "pending" | "success" | "error";

export interface GeoResult {
  providerId: string;
  locationText: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  raw?: unknown;
  status: ResultStatus;
  durationMs: number;
  error?: string;
}

export interface ProbeResult {
  providerId: string;
  ip?: string;
  geo?: GeoResult;
  status: ResultStatus;
  durationMs: number;
  raw?: unknown;
  error?: string;
}

export interface ProbeProvider {
  id: string;
  name: string;
  group: "本机" | "国内" | "海外";
  homepage: string;
  description: string;
  query: () => Promise<ProbeResult>;
}

export interface GeoProvider {
  id: string;
  name: string;
  homepage: string;
  lookup: (ip: string) => Promise<GeoResult>;
}

export interface ConnectivityCheck {
  id: string;
  name: string;
  group: "国内网站" | "海外网站";
  url: string;
}

export interface ConnectivityResult {
  checkId: string;
  status: ResultStatus;
  durationMs: number;
  error?: string;
}
