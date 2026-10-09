import PluginModel from "../../../models/Plugin";
import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  plugins: PluginModel[];
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleFetchPlugins: () => void;
  t: (title: string) => string;
}
export interface AIModelConfig {
  endpoint: string;
  modelName: string;
  modelId: string;
  apiKey: string;
  providerId: string;
  providerName: string;
}
export interface SettingInfoState {
  isAddNew: boolean;
  isEditing: boolean;
  editingKey: string;
  selectedProvider: string;
  selectedModel: string;
  endpoint: string;
  modelName: string;
  modelId: string;
  apiKey: string;
  isTesting: boolean;
  testResult: string;
  fetchedModels: { id: string; name: string }[];
  isFetchingModels: boolean;
  aiTitleModel: string;
  fullTranslationService: string;
  aiTranslateModel: string;
  aiDictModel: string;
  aiAssistanceModel: string;
  aiTranslatePrompt: string;
  aiDictPrompt: string;
  aiAssistancePrompt: string;
}
