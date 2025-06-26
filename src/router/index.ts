import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          redirect: { name: 'dashboard' }
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/index.vue')
        },
        {
          path: 'admin/user-management',
          name: 'user-management',
          component: () => import('@/views/admin/UserManagement.vue')
        },
        {
          path: 'admin/role-management',
          name: 'role-management',
          component: () => import('@/views/admin/RoleManagement.vue')
        }
      ],
      meta: { requiresAuth: true }
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/auth/Login.vue')
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/auth/Register.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/errors/NotFound.vue')
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth) {
    //如果用户未登录，请重定向到登录
    if (!userStore.isLoggedIn) {
      return next({ name: 'login' });
    }

    //如果用户已登录但没有用户信息，请获取它
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        //如果获取失败（例如，令牌过期），请重定向到登录
        return next({ name: 'login' });
      }
    }
    //有了用户信息，继续
    next();
  } else {
    //对于公共路线，请继续
    next();
  }
});

export default router
