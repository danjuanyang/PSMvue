// src/api/admin.ts
import request from './request';
import type { User, Role, Permission, UserDetails } from '@/types/api';

// --- 用户管理 APIs ---

/**
 * 获取用户列表 (分页)
 * @param params包含page和per_page
 */
export function getUsersApi(params: { page: number; per_page: number }) {
    return request<{ users: User[]; total_users: number }>({
        url: '/admin/users',
        method: 'get',
        params,
    });
}

/**
 * 获取单个用户的详细信息
 * @param userId 用户ID
 */
export function getUserDetailsApi(userId: number) {
    return request<UserDetails>({
        url: `/admin/users/${userId}`,
        method: 'get',
    });
}

/**
 * 更新用户角色
 * @param userId 用户ID
 * @param role 角色名称
 */
export function updateUserRoleApi(userId: number, role: string) {
    return request({
        url: `/admin/users/${userId}/role`,
        method: 'put',
        data: { role },
    });
}

/**
 * 修改用户的特定权限
 * @param userId 用户ID
 * @param permissionName 权限名称
 * @param isAllowed 是否允许
 */
export function modifyUserPermissionApi(userId: number, permissionName: string, isAllowed: boolean) {
    return request({
        url: `/admin/users/${userId}/permissions`,
        method: 'post',
        data: { permission_name: permissionName, is_allowed: isAllowed },
    });
}


// --- 权限管理 APIs ---

/**
 * 获取所有可用权限的列表
 */
export function getPermissionsApi() {
    return request<Permission[]>({
        url: '/admin/permissions',
        method: 'get',
    });
}


// --- 角色管理 APIs ---

/**
 * 获取所有角色的列表
 */
export function getRolesApi() {
    return request<Role[]>({
        url: '/admin/roles',
        method: 'get',
    });
}

/**
 * 获取指定角色的权限列表
 * @param roleName 角色名称
 */
export function getRolePermissionsApi(roleName: string) {
    return request<{ name: string; allowed: boolean }[]>({
        url: `/admin/roles/${roleName}/permissions`,
        method: 'get',
    });
}

/**
 * 更新指定角色的权限
 * @param roleName 角色名称
 * @param permissions 权限对象数组
 */
export function updateRolePermissionsApi(roleName: string, permissions: { name: string; allowed: boolean }[]) {
    return request({
        url: `/admin/roles/${roleName}/permissions`,
        method: 'put',
        data: permissions,
    });
}
