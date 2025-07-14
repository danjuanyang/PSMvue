const Layout = () => import('@/layout/AppLayout.vue');

// 路由配置保持不变
export const constantRoutes = [{
            path: '/login',
            name: 'Login',
            component: () => import('@/views/login/LoginView.vue'),
            hidden: true
        },
        {
            path: '/',
            component: Layout, // ✅ 使用重命名后的组件
            redirect: '/dashboard',
            children: [{
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/DashboardView.vue'),
                meta: {
                    title: '主页',
                    icon: 'dashboard'
                }
            }]
        },
    {
        path: '/project',
        component: Layout,
        redirect: '/project/list',
        name: 'Project',
        meta: {
            title: '项目管理',
            icon: 'project'
        },
        children: [{
                path: 'list',
                name: 'ProjectList',
                component: () => import('@/views/project/ProjectList.vue'),
                meta: {
                    title: '项目列表'
                }
            },
            {
                path: 'detail/:id',
                name: 'ProjectDetail',
                component: () => import('@/views/project/ProjectDetail.vue'),
                meta: {
                    title: '项目详情'
                },
                hidden: true
            }
        ]
    }
]

/**
 * asyncRoutes: 异步路由
 * 这些路由需要基于用户权限动态加载。
 */
export const asyncRoutes = [{
        path: '/hr',
        component: Layout,
        redirect: '/hr/progress-report',
        name: 'HR',
        meta: {
            title: '人力资源',
            icon: 'hr',
            permissions: ['view_reports']
        },
        children: [{
                path: 'progress-report',
                name: 'ProgressReport',
                component: () => import('@/views/hr/ProgressReport.vue'),
                meta: {
                    title: '进度报告'
                }
            },
            {
                path: 'clock-in-report',
                name: 'ClockInReport',
                component: () => import('@/views/hr/ClockInReport.vue'),
                meta: {
                    title: '打卡报告'
                }
            }
        ]
    },
    {
        path: '/announcement',
        component: Layout,
        redirect: '/announcement/index',
        children: [{
            path: 'index',
            name: 'Announcement',
            component: () => import('@/views/announcement/AnnouncementView.vue'),
            meta: {
                title: '公告管理',
                icon: 'announcement',
                permissions: ['manage_announcements']
            }
        }]
    },
    {
        path: '/admin',
        component: Layout,
        redirect: '/admin/permission-management',
        name: 'Admin',
        meta: {
            title: '系统管理',
            icon: 'admin',
            permissions: ['manage_permissions', 'manage_roles', 'edit_user_role']
        },
        children: [{
            path: 'permission-management',
            name: 'PermissionManagement',
            component: () => import('@/views/admin/PermissionManagement.vue'),
            meta: {
                title: '权限管理'
            }
        }]
    },
    // 404 页面必须放在路由最后
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
        hidden: true
    }
]