const AppLayout = () => import('@/layout/AppLayout.vue');

// 路由配置保持不变
/**
 * constantRoutes: 不需要权限的路由，所有用户都能访问
 */
export const constantRoutes = [{
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/LoginView.vue'),
        hidden: true // 不在菜单中显示
    },
    {
        path: '/',
        component: AppLayout,
        redirect: '/dashboard',
        children: [{
            path: 'dashboard',
            name: 'Dashboard',
            component: () => import('@/views/dashboard/DashboardView.vue'),
            meta: {
                title: '首页',
                icon: 'dashboard'
            }
        }]
    },
    {
        path: '/404',
        component: () => import('@/views/error-page/NotFoundPage.vue'),
        hidden: true
    }
];

/**
 * asyncRoutes: 需要根据用户权限动态加载的路由
 *
 * 核心设计原则：
 * 1. `meta.permissions` 数组定义了访问该路由所需的权限。
 * 2. 如果一个路由没有 `meta.permissions`，则默认所有人可见（只要其父路由可见）。
 * 3. 如果一个父路由本身不需要权限，但其下有需要权限的子路由，则不要给父路由设置 `permissions`，
 * 这样可以保证即使用户只有部分子路由的权限，父级菜单也能正常显示。
 */
export const asyncRoutes = [{
        path: '/project',
        component: AppLayout,
        redirect: '/project/list',
        name: 'Project',
        meta: {
            title: '项目管理',
            icon: 'project'
        }, // 项目管理本身对所有登录用户可见
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
    },
    {
        path: '/hr',
        component: AppLayout,
        // 重定向将由 permission.js 动态更新
        redirect: '/hr/progress-report',
        name: 'HR',
        meta: {
            title: '人力资源',
            icon: 'hr'
        },
        children: [{
                path: 'progress-report',
                name: 'ProgressReport',
                component: () => import('@/views/hr/ProgressReport.vue'),
                meta: {
                    title: '进度报告',
                    permissions: ['view_progress_reports']
                }
            },
            {
                path: 'clock-in-apply', 
                name: 'ClockInApply',
                component: () => import('@/views/hr/ClockInApply.vue'), // 指向填报组件
                meta: {
                    title: '补卡填报',}
            },
            {
                path: 'clock-in-stats', // 为“补卡统计”创建独立路径
                name: 'ClockInStats',
                component: () => import('@/views/hr/ClockInState.vue'),
                meta: {
                    title: '补卡统计',
                    // 使用你已有的权限
                    permissions: ['view_clock_in_reports']
                }
            }
        ]
    },
    {
        path: '/announcement',
        component: AppLayout,
        children: [{
            path: 'index',
            name: 'Announcement',
            component: () => import('@/views/announcement/AnnouncementView.vue'),
            meta: {
                title: '公告管理',
                icon: 'announcement',
                
            }
        }]
    },
    {
        path: '/admin',
        component: AppLayout,
        redirect: '/admin/permission-management',
        name: 'Admin',
        meta: {
            title: '系统管理',
            icon: 'admin',
            // 拥有以下任一权限即可看到此菜单
            permissions: ['manage_permissions', 'manage_roles', 'edit_user_role']
        },
        children: [{
            path: 'permission-management',
            name: 'PermissionManagement',
            component: () => import('@/views/admin/PermissionManagement.vue'),
            meta: {
                title: '权限管理'
            } // 子菜单继承父级权限
        }]
    },
    {
        path: '/files',
        component: AppLayout,
        children: [{
            path: 'index',
            name: 'FileManager',
            component: () => import('@/views/file/FileManagement.vue'),
            meta: {
                title: '文件管理',
                icon: 'file'
            }
        }]
    },
    // 404 页面必须放在路由最后
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
        name: 'NotFound',
        hidden: true
    }
];