import * as glide from "./glide";
import { Cache } from "./cache";

const cache = new Cache();

// CORS proxy to bypass browser restrictions
const CORS_PROXY = "https://corsproxy.io/?";

// Business Dictionary for standard translations (English values should be Title Case)
const BUSINESS_TERMS: Record<string, string> = {
  // Legal Entities
  "ش م م": "LLC",
  "ش_م_م": "LLC", // Normalized
  "ش.م.م": "LLC",
  "ذ م م": "LLC",
  "ذ_م_م": "LLC", // Normalized
  "ذ.م.م": "LLC",
  "ش ش و": "S.P.C",
  "ش_ش_و": "S.P.C",
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

// Detect if text contains Arabic characters (Unicode range: 0x0600-0x06FF)
function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Normalize Arabic text for better matching
function normalizeArabic(text: string): string {
  return text
    .trim()
    .replace(/[أإآ]/g, "ا") // Normalize Alef
    .replace(/ة$/g, "ه") // Normalize Ta-Marbuta to Ha (often useful for matching)
    .replace(/\s+/g, " "); // Collapse spaces
}

function titleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Helper function to call QCRI transliteration API
async function transliterate(
  text: string,
  fetchFn: (url: string) => Promise<any>
): Promise<string> {
  const apiUrl = `https://transliterate.qcri.org/ar2en/${encodeURIComponent(text)}`;
  const finalUrl =
    typeof window !== "undefined"
      ? CORS_PROXY + encodeURIComponent(apiUrl)
      : apiUrl;
  const response = await fetchFn(finalUrl);
  return response.results ?? text; // Fallback to original text if no results
}

// Logic to process company names using Pre-Substitution approach
async function transliterateCompany(
  text: string,
  fetchFn: (url: string) => Promise<any>
): Promise<string> {
  let processedText = text;

  // 1. Sort dictionary keys by length (descending) to match longest phrases/words first
  const keys = Object.keys(BUSINESS_TERMS).sort((a, b) => b.length - a.length);

  // Normalize input spaces
  processedText = processedText.replace(/\s+/g, " ");

  // Normalization for known acronyms if needed
  processedText = processedText
    .replace(/ش\s+م\s+م/g, "ش_م_م")
    .replace(/ذ\s+م\s+م/g, "ذ_م_م")
    .replace(/ش\s+ش\s+و/g, "ش_ش_و");

  // 2. Perform Substitutions
  for (const key of keys) {
    const translation = BUSINESS_TERMS[key];

    // Handle Wa-prefixed version: "و" + key
    const waKey = "و" + key;
    if (processedText.includes(waKey)) {
      // Add spaces padding to English result to avoid sticking
      processedText = processedText.split(waKey).join(" and " + translation + " ");
    }

    // Handle Exact Key
    if (processedText.includes(key)) {
      processedText = processedText.split(key).join(" " + translation + " ");
    }
  }

  // Cleanup cleanup: Remove double spaces
  processedText = processedText.replace(/\s+/g, " ").trim();

  // 3. Block Processing
  // Find all sequences of Arabic characters (words inclusive of spaces between them)
  // Regex: Arabic char, followed by (Arabic chars OR spaces followed by Arabic chars)
  // This captures "Abd Allah" as one block, but "Abd English Allah" as "Abd", "Allah".
  const arabicBlockRegex = /[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*/g;

  const matches = processedText.match(arabicBlockRegex) || [];

  // Create a map of replacement tasks
  // We need to replace each unique block. 
  // Optimization: Deduplicate to avoid multiple calls for same name
  const uniqueBlocks = [...new Set(matches)];

  for (const block of uniqueBlocks) {
    try {
      // Transliterate the Arabic block
      const trans = await transliterate(block, fetchFn);

      // Apply title case to the transliteration (names usually need it)
      const procTrans = titleCase(trans);

      // Replace in text
      // Use split/join to replace all occurrences safe from specific regex chars (Arabic usually safe)
      processedText = processedText.split(block).join(" " + procTrans + " ");
    } catch (e) {
      console.error("Failed to transliterate block:", block, e);
      // Keep Arabic if failed
    }
  }

  // Final Cleanup
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

    // Special handling for Arabic -> English Company Names
    if (targetLang === "en" && inputIsArabic) {
      return await transliterateCompany(inputName, (url) => cache.fetch(url));
    }

    // Default flow (En->Ar or simple Ar->En fallback)
    const apiUrl =
      targetLang === "en"
        ? `https://transliterate.qcri.org/ar2en/${encodeURIComponent(inputName)}`
        : `https://transliterate.qcri.org/en2ar/${encodeURIComponent(inputName)}`;

    const finalUrl =
      typeof window !== "undefined"
        ? CORS_PROXY + encodeURIComponent(apiUrl)
        : apiUrl;

    try {
      const response = await cache.fetch(finalUrl);
      return response.results ?? inputName;
    } catch {
      return inputName;
    }
  },
});
