<script setup lang="ts">
import { NCard, NStatistic, NGrid, NGridItem } from "naive-ui";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

// 在页面加载时获取最新的用户信息
if (!userStore.userInfo) {
  userStore.fetchUserInfo();
}
</script>

<template>
  <div>
    <n-card :title="`欢迎, ${userStore.userInfo?.username || '用户'}`">
      <p>欢迎使用项目管理系统 (PSM)。</p>
    </n-card>

    <n-grid x-gap="12" :cols="4" class="mt-6">
      <n-grid-item>
        <n-card>
          <n-statistic
            label="我的角色"
            :value="userStore.userInfo?.role || '加载中...'"
          />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="项目总数" :value="15" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="进行中任务" :value="8" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="待处理通知" :value="3" />
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>
