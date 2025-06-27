// src/api/request.ts
import axios from 'axios'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const service = axios.create({
  // **关键修改**: baseURL 指向代理
  baseURL: '/api',
  timeout: 5173,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 直接返回响应体中的 data 部分
    return response.data
  },
  (error) => {
    // 统一错误处理
    const message = useMessage()
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message.error('认证失败，请重新登录')
          useUserStore().logout()
          // 跳转到登录页
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限执行此操作')
          break
        default:
          message.error(error.response.data.error || '服务器发生错误')
      }
    } else {
      message.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

export default service
