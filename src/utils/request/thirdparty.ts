import i18n from "../../i18n";
import TokenService from "../storage/tokenService";
import { isIndependentDrive, LOCAL_CREDENTIAL_PREFIX, RECONFIGURE_DATA_SOURCE } from "../storage/dataSourcePolicy";

export const encryptToken = async (service: string, config: Record<string, unknown>) => {
  if (!isIndependentDrive(service)) return { code: 501, msg: i18n.t("TODO: Cloud drive authorization is not available yet") };
  if (!config || typeof config !== "object" || Array.isArray(config) || !Object.keys(config).length) {
    return { code: 400, msg: i18n.t("Invalid data source configuration") };
  }
  await TokenService.setToken(service + "_token", LOCAL_CREDENTIAL_PREFIX + JSON.stringify(config));
  return { code: 200 };
};
export const decryptToken = async (service: string) => {
  if (!isIndependentDrive(service)) return { code: 501, msg: i18n.t("TODO: Cloud drive authorization is not available yet") };
  const stored = await TokenService.getToken(service + "_token");
  try {
    if (!stored?.startsWith(LOCAL_CREDENTIAL_PREFIX)) throw new Error();
    const token = stored.slice(LOCAL_CREDENTIAL_PREFIX.length);
    const config = JSON.parse(token);
    if (!config || typeof config !== "object" || Array.isArray(config) || !Object.keys(config).length) throw new Error();
    return { code: 200, data: { token } };
  } catch {
    return { code: 409, msg: i18n.t(RECONFIGURE_DATA_SOURCE) };
  }
};
