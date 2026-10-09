import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

// Run at startup and after restoring settings; never choose a paid replacement.
export const migrateRemovedServices = () => {
  ConfigService.setReaderConfig("isEnableKoodoSync", "no");
  for (const key of ["transService", "dictService", "aiService", "fullTranslationService"]) {
    if ((ConfigService.getReaderConfig(key) || "").startsWith("official-")) {
      ConfigService.setReaderConfig(key, "");
    }
  }
  if ((ConfigService.getReaderConfig("voiceEngine") || "").startsWith("official-")) {
    for (const key of ["voiceEngine", "voiceName", "voiceIndex"]) ConfigService.setReaderConfig(key, "");
  }
  for (const prefix of ["text", "scanned"]) {
    if (ConfigService.getReaderConfig(prefix + "OcrEngine") === "official-ai-ocr") {
      ConfigService.setReaderConfig(prefix + "OcrEngine", "");
      ConfigService.setReaderConfig(prefix + "OcrLang", "");
    }
  }
};
