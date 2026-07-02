export class RequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export function cacheBust(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}z=${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

interface RequestOptions {
  cacheBust?: boolean;
}

interface ScriptOptions extends RequestOptions {
  charset?: string;
  referrerPolicy?: ReferrerPolicy;
}

export async function fetchJson<T>(url: string, timeoutMs = 8000, options: RequestOptions = {}): Promise<T> {
  const response = await fetchWithTimeout(requestUrl(url, options), timeoutMs);
  return response.json() as Promise<T>;
}

export async function fetchText(url: string, timeoutMs = 8000, options: RequestOptions = {}): Promise<string> {
  const response = await fetchWithTimeout(requestUrl(url, options), timeoutMs);
  return response.text();
}

export function loadScript(url: string, timeoutMs = 8000, options: ScriptOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new RequestError("请求超时"));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timer);
      script.remove();
    }

    script.onload = () => {
      cleanup();
      resolve();
    };
    script.onerror = () => {
      cleanup();
      reject(new RequestError("脚本加载失败"));
    };
    if (options.charset) {
      script.charset = options.charset;
    }
    if (options.referrerPolicy) {
      script.referrerPolicy = options.referrerPolicy;
    }
    script.src = requestUrl(url, options);
    document.head.append(script);
  });
}

function requestUrl(url: string, options: RequestOptions): string {
  return options.cacheBust === false ? url : cacheBust(url);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
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
