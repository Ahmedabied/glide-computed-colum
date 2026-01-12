import * as glide from "./glide";
import { Cache } from "./cache";

const cache = new Cache();

// CORS proxy to bypass browser restrictions
const CORS_PROXY = "https://corsproxy.io/?url=";

// Business Dictionary for standard translations (English values should be Title Case)
// We will normalize keys at runtime for matching
const BUSINESS_TERMS: Record<string, string> = {
  // Legal Entities
  "ش م م": "LLC",
  "ذ م م": "LLC",
  "ش ش و": "S.P.C",
  "مساهمة": "Joint Stock",
  "محدودة": "Limited",

  // Phrases (Bigrams for reordering/better transliteration)
  "المشاريع الطبية": "Medical Projects",
  "الخدمات الطبية": "Medical Services",
  "التجارة العامة": "General Trading",
  "الأعمال المتعددة": "Diversified Business",
  "الاعمال المتعددة": "Diversified Business",

  // Business Activities (Single Words)
  "للتجارة": "Trading",
  "التجارة": "Trading",
  "تجارة": "Trading",

  "للاستثمار": "Investment",
  "الاستثمار": "Investment",
  "استثمار": "Investment",

  "للمقاولات": "Contracting",
  "المقاولات": "Contracting",
  "مقاولات": "Contracting",

  "للخدمات": "Services",
  "الخدمات": "Services",
  "خدمات": "Services",

  "للصناعة": "Industrial",
  "الصناعة": "Industrial",
  "صناعة": "Industrial",

  "للاستيراد": "Import",
  "الاستيراد": "Import",
  "استيراد": "Import",

  "للتصدير": "Export",
  "التصدير": "Export",
  "تصدير": "Export",

  "والتوزيع": "and Distribution",
  "التوزيع": "Distribution",
  "توزيع": "Distribution",

  "القابضة": "Holding",
  "الشركة": "The Company",
  "شركة": "Company",
  "مجموعة": "Group",
  "مؤسسة": "Establishment",
  "المؤسسة": "The Establishment",
  "مكتب": "Office",

  "المشاريع": "Projects",
  "مشاريع": "Projects",

  "الطبية": "Medical",
  "طبية": "Medical",

  "العامة": "General",
  "عامه": "General",

  "المتعددة": "Diversified",
  "متعددة": "Diversified",

  "الأعمال": "Business",
  "الاعمال": "Business",
  "أعمال": "Business",
  "اعمال": "Business",

  // Conjunctions & Partners
  "وشركاه": "& Partners",
  "وشركائهم": "& Partners",
  "وشريكتة": "& Co.",
  "وشريكته": "& Co.",
};

// Company Indicators for detection
// These should generally match keys in BUSINESS_TERMS that strongly imply a company
const COMPANY_INDICATORS = [
  "شركة",
  "مؤسسة",
  "مجموعة",
  "القابضة",
  "للتجارة",
  "المقاولات",
  "الخدمات",
  "استثمار",
  "ش م م",
  "ذ م م",
  "ش.م.م",
  "ذ.م.م",
  "للاستثمار",
  "للمقاولات",
  "للخدمات",
  "للصناعة",
  "للاستيراد",
  "للتصدير",
  "والتوزيع",
];

// Detect if text contains Arabic characters (Unicode range: 0x0600-0x06FF)
function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Normalize Arabic text for better matching
function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/[أإآ]/g, "ا") // Normalize Alef
    .replace(/ة$/g, "ه") // Normalize Ta-Marbuta to Ha at end of word (often useful for matching)
    .replace(/ة\s/g, "ه ") // Normalize Ta-Marbuta if followed by space
    .replace(/[.,]/g, " ") // Replace punctuation
    .replace(/\s+/g, " "); // Collapse spaces
}

// Check if string looks like a company name
function looksLikeCompany(text: string): boolean {
  const normalized = normalizeArabic(text);
  return COMPANY_INDICATORS.some((indicator) => {
    // Check for indicator as a whole word or part of the string safely
    // simple includes check after normalization is usually enough given our indicators are distinct, 
    // but word boundary check is safer if indicators are short words.
    // However, for "ش م م", normalization might have removed dots.
    const normIndicator = normalizeArabic(indicator);
    // Escape regex chars
    const escaped = normIndicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}($|\\s)`);
    return regex.test(normalized);
  });
}

function titleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Safely replace a whole word/phrase in text
function replaceWord(text: string, target: string, replacement: string): string {
  // Normalize both for matching purposes, but we need to replace in the original text chain...
  // Actually, since we normalize the input text at the start of the company pipeline, 
  // we can just operate on the normalized text.
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match whole word boundary. 
  // Note: \b doesn't work well with Arabic characters. 
  // We use (^|\s) and ($|\s) logic or lookarounds.
  const regex = new RegExp(`(^|\\s)${escaped}(?=$|\\s)`, "g");

  // Replacer function to preserve the leading space if it was matched
  return text.replace(regex, (match, p1) => {
    // p1 is the leading whitespace or empty string
    // specific logic: if we match " word", we replace with " replacement"
    // if we match "word" at start, we replace with "replacement"
    return p1 + " " + replacement + " "; // Add padding spaces, will be collapsed later
  });
}

// Heuristic to pick best transliteration candidate
function pickBest(candidates: string[]): string {
  if (!candidates || candidates.length === 0) return "";

  // Prefer candidates with more vowels (approximate for 'better English')
  // and shorter length (usu. less noise), but really just first is often best from QCRI.
  // QCRI usually sorts by probability.

  // Let's filter out ones that look like garbage or pure consonants if possible.
  // For now, returning the first valid one is the baseline, 
  // but let's try to avoid ones with numbers or high ratio of non-letters.
  return candidates[0];
}

interface QCRIResponse {
  results?: string[]; // nbest returns a list
  // Simple endpoint returns { results: string } ? No, usually different shape.
  // We will assume nbest endpoint usage.
}

// Helper function to call QCRI transliteration API
async function transliterate(
  text: string,
  fetchFn: (url: string) => Promise<any>
): Promise<string> {
  if (!text.trim()) return "";

  // Use nbest endpoint for better results
  const apiUrl = `https://transliterate.qcri.org/ar2en/nbest/${encodeURIComponent(text)}`;
  const finalUrl =
    typeof window !== "undefined"
      ? CORS_PROXY + encodeURIComponent(apiUrl)
      : apiUrl;

  try {
    const response = await fetchFn(finalUrl);
    // QCRI nbest returns { results: { "0": "...", "1": "..." } } - object, not array
    // Simple endpoint returns { results: "string" }
    if (response && response.results) {
      if (typeof response.results === "string") {
        return response.results;
      }
      if (typeof response.results === "object") {
        // Handle both array and object with numeric keys
        const values = Array.isArray(response.results)
          ? response.results
          : Object.values(response.results);
        return pickBest(values as string[]);
      }
    }
    return text;
  } catch (e) {
    console.error("Transliteration Error", e);
    return text;
  }
}

// Logic to process company names using Pre-Substitution approach
async function transliterateCompany(
  text: string,
  fetchFn: (url: string) => Promise<any>
): Promise<string> {
  // 1. Normalize input
  let processedText = normalizeArabic(text);

  // 2. Prepare Dictionary (Normalize Keys)
  // We do this inside to ensure it handles the specific normalization rules
  // Optimization: Could be moved out, but cheap enough here.
  const sortedKeys = Object.keys(BUSINESS_TERMS).sort((a, b) => b.length - a.length);

  // 3. Perform Substitutions
  for (const key of sortedKeys) {
    const normKey = normalizeArabic(key);
    const translation = BUSINESS_TERMS[key];

    // Check if key exists (normalized)
    if (processedText.includes(normKey)) {
      processedText = replaceWord(processedText, normKey, translation);
    }

    // Also check specialized "Wa" (And) prefix cases if needed?
    // normalizeArabic collapses spaces, handled.
    // If we want "و" + key, normalizeArabic("وشركاه") -> "وشركاه"
    // which matches our dictionary key. 
    // If we have dynamic "و" + arbitrary word, complex.
    // Dictionary already has "وشركاه" etc.
  }

  // Cleanup: Remove extra spaces
  processedText = processedText.replace(/\s+/g, " ").trim();

  // 4. Block Processing
  // Find all standing Arabic blocks remaining
  const arabicBlockRegex = /[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*/g;
  const matches = processedText.match(arabicBlockRegex) || [];
  const uniqueBlocks = [...new Set(matches)];

  for (const block of uniqueBlocks) {
    try {
      const trans = await transliterate(block, fetchFn);
      const procTrans = titleCase(trans);
      processedText = replaceWord(processedText, block, procTrans);
    } catch (e) {
      console.error("Failed to transliterate block:", block, e);
    }
  }

  return processedText.replace(/\s+/g, " ").trim();
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

    if (targetLang !== "en" && targetLang !== "ar") {
      return inputName;
    }

    const inputIsArabic = isArabic(inputName);

    if (targetLang === "en" && !inputIsArabic) return inputName;
    if (targetLang === "ar" && inputIsArabic) return inputName;

    // Arabic -> English Logic
    if (targetLang === "en" && inputIsArabic) {
      if (looksLikeCompany(inputName)) {
        return await transliterateCompany(inputName, (url) => cache.fetch(url));
      } else {
        // Simple Person Name or unknown generic
        const result = await transliterate(inputName, (url) => cache.fetch(url));
        return titleCase(result);
      }
    }

    // English -> Arabic (Legacy/Fallback)
    // Using simple endpoint or nbest? nbest is ar2en only usually?
    // QCRI has en2ar. 
    const apiUrl = `https://transliterate.qcri.org/en2ar/${encodeURIComponent(inputName)}`;
    const finalUrl =
      typeof window !== "undefined"
        ? CORS_PROXY + encodeURIComponent(apiUrl)
        : apiUrl;

    try {
      // The simple endpoint returns { results: string } usually?
      // Or { results: [string] }? 
      // The original code expected response.results to be string or something.
      // Let's safe check.
      const response = await cache.fetch(finalUrl);
      if (response && response.results) {
        return Array.isArray(response.results) ? response.results[0] : response.results;
      }
      return inputName;
    } catch {
      return inputName;
    }
  },
});
