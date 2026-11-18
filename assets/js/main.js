import { initNetworkAnimation } from "./animation.js";
import { initCalendarButton } from "./calendar.js";
import { initCountdown } from "./countdown.js";
import { initI18n } from "./i18n.js";

initI18n();
initCountdown();
initCalendarButton();
initNetworkAnimation(document.getElementById("net"));
