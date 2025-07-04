<template>
  <a-layout style="min-height: 100vh">
    <!-- 左侧导航栏 (仅在登录后显示) -->
    <a-layout-sider v-if="isLoggedIn" v-model:collapsed="collapsed" collapsible>
      <div class="logo" />
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="1">
          <pie-chart-outlined />
          <span>Dashboard</span>
        </a-menu-item>
        <a-menu-item key="2">
          <desktop-outlined />
          <span>我的项目</span>
        </a-menu-item>
        <a-sub-menu key="sub1">
          <template #title>
            <span>
              <user-outlined />
              <span>用户</span>
            </span>
          </template>
          <a-menu-item key="3">Tom</a-menu-item>
          <a-menu-item key="4">Bill</a-menu-item>
          <a-menu-item key="5">Alex</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部 Header (仅在登录后显示) -->
      <a-layout-header v-if="isLoggedIn" style="background: #fff; padding: 0 24px; display: flex; justify-content: flex-end; align-items: center;">
        <a-space>
            <a-avatar>
                <template #icon><UserOutlined /></template>
            </a-avatar>
            <span>{{ username }}</span>
            <a-button type="link" @click="handleLogout">
              <template #icon><LogoutOutlined /></template>
              登出
            </a-button>
        </a-space>
      </a-layout-header>

      <!-- 主内容区 -->
      <a-layout-content style="margin: 0 16px;">
        <!-- 这里是路由组件渲染的地方 -->
        <router-view />
      </a-layout-content>
      
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import {
  PieChartOutlined,
  DesktopOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const store = useStore();
const router = useRouter();

const collapsed = ref(false);
const selectedKeys = ref(['1']);

// 从 Vuex 获取登录状态和用户信息
const isLoggedIn = computed(() => store.getters['user/isLoggedIn']);
const username = computed(() => store.getters['user/currentUser']?.username || '用户');

const handleLogout = async () => {
    try {
        await store.dispatch('user/logout');
        message.success('您已成功登出');
        router.push('/login');
    } catch (error) {
        message.error('登出失败，请稍后重试');
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
