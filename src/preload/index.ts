import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

export type GenerateResult =
  | {
      ok: true
      tree: unknown
      templateRoot: string
      courseDataPath: string
      lessonPaths: string[]
      imagesCopied: number
      coverWebPath: string
    }
  | { ok: false; error: string }

export type BuildResult = { ok: true; finalZipPath: string } | { ok: false; error: string }

const api = {
  getAppLocale: (): Promise<string> => ipcRenderer.invoke('app:getLocale'),
  pickDocx: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickDocx'),
  pickImage: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickImage'),
  saveScormZip: (suggestedName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveScormZip', suggestedName),
  parseDocx: (payload: {
    docxPath: string
  }): Promise<{ ok: true; tree: unknown } | { ok: false; error: string }> =>
    ipcRenderer.invoke('studio:parseDocx', payload),
  generateLessonFiles: (payload: {
    metadata: unknown
    docxPath: string
    themesByBlock?: Record<string, Record<number, string>>
  }): Promise<GenerateResult> => ipcRenderer.invoke('studio:generateLessonFiles', payload),
  openPath: (p: string): Promise<void> => ipcRenderer.invoke('studio:openPath', p),
  checkNpm: (): Promise<{ available: boolean; version: string | null }> =>
    ipcRenderer.invoke('studio:checkNpm'),
  buildScorm: (payload: { destZipPath: string; metadata: unknown }): Promise<BuildResult> =>
    ipcRenderer.invoke('studio:buildScorm', payload),
  buildWeb: (payload: { destZipPath: string; metadata: unknown }): Promise<BuildResult> =>
    ipcRenderer.invoke('studio:buildWeb', payload),
  onBuildLog: (cb: (line: string) => void): (() => void) => {
    const listener = (_e: unknown, line: string): void => cb(line)
    ipcRenderer.on('studio:buildLog', listener)
    return () => ipcRenderer.removeListener('studio:buildLog', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (dev only)
  window.electron = electronAPI
  // @ts-ignore (dev only)
  window.api = api
}
