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
  "الاعمال المتعددة": "Diversified Business", // normalized alef usually handles this, but explicit for safety

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

  // "الزرقاء": "Blue" - Removed to avoid translating city names like Zarqa or brand names incorrectly.

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

// Logic to process company names
async function transliterateCompany(
  text: string,
  fetchFn: (url: string) => Promise<any>
): Promise<string> {
  let processedText = text;

  // 1. Handle Multi-word Phrases from Dictionary first (Maximal Munch)
  // Sort phrases by length (descending) to match longest first
  const phrases = Object.keys(BUSINESS_TERMS)
    .filter(k => k.includes(" ") || k.includes("_"))
    .sort((a, b) => b.length - a.length);

  // We need to be careful not to replace parts of words, only whole words.
  // Input text usually has spaces.
  // We can treat keys with underscores as needing underscores in text, OR normalize text first.

  // Let's normalize acronyms in text first to match keys with underscores (if any)
  // Specific fix for "ش ش و" etc.
  processedText = processedText
    .replace(/ش\s+م\s+م/g, "ش_م_م")
    .replace(/ذ\s+م\s+م/g, "ذ_م_م")
    .replace(/ش\s+ش\s+و/g, "ش_ش_و");

  // Now strict replace for known phrases
  for (const phrase of phrases) {
    // 1. Handle Wa-prefix (and ...)
    const waPhrase = "و" + phrase;
    if (processedText.includes(waPhrase)) {
      // Use split/join to replace all occurrences
      processedText = processedText.split(waPhrase).join(" " + "and " + BUSINESS_TERMS[phrase] + " ");
    }

    // 2. Handle exact phrase
    if (processedText.includes(phrase)) {
      processedText = processedText.split(phrase).join(" " + BUSINESS_TERMS[phrase] + " ");
    }
  }

  const words = processedText.split(/\s+/);
  const processedTokens: (string | null)[] = new Array(words.length).fill(null);
  const toTransliterate: { index: number; word: string }[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // If the word matches a pure English string (from our phrase replacement), assume it's done.
    // Simple verification check: consists of Latin characters?
    if (/^[A-Za-z0-9&.]+$/.test(word)) { // & for "& Co.", . for "S.P.C"
      processedTokens[i] = word; // preserve as is (already translated)
      continue;
    }

    // Try Lookups
    let translation: string | undefined = undefined;

    // 1. Exact Match
    if (BUSINESS_TERMS[word]) translation = BUSINESS_TERMS[word];

    // 2. Normalized Match
    if (!translation) {
      const norm = word.replace(/ة$/, "ه");
      if (BUSINESS_TERMS[norm]) translation = BUSINESS_TERMS[norm];
    }

    // 3. Strip 'Al-' (The) Prefix (ال)
    if (!translation && word.startsWith("ال") && word.length > 3) {
      const base = word.substring(2);
      if (BUSINESS_TERMS[base]) translation = BUSINESS_TERMS[base];
      else {
        // Try normalizing base
        const normBase = base.replace(/ة$/, "ه");
        if (BUSINESS_TERMS[normBase]) translation = BUSINESS_TERMS[normBase];
      }
    }

    // 4. Strip 'Wa-' (And) Prefix (و)
    if (!translation && word.startsWith("و") && word.length > 3) {
      const withoutWa = word.substring(1);
      // Check full word without Wa
      if (BUSINESS_TERMS[withoutWa]) {
        translation = "and " + BUSINESS_TERMS[withoutWa];
      } else {
        // Check without Wa AND without Al
        if (withoutWa.startsWith("ال") && withoutWa.length > 3) {
          const base = withoutWa.substring(2); // remove Al
          if (BUSINESS_TERMS[base]) translation = "and " + BUSINESS_TERMS[base];
        }
      }
    }

    if (translation) {
      processedTokens[i] = translation;
    } else {
      toTransliterate.push({ index: i, word });
    }
  }

  // If there are words to transliterate, send them to QCRI
  if (toTransliterate.length > 0) {
    // We join them to send as context, though QCRI is word-based usually. 
    // Sending individual words is safer to avoid sentence-level reordering attempts by the model.
    // However, names usually benefit from being together.
    // Let's optimize: Group consecutive unknown words to send together (Full Name logic)
    // For now, simple approach: transliterate the full phrase of unknown words if they are adjacent?
    // Safer approach: Transliterate the whole original string, then ONLY pick the parts we need? 
    // No, that brings the "wherican" issue back.
    // Best: Send the joined unknown words.

    const textToTransliterate = toTransliterate.map((t) => t.word).join(" ");

    // Build API URL
    const apiUrl = `https://transliterate.qcri.org/ar2en/${encodeURIComponent(textToTransliterate)}`;

    const finalUrl =
      typeof window !== "undefined"
        ? CORS_PROXY + encodeURIComponent(apiUrl)
        : apiUrl;

    try {
      const response = await fetchFn(finalUrl);
      const resultText = response.results || textToTransliterate;

      // We assume QCRI returns roughly same number of space-separated tokens
      // But it might not. "Abd Allah" -> "Abdallah". 
      // Simple heuristic: Put the whole result in the first unknown slot, or distribute?
      // "Abd Allah" (2 words) -> "Abdallah" (1 word).
      // Let's just place the whole result in the slots relative to where they appeared.

      // Actually simpler: 
      // Just replace the unknown block with the result. 
      // But we have interleaved known/unknown. 
      // "Mohamed Sarsar" (unknown) "and Co" (known) "Trading" (known).
      // We sent "Mohamed Sarsar". 

      // Let's assume the result corresponds to the joined string.
      const transliteratedWords = resultText.split(" ");

      // This mapping is tricky if word counts change. 
      // Simplify: Just replace the *sequence* of unknown tokens with the *sequence* of result tokens.
      // But we lost the positions if we just join.

      // Revised Strategy for unknown: Send individually? 
      // QCRI is slow for many requests.
      // Let's try sending the *whole original string* to QCRI first to get a "suggestion", 
      // BUT override the specific tokens we know from the dictionary.
      // That's risky if word alignment fails.

      // Back to: "Group consecutive unknowns"
      // Example: "Mohamed" (unk) "Sarsar" (unk) "LLC" (known)
      // Send "Mohamed Sarsar". Result "Mohamed Sarsar".
      // Put back.

      // Implementation: Just separate calls for separated naming blocks?
      // Or just one call with all names joined by a unique separator?
      // QCRI handles spaces fine.

      const transResponse = resultText;

      // Determine where to put this result.
      // Since we can't easily map back if word counts change, we will:
      // reconstruct the sentence array.

      // Simple Hack: If we have multiple unknown chunks separated by knowns, it's complex.
      // E.g. "Company" (known) "Name" (unk) "for" (known) "Trading" (known) "Something" (unk).
      // Rare for company names. Usually Name + Legal.

      // Let's just create a map of original word -> transliteration?
      // No, context matters.

      // Fallback: Just put the result in place of the first unknown, and clear others? 
      // No.

      // Let's simple fill:
      let tIndex = 0;
      const tWords = transResponse.split(/\s+/);

      for (let k = 0; k < toTransliterate.length; k++) {
        // If we have transliterated words left, take one. 
        // If "Abd Allah" becomes "Abdallah", we have fewer words. 
        // If "Sarsar" becomes "Sarsar", good.
        if (tIndex < tWords.length) {
          processedTokens[toTransliterate[k].index] = titleCase(tWords[tIndex]);
          tIndex++;
        } else {
          // We ran out of transliterated words (e.g. 2->1). 
          // Leave empty (null) which filters out later.
        }
      }

      // If we have extra transliterated words (1->2), append to the last used slot?
      while (tIndex < tWords.length) {
        const lastIdx = toTransliterate[toTransliterate.length - 1].index;
        processedTokens[lastIdx] += " " + titleCase(tWords[tIndex]);
        tIndex++;
      }

    } catch (e) {
      // Failed to transliterate, keep original words
      toTransliterate.forEach(item => {
        processedTokens[item.index] = item.word;
      });
    }
  }

  return processedTokens.filter(t => t !== null && t !== "").join(" ");
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
