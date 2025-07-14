// 从新的、中立的路由定义文件导入路由定义
import {
    asyncRoutes,
    constantRoutes
} from '@/router/routes'

/**
 * 检查用户是否拥有访问某个路由的权限
 * @param {Array} permissions - 用户的权限列表, e.g., [{name: 'view_reports'}, ...]
 * @param {Object} route - 需要检查的路由对象
 * @returns {boolean}
 */
function hasPermission(permissions, route) {
    if (route.meta && route.meta.permissions) {
        return permissions.some(p => route.meta.permissions.includes(p.name))
    } else {
        return true
    }
}

/**
 * 通过递归过滤异步路由表
 * @param {Array} routes - asyncRoutes
 * @param {Array} permissions - 用户的权限列表
 * @returns {Array} - 过滤后的可访问路由
 */
export function filterAsyncRoutes(routes, permissions) {
    const res = []

    routes.forEach(route => {
        const tmp = {
            ...route
        }
        if (hasPermission(permissions, tmp)) {
            if (tmp.children) {
                tmp.children = filterAsyncRoutes(tmp.children, permissions)
                if (tmp.children.length > 0) {
                    res.push(tmp)
                }
            } else {
                res.push(tmp)
            }
        }
    })

    return res
}

const state = {
    routes: [],
    addRoutes: []
}

const mutations = {
    SET_ROUTES: (state, routes) => {
        state.addRoutes = routes
        state.routes = constantRoutes.concat(routes)
    }
}

const actions = {
    generateRoutes({
        commit
    }, {
        roles,
        permissions
    }) {
        return new Promise(resolve => {
            let accessedRoutes
            if (roles.includes('SUPER')) {
                accessedRoutes = asyncRoutes || []
            } else {
                accessedRoutes = filterAsyncRoutes(asyncRoutes, permissions)
            }
            commit('SET_ROUTES', accessedRoutes)
            resolve(accessedRoutes)
        })
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}
