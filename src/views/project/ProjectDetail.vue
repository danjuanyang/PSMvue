<template>
  <div class="page-container">
    <div v-if="loading" class="loading-spinner"><a-spin size="large" /></div>

    <div v-if="!loading && project.id">
      <a-page-header
        :title="project.name"
        class="page-header"
        @back="() => router.push('/projects')"
      >
        <template #extra>
          <a-button key="1" type="primary" @click="openSubprojectModal()" v-if="isLeader"
            ><PlusOutlined /> 创建子项目</a-button
          >
        </template>
        <a-descriptions size="small" :column="3">
          <a-descriptions-item label="负责人">{{
            project.member_names || "未分配"
          }}</a-descriptions-item>
          <a-descriptions-item label="状态"
            ><a-tag :color="getStatusColor(project.status)">{{
              getStatusText(project.status)
            }}</a-tag></a-descriptions-item
          >
          <a-descriptions-item label="项目周期"
            >{{ dayjs(project.start_date).format("YYYY-MM-DD") }} ~
            {{ dayjs(project.deadline).format("YYYY-MM-DD") }}</a-descriptions-item
          >
          <a-descriptions-item label="项目描述">{{
            project.description
          }}</a-descriptions-item>
        </a-descriptions>
        <a-row style="margin-top: 16px"
          ><a-col :span="24"
            ><span>总进度</span><a-progress :percent="project.progress" /></a-col
        ></a-row>
      </a-page-header>

      <div class="content-area">
        <a-collapse v-model:activeKey="activeSubprojectKey" accordion>
          <a-collapse-panel
            v-for="subproject in subprojects"
            :key="subproject.id"
            :header="subproject.name"
          >
            <template #extra>
              <a-space>
                <!-- 关键修复：使用后端返回的 member_names 字段 -->
                <a-tag>负责人: {{ subproject.member_names || "未分配" }}</a-tag>
                <a-progress type="circle" :percent="subproject.progress" :width="35" />
                <a-button
                  size="small"
                  @click.stop="openEditSubprojectModal(subproject)"
                  v-if="isLeader"
                  >编辑成员</a-button
                >
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
                <a-space>
                  <h4>{{ stage.name }} ({{ stage.progress }}%)</h4>
                  <a-button
                    type="link"
                    size="small"
                    @click="openEditStageModal(stage, subproject)"
                    ><EditOutlined
                  /></a-button>
                </a-space>
                <a-list size="small" :data-source="stage.tasks">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta :description="item.description">
                        <template #title
                          ><a-space
                            ><span>{{ item.name }}</span
                            ><a-tag :color="getStatusColor(item.status)">{{
                              getStatusText(item.status)
                            }}</a-tag></a-space
                          ></template
                        >
                      </a-list-item-meta>
                      <template #actions>
                        <a-button
                          type="link"
                          size="small"
                          @click="openEditTaskModal(item, stage)"
                          >编辑</a-button
                        >
                        <a-popover
                          title="更新进度"
                          trigger="click"
                          @openChange="(v) => onProgressPopoverOpen(v, item)"
                          v-if="item.status !== 'completed'"
                        >
                          <template #content>
                            <a-slider
                              v-model:value="item.newProgress"
                              @change="(val) => onSliderChange(val, item)"
                              :min="item.progress"
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

                        <!-- 修复 #2: 根据任务状态切换按钮 -->
                        <a-button
                          v-if="item.status === 'completed'"
                          type="link"
                          @click="openUploadModal(item)"
                          ><UploadOutlined /> 上传</a-button
                        >
                        <a-popconfirm
                          v-else
                          title="确定删除此任务吗？"
                          @confirm="handleDeleteTask(item.id)"
                          ><a-button type="link" danger size="small"
                            >删除</a-button
                          ></a-popconfirm
                        >
                      </template>
                    </a-list-item>
                  </template>
                </a-list>
                <a-button
                  type="dashed"
                  size="small"
                  @click="openTaskModal(stage)"
                  style="margin-top: 10px"
                  ><PlusOutlined /> 添加任务</a-button
                >
              </a-timeline-item>
            </a-timeline>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </div>

    <!-- Modals -->
    <a-modal
      v-model:open="isSubprojectModalVisible"
      :title="modalTitle"
      @ok="handleSubprojectOk"
    >
      <a-form ref="subprojectFormRef" :model="subprojectFormState" layout="vertical">
        <template v-if="!isEditMode">
          <a-form-item name="name" label="子项目名称" :rules="[{ required: true }]"
            ><a-input v-model:value="subprojectFormState.name"
          /></a-form-item>
          <a-form-item name="description" label="描述" :rules="[{ required: true }]"
            ><a-textarea v-model:value="subprojectFormState.description"
          /></a-form-item>
          <!--应用中文语言包 -->
          <a-form-item name="dateRange" label="起止日期" :rules="[{ required: true }]"
            ><a-range-picker
              v-model:value="subprojectFormState.dateRange"
              :disabled-date="disabledSubprojectDate"
              :locale="locale"
              style="width: 100%"
          /></a-form-item>
        </template>
        <a-form-item name="member_ids" label="分配给 (组员)"
          ><a-select
            mode="multiple"
            v-model:value="subprojectFormState.member_ids"
            placeholder="可多选组员"
            ><a-select-option v-for="m in members" :key="m.id" :value="m.id">{{
              m.username
            }}</a-select-option></a-select
          ></a-form-item
        >
      </a-form>
    </a-modal>

    <a-modal v-model:open="isStageModalVisible" :title="modalTitle" @ok="handleStageOk">
      <a-form ref="stageFormRef" :model="stageFormState" layout="vertical">
        <a-form-item name="name" label="阶段名称" :rules="[{ required: true }]"
          ><a-input v-model:value="stageFormState.name"
        /></a-form-item>
        <a-form-item name="description" label="描述" :rules="[{ required: true }]"
          ><a-textarea v-model:value="stageFormState.description"
        /></a-form-item>
        <!--应用中文语言包 -->
        <a-form-item name="dateRange" label="起止日期" :rules="[{ required: true }]"
          ><a-range-picker
            v-model:value="stageFormState.dateRange"
            :locale="locale"
            style="width: 100%"
        /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="isTaskModalVisible" :title="modalTitle" @ok="handleTaskOk">
      <a-form ref="taskFormRef" :model="taskFormState" layout="vertical">
        <a-form-item name="name" label="任务名称" :rules="[{ required: true }]"
          ><a-input v-model:value="taskFormState.name" :disabled="isEditMode"
        /></a-form-item>
        <a-form-item name="description" label="任务描述" :rules="[{ required: true }]"
          ><a-textarea v-model:value="taskFormState.description" :disabled="isEditMode"
        /></a-form-item>
        <!-- 应用中文语言包 -->
        <a-form-item name="due_date" label="截止日期" :rules="[{ required: true }]"
          ><a-date-picker
            v-model:value="taskFormState.due_date"
            :disabled-date="disabledTaskDate"
            :locale="locale"
            style="width: 100%"
        /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="isUploadModalVisible"
      title="上传任务文件"
      @ok="handleUpload"
      :confirm-loading="uploading"
    >
      <a-upload-dragger
        v-model:fileList="fileList"
        name="file"
        :before-upload="() => false"
        multiple
        :accept="'.txt,.pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar'"
        :show-upload-list="false"
      >
        <p class="ant-upload-drag-icon"><InboxOutlined /></p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持的文件类型: txt, pdf, png, jpg, jpeg, gif, doc, docx, xls, xlsx, ppt, pptx,
          zip, rar
        </p>
      </a-upload-dragger>

      <!-- 待上传文件队列 -->
      <a-list
        v-if="fileList.length"
        class="upload-queue-list"
        :data-source="fileList"
        item-layout="horizontal"
        style="margin-top: 16px"
      >
        <template #header><strong>待上传文件队列</strong></template>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta :title="item.name" />
            <template #actions>
              <a-switch
                v-model:checked="item.is_public"
                checked-children="公开"
                un-checked-children="私有"
              />
              <a-button type="link" danger @click="removeFileFromList(item.uid)"
                >删除</a-button
              >
            </template>
          </a-list-item>
        </template>
      </a-list>

      <a-divider>已上传文件</a-divider>
      <a-list
        :loading="taskFilesLoading"
        item-layout="horizontal"
        :data-source="taskFiles"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :description="`上传者: ${item.uploader_name} | 时间: ${dayjs(
                item.upload_date
              ).format('YYYY-MM-DD HH:mm')}`"
            >
              <template #title>
                <a-space>
                  <span>{{ item.original_name }}</span>
                  <a-tag :color="item.is_public ? 'blue' : 'orange'">
                    {{ item.is_public ? "公开" : "私有" }}
                  </a-tag>
                </a-space>
              </template>
              <template #avatar>
                <a-avatar style="background-color: #1890ff"
                  ><PaperClipOutlined
                /></a-avatar>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
        <template #empty v-if="!taskFilesLoading">
          <a-empty description="该任务暂无已上传文件" />
        </template>
      </a-list>
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
  updateSubproject,
  getStagesWithTasks,
  createStage,
  createTask,
  updateTaskProgress,
  deleteTask,
  updateStage,
  updateTask,
  uploadFileForTask,
  getUsersByRole,
  getTaskFiles,
} from "@/api/project";

import { message } from "ant-design-vue";
import {
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
  InboxOutlined,
} from "@ant-design/icons-vue";
import dayjs from "dayjs";
import locale from "ant-design-vue/es/date-picker/locale/zh_CN"; // 导入日期组件的中文包

// --- State & Hooks ---
const store = useStore();
const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const project = ref({});
const subprojects = ref([]);
const members = ref([]);
const loading = ref(true);
const activeSubprojectKey = ref(null);
const modalTitle = ref("");
const isEditMode = ref(false);
const currentStageForTask = ref(null); // 新增：用于任务时间校验

// Modals State
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
const isUploadModalVisible = ref(false);
const currentTaskForUpload = ref(null);
const fileList = ref([]);
const uploading = ref(false);
const taskFiles = ref([]); // 新增：用于存储已上传文件
const taskFilesLoading = ref(false); // 新增：列表加载状态

const removeFileFromList = (uid) => {
  const index = fileList.value.findIndex((file) => file.uid === uid);
  if (index !== -1) {
    fileList.value.splice(index, 1);
  }
};

// --- Computed ---
const user = computed(() => store.getters["user/currentUser"]);
const isLeader = computed(
  () => user.value?.role === "LEADER" && project.value?.employee_id === user.value?.id
);
const isMember = computed(() => user.value?.role === "MEMBER");

// --- Data Fetching ---
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

// --- Permission Logic ---
const canManageSubproject = (subproject) =>
  isLeader.value || (isMember.value && subproject.member_ids.includes(user.value.id));

// --- Modal Openers ---
const openSubprojectModal = () => {
  isEditMode.value = false;
  modalTitle.value = "创建子项目";
  subprojectFormState.value = {};
  isSubprojectModalVisible.value = true;
};
const openEditSubprojectModal = (subproject) => {
  isEditMode.value = true;
  modalTitle.value = `编辑子项目成员 - ${subproject.name}`;
  subprojectFormState.value = { ...subproject };
  isSubprojectModalVisible.value = true;
};
const openStageModal = (subprojectId) => {
  isEditMode.value = false;
  modalTitle.value = "创建新阶段";
  currentSubprojectId.value = subprojectId;
  stageFormState.value = {};
  isStageModalVisible.value = true;
};
const openEditStageModal = (stage) => {
  isEditMode.value = true;
  modalTitle.value = `编辑阶段 - ${stage.name}`;
  stageFormState.value = {
    ...stage,
    dateRange: [dayjs(stage.start_date), dayjs(stage.end_date)],
  };
  isStageModalVisible.value = true;
};
const openTaskModal = (stage) => {
  isEditMode.value = false;
  modalTitle.value = "创建新任务";
  currentStageId.value = stage.id;
  currentStageForTask.value = stage; // 保存父阶段信息
  taskFormState.value = {};
  isTaskModalVisible.value = true;
};
const openEditTaskModal = (task, stage) => {
  isEditMode.value = true;
  modalTitle.value = `编辑任务 - ${task.name}`;
  currentStageForTask.value = stage; // 保存父阶段信息
  taskFormState.value = {
    ...task,
    due_date: task.due_date ? dayjs(task.due_date) : null,
  };
  isTaskModalVisible.value = true;
};
const openUploadModal = async (task) => {
  currentTaskForUpload.value = task;
  isUploadModalVisible.value = true;
  fileList.value = []; // 清空待上传列表

  // 加载已有文件列表
  taskFilesLoading.value = true;
  try {
    taskFiles.value = await getTaskFiles(task.id);
  } catch (error) {
    message.error("加载已上传文件列表失败");
    taskFiles.value = [];
  } finally {
    taskFilesLoading.value = false;
  }
};

// --- Modal Handlers ---
const handleSubprojectOk = async () => {
  try {
    await subprojectFormRef.value.validate();
    const { dateRange, ...rest } = subprojectFormState.value;
    const dataToSend = { ...rest };
    if (dateRange && dateRange.length === 2) {
      dataToSend.start_date = dateRange[0].toISOString();
      dataToSend.deadline = dateRange[1].toISOString();
    }
    if (isEditMode.value) {
      await updateSubproject(dataToSend.id, dataToSend);
      message.success("成员更新成功");
    } else {
      await createSubproject(projectId, dataToSend);
      message.success("子项目创建成功");
    }
    isSubprojectModalVisible.value = false;
    fetchProjectData();
  } catch (error) {
    message.error("操作失败");
  }
};

const handleStageOk = async () => {
  try {
    await stageFormRef.value.validate();
    const { dateRange, ...rest } = stageFormState.value;
    const dataToSend = { ...rest };
    if (dateRange && dateRange.length === 2) {
      dataToSend.start_date = dateRange[0].toISOString();
      dataToSend.end_date = dateRange[1].toISOString();
    }
    if (isEditMode.value) {
      await updateStage(dataToSend.id, dataToSend);
      message.success("阶段更新成功");
    } else {
      await createStage(currentSubprojectId.value, dataToSend);
      message.success("阶段创建成功");
    }
    isStageModalVisible.value = false;
    fetchProjectData();
  } catch (error) {
    message.error("操作失败");
  }
};

const handleTaskOk = async () => {
  try {
    await taskFormRef.value.validate();
    const dataToSend = { ...taskFormState.value };
    if (isEditMode.value) {
      await updateTask(dataToSend.id, dataToSend);
      message.success("任务更新成功");
    } else {
      await createTask(currentStageId.value, dataToSend);
      message.success("任务创建成功");
    }
    isTaskModalVisible.value = false;
    fetchProjectData();
  } catch (error) {
    message.error("操作失败");
  }
};

const handleUpload = async () => {
  if (!fileList.value || fileList.value.length === 0) {
    message.error("请选择至少一个文件！");
    return;
  }

  uploading.value = true;
  const totalFiles = fileList.value.length;
  let successCount = 0;

  try {
    for (const file of fileList.value) {
      const fileToUpload = file.originFileObj;
      if (!fileToUpload) {
        continue;
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("is_public", file.is_public || false); // 使用每个文件自己的状态

      try {
        await uploadFileForTask(currentTaskForUpload.value.id, formData);
        successCount++;
      } catch (error) {
        message.error(`文件 "${file.name}" 上传失败`);
      }
    }

    if (successCount > 0) {
      message.success(`成功上传 ${successCount}/${totalFiles} 个文件`);
      isUploadModalVisible.value = false;
      try {
        taskFiles.value = await getTaskFiles(currentTaskForUpload.value.id);
      } catch (error) {
        // 忽略刷新列表的错误
      }
    } else {
      message.error("没有文件成功上传");
    }
  } catch (error) {
    message.error("上传过程中发生错误");
  } finally {
    uploading.value = false;
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

const disabledSubprojectDate = (current) => {
  if (!project.value.start_date || !project.value.deadline) return false;
  const startDate = dayjs(project.value.start_date).startOf("day");
  const deadline = dayjs(project.value.deadline).endOf("day");
  return current && (current < startDate || current > deadline);
};

// --- Action Handlers---
const onSliderChange = (value, task) => {
  //滑块到100时自动填充总结
  if (value === 100) {
    task.newDesc = "总结：";
  }
};

const disabledTaskDate = (current) => {
  // 任务时间校验
  if (
    !currentStageForTask.value ||
    !currentStageForTask.value.start_date ||
    !currentStageForTask.value.end_date
  )
    return false;
  const startDate = dayjs(currentStageForTask.value.start_date).startOf("day");
  const endDate = dayjs(currentStageForTask.value.end_date).endOf("day");
  return current && (current < startDate || current > endDate);
};

// 增加对 status 是否存在的判断，防止 toUpperCase 报错
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
