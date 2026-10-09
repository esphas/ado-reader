import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isIndependentDrive } from "./dataSourcePolicy";
export const usesIndependentSync = () => isIndependentDrive(ConfigService.getItem("defaultSyncOption"));
// The bundled sync engine still reads this legacy setting.
export const useDirectSyncForIndependentDrive = () => {
  ConfigService.setReaderConfig("isEnableKoodoSync", "no");
};
