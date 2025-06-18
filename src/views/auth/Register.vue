<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from "naive-ui";
// 假设你已经在 api/auth.ts 中添加了注册的 API 函数
// import { registerApi } from '@/api/auth';

const router = useRouter();
const message = useMessage();

const formRef = ref<any>(null);
const loading = ref(false);
const model = ref({
  username: "",
  email: "",
  password: "",
  reenteredPassword: "",
});

// 模拟的注册API函数
const registerApi = (data: any) => {
  console.log("Registering with:", data);
  return new Promise((resolve) =>
    setTimeout(() => resolve({ message: "注册成功" }), 1000)
  );
};

const rules = {
  username: { required: true, message: "请输入用户名", trigger: "blur" },
  email: { required: true, message: "请输入邮箱", trigger: "blur" },
  password: { required: true, message: "请输入密码", trigger: "blur" },
  reenteredPassword: [
    { required: true, message: "请再次输入密码", trigger: ["input", "blur"] },
    {
      validator: (rule: any, value: string) => value === model.value.password,
      message: "两次输入的密码不一致",
      trigger: "input",
    },
  ],
};

const handleRegister = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      loading.value = true;
      try {
        const { username, email, password } = model.value;
        await registerApi({ username, email, password });
        message.success("注册成功！将跳转到登录页。");
        router.push("/auth/login");
      } catch (error: any) {
        message.error(error.message || "注册失败");
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<template>
  <n-card
    class="w-full max-w-sm"
    title="创建新账户"
    header-style="text-align: center; font-size: 20px;"
  >
    <n-form ref="formRef" :model="model" :rules="rules">
      <n-form-item path="username" label="用户名">
        <n-input v-model:value="model.username" placeholder="请输入用户名" />
      </n-form-item>
      <n-form-item path="email" label="邮箱">
        <n-input v-model:value="model.email" placeholder="请输入邮箱" />
      </n-form-item>
      <n-form-item path="password" label="密码">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="mousedown"
          placeholder="请输入密码"
        />
      </n-form-item>
      <n-form-item path="reenteredPassword" label="确认密码">
        <n-input
          v-model:value="model.reenteredPassword"
          type="password"
          show-password-on="mousedown"
          placeholder="请再次输入密码"
        />
      </n-form-item>
      <n-space vertical>
        <n-button type="primary" block :loading="loading" @click="handleRegister">
          注 册
        </n-button>
        <n-button block @click="router.push('/auth/login')"> 已有账户？去登录 </n-button>
      </n-space>
    </n-form>
  </n-card>
</template>
