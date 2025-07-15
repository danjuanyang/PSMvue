import {
    login as loginApi,
    logout as logoutApi,
    getInfo as getInfoApi
} from '@/api/auth'
import {
    getToken,
    removeToken,
    setToken
} from '@/utils/auth'
// 为了打破模块循环依赖，已从此文件顶部移除对 router 的任何导入

const state = {
    token: getToken(),
    user: null,
    roles: [],
    permissions: []
}

const mutations = {
    SET_TOKEN: (state, token) => {
        state.token = token
    },
    SET_USER: (state, user) => {
        state.user = user
    },
    SET_ROLES: (state, roles) => {
        state.roles = roles
    },
    SET_PERMISSIONS: (state, permissions) => {
        state.permissions = permissions
    }
}

const actions = {
    // 用户登录
    // 用户登录
    login({
        commit
    }, userInfo) {
        const {
            username,
            password
        } = userInfo
        return new Promise((resolve, reject) => {
            loginApi({
                username: username.trim(),
                password: password
            }).then(response => {
                // 后端返回：{ message: "登录成功", user: {...} }
                if (response.user) {
                    // 存储用户信息
                    commit('SET_USER', response.user)

                    // 为会话认证设置一个虚拟token标识已登录状态
                    const sessionToken = 'session_authenticated'
                    commit('SET_TOKEN', sessionToken)
                    setToken(sessionToken) // 存储到localStorage
                }
                resolve(response)
            }).catch(error => {
                reject(error)
            })
        })


    },


    // 获取用户信息
    getInfo({
        commit
    }) {
        return new Promise((resolve, reject) => {
            getInfoApi().then(response => {
                const {
                    data
                } = response
                if (!data) {
                    reject('验证失败，请重新登录。')
                }
                const {
                    user,
                    roles,
                    permissions
                } = data
                if (!roles || roles.length <= 0) {
                    reject('getInfo：角色必须是非空数组！')
                }
                commit('SET_USER', user)
                commit('SET_ROLES', roles)
                commit('SET_PERMISSIONS', permissions || [])
                resolve(data)
            }).catch(error => {
                reject(error)
            })
        })
    },

    // 用户登出 (最终修复: 只负责清理状态)
    logout({
        commit
    }) {
        return new Promise((resolve, reject) => {
            logoutApi().then(() => {
                commit('SET_TOKEN', '')
                commit('SET_ROLES', [])
                commit('SET_PERMISSIONS', [])
                commit('SET_USER', null)
                removeToken()

                // ✅ 清理路由相关状态
                if (typeof window !== 'undefined') {
                    window.isRoutesAdded = false
                    // 清理已添加路由记录
                    window.addedRouteNames = new Set()
                }

                resolve()
            }).catch(error => {
                // 即使登出失败也要清理状态
                commit('SET_TOKEN', '')
                commit('SET_ROLES', [])
                commit('SET_PERMISSIONS', [])
                commit('SET_USER', null)
                removeToken()

                if (typeof window !== 'undefined') {
                    window.isRoutesAdded = false
                    window.addedRouteNames = new Set()
                }

                reject(error)
            })
        })
    },



    // ✅ 新增：重置token而不调用API
    resetToken({
        commit
    }) {
        return new Promise(resolve => {
            commit('SET_TOKEN', '')
            commit('SET_ROLES', [])
            commit('SET_PERMISSIONS', [])
            commit('SET_USER', null)
            removeToken()

            if (typeof window !== 'undefined') {
                window.isRoutesAdded = false
                window.addedRouteNames = new Set()
            }

            resolve()
        })
    }
}


const getters = {
    token: state => state.token,
    user: state => state.user,
    roles: state => state.roles,
    permissions: state => state.permissions,
    isLoggedIn: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    userRole: state => state.user?.role || 'MEMBER',
    // ✅ 修复权限检查逻辑
    hasPermission: state => (permission) => {
        return state.permissions.some(p => p.name === permission)
    }
}



export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters

}