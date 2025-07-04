<template>
    <div class="auth-page-container">
      <div class="background-shapes"></div>
      <a-card class="auth-card" :bordered="false">
        <div class="auth-card-header">
          <img src="https://placehold.co/64x64/7c3aed/ffffff?text=PSM" alt="Logo" class="logo-img" />
          <h1 class="title">项目管理系统</h1>
          <p class="subtitle">欢迎回来，请登录您的账户</p>
        </div>
        <a-tabs v-model:activeKey="activeTabKey" centered>
          <a-tab-pane key="login" tab="登 录">
            <a-form :model="loginFormState" @finish="onLoginFinish" layout="vertical">
              <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入您的用户名!' }]">
                <a-input v-model:value="loginFormState.username" placeholder="Username">
                  <template #prefix><UserOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入您的密码!' }]">
                <a-input-password v-model:value="loginFormState.password" placeholder="Password">
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" html-type="submit" :loading="isLoading" block>登 录</a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
          <a-tab-pane key="register" tab="注 册">
            <a-form :model="registerFormState" @finish="onRegisterFinish" layout="vertical" ref="registerFormRef">
              <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
                <a-input v-model:value="registerFormState.username" placeholder="设置一个用户名">
                  <template #prefix><UserOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="邮箱" name="email" :rules="[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]">
                <a-input v-model:value="registerFormState.email" placeholder="用于账户验证">
                  <template #prefix><MailOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]" has-feedback>
                <a-input-password v-model:value="registerFormState.password" placeholder="设置您的密码">
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-form-item label="确认密码" name="confirmPassword" :dependencies="['password']" :rules="[{ required: true, message: '请再次输入密码' }, { validator: validateConfirmPassword }]" has-feedback>
                <a-input-password v-model:value="registerFormState.confirmPassword" placeholder="确认您的密码">
                   <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" html-type="submit" :loading="isLoading" block>注 册</a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue';
  import { useStore } from 'vuex';
  import { useRouter, useRoute } from 'vue-router';
  import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue';
  import { message } from 'ant-design-vue';
  import { register } from '@/api/auth'; // 直接引入注册API
  
  // --- Hooks ---
  const store = useStore();
  const router = useRouter();
  const route = useRoute();
  
  // --- State ---
  const activeTabKey = ref('login');
  const isLoading = ref(false);
  const registerFormRef = ref();
  
  const loginFormState = reactive({ username: '', password: '' });
  const registerFormState = reactive({ username: '', email: '', password: '', confirmPassword: '' });
  
  // --- Methods ---
  const onLoginFinish = async (values) => {
    isLoading.value = true;
    try {
      await store.dispatch('user/login', values);
      message.success('登录成功！');
      // 跳转到之前想访问的页面，或默认跳转到首页
      const redirect = route.query.redirect || '/';
      router.push(redirect);
    } catch (error) {
      // 错误已在request.js中统一处理，这里无需额外操作
      console.error('登录流程失败:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const onRegisterFinish = async (values) => {
    isLoading.value = true;
    try {
      await register({
          username: values.username,
          email: values.email,
          password: values.password
      });
      message.success('注册成功！请使用新账户登录。');
      activeTabKey.value = 'login';
      loginFormState.username = values.username;
      loginFormState.password = '';
      registerFormRef.value.resetFields();
    } catch (error) {
      console.error('注册流程失败:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const validateConfirmPassword = (_rule, value) => {
    if (value === '') return Promise.reject('请再次输入密码');
    if (value !== registerFormState.password) return Promise.reject("两次输入的密码不一致!");
    return Promise.resolve();
  };
  </script>
  
  <style>
  /* 样式与之前相同，保持不变 */
  .auth-page-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    position: relative;
    overflow: hidden;
  }
  .background-shapes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle at 15% 85%, rgba(124, 58, 237, 0.1), transparent 40%),
      radial-gradient(circle at 85% 20%, rgba(59, 130, 246, 0.1), transparent 40%);
    z-index: 0;
  }
  .auth-card {
    width: 400px;
    max-width: 90%;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-radius: 12px;
    z-index: 1;
    background-color: #ffffff;
  }
  .auth-card-header {
    text-align: center;
    margin-bottom: 24px;
  }
  .logo-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  .title {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }
  .subtitle {
    font-size: 14px;
    color: #6b7280;
  }
  .ant-form-item-label > label {
    font-weight: 500;
    color: #374151;
  }
  .ant-btn-primary {
    background: linear-gradient(to right, #6d28d9, #4f46e5);
    border: none;
    height: 40px;
    font-size: 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  .ant-btn-primary:hover,
  .ant-btn-primary:focus {
    opacity: 0.9;
    box-shadow: 0 4px 15px -5px rgba(99, 102, 241, 0.5);
  }
  .ant-tabs-nav::before {
    border-bottom: 1px solid #e5e7eb;
  }
  .ant-tabs-tab {
    font-size: 16px;
    padding: 12px 0;
  }
  </style>
  