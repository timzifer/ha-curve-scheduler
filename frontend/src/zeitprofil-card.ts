/** Entry point: registers all elements and announces the card to Home Assistant. */

import "./card";
import "./card-editor";
import { translator } from "./i18n";

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

const language = (navigator.language ?? "en").toLowerCase().startsWith("de") ? "de" : "en";
const t = translator(language);

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === "zeitprofil-card")) {
  window.customCards.push({
    type: "zeitprofil-card",
    name: t("card.name"),
    description: t("card.description"),
    preview: true,
  });
}

console.info("%c ZEITPROFIL-CARD ", "background:#e67e22;color:#fff;border-radius:3px");
