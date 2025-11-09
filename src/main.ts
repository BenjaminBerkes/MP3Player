import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 360,
    height: 650,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove the application menu entirely
  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// IPC handler for selecting a directory
ipcMain.handle('select-directory', async (event) => {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});
// IPC handler for finding MP3 files in a directory
ipcMain.handle('find-mp3-files', async (event, dirPath: string) => {
  try {
    const files = await fs.readdir(dirPath);
    const mp3Files = files.filter(
      (file) => file.toLowerCase().endsWith('.mp3')
    );
    return mp3Files.sort();
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

// IPC handler for reading MP3 files
ipcMain.handle('read-mp3-file', async (event, filePath: string) => {
  try {
    const fileData = await fs.readFile(filePath);
    return fileData.toString('base64');
  } catch (error) {
    console.error('Error reading MP3 file:', error);
    return null;
  }
});
