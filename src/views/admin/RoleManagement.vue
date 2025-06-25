<template>
  <div class="p-6">
    <n-card title="角色权限管理" :bordered="false" class="rounded-lg shadow-md">
      <n-spin :show="loading">
        <n-grid :x-gap="24" :y-gap="16" :cols="3">
          <!-- 角色列表 -->
          <n-gi :span="1">
            <n-card title="角色列表" size="small" class="h-full">
              <n-list hoverable clickable>
                <n-list-item
                  v-for="role in roles"
                  :key="role.name"
                  @click="handleRoleSelect(role)"
                  :class="{
                    'bg-blue-100 dark:bg-blue-900': selectedRole?.name === role.name,
                  }"
                >
                  <n-thing :title="role.name" />
                </n-list-item>
              </n-list>
            </n-card>
          </n-gi>

          <!-- 权限配置 -->
          <n-gi :span="2">
            <n-card
              v-if="selectedRole"
              :title="`配置 '${selectedRole.name}' 角色的权限`"
              size="small"
              class="h-full"
            >
              <n-spin :show="loadingPermissions">
                <n-scrollbar style="max-height: 60vh">
                  <n-checkbox-group v-model:value="currentPermissionNames">
                    <n-grid :y-gap="16" :x-gap="16" :cols="2">
                      <n-gi v-for="permission in allPermissions" :key="permission.id">
                        <n-checkbox :value="permission.name" :label="permission.name" />
                        <p class="text-xs text-gray-500 ml-6">
                          {{ permission.description }}
                        </p>
                      </n-gi>
                    </n-grid>
                  </n-checkbox-group>
                </n-scrollbar>
              </n-spin>
              <template #footer>
                <div class="flex justify-end space-x-4">
                  <n-button @click="resetPermissions" :disabled="loadingPermissions"
                    >重置</n-button
                  >
                  <n-button
                    type="primary"
                    @click="handleSave"
                    :loading="saving || loadingPermissions"
                  >
                    保存更改
                  </n-button>
                </div>
              </template>
            </n-card>
            <n-card v-else class="h-full flex items-center justify-center">
              <n-empty description="请先从左侧选择一个角色进行配置" />
            </n-card>
          </n-gi>
        </n-grid>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  NCard,
  NGrid,
  NGi,
  NList,
  NListItem,
  NThing,
  NCheckboxGroup,
  NCheckbox,
  NButton,
  NSpin,
  NEmpty,
  NScrollbar,
  useMessage,
} from "naive-ui";
import {
  getRoles,
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
} from "@/api/admin";
import type { Role, Permission } from "@/types/api";

const message = useMessage();

// State
const loading = ref(true);
const saving = ref(false);
const loadingPermissions = ref(false);
const roles = ref<Role[]>([]);
const allPermissions = ref<Permission[]>([]);
const selectedRole = ref<Role | null>(null);
const originalPermissionNames = ref<string[]>([]);
const currentPermissionNames = ref<string[]>([]);

// 获取初始数据
onMounted(async () => {
  try {
    loading.value = true;
    const [rolesRes, permissionsRes] = await Promise.all([
      getRoles(),
      getAllPermissions(),
    ]);
    if (Array.isArray(rolesRes)) {
      //从列表中筛选出SUPER角色
      roles.value = rolesRes.filter((role) => role.name !== "SUPER");
    }
    if (Array.isArray(permissionsRes)) {
      allPermissions.value = permissionsRes;
    }
  } catch (error) {
    message.error("获取基础数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
});

// 方法
const handleRoleSelect = async (role: Role) => {
  selectedRole.value = role;
  loadingPermissions.value = true;
  currentPermissionNames.value = [];
  try {
    const rolePerms = await getRolePermissions(role.name);
    const allowedPerms = rolePerms.filter((p) => p.allowed).map((p) => p.name);
    currentPermissionNames.value = allowedPerms;
    originalPermissionNames.value = [...allowedPerms];
  } catch (error) {
    message.error(`获取角色 '${role.name}' 的权限失败`);
  } finally {
    loadingPermissions.value = false;
  }
};

const resetPermissions = () => {
  currentPermissionNames.value = [...originalPermissionNames.value];
  message.info("权限已重置");
};

const handleSave = async () => {
  if (!selectedRole.value) {
    message.warning("没有选中的角色");
    return;
  }
  saving.value = true;
  try {
    const permissionsPayload = currentPermissionNames.value.map((name) => ({ name }));
    await updateRolePermissions(selectedRole.value.name, permissionsPayload);
    message.success(`角色 '${selectedRole.value.name}' 的权限更新成功`);
    originalPermissionNames.value = [...currentPermissionNames.value];
  } catch (error) {
    message.error("保存失败，请重试");
    console.error(error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.bg-blue-100 {
  background-color: #ebf8ff;
}
.dark .bg-blue-900 {
  background-color: #2c5282;
}
</style>
