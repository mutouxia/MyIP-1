import type { CloudflareProbeDefinition } from "../config/cloudflare-probes";
import { probeCardTarget } from "../config/dashboard";
import { el, requireElement } from "./dom";

export function renderCloudflareProbeCards(probes: CloudflareProbeDefinition[]): void {
  const list = requireElement<HTMLElement>("#cloudflare-probe-list");
  list.replaceChildren(...probes.map(renderCloudflareProbeCard));
}

function renderCloudflareProbeCard(probe: CloudflareProbeDefinition): HTMLElement {
  const target = probeCardTarget(probe.id);
  const row = el("article", { className: "trace-row" });
  const name = el("p", { className: "trace-name", text: probe.name });
  const ip = el("p", { className: "trace-ip" });
  const location = el("p", { className: "trace-location" });
  ip.id = target.ip;
  location.id = target.geo;
  row.append(name, ip, location);
  return row;
}
