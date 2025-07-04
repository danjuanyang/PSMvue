import {
    createStore
} from 'vuex';
import user from './modules/user'; // 导入我们之前创建的用户模块

// 创建并导出一个新的 Vuex store 实例
export default createStore({
    // 将 user 模块注册到 store 中
    modules: {
        user
    }
});
