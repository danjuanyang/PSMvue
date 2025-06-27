<template>
  <div class="h-full w-full flex flex-col">
    <n-card title="项目管理" :bordered="false" class="rounded-lg shadow-md">
      <template #header-extra>
        <n-button type="primary" @click="openCreateModal" v-if="canCreateProject">
          创建项目
        </n-button>
      </template>
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="projects"
          :pagination="pagination"
          :bordered="false"
        />
      </n-spin>
    </n-card>
  </div>

  <!-- 创建/编辑项目 Modal -->
  <n-modal
    v-model:show="showModal"
    preset="card"
    :style="{ width: '600px' }"
    :title="modalTitle"
  >
    <n-form ref="formRef" :model="currentProject" :rules="rules">
      <n-form-item path="name" label="项目名称">
        <n-input v-model:value="currentProject.name" placeholder="请输入项目名称" />
      </n-form-item>
      <n-form-item path="description" label="项目描述">
        <n-input
          v-model:value="currentProject.description"
          type="textarea"
          placeholder="请输入项目描述"
        />
      </n-form-item>
      <n-form-item path="employee_id" label="项目负责人 (组长)">
        <n-select
          v-model:value="currentProject.employee_id"
          :options="leaderOptions"
          placeholder="请选择负责人"
          filterable
          clearable
        />
      </n-form-item>
      <n-form-item label="起止日期">
        <n-date-picker v-model:value="dateRange" type="daterange" clearable />
      </n-form-item>
      <n-form-item path="status" label="状态">
        <n-select v-model:value="currentProject.status" :options="statusOptions" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" class="ml-2" :loading="saving" @click="handleSave"
          >保存</n-button
        >
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NDataTable,
  NCard,
  NSpin,
  useMessage,
  NTag,
  NSpace,
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
} from "naive-ui";
import type { DataTableColumns, FormInst } from "naive-ui";
import { useUserStore } from "@/stores/user";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getUsersByRole,
} from "@/api/project";
import type { Project, User } from "@/types/api";
import { StatusEnum } from "@/types/api";

const message = useMessage();
const userStore = useUserStore();
const router = useRouter();

// State
const loading = ref(true);
const saving = ref(false);
const projects = ref<Project[]>([]);
const leaders = ref<Partial<User>[]>([]);
const pagination = { pageSize: 10 };

// Modal
const showModal = ref(false);
const isEditing = ref(false);
const formRef = ref<FormInst | null>(null);
const currentProject = ref<Partial<Project>>({});

// Computed
const modalTitle = computed(() => (isEditing.value ? "编辑项目" : "创建新项目"));
const canCreateProject = computed(() =>
  ["SUPER", "ADMIN"].includes(userStore.userRole ?? "")
);
const leaderOptions = computed(() =>
  leaders.value.map((user) => ({ label: user.username, value: user.id }))
);
const statusOptions = Object.values(StatusEnum).map((s) => ({ label: s, value: s }));

const dateRange = computed({
  get: () => {
    if (currentProject.value.start_date && currentProject.value.deadline) {
      return [
        new Date(currentProject.value.start_date).getTime(),
        new Date(currentProject.value.deadline).getTime(),
      ];
    }
    return null;
  },
  set: (val) => {
    if (val) {
      currentProject.value.start_date = new Date(val[0]).toISOString().split("T")[0];
      currentProject.value.deadline = new Date(val[1]).toISOString().split("T")[0];
    } else {
      currentProject.value.start_date = undefined;
      currentProject.value.deadline = undefined;
    }
  },
});

// Functions
const fetchInitialData = async () => {
  loading.value = true;
  try {
    const promises = [getProjects()];
    if (canCreateProject.value) {
      promises.push(getUsersByRole("LEADER"));
    }

    const [projectRes, leaderRes] = await Promise.all(promises);
    projects.value = projectRes;
    if (leaderRes) {
      leaders.value = leaderRes;
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    message.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentProject.value = {
    name: "",
    description: "",
    status: StatusEnum.PENDING,
    progress: 0,
  };
  showModal.value = true;
};

const openEditModal = (project: Project) => {
  isEditing.value = true;
  currentProject.value = { ...project };
  showModal.value = true;
};

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      saving.value = true;
      try {
        if (isEditing.value) {
          await updateProject(currentProject.value.id!, currentProject.value);
          message.success("更新成功");
        } else {
          await createProject(currentProject.value);
          message.success("创建成功");
        }
        showModal.value = false;
        fetchInitialData();
      } catch (err: any) {
        message.error(err.response?.data?.error || "保存失败");
      } finally {
        saving.value = false;
      }
    }
  });
};

const handleDelete = async (id: number) => {
  try {
    await deleteProject(id);
    message.success("删除成功");
    fetchInitialData();
  } catch (err) {
    message.error("删除失败");
  }
};

const viewProjectDetails = (projectId: number) => {
  router.push({ name: "project-detail", params: { id: projectId } });
};

// DataTable Columns
const columns: DataTableColumns<Project> = [
  { title: "ID", key: "id", width: 60, sorter: "default" },
  { title: "项目名称", key: "name", sorter: "default" },
  { title: "负责人", key: "employee_name", width: 100, sorter: "default" },
  {
    title: "进度",
    key: "progress",
    width: 80,
    render: (row) => `${row.progress}%`,
    sorter: (a, b) => a.progress - b.progress,
  },
  {
    title: "状态",
    key: "status",
    width: 120,
    sorter: (a, b) => a.status.localeCompare(b.status),
    render(row) {
      const type = {
        PENDING: "default",
        IN_PROGRESS: "info",
        COMPLETED: "success",
        CANCELLED: "error",
      }[row.status];
      return h(
        NTag,
        { type: type as any, bordered: false },
        { default: () => row.status }
      );
    },
  },
  {
    title: "子项目数",
    key: "subproject_count",
    width: 100,
    sorter: (a, b) => a.subproject_count - b.subproject_count,
  },
  {
    title: "操作",
    key: "actions",
    width: 220,
    fixed: "right",
    render(row) {
      const isAdmin = ["SUPER", "ADMIN"].includes(userStore.userRole ?? "");
      const isLeader =
        userStore.userRole === "LEADER" && userStore.userInfo?.id === row.employee_id;

      const viewBtn = h(
        NButton,
        { size: "small", type: "info", onClick: () => viewProjectDetails(row.id) },
        { default: () => "查看详情" }
      );
      const editBtn = isAdmin
        ? h(
            NButton,
            { size: "small", onClick: () => openEditModal(row) },
            { default: () => "编辑" }
          )
        : null;
      const deleteBtn = isAdmin
        ? h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id) },
            {
              trigger: () =>
                h(
                  NButton,
                  { size: "small", type: "error", ghost: true },
                  { default: () => "删除" }
                ),
              default: () => "确定要删除这个项目吗？",
            }
          )
        : null;

      return h(NSpace, null, {
        default: () => [viewBtn, editBtn, deleteBtn].filter(Boolean),
      });
    },
  },
];

const rules = {
  name: { required: true, message: "请输入项目名称", trigger: "blur" },
  status: { required: true, message: "请选择状态", trigger: "change" },
};

onMounted(fetchInitialData);
</script>
