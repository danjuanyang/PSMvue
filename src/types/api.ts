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

// --- 新增类型定义 ---

export enum StatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  employee_id?: number;
  employee_name?: string;
  start_date?: string;
  deadline?: string;
  progress: number;
  status: StatusEnum;
  subproject_count: number;
}

export interface Subproject {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  employee_id?: number;
  employee_name?: string;
  start_date?: string;
  deadline?: string;
  progress: number;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
}

export interface ProjectStage {
  id: number;
  project_id: number;
  subproject_id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  progress: number;
  status: StatusEnum;
}

export interface StageTask {
  id: number;
  stage_id: number;
  name: string;
  description?: string;
  due_date?: string;
  progress: number;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
}