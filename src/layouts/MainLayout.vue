<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NButton,
  useMessage,
} from "naive-ui";
import type { MenuOption } from "naive-ui";
// 导入 Pinia store 来执行登出操作
// import { useUserStore } from '@/stores/user';

const router = useRouter();
const message = useMessage();
// const userStore = useUserStore();

const collapsed = ref(false);

// 模拟的菜单数据
const menuOptions: MenuOption[] = [
  {
    label: "仪表盘",
    key: "dashboard",
    path: "/dashboard",
  },
  {
    label: "系统管理",
    key: "admin",
    children: [
      {
        label: "用户管理",
        key: "user-management",
        path: "/admin/users",
      },
      {
        label: "角色管理",
        key: "role-management",
        path: "/admin/roles",
      },
      {
        label: "日志查看",
        key: "log-viewer",
        path: "/admin/logs",
      },
    ],
  },
  {
    label: "项目管理",
    key: "project",
    children: [
      {
        label: "项目列表",
        key: "project-list",
        path: "/project/list",
      },
    ],
  },
];

const handleMenuSelect = (key: string, item: MenuOption) => {
  if (item.path) {
    router.push(item.path as string);
  }
};

const handleLogout = async () => {
  try {
    // await userStore.logout(); // 调用 Pinia action
    message.success("您已成功登出");
    router.push("/auth/login");
  } catch (error) {
    message.error("登出失败");
  }
};
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header
      style="
        height: 64px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      "
      bordered
    >
      <div class="text-xl font-bold">PSM - Vue</div>
      <n-button type="error" @click="handleLogout">退出登录</n-button>
    </n-layout-header>
    <n-layout has-sider>
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>
      <n-layout-content style="padding: 24px">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
