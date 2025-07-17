<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider
      v-if="isLoggedIn && userLoaded"
      v-model:collapsed="collapsed"
      collapsible
    >
      <div class="logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <!-- 侧边栏菜单项... (保留您已有的 a-menu-item 和 a-sub-menu) -->
        <a-menu-item key="dashboard">
          <pie-chart-outlined />
          <span>Dashboard</span>
        </a-menu-item>
        <a-menu-item key="projects">
          <desktop-outlined />
          <span>我的项目</span>
        </a-menu-item>
        <a-menu-item key="announcements">
          <sound-outlined />
          <span>系统公告</span>
        </a-menu-item>
        <a-menu-item key="files">
          <folder-outlined />
          <span>文件管理</span>
        </a-menu-item>
        <a-sub-menu key="hr">
          <template #title
            ><span><solution-outlined /><span>人事/行政</span></span></template
          >
          <a-menu-item key="clock-in-stats" v-if="hasPermission('view_clock_in_reports')"
            >补卡统计</a-menu-item
          >
          <a-menu-item key="clock-in-apply" v-if="!isAdmin">补卡填报</a-menu-item>
          <a-menu-item key="progress-report" v-if="hasPermission('view_progress_reports')"
            >进度报告</a-menu-item
          >
        </a-sub-menu>
        <a-menu-item
          key="permissions"
          v-if="hasPermission('manage_roles') || hasPermission('manage_permissions')"
        >
          <setting-outlined />
          <span>权限管理</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header
        v-if="isLoggedIn"
        style="
          background: #fff;
          padding: 0 24px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        "
      >
        <!-- 改造开始：将原来的 a-space 替换为 a-dropdown -->
        <a-dropdown>
          <!-- 下拉菜单的触发区域 -->
          <a class="ant-dropdown-link" @click.prevent>
            <a-space>
              <a-avatar
                ><template #icon><UserOutlined /></template
              ></a-avatar>
              <span>{{ username }}</span>
            </a-space>
          </a>
          <!-- 下拉菜单的内容 -->
          <template #overlay>
            <a-menu @click="handleDropdownClick">
              <a-menu-item key="profile">
                <UserOutlined />
                <span style="margin-left: 8px">个人中心</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <a-space>
         
          <a-button type="link" @click="handleLogout">
            <template #icon><LogoutOutlined /></template>
            登出
          </a-button>
        </a-space>
      </a-layout-header>

      <a-layout-content style="margin: 0 16px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import {
  PieChartOutlined,
  DesktopOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SoundOutlined, // 确保已导入
  FolderOutlined, // 确保已导入
  SolutionOutlined, // 确保已导入
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const store = useStore();
const router = useRouter();
const route = useRoute();

const collapsed = ref(false);
const selectedKeys = ref(["dashboard"]);

const isLoggedIn = computed(() => store.getters["user/isLoggedIn"]);
const username = computed(() => store.getters["user/currentUser"]?.username || "用户");
const hasPermission = computed(() => store.getters["user/hasPermission"]);
const isAdmin = computed(() =>
  ["SUPER", "ADMIN"].includes(store.getters["user/userRole"])
);

// 监听路由变化，更新菜单选中状态 (保留您已有的逻辑)
watch(
  route,
  (newRoute) => {
    if (newRoute.name === "Dashboard") selectedKeys.value = ["dashboard"];
    else if (newRoute.path.startsWith("/project")) selectedKeys.value = ["projects"];
    else if (newRoute.path.startsWith("/announcement"))
      selectedKeys.value = ["announcements"];
    else if (newRoute.path.startsWith("/files")) selectedKeys.value = ["files"];
    else if (newRoute.path.startsWith("/admin")) selectedKeys.value = ["permissions"];
    // 路由 /profile/index 激活时，不改变侧边栏选中状态
    else if (newRoute.path.startsWith("/profile")) {
      // 保持当前选中项不变
    } else if (newRoute.path.startsWith("/hr/clock-in")) {
      selectedKeys.value = isAdmin.value ? ["clock-in-stats"] : ["clock-in-report"];
    } else if (newRoute.path.startsWith("/hr/progress"))
      selectedKeys.value = ["progress-report"];
  },
  { immediate: true }
);

// 侧边栏点击事件 (保留您已有的逻辑)
const handleMenuClick = (e) => {
  if (route.path === getTargetPath(e.key)) {
    return;
  }
  const targetPath = getTargetPath(e.key);
  if (targetPath) {
    router.push(targetPath).catch((err) => {
      if (err.name !== "NavigationDuplicated") {
        console.error("Navigation error:", err);
      }
    });
  }
};

// 路径映射 (保留您已有的逻辑)
const getTargetPath = (key) => {
  const pathMap = {
    dashboard: "/",
    projects: "/project/list",
    announcements: "/announcement/index",
    permissions: "/admin/permission-management",
    "clock-in-report": "/hr/clock-in-report",
    "clock-in-apply": "/hr/clock-in-apply",
    "clock-in-stats": "/hr/clock-in-stats",
    "progress-report": "/hr/progress-report",
    files: "/files/index",
  };
  return pathMap[key];
};

const userLoaded = computed(() => {
  return (
    store.getters["user/isLoggedIn"] &&
    store.getters["user/currentUser"] &&
    store.getters["user/permissions"].length >= 0
  );
});

// 登出逻辑 (保留您已有的逻辑)
const handleLogout = async () => {
  try {
    await store.dispatch("user/logout");
    message.success("您已成功登出");
    router.push("/login");
  } catch (error) {
    message.error("登出失败，请稍后重试");
  }
};

// 新增：处理下拉菜单点击事件
const handleDropdownClick = ({ key }) => {
  if (key === "profile") {
    router.push({ name: "Profile" });
  } else if (key === "logout") {
    handleLogout();
  }
};
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}
</style>
