import {
  type ConnectivityCardConfig,
  type ProbeCardConfig,
  type ProbeCardSection,
  connectivityCardConfigs,
  connectivityCardTarget,
  homeProbeCardSections,
  probeCardTarget,
} from "../config/dashboard";
import type { WebRtcDisplayMode } from "../config/webrtc-preference";
import { el, requireElement } from "./dom";

export function renderDashboardCards(webrtcDisplayMode: WebRtcDisplayMode): void {
  const ipRows = requireElement<HTMLElement>("#ip-card-rows");
  const visibleSections = homeProbeCardSections.filter(
    (section) => webrtcDisplayMode !== "off" || !containsWebRtc(section),
  );
  ipRows.replaceChildren(...visibleSections.map((section) => renderProbeCardSection(section, webrtcDisplayMode)));

  const connectivityRow = requireElement<HTMLElement>("#connectivity-card-row");
  connectivityRow.replaceChildren(...connectivityCardConfigs.map(renderConnectivityCard));
}

export function revealProbeCard(providerId: string): void {
  const column = document.querySelector<HTMLElement>(`[data-provider-id="${providerId}"]`);
  if (!column) {
    return;
  }

  const section = column.closest<HTMLElement>(".probe-card-section");
  if (section?.classList.contains("probe-card-section--deferred")) {
    section.classList.add("is-visible");
    section.removeAttribute("aria-hidden");
  }
}

function renderProbeCardSection(config: ProbeCardSection, webrtcDisplayMode: WebRtcDisplayMode): HTMLElement {
  const isDeferred = containsWebRtc(config) && webrtcDisplayMode === "auto";
  const section = el("section", {
    className: `probe-card-section${isDeferred ? " probe-card-section--deferred" : ""}`,
  });
  const content = isDeferred ? el("div", { className: "probe-card-section-content" }) : section;
  if (config.title) {
    content.append(el("h2", { className: "sk-text-center sk-text-bold subtitle probe-section-title", text: config.title }));
  }
  content.append(...config.rows.map(renderProbeCardRow));
  if (isDeferred) {
    section.setAttribute("aria-hidden", "true");
    section.append(content);
  }
  return section;
}

function containsWebRtc(config: ProbeCardSection): boolean {
  return config.rows.flat().some((card) => card.providerId === "webrtc");
}

function renderProbeCardRow(cards: ProbeCardConfig[]): HTMLElement {
  const row = el("div", { className: "columns ip-card-row" });
  row.replaceChildren(...cards.map(renderProbeCard));
  return row;
}

function renderProbeCard(config: ProbeCardConfig): HTMLElement {
  const target = probeCardTarget(config.providerId);
  const column = el("div", { className: "column" });
  column.dataset.providerId = config.providerId;
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
