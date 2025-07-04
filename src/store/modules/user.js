import {
    login,
    logout,
    getStatus
} from '@/api/auth';

const state = {
    user: null, // 存储用户信息对象
    isLoggedIn: false, // 标记登录状态
};

const mutations = {
    SET_USER: (state, user) => {
        state.user = user;
    },
    SET_LOGGED_IN: (state, status) => {
        state.isLoggedIn = status;
    },
    CLEAR_USER_DATA: (state) => {
        state.user = null;
        state.isLoggedIn = false;
    }
};

const actions = {
    // 用户登录 Action
    async login({
        commit
    }, userInfo) {
        const {
            username,
            password
        } = userInfo;
        // 调用登录API
        const response = await login({
            username: username.trim(),
            password: password
        });
        // 登录成功，提交mutation更新state
        commit('SET_USER', response.user);
        commit('SET_LOGGED_IN', true);
        return response; // 返回响应给组件，以便组件进行后续操作（如跳转）
    },

    // 获取登录状态 Action
    async getStatus({
        commit
    }) {
        try {
            const response = await getStatus();
            if (response.logged_in) {
                commit('SET_USER', response.user);
                commit('SET_LOGGED_IN', true);
            } else {
                commit('CLEAR_USER_DATA');
            }
            return response.logged_in;
        } catch (error) {
            commit('CLEAR_USER_DATA');
            return false;
        }
    },

    // 用户登出 Action
    async logout({
        commit
    }) {
        try {
            await logout();
        } finally {
            // 无论API调用成功与否，前端都清除用户数据
            commit('CLEAR_USER_DATA');
        }
    }
};

const getters = {
    isLoggedIn: state => state.isLoggedIn,
    currentUser: state => state.user,
    userRole: state => state.user ? state.user.role : ''
};


export default {
    namespaced: true, // 开启命名空间
    state,
    mutations,
    actions,
    getters
};
