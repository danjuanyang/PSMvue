<template>
  <div class="not-found-container">
    <a-result
      status="404"
      title="404"
      sub-title="抱歉，你访问的页面不存在或已被移除。"
    >
      <template #extra>
        <a-button type="primary" @click="goHome">
          返回首页
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
}
</style>