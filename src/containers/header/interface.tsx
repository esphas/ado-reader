import { RouteComponentProps } from "react-router-dom";
import Book from "../../models/Book";
export interface HeaderProps extends RouteComponentProps<any> {
  isSearch: boolean;
  isSortDisplay: boolean;
  isAboutOpen: boolean;
  isCollapsed: boolean;
  isLoadMore: boolean;

  currentBook: Book;
  defaultSyncOption: string;
  mode: string;

  bookSortCode: { sort: number; order: number };
  importBookFunc: (file: any) => Promise<void>;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;
  handleLocalFileDialog: (isOpenLocalFileDialog: boolean) => void;
  handleImportDialog: (isOpenImportDialog: boolean) => void;

  handleSearchResults: (results: number[]) => void;

  handleSettingMode: (settingMode: string) => void;
  handleFetchDefaultSyncOption: () => void;

  handleFetchDataSourceList: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleReadingBook: (book: Book) => void;
  handleCloudSyncFunc: (
    cloudSyncFunc: (userInfo: any) => Promise<false | undefined>
  ) => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  language: string;
  width: number;

  isSync: boolean;

}
