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
})

const whiteList = ['/login']
let isRoutesAdded = false
let addedRouteNames = new Set()

router.beforeEach(async (to, from, next) => {
    NProgress.start()
    document.title = to.meta.title || 'PSM System'

    const hasToken = store.getters['user/token'] || getToken()

    if (hasToken) {
        if (to.path === '/login') {
            next({
                path: '/'
            })
            NProgress.done()
            return
        }

        const hasUserInfo = store.getters['user/user'] && store.getters['user/user'].id

        if (hasUserInfo && isRoutesAdded) {
            const routeExists = router.hasRoute(to.name) || to.matched.length > 0
            if (routeExists) {
                next()
            } else {
                next('/dashboard')
            }
        } else {
            try {
                const {
                    roles,
                    permissions
                } = await store.dispatch('user/getInfo')

                if (!isRoutesAdded) {
                    const accessRoutes = await store.dispatch('permission/generateRoutes', {
                        roles,
                        permissions
                    })

                    accessRoutes.forEach(route => {
                        if (!addedRouteNames.has(route.name)) {
                            router.addRoute(route)
                            addedRouteNames.add(route.name)

                            if (route.children) {
                                route.children.forEach(child => {
                                    if (child.name) addedRouteNames.add(child.name)
                                })
                            }
                        }
                    })
                    isRoutesAdded = true
                }

                if (to.path === '/') {
                    next('/dashboard')
                } else if (to.matched.length === 0) {
                    next({
                        path: to.path,
                        replace: true
                    })
                } else {
                    next()
                }
            } catch (error) {
                console.error('Permission error:', error)
                isRoutesAdded = false
                addedRouteNames.clear()

                // ✅ 修复：区分登录页面和其他页面的错误处理
                if (to.path === '/login' || from.path === '/login') {
                    // 在登录页面或从登录页面来的，不显示错误信息，不强制跳转
                    await store.dispatch('user/resetToken')
                    next()
                } else {
                    // 在其他页面，显示错误并跳转到登录页
                    await store.dispatch('user/logout')
                    message.error(error.message || '验证失败，请重新登录。')
                    next(`/login?redirect=${to.path}`)
                }
                NProgress.done()
            }
        }
    } else {
        isRoutesAdded = false
        addedRouteNames.clear()
        if (whiteList.indexOf(to.path) !== -1) {
            next()
        } else {
            next(`/login?redirect=${to.path}`)
            NProgress.done()
        }
    }
})

router.afterEach(() => {
    NProgress.done()
})