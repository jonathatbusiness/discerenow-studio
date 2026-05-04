import { ElectronAPI } from '@electron-toolkit/preload'

type GenerateResult =
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

type BuildResult = { ok: true; finalZipPath: string } | { ok: false; error: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAppLocale: () => Promise<string>
      pickDocx: () => Promise<string | null>
      pickImage: () => Promise<string | null>
      saveScormZip: (suggestedName: string) => Promise<string | null>
      parseDocx: (payload: {
        docxPath: string
      }) => Promise<{ ok: true; tree: unknown } | { ok: false; error: string }>
      generateLessonFiles: (payload: {
        metadata: unknown
        docxPath: string
        themesByBlock?: Record<string, Record<number, string>>
      }) => Promise<GenerateResult>
      openPath: (p: string) => Promise<void>
      checkNpm: () => Promise<{ available: boolean; version: string | null }>
      buildScorm: (payload: { destZipPath: string; metadata: unknown }) => Promise<BuildResult>
      buildWeb: (payload: { destZipPath: string; metadata: unknown }) => Promise<BuildResult>
      onBuildLog: (cb: (line: string) => void) => () => void
    }
  }
}
