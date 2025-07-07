import request from '@/utils/request';

// --- 用户管理 APIs ---

/**
 * 获取所有用户列表
 */
export function getUsers() {
    return request({
        url: '/admin/users',
        method: 'get',
    });
}

/**
 * 更新指定用户的角色
 * @param {number} userId 用户ID
 * @param {string} role 新角色名 (e.g., 'ADMIN', 'LEADER')
 */
export function updateUserRole(userId, role) {
    return request({
        url: `/admin/users/${userId}/role`,
        method: 'put',
        data: {
            role
        }
    });
}

/**
 * 重置指定用户的密码
 * @param {number} userId 用户ID
 */
export function resetUserPassword(userId) {
    return request({
        url: `/admin/users/${userId}/reset-password`,
        method: 'post'
    });
}

// --- 权限管理 APIs ---

/**
 * 获取所有可用权限的列表
 */
export function getAllPermissions() {
    return request({
        url: '/admin/permissions',
        method: 'get'
    });
}

/**
 * 为用户设置特定权限
 * @param {number} userId 用户ID
 * @param {string} permissionName 权限名称
 * @param {boolean} isAllowed 是否允许
 */
export function modifyUserPermission(userId, permissionName, isAllowed) {
    return request({
        url: `/admin/users/${userId}/permissions`,
        method: 'post',
        data: {
            permission_name: permissionName,
            is_allowed: isAllowed
        }
    });
}

/**
 * 获取单个用户的详细信息（包含权限）
 * @param {number} userId 用户ID
 */
export function getUserDetails(userId) {
    return request({
        url: `/admin/users/${userId}`,
        method: 'get'
    });
}


// --- 角色管理 APIs ---

/**
 * 获取所有角色的列表
 */
export function getRoles() {
    return request({
        url: '/admin/roles',
        method: 'get'
    });
}

/**
 * 获取指定角色的权限
 * @param {string} roleName 角色名
 */
export function getRolePermissions(roleName) {
    return request({
        url: `/admin/roles/${roleName}/permissions`,
        method: 'get'
    });
}

/**
 * 更新指定角色的权限
 * @param {string} roleName 角色名
 * @param {Array} permissions 权限对象数组 (e.g., [{ name: 'view_users', allowed: true }])
 */
export function updateRolePermissions(roleName, permissions) {
    return request({
        url: `/admin/roles/${roleName}/permissions`,
        method: 'put',
        data: permissions
    });
}

// --- 新增：团队管理 APIs ---

/**
 * 获取团队概览数据 (所有用户及其领导)
 */
export function getTeamOverview() {
    return request({
        url: '/hr/team-overview',
        method: 'get'
    });
}

/**
 * 为组员分配组长
 * @param {number} memberId 组员ID
 * @param {number | null} leaderId 组长ID, 传 null 表示移除组长
 */
export function assignLeader(memberId, leaderId) {
    return request({
        url: `/hr/users/${memberId}/assign-leader`,
        method: 'put',
        data: {
            leader_id: leaderId
        }
    });
}