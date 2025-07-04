import axios from 'axios';
import {
    message
} from 'ant-design-vue';
import store from '@/store'; // 引入Vuex store

// 创建axios实例
const service = axios.create({
    // --- 这里是关键的修改 ---
    // 确保 baseURL 是 '/api'，这样所有请求都会以 /api 开头
    // 例如，请求 '/auth/login' 会变成 '/api/auth/login'
    baseURL: '/api',
    withCredentials: true,
    timeout: 10000
});


// 请求拦截器 (可选，未来可用于添加token)
service.interceptors.request.use(
    config => {
        // 可以在这里统一设置请求头，例如 token
        // if (store.getters.token) {
        //   config.headers['Authorization'] = `Bearer ${store.getters.token}`;
        // }
        return config;
    },
    error => {
        console.log(error);
        return Promise.reject(error);
    }
);


// 响应拦截器
service.interceptors.response.use(
    response => {
        return response.data;
    },
    error => {
        console.error('API Error:', error.response);

        if (error.response && error.response.data && error.response.data.error) {
            message.error(error.response.data.error);

            // --- 关键修改 ---
            // 检查到401错误，并且当前Vuex中用户是登录状态，才执行登出
            // 这可以防止在登录页面输入错误密码时触发不必要的登出操作
            if (error.response.status === 401 && store.getters['user/isLoggedIn']) {
                store.dispatch('user/logout');
            }

        } else {
            message.error('网络请求异常，请稍后重试');
        }
        return Promise.reject(error);
    }
);

export default service;