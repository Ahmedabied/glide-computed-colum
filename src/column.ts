import * as glide from "./glide";
import { Cache } from "./cache";

const cache = new Cache();

// CORS proxy to bypass browser restrictions
const CORS_PROXY = "https://corsproxy.io/?";

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

    // Build API URL
    const apiUrl =
      targetLang === "en"
        ? `https://transliterate.qcri.org/ar2en/${encodeURIComponent(inputName)}`
        : `https://transliterate.qcri.org/en2ar/${encodeURIComponent(inputName)}`;

    // Use CORS proxy only in browser environment (Glide)
    // Direct server-side calls (tests) don't need proxy and might be blocked by it
    const finalUrl =
      typeof window !== "undefined"
        ? CORS_PROXY + encodeURIComponent(apiUrl)
        : apiUrl;

    try {
      const response = await cache.fetch(finalUrl);
      return response.results ?? inputName;
    } catch (error) {
      // Return error info for debugging
      return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
