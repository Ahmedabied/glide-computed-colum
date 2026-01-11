import main from "./column";

// Arabic to English transliteration
test("Transliterates Arabic name to English", async () => {
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "احمد" }
  );
  expect(typeof response).toBe("string");
  expect(response.length).toBeGreaterThan(0);
});

// English to Arabic transliteration
test("Transliterates English name to Arabic", async () => {
  const response = await main.run(
    { type: "string", value: "ar" },
    { type: "string", value: "Ahmed" }
  );
  expect(response).toMatch(/[\u0600-\u06FF]/); // Contains Arabic chars
});

// Pass-through cases
test("Passes through English when target is en", async () => {
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "John" }
  );
  expect(response).toBe("John");
});

test("Passes through Arabic when target is ar", async () => {
  const response = await main.run(
    { type: "string", value: "ar" },
    { type: "string", value: "محمد" }
  );
  expect(response).toBe("محمد");
});

// Edge cases
test("Returns undefined for missing params", async () => {
  const response = await main.run(
    { type: "string", value: undefined },
    { type: "string", value: "Ahmed" }
  );
  expect(response).toBeUndefined();
});

// Company Name Tests
test("Translates known company terms correctly", async () => {
  // "Mohamed Sarsar" (QCRI) + "and Co." (Dict) + "Trading" (Dict) + "LLC" (Dict)
  // Input: محمد سرسار وشريكتة للتجارة ش م م
  // Expected: Mohamed Sarsar & Co. Trading LLC

  // Note: We are mocking/relying on QCRI for "Mohamed Sarsar".
  // For stability in tests without mocking fetch deeply, we check the structure.

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "محمد سرسار وشريكتة للتجارة ش م م" }
  );

  // Check for Dictionary terms
  expect(response).toContain("& Co.");
  expect(response).toContain("Trading");
  expect(response).toContain("LLC");

  // Check that the name part is Latin-ized (not Arabic)
  expect(response).not.toMatch(/[\u0600-\u06FF]/);
});

test("Handles complex phrases and S.P.C", async () => {
  // Case 1: الأعمال المتعددة للاستثمار والمشاريع الطبية ش ش و
  // Expected: ... Diversified Business Investment ... Medical Projects S.P.C
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "الأعمال المتعددة للاستثمار والمشاريع الطبية ش ش و" }
  );

  expect(response).toContain("Diversified Business"); // Phrase match
  expect(response).toContain("Investment"); // Strip 'Li-Al-' (للاستثمار) -> İstathmar?
  // Wait, 'للاستثمار' -> 'Li' + 'Al' + 'Istithmar'. 
  // My dictionary has 'للاستثمار'. Simple lookup.

  expect(response).toContain("Medical Projects"); // Phrase match (swapped order)
  expect(response).toContain("S.P.C"); // Normalized acronym
});

test("Handles definite articles and fallback lookups", async () => {
  // "المشاريع" -> "Projects" (via Al- strip if not exact, but I added exact)
  // "الحمامة الزرقاء" -> "Hammama Zarqa" (Zarqa not in dict)
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "المشاريع الحمامة الزرقاء" }
  );
  expect(response).toContain("Projects");
  // Zarqa should be transliterated, not translated as "Blue"
  // We can't easily assert transliteration exactness without mocking, but check it's not "Blue"
  expect(response).not.toContain("Blue");
});

test("Verify Al preservation for names", async () => {
  // "المشاريع" -> "Projects" (via dict)
  // "الحمامة الزرقاء" -> "Hammama Zarqa" (Zarqa not in dict)
  // Verify 'Al' is preserved for names if QCRI provides it (QCRI usually does for proper nouns)
  // Note: We can't strictly assert QCRI output without mocking, but we can assume standard behavior.
  // Let's test non-dict word with Al.
  // "الفجر" (The Dawn) -> "Al Fajar" or "Al-Fajar"

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "شركة الفجر" }
  );
  expect(response).toContain("Company");
  // We expect 'Al' to be present because 'Fajr' is not in our dictionary
  // response should be "Company Al Fajar" or similar.
  // We use simple regex to check for Al/El
  expect(response).toMatch(/Al|El/i);
});

test("Handles simple LLC normalization", async () => {
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "شركة الفجر ذ.م.م" } // Al-Fajr LLC
  );
  expect(response).toContain("Company");
  expect(response).toContain("LLC");
});
