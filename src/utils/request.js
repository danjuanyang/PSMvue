import axios from 'axios'
import {
    removeToken
} from '@/utils/auth'

const service = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
    timeout: 5000,
    withCredentials: true // 启用Cookie支持
})
// 请求拦截器 - 会话认证版本
service.interceptors.request.use(
    config => {
        // 会话认证不需要手动添加Authorization头
        // 浏览器会自动发送Cookie
        return config
    },
    error => {
        console.log(error)
        return Promise.reject(error)
    }
)


// 响应拦截器 - 修复后的版本
service.interceptors.response.use(
    response => {
        const res = response.data

        // 修复 #1: 使用 Object.prototype.hasOwnProperty.call 避免 ESLint 错误
        if (!Object.prototype.hasOwnProperty.call(res, 'code')) {
            // 后端直接返回数据格式，如 { message: "登录成功", user: {...} }
            return res
        }

        // 如果有 code 字段的包装格式
        if (res.code !== 200) {
            console.error('API Error:', res.message)
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res
        }
    },
    error => {
        console.log('err' + error)
        // 处理HTTP状态码错误
        if (error.response) {
            const {
                status,
                data
            } = error.response
            if (status === 401) {
                // token过期，清除本地数据
                removeToken()
                window.location.href = '/login'
            }
            return Promise.reject(new Error(data?.error || `HTTP ${status} Error`))
        }
        return Promise.reject(error)
    }
)

export default service
