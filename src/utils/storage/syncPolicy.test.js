import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { driveList } from "../../constants/driveList";
import { canUseDataSource, isIndependentDrive } from "./dataSourcePolicy";
import { useDirectSyncForIndependentDrive } from "./syncPolicy";
jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({ ConfigService: {
  getItem: jest.fn(), getReaderConfig: jest.fn(), setReaderConfig: jest.fn(),
} }));

test.each(["folder", "icloud", "webdav", "s3compatible", "docker", "ftp", "sftp", "mega"])(
  "%s works without login and cannot use official sync even with a stale preference", service => {
    ConfigService.getItem.mockReturnValue(service);
    ConfigService.getReaderConfig.mockReturnValue("yes");
    expect(canUseDataSource(service, false)).toBe(true);
    expect(driveList.find(drive => drive.value === service).isPro).toBe(false);
    useDirectSyncForIndependentDrive();
    expect(ConfigService.setReaderConfig).toHaveBeenCalledWith("isEnableKoodoSync", "no");
  }
);
test("unknown and OAuth sources are not silently granted access", () => {
  for (const service of ["google", "unknown", ""]) {
    expect(isIndependentDrive(service)).toBe(false);
    expect(canUseDataSource(service, false)).toBe(false);
  }
  expect(canUseDataSource("google", true)).toBe(false);
  expect(canUseDataSource("", true)).toBe(false);
});
