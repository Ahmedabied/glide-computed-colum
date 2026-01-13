import * as glide from "./glide";

// Azure Translator Proxy endpoint (Cloudflare Worker)
const TRANSLATE_ENDPOINT = "https://silent-fire-a4ef.ahmed-abied.workers.dev/translate";

// Simple in-memory cache
const cache = new Map<string, string>();

// Check if text contains Arabic characters
function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Title case helper
function titleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Main translation function
async function translate(text: string, from: string, to: string): Promise<string> {
  if (!text || !text.trim()) return "";

  // Check cache
  const cacheKey = `${from}:${to}:${text}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const response = await fetch(TRANSLATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        from: from,
        to: to,
      }),
    });

    if (!response.ok) {
      console.error("Translation failed:", response.status);
      return text; // Fallback to original
    }

    const data = await response.json();

    // Worker returns { results: ["translated text"] }
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      const result = data.results[0];
      cache.set(cacheKey, result);
      return result;
    }

    return text; // Fallback
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original
  }
}

export default glide.column({
  name: "Name Translator",
  description: "Translates names between Arabic and English using Azure Translator",
  author: "Ahmed Abied",
  about: "Uses Azure Cognitive Services for high-quality name translation.",
  video: "",

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

    // Only support en/ar
    if (targetLang !== "en" && targetLang !== "ar") {
      return inputName;
    }

    const inputIsArabic = isArabic(inputName);

    // Already in target language
    if (targetLang === "en" && !inputIsArabic) return inputName;
    if (targetLang === "ar" && inputIsArabic) return inputName;

    // Translate
    if (targetLang === "en" && inputIsArabic) {
      const result = await translate(inputName, "ar", "en");
      return titleCase(result);
    }

    if (targetLang === "ar" && !inputIsArabic) {
      return await translate(inputName, "en", "ar");
    }

    return inputName;
  },
});
