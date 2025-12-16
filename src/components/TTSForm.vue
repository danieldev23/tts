<script setup lang="ts">
/**
 * TTS Form Component
 * Main form for text-to-speech generation
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Play,
  Download,
  Loader,
  Volume2,
  Settings2,
  Sparkles
} from 'lucide-vue-next'
import AccentSelect from './AccentSelect.vue'

// Form state
const text = ref('')
const voice = ref('sulafat')
const accent = ref('bac')
const speed = ref(1.0)
const pitch = ref(0)

// UI state
const isGenerating = ref(false)
const isPlaying = ref(false)
const currentPreviewVoice = ref<string | null>(null)
const currentAudioPath = ref<string | null>(null)
const showSettings = ref(false)

// Audio element for previewing voices
let previewAudio: HTMLAudioElement | null = null

// Character count
const charCount = computed(() => text.value.length)
const maxChars = 5000

// All voices with Vietnamese descriptions
const voiceOptions = [
  // Nữ (Female) 👩
  { value: 'sulafat', label: '👩 Sulafat - Ấm áp, trung bình' },
  { value: 'zephyr', label: '👩 Zephyr - Tươi sáng, cao' },
  { value: 'kore', label: '👩 Kore - Chắc chắn, trung bình' },
  { value: 'aoede', label: '👩 Aoede - Nhẹ nhàng, trung bình' },
  { value: 'leda', label: '👩 Leda - Trẻ trung, cao' },
  { value: 'laomedeia', label: '👩 Laomedeia - Vui vẻ, cao' },
  { value: 'achernar', label: '👩 Achernar - Nhẹ nhàng, cao' },
  { value: 'despina', label: '👩 Despina - Mượt mà, trung bình' },
  { value: 'erinome', label: '👩 Erinome - Rõ ràng, trung bình' },
  { value: 'callirrhoe', label: '👩 Callirrhoe - Thoải mái, trung bình' },
  { value: 'autonoe', label: '👩 Autonoe - Sáng, trung bình' },
  { value: 'vindemiatrix', label: '👩 Vindemiatrix - Dịu dàng, trung bình' },
  { value: 'pulcherrima', label: '👩 Pulcherrima - Mạnh mẽ, trung bình' },
  // Nam (Male) 👨
  { value: 'puck', label: '👨 Puck - Vui tươi, trung bình' },
  { value: 'charon', label: '👨 Charon - Trầm, thấp' },
  { value: 'fenrir', label: '👨 Fenrir - Sôi nổi, trầm' },
  { value: 'orus', label: '👨 Orus - Chắc chắn, trầm' },
  { value: 'enceladus', label: '👨 Enceladus - Thì thầm, thấp' },
  { value: 'iapetus', label: '👨 Iapetus - Rõ ràng, trầm' },
  { value: 'umbriel', label: '👨 Umbriel - Thoải mái, trầm' },
  { value: 'algieba', label: '👨 Algieba - Mượt mà, thấp' },
  { value: 'algenib', label: '👨 Algenib - Khàn, thấp' },
  { value: 'rasalgethi', label: '👨 Rasalgethi - Thông tin, trung bình' },
  { value: 'alnilam', label: '👨 Alnilam - Chắc chắn, trầm' },
  { value: 'schedar', label: '👨 Schedar - Đều đặn, trầm' },
  { value: 'gacrux', label: '👨 Gacrux - Trưởng thành, trung bình' },
  { value: 'achird', label: '👨 Achird - Thân thiện, trầm' },
  { value: 'zubenelgenubi', label: '👨 Zubenelgenubi - Tự nhiên, trầm' },
  { value: 'sadachbia', label: '👨 Sadachbia - Sống động, thấp' },
  { value: 'sadaltager', label: '👨 Sadaltager - Hiểu biết, trung bình' }
]

// Check if TTS API is available
const isTTSAvailable = computed(() => {
  return typeof window !== 'undefined' && 'ttsAPI' in window
})

/**
 * Generate TTS audio
 */
async function handleGenerate() {
  if (!text.value.trim()) {
    ElMessage.warning('Vui lòng nhập văn bản cần đọc')
    return
  }

  if (!isTTSAvailable.value) {
    ElMessage.error('TTS API không khả dụng. Vui lòng chạy trong Electron.')
    return
  }

  isGenerating.value = true
  currentAudioPath.value = null

  try {
    const result = await window.ttsAPI.generate({
      text: text.value,
      voice: voice.value,
      accent: accent.value,
      speed: speed.value,
      pitch: pitch.value
    })

    if (result.success && result.audioPath) {
      currentAudioPath.value = result.audioPath
      ElMessage.success('Đã tạo audio thành công!')
      
      // Auto-play
      handlePlay()
    } else {
      ElMessage.error(result.error || 'Không thể tạo audio')
    }
  } catch (error: any) {
    console.error('Generate error:', error)
    ElMessage.error(error.message || 'Lỗi không xác định')
  } finally {
    isGenerating.value = false
  }
}

/**
 * Play audio
 */
async function handlePlay() {
  if (!currentAudioPath.value) {
    ElMessage.warning('Chưa có audio để phát')
    return
  }

  isPlaying.value = true

  try {
    await window.ttsAPI.play(currentAudioPath.value)
  } catch (error: any) {
    console.error('Play error:', error)
    ElMessage.error('Không thể phát audio')
  } finally {
    isPlaying.value = false
  }
}

/**
 * Play voice sample using Google audio
 */
function playVoiceSample(voiceId: string) {
  // Stop any currently playing preview
  if (previewAudio) {
    previewAudio.pause()
    previewAudio = null
    currentPreviewVoice.value = null
  }

  currentPreviewVoice.value = voiceId

  // Capitalize first letter for URL
  const capitalizedName = voiceId.charAt(0).toUpperCase() + voiceId.slice(1)

  // Google sample URL
  const sampleUrl = `https://gstatic.com/aistudio/voices/samples/${capitalizedName}.wav`
  
  console.log('[Preview] Playing:', sampleUrl)

  previewAudio = new Audio(sampleUrl)
  
  previewAudio.onended = () => {
    currentPreviewVoice.value = null
  }
  
  previewAudio.onerror = () => {
    currentPreviewVoice.value = null
    ElMessage.warning('Không thể phát mẫu giọng này')
  }

  previewAudio.play().catch(() => {
    currentPreviewVoice.value = null
    ElMessage.warning('Không thể phát mẫu giọng này')
  })
}

/**
 * Save audio file
 */
async function handleSave() {
  if (!currentAudioPath.value) {
    ElMessage.warning('Chưa có audio để lưu')
    return
  }

  try {
    const result = await window.ttsAPI.save(currentAudioPath.value)
    
    if (result.success) {
      ElMessage.success(`Đã lưu file: ${result.savedPath}`)
    } else if (!result.canceled) {
      ElMessage.error(result.error || 'Không thể lưu file')
    }
  } catch (error: any) {
    console.error('Save error:', error)
    ElMessage.error('Không thể lưu file')
  }
}

// Format speed display
const speedDisplay = computed(() => `${speed.value.toFixed(1)}x`)
const pitchDisplay = computed(() => {
  if (pitch.value === 0) return 'Bình thường'
  return pitch.value > 0 ? `+${pitch.value}` : `${pitch.value}`
})
</script>

<template>
  <div class="space-y-6">
    <!-- Main Card -->
    <el-card class="glass-card !bg-card-bg !border-card-border">
      <div class="space-y-6">
        <!-- Text Input -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">
            Văn bản cần đọc
          </label>
          <el-input
            v-model="text"
            type="textarea"
            :rows="6"
            :maxlength="maxChars"
            show-word-limit
            placeholder="Nhập văn bản tiếng Việt cần chuyển thành giọng nói..."
            class="!text-base"
          />
          <div class="mt-1 text-xs text-text-secondary text-right">
            {{ charCount.toLocaleString() }} / {{ maxChars.toLocaleString() }} ký tự
          </div>
        </div>

        <!-- Voice & Accent Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Voice -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">
              Giọng đọc
            </label>
            <el-select 
              v-model="voice" 
              class="w-full voice-select"
              filterable
              placeholder="Tìm kiếm giọng đọc..."
            >
              <el-option
                v-for="v in voiceOptions"
                :key="v.value"
                :label="v.label"
                :value="v.value"
              >
                <div class="flex items-center justify-between w-full py-1">
                  <span>{{ v.label }}</span>
                  <button
                    @click.stop="playVoiceSample(v.value)"
                    class="ml-2 p-1 rounded hover:bg-card-border transition-colors"
                    title="Nghe thử"
                  >
                    <Play v-if="currentPreviewVoice !== v.value" class="w-3 h-3 text-accent-cyan" />
                    <Loader v-else class="w-3 h-3 text-accent-cyan animate-spin" />
                  </button>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- Accent -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">
              Giọng vùng miền
            </label>
            <AccentSelect v-model="accent" />
          </div>
        </div>

        <!-- Advanced Settings Toggle -->
        <button
          @click="showSettings = !showSettings"
          class="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-sky transition-colors"
        >
          <Settings2 class="w-4 h-4" />
          <span>{{ showSettings ? 'Ẩn' : 'Hiện' }} cài đặt nâng cao</span>
        </button>

        <!-- Advanced Settings -->
        <div v-show="showSettings" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-app-bg">
          <!-- Speed -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-3">
              Tốc độ đọc: {{ speedDisplay }}
            </label>
            <el-slider
              v-model="speed"
              :min="0.5"
              :max="2.0"
              :step="0.1"
              :show-tooltip="false"
            />
          </div>

          <!-- Pitch -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-3">
              Cao độ: {{ pitchDisplay }}
            </label>
            <el-slider
              v-model="pitch"
              :min="-20"
              :max="20"
              :step="1"
              :show-tooltip="false"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- Action Buttons -->
    <div class="flex flex-wrap items-center justify-center gap-4">
      <!-- Generate Button -->
      <button
        @click="handleGenerate"
        :disabled="isGenerating || !text.trim()"
        class="btn-gradient flex items-center gap-2 min-w-[180px] justify-center"
      >
        <template v-if="isGenerating">
          <Loader class="w-5 h-5 animate-spin" />
          <span>Đang tạo...</span>
        </template>
        <template v-else>
          <Sparkles class="w-5 h-5" />
          <span>Tạo Giọng Đọc</span>
        </template>
      </button>

      <!-- Play Button -->
      <button
        v-if="currentAudioPath"
        @click="handlePlay"
        :disabled="isPlaying"
        class="px-6 py-3 rounded-xl font-semibold bg-card-bg border border-card-border 
               text-text-primary hover:border-accent-sky hover:text-accent-sky
               transition-all duration-300 flex items-center gap-2"
      >
        <template v-if="isPlaying">
          <Volume2 class="w-5 h-5 animate-pulse" />
          <span>Đang phát...</span>
        </template>
        <template v-else>
          <Play class="w-5 h-5" />
          <span>Phát Lại</span>
        </template>
      </button>

      <!-- Download Button -->
      <button
        v-if="currentAudioPath"
        @click="handleSave"
        class="px-6 py-3 rounded-xl font-semibold bg-card-bg border border-card-border 
               text-text-primary hover:border-accent-cyan hover:text-accent-cyan
               transition-all duration-300 flex items-center gap-2"
      >
        <Download class="w-5 h-5" />
        <span>Tải Xuống</span>
      </button>
    </div>

    <!-- Status Message (for non-Electron) -->
    <div v-if="!isTTSAvailable" class="text-center p-4 rounded-xl bg-yellow-900/20 border border-yellow-700/50">
      <p class="text-yellow-400 text-sm">
        ⚠️ Đang chạy ở chế độ web. Vui lòng chạy trong Electron để sử dụng TTS.
      </p>
    </div>
  </div>
</template>
