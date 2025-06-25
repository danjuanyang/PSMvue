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
            @keyup.enter.prevent="handleLogin"
          />
        </n-form-item>
        <n-space vertical>
          <n-button type="primary" block :loading="loading" @click.prevent="handleLogin">
            登 录
          </n-button>
          <n-button block @click="router.push('/register')"> 注 册 </n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from "naive-ui";
import { useUserStore } from "../../stores/user";
import type { LoginData } from "../../types/api";

const router = useRouter();
const message = useMessage();
const userStore = useUserStore();

const loginFormRef = ref<any>(null);
const loading = ref(false);
const loginData = ref<LoginData>({
  username: "",
  password: "",
});

const rules = {
  username: { required: true, message: "请输入用户名", trigger: "blur" },
  password: { required: true, message: "请输入密码", trigger: "blur" },
};

const handleLogin = () => {
  loginFormRef.value?.validate(async (errors: any) => {
    if (errors) {
      message.error("请填写完整的登录信息");
      return;
    }
    loading.value = true;
    try {
      // 只调用 store 的 action，它会处理API调用和状态更新
      await userStore.login(loginData.value);
      message.success("登录成功！");
      router.push({ name: "dashboard" });
    } catch (error: any) {
      // 错误已由 axios 拦截器或 store 处理，这里只处理UI
      console.error("Login failed in component:", error);
    } finally {
      loading.value = false;
    }
  });
};
</script>
