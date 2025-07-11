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
            requiresAuth: true,
            permission: 'manage_roles'
        } // 使用权限元信息
    },
    {
        path: '/hr/progress-report',
        name: 'ProgressReport',
        component: () => import('../views/hr/ProgressReport.vue'),
        meta: {
            requiresAuth: true,
            permission: 'view_progress_reports'
        } // 使用权限元信息
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
    // --- 新增HR路由 ---
    {
        path: '/hr/clock-in',
        name: 'ClockInReport',
        component: () => import('../views/hr/ClockInReport.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/hr/progress-report',
        name: 'ProgressReport',
        component: () => import('../views/hr/ProgressReport.vue'),
        meta: {
            requiresAuth: true,
            roles: ['SUPER', 'ADMIN']
        } // 添加角色元信息
    }

];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

// 全局路由守卫保持不变
router.beforeEach(async (to, from, next) => {
    let isLoggedIn = store.getters['user/isLoggedIn'];
    if (!isLoggedIn && localStorage.getItem('isLoggedIn') === 'true') { // 简单的持久化检查
        await store.dispatch('user/getStatus');
        isLoggedIn = store.getters['user/isLoggedIn'];
    }

    if (to.meta.requiresAuth) {
        if (!isLoggedIn) {
            message.warn('请先登录！');
            return next({
                path: '/login',
                query: {
                    redirect: to.fullPath
                }
            });
        }
        // 检查页面级权限
        if (to.meta.permission && !store.getters['user/hasPermission'](to.meta.permission)) {
            message.error('您没有权限访问此页面');
            return next({
                name: 'Dashboard'
            });
        }
    }
    next();
});

export default router;