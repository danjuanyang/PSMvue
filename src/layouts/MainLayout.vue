<template>
  <n-layout position="absolute">
    <n-layout-header
      bordered
      style="height: 64px; padding: 0 24px"
      class="flex items-center"
    >
      <h1 class="text-xl font-bold text-gray-800">PSM - Vue</h1>
      <div class="flex-grow" />
      <n-space align="center">
        <n-tag :bordered="false" type="success">{{ userStore.userInfo?.username }}</n-tag>
        <n-button type="error" ghost @click="logout">退出登录</n-button>
      </n-space>
    </n-layout-header>

    <n-layout has-sider position="absolute" style="top: 64px">
      <n-layout-sider
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :native-scrollbar="false"
      >
        <n-menu
          :options="menuOptions"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :default-value="activeMenu"
        />
      </n-layout-sider>

      <n-layout-content
        content-style="padding: 24px; background-color: #f0f2f5;"
        :native-scrollbar="false"
      >
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { h, computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import type { MenuOption } from "naive-ui";
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NButton,
  NSpace,
  NTag,
} from "naive-ui";
import { useUserStore } from "../stores/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const activeMenu = computed(() => route.name as string);

const menuOptions = computed<MenuOption[]>(() => {
  const userRole = userStore.userRole;
  const isAdminOrSuper = userRole === "ADMIN" || userRole === "SUPER";

  const baseItems: MenuOption[] = [
    {
      label: () =>
        h(RouterLink, { to: { name: "dashboard" } }, { default: () => "仪表盘" }),
      key: "dashboard",
    },
    // --- 新增项目管理菜单 ---
    {
      label: () =>
        h(
          RouterLink,
          { to: { name: "project-management" } },
          { default: () => "项目管理" }
        ),
      key: "project-management",
    },
    // ------------------------
  ];

  const adminItems: MenuOption[] = [
    {
      label: "系统管理",
      key: "system-management",
      children: [
        {
          label: () =>
            h(
              RouterLink,
              { to: { name: "user-management" } },
              { default: () => "用户管理" }
            ),
          key: "user-management",
        },
        {
          label: () =>
            h(
              RouterLink,
              { to: { name: "role-management" } },
              { default: () => "角色管理" }
            ),
          key: "role-management",
        },
      ],
    },
  ];

  if (isAdminOrSuper) {
    return [...baseItems, ...adminItems];
  }

  return baseItems;
});

const logout = () => {
  userStore.logout();
  router.push("/auth/login");
};
</script>
