import { defaultLargeProbeIds } from "./dashboard";

export type CardDisplayMode = "large" | "compact" | "hidden";

interface StoredDashboardPreferences {
  version: 1;
  probeModes: Record<string, CardDisplayMode>;
}

const storageKey = "myip.dashboard.preferences.v1";
const validModes = new Set<CardDisplayMode>(["large", "compact", "hidden"]);

export function defaultProbeDisplayMode(providerId: string): CardDisplayMode {
  return defaultLargeProbeIds.has(providerId) ? "large" : "compact";
}

export function parseProbeDisplayModes(raw: string | null, providerIds: string[]): Record<string, CardDisplayMode> {
  const defaults = Object.fromEntries(
    providerIds.map((providerId) => [providerId, defaultProbeDisplayMode(providerId)]),
  ) as Record<string, CardDisplayMode>;

  if (!raw) {
    return defaults;
  }

  try {
    const stored = JSON.parse(raw) as Partial<StoredDashboardPreferences>;
    if (stored.version !== 1 || !stored.probeModes || typeof stored.probeModes !== "object") {
      return defaults;
    }

    for (const providerId of providerIds) {
      const mode = stored.probeModes[providerId];
      if (validModes.has(mode)) {
        defaults[providerId] = mode;
      }
    }
  } catch {
    return defaults;
  }

  return defaults;
}

export function loadProbeDisplayModes(providerIds: string[]): Record<string, CardDisplayMode> {
  try {
    return parseProbeDisplayModes(window.localStorage.getItem(storageKey), providerIds);
  } catch {
    return parseProbeDisplayModes(null, providerIds);
  }
}

export function saveProbeDisplayModes(modes: Record<string, CardDisplayMode>): boolean {
  const preferences: StoredDashboardPreferences = {
    version: 1,
    probeModes: modes,
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export function clearProbeDisplayModes(): boolean {
  try {
    window.localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
