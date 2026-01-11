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

test("Returns empty string for empty name", async () => {
  const response = await main.run(
    { type: "string", value: "en" },
    { type: "string", value: "" }
  );
  expect(response).toBe("");
});
