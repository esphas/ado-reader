import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { handleSortDisplay, handleSetting, handleSettingMode, handleAbout, handleLocalFileDialog, handleFetchBooks, handleFetchNotes, handleFetchBookmarks, handleFetchDefaultSyncOption, handleFetchDataSourceList, handleCloudSyncFunc, handleReadingBook } from "../../store/actions";
import { stateType } from "../../store";
import Header from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isSearch: state.manager.isSearch,
    isAboutOpen: state.manager.isAboutOpen,

    isCollapsed: state.sidebar.isCollapsed,
    currentBook: state.book.currentBook,
    mode: state.sidebar.mode,

    defaultSyncOption: state.backupPage.defaultSyncOption,

    isLoadMore: state.manager.isLoadMore,
    isSortDisplay: state.manager.isSortDisplay,
    bookSortCode: state.manager.bookSortCode,
    importBookFunc: state.book.importBookFunc,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleLocalFileDialog,
  handleSetting,
  handleSettingMode,
  handleAbout,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchBookmarks,

  handleFetchDefaultSyncOption,

  handleFetchDataSourceList,
  handleCloudSyncFunc,

  handleReadingBook,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Header as any) as any) as any);
