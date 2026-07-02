import { errorMessage } from "../lib/timing";
import type { ConnectivityCheck, ConnectivityResult } from "../types";

export const connectivityChecks: ConnectivityCheck[] = [
  {
    id: "baidu",
    name: "百度搜索",
    group: "国内网站",
    url: "https://www.baidu.com/favicon.ico",
  },
  {
    id: "netease-music",
    name: "网易云音乐",
    group: "国内网站",
    url: "https://s1.music.126.net/style/favicon.ico",
  },
  {
    id: "github",
    name: "GitHub",
    group: "海外网站",
    url: "https://github.com/favicon.ico",
  },
  {
    id: "youtube",
    name: "YouTube",
    group: "海外网站",
    url: "https://www.youtube.com/favicon.ico",
  },
];

export function runConnectivityCheck(check: ConnectivityCheck, timeoutMs = 6000): Promise<ConnectivityResult> {
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const image = new Image();
    const finish = (result: Omit<ConnectivityResult, "checkId" | "durationMs">) => {
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      image.src = "";
      resolve({
        checkId: check.id,
        durationMs: Math.round(performance.now() - startedAt),
        ...result,
      });
    };

    const timer = window.setTimeout(() => {
      finish({ status: "error", error: "连接超时" });
    }, timeoutMs);

    image.onload = () => finish({ status: "success" });
    image.onerror = (event) => finish({ status: "error", error: errorMessage(event) || "无法访问" });
    image.src = `${check.url}?z=${Date.now()}`;
  });
}

export async function runConnectivityCheckTwice(
  check: ConnectivityCheck,
  onResult: (result: ConnectivityResult) => void,
): Promise<ConnectivityResult> {
  const firstResult = await runConnectivityCheck(check);
  onResult(firstResult);

  const secondResult = await runConnectivityCheck(check);
  onResult(secondResult);

  return secondResult;
}
