//src/router/index.js
import {
    createRouter,
    createWebHistory
} from 'vue-router'
import {
    constantRoutes
} from './routes'

const createRouterInstance = () => createRouter({
    history: createWebHistory(),
    scrollBehavior: () => ({
        top: 0
    }),
    routes: constantRoutes
})

const router = createRouterInstance()

export function resetRouter() {
    const newRouter = createRouterInstance()
    router.matcher = newRouter.matcher

    // 清理动态添加的路由
    router.getRoutes().forEach(route => {
        const {
            name
        } = route
        if (name && !constantRoutes.find(r => r.name === name)) {
            router.removeRoute(name)
        }
    })
}

export function clearDynamicRoutes() {
    // 获取所有路由
    const routes = router.getRoutes()

    // 移除动态添加的路由（不在 constantRoutes 中的）
    routes.forEach(route => {
        if (route.name && !constantRoutes.find(r => r.name === route.name)) {
            router.removeRoute(route.name)
        }
    })
}

// 在 router 实例上添加清理方法
router.clearDynamicRoutes = clearDynamicRoutes


export default router
