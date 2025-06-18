// src/api/auth.ts
import request from './request';
import type { LoginData, UserInfo } from '../types/api';

/**
 * 登录API
 * @param data 包含用户名和密码的对象
 */
export function loginApi(data: LoginData) {
  return request<UserInfo>({
    url: '/auth/login',
    method: 'post',
    data,
  });
}

/**
 * 获取用户登录状态API
 */
export function getStatusApi() {
    return request<UserInfo>({
        url: '/auth/status',
        method: 'get'
    });
}

/**
 * 登出API
 */
export function logoutApi() {
    return request({
        url: '/auth/logout',
        method: 'post'
    });
}
