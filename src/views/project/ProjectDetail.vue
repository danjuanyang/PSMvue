<template>
  <div class="page-container">
    <!-- 全局加载指示器 -->
    <div v-if="loading" class="loading-spinner">
      <a-spin size="large" />
    </div>

    <!-- 修复：使用 v-if 确保在 project.id 存在时才渲染 -->
    <div v-if="!loading && project.id">
      <!-- 面包屑导航和头部 -->
      <a-page-header
        :title="project.name"
        class="page-header"
        @back="() => router.push('/projects')"
      >
        <template #extra>
          <a-button key="1" type="primary" @click="openSubprojectModal()" v-if="isLeader">
            <PlusOutlined /> 创建子项目
          </a-button>
        </template>
        <a-descriptions size="small" :column="3">
          <a-descriptions-item label="负责人">{{
            project.employee_name || "未分配"
          }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(project.status)">{{
              getStatusText(project.status)
            }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="截止日期">{{
            project.deadline ? dayjs(project.deadline).format("YYYY-MM-DD") : "N/A"
          }}</a-descriptions-item>
          <a-descriptions-item label="项目描述">{{
            project.description
          }}</a-descriptions-item>
        </a-descriptions>
        <a-row style="margin-top: 16px">
          <a-col :span="24">
            <span>总进度</span>
            <a-progress :percent="project.progress" />
          </a-col>
        </a-row>
      </a-page-header>

      <!-- 子项目和阶段任务区域 -->
      <div class="content-area">
        <a-collapse v-model:activeKey="activeSubprojectKey" accordion>
          <a-collapse-panel
            v-for="subproject in subprojects"
            :key="subproject.id"
            :header="subproject.name"
          >
            <template #extra>
              <a-space>
                <a-tag>负责人: {{ subproject.employee_name || "未分配" }}</a-tag>
                <a-progress type="circle" :percent="subproject.progress" :width="35" />
                <a-button
                  size="small"
                  @click.stop="openStageModal(subproject.id)"
                  v-if="canManageSubproject(subproject)"
                  >创建阶段</a-button
                >
              </a-space>
            </template>

            <a-timeline>
              <a-timeline-item v-for="stage in subproject.stages" :key="stage.id">
                <h4>{{ stage.name }} ({{ stage.progress }}%)</h4>
                <a-list size="small" :data-source="stage.tasks">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta :description="item.description">
                        <template #title>
                          <a-space>
                            <span>{{ item.name }}</span>
                            <a-tag :color="getStatusColor(item.status)">{{
                              getStatusText(item.status)
                            }}</a-tag>
                          </a-space>
                        </template>
                      </a-list-item-meta>
                      <template #actions>
                        <a-popover
                          title="更新进度"
                          trigger="click"
                          @openChange="(visible) => onProgressPopoverOpen(visible, item)"
                        >
                          <template #content>
                            <a-input-number
                              v-model:value="item.newProgress"
                              :min="item.progress"
                              :max="100"
                              addon-after="%"
                            />
                            <a-textarea
                              v-model:value="item.newDesc"
                              placeholder="必填：更新说明"
                              style="margin-top: 10px"
                              :rows="2"
                            />
                            <a-button
                              type="primary"
                              size="small"
                              @click="handleUpdateProgress(item)"
                              style="margin-top: 10px"
                              >提交</a-button
                            >
                          </template>
                          <a-button type="link" size="small">更新进度</a-button>
                        </a-popover>
                        <a-popconfirm
                          title="确定删除此任务吗？"
                          :disabled="item.progress === 100"
                          @confirm="handleDeleteTask(item.id, subproject.id)"
                        >
                          <a-button
                            type="link"
                            danger
                            size="small"
                            :disabled="item.progress === 100"
                            >删除</a-button
                          >
                        </a-popconfirm>
                      </template>
                    </a-list-item>
                  </template>
                </a-list>
                <a-button
                  type="dashed"
                  size="small"
                  @click="openTaskModal(stage.id)"
                  style="margin-top: 10px"
                >
                  <PlusOutlined /> 添加任务
                </a-button>
              </a-timeline-item>
            </a-timeline>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </div>

    <!-- Modals (代码保持不变) -->
    <a-modal
      v-model:open="isSubprojectModalVisible"
      title="创建子项目"
      @ok="handleSubprojectOk"
    >
      <a-form ref="subprojectFormRef" :model="subprojectFormState" layout="vertical">
        <a-form-item name="name" label="子项目名称" :rules="[{ required: true }]"
          ><a-input v-model:value="subprojectFormState.name"
        /></a-form-item>
        <a-form-item name="description" label="描述" :rules="[{ required: true }]"
          ><a-textarea v-model:value="subprojectFormState.description"
        /></a-form-item>
        <a-form-item name="deadline" label="截止日期" :rules="[{ required: true }]"
          ><a-date-picker
            v-model:value="subprojectFormState.deadline"
            style="width: 100%"
        /></a-form-item>
        <a-form-item name="employee_id" label="分配给 (组员)"
          ><a-select
            v-model:value="subprojectFormState.employee_id"
            placeholder="请选择组员"
            ><a-select-option v-for="m in members" :key="m.id" :value="m.id">{{
              m.username
            }}</a-select-option></a-select
          ></a-form-item
        >
      </a-form>
    </a-modal>
    <a-modal v-model:open="isStageModalVisible" title="创建新阶段" @ok="handleStageOk">
      <a-form ref="stageFormRef" :model="stageFormState" layout="vertical">
        <a-form-item name="name" label="阶段名称" :rules="[{ required: true }]"
          ><a-input v-model:value="stageFormState.name"
        /></a-form-item>
        <a-form-item name="description" label="描述" :rules="[{ required: true }]"
          ><a-textarea v-model:value="stageFormState.description"
        /></a-form-item>
        <a-form-item name="end_date" label="截止日期" :rules="[{ required: true }]"
          ><a-date-picker v-model:value="stageFormState.end_date" style="width: 100%"
        /></a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:open="isTaskModalVisible" title="创建新任务" @ok="handleTaskOk">
      <a-form ref="taskFormRef" :model="taskFormState" layout="vertical">
        <a-form-item name="name" label="任务名称" :rules="[{ required: true }]"
          ><a-input v-model:value="taskFormState.name"
        /></a-form-item>
        <a-form-item name="description" label="任务描述"
          ><a-textarea v-model:value="taskFormState.description"
        /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import {
  getProjectDetails,
  getSubprojects,
  createSubproject,
  getStagesWithTasks,
  createStage,
  createTask,
  updateTaskProgress,
  deleteTask,
  getUsersByRole,
} from "@/api/project";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";

const store = useStore();
const route = useRoute();
const router = useRouter();
const projectId = route.params.id;

const project = ref({});
const subprojects = ref([]);
const members = ref([]);
const loading = ref(true); // 默认设置为 true
const activeSubprojectKey = ref(null);

const isSubprojectModalVisible = ref(false);
const subprojectFormRef = ref();
const subprojectFormState = ref({});
const isStageModalVisible = ref(false);
const stageFormRef = ref();
const stageFormState = ref({});
const currentSubprojectId = ref(null);
const isTaskModalVisible = ref(false);
const taskFormRef = ref();
const taskFormState = ref({});
const currentStageId = ref(null);

const user = computed(() => store.getters["user/currentUser"]);
const isLeader = computed(
  () => user.value?.role === "LEADER" && project.value?.employee_id === user.value?.id
);
const isMember = computed(() => user.value?.role === "MEMBER");

const fetchProjectData = async () => {
  loading.value = true;
  try {
    const projectData = await getProjectDetails(projectId);
    const subprojectData = await getSubprojects(projectId);

    for (const sp of subprojectData) {
      sp.stages = await getStagesWithTasks(sp.id);
    }
    subprojects.value = subprojectData;

    project.value = {
      ...projectData,
      progress: calculateProjectProgress(subprojectData),
    };
  } catch (error) {
    message.error("加载项目详情失败");
  } finally {
    loading.value = false;
  }
};

const fetchMembers = async () => {
  if (isLeader.value) {
    try {
      members.value = await getUsersByRole("MEMBER", user.value.id);
    } catch (error) {
      message.error("加载组员列表失败");
    }
  }
};

onMounted(() => {
  fetchProjectData();
});
watch(
  project,
  (newVal) => {
    if (newVal.id) fetchMembers();
  },
  { immediate: true }
);

const canManageSubproject = (subproject) =>
  isLeader.value || (isMember.value && subproject.employee_id === user.value.id);

const openSubprojectModal = () => {
  subprojectFormState.value = {};
  isSubprojectModalVisible.value = true;
};
const openStageModal = (subprojectId) => {
  currentSubprojectId.value = subprojectId;
  stageFormState.value = {};
  isStageModalVisible.value = true;
};
const openTaskModal = (stageId) => {
  currentStageId.value = stageId;
  taskFormState.value = {};
  isTaskModalVisible.value = true;
};

const handleSubprojectOk = async () => {
  try {
    await subprojectFormRef.value.validate();
    const dataToSend = {
      ...subprojectFormState.value,
      deadline: subprojectFormState.value.deadline
        ? subprojectFormState.value.deadline.toISOString()
        : null,
    };
    await createSubproject(projectId, dataToSend);
    message.success("子项目创建成功");
    isSubprojectModalVisible.value = false;
    fetchProjectData();
  } catch (error) {
    message.error("创建失败");
  }
};
const handleStageOk = async () => {
  try {
    await stageFormRef.value.validate();
    const dataToSend = {
      ...stageFormState.value,
      end_date: stageFormState.value.end_date
        ? stageFormState.value.end_date.toISOString()
        : null,
    };
    await createStage(currentSubprojectId.value, dataToSend);
    message.success("阶段创建成功");
    isStageModalVisible.value = false;
    fetchProjectData();
  } catch (error) {
    message.error("创建失败");
  }
};
const handleTaskOk = async () => {
  try {
    await taskFormRef.value.validate();
    await createTask(currentStageId.value, taskFormState.value);
    message.success("任务创建成功");
    isTaskModalVisible.value = false;
    fetchProjectData();
  } catch (error) {
    message.error("创建失败");
  }
};

const onProgressPopoverOpen = (visible, task) => {
  if (visible) {
    task.newProgress = task.progress;
    task.newDesc = "";
  }
};
const handleUpdateProgress = async (task) => {
  if (!task.newDesc) {
    message.warn("请填写更新说明");
    return;
  }
  try {
    const updatedTask = await updateTaskProgress(task.id, {
      progress: task.newProgress,
      description: task.newDesc,
    });
    message.success("进度更新成功");
    updateLocalState(updatedTask);
  } catch (error) {
    message.error("更新失败");
  }
};
const updateLocalState = (updatedTask) => {
  for (const sp of subprojects.value) {
    for (const stage of sp.stages) {
      const taskIndex = stage.tasks.findIndex((t) => t.id === updatedTask.id);
      if (taskIndex !== -1) {
        stage.tasks[taskIndex] = { ...stage.tasks[taskIndex], ...updatedTask };
        stage.progress = calculateStageProgress(stage.tasks);
        sp.progress = calculateSubprojectProgress(sp.stages);
        project.value.progress = calculateProjectProgress(subprojects.value);
        return;
      }
    }
  }
};

const calculateStageProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + task.progress, 0);
  return parseFloat((total / tasks.length).toFixed(2));
};
const calculateSubprojectProgress = (stages) => {
  if (!stages || stages.length === 0) return 0;
  const total = stages.reduce((sum, stage) => sum + stage.progress, 0);
  return parseFloat((total / stages.length).toFixed(2));
};
const calculateProjectProgress = (subprojects) => {
  if (!subprojects || subprojects.length === 0) return 0;
  const total = subprojects.reduce((sum, sp) => sum + sp.progress, 0);
  return parseFloat((total / subprojects.length).toFixed(2));
};

const handleDeleteTask = async (taskId) => {
  try {
    await deleteTask(taskId);
    message.success("任务已删除");
    fetchProjectData();
  } catch (error) {
    message.error("删除失败");
  }
};

// 修复：增加对 status 是否存在的判断，防止 toUpperCase 报错
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
</script>

<style scoped>
.page-container {
  background-color: #f0f2f5;
  position: relative;
  min-height: 80vh; /* 确保容器有高度 */
}
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 99;
}
.page-header {
  background: #fff;
}
.content-area {
  margin: 24px;
}
</style>
