import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import { handleSetting, handleFetchBooks, handleFetchPlugins, handleFetchDataSourceList, handleFetchDefaultSyncOption, handleTokenDialog, handleSettingMode, handleSettingDrive, handleLoadingDialog } from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    plugins: state.manager.plugins,

    settingDrive: state.manager.settingDrive,
    defaultSyncOption: state.backupPage.defaultSyncOption,
  };
};
const actionCreator = {
  handleSetting,
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchDataSourceList,
  handleTokenDialog,
  handleFetchDefaultSyncOption,
  handleSettingMode,
  handleSettingDrive,

  handleLoadingDialog,

};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(SettingDialog as any) as any) as any);
