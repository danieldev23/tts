<script setup lang="ts">

import { computed } from 'vue'

// Define emits and props
interface Props {
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Two-way binding
const selectedAccent = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

/**
 * Accent options with emoji indicators
 * Each accent maps to a specific prompt instruction in geminiTTS.ts
 */
const accentOptions = [
  // Miền Bắc
  {
    value: 'bac',
    label: '🇻🇳 Bắc (Chuẩn)',
    description: 'Giọng Bắc chuẩn, rõ ràng, trong trẻo'
  },
  {
    value: 'ha-noi',
    label: '🏛 Hà Nội',
    description: 'Giọng Hà Nội thanh lịch, nhẹ nhàng'
  },
  // Miền Trung
  {
    value: 'hue',
    label: '🌊 Huế',
    description: 'Giọng Huế, chậm rãi, trầm ấm, ngọt ngào'
  },
  {
    value: 'nghe-an',
    label: '🏔 Nghệ An',
    description: 'Giọng Nghệ An - Hà Tĩnh, nặng, mộc mạc'
  },
  {
    value: 'quang-nam',
    label: '🌾 Quảng Nam',
    description: 'Giọng Quảng Nam, nặng, thô, chậm'
  },
  {
    value: 'binh-dinh',
    label: '🌻 Bình Định',
    description: 'Giọng Bình Định, nặng, thẳng thắn'
  },
  {
    value: 'da-nang',
    label: '🌉 Đà Nẵng',
    description: 'Giọng Đà Nẵng, vừa phải, dễ nghe'
  },
  // Miền Nam
  {
    value: 'nam',
    label: '🌴 Nam (Chuẩn)',
    description: 'Giọng Nam bộ, tự nhiên, thân thiện'
  },
  {
    value: 'sai-gon',
    label: '🌆 Sài Gòn',
    description: 'Giọng Sài Gòn, trẻ trung, năng động'
  },
  {
    value: 'mien-tay',
    label: '🚤 Miền Tây',
    description: 'Giọng miền Tây, hiền hòa, mộc mạc'
  },
  {
    value: 'can-tho',
    label: '🍃 Cần Thơ',
    description: 'Giọng Cần Thơ, nhẹ nhàng, dễ thương'
  }
]

// Get current accent label for display
const currentLabel = computed(() => {
  const option = accentOptions.find(opt => opt.value === selectedAccent.value)
  return option?.label || accentOptions[0].label
})

const currentDescription = computed(() => {
  const option = accentOptions.find(opt => opt.value === selectedAccent.value)
  return option?.description || ''
})
</script>

<template>
  <div>
    <el-select
      v-model="selectedAccent"
      class="w-full"
      filterable
      placeholder="Chọn giọng vùng miền"
    >
      <el-option
        v-for="option in accentOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      >
        <div class="flex flex-col py-1">
          <span class="font-medium">{{ option.label }}</span>
          <span class="text-xs text-text-secondary mt-0.5">{{ option.description }}</span>
        </div>
      </el-option>
    </el-select>

    <!-- Accent Info Tooltip -->
    <div class="mt-2 text-xs text-text-secondary flex items-start gap-1">
      <span class="text-yellow-500">ℹ️</span>
      <span>
        Giọng vùng miền được mô phỏng bằng <strong class="text-accent-sky">prompt engineering</strong>.
        Kết quả có thể không hoàn toàn chính xác.
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Custom option styling */
:deep(.el-select-dropdown__item) {
  height: auto !important;
  padding: 8px 12px !important;
}
</style>
