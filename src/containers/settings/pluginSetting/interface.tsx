import PluginModel from "../../../models/Plugin";
import type { BuiltinPluginMarketItem } from "../../../utils/plugins/types";
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
  isAddNew: boolean;
  availablePlugins: BuiltinPluginMarketItem[];
  expandedPluginKey: string | null;
  activePluginTab: string;
}
