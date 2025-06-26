<template>
  <div class="h-full w-full flex flex-col">
    <n-card title="用户管理" :bordered="false" class="flex-1 rounded-lg shadow-md">
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="filteredUsers"
          :pagination="pagination"
          :bordered="false"
        />
      </n-spin>
    </n-card>
  </div>

  <!-- Modals -->
  <n-modal
    v-model:show="showRoleModal"
    preset="card"
    style="width: 450px"
    title="编辑用户角色"
  >
    <p class="mb-4">
      正在为用户 <n-tag type="info">{{ currentUser?.username }}</n-tag> 分配角色。
    </p>
    <n-select v-model:value="selectedRole" :options="roleOptionsForSelect" />
    <template #footer>
      <div class="flex justify-end space-x-2">
        <n-button @click="showRoleModal = false">取消</n-button>
        <n-button type="primary" :loading="savingRole" @click="handleRoleUpdate"
          >保存</n-button
        >
      </div>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showPermissionModal"
    preset="card"
    style="width: 600px"
    title="编辑用户特定权限"
  >
    <p class="mb-4">
      正在为用户 <n-tag type="info">{{ currentUser?.username }}</n-tag> 分配特定权限。
    </p>
    <n-spin :show="loadingUserPermissions">
      <n-scrollbar style="max-height: 50vh">
        <!-- 优化点 1: 使用 render-source-label 展示权限描述 -->
        <n-transfer
          v-if="!loadingUserPermissions"
          ref="transfer"
          v-model:value="userPermissions"
          :options="allPermissionsOptions"
          :render-source-label="renderPermissionLabel"
          :render-target-label="renderPermissionLabel"
          source-filterable
        />
      </n-scrollbar>
    </n-spin>
    <template #footer>
      <div class="flex justify-end space-x-2">
        <n-button @click="showPermissionModal = false">取消</n-button>
        <n-button
          type="primary"
          :loading="savingPermissions"
          @click="handlePermissionsUpdate"
          >保存</n-button
        >
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from "vue";
import {
  NDataTable,
  NButton,
  NCard,
  NSpin,
  useMessage,
  NTag,
  NModal,
  NSelect,
  NTransfer,
  NScrollbar,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { useUserStore } from "@/stores/user";
import {
  getAllUsers,
  getAllPermissions,
  updateUserRole,
  getUserById,
  updateUserPermission,
} from "@/api/admin";
import type { User, Permission } from "@/types/api";

const message = useMessage();
const userStore = useUserStore();

const loading = ref(true);
const allUsers = ref<User[]>([]);
const allPermissions = ref<Permission[]>([]);

const pagination = { pageSize: 10 };

// --- 优化点 2: 创建角色名称到中文的映射 ---
const roleMap: { [key: string]: string } = {
  SUPER: "超管",
  ADMIN: "管理员",
  LEADER: "组长",
  MEMBER: "组员",
};

const showRoleModal = ref(false);
const showPermissionModal = ref(false);
const loadingUserPermissions = ref(false);
const currentUser = ref<User | null>(null);
const selectedRole = ref<string | null>(null);
const originalUserPermissions = ref<string[]>([]);
const userPermissions = ref<string[]>([]);
const savingRole = ref(false);
const savingPermissions = ref(false);

const currentUserRole = computed(() => userStore.userInfo?.role);

const filteredUsers = computed(() => {
  if (currentUserRole.value === "ADMIN") {
    return allUsers.value.filter((user) => user.role !== "SUPER");
  }
  return allUsers.value;
});

// 优化点 2: 在下拉选项中使用中文
const roleOptionsForSelect = computed(() => {
  const allRoles = [
    { label: roleMap.SUPER, value: "SUPER" },
    { label: roleMap.ADMIN, value: "ADMIN" },
    { label: roleMap.LEADER, value: "LEADER" },
    { label: roleMap.MEMBER, value: "MEMBER" },
  ];
  if (currentUserRole.value === "ADMIN") {
    return allRoles.filter((r) => r.value !== "SUPER");
  }
  return allRoles;
});

// 优化点 1: 为穿梭框选项添加 description
const allPermissionsOptions = computed(() =>
  allPermissions.value.map((p) => ({
    label: p.name,
    value: p.name,
    description: p.description, // 将描述信息带上
  }))
);

// 优化点 1: 自定义渲染函数，用于在穿梭框中显示权限描述
const renderPermissionLabel = ({
  option,
}: {
  option: { label: string; value: string; description?: string };
}) => {
  return h("div", null, [
    h("div", null, option.label),
    h("div", { style: "font-size: 12px; color: grey;" }, option.description),
  ]);
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await getAllUsers();
    if (response && response.users) {
      allUsers.value = response.users;
    }
  } catch (error) {
    message.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
  getAllPermissions().then((res) => {
    if (res && Array.isArray(res)) {
      allPermissions.value = res;
    }
  });
});

const editPermissions = async (row: User) => {
  currentUser.value = row;
  showPermissionModal.value = true;
  loadingUserPermissions.value = true;
  try {
    const userInfo = await getUserById(row.id);
    const allowedPerms = userInfo.specific_permissions
      .filter((p) => p.allowed)
      .map((p) => p.name);
    userPermissions.value = [...allowedPerms];
    originalUserPermissions.value = [...allowedPerms];
  } catch (e) {
    message.error("获取用户特定权限失败");
  } finally {
    loadingUserPermissions.value = false;
  }
};

const columns: DataTableColumns<User> = [
  { title: "ID", key: "id", width: 60, sorter: (a, b) => a.id - b.id },
  {
    title: "用户名",
    key: "username",
    sorter: "default",
    ellipsis: { tooltip: true },
  },
  {
    title: "邮箱",
    key: "email",
    ellipsis: { tooltip: true },
  },
  {
    title: "角色",
    key: "role",
    render(row) {
      let tagType: "success" | "warning" | "error" = "success";
      if (row.role === "ADMIN") tagType = "warning";
      if (row.role === "SUPER") tagType = "error";
      // 优化点 2: 在表格中渲染中文角色名
      return h(
        NTag,
        { type: tagType, bordered: false },
        { default: () => roleMap[row.role] || row.role }
      );
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 200,
    fixed: "right",
    render(row) {
      const isTargetSuper = row.role === "SUPER";
      const canNotEdit = currentUserRole.value === "ADMIN" && isTargetSuper;

      return h("div", { class: "space-x-2" }, [
        h(
          NButton,
          {
            size: "small",
            onClick: () => {
              currentUser.value = row;
              selectedRole.value = row.role;
              showRoleModal.value = true;
            },
            disabled: canNotEdit,
          },
          { default: () => "编辑角色" }
        ),
        h(
          NButton,
          {
            size: "small",
            type: "primary",
            ghost: true,
            onClick: () => editPermissions(row),
            disabled: canNotEdit,
          },
          { default: () => "编辑权限" }
        ),
      ]);
    },
  },
];

const handleRoleUpdate = async () => {
  if (!currentUser.value || !selectedRole.value) return;
  savingRole.value = true;
  try {
    await updateUserRole(currentUser.value.id, selectedRole.value);
    message.success("角色更新成功");
    fetchUsers(); // Refresh table
    showRoleModal.value = false;
  } catch (error) {
    message.error("角色更新失败");
  } finally {
    savingRole.value = false;
  }
};

const handlePermissionsUpdate = async () => {
  if (!currentUser.value) return;
  savingPermissions.value = true;
  const added = userPermissions.value.filter(
    (p) => !originalUserPermissions.value.includes(p)
  );
  const removed = originalUserPermissions.value.filter(
    (p) => !originalUserPermissions.value.includes(p)
  );

  const apiCalls = [
    ...added.map((p) =>
      updateUserPermission(currentUser.value!.id, {
        permission_name: p,
        is_allowed: true,
      })
    ),
    ...removed.map((p) =>
      updateUserPermission(currentUser.value!.id, {
        permission_name: p,
        is_allowed: false,
      })
    ),
  ];

  try {
    await Promise.all(apiCalls);
    message.success("用户特定权限更新成功");
    showPermissionModal.value = false;
  } catch (error) {
    message.error("权限更新失败");
  } finally {
    savingPermissions.value = false;
  }
};
</script>
