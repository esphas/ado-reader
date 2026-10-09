import { translate as google } from "./googleTranslate";
import { translate as caiyun } from "./caiyunTranslate";
import { translate as libre } from "./libreTranslate";

global.crypto = { randomUUID: () => "fixture-request" };

test("missing credentials reject instead of becoming a cached translation", async () => {
  await expect(google("text", "auto", "zh", {}, {})).rejects.toThrow("apiKey");
});
test("provider errors reject instead of being rendered as translated paragraphs", async () => {
  const request = { post: async () => ({ status: 200, data: { message: "quota exceeded" } }) };
  await expect(caiyun("text", "auto", "zh", request, { token: "fixture" })).rejects.toThrow("quota exceeded");
});
test("successful literal error-like text is still a valid translation", async () => {
  const request = { post: async () => ({ status: 200, data: { translatedText: "Missing a friend" } }) };
  await expect(libre("text", "auto", "en", request, {})).resolves.toBe("Missing a friend");
});
