import request from './request'
import type { User, ApiResponse, Permission, Role, UserInfo } from '@/types/api'

// 定义后端返回的数据结构
interface AllUsersResponse {
    users: User[];
}

// 获取所有用户 (不再需要分页参数)
export const getAllUsers = (): Promise<AllUsersResponse> => {
    return request.get('/admin/users')
}

// 获取特定用户信息
export const getUserById = (userId: number): Promise<UserInfo> => {
    return request.get(`/admin/users/${userId}`)
}

// 更新用户角色
export const updateUserRole = (userId: number, role: string): Promise<ApiResponse<any>> => {
    return request.put(`/admin/users/${userId}/role`, { role })
}

// 获取所有可用权限
export const getAllPermissions = (): Promise<Permission[]> => {
    return request.get('/admin/permissions')
}

// 获取所有角色
export const getRoles = (): Promise<Role[]> => {
    return request.get('/admin/roles')
}

// 获取指定角色的权限
export const getRolePermissions = (roleName: string): Promise<{ name: string, allowed: boolean }[]> => {
    return request.get(`/admin/roles/${roleName}/permissions`);
}

// 更新角色的权限
export const updateRolePermissions = (roleName: string, permissions: { name: string }[]): Promise<ApiResponse<any>> => {
    return request.put(`/admin/roles/${roleName}/permissions`, permissions)
}

// 为用户添加/移除单个特定权限
export const updateUserPermission = (userId: number, permission: { permission_name: string, is_allowed: boolean }): Promise<ApiResponse<any>> => {
    return request.post(`/admin/users/${userId}/permissions`, permission)
}
