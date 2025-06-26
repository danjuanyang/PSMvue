/**
 * 通用API响应结构
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 完整用户信息
 */
export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  avatar_url?: string
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
 * 角色定义
 */
export interface Role {
  name: string;
  value: number;
}

/**
 * 用户列表项（与后端完全对应）
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}
