<template>
  <div class="permission-page-container">
    <div class="page-header">
      <h1 class="page-title">权限与团队管理</h1>
      <p class="page-subtitle">管理系统中的用户、角色、权限和团队分配</p>
    </div>

    <a-tabs v-model:activeKey="activeTabKey" @change="handleTabChange">
      <!-- 用户管理 Tab -->
      <a-tab-pane key="users" tab="用户管理">
        <a-card :bordered="false">
          <a-table
            :columns="userColumns"
            :data-source="filteredUsers"
            row-key="id"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'role'">
                <a-tag :color="getRoleTagColor(record.role)">{{ record.role }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="primary" size="small" @click="openRoleModal(record)"
                    >修改角色</a-button
                  >
                  <a-button size="small" @click="openPermissionModal(record)"
                    >用户权限</a-button
                  >
                  <a-popconfirm
                    title="确定要重置此用户的密码吗？新密码将弹窗显示。"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="handleResetPassword(record.id)"
                  >
                    <a-button type="dashed" danger size="small">重置密码</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 角色管理 Tab -->
      <a-tab-pane key="roles" tab="角色管理">
        <a-card :bordered="false">
          <p>选择一个角色以查看或编辑其默认权限。</p>
          <a-select
            v-model:value="selectedRole"
            style="width: 200px; margin-bottom: 20px"
            placeholder="请选择角色"
            @change="handleRoleChange"
          >
            <a-select-option
              v-for="role in editableRoles"
              :key="role.name"
              :value="role.name"
            >
              {{ role.name }}
            </a-select-option>
          </a-select>

          <div v-if="selectedRole">
            <a-table
              :columns="rolePermissionColumns"
              :data-source="rolePermissions"
              row-key="name"
              :pagination="false"
              :loading="loading"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'allowed'">
                  <a-switch
                    v-model:checked="record.allowed"
                    @change="updateRolePermission(record)"
                  />
                </template>
              </template>
            </a-table>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- 新增：团队管理 Tab -->
      <a-tab-pane key="teams" tab="团队管理">
        <a-card :bordered="false">
          <a-collapse v-model:activeKey="activeTeamKey" accordion>
            <a-collapse-panel
              v-for="team in teams"
              :key="team.leader.id"
              :header="`组长: ${team.leader.username}`"
            >
              <template #extra>
                <a-button
                  type="primary"
                  size="small"
                  @click.stop="openAssignMemberModal(team.leader)"
                >
                  <UserAddOutlined /> 添加组员
                </a-button>
              </template>
              <a-list
                item-layout="horizontal"
                :data-source="team.members"
                :row-key="(item) => item.id"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta
                      :title="item.username"
                      :description="`邮箱: ${item.email}`"
                    >
                      <template #avatar
                        ><a-avatar style="background-color: #87d068"
                          ><UserOutlined /></a-avatar
                      ></template>
                    </a-list-item-meta>
                    <template #actions>
                      <a-popconfirm
                        title="确定要将该成员移出团队吗？"
                        @confirm="handleRemoveMember(item)"
                      >
                        <a-button type="link" danger size="small">移除</a-button>
                      </a-popconfirm>
                    </template>
                  </a-list-item>
                </template>
              </a-list>
              <a-empty v-if="team.members.length === 0" description="该团队暂无成员" />
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- (已有Modal保持不变) -->
    <a-modal
      v-model:open="isRoleModalVisible"
      title="修改用户角色"
      @ok="handleUpdateRole"
    >
      <p>
        正在为用户 <strong>{{ currentUser.username }}</strong> 修改角色。
      </p>
      <a-select v-model:value="newUserRole" style="width: 100%">
        <a-select-option
          v-for="role in editableRoles"
          :key="role.name"
          :value="role.name"
        >
          {{ role.name }}
        </a-select-option>
      </a-select>
    </a-modal>
    <a-modal
      v-model:open="isPermissionModalVisible"
      :title="`管理 ${currentUser.username} 的特定权限`"
      width="600px"
      @ok="isPermissionModalVisible = false"
    >
      <a-table
        :columns="userPermissionColumns"
        :data-source="userSpecificPermissions"
        row-key="name"
        :pagination="false"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'allowed'"
            ><a-switch
              v-model:checked="record.allowed"
              @change="updateUserPermission(record)"
          /></template>
        </template>
      </a-table>
    </a-modal>

    <!-- 新增：分配组员 Modal -->
    <a-modal
      v-model:open="isAssignMemberModalVisible"
      :title="`为组长 ${currentLeader.username} 分配组员`"
      @ok="handleAssignMembers"
    >
      <p>请选择要添加到该团队的未分配组员：</p>
      <a-select
        v-model:value="selectedMembersToAssign"
        mode="multiple"
        style="width: 100%"
        placeholder="选择组员"
        :options="unassignedMembers.map((m) => ({ label: m.username, value: m.id }))"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import {
  getUsers,
  updateUserRole,
  resetUserPassword,
  getAllPermissions,
  getUserDetails,
  modifyUserPermission,
  getRoles,
  getRolePermissions,
  updateRolePermissions,
  getTeamOverview,
  assignLeader,
} from "@/api/admin";
import { message, Modal } from "ant-design-vue";
import { UserOutlined, UserAddOutlined } from "@ant-design/icons-vue";

// --- State and Store ---
const store = useStore();
const activeTabKey = ref("users");
const loading = ref(false);

// User Management State
const allSystemUsers = ref([]); // 用于团队管理的数据源
const isRoleModalVisible = ref(false);
const isPermissionModalVisible = ref(false);
const currentUser = ref({});
const newUserRole = ref("");

// Permission Management State
const allPermissions = ref([]);
const userSpecificPermissions = ref([]);

// Role Management State
const allRoles = ref([]);
const selectedRole = ref(null);
const rolePermissions = ref([]);

// Team Management State
const activeTeamKey = ref(null);
const isAssignMemberModalVisible = ref(false);
const currentLeader = ref({});
const selectedMembersToAssign = ref([]);

// --- Computed Properties ---
const userRole = computed(() => store.getters["user/userRole"]);
const filteredUsers = computed(() => {
  if (userRole.value === "ADMIN") {
    return allSystemUsers.value.filter((u) => u.role !== "SUPER");
  }
  return allSystemUsers.value;
});
const editableRoles = computed(() => allRoles.value.filter((r) => r.name !== "SUPER"));
const teams = computed(() => {
  const leaders = allSystemUsers.value.filter((u) => u.role === "LEADER");
  return leaders.map((leader) => ({
    leader,
    members: allSystemUsers.value.filter((u) => u.team_leader_id === leader.id),
  }));
});
const unassignedMembers = computed(() => {
  return allSystemUsers.value.filter((u) => u.role === "MEMBER" && !u.team_leader_id);
});

// --- Methods ---

// Data Fetching
const fetchAllSystemUsers = async () => {
  loading.value = true;
  try {
    // 根据当前Tab决定加载什么数据
    if (activeTabKey.value === "users") {
      allSystemUsers.value = (await getUsers()).users;
    } else if (activeTabKey.value === "teams") {
      allSystemUsers.value = await getTeamOverview();
    }
  } catch (error) {
    message.error("加载用户数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAllSystemUsers();
  fetchAllPermissions();
  fetchAllRoles();
});

const handleTabChange = (key) => {
  if (key === "users" || key === "teams") {
    fetchAllSystemUsers();
  }
};

// User Role Management (保持不变)
const openRoleModal = (user) => {
  currentUser.value = user;
  newUserRole.value = user.role;
  isRoleModalVisible.value = true;
};
const handleUpdateRole = async () => {
  try {
    await updateUserRole(currentUser.value.id, newUserRole.value);
    message.success(`用户 ${currentUser.value.username} 的角色已更新`);
    isRoleModalVisible.value = false;
    fetchAllSystemUsers();
  } catch (error) {
    message.error("更新角色失败");
  }
};

// Reset Password (保持不变)
const handleResetPassword = async (userId) => {
  try {
    const response = await resetUserPassword(userId);
    Modal.success({
      title: "密码重置成功",
      content: `新密码为: ${response.new_password}`,
    });
  } catch (error) {
    message.error("重置密码失败");
  }
};

// User Permission Management (保持不变)
const openPermissionModal = async (user) => {
  currentUser.value = user;
  isPermissionModalVisible.value = true;
  loading.value = true;
  try {
    const details = await getUserDetails(user.id);
    const specificPermsMap = new Map(
      details.specific_permissions.map((p) => [p.name, p.allowed])
    );
    userSpecificPermissions.value = allPermissions.value.map((p) => ({
      ...p,
      allowed: specificPermsMap.has(p.name) ? specificPermsMap.get(p.name) : false,
    }));
  } catch (error) {
    message.error("加载用户权限失败");
  } finally {
    loading.value = false;
  }
};
const updateUserPermission = async (permission) => {
  try {
    await modifyUserPermission(currentUser.value.id, permission.name, permission.allowed);
    message.success(`权限 ${permission.name} 已更新`);
  } catch (error) {
    message.error("更新权限失败");
    permission.allowed = !permission.allowed;
  }
};

// Role Permission Management (保持不变)
const handleRoleChange = async (roleName) => {
  if (!roleName) {
    rolePermissions.value = [];
    return;
  }
  loading.value = true;
  try {
    const rolePerms = await getRolePermissions(roleName);
    const rolePermsMap = new Map(rolePerms.map((p) => [p.name, p.allowed]));
    rolePermissions.value = allPermissions.value.map((p) => ({
      ...p,
      allowed: rolePermsMap.has(p.name) ? rolePermsMap.get(p.name) : false,
    }));
  } catch (error) {
    message.error(`加载角色 ${roleName} 的权限失败`);
  } finally {
    loading.value = false;
  }
};
const updateRolePermission = async (permission) => {
  const originalState = !permission.allowed;
  try {
    const permissionsToUpdate = rolePermissions.value.map((p) => ({
      name: p.name,
      is_allowed: p.allowed,
    }));
    await updateRolePermissions(selectedRole.value, permissionsToUpdate);
    message.success(`角色 ${selectedRole.value} 的权限已更新`);
  } catch (error) {
    message.error("更新角色权限失败");
    permission.allowed = originalState;
  }
};

// --- 新增：Team Management Methods ---
const openAssignMemberModal = (leader) => {
  currentLeader.value = leader;
  selectedMembersToAssign.value = [];
  isAssignMemberModalVisible.value = true;
};

const handleAssignMembers = async () => {
  if (selectedMembersToAssign.value.length === 0) {
    message.warn("请至少选择一个组员");
    return;
  }
  const promises = selectedMembersToAssign.value.map((memberId) =>
    assignLeader(memberId, currentLeader.value.id)
  );
  try {
    await Promise.all(promises);
    message.success("组员分配成功");
    isAssignMemberModalVisible.value = false;
    fetchAllSystemUsers(); // 刷新团队数据
  } catch (error) {
    message.error("分配失败");
  }
};

const handleRemoveMember = async (member) => {
  try {
    await assignLeader(member.id, null); // 传 null 来移除组长
    message.success(`已将 ${member.username} 移出团队`);
    fetchAllSystemUsers(); // 刷新团队数据
  } catch (error) {
    message.error("移除失败");
  }
};

// --- Table Columns ---
const userColumns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "用户名", dataIndex: "username", key: "username" },
  { title: "邮箱", dataIndex: "email", key: "email" },
  { title: "角色", dataIndex: "role", key: "role" },
  { title: "操作", key: "action" },
];
const userPermissionColumns = [
  { title: "权限名称", dataIndex: "name", key: "name" },
  { title: "描述", dataIndex: "description", key: "description" },
  { title: "是否允许", key: "allowed" },
];
const rolePermissionColumns = [
  { title: "权限名称", dataIndex: "name", key: "name" },
  { title: "描述", dataIndex: "description", key: "description" },
  { title: "默认状态", key: "allowed" },
];

// --- Helper Functions ---
const getRoleTagColor = (role) =>
  ({ SUPER: "gold", ADMIN: "cyan", LEADER: "blue", MEMBER: "default" }[role] ||
  "default");
const fetchAllPermissions = async () => {
  try {
    allPermissions.value = await getAllPermissions();
  } catch (error) {
    message.error("加载权限列表失败");
  }
};
const fetchAllRoles = async () => {
  try {
    allRoles.value = await getRoles();
  } catch (error) {
    message.error("加载角色列表失败");
  }
};
</script>

<style scoped>
.permission-page-container {
  padding: 24px;
  background: #f0f2f5;
}
.page-header {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}
.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}
</style>
