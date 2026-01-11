import main from "./column";

test("Echoes text back exactly", async () => {
  const response = await main.run({ type: "string", value: "hello world" });
  expect(response).toBe("hello world");
});

test("Works with special characters", async () => {
  const response = await main.run({ type: "string", value: "Test @#$%^&*()!" });
  expect(response).toBe("Test @#$%^&*()!");
});

test("Works with empty string", async () => {
  const response = await main.run({ type: "string", value: "" });
  expect(response).toBe("");
});

test("Returns undefined for missing text", async () => {
  const response = await main.run({ type: "string", value: undefined });
  expect(response).toBeUndefined();
});
