import "../styles.css";
import { connectivityCardConfigs, connectivityCardTarget, probeCardRows, probeCardTarget } from "../config/dashboard";
import { connectivityChecks, runConnectivityCheckTwice } from "../providers/connectivity";
import { probeProviders } from "../providers/probes";
import type { ConnectivityResult, ProbeResult } from "../types";
import { renderDashboardCards } from "../ui/cards";
import { requireElement } from "../ui/dom";

const probeTargets = Object.fromEntries(probeCardRows.flat().map((config) => [config.providerId, probeCardTarget(config.providerId)]));
const connectivityTargets = Object.fromEntries(
  connectivityCardConfigs.map((config) => [config.checkId, connectivityCardTarget(config.checkId)]),
);
const probeResults = new Map<string, ProbeResult>();

renderDashboardCards();

for (const target of Object.values(probeTargets)) {
  setText(target.ip, "检测中");
  setText(target.geo, "");
}

for (const target of Object.values(connectivityTargets)) {
  setText(target, "检测中");
}

for (const provider of probeProviders) {
  void provider.query().then((result) => {
    probeResults.set(result.providerId, result);
    renderProbeResult(result);
  });
}

for (const check of connectivityChecks) {
  void runConnectivityCheckTwice(check, renderConnectivityResult);
}

function renderProbeResult(result: ProbeResult): void {
  const target = probeTargets[result.providerId];
  if (!target) {
    return;
  }

  setText(target.ip, result.status === "success" ? result.ip || "N/A" : "N/A");
  setText(target.geo, result.status === "success" ? result.geo?.locationText || "不包含地理位置" : result.error || "查询失败");
}

function renderConnectivityResult(result: ConnectivityResult): void {
  const target = connectivityTargets[result.checkId];
  if (!target) {
    return;
  }

  const text =
    result.status === "success"
      ? `<span class="sk-text-success">连接正常 · ${result.durationMs}ms</span>`
      : `<span class="sk-text-error">${result.error || "无法访问"}</span>`;
  requireElement<HTMLElement>(`#${target}`).innerHTML = text;
}

function setText(id: string, value: string): void {
  requireElement<HTMLElement>(`#${id}`).textContent = value;
}
