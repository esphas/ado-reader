import { encryptToken, decryptToken } from "./thirdparty";
import TokenService from "../storage/tokenService";
import { ThirdpartyRequest } from "../../assets/lib/kookit-extra-browser.min";

jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: {},
  KookitConfig: {},
  ThirdpartyRequest: jest.fn(() => ({
    encryptToken: jest.fn(async () => ({ code: 200, data: { encrypted_token: "official-cipher" } })),
    decryptToken: jest.fn(async () => ({ code: 200, data: { token: '{"remote":true}' } })),
  })),
}));
jest.mock("../storage/tokenService", () => ({
  __esModule: true,
  default: { getToken: jest.fn(), setToken: jest.fn() },
}));
jest.mock("../common", () => ({ getServerRegion: () => "global" }));
jest.mock("./common", () => ({ handleExitApp: jest.fn() }));
jest.mock("../../i18n", () => ({ t: (key) => key }));
jest.mock("react-hot-toast", () => ({ error: jest.fn() }));

let tokens;
beforeEach(() => {
  jest.clearAllMocks();
  ThirdpartyRequest.mockImplementation(() => ({
    encryptToken: jest.fn(async () => ({ code: 200, data: { encrypted_token: "official-cipher" } })),
    decryptToken: jest.fn(async () => ({ code: 200, data: { token: '{"remote":true}' } })),
  }));
  tokens = new Map();
  TokenService.getToken.mockImplementation(async key => tokens.get(key) || null);
  TokenService.setToken.mockImplementation(async (key, value) => { tokens.set(key, value); });
});

test.each(["folder", "icloud", "webdav", "s3compatible", "docker", "ftp", "sftp", "mega"])(
  "%s credentials round trip without an official account or request",
  async service => {
    const config = { url: "https://my-storage.example", password: "private", drivePath: "D:\\Books" };
    expect((await encryptToken(service, config)).code).toBe(200);
    const result = await decryptToken(service);
    expect(result.code).toBe(200);
    expect(JSON.parse(result.data.token)).toEqual(config);
    expect(tokens.has("is_authed")).toBe(false);
    expect(ThirdpartyRequest).not.toHaveBeenCalled();
  }
);

test.each(["old-official-cipher", "ado-local-v1:broken", "ado-local-v1:[]"])(
  "unreadable local credentials are preserved, never sent to the official service: %s",
  async token => {
    tokens.set("webdav_token", token);
    expect((await decryptToken("webdav")).code).not.toBe(200);
    expect(tokens.get("webdav_token")).toBe(token);
    expect(ThirdpartyRequest).not.toHaveBeenCalled();
  }
);

test("OAuth sources are paused without contacting the official service or losing credentials", async () => {
  tokens.set("google_token", "legacy-cipher");
  expect((await encryptToken("google", { refresh_token: "user-token" })).code).toBe(501);
  expect((await decryptToken("google")).code).toBe(501);
  expect(tokens.get("google_token")).toBe("legacy-cipher");
  expect(ThirdpartyRequest).not.toHaveBeenCalled();
});
