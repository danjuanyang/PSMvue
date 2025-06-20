<script setup lang="ts">
import { ref, h, onMounted } from "vue";
import {
  NDataTable,
  NButton,
  NSpace,
  useMessage,
  NModal,
  NCard,
  NSelect,
  NDivider,
  NCheckbox,
  NSpin,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import {
  getUsersApi,
  getUserDetailsApi,
  getPermissionsApi,
  updateUserRoleApi,
  modifyUserPermissionApi,
  getRolesApi,
} from "@/api/admin";
import type { User, UserDetails, Permission, Role } from "@/types/api";

const message = useMessage();
const loading = ref(true);
const users = ref<User[]>([]);
const pagination = ref({ page: 1, pageSize: 10, itemCount: 0 });

// 弹窗相关状态
const showModal = ref(false);
const modalLoading = ref(false);
const selectedUser = ref<UserDetails | null>(null);
const allPermissions = ref<Permission[]>([]);
const allRoles = ref<Role[]>([]);
const selectedRole = ref<string | null>(null);
const userPermissions = ref<Record<string, boolean>>({});

const columns: DataTableColumns<User> = [
  { title: "ID", key: "id", width: 80 },
  { title: "用户名", key: "username" },
  { title: "邮箱", key: "email" },
  { title: "角色", key: "role" },
  {
    title: "操作",
    key: "actions",
    render(row) {
      return h(
        NButton,
        {
          size: "small",
          onClick: () => handleManageClick(row),
        },
        { default: () => "管理" }
      );
    },
  },
];

const fetchUsers = async (page = 1, pageSize = 10) => {
  loading.value = true;
  try {
    const data: any = await getUsersApi({ page: page, per_page: pageSize });
    users.value = data.users;
    pagination.value.itemCount = data.total_users;
    pagination.value.page = data.current_page;
  } catch (error) {
    message.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

const handleManageClick = async (user: User) => {
  showModal.value = true;
  modalLoading.value = true;
  try {
    const [userDetails, permissions, roles] = await Promise.all([
      getUserDetailsApi(user.id),
      getPermissionsApi(),
      getRolesApi(),
    ]);
    selectedUser.value = userDetails;
    selectedRole.value = userDetails.role;
    allPermissions.value = permissions;
    allRoles.value = roles.map((r) => ({ ...r, label: r.name, value: r.name }));

    // 初始化用户特定权限的 Record
    const perms: Record<string, boolean> = {};
    permissions.forEach((p) => {
      const userPerm = userDetails.specific_permissions.find((up) => up.name === p.name);
      perms[p.name] = userPerm ? userPerm.allowed : false; // 默认为 false
    });
    userPermissions.value = perms;
  } catch (error) {
    message.error("获取用户详情失败");
    showModal.value = false;
  } finally {
    modalLoading.value = false;
  }
};

const handleRoleSave = async () => {
  if (!selectedUser.value || !selectedRole.value) return;
  modalLoading.value = true;
  try {
    await updateUserRoleApi(selectedUser.value.id, selectedRole.value);
    message.success("用户角色更新成功");
    fetchUsers(pagination.value.page, pagination.value.pageSize); // 刷新列表
  } catch (error) {
    message.error("更新角色失败");
  } finally {
    modalLoading.value = false;
  }
};

const handlePermissionSave = async () => {
  if (!selectedUser.value) return;
  modalLoading.value = true;
  try {
    const promises = Object.entries(userPermissions.value).map(([name, allowed]) =>
      modifyUserPermissionApi(selectedUser.value!.id, name, allowed)
    );
    await Promise.all(promises);
    message.success("用户特定权限更新成功");
    showModal.value = false;
  } catch (error) {
    message.error("更新权限失败");
  } finally {
    modalLoading.value = false;
  }
};

const handlePageChange = (page: number) => {
  fetchUsers(page, pagination.value.pageSize);
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <n-card title="用户管理">
    <n-data-table
      :columns="columns"
      :data="users"
      :loading="loading"
      :pagination="pagination"
      :remote="true"
      @update:page="handlePageChange"
    />
  </n-card>

  <n-modal v-model:show="showModal" :mask-closable="false">
    <n-card
      style="width: 600px"
      :title="`管理用户 - ${selectedUser?.username}`"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <n-spin :show="modalLoading">
        <n-space vertical>
          <!-- 角色管理 -->
          <h3>角色分配</h3>
          <n-select v-model:value="selectedRole" :options="allRoles" />
          <n-button type="primary" @click="handleRoleSave">保存角色</n-button>
          <n-divider />

          <!-- 特定权限管理 -->
          <h3>特定权限</h3>
          <n-space item-style="display: flex;">
            <n-checkbox
              v-for="perm in allPermissions"
              :key="perm.id"
              v-model:checked="userPermissions[perm.name]"
            >
              {{ perm.description }} ({{ perm.name }})
            </n-checkbox>
          </n-space>
          <n-button type="primary" @click="handlePermissionSave" class="mt-4"
            >保存权限</n-button
          >
        </n-space>
      </n-spin>
    </n-card>
  </n-modal>
</template>
