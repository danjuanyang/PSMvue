// src/router/index.ts
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
        // --- 项目管理主面板 ---
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/index.vue')
        },
        // ---人力资源---
        {
          path: 'hr',
          name: 'human-resources',
          component: () => import('@/views/hr/HumanResources.vue'),
          meta: { requiresAuth: true, requiredRoles: ['SUPER', 'ADMIN'] } // 权限控制
        },
        // --- 项目管理路由 ---
        {
          path: 'project-management',
          name: 'project-management',
          component: () => import('@/views/project/ProjectManagement.vue'),
          meta: { requiresAuth: true, requiredPermissions: ['manage_projects'] } // 可选：添加权限元数据
        },
        // --- 项目详情路由 ---
        {
          path: 'admin/user-management',
          name: 'user-management',
          component: () => import('@/views/admin/UserManagement.vue')
        },
        {
          path: 'project/:id',
          name: 'project-detail',
          component: () => import('@/views/project/ProjectDetail.vue'),
          meta: { requiresAuth: true }
        },
        // --- 角色管理路由 ---
        {
          path: 'admin/role-management',
          name: 'role-management',
          component: () => import('@/views/admin/RoleManagement.vue')
        },
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
    if (!userStore.isLoggedIn) {
      return next({ name: 'login' });
    }

    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        return next({ name: 'login' });
      }
    }
    next();
  } else {
    next();
  }
});

export default router