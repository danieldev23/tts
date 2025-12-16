/**
 * Google Gemini TTS Service
 * Uses public API with rate limit handling
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { exec } from 'child_process'

/**
 * Accent prompt mappings - Vietnamese regional dialects
 */
const ACCENT_PROMPTS: Record<string, string> = {
    // Miền Bắc
    'bac': 'Đọc bằng giọng Bắc chuẩn, rõ ràng, trong trẻo, nhấn nhá đúng dấu.',
    'ha-noi': 'Đọc bằng giọng Hà Nội thanh lịch, nhẹ nhàng, trong trẻo.',
    // Miền Trung  
    'hue': 'Đọc bằng giọng Huế, nhẹ nhàng, chậm rãi, trầm ấm, ngọt ngào, đầy cảm xúc.',
    'nghe-an': 'Đọc bằng giọng Nghệ An - Hà Tĩnh, nặng, chậm, trầm, mộc mạc.',
    'quang-nam': 'Đọc bằng giọng Quảng Nam, nặng, thô, chậm, rõ ràng.',
    'binh-dinh': 'Đọc bằng giọng Bình Định, nặng, thẳng thắn, mạnh mẽ.',
    'da-nang': 'Đọc bằng giọng Đà Nẵng, vừa phải, dễ nghe, hơi nhanh.',
    // Miền Nam
    'nam': 'Đọc bằng giọng Nam bộ, tự nhiên, thân thiện, nhanh, hơi kéo dài.',
    'sai-gon': 'Đọc bằng giọng Sài Gòn, trẻ trung, hiện đại, thân thiện, năng động.',
    'mien-tay': 'Đọc bằng giọng miền Tây Nam Bộ, chậm rãi, hiền hòa, mộc mạc, dễ thương.',
    'can-tho': 'Đọc bằng giọng Cần Thơ, nhẹ nhàng, thân thiện, kéo dài cuối câu.'
}

/**
 * All 30 available voices from AI Studio
 */
const VOICES: Record<string, { name: string; desc: string }> = {
    'zephyr': { name: 'Zephyr', desc: 'Bright, Higher pitch' },
    'puck': { name: 'Puck', desc: 'Upbeat, Middle pitch' },
    'charon': { name: 'Charon', desc: 'Informative, Lower pitch' },
    'kore': { name: 'Kore', desc: 'Firm, Middle pitch' },
    'fenrir': { name: 'Fenrir', desc: 'Excitable, Lower middle pitch' },
    'leda': { name: 'Leda', desc: 'Youthful, Higher pitch' },
    'orus': { name: 'Orus', desc: 'Firm, Lower middle pitch' },
    'aoede': { name: 'Aoede', desc: 'Breezy, Middle pitch' },
    'callirrhoe': { name: 'Callirrhoe', desc: 'Easy-going, Middle pitch' },
    'autonoe': { name: 'Autonoe', desc: 'Bright, Middle pitch' },
    'enceladus': { name: 'Enceladus', desc: 'Breathy, Lower pitch' },
    'iapetus': { name: 'Iapetus', desc: 'Clear, Lower middle pitch' },
    'umbriel': { name: 'Umbriel', desc: 'Easy-going, Lower middle pitch' },
    'algieba': { name: 'Algieba', desc: 'Smooth, Lower pitch' },
    'despina': { name: 'Despina', desc: 'Smooth, Middle pitch' },
    'erinome': { name: 'Erinome', desc: 'Clear, Middle pitch' },
    'algenib': { name: 'Algenib', desc: 'Gravelly, Lower pitch' },
    'rasalgethi': { name: 'Rasalgethi', desc: 'Informative, Middle pitch' },
    'laomedeia': { name: 'Laomedeia', desc: 'Upbeat, Higher pitch' },
    'achernar': { name: 'Achernar', desc: 'Soft, Higher pitch' },
    'alnilam': { name: 'Alnilam', desc: 'Firm, Lower middle pitch' },
    'schedar': { name: 'Schedar', desc: 'Even, Lower middle pitch' },
    'gacrux': { name: 'Gacrux', desc: 'Mature, Middle pitch' },
    'pulcherrima': { name: 'Pulcherrima', desc: 'Forward, Middle pitch' },
    'achird': { name: 'Achird', desc: 'Friendly, Lower middle pitch' },
    'zubenelgenubi': { name: 'Zubenelgenubi', desc: 'Casual, Lower middle pitch' },
    'vindemiatrix': { name: 'Vindemiatrix', desc: 'Gentle, Middle pitch' },
    'sadachbia': { name: 'Sadachbia', desc: 'Lively, Lower pitch' },
    'sadaltager': { name: 'Sadaltager', desc: 'Knowledgeable, Middle pitch' },
    'sulafat': { name: 'Sulafat', desc: 'Warm, Middle pitch' },
}

// Track last request time for rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 5000 // 5 seconds between requests

interface TTSOptions {
    text: string
    voice: string
    accent: string
    speed?: number
    pitch?: number
}

interface TTSResult {
    audioPath: string
    duration: number
}

interface WavConversionOptions {
    numChannels: number
    sampleRate: number
    bitsPerSample: number
}

function parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim())
    const [_, format] = fileType.split('/')

    const options: Partial<WavConversionOptions> = {
        numChannels: 1,
        sampleRate: 24000,
        bitsPerSample: 16
    }

    if (format && format.startsWith('L')) {
        const bits = parseInt(format.slice(1), 10)
        if (!isNaN(bits)) {
            options.bitsPerSample = bits
        }
    }

    for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim())
        if (key === 'rate') {
            options.sampleRate = parseInt(value, 10)
        }
    }

    return options as WavConversionOptions
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options

    const byteRate = sampleRate * numChannels * bitsPerSample / 8
    const blockAlign = numChannels * bitsPerSample / 8
    const buffer = Buffer.alloc(44)

    buffer.write('RIFF', 0)
    buffer.writeUInt32LE(36 + dataLength, 4)
    buffer.write('WAVE', 8)
    buffer.write('fmt ', 12)
    buffer.writeUInt32LE(16, 16)
    buffer.writeUInt16LE(1, 20)
    buffer.writeUInt16LE(numChannels, 22)
    buffer.writeUInt32LE(sampleRate, 24)
    buffer.writeUInt32LE(byteRate, 28)
    buffer.writeUInt16LE(blockAlign, 32)
    buffer.writeUInt16LE(bitsPerSample, 34)
    buffer.write('data', 36)
    buffer.writeUInt32LE(dataLength, 40)

    return buffer
}

function convertToWav(rawData: string, mimeType: string): Buffer {
    const options = parseMimeType(mimeType)
    const buffer = Buffer.from(rawData, 'base64')
    const wavHeader = createWavHeader(buffer.length, options)
    return Buffer.concat([wavHeader, buffer])
}

/**
 * Wait for rate limit
 */
async function waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
        console.log(`[TTS] Rate limit: waiting ${waitTime}ms...`)
        await new Promise(r => setTimeout(r, waitTime))
    }

    lastRequestTime = Date.now()
}

/**
 * Generate TTS using public API
 */
export async function generateTTS(options: TTSOptions): Promise<TTSResult> {
    const { text, voice, accent } = options

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('GEMINI_API_KEY chưa được cấu hình trong .env')
    }

    const accentPrompt = ACCENT_PROMPTS[accent] || ACCENT_PROMPTS['bac']
    const voiceInfo = VOICES[voice] || VOICES['sulafat']
    const voiceName = voiceInfo.name
    const fullText = `Read aloud in a warm and friendly tone:\n${accentPrompt}\n\n${text}`

    console.log('[TTS] Generating with:', { voice: voiceName, accent, textLength: text.length })

    // Respect rate limit
    await waitForRateLimit()

    const model = 'gemini-2.5-flash-preview-tts'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: fullText }]
            }
        ],
        generationConfig: {
            temperature: 1,
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    }

    try {
        console.log('[TTS] Calling API...')

        // Retry logic
        let lastError: Error | null = null

        for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) {
                const delay = 5000 * (attempt + 1) // 10s, 15s
                console.log(`[TTS] Retry ${attempt + 1}/3: waiting ${delay}ms...`)
                await new Promise(r => setTimeout(r, delay))
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            if (response.status === 429) {
                lastError = new Error('Rate limit exceeded')
                continue
            }

            if (!response.ok) {
                const errorText = await response.text()
                console.error('[TTS] API Error:', response.status, errorText)
                throw new Error(`API Error ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            console.log('[TTS] Response received')

            // Extract audio
            if (data.candidates?.[0]?.content?.parts) {
                for (const part of data.candidates[0].content.parts) {
                    if (part.inlineData?.data) {
                        const mimeType = part.inlineData.mimeType || 'audio/L16;rate=24000'
                        const wavBuffer = convertToWav(part.inlineData.data, mimeType)

                        const outputDir = join(app.getPath('userData'), 'output')
                        if (!existsSync(outputDir)) {
                            mkdirSync(outputDir, { recursive: true })
                        }

                        const audioPath = join(outputDir, `tts_${Date.now()}.wav`)
                        writeFileSync(audioPath, wavBuffer)

                        console.log('[TTS] Audio saved:', audioPath, 'Size:', wavBuffer.length)

                        return {
                            audioPath,
                            duration: Math.max(1, text.length / 15)
                        }
                    }
                }
            }

            throw new Error('No audio data in response')
        }

        throw lastError || new Error('Failed after 3 retries')
    } catch (error: any) {
        console.error('[TTS] Error:', error)

        if (error.message?.includes('429')) {
            throw new Error('Rate limit. Đã thử 3 lần. Vui lòng chờ 1 phút và thử lại.')
        }
        if (error.message?.includes('403')) {
            throw new Error('API key không có quyền truy cập TTS.')
        }

        throw new Error(`Lỗi TTS: ${error.message}`)
    }
}

/**
 * Play audio file
 */
export async function playAudio(audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!existsSync(audioPath)) {
            reject(new Error('Không tìm thấy file audio'))
            return
        }

        const platform = process.platform
        let command: string

        if (platform === 'darwin') {
            command = `afplay "${audioPath}"`
        } else if (platform === 'win32') {
            command = `start "" "${audioPath}"`
        } else {
            command = `aplay "${audioPath}" || paplay "${audioPath}"`
        }

        exec(command, (error) => {
            if (error) {
                console.error('[TTS] Play error:', error)
                reject(error)
            } else {
                resolve()
            }
        })
    })
}
