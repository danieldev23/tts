<script setup lang="ts">
/**
 * API Settings Component
 * Allows users to configure their own Gemini API key
 */
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Settings, Key, ExternalLink, Check, X } from 'lucide-vue-next'

const emit = defineEmits<{
  'close': []
}>()

// API key state
const apiKey = ref('')
const showKey = ref(false)
const isSaving = ref(false)

// Load saved API key on mount
onMounted(() => {
  if (typeof window !== 'undefined' && 'ttsAPI' in window) {
    window.ttsAPI.getApiKey?.().then((key: string) => {
      apiKey.value = key || ''
    })
  }
})

// Save API key
async function saveApiKey() {
  if (!apiKey.value.trim()) {
    ElMessage.warning('Vui lòng nhập API key')
    return
  }

  if (!apiKey.value.startsWith('AIza')) {
    ElMessage.warning('API key không hợp lệ. Key phải bắt đầu bằng "AIza"')
    return
  }

  isSaving.value = true

  try {
    if (typeof window !== 'undefined' && 'ttsAPI' in window) {
      await window.ttsAPI.setApiKey?.(apiKey.value.trim())
      ElMessage.success('Đã lưu API key thành công!')
      emit('close')
    }
  } catch (error) {
    ElMessage.error('Không thể lưu API key')
  } finally {
    isSaving.value = false
  }
}

// Clear API key
async function clearApiKey() {
  apiKey.value = ''
  if (typeof window !== 'undefined' && 'ttsAPI' in window) {
    await window.ttsAPI.setApiKey?.('')
    ElMessage.success('Đã xóa API key')
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-card-bg border border-card-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-card-border">
        <div class="flex items-center gap-2">
          <Settings class="w-5 h-5 text-accent-cyan" />
          <h3 class="text-lg font-semibold text-text-primary">Cài đặt API</h3>
        </div>
        <button
          @click="emit('close')"
          class="p-1 rounded-lg hover:bg-card-border transition-colors"
        >
          <X class="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Info -->
        <div class="p-3 rounded-xl bg-blue-900/20 border border-blue-700/30">
          <p class="text-sm text-blue-300">
            Để sử dụng TTS, bạn cần Gemini API key từ Google AI Studio.
          </p>
        </div>

        <!-- API Key Input -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">
            <Key class="w-4 h-4 inline mr-1" />
            Gemini API Key
          </label>
          <div class="relative">
            <input
              v-model="apiKey"
              :type="showKey ? 'text' : 'password'"
              placeholder="AIzaSy..."
              class="w-full px-4 py-3 rounded-xl bg-app-bg border border-card-border
                     text-text-primary placeholder-text-secondary/50
                     focus:border-accent-cyan focus:outline-none transition-colors"
            />
            <button
              @click="showKey = !showKey"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {{ showKey ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- Get API Key Link -->
        <a
          href="https://makersuite.google.com/app/apikey"
          target="_blank"
          class="flex items-center gap-2 text-sm text-accent-cyan hover:underline"
        >
          <ExternalLink class="w-4 h-4" />
          Lấy API key miễn phí từ Google AI Studio
        </a>

        <!-- Warning -->
        <div class="p-3 rounded-xl bg-yellow-900/20 border border-yellow-700/30">
          <p class="text-xs text-yellow-300">
            ⚠️ API key của bạn được lưu cục bộ và không được gửi đến bất kỳ server nào khác ngoài Google.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 p-4 border-t border-card-border">
        <button
          v-if="apiKey"
          @click="clearApiKey"
          class="px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors"
        >
          Xóa key
        </button>
        <div class="flex-1"></div>
        <button
          @click="emit('close')"
          class="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-card-border transition-colors"
        >
          Hủy
        </button>
        <button
          @click="saveApiKey"
          :disabled="isSaving || !apiKey.trim()"
          class="btn-gradient px-4 py-2 text-sm flex items-center gap-2"
        >
          <Check v-if="!isSaving" class="w-4 h-4" />
          {{ isSaving ? 'Đang lưu...' : 'Lưu' }}
        </button>
      </div>
    </div>
  </div>
</template>
