import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import packageJson from "../../../../package.json";
import { openExternalUrl } from "../../../utils/common";
import { FORK_REPOSITORY, FORK_RELEASES, FORK_HELP } from "../../../constants/fork";
import { isElectron } from "react-device-detect";

class AboutSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  render() {
    return <>
      <div className="setting-dialog-new-title">Ado Reader <span>{packageJson.version}</span></div>
      <p><Trans>A free fork of Koodo Reader. No account or subscription required.</Trans></p>
      {[
        ["Download releases manually", FORK_RELEASES],
        ["Document", FORK_HELP],
        ["Feedback", FORK_REPOSITORY + "/issues"],
        ["GitHub repository", FORK_REPOSITORY],
        ["Upstream project", "https://github.com/koodo-reader/koodo-reader"],
      ].map(([label, url]) => <div className="setting-dialog-new-title" key={label}>
        <Trans>{label}</Trans>
        <button className="change-location-button" onClick={() => openExternalUrl(url)}><Trans>Visit</Trans></button>
      </div>)}
      {isElectron && <>
        <div className="setting-dialog-new-title"><Trans>Get debug logs</Trans>
          <button className="change-location-button" onClick={() => window.electronAPI.invoke("get-debug-logs", "ping")}><Trans>Locate</Trans></button>
        </div>
        <div className="setting-dialog-new-title"><Trans>Open console</Trans>
          <button className="change-location-button" onClick={() => window.electronAPI.invoke("open-console", "ping")}><Trans>View</Trans></button>
        </div>
      </>}
    </>;
  }
}
export default AboutSetting;
