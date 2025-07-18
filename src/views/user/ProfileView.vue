<template>
  <div class="page-container">
    <a-row :gutter="[16, 16]">
      <!-- Left Side: User Profile Card -->
      <a-col :md="24" :lg="8">
        <a-card :bordered="false" class="user-card">
          <div class="text-center">
            <a-avatar :size="128" style="background-color: #1890ff">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <h2 class="mt-4 mb-1 text-lg font-semibold">{{ user.username }}</h2>
            <p class="text-gray-500">天行健，君子以自强不息</p>
          </div>
          <a-divider />
          <div class="user-details">
            <p>
              <CrownOutlined class="mr-2" />
              <span><a-tag>{{ user.role }}</a-tag></span>
            </p>
            <p>
              <MailOutlined class="mr-2" />
              <span>{{ user.email }}</span>
            </p>
            <p>
              <CalendarOutlined class="mr-2" />
              <span>注册于 {{ formatDate(user.create_at) }}</span>
            </p>
          </div>
        </a-card>
      </a-col>

      <!-- Right Side: Settings Tabs -->
      <a-col :md="24" :lg="16">
        <a-card :bordered="false">
          <a-tabs default-active-key="basic-info">
            <a-tab-pane key="basic-info" tab="基本信息">
              <a-descriptions title="详细资料" bordered :column="1">
                <a-descriptions-item label="用户名">{{
                  user.username
                }}</a-descriptions-item>
                <a-descriptions-item label="邮箱">{{ user.email }}</a-descriptions-item>
                <a-descriptions-item label="角色">
                  <a-tag :color="getRoleColor(user.role)">{{ user.role }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="注册时间">{{
                  formatDate(user.create_at)
                }}</a-descriptions-item>
                <a-descriptions-item label="用户ID">{{ user.id }}</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <a-tab-pane key="security-settings" tab="安全设置">
              <a-list item-layout="horizontal" :data-source="securitySettings">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title
                        ><a>{{ item.title }}</a></template
                      >
                      <template #description
                        ><span>{{ item.description }}</span></template
                      >
                    </a-list-item-meta>
                    <template #actions>
                      <a @click="item.action">修改</a>
                    </template>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>

    <!-- 更新用户信息的方式（与原始信息不变） -->
    <a-modal
      title="修改用户名"
      :visible="usernameModalVisible"
      @ok="handleUpdateUsername"
      @cancel="usernameModalVisible = false"
      :confirmLoading="confirmLoading"
      destroyOnClose
    >
      <a-form :model="usernameModel" ref="usernameFormRef">
        <a-form-item
          label="新用户名"
          name="new_username"
          :rules="[{ required: true, message: '请输入新用户名!' }]"
        >
          <a-input
            v-model:value="usernameModel.new_username"
            placeholder="请输入新的用户名"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      title="修改邮箱"
      :visible="emailModalVisible"
      @ok="handleUpdateEmail"
      @cancel="emailModalVisible = false"
      :confirmLoading="confirmLoading"
      destroyOnClose
    >
      <a-form :model="emailModel" ref="emailFormRef">
        <a-form-item
          label="新邮箱"
          name="new_email"
          :rules="[
            { required: true, message: '请输入新邮箱!' },
            { type: 'email', message: '请输入有效的邮箱地址!' },
          ]"
        >
          <a-input
            v-model:value="emailModel.new_email"
            placeholder="请输入新的邮箱地址"
          />
        </a-form-item>
        <a-form-item
          label="当前密码"
          name="password"
          help="为验证您的身份，请输入当前登录密码"
          :rules="[{ required: true, message: '请输入当前密码以验证身份!' }]"
        >
          <a-input-password
            v-model:value="emailModel.password"
            placeholder="请输入当前密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      title="修改密码"
      :visible="passwordModalVisible"
      @ok="handleUpdatePassword"
      @cancel="passwordModalVisible = false"
      :confirmLoading="confirmLoading"
      destroyOnClose
    >
      <a-form :model="passwordModel" ref="passwordFormRef">
        <a-form-item
          label="旧密码"
          name="old_password"
          :rules="[{ required: true, message: '请输入旧密码!' }]"
        >
          <a-input-password
            v-model:value="passwordModel.old_password"
            placeholder="请输入旧密码"
          />
        </a-form-item>
        <a-form-item
          label="新密码"
          name="new_password"
          :rules="[{ required: true, message: '请输入新密码!' }]"
        >
          <a-input-password
            v-model:value="passwordModel.new_password"
            placeholder="请输入新密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { changeUsername, changeEmail, changePassword } from "@/api/auth";
import {
  UserOutlined,
  MailOutlined,
  CrownOutlined,
  CalendarOutlined,
} from "@ant-design/icons-vue";

const store = useStore();
const router = useRouter();

// --- Reactive State ---
const confirmLoading = ref(false);
const usernameModalVisible = ref(false);
const emailModalVisible = ref(false);
const passwordModalVisible = ref(false);


const usernameFormRef = ref();
const emailFormRef = ref();
const passwordFormRef = ref();

const usernameModel = reactive({ new_username: "" });
const emailModel = reactive({ new_email: "", password: "" });
const passwordModel = reactive({ old_password: "", new_password: "" });

// --- 计算属性 ---
const user = computed(() => store.getters["user/currentUser"] || {});

const securitySettings = computed(() => [
  {
    title: "账户密码",
    description: "定期修改密码可以提高账户安全性",
    action: () => {
      passwordModalVisible.value = true;
    },
  },
  {
    title: "账户用户名",
    description: `当前用户名：${user.value.username}`,
    action: () => {
      usernameModalVisible.value = true;
    },
  },
  {
    title: "绑定邮箱",
    description: `当前已绑定邮箱：${user.value.email}`,
    action: () => {
      emailModalVisible.value = true;
    },
  },
]);

// --- Methods ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date)) return "Invalid Date";
  const pad = (num) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getRoleColor = (role) => {
  const colors = {
    SUPER: "gold",
    ADMIN: "cyan",
    MEMBER: "blue",
  };
  return colors[role] || "default";
};

const handleUpdateUsername = () => {
  usernameFormRef.value.validate().then(() => {
    confirmLoading.value = true;
    changeUsername(usernameModel)
      .then(() => {
        message.success("用户名修改成功！");
        usernameModalVisible.value = false;
        store.dispatch("user/GetInfo");
      })
      .catch((err) => {
        message.error(err.response?.data?.error || "修改失败，请重试");
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  });
};

const handleUpdateEmail = () => {
  emailFormRef.value.validate().then(() => {
    confirmLoading.value = true;
    changeEmail(emailModel)
      .then(() => {
        message.success("邮箱修改成功！");
        emailModalVisible.value = false;
        store.dispatch("user/GetInfo");
      })
      .catch((err) => {
        message.error(err.response?.data?.error || "修改失败，请重试");
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  });
};

const handleUpdatePassword = async () => {
  try {
    await passwordFormRef.value.validate();
    confirmLoading.value = true;
    await changePassword(passwordModel);
    message.success("密码修改成功！为安全起见，请使用新密码重新登录。");
    passwordModalVisible.value = false;

    // 强制登出并跳转
    try {
      await store.dispatch("user/logout");
    } catch (logoutError) {
      console.error("注销API失败，但继续进行清理：", logoutError);
      // 即使API调用失败，也强制清理前端状态
      await store.dispatch("user/resetToken");
    } finally {
      router.push({ name: "login" });
    }

  } catch (err) {
    // 处理表单验证失败或密码修改API的错误
    if (err && err.errorFields) {
      // Ant Design Vue 表单验证错误
      console.log("验证错误：", err.errorFields);
    } else {
      // API 错误
      message.error(err.response?.data?.error || "修改失败，请重试");
    }
  } finally {
    confirmLoading.value = false;
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f0f2f5;
}

.user-card .ant-card-body {
  padding: 24px;
}

.text-center {
  text-align: center;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.text-lg {
  font-size: 1.125rem;
}

.font-semibold {
  font-weight: 600;
}

.text-gray-500 {
  color: #6b7280;
}

.user-details p {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
