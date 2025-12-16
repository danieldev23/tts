/**
 * Electron Main Process
 * Handles window creation and IPC communication with the renderer
 * 
 * @author HuyDQ
 * @license MIT
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { generateTTS, playAudio } from './services/geminiTTS'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Reference to the main window
let mainWindow: BrowserWindow | null = null

// Path to store user settings
const getSettingsPath = () => join(app.getPath('userData'), 'settings.json')

/**
 * Load user settings
 */
function loadSettings(): { apiKey?: string } {
    try {
        const settingsPath = getSettingsPath()
        if (existsSync(settingsPath)) {
            return JSON.parse(readFileSync(settingsPath, 'utf-8'))
        }
    } catch (error) {
        console.error('[Settings] Failed to load:', error)
    }
    return {}
}

/**
 * Save user settings
 */
function saveSettings(settings: { apiKey?: string }): void {
    try {
        const settingsPath = getSettingsPath()
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
        console.log('[Settings] Saved to:', settingsPath)
    } catch (error) {
        console.error('[Settings] Failed to save:', error)
    }
}

/**
 * Get API key from settings or env
 */
function getApiKey(): string {
    const settings = loadSettings()
    return settings.apiKey || process.env.GEMINI_API_KEY || ''
}

/**
 * Create the main application window
 */
function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#020617', // Dark background
        titleBarStyle: 'hiddenInset', // macOS style
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        }
    })

    // Development or production URL
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// App ready
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

/**
 * IPC Handlers
 */

// Get API key
ipcMain.handle('api:getKey', () => {
    return getApiKey()
})

// Set API key
ipcMain.handle('api:setKey', (_event, key: string) => {
    const settings = loadSettings()
    settings.apiKey = key
    saveSettings(settings)
    // Also set in process.env for immediate use
    process.env.GEMINI_API_KEY = key
    return true
})

// Generate TTS audio
ipcMain.handle('tts:generate', async (_event, options: {
    text: string
    voice: string
    accent: string
    speed?: number
    pitch?: number
}) => {
    try {
        // Ensure API key is set
        const apiKey = getApiKey()
        if (!apiKey) {
            return { success: false, error: 'Chưa cấu hình API key. Vui lòng vào Cài đặt để thêm.' }
        }
        process.env.GEMINI_API_KEY = apiKey

        console.log('[Main] Generating TTS:', options)
        const result = await generateTTS(options)
        return { success: true, ...result }
    } catch (error: any) {
        console.error('[Main] TTS Generation Error:', error)
        return { success: false, error: error.message }
    }
})

// Play audio
ipcMain.handle('tts:play', async (_event, audioPath: string) => {
    try {
        await playAudio(audioPath)
        return { success: true }
    } catch (error: any) {
        console.error('[Main] Play Audio Error:', error)
        return { success: false, error: error.message }
    }
})

// Save audio file
ipcMain.handle('tts:save', async (_event, audioPath: string) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow!, {
            defaultPath: 'tts-audio.wav',
            filters: [
                { name: 'Audio Files', extensions: ['wav', 'mp3'] }
            ]
        })

        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true }
        }

        // Read the temp file and write to chosen location
        const audioData = readFileSync(audioPath)
        writeFileSync(result.filePath, audioData)

        return { success: true, savedPath: result.filePath }
    } catch (error: any) {
        console.error('[Main] Save Audio Error:', error)
        return { success: false, error: error.message }
    }
})

// Get output directory
ipcMain.handle('tts:getOutputDir', () => {
    const outputDir = join(app.getPath('userData'), 'output')
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
    }
    return outputDir
})
