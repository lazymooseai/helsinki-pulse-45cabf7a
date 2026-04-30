/**
 * manualTolppaOverrides.ts
 *
 * Käyttäjän käsin määrittämät tolppakytkökset tapahtumille.
 * Tallennetaan localStorageen → kestää sessioiden yli, ei vaadi backendia.
 *
 * Avain on TimelineItemin id (esim. "event-123" tai "political-456").
 * Arvo on tolpan virallinen nimi (TOLPAT-listalta), esim. "Simonkenttä".
 * Jos arvo on tyhjä string, käyttäjä on kytkenyt tolpan irti.
 */

import { TOLPAT, type TolppaLocation } from "./tolppaLocations";

const KEY = "manual-tolppa-overrides:v1";

function read(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed != null ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
    // Tapahtuma jotta UI päivittyy heti
    window.dispatchEvent(new CustomEvent("manual-tolppa-changed"));
  } catch {
    // ignore quota errors
  }
}

export function getManualTolppa(itemId: string): TolppaLocation | null | undefined {
  const map = read();
  if (!(itemId in map)) return undefined;
  const name = map[itemId];
  if (!name) return null; // käyttäjä on poistanut tolpan
  return TOLPAT.find((t) => t.name === name);
}

export function setManualTolppa(itemId: string, tolppaName: string | null): void {
  const map = read();
  if (tolppaName === null) {
    delete map[itemId];
  } else {
    map[itemId] = tolppaName;
  }
  write(map);
}

export function getAllManualOverrides(): Record<string, string> {
  return read();
}