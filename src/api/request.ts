// src/api/request.ts
import axios from 'axios';
import { useMessage } from 'naive-ui';

// 创建一个 message 实例，以便在拦截器外部使用
const message = useMessage();

const service = axios.create({
  // 从环境变量获取后端 API 地址，VITE_APP_BASE_API 需要在 .env.development 文件中定义
  // 例如: VITE_APP_BASE_API = http://localhost:3456
  baseURL: import.meta.env.VITE_APP_BASE_API, 
  timeout: 10000, // 请求超时时间
  withCredentials: true, // 允许跨域请求携带 cookie
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里附加 token 等
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 如果后端返回的格式是 { message: '...', ... }，可以直接返回 data
    return response.data;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 401 Unauthorized: token 过期或无效，跳转到登录页
          message.error('认证失败或会话已过期，请重新登录。');
          // 这里可以调用 Pinia store 的 action 来清空用户信息并重定向
          // userStore.logout().then(() => router.push('/login'));
          // 为简单起见，我们暂时只做提示
          window.location.href = '/login';
          break;
        case 403:
          // 403 Forbidden: 用户没有权限
          message.error('您没有权限执行此操作。');
          break;
        case 404:
          message.error('请求的资源未找到。');
          break;
        default:
          // 其他错误，显示后端返回的错误信息
          message.error(error.response.data.error || '服务器发生未知错误。');
      }
    } else {
      // 网络错误等
      message.error('网络连接异常，请稍后再试。');
    }
    return Promise.reject(error);
  }
);

export default service;
