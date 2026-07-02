export interface ProbeCardConfig {
  providerId: string;
  title: string;
  source: string;
}

export interface ConnectivityCardConfig {
  checkId: string;
  title: string;
  source: string;
}

export interface ProbeCardTarget {
  ip: string;
  geo: string;
}

export const probeCardRows: ProbeCardConfig[][] = [
  [
    { providerId: "webrtc", title: "从本机查询", source: "数据来自 WebRTC" },
    { providerId: "cn-ipv4", title: "从国内网站查询", source: "数据来自 IP.cn" },
    { providerId: "pchome", title: "从国内网站查询", source: "数据来自 PChome" },
  ],
  [
    { providerId: "ipipnet", title: "从国内网站查询", source: "数据来自 IPIP.net" },
    { providerId: "cloudflare-trace", title: "从国外网站查询", source: "数据来自 1.1.1.1" },
    { providerId: "claude-trace", title: "从国外网站查询", source: "数据来自 Claude" },
  ],
  [
    { providerId: "ip-sb", title: "从国外网站查询", source: "数据来自 IP.SB" },
    { providerId: "ipify", title: "从国外网站查询", source: "数据来自 ipify" },
    { providerId: "ipapi", title: "从国外网站查询", source: "数据来自 ipapi" },
  ],
];

export const connectivityCardConfigs: ConnectivityCardConfig[] = [
  { checkId: "baidu", title: "百度搜索", source: "国内网站" },
  { checkId: "netease-music", title: "网易云音乐", source: "国内网站" },
  { checkId: "github", title: "GitHub", source: "国外网站" },
  { checkId: "youtube", title: "YouTube", source: "海外网站" },
];

export function probeCardTarget(providerId: string): ProbeCardTarget {
  const domId = providerDomId(providerId);
  return {
    ip: `ip-${domId}`,
    geo: `ip-${domId}-geo`,
  };
}

export function connectivityCardTarget(checkId: string): string {
  const targetByCheckId: Record<string, string> = {
    baidu: "http-baidu",
    "netease-music": "http-163",
    github: "http-github",
    youtube: "http-youtube",
  };

  return targetByCheckId[checkId] || `http-${checkId}`;
}

function providerDomId(providerId: string): string {
  const targetByProviderId: Record<string, string> = {
    "cn-ipv4": "cn-ipv4",
    "cloudflare-trace": "cloudflare",
    "claude-trace": "claude",
    webrtc: "webrtc",
    ipipnet: "ipipnet",
    pchome: "pchome",
    "ip-sb": "ipsb",
    ipify: "ipify",
    ipapi: "ipapi",
  };

  return targetByProviderId[providerId] || providerId.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}
