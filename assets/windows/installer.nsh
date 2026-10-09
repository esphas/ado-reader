!macro customInit
!macroend

!macro customInstall
  ; Kill running Ado Reader process before installation to prevent file locking
  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /f /im "Ado Reader.exe"'
  ; Wait for the OS to release file handles after process termination
  Sleep 3000
!macroend

!macro customUnInstall
  MessageBox MB_YESNO "Do you want to delete all your data including books, notes, highlights, bookmarks, configurations?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\ado-reader"
  SkipRemoval:
!macroend