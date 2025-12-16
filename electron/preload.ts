/**
 * Electron Preload Script
 * Exposes IPC methods to the renderer via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron'

// Type definitions for TTS options
interface TTSOptions {
    text: string
    voice: string
    accent: string
    speed?: number
    pitch?: number
}

interface TTSResult {
    success: boolean
    audioPath?: string
    duration?: number
    error?: string
}

interface SaveResult {
    success: boolean
    savedPath?: string
    canceled?: boolean
    error?: string
}

// Expose TTS API to renderer
contextBridge.exposeInMainWorld('ttsAPI', {
    /**
     * Generate TTS audio from text
     */
    generate: (options: TTSOptions): Promise<TTSResult> => {
        return ipcRenderer.invoke('tts:generate', options)
    },

    /**
     * Play audio file
     */
    play: (audioPath: string): Promise<{ success: boolean; error?: string }> => {
        return ipcRenderer.invoke('tts:play', audioPath)
    },

    /**
     * Save audio file to user-selected location
     */
    save: (audioPath: string): Promise<SaveResult> => {
        return ipcRenderer.invoke('tts:save', audioPath)
    },

    /**
     * Get the output directory path
     */
    getOutputDir: (): Promise<string> => {
        return ipcRenderer.invoke('tts:getOutputDir')
    },

    /**
     * Get saved API key
     */
    getApiKey: (): Promise<string> => {
        return ipcRenderer.invoke('api:getKey')
    },

    /**
     * Set API key
     */
    setApiKey: (key: string): Promise<void> => {
        return ipcRenderer.invoke('api:setKey', key)
    }
})

// Declare types for window
declare global {
    interface Window {
        ttsAPI: {
            generate: (options: TTSOptions) => Promise<TTSResult>
            play: (audioPath: string) => Promise<{ success: boolean; error?: string }>
            save: (audioPath: string) => Promise<SaveResult>
            getOutputDir: () => Promise<string>
            getApiKey: () => Promise<string>
            setApiKey: (key: string) => Promise<void>
        }
    }
}
