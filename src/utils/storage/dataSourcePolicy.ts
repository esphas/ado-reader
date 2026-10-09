// These providers use the user's own credentials or a local directory.
const independentDrives = new Set([
  "folder", "icloud", "webdav", "s3compatible", "docker", "ftp", "sftp", "mega",
]);

export const isIndependentDrive = (service: string | null | undefined) =>
  !!service && independentDrives.has(service);

export const canUseDataSource = isIndependentDrive;

export const LOCAL_CREDENTIAL_PREFIX = "ado-local-v1:";
export const RECONFIGURE_DATA_SOURCE =
  "Please reconfigure this data source to store its credentials locally";
