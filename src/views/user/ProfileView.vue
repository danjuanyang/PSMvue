<template>
  <div class="page-header-index-wide">
    <a-card :bordered="false" :body-style="{ padding: '16px 0', height: '100%' }" :style="{ height: '100%' }">
      <div class="account-center-main">
        <a-row :gutter="[16, 16]">
          <!-- 左侧用户信息卡片 -->
          <a-col :md="24" :lg="8">
            <div class="account-center-avatarHolder">
              <div class="avatar">
                <a-avatar :size="128" style="backgroundColor:#87d068" icon="user" />
              </div>
              <div class="username">{{ user.name }}</div>
              <div class="bio">天行健，君子以自强不息</div>
            </div>
            <div class="account-center-detail">
              <p><i class="title user-icon"></i>{{ user.role }}</p>
              <p><i class="title mail-icon"></i>{{ user.email }}</p>
              <p><i class="title cluster-icon"></i>注册于 {{ formatDate(user.created_at) }}</p>
            </div>
          </a-col>
          <!-- 右侧设置区域 -->
          <a-col :md="24" :lg="16">
            <a-tabs default-active-key="security-settings">
              <a-tab-pane key="security-settings" tab="安全设置">
                <a-list item-layout="horizontal" :data-source="securitySettings">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta>
                        <template #title>
                          <a>{{ item.title }}</a>
                        </template>
                        <template #description>
                          <span>{{ item.description }}</span>
                        </template>
                      </a-list-item-meta>
                      <template #actions>
                        <a @click="item.action">修改</a>
                      </template>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
              <a-tab-pane key="basic-info" tab="基本信息">
                <a-descriptions title="详细资料" bordered>
                  <a-descriptions-item label="用户名">{{ user.name }}</a-descriptions-item>
                  <a-descriptions-item label="邮箱">{{ user.email }}</a-descriptions-item>
                  <a-descriptions-item label="角色">{{ user.role }}</a-descriptions-item>
                  <a-descriptions-item label="注册时间">{{ formatDate(user.created_at) }}</a-descriptions-item>
                   <a-descriptions-item label="用户ID">{{ user.id }}</a-descriptions-item>
                </a-descriptions>
              </a-tab-pane>
            </a-tabs>
          </a-col>
        </a-row>
      </div>
    </a-card>

    <!-- 修改用户名 Modal -->
    <a-modal
      title="修改用户名"
      :visible="usernameModalVisible"
      @ok="handleUpdateUsername"
      @cancel="() => { usernameModalVisible = false }"
      :confirmLoading="confirmLoading"
      destroyOnClose
    >
      <a-form :model="usernameModel" ref="usernameFormRef">
        <a-form-item label="新用户名" name="new_username" :rules="[{ required: true, message: '请输入新用户名!' }]">
          <a-input v-model:value="usernameModel.new_username" placeholder="请输入新的用户名" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改邮箱 Modal -->
    <a-modal
      title="修改邮箱"
      :visible="emailModalVisible"
      @ok="handleUpdateEmail"
      @cancel="() => { emailModalVisible = false }"
      :confirmLoading="confirmLoading"
      destroyOnClose
    >
      <a-form :model="emailModel" ref="emailFormRef">
        <a-form-item label="新邮箱" name="new_email" :rules="[{ required: true, message: '请输入新邮箱!' }, { type: 'email', message: '请输入有效的邮箱地址!' }]">
          <a-input v-model:value="emailModel.new_email" placeholder="请输入新的邮箱地址" />
        </a-form-item>
        <a-form-item label="当前密码" name="password" help="为验证您的身份，请输入当前登录密码" :rules="[{ required: true, message: '请输入当前密码以验证身份!' }]">
          <a-input-password v-model:value="emailModel.password" placeholder="请输入当前密码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改密码 Modal -->
    <a-modal
      title="修改密码"
      :visible="passwordModalVisible"
      @ok="handleUpdatePassword"
      @cancel="() => { passwordModalVisible = false }"
      :confirmLoading="confirmLoading"
      destroyOnClose
    >
       <a-form :model="passwordModel" ref="passwordFormRef">
        <a-form-item label="旧密码" name="old_password" :rules="[{ required: true, message: '请输入旧密码!' }]">
          <a-input-password v-model:value="passwordModel.old_password" placeholder="请输入旧密码" />
        </a-form-item>
        <a-form-item label="新密码" name="new_password" :rules="[{ required: true, message: '请输入新密码!' }]">
          <a-input-password v-model:value="passwordModel.new_password" placeholder="请输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { changeUsername, changeEmail, changePassword } from '@/api/auth';

const store = useStore();
const router = useRouter();

// --- Reactive State ---
const confirmLoading = ref(false);
const usernameModalVisible = ref(false);
const emailModalVisible = ref(false);
const passwordModalVisible = ref(false);

// --- Form Refs and Models ---
const usernameFormRef = ref();
const emailFormRef = ref();
const passwordFormRef = ref();

const usernameModel = reactive({ new_username: '' });
const emailModel = reactive({ new_email: '', password: '' });
const passwordModel = reactive({ old_password: '', new_password: '' });

// --- Computed Properties ---
const user = computed(() => store.state.user);

const securitySettings = computed(() => [
  {
    title: '账户密码',
    description: '定期修改密码可以提高账户安全性',
    action: () => { passwordModalVisible.value = true; }
  },
  {
    title: '账户用户名',
    description: `当前用户名：${user.value.name}`,
    action: () => { usernameModalVisible.value = true; }
  },
  {
    title: '绑定邮箱',
    description: `当前已绑定邮箱：${user.value.email}`,
    action: () => { emailModalVisible.value = true; }
  }
]);

// --- Methods ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return 'Invalid Date';
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const handleUpdateUsername = () => {
  usernameFormRef.value.validate().then(() => {
    confirmLoading.value = true;
    changeUsername(usernameModel)
      .then(() => {
        message.success('用户名修改成功！');
        usernameModalVisible.value = false;
        store.dispatch('user/GetInfo');
      })
      .catch(err => {
        message.error(err.response?.data?.error || '修改失败，请重试');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }).catch(err => {
    console.log('Validation error:', err);
  });
};

const handleUpdateEmail = () => {
  emailFormRef.value.validate().then(() => {
    confirmLoading.value = true;
    changeEmail(emailModel)
      .then(() => {
        message.success('邮箱修改成功！');
        emailModalVisible.value = false;
        store.dispatch('user/GetInfo');
      })
      .catch(err => {
        message.error(err.response?.data?.error || '修改失败，请重试');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }).catch(err => {
    console.log('Validation error:', err);
  });
};

const handleUpdatePassword = () => {
  passwordFormRef.value.validate().then(() => {
    confirmLoading.value = true;
    changePassword(passwordModel)
      .then(() => {
        message.success('密码修改成功！为安全起见，请使用新密码重新登录。');
        passwordModalVisible.value = false;
        store.dispatch('user/Logout').then(() => {
          router.push({ name: 'login' });
        });
      })
      .catch(err => {
        message.error(err.response?.data?.error || '修改失败，请重试');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }).catch(err => {
    console.log('Validation error:', err);
  });
};
</script>

<style scoped>
.page-header-index-wide {
  padding: 20px;
  background-color: #f0f2f5;
}

.account-center-main {
  width: 100%;
}

.account-center-main .account-center-avatarHolder {
  text-align: center;
  margin-bottom: 24px;
}

.account-center-main .account-center-avatarHolder .avatar {
  margin: 0 auto;
  width: 128px;
  height: 128px;
  margin-bottom: 20px;
  border-radius: 50%;
  overflow: hidden;
}

.account-center-main .account-center-avatarHolder .username {
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;
  margin-bottom: 4px;
}

.account-center-main .account-center-detail p {
  margin-bottom: 8px;
  padding-left: 26px;
  position: relative;
}

.account-center-main .account-center-detail i {
  position: absolute;
  height: 14px;
  width: 14px;
  left: 0;
  top: 4px;
  background: url(https://gw.alipayobjects.com/zos/rmsportal/pBjWzVAHnOOtAUvZmZfy.svg);
}

.account-center-main .account-center-detail .user-icon {
  background-position: 0 0;
}

.account-center-main .account-center-detail .mail-icon {
  background-position: 0 -22px;
}

.account-center-main .account-center-detail .cluster-icon {
  background-position: 0 -44px;
}
</style>
