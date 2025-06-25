// src/types/api.ts

/**
 * 通用API响应结构
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  avatar_url?: string
  created_at: string
  // 用户的特定权限
  specific_permissions: { name: string; allowed: boolean }[]
}


/**
 * 登录数据
 */
export interface LoginData {
  token: string
  user: UserInfo
}

/**
 * 权限定义
 */
export interface Permission {
  id: number
  name: string
  description: string
}

/**
 * 角色定义 (来自后端的 RoleEnum)
 */
export interface Role {
  name: string;
  value: number;
}

/**
 * 用户列表项（简化版）
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  // 添加一个可选字段来持有用户的特定权限
  specific_permissions?: { name: string; allowed: boolean }[];
}