/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// TTS API types from preload script
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
