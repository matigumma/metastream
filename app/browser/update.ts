import { dialog, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import updaterFeed from 'constants/updater'
import log from './log'

// how long between scheduled auto updates?
const SCHEDULED_AUTO_UPDATE_DELAY = 24 * 60 * 60 * 1000 // once a day

let hasUpdateAvailable = false
let updateDownloaded = false

const checkForUpdates = () => {
  autoUpdater.checkForUpdates().catch(console.error)
  setTimeout(checkForUpdates, SCHEDULED_AUTO_UPDATE_DELAY)
}

const announceUpdate = () => {
  // TODO: use something more managed for IPC state updates
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.webContents.send('update-ready')
    win.setProgressBar(-1)
  }
}

export const initUpdater = () => {
  if (process.env.NODE_ENV === 'development') {
    return
  }

  autoUpdater.logger = log

  autoUpdater.setFeedURL(updaterFeed as any)
  autoUpdater.on('update-available', () => {
    hasUpdateAvailable = true
  })
  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true
    announceUpdate()
  })
  // autoUpdater.on('update-not-available', () => { hasUpdateAvailable = true; })
  // autoUpdater.on('error', function(){ console.log('autoUpdater error', arguments); })

  autoUpdater.on('download-progress', progress => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.setProgressBar(progress.percent || -1)
    }
  })

  ipcMain.once('install-update', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall()
    }
  })

  // kickoff auto update check after delay
  setTimeout(checkForUpdates, 10000)
}