export type WebRtcDisplayMode = "always" | "off" | "auto";

interface StoredWebRtcPreference {
  version: 1;
  displayMode: WebRtcDisplayMode;
}

export const defaultWebRtcDisplayMode: WebRtcDisplayMode = "auto";

const storageKey = "myip.webrtc.preference.v1";
const validModes = new Set<WebRtcDisplayMode>(["always", "off", "auto"]);

export function parseWebRtcDisplayMode(raw: string | null): WebRtcDisplayMode {
  if (!raw) {
    return defaultWebRtcDisplayMode;
  }

  try {
    const stored = JSON.parse(raw) as Partial<StoredWebRtcPreference>;
    return stored.version === 1 && validModes.has(stored.displayMode as WebRtcDisplayMode)
      ? (stored.displayMode as WebRtcDisplayMode)
      : defaultWebRtcDisplayMode;
  } catch {
    return defaultWebRtcDisplayMode;
  }
}

export function loadWebRtcDisplayMode(): WebRtcDisplayMode {
  try {
    return parseWebRtcDisplayMode(window.localStorage.getItem(storageKey));
  } catch {
    return defaultWebRtcDisplayMode;
  }
}

export function saveWebRtcDisplayMode(displayMode: WebRtcDisplayMode): boolean {
  const preference: StoredWebRtcPreference = { version: 1, displayMode };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preference));
    return true;
  } catch {
    return false;
  }
}

export function clearWebRtcDisplayMode(): boolean {
  try {
    window.localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
