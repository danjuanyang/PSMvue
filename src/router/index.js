import {
    createRouter,
    createWebHistory
} from 'vue-router';
import store from '../store';
import {
    message
} from 'ant-design-vue';

const routes = [{
        path: '/login',
        name: 'Login',
        component: () => import('../views/login/LoginView.vue')
    },
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/admin/permissions',
        name: 'PermissionManagement',
        component: () => import('../views/admin/PermissionManagement.vue'),
        meta: {
            requiresAuth: true
        },
        beforeEnter: (to, from, next) => {
            const userRole = store.getters['user/userRole'];
            if (userRole === 'SUPER' || userRole === 'ADMIN') {
                next();
            } else {
                message.error('您没有权限访问此页面');
                next({
                    name: 'Dashboard'
                });
            }
        }
    },
    {
        path: '/projects',
        name: 'ProjectList',
        component: () => import('../views/project/ProjectList.vue'),
        meta: {
            requiresAuth: true
        }
    },
    // --- 新增项目详情动态路由 ---
    {
        path: '/projects/:id',
        name: 'ProjectDetail',
        component: () => import('../views/project/ProjectDetail.vue'),
        meta: {
            requiresAuth: true
        }
    },
    // --- 新增公告路由 ---
    {
        path: '/announcements',
        name: 'Announcement',
        component: () => import('../views/announcement/AnnouncementView.vue'),
        meta: {
            requiresAuth: true
        }
    },
    
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

// 全局路由守卫保持不变
router.beforeEach(async (to, from, next) => {
    if (to.meta.requiresAuth) {
        let isLoggedIn = store.getters['user/isLoggedIn'];
        if (!isLoggedIn) {
            isLoggedIn = await store.dispatch('user/getStatus');
        }
        if (isLoggedIn) {
            next();
        } else {
            message.warn('请先登录！');
            next({
                path: '/login',
                query: {
                    redirect: to.fullPath
                }
            });
        }
    } else {
        next();
    }
});

export default router;