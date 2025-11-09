// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  findMp3Files: (dirPath: string) => ipcRenderer.invoke('find-mp3-files', dirPath),
  readMp3File: (filePath: string) => ipcRenderer.invoke('read-mp3-file', filePath),
});
