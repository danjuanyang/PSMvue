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

        component: () => import( /* webpackChunkName: "login" */ '../views/login/LoginView.vue')
    },
    {
        path: '/',
        name: 'Dashboard',

        component: () => import( /* webpackChunkName: "dashboard" */ '../views/dashboard/DashboardView.vue'),
        meta: {
            requiresAuth: true
        }
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

// The router guard remains the same
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