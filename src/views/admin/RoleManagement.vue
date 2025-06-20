<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  NCard,
  NTabs,
  NTabPane,
  NCheckbox,
  NSpace,
  NButton,
  useMessage,
  NSpin,
} from "naive-ui";
import {
  getRolesApi,
  getPermissionsApi,
  getRolePermissionsApi,
  updateRolePermissionsApi,
} from "@/api/admin";
import type { Role, Permission } from "@/types/api";

const message = useMessage();
const loading = ref(true);
const tabLoading = ref(false);

const allRoles = ref<Role[]>([]);
const allPermissions = ref<Permission[]>([]);
const currentTab = ref<string | null>(null);

// 使用一个对象来存储每个角色的权限状态
const rolePermissions = ref<Record<string, Record<string, boolean>>>({});

const activeRoleName = computed(() => {
  if (!currentTab.value) return "";
  const role = allRoles.value.find((r) => r.name === currentTab.value);
  return role ? role.name : "";
});

const fetchInitialData = async () => {
  loading.value = true;
  try {
    const [roles, permissions] = await Promise.all([getRolesApi(), getPermissionsApi()]);
    // 过滤掉 SUPER 角色，因为它的权限是固定的
    allRoles.value = roles.filter((r) => r.name !== "SUPER");
    allPermissions.value = permissions;

    // 初始化权限状态对象
    const initialPerms: Record<string, Record<string, boolean>> = {};
    allRoles.value.forEach((role) => {
      initialPerms[role.name] = {};
      permissions.forEach((perm) => {
        initialPerms[role.name][perm.name] = false;
      });
    });
    rolePermissions.value = initialPerms;

    // 默认选中第一个角色标签页
    if (allRoles.value.length > 0) {
      currentTab.value = allRoles.value[0].name;
      handleTabChange(allRoles.value[0].name);
    }
  } catch (error) {
    message.error("获取初始数据失败");
  } finally {
    loading.value = false;
  }
};

const handleTabChange = async (tabName: string) => {
  currentTab.value = tabName;
  tabLoading.value = true;
  try {
    const rolePerms = await getRolePermissionsApi(tabName);

    // 重置当前角色的权限
    Object.keys(rolePermissions.value[tabName]).forEach((key) => {
      rolePermissions.value[tabName][key] = false;
    });

    // 根据API返回的数据设置权限
    rolePerms.forEach((p) => {
      if (rolePermissions.value[tabName].hasOwnProperty(p.name)) {
        rolePermissions.value[tabName][p.name] = p.allowed;
      }
    });
  } catch (error) {
    message.error(`获取角色 ${tabName} 的权限失败`);
  } finally {
    tabLoading.value = false;
  }
};

const handleSave = async () => {
  if (!currentTab.value) return;
  tabLoading.value = true;
  try {
    const permissionsToSave = Object.entries(rolePermissions.value[currentTab.value]).map(
      ([name, allowed]) => ({
        name,
        allowed,
      })
    );
    await updateRolePermissionsApi(currentTab.value, permissionsToSave);
    message.success(`角色 ${currentTab.value} 的权限已更新`);
  } catch (error) {
    message.error("保存权限失败");
  } finally {
    tabLoading.value = false;
  }
};

onMounted(fetchInitialData);
</script>

<template>
  <n-card title="角色权限管理">
    <n-spin :show="loading">
      <n-tabs type="card" v-model:value="currentTab" @update:value="handleTabChange">
        <n-tab-pane
          v-for="role in allRoles"
          :key="role.value"
          :name="role.name"
          :tab="role.name"
        >
          <n-spin :show="tabLoading">
            <n-space vertical class="p-4">
              <div v-for="perm in allPermissions" :key="perm.id">
                <n-checkbox v-model:checked="rolePermissions[role.name][perm.name]">
                  {{ perm.description }} ({{ perm.name }})
                </n-checkbox>
              </div>
              <n-button type="primary" @click="handleSave">保存当前角色权限</n-button>
            </n-space>
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </n-spin>
  </n-card>
</template>
