import {
  type ConnectivityCardConfig,
  type ProbeCardConfig,
  connectivityCardConfigs,
  connectivityCardTarget,
  defaultLargeProbeIds,
  probeCardConfigs,
  probeCardTarget,
} from "../config/dashboard";
import { el, requireElement } from "./dom";

export function renderDashboardCards(): void {
  const largeProbeCards = probeCardConfigs.filter((config) => defaultLargeProbeIds.has(config.providerId));
  const compactProbeCards = probeCardConfigs.filter((config) => !defaultLargeProbeIds.has(config.providerId));
  const ipRows = requireElement<HTMLElement>("#ip-card-rows");
  ipRows.replaceChildren(...chunk(largeProbeCards, 3).map(renderProbeCardRow));

  const compactList = requireElement<HTMLElement>("#compact-ip-card-list");
  compactList.replaceChildren(renderCompactProbeHeader(), ...compactProbeCards.map(renderCompactProbeCard));

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

function renderCompactProbeCard(config: ProbeCardConfig): HTMLElement {
  const target = probeCardTarget(config.providerId);
  const card = el("article", { className: "compact-card" });
  const heading = el("div", { className: "compact-card-heading" });
  const name = el("span", { className: "compact-card-name", text: config.source.replace(/^数据来自\s*/, "") });
  const kind = el("span", { className: "compact-card-kind", text: compactKind(config.title) });
  const ip = el("p", { className: "compact-card-ip" });
  const geo = el("p", { className: "compact-card-geo" });
  ip.id = target.ip;
  geo.id = target.geo;
  heading.append(name, kind);
  card.append(heading, ip, geo);
  return card;
}

function renderCompactProbeHeader(): HTMLElement {
  const header = el("div", { className: "compact-card compact-card-header" });
  header.append(el("span", { text: "网站" }), el("span", { text: "IP" }), el("span", { text: "地理位置" }));
  return header;
}

function compactKind(title: string): string {
  if (title.includes("本机")) {
    return "本机";
  }
  if (title.includes("国内")) {
    return "国内";
  }
  return "国际";
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

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
