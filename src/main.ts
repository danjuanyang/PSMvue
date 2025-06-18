// src/main.ts

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// --- 1. 引入 Naive UI ---
import naive from 'naive-ui'

// --- 2. 引入 Naive UI 推荐的字体 ---
import 'vfonts/Lato.css'      // 通用字体
import 'vfonts/FiraCode.css' // 等宽字体

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// --- 3. 将 Naive UI 注册为插件 ---
app.use(naive)

app.mount('#app')