import PluginModel from "../../../models/Plugin";
import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleSettingDrive: (settingDrive: string) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  handleFetchDataSourceList: () => void;
  handleFetchDefaultSyncOption: () => void;

  handleLoadingDialog: (isShow: boolean) => void;
  t: (title: string) => string;
  handleFetchBooks: () => void;
  handleFetchPlugins: () => void;

  plugins: PluginModel[];

  defaultSyncOption: string;

  settingDrive: string;
}
export interface SettingInfoState {
  isTouch: boolean;
  isPreventTrigger: boolean;
  isMergeWord: boolean;

  isImportPath: boolean;
  isOpenBook: boolean;
  isDisablePopup: boolean;
  isDisableTrashBin: boolean;
  isDeleteShelfBook: boolean;
  isPreventSleep: boolean;
  isAlwaysOnTop: boolean;
  isAutoMaximizeWin: boolean;
  isAutoLaunch: boolean;
  isMinimizeToTray: boolean;
  isOpenInMain: boolean;
  isExportOriginalName: boolean;
  isDisableAI: boolean;
  isUseOriginalName: boolean;
  isAIAnalyzeTitle: boolean;
  isPrecacheBook: boolean;
  isUseBuiltIn: boolean;
  isDeleteOriginal: boolean;
  isDisablePDFCover: boolean;
  isHideShelfBook: boolean;
  isPreventAdd: boolean;
  startupShelf: string;
}
