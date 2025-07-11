import {
    login,
    logout,
    getStatus,
    getMyPermissions
} from '@/api/auth';

const state = {
    user: null,
    isLoggedIn: false,
    permissions: [], // 新增：用于存储权限列表
};

const mutations = {
    SET_USER: (state, user) => {
        state.user = user;
    },
    SET_LOGGED_IN: (state, status) => {
        state.isLoggedIn = status;
    },
    SET_PERMISSIONS: (state, permissions) => {
        state.permissions = permissions;
    },
    CLEAR_USER_DATA: (state) => {
        state.user = null;
        state.isLoggedIn = false;
        state.permissions = []; // 登出时清空权限
    }
};

const actions = {
    // 用户登录 Action
    async login({
        commit,
        dispatch
    }, userInfo) {
        const response = await login(userInfo);
        commit('SET_USER', response.user);
        commit('SET_LOGGED_IN', true);
        // 登录成功后，立即获取权限
        await dispatch('getPermissions');
        return response;
    },

    // 获取登录状态 Action
    async getStatus({
        commit,
        dispatch
    }) {
        try {
            const response = await getStatus();
            if (response.logged_in) {
                commit('SET_USER', response.user);
                commit('SET_LOGGED_IN', true);
                // 如果已登录，同样获取权限
                await dispatch('getPermissions');
            } else {
                commit('CLEAR_USER_DATA');
            }
            return response.logged_in;
        } catch (error) {
            commit('CLEAR_USER_DATA');
            return false;
        }
    },

    // 新增：获取权限的 Action
    async getPermissions({
        commit
    }) {
        try {
            const permissions = await getMyPermissions();
            commit('SET_PERMISSIONS', permissions);
        } catch (error) {
            console.error("获取用户权限失败", error);
            commit('SET_PERMISSIONS', []); // 失败则设置为空数组
        }
    },

    // 用户登出 Action
    async logout({
        commit
    }) {
        try {
            await logout();
        } finally {
            commit('CLEAR_USER_DATA');
        }
    }
};

const getters = {
    isLoggedIn: state => state.isLoggedIn,
    currentUser: state => state.user,
    userRole: state => state.user ? state.user.role : '',
    // 新增：权限检查 Getter
    hasPermission: (state) => (permissionName) => {
        // SUPER 用户永远返回 true
        if (state.user && state.user.role === 'SUPER') {
            return true;
        }
        return state.permissions.includes(permissionName);
    }
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
