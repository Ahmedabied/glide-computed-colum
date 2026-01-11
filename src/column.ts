import * as glide from "./glide";
import { Cache } from "./cache";

const cache = new Cache();

// Detect if text contains Arabic characters (Unicode range: 0x0600-0x06FF)
function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export default glide.column({
  name: "Name Transliterator",
  description: "Transliterates names between Arabic and English scripts.",
  author: "Glide User",
  params: {
    language: {
      displayName: "Target Language",
      type: "string",
    },
    name: {
      displayName: "Name",
      type: "string",
    },
  },
  result: { type: "string" },

  async run(language, name) {
    if (language.value === undefined || name.value === undefined) {
      return undefined;
    }

    const targetLang = language.value.toLowerCase().trim();
    const inputName = name.value.trim();

    if (!inputName) {
      return "";
    }

    // Validate language parameter
    if (targetLang !== "en" && targetLang !== "ar") {
      return inputName;
    }

    const inputIsArabic = isArabic(inputName);

    // If already in target script, return unchanged
    if (targetLang === "en" && !inputIsArabic) {
      return inputName;
    }
    if (targetLang === "ar" && inputIsArabic) {
      return inputName;
    }

    // Transliterate via QCRI API
    const endpoint =
      targetLang === "en"
        ? `https://transliterate.qcri.org/ar2en/${encodeURIComponent(inputName)}`
        : `https://transliterate.qcri.org/en2ar/${encodeURIComponent(inputName)}`;

    try {
      const response = await cache.fetch(endpoint);
      return response.results ?? inputName;
    } catch {
      return inputName;
    }
  },
});
