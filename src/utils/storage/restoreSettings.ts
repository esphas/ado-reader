import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

// A backup moves library contents, not the source machine's profile or library path.
const deviceOnlyKeys = new Set([
  "storageLocation", "encryptedToken", "fingerPrint", "access_token",
  "refresh_token", "is_authed", "expires_at", "serverRegion",
]);

export function restoreSetting(key: string, value: string) {
  if (deviceOnlyKeys.has(key)) return;
  if (key === "readerConfig") {
    const prefs = JSON.parse(value);
    delete prefs.storageLocation;
    prefs.isEnableKoodoSync = "no";
    for (const name of ["transService", "dictService", "aiService", "fullTranslationService", "voiceEngine", "textOcrEngine", "scannedOcrEngine"]) {
      if (typeof prefs[name] === "string" && prefs[name].startsWith("official-")) prefs[name] = "";
    }
    value = JSON.stringify(prefs);
  }
  ConfigService.setItem(key, value);
}
