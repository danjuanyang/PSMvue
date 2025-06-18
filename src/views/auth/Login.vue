<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from "naive-ui";
import { loginApi } from "../../api/auth";
import type { LoginData } from "../../types/api";
// 如果你使用了 Pinia store，则在这里引入
// import { useUserStore } from '@/stores/user';

const router = useRouter();
const message = useMessage();
// const userStore = useUserStore(); // Pinia store

const loginFormRef = ref<any>(null);
const loading = ref(false);
const loginData = ref<LoginData>({
  username: "",
  password: "",
});

const rules = {
  username: {
    required: true,
    message: "请输入用户名",
    trigger: "blur",
  },
  password: {
    required: true,
    message: "请输入密码",
    trigger: "blur",
  },
};

const handleLogin = (e: MouseEvent) => {
  e.preventDefault();
  loginFormRef.value?.validate(async (errors: any) => {
    if (!errors) {
      loading.value = true;
      try {
        // 直接调用 API
        const response: any = await loginApi(loginData.value);
        message.success(response.message || "登录成功！");

        // 如果使用 Pinia，可以在这里调用 action
        await userStore.login(loginData.value);

        // 登录成功后跳转到仪表盘
        router.push("/dashboard");
      } catch (error: any) {
        // API 错误已在拦截器中处理，这里可以留空或处理特定逻辑
        console.error("Login failed in component:", error);
      } finally {
        loading.value = false;
      }
    } else {
      message.error("请填写完整的登录信息");
    }
  });
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <n-card
      class="w-full max-w-sm"
      title="PSM - 项目管理系统"
      header-style="text-align: center; font-size: 20px;"
    >
      <n-form ref="loginFormRef" :model="loginData" :rules="rules">
        <n-form-item path="username" label="用户名">
          <n-input v-model:value="loginData.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="loginData.password"
            type="password"
            show-password-on="mousedown"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </n-form-item>
        <n-space vertical>
          <n-button type="primary" block :loading="loading" @click="handleLogin">
            登 录
          </n-button>
          <n-button block @click="router.push('/auth/register')"> 注 册 </n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
/* 可以添加一些局部样式 */
</style>
