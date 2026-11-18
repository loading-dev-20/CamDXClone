import { DEFAULT_LANGUAGE, EVENT, SUPPORTED_LANGUAGES } from "./config.js";
import en from "./locales/en.js";
import km from "./locales/km.js";

const translations = { en, km };

export const LANGUAGE_CHANGE_EVENT = "languagechange";

let currentLanguage = DEFAULT_LANGUAGE;

/** Translate a key for the active language, falling back to English. */
export function t(key) {
  return (
    translations[currentLanguage]?.[key] ??
    translations[DEFAULT_LANGUAGE]?.[key] ??
    key
  );
}

export function getLanguage() {
  return currentLanguage;
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(EVENT.storageKey);
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistLanguage(language) {
  try {
    localStorage.setItem(EVENT.storageKey, language);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The page
    // still works for the current visit.
  }
}

/**
 * Apply a language to the document and notify other modules.
 * @param {string} language
 * @param {{ persist?: boolean }} [options]
 */
export function setLanguage(language, { persist = true } = {}) {
  currentLanguage = SUPPORTED_LANGUAGES.includes(language)
    ? language
    : DEFAULT_LANGUAGE;

  document.documentElement.lang = currentLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translations[currentLanguage]?.[element.dataset.i18n];
    if (value) element.textContent = value;
  });

  document.querySelectorAll(".lang button[data-lang]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.lang === currentLanguage),
    );
  });

  if (persist) persistLanguage(currentLanguage);

  document.dispatchEvent(
    new CustomEvent(LANGUAGE_CHANGE_EVENT, {
      detail: { language: currentLanguage },
    }),
  );
}

/** Wire the language buttons and restore the visitor's last choice. */
export function initI18n() {
  document.querySelectorAll(".lang button[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.lang !== currentLanguage) {
        setLanguage(button.dataset.lang);
      }
    });
  });

  setLanguage(readStoredLanguage() ?? DEFAULT_LANGUAGE, { persist: false });
}
