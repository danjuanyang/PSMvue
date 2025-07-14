import Cookies from 'js-cookie'

const TokenKey = 'Psm-Admin-Token'

/**
 * 从 Cookie 中获取 Token
 * @returns {string | undefined}
 */
export function getToken() {
    return Cookies.get(TokenKey)
}

/**
 * 将 Token 保存到 Cookie
 * @param {string} token - 用户认证 Token
 * @returns {string | undefined}
 */
export function setToken(token) {
    return Cookies.set(TokenKey, token)
}

/**
 * 从 Cookie 中移除 Token
 */
export function removeToken() {
    return Cookies.remove(TokenKey)
}
