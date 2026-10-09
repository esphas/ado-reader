import TokenService from "../../utils/storage/tokenService";
import React from "react";
import { canUseDataSource } from "../../utils/storage/dataSourcePolicy";
import { usesIndependentSync, useDirectSyncForIndependentDrive } from "../../utils/storage/syncPolicy";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { HeaderProps, HeaderState } from "./interface";
import { ConfigService, KOReaderUtil } from "../../assets/lib/kookit-extra-browser.min";

import { generateSnapshot } from "../../utils/file/backup";
import { isElectron } from "react-device-detect";
import { getCloudConfig, upgradeConfig, upgradeStorage } from "../../utils/file/common";
import toast from "react-hot-toast";

import { SyncHelper } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";
import BookUtil from "../../utils/file/bookUtil";
import { checkBrokenDatabase, checkMissingBook, getBookPartialMd5, getTaskStats, scanFolderForNewBooks, showTaskProgress, throttle, AUTO_IMPORT_FOLDERS_KEY } from "../../utils/common";
import { driveList } from "../../constants/driveList";

import { LocalFileManager } from "../../utils/file/localFile";

declare var window: any;

class Header extends React.Component<HeaderProps, HeaderState> {
  timer: any;
  scheduledSyncTimer: any;
  private isSyncing: boolean = false;
  private hasRunAutoImport: boolean = false;
  private resizeHandler: (() => void) | null = null;
  private readingFinishedHandler: ((config: any) => void) | null = null;
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: ConfigService.getReaderConfig("lang"),
      width: document.body.clientWidth,
      isSync: false,
    };
  }
  async componentDidMount() {
    if (isElectron) {
      try {
        await generateSnapshot();
      } catch (error) {
        console.error("Failed to generate snapshot:", error);
      }
    }

    this.props.handleFetchDefaultSyncOption();
    this.props.handleFetchDataSourceList();
    if (isElectron) {
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const ipcRenderer = window.electronAPI;
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(path.join(dirPath, "data", "book"), { recursive: true });
      }

      if (
        ConfigService.getReaderConfig("storageLocation") &&
        !ConfigService.getItem("storageLocation")
      ) {
        ConfigService.setItem(
          "storageLocation",
          ConfigService.getReaderConfig("storageLocation")
        );
      }

      //Check for data update
      //upgrade data from old version
      let res1 = await upgradeStorage(this.handleFinishUpgrade);
      let res2 = await upgradeConfig();
      if (!res1 || !res2) {
        console.error("upgrade failed");
      }

      this.readingFinishedHandler = async (config: any) => {
        this.handleFinishReading();
      };
      ipcRenderer.on("reading-finished", this.readingFinishedHandler);
      ipcRenderer.on("open-book-from-link", async (config: any) => {
        const book = await DatabaseService.getRecord(config.bookKey, "books");
        if (book) {
          BookUtil.redirectBook(book);
        }
      });
      ipcRenderer.on("open-note-from-link", async (config: any) => {
        const note = await DatabaseService.getRecord(config.noteKey, "notes");
        if (!note) return;
        const book = await DatabaseService.getRecord(note.bookKey, "books");
        if (!book) return;
        let bookLocation: any = {};
        try {
          bookLocation = JSON.parse(note.cfi) || {};
        } catch (error) {
          bookLocation.cfi = note.cfi;
          bookLocation.chapterTitle = note.chapter;
        }
        if (bookLocation.fingerprint) {
          bookLocation.chapterDocIndex = bookLocation.page - 1 + "";
          bookLocation.chapterHref = "title" + (bookLocation.page - 1);
        }
        ConfigService.setObjectConfig(
          note.bookKey,
          bookLocation,
          "recordLocation"
        );
        BookUtil.redirectBook(book);
      });

    } else {
      await upgradeConfig();
      const status = await LocalFileManager.getPermissionStatus();
      if (
        !ConfigService.getItem("isUseLocal") &&
        LocalFileManager.isSupported()
      ) {
        this.props.handleLocalFileDialog(true);
      } else if (
        ConfigService.getItem("isUseLocal") === "yes" &&
        !status.directoryName
      ) {
        this.props.handleLocalFileDialog(true);
      } else if (
        ConfigService.getItem("isUseLocal") === "yes" &&
        (status.needsReauthorization || !status.hasAccess)
      ) {
        this.props.handleLocalFileDialog(true);
      }
    }
    this.resizeHandler = throttle(() => {
      this.setState({ width: document.body.clientWidth });
    });
    window.addEventListener("resize", this.resizeHandler);
    this.props.handleCloudSyncFunc(this.handleCloudSync);
    document.addEventListener("visibilitychange", async (event) => {
      if (
        document.visibilityState === "visible" &&
        !isElectron &&
        ConfigService.getReaderConfig("isFinishWebReading") === "yes"
      ) {
        await this.handleFinishReading();
        // ConfigService.setReaderConfig("isFinishWebReading", "no");
      }
    });
    let willAutoSync =
      ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
      ConfigService.getItem("defaultSyncOption");
    if (willAutoSync && usesIndependentSync()) {
      await this.handleCloudSync();
      await this.handleOpenLastReadBook();
      await this.autoScanFoldersOnStart();
    } else {
      this.handleOpenLastReadBook();
      this.autoScanFoldersOnStart();
    }
    this.startScheduledSync();
  }
  componentWillUnmount() {
    if (this.scheduledSyncTimer) {
      clearInterval(this.scheduledSyncTimer);
      this.scheduledSyncTimer = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    if (isElectron && this.readingFinishedHandler) {
      const ipcRenderer = window.electronAPI;
      ipcRenderer.removeListener(
        "reading-finished",
        this.readingFinishedHandler
      );
      this.readingFinishedHandler = null;
    }
  }
  startScheduledSync = () => {
    if (this.scheduledSyncTimer) {
      clearInterval(this.scheduledSyncTimer);
      this.scheduledSyncTimer = null;
    }
    const intervalMinutes = parseInt(
      ConfigService.getReaderConfig("scheduledSyncInterval") || "0"
    );
    if (!intervalMinutes || intervalMinutes <= 0) {
      return;
    }
    const intervalMs = intervalMinutes * 60 * 1000;
    this.scheduledSyncTimer = setInterval(async () => {
      const currentInterval = parseInt(
        ConfigService.getReaderConfig("scheduledSyncInterval") || "0"
      );
      if (!currentInterval || currentInterval <= 0) {
        clearInterval(this.scheduledSyncTimer);
        this.scheduledSyncTimer = null;
        return;
      }
      const defaultSyncOption = ConfigService.getItem("defaultSyncOption");
      if (
        !defaultSyncOption ||
        ConfigService.getReaderConfig("isDisableAutoSync") === "yes"
      ) {
        return;
      }
      if (!this.state.isSync && !this.isSyncing) {

        await this.handleCloudSync();
      }
    }, intervalMs);
  };

  autoScanFoldersOnStart = async () => {
    if (!isElectron || this.hasRunAutoImport) return;
    this.hasRunAutoImport = true;
    try {
      const folders =
        ConfigService.getAllListConfig(AUTO_IMPORT_FOLDERS_KEY) || [];
      if (folders.length === 0) return;
      const importBookFunc = this.props.importBookFunc;
      if (!importBookFunc) {
        console.error("Auto import: no import function available");
        return;
      }
      for (const folderPath of folders) {
        await scanFolderForNewBooks(folderPath, importBookFunc);
      }
    } catch (error) {
      console.error("Auto import folder scan error:", error);
    }
  };
  handleOpenLastReadBook = async () => {
    let filePath = "";
    //open book when app start
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      filePath = ipcRenderer.sendSync("check-file-data");
    }
    if (
      ConfigService.getReaderConfig("isOpenBook") === "yes" &&
      !this.props.currentBook.key &&
      !filePath
    ) {
      let lastReadBookKey = ConfigService.getAllListConfig("recentBooks")[0];
      if (lastReadBookKey) {
        let fullBook = await DatabaseService.getRecord(
          lastReadBookKey,
          "books"
        );
        if (fullBook) {
          this.props.handleReadingBook(fullBook);
          BookUtil.redirectBook(fullBook);
        }
      }
    }
  };
  handleFinishReading = async () => {
    if (
      ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
      ConfigService.getItem("defaultSyncOption") &&
      !this.state.isSync
    ) {
      ConfigService.setItem("isFinshReading", "yes");

      this.setState({ isSync: true }, async () => {
        await this.handleCloudSync();
        ConfigService.setItem("isFinshReading", "no");
      });
    }
  };
  handleFinishUpgrade = () => {
    this.props.handleFetchBooks();
    setTimeout(() => {
      if (this.props.mode === "home") {
        this.props.history.push("/manager/home");
      }
    }, 2000);
  };

  handleKOReaderSync = async () => {
    if (ConfigService.getReaderConfig("isEnableKoReaderSync") !== "yes") {
      return;
    }

    toast.loading(this.props.t("Start syncing") + " (KOReader)", {
      id: "koreader-sync",
      position: "bottom-center",
    });
    try {
      const koReaderUtil = new KOReaderUtil(
        ConfigService,
        TokenService,
        DatabaseService
      );
      const summary =
        await koReaderUtil.syncKOReaderProgress(getBookPartialMd5);
      if (summary.pulledBooks > 0 || summary.pushedBooks > 0) {
        this.props.handleFetchBooks();
      }
      toast.success(
        this.props.t("Synchronisation successful") + " (KOReader)",
        {
          id: "koreader-sync",
        }
      );
    } catch (error) {
      console.error(error);
      toast.error(
        this.props.t("Sync failed") +
        " (KOReader): " +
        (error instanceof Error ? error.message : String(error)),
        {
          id: "koreader-sync",
          duration: 6000,
        }
      );
    }
  };

  beforeSync = async () => {
    useDirectSyncForIndependentDrive();
    if (!ConfigService.getItem("defaultSyncOption")) {
      toast.error(
        this.props.t(
          "Please add data source in the setting-Sync and backup first"
        )
      );
      this.props.handleSetting(true);
      this.props.handleSettingMode("sync");
      return false;
    }

    let config = await getCloudConfig(
      ConfigService.getItem("defaultSyncOption") || ""
    );
    if (Object.keys(config).length === 0) {
      toast.error(this.props.t("Cannot get sync config"));
      return false;
    }
    await checkMissingBook();
    let checkResult = await checkBrokenDatabase();
    if (checkResult) {
      toast.error(
        this.props.t(
          "Broken data detected, please click the setting button to reset the sync records"
        )
      );
      return false;
    }

    if (ConfigService.getReaderConfig("hideSyncProgress") !== "yes") {
      toast.loading(
        this.props.t("Start syncing") +
        " (" +
        this.props.t(
          driveList.find(
            (item) =>
              item.value === ConfigService.getItem("defaultSyncOption")
          )?.label || ""
        ) +
        ")",
        { id: "syncing", position: "bottom-center" }
      );
    }

    return true;
  };
  getCompareResult = async () => {
    let localSyncRecords = ConfigService.getAllSyncRecord();
    let cloudSyncRecords = await ConfigUtil.getCloudConfig("sync");
    return await SyncHelper.compareAll(
      localSyncRecords,
      cloudSyncRecords,
      ConfigService,
      TokenService,
      ConfigUtil
    );
  };
  handleSyncStateChange = (isSyncing: boolean) => {
    this.setState({ isSync: isSyncing });
  };
  handleCloudSync = async (): Promise<false | undefined> => {
    if (!canUseDataSource(ConfigService.getItem("defaultSyncOption"))) {
      toast(this.props.t("TODO: Cloud drive authorization is not available yet"));
      this.setState({ isSync: false });
      return false;
    }
    if (this.isSyncing) {
      console.info("Sync already in progress, skipping...");
      return false;
    }
    this.isSyncing = true;

    try {
      this.timer = await showTaskProgress(this.handleSyncStateChange);
      if (!this.timer) {
        this.setState({ isSync: false });
        this.handleKOReaderSync();
        return false;
      }

      let res = await this.beforeSync();
      if (!res) {
        clearInterval(this.timer);
        this.setState({ isSync: false });
        this.handleKOReaderSync();
        return false;
      }
      let compareResult = await this.getCompareResult();
      await this.handleSync(compareResult);
      clearInterval(this.timer);
      this.setState({ isSync: false });
      this.handleKOReaderSync();
    } catch (error) {
      console.error(error);
      toast.error(
        this.props.t("Sync failed") +
        ": " +
        (error instanceof Error ? error.message : String(error))
      );
      clearInterval(this.timer);
      this.setState({ isSync: false });
      this.handleKOReaderSync();
      return false;
    } finally {
      this.isSyncing = false;
    }
    setTimeout(() => {
      toast.dismiss("syncing");
    }, 3000);
    return;
  };
  handleSuccess = async () => {
    if (ConfigService.getItem("isFinshReading") !== "yes" || !isElectron) {
      this.props.handleFetchBooks();
    }

    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();

    if (ConfigService.getReaderConfig("hideSyncProgress") !== "yes") {
      toast.success(this.props.t("Synchronisation successful"), {
        id: "syncing",
      });
    }

    if (
      ConfigService.getItem("defaultSyncOption") === "adrive" &&
      ConfigService.getReaderConfig("hasShowAliyunWarning") !== "yes"
    ) {
      ConfigService.setReaderConfig("hasShowAliyunWarning", "yes");
      toast.success(
        this.props.t(
          "We have bypassed the synchronization of book cover for Aliyun Drive, covers will be downloaded automatically when you open the book next time."
        ),
        {
          duration: 4000,
        }
      );
    }

    //when book is empty, need to refresh the book list
    setTimeout(async () => {
      if (this.props.mode === "home") {
        this.props.history.push("/manager/home");

      }
    }, 1000);
  };
  handleSync = async (compareResult) => {
    try {
      let tasks = await SyncHelper.startSync(
        compareResult,
        ConfigService,
        DatabaseService,
        ConfigUtil,
        BookUtil,
        CoverUtil
      );
      await SyncHelper.runTasksWithLimit(
        tasks,
        99,
        ConfigService.getItem("defaultSyncOption")
      );

      clearInterval(this.timer);
      this.setState({ isSync: false });
      let stats = await getTaskStats();
      if (stats.hasFailedTasks) {
        toast.error(
          this.props.t(
            "Tasks failed after multiple retries, please check the network connection or reauthorize the data source in the settings"
          ),
          {
            id: "syncing",
            duration: 6000,
          }
        );
        return;
      }
      if (ConfigService.getReaderConfig("hideSyncProgress") !== "yes") {
        toast.loading(this.props.t("Almost finished"), {
          id: "syncing",
          position: "bottom-center",
        });
      }
      await this.handleSuccess();
    } catch (error) {
      console.error(error);
      clearInterval(this.timer);
      this.setState({ isSync: false });
      toast.error(
        this.props.t("Sync failed") +
        ": " +
        (error instanceof Error ? error.message : String(error))
      );

      return;
    }
  };

  render() {
    return (
      <div
        className="header"
        style={this.props.isCollapsed ? { marginLeft: "40px" } : {}}
      >

        <div
          className="header-search-container"
          style={this.props.isCollapsed ? { width: "369px" } : {}}
        >
          <SearchBox />
        </div>
        <div
          className="setting-icon-parrent"
          style={this.props.isCollapsed ? { marginLeft: "430px" } : {}}
        >
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleSortDisplay(!this.props.isSortDisplay);
            }}
            onMouseLeave={() => {
              this.props.handleSortDisplay(false);
            }}
            style={{ top: "18px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Sort by")}
              data-tooltip-place="left"
            >
              <span className="icon-sort-desc header-sort-icon"></span>
            </span>
          </div>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleSetting(true);
              this.props.handleAbout(false);
            }}
            onMouseLeave={() => {
              this.props.handleAbout(false);
            }}
            style={{ marginTop: "2px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Setting")}
              data-tooltip-place="left"
            >
              <span
                className="icon-setting setting-icon"
                style={{ fontSize: "25px" }}
              ></span>
            </span>
          </div>

          <div
            className="setting-icon-container"
            onClick={async () => {
              if (usesIndependentSync() || !ConfigService.getItem("defaultSyncOption")) {
                if (!ConfigService.getItem("defaultSyncOption")) {
                  toast(
                    this.props.t(
                      "Please add data source in the setting-Sync and backup first"
                    )
                  );
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("sync");
                  return;
                }
                this.setState({ isSync: true });

                await this.handleCloudSync();
              } else {
                if (
                  ConfigService.getReaderConfig("isEnableKoReaderSync") !==
                  "yes"
                ) {
                  toast(
                    this.props.t("TODO: Cloud drive authorization is not available yet")
                  );
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("sync");
                  this.setState({ isSync: false });
                } else {
                  this.setState({ isSync: true });
                  await this.handleKOReaderSync();
                  this.setState({ isSync: false });
                }
              }
            }}
            style={{ marginTop: "2px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Sync")}
              data-tooltip-place="left"
            >
              <span
                className={
                  "icon-sync setting-icon" +
                  (this.state.isSync ? " icon-rotate" : "")
                }
                style={{ fontSize: "25px" }}
              ></span>
            </span>
          </div>
        </div>

        <ImportLocal
          {...({
            handleDrag: this.props.handleDrag,
          } as any)}
        />

      </div>
    );
  }
}

export default Header;
