// src/permission.js
import router from './router'
import store from './store'
import {
    message
} from 'ant-design-vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {
    getToken
} from '@/utils/auth'

NProgress.configure({
    showSpinner: false
});

const whiteList = ['/login']; // 免登录白名单

// 全局的路由添加状态标志
let hasAddedRoutes = false;

router.beforeEach(async (to, from, next) => {
    NProgress.start();

    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} - PSM System` : 'PSM System';

    const hasToken = getToken();

    if (hasToken) {
        if (to.path === '/login') {
            // 如果已登录，重定向到主页
            next({
                path: '/'
            });
            NProgress.done();
        } else {
            // 检查用户是否已获取其角色信息
            const hasRoles = store.getters['user/roles'] && store.getters['user/roles'].length > 0;
            if (hasRoles) {
                // 如果已有角色信息，并且路由已添加，则直接放行
                if (hasAddedRoutes) {
                    next();
                } else {
                    // 这种情况可能在手动刷新页面后发生，此时需要重新生成并添加路由
                    try {
                        const accessRoutes = await store.dispatch('permission/generateRoutes', {
                            roles: store.getters['user/roles'],
                            permissions: store.getters['user/permissions']
                        });

                        accessRoutes.forEach(route => {
                            router.addRoute(route);
                        });
                        hasAddedRoutes = true;
                        next({
                            ...to,
                            replace: true
                        });
                    } catch (error) {
                        // ...错误处理...
                    }
                }
            } else {
                try {
                    // 首次进入或刷新页面，获取用户信息
                    const {
                        roles,
                        permissions
                    } = await store.dispatch('user/getInfo');

                    // 根据角色和权限生成可访问的路由
                    const accessRoutes = await store.dispatch('permission/generateRoutes', {
                        roles,
                        permissions
                    });

                    // 动态添加可访问的路由
                    accessRoutes.forEach(route => {
                        router.addRoute(route);
                    });

                    // 标记路由已添加
                    hasAddedRoutes = true;

                    // 使用 replace: true 来确保导航不会留下历史记录
                    // 这样当用户点击后退时，不会返回到触发路由生成之前的状态
                    next({
                        ...to,
                        replace: true
                    });

                } catch (error) {
                    // 如果获取用户信息失败，重置Token并跳转到登录页
                    await store.dispatch('user/logout');
                    message.error(error.message || '验证失败，请重新登录。');
                    next(`/login?redirect=${to.path}`);
                    NProgress.done();
                }
            }
        }
    } else {
        // 没有Token
        hasAddedRoutes = false; // 重置路由添加状态
        if (whiteList.indexOf(to.path) !== -1) {
            // 在免登录白名单中，直接放行
            next();
        } else {
            // 其他没有访问权限的页面将重定向到登录页面
            next(`/login?redirect=${to.path}`);
            NProgress.done();
        }
    }
});

router.afterEach(() => {
    NProgress.done();
});