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

export const homeProbeCardRows: ProbeCardConfig[][] = [
  [
    { providerId: "webrtc", title: "从本机查询", source: "数据来自 WebRTC" },
    { providerId: "cn-ipv4", title: "从国内网站查询", source: "数据来自 IP.cn" },
    { providerId: "pchome", title: "从国内网站查询", source: "数据来自 PChome" },
  ],
  [
    { providerId: "ipipnet", title: "从国内网站查询", source: "数据来自 IPIP.net" },
    { providerId: "netease-cdn", title: "从国内网站查询", source: "数据来自 网易 CDN" },
    { providerId: "bytedance-cn", title: "从国内网站查询", source: "数据来自 字节跳动" },
  ],
  [
    { providerId: "bytedance-global", title: "从国外网站查询", source: "数据来自 字节跳动" },
    { providerId: "cloudflare-trace", title: "从国外网站查询", source: "数据来自 1.1.1.1" },
    { providerId: "cloudflare-www-trace", title: "从国外网站查询", source: "数据来自 cloudflare.com" },
  ],
  [
    { providerId: "claude-trace", title: "从国外网站查询", source: "数据来自 Claude" },
    { providerId: "ip-sb", title: "从国外网站查询", source: "数据来自 IP.SB" },
    { providerId: "ipify", title: "从国外网站查询", source: "数据来自 ipify" },
  ],
  [
    { providerId: "ipapi", title: "从国外网站查询", source: "数据来自 ipapi" },
  ],
];

export const cloudflareProbeCardConfigs: ProbeCardConfig[] = [
  { providerId: "qualcomm-cn-trace", title: "Cloudflare Trace", source: "高通中国" },
  { providerId: "discord-trace", title: "Cloudflare Trace", source: "Discord" },
  { providerId: "x-trace", title: "Cloudflare Trace", source: "X" },
  { providerId: "medium-trace", title: "Cloudflare Trace", source: "Medium" },
  { providerId: "anthropic-trace", title: "Cloudflare Trace", source: "Anthropic" },
  { providerId: "chatgpt-trace", title: "Cloudflare Trace", source: "ChatGPT" },
  { providerId: "openai-trace", title: "Cloudflare Trace", source: "OpenAI" },
  { providerId: "sora-trace", title: "Cloudflare Trace", source: "Sora" },
  { providerId: "grok-trace", title: "Cloudflare Trace", source: "Grok" },
  { providerId: "pixpix-trace", title: "Cloudflare Trace", source: "PixPix" },
  { providerId: "perplexity-trace", title: "Cloudflare Trace", source: "Perplexity" },
  { providerId: "midjourney-trace", title: "Cloudflare Trace", source: "Midjourney" },
  { providerId: "coinbase-trace", title: "Cloudflare Trace", source: "Coinbase" },
  { providerId: "okx-trace", title: "Cloudflare Trace", source: "OKX" },
  { providerId: "crypto-trace", title: "Cloudflare Trace", source: "Crypto.com" },
  { providerId: "zoom-trace", title: "Cloudflare Trace", source: "Zoom" },
  { providerId: "onepassword-trace", title: "Cloudflare Trace", source: "1Password" },
  { providerId: "wise-trace", title: "Cloudflare Trace", source: "Wise" },
  { providerId: "notion-trace", title: "Cloudflare Trace", source: "Notion" },
  { providerId: "shopify-trace", title: "Cloudflare Trace", source: "Shopify" },
  { providerId: "godaddy-trace", title: "Cloudflare Trace", source: "GoDaddy" },
  { providerId: "producthunt-trace", title: "Cloudflare Trace", source: "Product Hunt" },
  { providerId: "cdnjs-trace", title: "Cloudflare Trace", source: "Cloudflare cdnjs" },
  { providerId: "npm-trace", title: "Cloudflare Trace", source: "npm registry" },
  { providerId: "kali-trace", title: "Cloudflare Trace", source: "Kali Download" },
  { providerId: "unpkg-trace", title: "Cloudflare Trace", source: "unpkg" },
  { providerId: "nodejs-trace", title: "Cloudflare Trace", source: "Node.js" },
  { providerId: "gitlab-trace", title: "Cloudflare Trace", source: "GitLab" },
  { providerId: "crunchyroll-trace", title: "Cloudflare Trace", source: "Crunchyroll" },
];

export const homeProbeCardConfigs = homeProbeCardRows.flat();
export const probeCardConfigs = [...homeProbeCardConfigs, ...cloudflareProbeCardConfigs];

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
