<template>
  <div class="page-container">
    <!-- Debug Info Box -->
    <a-alert
      v-if="currentUser"
      type="info"
      show-icon
      closable
      style="margin-bottom: 16px"
    >
      <template #message>
        <div style="font-family: monospace; font-size: 12px;">
          <p><strong>当前用户信息:</strong> {{ JSON.stringify(currentUser, null, 2) }}</p>
          <p><strong>当前权限列表:</strong> {{ JSON.stringify(permissions, null, 2) }}</p>
          <p><strong>是否包含 'manage_projects' 权限:</strong> {{ hasPermission('manage_projects') }}</p>
          <p><strong>是否包含 'delete_projects' 权限:</strong> {{ hasPermission('delete_projects') }}</p>
          <p><strong>是否包含 'view_users' 权限:</strong> {{ hasPermission('view_users') }}</p>
        </div>
      </template>
    </a-alert>

    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">项目列表</h1>
      <a-button type="primary" @click="openProjectModal()" v-if="hasPermission('manage_projects')">
        <template #icon><PlusOutlined /></template>
        创建新项目
      </a-button>
    </div>

    <!-- Projects Table -->
    <a-card :bordered="false">
      <a-table :columns="columns" :data-source="projects" row-key="id" :loading="loading">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="handleViewDetails(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'progress'">
            <a-progress :percent="record.progress" />
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="handleViewDetails(record)">查看详情</a-button>
              <a-button type="link" @click="openProjectModal(record)" v-if="hasPermission('manage_projects')">编辑</a-button>
              <a-popconfirm
                title="确定要删除这个项目吗？所有相关数据将一并删除。"
                @confirm="handleDeleteProject(record.id)"
                v-if="hasPermission('delete_projects')"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Create/Edit Project Modal -->
    <a-modal
      v-model:open="isModalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      :confirm-loading="modalLoading"
    >
      <a-form ref="formRef" :model="formState" layout="vertical" name="project_form">
        <a-form-item name="name" label="项目名称" :rules="[{ required: true, message: '请输入项目名称' }]">
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item name="description" label="项目描述" :rules="[{ required: true, message: '请输入项目描述' }]">
          <a-textarea v-model:value="formState.description" :rows="4" />
        </a-form-item>
        <a-form-item name="employee_id" label="项目负责人 (组长)" :rules="[{ required: true, message: '请选择一个负责人' }]">
          <a-select v-model:value="formState.employee_id" placeholder="请选择一个负责人" :loading="leaders.length === 0">
            <a-select-option v-for="leader in leaders" :key="leader.id" :value="leader.id">
              {{ leader.username }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item name="start_date" label="开始日期" :rules="[{ required: true, message: '请选择开始日期' }]">
              <a-date-picker v-model:value="formState.start_date" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="deadline" label="截止日期" :rules="[{ required: true, message: '请选择截止日期' }]">
              <a-date-picker v-model:value="formState.deadline" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item name="status" label="项目状态">
          <a-select v-model:value="formState.status" placeholder="请设置项目状态">
            <a-select-option value="PENDING">未开始</a-select-option>
            <a-select-option value="IN_PROGRESS">进行中</a-select-option>
            <a-select-option value="PAUSED">已暂停</a-select-option>
            <a-select-option value="COMPLETED">已完成</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { getProjects, createProject, updateProject, deleteProject } from "@/api/project";
import { getUsers } from "@/api/admin";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";

const store = useStore();
const router = useRouter();
const loading = ref(false);
const projects = ref([]);
const leaders = ref([]);
const isModalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("");
const formRef = ref();
const formState = ref({});
const isEditMode = ref(false);

const currentUser = computed(() => store.state.user.user);
const permissions = computed(() => store.state.user.permissions);
const hasPermission = computed(() => store.getters["user/hasPermission"]);

const fetchProjects = async () => {
  loading.value = true;
  try {
    projects.value = await getProjects();
  } catch (error) {
    message.error("加载项目列表失败");
    console.error("Failed to fetch projects:", error);
  } finally {
    loading.value = false;
  }
};

const fetchLeaders = async () => {
  try {
    const response = await getUsers();
    leaders.value = response.users.filter((user) => user.role === "LEADER");
  } catch (error) {
    message.error("加载负责人列表失败，请确认您有[view_users]权限");
    console.error("Failed to fetch leaders:", error);
  }
};

onMounted(() => {
  fetchProjects();
  // If user can manage projects, they need to be able to select a leader.
  // This requires the 'view_users' permission.
  if (hasPermission.value('manage_projects')) {
    fetchLeaders();
  }
});

const openProjectModal = (project = null) => {
  if (project) {
    isEditMode.value = true;
    modalTitle.value = "编辑项目";
    formState.value = {
      ...project,
      start_date: project.start_date ? dayjs(project.start_date) : null,
      deadline: project.deadline ? dayjs(project.deadline) : null,
    };
  } else {
    isEditMode.value = false;
    modalTitle.value = "创建新项目";
    formState.value = { status: "PENDING" };
  }
  isModalVisible.value = true;
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    modalLoading.value = true;

    const dataToSend = {
      ...formState.value,
      start_date: formState.value.start_date ? formState.value.start_date.toISOString() : null,
      deadline: formState.value.deadline ? formState.value.deadline.toISOString() : null,
    };

    if (isEditMode.value) {
      await updateProject(formState.value.id, dataToSend);
      message.success("项目更新成功");
    } else {
      await createProject(dataToSend);
      message.success("项目创建成功");
    }
    isModalVisible.value = false;
    fetchProjects();
  } catch (error) {
    console.error("表单验证/提交失败：", error);
    message.error("操作失败，请检查表单内容");
  } finally {
    modalLoading.value = false;
  }
};

const handleDeleteProject = async (projectId) => {
  try {
    await deleteProject(projectId);
    message.success("项目已删除");
    fetchProjects();
  } catch (error) {
    message.error("删除项目失败");
  }
};

const handleViewDetails = (project) => {
  router.push(`/project/detail/${project.id}`);
};

const columns = [
  { title: "项目名称", dataIndex: "name", key: "name" },
  { title: "负责人", dataIndex: "employee_name", key: "employee" },
  { title: "进度", dataIndex: "progress", key: "progress", width: "20%" },
  { title: "状态", dataIndex: "status", key: "status" },
  { title: "操作", key: "action", width: "250px" },
];

const getStatusText = (status) => {
  if (!status) return "未知";
  const texts = {
    IN_PROGRESS: "进行中",
    COMPLETED: "已完成",
    PENDING: "未开始",
    PAUSED: "已暂停",
  };
  return texts[status.toUpperCase()] || "未知";
};

const getStatusColor = (status) => {
  if (!status) return "default";
  const colors = {
    IN_PROGRESS: "processing",
    COMPLETED: "success",
    PENDING: "default",
    PAUSED: "warning",
  };
  return colors[status.toUpperCase()] || "default";
};
</script>

<style scoped>
.page-container {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 0;
}
</style>
