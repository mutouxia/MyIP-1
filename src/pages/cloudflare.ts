import "../styles.css";
import { cloudflareProbeCardConfigs, probeCardTarget } from "../config/dashboard";
import { probeProviders } from "../providers/probes";
import type { ProbeResult } from "../types";
import { renderCloudflareProbeCards } from "../ui/cloudflare-cards";
import { requireElement } from "../ui/dom";

const targets = Object.fromEntries(
  cloudflareProbeCardConfigs.map((config) => [config.providerId, probeCardTarget(config.providerId)]),
);
const providersById = new Map(probeProviders.map((provider) => [provider.id, provider]));

renderCloudflareProbeCards();

for (const target of Object.values(targets)) {
  setText(target.ip, "检测中");
  setText(target.geo, "");
}

for (const config of cloudflareProbeCardConfigs) {
  const provider = providersById.get(config.providerId);
  if (!provider) {
    renderProbeResult({
      providerId: config.providerId,
      status: "error",
      durationMs: 0,
      error: "探测配置不存在",
    });
    continue;
  }

  void provider.query().then(renderProbeResult);
}

function renderProbeResult(result: ProbeResult): void {
  const target = targets[result.providerId];
  if (!target) {
    return;
  }

  setText(target.ip, result.status === "success" ? result.ip || "N/A" : "N/A");
  setText(
    target.geo,
    result.status === "success" ? result.geo?.locationText || "未知节点" : result.error || "查询失败",
  );
}

function setText(id: string, value: string): void {
  requireElement<HTMLElement>(`#${id}`).textContent = value;
}
