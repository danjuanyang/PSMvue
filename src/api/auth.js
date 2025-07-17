import request from '@/utils/request';

/**
 * 用户登录
 * @param {object} data { username, password }
 */
export function login(data) {
    return request({
        url: '/auth/login',
        method: 'post',
        data
    });
}

/**
 * 用户注册
 * @param {object} data { username, email, password }
 */
export function register(data) {
    return request({
        url: '/auth/register',
        method: 'post',
        data
    });
}

/**
 * 获取当前用户登录状态
 */
export function getStatus() {
    return request({
        url: '/auth/status',
        method: 'get'
    });
}

/**
 * 用户登出
 */
export function logout() {
    return request({
        url: '/auth/logout',
        method: 'post'
    });
}

export function getInfo() {
    return request({
        url: '/auth/status',
        method: 'get'
    });
}


/**
 * 修改密码
 * @param {object} data { old_password, new_password }
 */
export function changePassword(data) {
    return request({
        url: '/auth/change_password',
        method: 'post',
        data
    })
}

/**
 * 修改用户名
 * @param {object} data { new_username }
 */
export function changeUsername(data) {
    return request({
        url: '/auth/change_username',
        method: 'post',
        data
    })
}

/**
 * 修改邮箱
 * @param {object} data { new_email, password }
 */
export function changeEmail(data) {
    return request({
        url: '/auth/change_email',
        method: 'post',
        data
    })
}