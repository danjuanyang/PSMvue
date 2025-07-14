
import Vuex from 'vuex'
import user from './modules/user'
import permission from './modules/permission'

// **重要**: Vue.use(Vuex) 已经移动到 src/main.js 文件中
// Vue.use(Vuex) // <- 从这里移除

const store = new Vuex.Store({
    modules: {
        user,
        permission
    },
    getters: {
        token: state => state.user.token,
        user: state => state.user.user,
        roles: state => state.user.roles,
        permissions: state => state.user.permissions,
        permission_routes: state => state.permission.routes
    }
})

export default store
