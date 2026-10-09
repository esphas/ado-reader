import { handleClearToken } from "./common";
import TokenService from "../storage/tokenService";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({ ConfigService: {
  getAllListConfig: jest.fn(), getItem: jest.fn(), removeItem: jest.fn(),
  deleteListConfig: jest.fn(), getReaderConfig: jest.fn(), setReaderConfig: jest.fn(),
} }));
jest.mock("../storage/tokenService", () => ({ __esModule: true,
  default: { deleteToken: jest.fn(), setToken: jest.fn() } }));
jest.mock("../common", () => ({ getServerRegion: () => "global", reloadManager: jest.fn() }));

jest.mock("../../i18n", () => ({ t: key => key }));
jest.mock("sse.js", () => ({}));

test("removing official account tokens preserves independent storage, app lock and custom plugins", async () => {
  const tokens = new Map([["webdav_token", "local-secret"], ["google_token", "remote-secret"], ["access_token", "login"], ["protection_pin", "123456"], ["expires_at", "old"] ]);
  const sources = ["webdav", "google"];
  const items = new Map([["defaultSyncOption", "webdav"]]);
  const prefs = new Map([["dictService", "custom-dict"], ["transService", "official-ai-trans-plugin"]]);
  TokenService.deleteToken.mockImplementation(async key => { tokens.delete(key); });
  TokenService.setToken.mockImplementation(async (key, value) => { tokens.set(key, value); });
  ConfigService.getAllListConfig.mockReturnValue(sources);
  ConfigService.getItem.mockImplementation(key => items.get(key));
  ConfigService.removeItem.mockImplementation(key => { items.delete(key); if (key === "dataSourceList") sources.splice(0); });
  ConfigService.deleteListConfig.mockImplementation(value => { sources.splice(sources.indexOf(value), 1); });
  ConfigService.getReaderConfig.mockImplementation(key => prefs.get(key));
  ConfigService.setReaderConfig.mockImplementation((key, value) => prefs.set(key, value));
  await handleClearToken();
  expect(tokens.has("access_token")).toBe(false);
  expect(tokens.has("expires_at")).toBe(false);
  expect(tokens.get("protection_pin")).toBe("123456");
  expect(tokens.get("webdav_token")).toBe("local-secret");
  expect(tokens.get("google_token")).toBe("remote-secret");
  expect(sources).toEqual(["webdav", "google"]);
  expect(items.get("defaultSyncOption")).toBe("webdav");
  expect(prefs.get("dictService")).toBe("custom-dict");
  expect(prefs.get("transService")).toBe("");
  await handleClearToken();
  expect(sources).toEqual(["webdav", "google"]);
  expect(tokens.get("webdav_token")).toBe("local-secret");
});
