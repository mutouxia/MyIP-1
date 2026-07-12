import "../styles.css";
import { loadCloudflareProbes } from "../config/cloudflare-preference";
import { probeCardTarget } from "../config/dashboard";
import { queryCloudflareProbe } from "../providers/cloudflare";
import type { ProbeResult } from "../types";
import { renderCloudflareProbeCards } from "../ui/cloudflare-cards";
import { requireElement } from "../ui/dom";

const probes = loadCloudflareProbes();
const targets = Object.fromEntries(probes.map((probe) => [probe.id, probeCardTarget(probe.id)]));

renderCloudflareProbeCards(probes);

for (const target of Object.values(targets)) {
  setText(target.ip, "检测中");
  setText(target.geo, "");
}

for (const probe of probes) {
  void queryCloudflareProbe(probe).then(renderProbeResult);
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
