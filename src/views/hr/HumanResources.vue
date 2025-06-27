<template>
  <n-card title="人力资源管理" :bordered="false" class="h-full">
    <n-tabs type="line" animated>
      <!-- Tab 1: 团队管理 -->
      <n-tab-pane name="team-management" tab="团队管理">
        <n-data-table
          :columns="teamColumns"
          :data="users"
          :loading="loading.teams"
          :pagination="{ pageSize: 15 }"
        />
      </n-tab-pane>

      <!-- Tab 2: 补卡记录 -->
      <n-tab-pane name="clock-in" tab="补卡记录查询">
        <n-space class="mb-4">
          <n-select
            v-model:value="filters.clockIn.userId"
            :options="filteredUserOptions"
            placeholder="按员工筛选"
            clearable
            filterable
            style="width: 200px"
          />
          <n-date-picker
            v-model:formatted-value="filters.clockIn.month"
            type="month"
            format="yyyy-MM"
            value-format="yyyy-MM"
            clearable
          />
          <n-button type="primary" @click="fetchClockInRecords" :loading="loading.clockIn"
            >查询</n-button
          >
        </n-space>
        <n-data-table
          :columns="clockInColumns"
          :data="clockInRecords"
          :loading="loading.clockIn"
          :pagination="{ pageSize: 15 }"
        />
      </n-tab-pane>

      <!-- Tab 3: 进度更新记录 -->
      <n-tab-pane name="progress-updates" tab="进度更新记录">
        <n-space class="mb-4">
          <n-select
            v-model:value="filters.progress.recorderId"
            :options="filteredUserOptions"
            placeholder="按员工筛选"
            clearable
            filterable
            style="width: 200px"
          />
          <n-select
            v-model:value="filters.progress.period"
            :options="periodOptions"
            placeholder="选择时间范围"
            style="width: 150px"
            clearable
          />
          <n-button
            type="primary"
            @click="fetchProgressUpdates"
            :loading="loading.progress"
            >查询</n-button
          >
        </n-space>
        <n-data-table
          :columns="progressUpdatesColumns"
          :data="progressUpdates"
          :loading="loading.progress"
          :pagination="{ pageSize: 15 }"
        />
      </n-tab-pane>
    </n-tabs>

    <!-- 设置组长 Modal -->
    <n-modal
      v-model:show="showAssignModal"
      preset="card"
      title="设置组长"
      style="width: 450px"
    >
      <p class="mb-4">
        为 <n-tag type="info">{{ selectedUser?.username }}</n-tag> 分配一位组长:
      </p>
      <n-select
        v-model:value="selectedLeaderId"
        :options="leaderOptions"
        placeholder="请选择组长"
        filterable
      />
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showAssignModal = false">取消</n-button>
          <n-button type="primary" @click="handleAssignLeader" :loading="saving"
            >确认分配</n-button
          >
        </div>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";
import {
  NCard,
  NTabs,
  NTabPane,
  NDataTable,
  NSpace,
  NSelect,
  NDatePicker,
  NButton,
  NPopconfirm,
  NTag,
  NModal,
  NEllipsis,
  useMessage,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { useUserStore } from "@/stores/user";
// **关键修改**: 引入新的API函数，不再需要 admin API
import {
  assignLeader,
  promoteToLeader,
  getClockInRecords,
  getTaskProgressUpdates,
  getTeamOverview,
} from "@/api/hr";
import type { UserWithLeader, ClockInRecord, ProgressUpdateRecord } from "@/types/api";

const message = useMessage();
const userStore = useUserStore();

// --- State ---
const loading = ref({
  teams: true,
  clockIn: false,
  progress: false,
});
const saving = ref(false);
const users = ref<UserWithLeader[]>([]);
const leaders = ref<UserWithLeader[]>([]);
const clockInRecords = ref<ClockInRecord[]>([]);
const progressUpdates = ref<ProgressUpdateRecord[]>([]);

// --- Filters ---
const filters = ref({
  clockIn: {
    userId: null as number | null,
    month: null as string | null,
  },
  progress: {
    recorderId: null as number | null,
    period: null as "day" | "week" | "month" | null,
  },
});

// --- Modal state ---
const showAssignModal = ref(false);
const selectedUser = ref<UserWithLeader | null>(null);
const selectedLeaderId = ref<number | null>(null);

// --- Computed ---

const roleHierarchy = {
  SUPER: 0,
  ADMIN: 1,
  LEADER: 2,
  MEMBER: 3,
};

const filteredUserOptions = computed(() => {
  if (!userStore.userRole) return [];
  const currentUserLevel =
    roleHierarchy[userStore.userRole as keyof typeof roleHierarchy];

  return users.value
    .filter((u) => {
      const userLevel = roleHierarchy[u.role as keyof typeof roleHierarchy];
      return userLevel > currentUserLevel;
    })
    .map((u) => ({ label: u.username, value: u.id }));
});

const leaderOptions = computed(() =>
  leaders.value.map((u) => ({ label: u.username, value: u.id }))
);
const periodOptions = [
  { label: "今天", value: "day" },
  { label: "本周", value: "week" },
  { label: "本月", value: "month" },
];

// --- Functions ---
const fetchTeamData = async () => {
  loading.value.teams = true;
  try {
    // **关键修改**: 调用新的接口
    const res = await getTeamOverview();
    // **关键修改**: 新接口直接返回数组，无需 .users
    users.value = res;
    leaders.value = users.value.filter((u) => u.role === "LEADER");
  } catch (error) {
    message.error("获取团队列表失败");
  } finally {
    loading.value.teams = false;
  }
};

const fetchClockInRecords = async () => {
  loading.value.clockIn = true;
  try {
    const params: { userId?: number; year?: number; month?: number } = {};
    if (filters.value.clockIn.userId) params.userId = filters.value.clockIn.userId;
    if (filters.value.clockIn.month) {
      const [year, month] = filters.value.clockIn.month.split("-").map(Number);
      params.year = year;
      params.month = month;
    }
    clockInRecords.value = await getClockInRecords(params);
  } catch (error) {
    message.error("查询补卡记录失败");
  } finally {
    loading.value.clockIn = false;
  }
};

const fetchProgressUpdates = async () => {
  loading.value.progress = true;
  try {
    const params: any = {};
    if (filters.value.progress.recorderId)
      params.recorderId = filters.value.progress.recorderId;
    if (filters.value.progress.period) params.period = filters.value.progress.period;
    progressUpdates.value = await getTaskProgressUpdates(params);
  } catch (error) {
    message.error("查询进度更新记录失败");
  } finally {
    loading.value.progress = false;
  }
};

const openAssignLeaderModal = (user: UserWithLeader) => {
  selectedUser.value = user;
  selectedLeaderId.value = user.team_leader_id;
  showAssignModal.value = true;
};

const handleAssignLeader = async () => {
  if (!selectedUser.value || !selectedLeaderId.value) {
    message.warning("请选择一位组长");
    return;
  }
  saving.value = true;
  try {
    await assignLeader(selectedUser.value.id, selectedLeaderId.value);
    message.success("分配成功");
    showAssignModal.value = false;
    await fetchTeamData(); // Refresh list
  } catch (error) {
    message.error("分配失败");
  } finally {
    saving.value = false;
  }
};

const handlePromoteToLeader = async (user: UserWithLeader) => {
  try {
    await promoteToLeader(user.id);
    message.success(`${user.username} 已提升为组长`);
    await fetchTeamData(); // Refresh list
  } catch (error) {
    message.error("提升失败");
  }
};

// --- DataTable Columns ---
const teamColumns: DataTableColumns<UserWithLeader> = [
  { title: "ID", key: "id", width: 80 },
  { title: "用户名", key: "username" },
  { title: "邮箱", key: "email" },
  {
    title: "角色",
    key: "role",
    render: (row) =>
      h(
        NTag,
        { type: row.role === "LEADER" ? "success" : "default" },
        { default: () => row.role }
      ),
  },
  { title: "所属组长", key: "leader_name", render: (row) => row.leader_name || "N/A" },
  {
    title: "操作",
    key: "actions",
    render(row) {
      if (row.role === "MEMBER") {
        return h(
          NSpace,
          {},
          {
            default: () => [
              h(
                NButton,
                {
                  size: "small",
                  type: "primary",
                  ghost: true,
                  onClick: () => openAssignLeaderModal(row),
                },
                { default: () => "设置组长" }
              ),
              h(
                NPopconfirm,
                { onPositiveClick: () => handlePromoteToLeader(row) },
                {
                  trigger: () =>
                    h(NButton, { size: "small" }, { default: () => "提升为组长" }),
                  default: () => `确定要将 ${row.username} 提升为组长吗？`,
                }
              ),
            ],
          }
        );
      }
      return null;
    },
  },
];

const clockInColumns: DataTableColumns<ClockInRecord> = [
  { title: "员工", key: "employee_name" },
  {
    title: "补卡日期",
    key: "clockin_date",
    render: (row) => new Date(row.clockin_date).toLocaleDateString(),
  },
  { title: "星期", key: "weekday" },
  { title: "备注", key: "remarks", ellipsis: { tooltip: true } },
  {
    title: "创建时间",
    key: "created_at",
    render: (row) => new Date(row.created_at).toLocaleString(),
  },
];

const progressUpdatesColumns: DataTableColumns<ProgressUpdateRecord> = [
  { title: "记录人", key: "recorder_name" },
  {
    title: "项目",
    key: "task_info.project",
    render: (row) => h(NEllipsis, null, { default: () => row.task_info.project }),
  },
  {
    title: "任务",
    key: "task_info.name",
    render: (row) => h(NEllipsis, null, { default: () => row.task_info.name }),
  },
  { title: "更新内容", key: "description", ellipsis: { tooltip: true } },
  { title: "进度", key: "progress", render: (row) => `${row.progress}%` },
  {
    title: "更新时间",
    key: "created_at",
    render: (row) => new Date(row.created_at).toLocaleString(),
  },
];

onMounted(() => {
  fetchTeamData();
  fetchClockInRecords();
  fetchProgressUpdates();
});
</script>
