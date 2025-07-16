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

// 添加权限检查缓存
const permissionCache = new Map()

// function hasPermission(permissions, route) {
//     const cacheKey = `${route.path}_${permissions.map(p => p.name).join(',')}`

//     if (permissionCache.has(cacheKey)) {
//         return permissionCache.get(cacheKey)
//     }

//     let result = true
//     if (route.meta && route.meta.permissions) {
//         result = permissions.some(p => route.meta.permissions.includes(p.name))
//     }

//     permissionCache.set(cacheKey, result)
//     return result
// }

/**
 * 检查用户是否拥有访问某个路由的权限
 * @param {Array<string>} permissions - 用户的权限名称列表, e.g., ['view_reports', 'manage_announcements']
 * @param {Object} route - 需要检查的路由对象
 * @returns {boolean}
 */
function hasPermission(permissions, route) {
    if (route.meta && route.meta.permissions) {
        // 路由需要权限，检查用户是否拥有其中至少一个
        return permissions.some(p => route.meta.permissions.includes(p))
    } else {
        // 路由不需要特定权限，默认允许访问
        return true
    }
}


/**
 * [核心修改] 通过递归过滤异步路由表，并动态修正重定向
 * @param {Array} routes - 待过滤的路由数组 (asyncRoutes)
 * @param {Array<string>} permissions - 用户拥有的权限名称列表
 * @returns {Array} - 过滤后的可访问路由
 */
export function filterAsyncRoutes(routes, permissions) {
    const res = []

    routes.forEach(route => {
        const tmp = {
            ...route
        }

        if (tmp.children) {
            // 递归过滤子路由
            const accessibleChildren = filterAsyncRoutes(tmp.children, permissions)

            if (accessibleChildren.length > 0) {
                // 如果有子路由可以访问，则保留父路由
                tmp.children = accessibleChildren

                // [关键修复]
                // 如果父路由有 redirect 属性，则动态更新它，
                // 使其指向第一个用户有权访问的子路由。
                // 这可以防止因原重定向目标被过滤而导致的404错误。
                if (tmp.redirect) {
                    const firstChild = accessibleChildren.find(c => !c.hidden) || accessibleChildren[0];
                    // 拼接成完整的路径
                    tmp.redirect = `${tmp.path}/${firstChild.path}`.replace(/\/+/g, '/');
                }
                res.push(tmp)
            }
        } else if (hasPermission(permissions, tmp)) {
            // 如果是叶子节点路由（没有子路由），则直接判断权限
            res.push(tmp)
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
        permissions
    }) {
        return new Promise(resolve => {
            let accessedRoutes
            const permissionNames = permissions.map(p => p.name);

            // 所有角色都根据权限过滤路由
            accessedRoutes = filterAsyncRoutes(asyncRoutes, permissionNames)
            commit('SET_ROUTES', accessedRoutes)
            resolve(accessedRoutes)
        })
    },

    // ✅ 新增：清理权限缓存的 action
    clearPermissionCache({
        commit
    }) {
        permissionCache.clear()
        commit('SET_ROUTES', [])
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}