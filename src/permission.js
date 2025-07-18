// src/permission.js
import router from './router'
import store from './store'
import { message } from 'ant-design-vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'

NProgress.configure({ showSpinner: false });

const whiteList = ['/login']; // 免登录白名单

// 全局标志，用于跟踪动态路由是否已添加
// This is crucial to prevent infinite loops and handle page refreshes.
let hasAddedRoutes = false;

router.beforeEach(async (to, from, next) => {
    NProgress.start();

    document.title = to.meta.title ? `${to.meta.title} - PSM System` : 'PSM System';

    const hasToken = getToken();

    if (hasToken) {
        if (to.path === '/login') {
            // 如果已登录，直接重定向到主页
            next({ path: '/' });
            NProgress.done();
        } else {
            // 检查路由是否已经添加
            if (hasAddedRoutes) {
                // 如果动态路由已添加，则直接放行
                next();
            } else {
                try {
                    // 动态路由未添加，这是首次加载或刷新页面
                    // 1. 获取用户信息 (包括角色和权限)
                    const { roles, permissions } = await store.dispatch('user/getInfo');

                    // 2. 根据角色和权限生成可访问的路由
                    const accessRoutes = await store.dispatch('permission/generateRoutes', { roles, permissions });

                    // 3. 动态添加这些路由
                    accessRoutes.forEach(route => {
                        router.addRoute(route);
                    });

                    // 4. 将标志位设置为 true
                    hasAddedRoutes = true;

                    // 5. 使用 `next({ ...to, replace: true })` 来重新发起导航
                    // 这会确保新的导航会匹配到刚刚添加的动态路由
                    // 这是解决动态路由“No match found”问题的关键
                    next({ ...to, replace: true });

                } catch (error) {
                    // 如果过程中出现任何错误（如 token 失效）
                    // 清理前端状态并重定向到登录页
                    await store.dispatch('user/logout');
                    message.error(error.message || '验证失败，请重新登录。');
                    next(`/login?redirect=${to.path}`);
                    NProgress.done();
                }
            }
        }
    } else {
        // 用户未登录 (没有 token)
        hasAddedRoutes = false; // 重置路由添加状态
        if (whiteList.indexOf(to.path) !== -1) {
            // 如果在免登录白名单中，直接放行
            next();
        } else {
            // 否则，全部重定向到登录页
            next(`/login?redirect=${to.path}`);
            NProgress.done();
        }
    }
});

// 在登出逻辑中，必须重置 hasAddedRoutes 标志
// 我们需要在 store/modules/user.js 的 logout action 中也确保这一点
// 这里我们可以在 logout action 之后，或者在跳转到 login 之前重置
store.subscribe((mutation) => {
    if (mutation.type === 'user/SET_TOKEN' && !mutation.payload) {
        hasAddedRoutes = false;
    }
});


router.afterEach(() => {
    NProgress.done();
});