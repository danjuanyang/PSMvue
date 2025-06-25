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
    // If user is not logged in, redirect to login
    if (!userStore.isLoggedIn) {
      return next({ name: 'login' });
    }

    // If user is logged in but has no user info, fetch it
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        // If fetching fails (e.g., token expired), redirect to login
        return next({ name: 'login' });
      }
    }
    // Now that we have user info, proceed
    next();
  } else {
    // For public routes, just proceed
    next();
  }
});

export default router
