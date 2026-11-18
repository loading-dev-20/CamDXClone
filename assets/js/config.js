/**
 * Single source of truth for event details.
 * Update dates, links and filenames here instead of hunting through the page.
 */
export const EVENT = Object.freeze({
  name: "CamDX Hackathon 2026",
  /** ISO 8601 with the event timezone offset (Phnom Penh, UTC+7). */
  start: "2026-12-12T00:00:00+07:00",
  end: "2026-12-14T00:00:00+07:00",
  timezone: "Asia/Phnom_Penh",
  location: "Phnom Penh",
  officialUrl: "https://hackathon.camdx.gov.kh",
  icsFileName: "camdx-hackathon-2026.ics",
  icsUid: "camdx-hackathon-2026@camdx-prototype",
  storageKey: "camdx-lang",
});

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = Object.freeze(["en", "km"]);
