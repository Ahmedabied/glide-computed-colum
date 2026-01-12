import main from "./column";

// Mock the global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Helpers to simulate QCRI response
// Data-driven test cases
const TEST_CASES = [
  { input: "احمد", lang: "en", expected: "Ahmed", desc: "Simple Person Name" },
  { input: "شركة احمد", lang: "en", expected: "Company Ahmed", desc: "Simple Company" },
  { input: "محمد العامه", lang: "en", expected: "Mohamed Al Ammah", desc: "Person with 'General' in name" },
  { input: "محمد سرسار وشريكتة للتجارة ش م م", lang: "en", expected: "Mohamed Sarsar & Co. Trading LLC", desc: "Complex Company Name" },
  { input: "شركة الفجر ذ.م.م", lang: "en", expected: "Company Al Fajar LLC", desc: "LLC Variant" },
  // Add more cases here
];

// Helpers to simulate QCRI response
const mockQCRI = (input: string, output: string) => {
  return {
    ok: true,
    json: async () => ({
      results: [output]
    })
  };
};

beforeEach(() => {
  mockFetch.mockReset();
});

// Arabic to English transliteration
test("Transliterates Arabic name to English (Simple Person)", async () => {
  // Setup: Person name "احمد" -> "Ahmed"
  // Should NOT trigger Company pipeline logic
  mockFetch.mockResolvedValue(mockQCRI("احمد", "Ahmed"));

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "احمد" }
  );

  expect(response).toBe("Ahmed");
  expect(mockFetch).toHaveBeenCalledTimes(1);
  // Verify it called the nbest endpoint
  expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("nbest"));
});

// Company Pipeline Trigger
test("Triggers Company Pipeline for valid company indicators", async () => {
  // Input: "شركة احمد" (Company Ahmed)
  // Should detect "شركة" and replace it with "Company", then transliterate "احمد".

  // We need to support multiple calls potentially or one if block processing happens.
  // The code replaces "Company" first. Remaining block "احمد".
  mockFetch.mockImplementation(async (url) => {
    const decoded = decodeURIComponent(url);
    if (decoded.includes("احمد")) return mockQCRI("احمد", "Ahmed");
    return mockQCRI("", "");
  });

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "شركة احمد" }
  );

  expect(response).toBe("Company Ahmed");
});

// Strict Person Separation
test("Does NOT substitute business terms in Person names", async () => {
  // Input: "محمد العامه" (Mohamed Al-Ammah - looks like 'General' but follows name)
  // If it DOES NOT contain a company indicator, it should go to simple pipeline.
  // "العامه" is in dict as "General", but without "Company"/"LLC" indicator, 
  // it should be treated as a whole name string sent to QCRI.

  // QCRI might transliterate "العامه" as "Al Ammah".
  mockFetch.mockResolvedValue(mockQCRI("محمد العامه", "Mohamed Al Ammah"));

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "محمد العامه" }
  );

  // Should NOT contain "General"
  expect(response).toBe("Mohamed Al Ammah");
  expect(response).not.toContain("General");
});

// Boundary Safety
test("Does NOT substitute dictionary terms if part of another word", async () => {
  // "للتجارة" maps to "Trading".
  // "باللتجارة" (Bi-Lil-Tijara - meaningless example but suffix check)
  // Or "استثمار" (Investment). 
  // "استثمارك" (Your investment). Should not become "Investment k".

  // We need to force company mode for substitution to happen at all.
  // "شركة استثمارك"

  // Mock QCRI for "استثمارك" -> "Estithmarak"
  mockFetch.mockResolvedValue(mockQCRI("استثمارك", "Estithmarak"));

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "شركة استثمارك" }
  );

  // "شركة" -> "Company"
  // "استثمارك" -> "Estithmarak" (Not "Investment k")
  expect(response).toBe("Company Estithmarak");
  expect(response).not.toContain("Investment");
});

// Complex Company Name
test("Translates known company terms correctly (Complex)", async () => {
  // Input: "محمد سرسار وشريكتة للتجارة ش م م"
  // Indicators: "للتجارة", "ش م م", "وشريكتة".
  // Pipeline: 
  // 1. "وشريكتة" -> "& Co."
  // 2. "للتجارة" -> "Trading"
  // 3. "ش م م" -> "LLC"
  // 4. Remaining: "محمد سرسار"

  mockFetch.mockImplementation(async (url) => {
    // URL is double encoded: Proxy -> API -> Text
    // decodeURIComponent(url) gives us the API URL which still has encoded text.
    // We can just check for the encoded component or decode again.
    const decoded = decodeURIComponent(url);
    if (decoded.includes(encodeURIComponent("محمد سرسار"))) {
      return mockQCRI("محمد سرسار", "Mohamed Sarsar");
    }
    return mockQCRI("", "");
  });

  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "محمد سرسار وشريكتة للتجارة ش م م" }
  );

  expect(response).toBe("Mohamed Sarsar & Co. Trading LLC");
});

// Normalization Variants
test("Handles LLC variants and Normalization", async () => {
  // "ذ.م.م" -> LLC
  // "ش.م.م" -> LLC
  // "ذ م م" -> LLC

  mockFetch.mockResolvedValue(mockQCRI("foo", "foo")); // Fallback

  const variants = ["ذ.م.م", "ش.م.م", "ذ م م", "ش م م"];

  for (const v of variants) {
    const input = `شركة ${v}`;
    const response = await main.run(
      { type: "string", value: "en" },
      { type: "string", value: input }
    );
    expect(response).toContain("LLC");
  }
});

// English Pass-through
test("Passes through English when target is en", async () => {
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "John" }
  );
  expect(response).toBe("John");
});

// Passthrough English (Company Mode Check - shouldn't trigger actually)
test("Passes through English even if it contains 'Company'", async () => {
  // input: "My Company"
  // isArabic("My Company") -> false. 
  // Returns input.
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "My Company" }
  );
  expect(response).toBe("My Company");
});

describe("Data-Driven Transliteration Tests", () => {
  test.each(TEST_CASES)("$desc: '$input' -> '$expected'", async ({ input, lang, expected }) => {
    // Setup specific mock for this case
    mockFetch.mockImplementation(async (url) => {
      const decoded = decodeURIComponent(url);

      // Manual Mocking for known cases in TEST_CASES:
      if (decoded.includes(encodeURIComponent("احمد"))) return mockQCRI("احمد", "Ahmed");
      if (decoded.includes(encodeURIComponent("محمد سرسار"))) return mockQCRI("محمد سرسار", "Mohamed Sarsar");
      if (decoded.includes(encodeURIComponent("محمد العامه"))) return mockQCRI("محمد العامه", "Mohamed Al Ammah");
      // "Al Fajar" case
      if (decoded.includes(encodeURIComponent("الفجر"))) return mockQCRI("الفجر", "Al Fajar");
      // "Estithmarak" case
      if (decoded.includes(encodeURIComponent("استثمارك"))) return mockQCRI("استثمارك", "Estithmarak");

      // Fallback for unknown
      return mockQCRI("unknown", "UNKNOWN_MOCK");
    });

    const response = await main.run(
      { type: "string", value: lang },
      { type: "string", value: input }
    );
    expect(response).toBe(expected);
  });
});
