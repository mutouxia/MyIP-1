import {
  type ConnectivityCardConfig,
  type ProbeCardConfig,
  connectivityCardConfigs,
  connectivityCardTarget,
  homeProbeCardRows,
  probeCardTarget,
} from "../config/dashboard";
import { el, requireElement } from "./dom";

export function renderDashboardCards(): void {
  const ipRows = requireElement<HTMLElement>("#ip-card-rows");
  ipRows.replaceChildren(...homeProbeCardRows.map(renderProbeCardRow));

  const connectivityRow = requireElement<HTMLElement>("#connectivity-card-row");
  connectivityRow.replaceChildren(...connectivityCardConfigs.map(renderConnectivityCard));
}

function renderProbeCardRow(cards: ProbeCardConfig[]): HTMLElement {
  const row = el("div", { className: "columns ip-card-row" });
  row.replaceChildren(...cards.map(renderProbeCard));
  return row;
}

function renderProbeCard(config: ProbeCardConfig): HTMLElement {
  const target = probeCardTarget(config.providerId);
  const column = el("div", { className: "column" });
  const box = baseCard(config.title, config.source);
  const body = el("div", { className: "ip-body" });
  const text = el("div", { className: "sk-text-center" });
  const ip = el("p");
  ip.id = target.ip;
  const geo = el("p", { className: "sk-text-small" });
  geo.id = target.geo;
  text.append(ip, geo);
  body.append(text);
  box.append(body);
  column.append(box);
  return column;
}

function renderConnectivityCard(config: ConnectivityCardConfig): HTMLElement {
  const column = el("div", { className: "column is-half-mobile" });
  const box = baseCard(config.title, config.source);
  const body = el("div", { className: "http-body" });
  const text = el("div", { className: "sk-text-center" });
  const result = el("p");
  result.id = connectivityCardTarget(config.checkId);
  text.append(result);
  body.append(text);
  box.append(body);
  column.append(box);
  return column;
}

function baseCard(titleText: string, sourceText: string): HTMLElement {
  const box = el("div", { className: "box" });
  box.append(
    el("h2", { className: "sk-text-center sk-text-bold subtitle sk-mb-1", text: titleText }),
    el("p", { className: "sk-text-center sk-text-small", text: sourceText }),
    el("hr", { className: "sk-my-2" }),
  );
  return box;
}
