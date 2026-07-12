import "../styles.css";
import {
  type WebRtcDisplayMode,
  clearWebRtcDisplayMode,
  defaultWebRtcDisplayMode,
  loadWebRtcDisplayMode,
  saveWebRtcDisplayMode,
} from "../config/webrtc-preference";
import { requireElement } from "../ui/dom";

const form = requireElement<HTMLFormElement>("#webrtc-settings-form");
const status = requireElement<HTMLElement>("#settings-status");

selectMode(loadWebRtcDisplayMode());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const saved = saveWebRtcDisplayMode(selectedMode());
  showStatus(saved ? "设置已保存，返回首页后生效。" : "浏览器存储不可用，设置未保存。", saved);
});

requireElement<HTMLButtonElement>("#reset-webrtc-setting").addEventListener("click", () => {
  const cleared = clearWebRtcDisplayMode();
  selectMode(defaultWebRtcDisplayMode);
  showStatus(cleared ? "已恢复为自动显示。" : "浏览器存储不可用，无法恢复默认。", cleared);
});

function selectedMode(): WebRtcDisplayMode {
  return requireElement<HTMLInputElement>('input[name="webrtc-display-mode"]:checked').value as WebRtcDisplayMode;
}

function selectMode(mode: WebRtcDisplayMode): void {
  requireElement<HTMLInputElement>(`input[name="webrtc-display-mode"][value="${mode}"]`).checked = true;
}

function showStatus(message: string, success: boolean): void {
  status.textContent = message;
  status.classList.toggle("is-error", !success);
}
