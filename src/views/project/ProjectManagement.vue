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
      <n-form-item path="employee_id" label="项目负责人">
        <n-select
          v-model:value="currentProject.employee_id"
          :options="assignableUsers"
          placeholder="请选择负责人"
          filterable
        />
      </n-form-item>
      <n-form-item label="起止日期">
        <n-date-picker v-model:formatted-value="dateRange" type="daterange" clearable />
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
import { getProjects, createProject, updateProject, deleteProject } from "@/api/project";
import { getAllUsers } from "@/api/admin";
import type { Project, User } from "@/types/api";
import { StatusEnum } from "@/types/api";

const message = useMessage();
const userStore = useUserStore();

// State
const loading = ref(true);
const saving = ref(false);
const projects = ref<Project[]>([]);
const allUsers = ref<User[]>([]);
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

const assignableUsers = computed(() =>
  allUsers.value.map((user) => ({ label: user.username, value: user.id }))
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
      currentProject.value.start_date = new Date(val[0]).toISOString();
      currentProject.value.deadline = new Date(val[1]).toISOString();
    } else {
      currentProject.value.start_date = undefined;
      currentProject.value.deadline = undefined;
    }
  },
});

// Functions
const fetchData = async () => {
  loading.value = true;
  try {
    const [projectRes, userRes] = await Promise.all([getProjects(), getAllUsers()]);
    projects.value = projectRes;
    if (userRes && userRes.users) {
      allUsers.value = userRes.users;
    }
  } catch (error) {
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
        fetchData();
      } catch (err) {
        message.error("保存失败");
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
    fetchData();
  } catch (err) {
    message.error("删除失败");
  }
};

// DataTable Columns
const columns: DataTableColumns<Project> = [
  { title: "ID", key: "id", width: 60 },
  { title: "项目名称", key: "name", sorter: "default" },
  { title: "负责人", key: "employee_name", width: 100 },
  { title: "进度", key: "progress", render: (row) => `${row.progress}%`, width: 80 },
  {
    title: "状态",
    key: "status",
    width: 120,
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
  { title: "子项目数", key: "subproject_count", width: 100 },
  {
    title: "操作",
    key: "actions",
    width: 180,
    fixed: "right",
    render(row) {
      const canManage =
        ["SUPER", "ADMIN"].includes(userStore.userRole ?? "") ||
        userStore.userInfo?.id === row.employee_id;
      if (!canManage) return null;

      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", onClick: () => openEditModal(row) },
            { default: () => "编辑" }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id) },
            {
              trigger: () =>
                h(
                  NButton,
                  { size: "small", type: "error", ghost: true },
                  { default: () => "删除" }
                ),
              default: () =>
                "确定要删除这个项目吗？所有相关子项目、阶段和任务都会被删除。",
            }
          ),
        ],
      });
    },
  },
];

const rules = {
  name: { required: true, message: "请输入项目名称", trigger: "blur" },
  status: { required: true, message: "请选择状态", trigger: "change" },
};

onMounted(fetchData);
</script>
