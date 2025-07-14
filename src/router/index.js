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

/**
 * 重置路由的方法。
 * 当用户登出时，调用此方法来重置路由，清除动态添加的权限路由。
 */
export function resetRouter() {
    const newRouter = createRouterInstance()
    router.matcher = newRouter.matcher
}

export default router
