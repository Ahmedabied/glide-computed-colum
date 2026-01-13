import main from "./column";

// Mock the global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Helper to mock Azure proxy response
const mockAzureResponse = (results: string[]) => ({
  ok: true,
  json: async () => ({ results }),
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe("Name Translator", () => {
  test("Translates Arabic name to English", async () => {
    mockFetch.mockResolvedValue(mockAzureResponse(["Ahmed"]));

    const response = await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "احمد" }
    );

    expect(response).toBe("Ahmed");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://silent-fire-a4ef.ahmed-abied.workers.dev/translate",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("احمد"),
      })
    );
  });

  test("Translates English name to Arabic", async () => {
    mockFetch.mockResolvedValue(mockAzureResponse(["أحمد"]));

    const response = await main.run(
      { type: "string", value: "ar" },
      { type: "string", value: "Ahmed" }
    );

    expect(response).toBe("أحمد");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("Passes through English when target is en", async () => {
    const response = await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "John Smith" }
    );

    expect(response).toBe("John Smith");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("Passes through Arabic when target is ar", async () => {
    const response = await main.run(
      { type: "string", value: "ar" },
      { type: "string", value: "محمد" }
    );

    expect(response).toBe("محمد");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("Returns empty string for empty input", async () => {
    const response = await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "" }
    );

    expect(response).toBe("");
  });

  test("Returns original for unsupported language", async () => {
    const response = await main.run(
      { type: "string", value: "fr" },
      { type: "string", value: "Hello" }
    );

    expect(response).toBe("Hello");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("Handles API error gracefully", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const response = await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "فاطمة" } // Unique text not used elsewhere
    );

    // Falls back to original text
    expect(response).toBe("فاطمة");
  });

  test("Applies title case to English output", async () => {
    mockFetch.mockResolvedValue(mockAzureResponse(["mohamed ali"]));

    const response = await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "محمد علي" }
    );

    expect(response).toBe("Mohamed Ali");
  });

  test("Caches repeated translations", async () => {
    mockFetch.mockResolvedValue(mockAzureResponse(["Hassan"]));

    // First call with unique text
    await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "حسن" }
    );

    // Second call with same text (should use cache)
    await main.run(
      { type: "string", value: "en" },
      { type: "string", value: "حسن" }
    );

    expect(mockFetch).toHaveBeenCalledTimes(1); // Only one actual fetch
  });
});
