import { EVENT } from "./config.js";
import { LANGUAGE_CHANGE_EVENT, t } from "./i18n.js";

const START = new Date(EVENT.start).getTime();
const END = new Date(EVENT.end).getTime();
const SECOND = 1000;

const pad = (value) => String(value).padStart(2, "0");

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

/** Render the countdown, or the live/ended notice once the event starts. */
function render() {
  const countdown = document.getElementById("cd");
  const note = document.getElementById("cd-note");
  if (!countdown || !note) return;

  const now = Date.now();

  if (now >= START) {
    countdown.hidden = true;
    note.hidden = false;
    note.textContent = now < END ? t("live") : t("over");
    return;
  }

  countdown.hidden = false;
  note.hidden = true;

  let seconds = Math.floor((START - now) / SECOND);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  setText("cd-d", String(days));
  setText("cd-h", pad(hours));
  setText("cd-m", pad(minutes));
  setText("cd-s", pad(seconds));
}

/** Start the countdown and keep it in sync with language changes. */
export function initCountdown() {
  if (!document.getElementById("cd")) return;

  render();

  let timerId = window.setInterval(() => {
    render();
    if (Date.now() >= END) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }, SECOND);

  document.addEventListener(LANGUAGE_CHANGE_EVENT, render);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  window.addEventListener(
    "pagehide",
    () => {
      if (timerId) window.clearInterval(timerId);
    },
    { once: true },
  );
}
