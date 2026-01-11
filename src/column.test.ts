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

test("Handles simple LLC normalization", async () => {
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "شركة الفجر ذ.م.م" } // Al-Fajr LLC
  );
  expect(response).toContain("Company");
  expect(response).toContain("LLC");
});
