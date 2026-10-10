<h1 align="center">
  Ado Reader
</h1>

<h3 align="center">
  A fork of the cross-platform ebook reader <a href="https://github.com/koodo-reader/koodo-reader">Koodo Reader</a>
</h3>

## Features

Koodo Reader that:

- has no account signup or subscription
- does not check for official updates or connect to the official notification service
- cannot sync or backup directly with **OneDrive**, **Google Drive**, **Dropbox**, **pCloud**, **Yandex Disk**, or **Box**. A local folder, **iCloud**, **MEGA**, **FTP**, **SFTP**, **WebDAV**, **Docker**, and **S3-compatible object storage** still work with your own credentials. Drives that are not supported can still be mounted on your computer, or exposed as WebDAV or S3, and then used from this app
- imports books from those same remaining sources
- uses an AI endpoint you configure for translation, dictionary, summarization, and encyclopedia. Full-text translation and title parsing run only after a service is selected
- does not yet offer multi-role read-aloud, automatic inline definitions, or online metadata lookup
- does not offer an official catalog for plugins, fonts, backgrounds, or dictionaries. Import local files, or add a custom plugin
- does not distribute a browser extension. An extension you already have can still save pages; a source that needs one otherwise asks you to use the desktop app
- targets **Windows**, **macOS**, and **Linux**. The web app keeps local files and services it can reach directly. **Android** and **iOS** store builds are not part of this fork

## Migrate from/to Koodo Reader

Ado Reader keeps its own `ado-reader` data directory, so an existing Koodo Reader installation is left untouched.

Move a library from **Settings → Sync and backup**:

1. In one app, backup the library to a ZIP file.
2. In the other app, restore from that ZIP.
3. Check books, notes, bookmarks, and reading progress.

Set device credentials and the local app lock again after restoring. A backup leaves both as they are on the current device. Storage and AI settings you configured yourself stay in the backup. Each app keeps its own library location; an old absolute path in the backup is not reused.

Books imported as links to external files still need those files, unless the backup already contains the book files. Copy a library folder before either app uses it. Do not point Ado Reader at a folder Koodo Reader is still using.

## Installation

Just build from source.

## Develop

Make sure that you have installed yarn and git

1. Download, Test & Build

  ```
  yarn install --frozen-lockfile
  yarn typecheck
  yarn build
  yarn test --watchAll=false --runInBand
  ```

2. Enter desktop mode

   ```
   yarn dev
   ```

3. Enter web mode

   ```
   yarn start
   ```

4. Package

  ```
  yarn electron-builder --win --x64 --dir --publish never
  ```
