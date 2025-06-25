<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <router-view />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NGlobalStyle,
  lightTheme,
  darkTheme,
  zhCN,
  dateZhCN,
} from "naive-ui";

// 你可以根据用户偏好或系统设置来切换主题
const theme = lightTheme; // 或者 darkTheme
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
</style>
