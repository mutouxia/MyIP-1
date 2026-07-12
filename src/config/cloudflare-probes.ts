export interface CloudflareProbeDefinition {
  id: string;
  name: string;
  traceUrl: string;
  fallbackTraceUrl?: string;
}

function builtIn(
  id: string,
  name: string,
  hostname: string,
  fallbackHostname?: string,
): CloudflareProbeDefinition {
  return {
    id,
    name,
    traceUrl: traceUrl(hostname),
    fallbackTraceUrl: fallbackHostname ? traceUrl(fallbackHostname) : undefined,
  };
}

export const homeCloudflareProbeIds = ["chatgpt-trace", "claude-trace", "grok-trace"] as const;

export const builtInCloudflareProbes: CloudflareProbeDefinition[] = [
  builtIn("chatgpt-trace", "ChatGPT", "chatgpt.com"),
  builtIn("claude-trace", "Claude", "claude.ai"),
  builtIn("grok-trace", "Grok", "grok.com"),
  builtIn("qualcomm-cn-trace", "高通中国", "www.qualcomm.cn"),
  builtIn("discord-trace", "Discord", "discord.com", "gateway.discord.gg"),
  builtIn("x-trace", "X", "x.com"),
  builtIn("medium-trace", "Medium", "medium.com"),
  builtIn("anthropic-trace", "Anthropic", "anthropic.com"),
  builtIn("openai-trace", "OpenAI", "openai.com"),
  builtIn("sora-trace", "Sora", "sora.com"),
  builtIn("pixpix-trace", "PixPix", "pixpix.com"),
  builtIn("perplexity-trace", "Perplexity", "www.perplexity.ai"),
  builtIn("midjourney-trace", "Midjourney", "midjourney.com"),
  builtIn("coinbase-trace", "Coinbase", "coinbase.com"),
  builtIn("okx-trace", "OKX", "www.okx.com"),
  builtIn("crypto-trace", "Crypto.com", "crypto.com"),
  builtIn("zoom-trace", "Zoom", "zoom.us"),
  builtIn("onepassword-trace", "1Password", "1password.com"),
  builtIn("wise-trace", "Wise", "wise.com"),
  builtIn("notion-trace", "Notion", "notion.so"),
  builtIn("shopify-trace", "Shopify", "shopify.com"),
  builtIn("godaddy-trace", "GoDaddy", "godaddy.com"),
  builtIn("producthunt-trace", "Product Hunt", "producthunt.com"),
  builtIn("cdnjs-trace", "Cloudflare cdnjs", "cdnjs.cloudflare.com"),
  builtIn("npm-trace", "npm registry", "registry.npmjs.org"),
  builtIn("kali-trace", "Kali Download", "kali.download"),
  builtIn("unpkg-trace", "unpkg", "unpkg.com"),
  builtIn("nodejs-trace", "Node.js", "nodejs.org"),
  builtIn("gitlab-trace", "GitLab", "gitlab.com"),
  builtIn("crunchyroll-trace", "Crunchyroll", "crunchyroll.com"),
];

export function normalizeCloudflareProbeInput(input: string): Pick<CloudflareProbeDefinition, "name" | "traceUrl"> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("请输入域名或 Cloudflare Trace 地址");
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("域名或地址格式无效");
  }

  if (url.protocol !== "https:") {
    throw new Error("仅支持 HTTPS 地址");
  }
  if (url.username || url.password || !isDomainName(url.hostname)) {
    throw new Error("域名或地址格式无效");
  }

  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath !== "/" && normalizedPath !== "/cdn-cgi/trace") {
    throw new Error("地址必须是域名或 /cdn-cgi/trace");
  }

  return {
    name: url.hostname.toLowerCase(),
    traceUrl: `${url.origin}/cdn-cgi/trace`,
  };
}

export function createCustomCloudflareProbe(input: string): CloudflareProbeDefinition {
  const normalized = normalizeCloudflareProbeInput(input);
  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    ...normalized,
  };
}

function traceUrl(hostname: string): string {
  return `https://${hostname}/cdn-cgi/trace`;
}

function isDomainName(hostname: string): boolean {
  if (!hostname.includes(".") || /^\d+(?:\.\d+){3}$/.test(hostname)) {
    return false;
  }
  return hostname.split(".").every((label) => /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label));
}
