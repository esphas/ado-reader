import { ConfigService, CommonTool } from "../../assets/lib/kookit-extra-browser.min";
import { chatStream } from "./common";
import { createFullTranslation, analyzeBookTitle } from "./selfHosted";
import { getBuiltinTranslation } from "../plugins/rendererRegistry";
import DatabaseService from "../storage/databaseService";

jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: { getReaderConfig: jest.fn(), getObjectConfig: jest.fn() },
  CommonTool: { generateSHA256Hash: jest.fn(async text => "hash:" + text) },
}));
jest.mock("./common", () => ({ chatStream: jest.fn() }));
jest.mock("../storage/databaseService", () => ({ __esModule: true, default: { getAllRecords: jest.fn() } }));
jest.mock("../plugins/rendererRegistry", () => ({ getBuiltinTranslation: jest.fn() }));
jest.mock("../plugins/records", () => ({ resolveStoredPlugin: async p => p }));
jest.mock("../plugins/customPlugin", () => ({ isCustomRendererPlugin: () => false }));
jest.mock("../../i18n", () => ({ t: key => key }));
let prefs;
beforeEach(() => {
  prefs = new Map();
  CommonTool.generateSHA256Hash.mockImplementation(async text => "hash:" + text);
  ConfigService.getReaderConfig.mockImplementation(key => prefs.get(key) || "");
  ConfigService.getObjectConfig.mockReturnValue({ config: { endpoint: "http://fixture/v1", modelId: "fixture", apiKey: "fixture" } });
  DatabaseService.getAllRecords.mockResolvedValue([]);
});
test("AI batches preserve paragraph order with one request at a time", async () => {
  prefs.set("transService", "custom-ai-trans-plugin"); prefs.set("aiTranslateModel", "chosen");
  let active = 0, max = 0;
  chatStream.mockImplementation(async (...args) => { active++; max = Math.max(active,max); await Promise.resolve(); args[6]({ text: "译文" + args[4].slice(-1) }); active--; });
  const source = await createFullTranslation("Chinese");
  expect(await source.translate(["one1", "two2"])).toEqual(["译文1", "译文2"]);
  expect(max).toBe(1);
});
test("plugin translation resolves language codes and separates caches by configuration", async () => {
  prefs.set("transService", "libre-translate-plugin");
  const plugin = { key: "libre-translate-plugin", type: "translation", autoValue: "auto", config: { url: "http://one" }, langList: { zh: "Chinese" } };
  DatabaseService.getAllRecords.mockResolvedValue([plugin]);
  const translate = jest.fn(async text => "translated:" + text);
  getBuiltinTranslation.mockReturnValue(translate);
  const first = await createFullTranslation("Chinese");
  expect(await first.translate(["a", "b"])).toEqual(["translated:a", "translated:b"]);
  expect(translate.mock.calls[0].slice(0,3)).toEqual(["a", "auto", "zh"]);
  plugin.config = { url: "http://two" };
  expect((await createFullTranslation("Chinese")).cacheKey).not.toBe(first.cacheKey);
});
test("webpage-only plugins and absent providers do not trigger a request", async () => {
  await expect(createFullTranslation("Chinese")).rejects.toThrow();
  prefs.set("transService", "google-embed-translate-plugin");
  await expect(createFullTranslation("Chinese")).rejects.toThrow();
  expect(chatStream).not.toHaveBeenCalled();
});
test("title analysis uses only its explicitly assigned model", async () => {
  expect(await analyzeBookTitle("A title")).toBeNull();
  expect(chatStream).not.toHaveBeenCalled();
  prefs.set("aiTitleModel", "chosen");
  chatStream.mockImplementation(async (...args) => args[6]({ text: '```json\n{"name":"A title","author":""}\n```' }));
  expect(await analyzeBookTitle("A title")).toEqual({ name: "A title", author: "" });
});
test("malformed AI title responses cannot overwrite metadata", async () => {
  prefs.set("aiTitleModel", "chosen");
  chatStream.mockImplementation(async (...args) => args[6]({ text: '{"author":"guess"}' }));
  await expect(analyzeBookTitle("original")).rejects.toThrow();
});
