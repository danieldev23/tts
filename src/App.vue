<script setup lang="ts">
/**
 * Main App Component
 * Dark themed layout with TTS form and API settings
 */
import { ref, onMounted } from 'vue'
import TTSForm from './components/TTSForm.vue'
import ApiSettings from './components/ApiSettings.vue'
import { Mic, Settings } from 'lucide-vue-next'

const appVersion = '1.0.0'
const showSettings = ref(false)
const hasApiKey = ref(false)

// Check if API key exists on mount
onMounted(async () => {
  if (typeof window !== 'undefined' && 'ttsAPI' in window) {
    const key = await window.ttsAPI.getApiKey?.()
    hasApiKey.value = !!key
    
    // Auto-show settings if no API key
    if (!key) {
      showSettings.value = true
    }
  }
})

// Handle settings close
function handleSettingsClose() {
  showSettings.value = false
  // Re-check API key
  if (typeof window !== 'undefined' && 'ttsAPI' in window) {
    window.ttsAPI.getApiKey?.().then((key: string) => {
      hasApiKey.value = !!key
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-app-bg text-text-primary">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 glass-card border-0 border-b border-card-border">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Mic class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              TTS Desktop
            </h1>
            <p class="text-xs text-text-secondary">Powered by Google Gemini</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Settings Button -->
          <button
            @click="showSettings = true"
            class="p-2 rounded-xl hover:bg-card-bg border border-transparent hover:border-card-border transition-all"
            :class="{ 'border-yellow-600 bg-yellow-900/20': !hasApiKey }"
            title="Cài đặt API"
          >
            <Settings class="w-5 h-5" :class="hasApiKey ? 'text-text-secondary' : 'text-yellow-400'" />
          </button>
          
          <span class="text-xs text-text-secondary px-2 py-1 rounded-full bg-card-bg border border-card-border">
            v{{ appVersion }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pt-24 pb-8 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Hero Section -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold mb-3">
            <span class="bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 bg-clip-text text-transparent">
              Chuyển Văn Bản Thành Giọng Nói
            </span>
          </h2>
          <p class="text-text-secondary max-w-xl mx-auto">
            Sử dụng Google Gemini AI để tạo giọng đọc tự nhiên với các giọng vùng miền Việt Nam
          </p>
        </div>

        <!-- No API Key Warning -->
        <div v-if="!hasApiKey" class="mb-6 p-4 rounded-xl bg-yellow-900/20 border border-yellow-700/50 text-center">
          <p class="text-yellow-400 text-sm mb-2">
            ⚠️ Chưa có API key. Vui lòng cấu hình API key để sử dụng.
          </p>
          <button
            @click="showSettings = true"
            class="text-accent-cyan hover:underline text-sm"
          >
            Cài đặt ngay →
          </button>
        </div>

        <!-- TTS Form -->
        <TTSForm />

        <!-- Footer Note -->
        <div class="mt-8 text-center space-y-2">
          <p class="text-xs text-text-secondary">
            ⚠️ Giọng vùng miền được mô phỏng bằng prompt engineering, kết quả có thể khác nhau.
          </p>
          <p class="text-xs text-text-secondary">
            Made with ❤️ by <a href="https://github.com/danieldev23" target="_blank" class="text-accent-cyan hover:underline">HuyDQ</a>
          </p>
        </div>
      </div>
    </main>

    <!-- API Settings Modal -->
    <ApiSettings v-if="showSettings" @close="handleSettingsClose" />
  </div>
</template>

<style scoped>
/* Header blur effect */
header {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
