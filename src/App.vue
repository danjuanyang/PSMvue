<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-if="isLoggedIn" v-model:collapsed="collapsed" collapsible>
      <div class="logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="dashboard">
          <pie-chart-outlined />
          <span>Dashboard</span>
        </a-menu-item>
        <a-menu-item key="projects">
          <desktop-outlined />
          <span>我的项目</span>
        </a-menu-item>

        <!-- 新增公告菜单项 -->
        <a-menu-item key="announcements">
          <sound-outlined />
          <span>系统公告</span>
        </a-menu-item>

        <!-- 修改：所有角色都能看到HR菜单 -->

        <a-sub-menu key="hr">
          <template #title
            ><span><solution-outlined /><span>人事/行政</span></span></template
          >
          <!-- 使用权限判断 -->
          <a-menu-item
            key="clock-in-report"
            v-if="!hasPermission('view_clock_in_reports')"
            >补卡填报</a-menu-item
          >
          <a-menu-item key="clock-in-stats" v-if="hasPermission('view_clock_in_reports')"
            >补卡统计</a-menu-item
          >
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
        <a-space>
          <a-avatar
            ><template #icon><UserOutlined /></template
          ></a-avatar>
          <span>{{ username }}</span>
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
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const store = useStore();
const router = useRouter();
const route = useRoute();

const collapsed = ref(false);
const selectedKeys = ref(["dashboard"]);

const isLoggedIn = computed(() => store.getters["user/isLoggedIn"]);
const username = computed(() => store.getters["user/currentUser"]?.username || "用户");
// 添加权限判断
const hasPermission = computed(() => store.getters['user/hasPermission']);
const isAdmin = computed(() =>
  ["SUPER", "ADMIN"].includes(store.getters["user/userRole"])
);

// 监听路由变化，更新菜单选中状态
watch(
  route,
  (newRoute) => {
    if (newRoute.name === "Dashboard") selectedKeys.value = ["dashboard"];
    else if (newRoute.name === "ProjectList" || newRoute.name === "ProjectDetail")
      selectedKeys.value = ["projects"];
    else if (newRoute.name === "Announcement") selectedKeys.value = ["announcements"];
    else if (newRoute.name === "PermissionManagement")
      selectedKeys.value = ["permissions"];
    else if (newRoute.name === "ClockInReport") {
      selectedKeys.value = isAdmin.value ? ["clock-in-stats"] : ["clock-in-report"];
      if (newRoute.name === "ProgressReport") selectedKeys.value = ["progress-report"];
    }
  },
  { immediate: true }
);

const handleMenuClick = (e) => {
  if (e.key === "dashboard") router.push("/");
  else if (e.key === "projects") router.push("/projects");
  else if (e.key === "announcements") router.push("/announcements");
  else if (e.key === "permissions") router.push("/admin/permissions");
  else if (e.key === "clock-in-report" || e.key === "clock-in-stats") {
    router.push("/hr/clock-in");
  }
  if (e.key === "progress-report") router.push("/hr/progress-report");
};

const handleLogout = async () => {
  try {
    await store.dispatch("user/logout");
    message.success("您已成功登出");
    router.push("/login");
  } catch (error) {
    message.error("登出失败，请稍后重试");
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
