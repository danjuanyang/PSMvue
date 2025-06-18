// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { useUserStore } from '@/stores/user';
import { useMessage } from 'naive-ui' // 引入 message

const routes: Array<RouteRecordRaw> = [
  {
    path: '/auth',
    component: AuthLayout,
    redirect: '/auth/login',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { title: '登录' }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { title: '注册' }
      }
    ]
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true }, // 这个布局下的所有页面都需要认证
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'admin',
        name: 'Admin',
        redirect: '/admin/users',
        meta: { title: '系统管理' },
        children: [
          {
            path: 'users',
            name: 'UserManagement',
            component: () => import('@/views/admin/UserManagement.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'roles',
            name: 'RoleManagement',
            component: () => import('@/views/admin/RoleManagement.vue'),
            meta: { title: '角色管理' }
          },
          {
            path: 'logs',
            name: 'LogViewer',
            component: () => import('@/views/admin/LogViewer.vue'),
            meta: { title: '日志查看' }
          }
        ]
      },
      {
        path: 'project',
        name: 'Project',
        redirect: '/project/list',
        meta: { title: '项目管理' },
        children: [
          {
            path: 'list',
            name: 'ProjectList',
            component: () => import('@/views/project/ProjectList.vue'),
            meta: { title: '项目列表' }
          },
          {
            path: 'detail/:id', // 使用动态路由参数
            name: 'ProjectDetail',
            component: () => import('@/views/project/ProjectDetail.vue'),
            meta: { title: '项目详情' }
          }
        ]
      },
      // ... 可以在这里继续添加其他模块，如 HR, Announcement, AI 等
    ]
  },
  // 捕获所有未匹配的路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/errors/NotFound.vue'),
  },
];



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});


// 全局前置导航守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const token = localStorage.getItem('token');

  if (token) {
    // ---- 如果用户已登录 (有token) ----
    if (to.path.startsWith('/auth')) {
      // 如果他们试图访问登录/注册页，直接重定向到仪表盘
      next({ path: '/dashboard' });
    } else {
      // 访问其他受保护页面
      if (!userStore.userInfo) {
        try {
          await userStore.fetchUserInfo();
          next();
        } catch (error) {
          await userStore.logout();
          // 这里可以获取 Naive UI message 的实例来提示
          // 注意：在JS模块顶级作用域使用 useMessage 会报错，
          // 实际项目中应在组件内使用或通过其他方式注入
          console.error('会话已过期，请重新登录。');
          next({ path: '/auth/login', query: { redirect: to.fullPath } });
        }
      } else {
        next();
      }
    }
  } else {
    // ---- 如果用户未登录 (没有token) ----
    if (to.meta.requiresAuth) {
      // 如果页面需要认证，重定向到登录页
      next({
        path: '/auth/login',
        query: { redirect: to.fullPath },
      });
    } else {
      // 如果页面不需要认证，直接放行
      next();
    }
  }
});

export default router;