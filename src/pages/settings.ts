import "../styles.css";
import {
  clearCloudflareProbes,
  defaultCloudflareProbes,
  loadCloudflareProbes,
  saveCloudflareProbes,
} from "../config/cloudflare-preference";
import {
  type CloudflareProbeDefinition,
  createCustomCloudflareProbe,
  normalizeCloudflareProbeInput,
} from "../config/cloudflare-probes";
import {
  type WebRtcDisplayMode,
  clearWebRtcDisplayMode,
  defaultWebRtcDisplayMode,
  loadWebRtcDisplayMode,
  saveWebRtcDisplayMode,
} from "../config/webrtc-preference";
import { validateCloudflareTraceUrl } from "../providers/cloudflare";
import { el, requireElement } from "../ui/dom";

const form = requireElement<HTMLFormElement>("#settings-form");
const status = requireElement<HTMLElement>("#settings-status");
const cloudflareStatus = requireElement<HTMLElement>("#cloudflare-settings-status");
const cloudflareList = requireElement<HTMLElement>("#cloudflare-settings-list");
const cloudflareCount = requireElement<HTMLElement>("#cloudflare-probe-count");
const cloudflareInput = requireElement<HTMLInputElement>("#cloudflare-probe-input");
const addCloudflareButton = requireElement<HTMLButtonElement>("#add-cloudflare-probe");
let cloudflareProbes = loadCloudflareProbes();

selectMode(loadWebRtcDisplayMode());
renderCloudflareProbes();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const webRtcSaved = saveWebRtcDisplayMode(selectedMode());
  const cloudflareSaved = saveCloudflareProbes(cloudflareProbes);
  const saved = webRtcSaved && cloudflareSaved;
  showStatus(saved ? "设置已保存，返回首页后生效。" : "浏览器存储不可用，设置未保存。", saved);
});

requireElement<HTMLButtonElement>("#reset-settings").addEventListener("click", () => {
  const webRtcCleared = clearWebRtcDisplayMode();
  const cloudflareCleared = clearCloudflareProbes();
  const cleared = webRtcCleared && cloudflareCleared;
  selectMode(defaultWebRtcDisplayMode);
  cloudflareProbes = defaultCloudflareProbes();
  renderCloudflareProbes();
  showCloudflareStatus("");
  showStatus(cleared ? "已恢复全部默认设置。" : "浏览器存储不可用，无法恢复默认。", cleared);
});

addCloudflareButton.addEventListener("click", () => void addCloudflareProbe());
cloudflareInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void addCloudflareProbe();
  }
});

cloudflareList.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!button) {
    return;
  }
  const index = cloudflareProbes.findIndex((probe) => probe.id === button.dataset.id);
  if (index < 0) {
    return;
  }
  const action = button.dataset.action;
  if (action === "delete") {
    cloudflareProbes.splice(index, 1);
  } else if (action === "up" && index > 0) {
    [cloudflareProbes[index - 1], cloudflareProbes[index]] = [cloudflareProbes[index], cloudflareProbes[index - 1]];
  } else if (action === "down" && index < cloudflareProbes.length - 1) {
    [cloudflareProbes[index], cloudflareProbes[index + 1]] = [cloudflareProbes[index + 1], cloudflareProbes[index]];
  }
  renderCloudflareProbes();
  showCloudflareStatus("修改尚未保存。", true);
});

function selectedMode(): WebRtcDisplayMode {
  return requireElement<HTMLInputElement>('input[name="webrtc-display-mode"]:checked').value as WebRtcDisplayMode;
}

function selectMode(mode: WebRtcDisplayMode): void {
  requireElement<HTMLInputElement>(`input[name="webrtc-display-mode"][value="${mode}"]`).checked = true;
}

async function addCloudflareProbe(): Promise<void> {
  let normalized: ReturnType<typeof normalizeCloudflareProbeInput>;
  try {
    normalized = normalizeCloudflareProbeInput(cloudflareInput.value);
  } catch (error) {
    showCloudflareStatus(error instanceof Error ? error.message : "地址格式无效", false);
    return;
  }

  if (cloudflareProbes.some((probe) => probe.traceUrl === normalized.traceUrl)) {
    showCloudflareStatus("这个站点已经在列表中。", false);
    return;
  }

  addCloudflareButton.disabled = true;
  cloudflareInput.disabled = true;
  showCloudflareStatus("正在验证 Cloudflare Trace…", true);
  try {
    await validateCloudflareTraceUrl(normalized.traceUrl);
    cloudflareProbes.push(createCustomCloudflareProbe(normalized.traceUrl));
    cloudflareInput.value = "";
    renderCloudflareProbes();
    showCloudflareStatus("验证成功，点击“保存设置”后生效。", true);
  } catch (error) {
    showCloudflareStatus(error instanceof Error ? `验证失败：${error.message}` : "验证失败", false);
  } finally {
    addCloudflareButton.disabled = false;
    cloudflareInput.disabled = false;
  }
}

function renderCloudflareProbes(): void {
  cloudflareCount.textContent = `${cloudflareProbes.length} 个站点`;
  if (cloudflareProbes.length === 0) {
    cloudflareList.replaceChildren(el("p", { className: "cloudflare-settings-empty", text: "当前没有探测站点。" }));
    return;
  }
  cloudflareList.replaceChildren(...cloudflareProbes.map(renderCloudflareProbeRow));
}

function renderCloudflareProbeRow(probe: CloudflareProbeDefinition, index: number): HTMLElement {
  const row = el("div", { className: "cloudflare-setting-row" });
  const identity = el("div", { className: "cloudflare-setting-identity" });
  identity.append(el("strong", { text: probe.name }));
  const hostname = new URL(probe.traceUrl).hostname;
  if (hostname !== probe.name) {
    identity.append(el("small", { text: hostname }));
  }

  const actions = el("div", { className: "cloudflare-setting-actions" });
  actions.append(
    actionButton("up", "上移", probe, index === 0),
    actionButton("down", "下移", probe, index === cloudflareProbes.length - 1),
    actionButton("delete", "删除", probe, false),
  );
  row.append(identity, actions);
  return row;
}

function actionButton(
  action: "up" | "down" | "delete",
  text: string,
  probe: CloudflareProbeDefinition,
  disabled: boolean,
): HTMLButtonElement {
  const button = el("button", { className: "button is-small", text });
  button.type = "button";
  button.disabled = disabled;
  button.dataset.action = action;
  button.dataset.id = probe.id;
  button.setAttribute("aria-label", `${text} ${probe.name}`);
  return button;
}

function showStatus(message: string, success: boolean): void {
  status.textContent = message;
  status.classList.toggle("is-error", !success);
}

function showCloudflareStatus(message: string, success = true): void {
  cloudflareStatus.textContent = message;
  cloudflareStatus.classList.toggle("is-error", !success);
}
