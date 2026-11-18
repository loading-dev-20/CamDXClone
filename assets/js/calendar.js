import { EVENT } from "./config.js";

/** Escape a value for an iCalendar text field (RFC 5545). */
function escapeText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** All-day ICS dates use the date portion of the configured ISO strings. */
function icsDate(isoString) {
  return isoString.slice(0, 10).replace(/-/g, "");
}

function timestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

/** Build an all-day calendar file for the event. */
export function buildIcs() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CamDX Hackathon 2026//Prototype//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${EVENT.icsUid}`,
    `DTSTAMP:${timestamp()}`,
    `DTSTART;VALUE=DATE:${icsDate(EVENT.start)}`,
    `DTEND;VALUE=DATE:${icsDate(EVENT.end)}`,
    `SUMMARY:${escapeText(EVENT.name)}`,
    `LOCATION:${escapeText(EVENT.location)}`,
    `DESCRIPTION:${escapeText(EVENT.officialUrl)}`,
    `URL:${EVENT.officialUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

function downloadIcs() {
  const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = EVENT.icsFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Wire the "Add to calendar" button. */
export function initCalendarButton() {
  const button = document.getElementById("cal");
  if (!button) return;

  button.addEventListener("click", downloadIcs);
}
