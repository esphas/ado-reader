import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { restoreSetting } from "./restoreSettings";
jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: { setItem: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
test("restoring an upstream backup preserves the destination and local credentials", () => {
  for (const key of ["storageLocation", "encryptedToken", "fingerPrint", "access_token", "refresh_token", "is_authed"]) {
    restoreSetting(key, "old-value");
  }
  expect(ConfigService.setItem).not.toHaveBeenCalled();
});
test("restores reading preferences without legacy library paths or official selections", () => {
  restoreSetting("readerConfig", JSON.stringify({
    storageLocation: "D:/original-library", fontFamily: "my-font", fontSize: "22",
    transService: "official-ai-trans-plugin", dictService: "dict-local", isEnableKoodoSync: "yes",
  }));
  const restored = JSON.parse(ConfigService.setItem.mock.calls[0][1]);
  expect(restored.storageLocation).toBeUndefined();
  expect(restored).toMatchObject({fontFamily:"my-font",fontSize:"22",transService:"",dictService:"dict-local",isEnableKoodoSync:"no"});
});
test("retains shelves, local asset metadata and user AI configurations", () => {
  for (const key of ["shelfList", "customFonts", "customDicts", "aiModelConfig"]) restoreSetting(key, '{"example":"value"}');
  expect(ConfigService.setItem).toHaveBeenCalledTimes(4);
});
