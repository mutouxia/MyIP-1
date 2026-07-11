import "../styles.css";
import { probeCardConfigs, type ProbeCardConfig } from "../config/dashboard";
import {
  type CardDisplayMode,
  clearProbeDisplayModes,
  defaultProbeDisplayMode,
  loadProbeDisplayModes,
  saveProbeDisplayModes,
} from "../config/preferences";
import { el, requireElement } from "../ui/dom";

const providerIds = probeCardConfigs.map((config) => config.providerId);
const form = requireElement<HTMLFormElement>("#preferences-form");
const groupsContainer = requireElement<HTMLElement>("#settings-groups");
const status = requireElement<HTMLElement>("#settings-status");

renderSettings(loadProbeDisplayModes(providerIds));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const saved = saveProbeDisplayModes(readModes());
  showStatus(saved ? "设置已保存在此浏览器中。" : "浏览器存储不可用，设置未保存。", saved);
});

requireElement<HTMLButtonElement>("#reset-settings").addEventListener("click", () => {
  const cleared = clearProbeDisplayModes();
  renderSettings(defaultModes());
  showStatus(cleared ? "已恢复默认设置。" : "浏览器存储不可用，无法清除原设置。", cleared);
});

function renderSettings(modes: Record<string, CardDisplayMode>): void {
  const grouped = [
    { title: "本机", cards: probeCardConfigs.filter((config) => config.providerId === "webrtc") },
    { title: "国内网站", cards: probeCardConfigs.filter((config) => config.title.includes("国内")) },
    {
      title: "海外网站",
      cards: probeCardConfigs.filter((config) => config.providerId !== "webrtc" && !config.title.includes("国内")),
    },
  ];

  groupsContainer.replaceChildren(
    ...grouped.filter((group) => group.cards.length > 0).map((group) => renderGroup(group.title, group.cards, modes)),
  );
}

function renderGroup(title: string, cards: ProbeCardConfig[], modes: Record<string, CardDisplayMode>): HTMLElement {
  const section = el("section", { className: "settings-group" });
  section.append(el("h2", { className: "settings-group-title", text: title }));
  const list = el("div", { className: "settings-list" });
  list.replaceChildren(...cards.map((card) => renderSettingRow(card, modes[card.providerId])));
  section.append(list);
  return section;
}

function renderSettingRow(config: ProbeCardConfig, selectedMode: CardDisplayMode): HTMLElement {
  const row = el("div", { className: "setting-row" });
  const identity = el("div", { className: "setting-identity" });
  identity.append(
    el("span", { className: "setting-name", text: config.source.replace(/^数据来自\s*/, "") }),
    el("span", { className: "setting-description", text: config.title }),
  );

  const options = el("div", { className: "mode-options" });
  const optionConfigs: Array<[CardDisplayMode, string]> = [
    ["large", "大卡片"],
    ["compact", "小卡片"],
    ["hidden", "隐藏"],
  ];
  options.replaceChildren(
    ...optionConfigs.map(([mode, label]) => {
      const option = el("label", { className: "mode-option" });
      const input = el("input");
      input.type = "radio";
      input.name = `probe-${config.providerId}`;
      input.value = mode;
      input.checked = mode === selectedMode;
      option.append(input, el("span", { text: label }));
      return option;
    }),
  );

  row.append(identity, options);
  return row;
}

function readModes(): Record<string, CardDisplayMode> {
  return Object.fromEntries(
    providerIds.map((providerId) => {
      const selected = requireElement<HTMLInputElement>(`input[name="probe-${providerId}"]:checked`);
      return [providerId, selected.value as CardDisplayMode];
    }),
  );
}

function defaultModes(): Record<string, CardDisplayMode> {
  return Object.fromEntries(providerIds.map((providerId) => [providerId, defaultProbeDisplayMode(providerId)]));
}

function showStatus(message: string, success: boolean): void {
  status.textContent = message;
  status.classList.toggle("is-error", !success);
}
