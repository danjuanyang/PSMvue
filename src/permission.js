import router from './router'
import store from './store'
// 使用 Ant Design Vue 的 message 组件进行提示
import {
    message
} from 'ant-design-vue'
// NProgress 用于页面加载进度条
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 假设您有一个从 cookie 或 localStorage 获取 token 的工具函数
// 如果没有，请确保 store.state.user.token 能正确初始化
import {
    getToken
} from '@/utils/auth'

NProgress.configure({
    showSpinner: false
}) // NProgress 配置

const whiteList = ['/login'] // 免登录白名单


router.beforeEach(async (to, from, next) => {
    NProgress.start()
    document.title = to.meta.title || 'PSM System'

    const hasToken = store.getters.token || getToken()

    if (hasToken) {
        if (to.path === '/login') {
            next({
                path: '/'
            })
            NProgress.done()
            return
        }

        const hasUserInfo = store.getters.user && store.getters.user.id

        if (hasUserInfo) {
            next()
        } else {
            try {
                const {
                    roles,
                    permissions
                } = await store.dispatch('user/getInfo')
                const accessRoutes = await store.dispatch('permission/generateRoutes', {
                    roles,
                    permissions
                })

                accessRoutes.forEach(route => {
                    router.addRoute(route)
                })

                if (to.path === '/') {
                    next('/dashboard')
                } else {
                    next(to.path)
                }
            } catch (error) {
                await store.dispatch('user/logout')
                message.error(error.message || '验证失败，请重新登录。')
                // ✅ 修复：重定向到登录页而不是原路径
                next(`/login?redirect=${to.path}`)
                NProgress.done()
            }
        }
    } else {
        if (whiteList.indexOf(to.path) !== -1) {
            next()
        } else {
            // ✅ 关键修复：重定向到登录页面
            next(`/login?redirect=${to.path}`)
            NProgress.done()
        }
    }
})




router.afterEach(() => {
    // 结束进度条
    NProgress.done()
})