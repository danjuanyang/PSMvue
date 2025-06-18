<script setup lang="ts">
import { RouterView } from "vue-router";
import {
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
} from "naive-ui";
</script>

<template>
  <n-loading-bar-provider>
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <router-view />
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-loading-bar-provider>
</template>

<style scoped>
/* 你可以在这里添加一些全局的样式 */
</style>
