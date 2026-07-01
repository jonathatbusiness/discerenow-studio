import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { parseDocxToCourseTree } from './parser/docxParser'
import {
  applyThemesToTree,
  writeCourseToTemplate,
  type CourseMetadataInput
} from './parser/lessonWriter'
import { buildAndExportScorm, buildAndExportWeb, checkNpmAvailable } from './runner/scormRunner'
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.discerenow.studio')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('app:getLocale', async () => {
    return app.getLocale()
  })

  // ────── Dialog IPC handlers ──────
  ipcMain.handle('dialog:pickDocx', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecionar documento Word',
      filters: [{ name: 'Documentos Word', extensions: ['docx'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:pickImage', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecionar imagem de capa',
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:saveScormZip', async (_event, suggestedName: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Salvar pacote SCORM',
      defaultPath: suggestedName,
      filters: [{ name: 'Pacote SCORM (zip)', extensions: ['zip'] }]
    })
    return result.canceled ? null : result.filePath
  })
  // Cache the latest parse in the main process to avoid parsing the same file twice.
  let lastParseCache: {
    docxPath: string
    parseResult: Awaited<ReturnType<typeof parseDocxToCourseTree>>
  } | null = null

  ipcMain.handle('studio:parseDocx', async (_event, payload: { docxPath: string }) => {
    try {
      const parseResult = await parseDocxToCourseTree(payload.docxPath)
      lastParseCache = { docxPath: payload.docxPath, parseResult }
      return { ok: true, tree: parseResult.tree }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  })

  ipcMain.handle(
    'studio:generateLessonFiles',
    async (
      _event,
      payload: {
        metadata: CourseMetadataInput
        docxPath: string
        themesByBlock?: Record<string, Record<number, string>>
      }
    ) => {
      try {
        let parseResult
        if (lastParseCache && lastParseCache.docxPath === payload.docxPath) {
          parseResult = lastParseCache.parseResult
        } else {
          parseResult = await parseDocxToCourseTree(payload.docxPath)
          lastParseCache = { docxPath: payload.docxPath, parseResult }
        }

        if (payload.themesByBlock) {
          applyThemesToTree(parseResult.tree, payload.themesByBlock)
        }

        const templateRoot = is.dev
          ? join(app.getAppPath(), 'template')
          : join(process.resourcesPath, 'template')
        const result = await writeCourseToTemplate(templateRoot, payload.metadata, parseResult)
        return {
          ok: true,
          tree: parseResult.tree,
          templateRoot,
          courseDataPath: result.courseDataPath,
          lessonPaths: result.lessonPaths,
          imagesCopied: result.imagesCopied,
          coverWebPath: result.coverWebPath
        }
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  ipcMain.handle('studio:openPath', async (_event, p: string) => {
    shell.showItemInFolder(p)
  })
  ipcMain.handle('studio:checkNpm', async () => {
    const version = await checkNpmAvailable()
    return { available: version !== null, version }
  })

  ipcMain.handle(
    'studio:buildScorm',
    async (event, payload: { destZipPath: string; metadata: CourseMetadataInput }) => {
      const templateRoot = is.dev
        ? join(app.getAppPath(), 'template')
        : join(process.resourcesPath, 'template')

      const result = await buildAndExportScorm(
        templateRoot,
        payload.destZipPath,
        payload.metadata,
        (line) => event.sender.send('studio:buildLog', line)
      )
      return result
    }
  )

  ipcMain.handle(
    'studio:buildWeb',
    async (event, payload: { destZipPath: string; metadata: CourseMetadataInput }) => {
      const templateRoot = is.dev
        ? join(app.getAppPath(), 'template')
        : join(process.resourcesPath, 'template')

      const result = await buildAndExportWeb(
        templateRoot,
        payload.destZipPath,
        payload.metadata,
        (line) => event.sender.send('studio:buildLog', line)
      )
      return result
    }
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
