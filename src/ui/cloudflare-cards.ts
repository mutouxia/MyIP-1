import { cloudflareProbeCardConfigs, probeCardTarget, type ProbeCardConfig } from "../config/dashboard";
import { el, requireElement } from "./dom";

export function renderCloudflareProbeCards(): void {
  const list = requireElement<HTMLElement>("#cloudflare-probe-list");
  list.replaceChildren(...cloudflareProbeCardConfigs.map(renderCloudflareProbeCard));
}

function renderCloudflareProbeCard(config: ProbeCardConfig): HTMLElement {
  const target = probeCardTarget(config.providerId);
  const row = el("article", { className: "trace-row" });
  const name = el("p", { className: "trace-name", text: config.source });
  const ip = el("p", { className: "trace-ip" });
  const location = el("p", { className: "trace-location" });
  ip.id = target.ip;
  location.id = target.geo;
  row.append(name, ip, location);
  return row;
}
