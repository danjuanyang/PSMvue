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

// --- 新增HR模块类型定义 ---

/**
 * 带有组长信息的用户对象
 */
export interface UserWithLeader extends User {
  team_leader_id: number | null;
  leader_name: string | null;
}

/**
 * 补卡记录
 */
export interface ClockInRecord {
  id: number;
  report_id: number;
  employee_id: number;
  employee_name: string;
  clockin_date: string;
  weekday: string;
  remarks: string;
  created_at: string;
}

/**
 * 任务进度更新记录中内嵌的任务信息
 */
interface TaskInfo {
  id: number;
  name: string;
  stage: string;
  subproject: string;
  project: string;
}

/**
 * 任务进度更新记录
 */
export interface ProgressUpdateRecord {
  id: number;
  progress: number;
  description: string;
  created_at: string;
  recorder_id: number;
  recorder_name: string;
  task_info: TaskInfo;
}
