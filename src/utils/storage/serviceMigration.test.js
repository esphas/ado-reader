import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { migrateRemovedServices } from "./serviceMigration";
jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({ ConfigService: { getReaderConfig: jest.fn(), setReaderConfig: jest.fn() } }));
test("old official selections are cleared without choosing or altering user providers", () => {
  const prefs = new Map(Object.entries({ transService: "official-ai-trans-plugin", dictService: "dict-local", aiService: "custom-ai-assistant-plugin", voiceEngine: "official-ai-voice-plugin", voiceName: "old", textOcrEngine: "official-ai-ocr", textOcrLang: "accurate", scannedOcrEngine: "paddle", scannedOcrLang: "standard_v5_mobile", isEnableKoodoSync: "yes" }));
  ConfigService.getReaderConfig.mockImplementation(k => prefs.get(k));
  ConfigService.setReaderConfig.mockImplementation((k,v) => prefs.set(k,v));
  migrateRemovedServices();
  expect(prefs.get("transService")).toBe("");
  expect(prefs.get("voiceName")).toBe("");
  expect(prefs.get("textOcrLang")).toBe("");
  expect(prefs.get("scannedOcrEngine")).toBe("paddle");
  expect(prefs.get("dictService")).toBe("dict-local");
  expect(prefs.get("aiService")).toBe("custom-ai-assistant-plugin");
  expect(prefs.get("isEnableKoodoSync")).toBe("no");
  const once = Array.from(prefs);
  migrateRemovedServices();
  expect(Array.from(prefs)).toEqual(once);
});
