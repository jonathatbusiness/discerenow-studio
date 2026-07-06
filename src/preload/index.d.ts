export {}

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

type UpdateInfo = {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  releaseName: string
  publishedAt: string
}

declare global {
  interface Window {
    api: {
      getAppLocale: () => Promise<string>
      getAppVersion: () => Promise<string>
      checkForUpdates: () => Promise<UpdateInfo | null>
      openLatestRelease: () => Promise<void>
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
