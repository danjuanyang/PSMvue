import request from './request'
import type { UserWithLeader, ClockInRecord, ProgressUpdateRecord, ApiResponse } from '@/types/api'

// --- 1. 团队管理 ---

/**
 * 为用户分配组长
 * @param userId - 目标用户（组员）的ID
 * @param leaderId - 组长的ID
 */
export const assignLeader = (userId: number, leaderId: number): Promise<UserWithLeader> => {
    return request.put(`/hr/users/${userId}/assign-leader`, { leader_id: leaderId })
}

/**
 * 将用户提升为组长
 * @param userId - 目标用户的ID
 */
export const promoteToLeader = (userId: number): Promise<UserWithLeader> => {
    return request.put(`/hr/users/${userId}/promote-to-leader`)
}


// --- 2. 记录查询 ---

/**
 * 查询补卡记录
 * @param params - 过滤参数 { user_id?: number, year?: number, month?: number }
 */
export const getClockInRecords = (params: { userId?: number; year?: number; month?: number }): Promise<ClockInRecord[]> => {
    return request.get('/hr/clock-in-records', { params })
}

/**
 * 查询任务进度更新记录
 * @param params - 过滤参数 { recorder_id?: number, period?: 'day' | 'week' | 'month' }
 */
export const getTaskProgressUpdates = (params: { recorderId?: number; period?: 'day' | 'week' | 'month' }): Promise<ProgressUpdateRecord[]> => {
    // 后端使用 recorder_id, 前端习惯用 recorderId, 在这里做转换
    const backendParams = {
        recorder_id: params.recorderId,
        period: params.period
    }
    return request.get('/hr/task-progress-updates', { params: backendParams })
}

/**
 * 获取包含团队关系的所有用户列表
 */
export const getTeamOverview = (): Promise<UserWithLeader[]> => {
    return request.get('/hr/team-overview')
}