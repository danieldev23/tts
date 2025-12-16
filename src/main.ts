/**
 * Vue 3 Application Entry Point
 */

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/main.css'
import App from './App.vue'

// Create Vue app
const app = createApp(App)

// Use Element Plus
app.use(ElementPlus)

// Mount
app.mount('#app')
