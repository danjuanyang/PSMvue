<template>
  <n-spin :show="loading">
    <div v-if="project" class="project-detail-container space-y-6">
      <!-- Breadcrumb -->
      <n-breadcrumb>
        <n-breadcrumb-item @click="$router.push({ name: 'project-management' })">
          项目管理
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ project.name }}</n-breadcrumb-item>
      </n-breadcrumb>

      <!-- Project Overview -->
      <n-card :title="project.name" :bordered="false" class="shadow-md">
        <template #header-extra>
          <n-tag :type="statusTagTypes[project.status]" :bordered="false">{{
            project.status
          }}</n-tag>
        </template>
        <p class="text-gray-600 mb-4">{{ project.description }}</p>
        <n-progress
          type="line"
          :percentage="project.progress"
          :indicator-text-inside="project.progress > 0"
          processing
        />
        <template #footer>
          <div class="flex justify-between items-center text-sm text-gray-500">
            <span>负责人: {{ project.employee_name || "未分配" }}</span>
            <span>子项目数: {{ subprojects.length }}</span>
            <span>
              日期: {{ formatDate(project.start_date) }} ~
              {{ formatDate(project.deadline) }}
            </span>
          </div>
        </template>
      </n-card>

      <!-- Subproject Selection and Management -->
      <n-card title="子项目" :bordered="false" class="shadow-md">
        <template #header-extra>
          <n-button v-if="isLeader" type="primary" @click="openSubprojectModal()">
            <template #icon><n-icon :component="AddIcon" /></template>
            创建子项目
          </n-button>
        </template>
        <div v-if="subprojects.length > 0">
          <n-radio-group
            v-model:value="selectedSubprojectId"
            name="subproject-selector"
            @update:value="handleSubprojectChange"
          >
            <n-radio-button
              v-for="sub in subprojects"
              :key="sub.id"
              :value="sub.id"
              :label="sub.name"
            />
          </n-radio-group>
        </div>
        <n-empty v-else description="该项目下暂无子项目" />
      </n-card>

      <!-- Stages and Tasks for Selected Subproject -->
      <div v-if="selectedSubproject" class="space-y-4">
        <n-card :bordered="false" class="shadow-md">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold">{{ selectedSubproject.name }}</h3>
              <p class="text-sm text-gray-500">{{ selectedSubproject.description }}</p>
            </div>
            <div>
              <n-button-group>
                <n-button v-if="isLeader" @click="openSubprojectModal(selectedSubproject)"
                  >编辑</n-button
                >
                <n-button v-if="isMember" type="primary" @click="openStageModal()">
                  <template #icon><n-icon :component="AddIcon" /></template>
                  添加阶段
                </n-button>
              </n-button-group>
            </div>
          </div>
        </n-card>

        <n-timeline>
          <n-timeline-item
            v-for="stage in stages"
            :key="stage.id"
            :type="statusTagTypes[stage.status]"
            :title="stage.name"
          >
            <template #header>
              <div class="flex justify-between items-center w-full">
                <span class="font-bold text-lg">{{ stage.name }}</span>
                <n-space>
                  <n-tag :bordered="false" :type="statusTagTypes[stage.status]">{{
                    stage.status
                  }}</n-tag>
                  <n-button-group size="small" v-if="isMember">
                    <n-button @click="openStageModal(stage)">编辑</n-button>
                    <n-button @click="openTaskModal(stage.id)">添加任务</n-button>
                    <n-popconfirm
                      @positive-click="handleDelete('stage', stage.id)"
                      :disabled="stage.tasks.some((t) => t.progress === 100)"
                    >
                      <template #trigger>
                        <n-button
                          type="error"
                          ghost
                          :disabled="stage.tasks.some((t) => t.progress === 100)"
                          >删除</n-button
                        >
                      </template>
                      此阶段下有已完成的任务时无法删除。确定要删除此阶段吗?
                    </n-popconfirm>
                  </n-button-group>
                </n-space>
              </div>
            </template>
            <p class="text-sm text-gray-500 my-2">{{ stage.description }}</p>
            <n-progress type="line" :percentage="stage.progress" />

            <n-data-table
              :columns="taskColumns"
              :data="stage.tasks"
              :bordered="false"
              size="small"
              class="mt-4"
            />
          </n-timeline-item>
        </n-timeline>
        <n-empty v-if="stages.length === 0" description="该子项目下暂无阶段" />
      </div>
    </div>
    <n-empty
      v-else
      description="未找到项目或无权访问"
      class="h-full flex justify-center items-center"
    />
  </n-spin>

  <!-- Modals will go here -->
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";
import { useRoute } from "vue-router";
import {
  NSpin,
  NBreadcrumb,
  NBreadcrumbItem,
  NCard,
  NProgress,
  NTag,
  NRadioGroup,
  NRadioButton,
  NButton,
  NButtonGroup,
  NIcon,
  NEmpty,
  NTimeline,
  NTimelineItem,
  NSpace,
  NDataTable,
  NPopconfirm,
  useMessage,
} from "naive-ui";
import { Add as AddIcon } from "@vicons/ionicons5";
import type { Project, Subproject, ProjectStage, StageTask } from "@/types/api";
import { StatusEnum } from "@/types/api";
import {
  getProjectById,
  getSubprojects,
  getStages,
  deleteTask as apiDeleteTask,
  deleteStage as apiDeleteStage,
} from "@/api/project";
import { useUserStore } from "@/stores/user";
import type { DataTableColumns } from "naive-ui";

const route = useRoute();
const message = useMessage();
const userStore = useUserStore();
const projectId = Number(route.params.id);

const loading = ref(true);
const project = ref<Project | null>(null);
const subprojects = ref<Subproject[]>([]);
const stages = ref<ProjectStage[]>([]);
const selectedSubprojectId = ref<number | null>(null);

const statusTagTypes = {
  [StatusEnum.PENDING]: "default",
  [StatusEnum.IN_PROGRESS]: "info",
  [StatusEnum.COMPLETED]: "success",
  [StatusEnum.CANCELLED]: "error",
};

// Computed Properties
const selectedSubproject = computed(() => {
  return subprojects.value.find((s) => s.id === selectedSubprojectId.value) || null;
});
const isAdmin = computed(() => ["SUPER", "ADMIN"].includes(userStore.userRole ?? ""));
const isLeader = computed(
  () =>
    userStore.userRole === "LEADER" &&
    userStore.userInfo?.id === project.value?.employee_id
);
const isMember = computed(() => userStore.userRole === "MEMBER");

const taskColumns: DataTableColumns<StageTask> = [
  { title: "任务", key: "name" },
  {
    title: "进度",
    key: "progress",
    render: (row) => h(NProgress, { type: "line", percentage: row.progress }),
  },
  {
    title: "状态",
    key: "status",
    render: (row) =>
      h(
        NTag,
        { type: statusTagTypes[row.status] as any, bordered: false },
        { default: () => row.status }
      ),
  },
  { title: "截止日期", key: "due_date", render: (row) => formatDate(row.due_date) },
  {
    title: "操作",
    key: "actions",
    render(row) {
      if (!isMember.value) return null;
      const canDelete = row.progress < 100;
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              { size: "tiny" /* onClick: () => openTaskProgressModal(row) */ },
              { default: () => "更新进度" }
            ),
            h(
              NButton,
              { size: "tiny" /* onClick: () => openTaskModal(row.stage_id, row) */ },
              { default: () => "编辑" }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete("task", row.id),
                disabled: !canDelete,
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    { size: "tiny", type: "error", ghost: true, disabled: !canDelete },
                    { default: () => "删除" }
                  ),
                default: () => "确定要删除此任务吗？",
              }
            ),
          ],
        }
      );
    },
  },
];

// Methods
const fetchData = async () => {
  loading.value = true;
  try {
    project.value = await getProjectById(projectId);
    subprojects.value = await getSubprojects(projectId);
    // Auto-select first subproject if available
    if (subprojects.value.length > 0) {
      selectedSubprojectId.value = subprojects.value[0].id;
      await handleSubprojectChange(selectedSubprojectId.value);
    }
  } catch (error) {
    message.error("获取项目数据失败或您无权访问");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSubprojectChange = async (subId: number) => {
  if (!subId) {
    stages.value = [];
    return;
  }
  stages.value = await getStages(subId);
};

const handleDelete = async (type: "task" | "stage", id: number) => {
  try {
    if (type === "task") {
      await apiDeleteTask(id);
    } else if (type === "stage") {
      await apiDeleteStage(id);
    }
    message.success("删除成功");
    // Refresh data
    if (selectedSubprojectId.value) {
      handleSubprojectChange(selectedSubprojectId.value);
    }
  } catch (error: any) {
    message.error(error.response?.data?.error || "删除失败");
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

//模态函数占位符
const openSubprojectModal = (sub?: Subproject) =>
  console.log("Open subproject modal", sub);
const openStageModal = (stage?: ProjectStage) => console.log("Open stage modal", stage);
const openTaskModal = (stageId: number, task?: StageTask) =>
  console.log("Open task modal", stageId, task);

onMounted(() => {
  if (projectId) {
    fetchData();
  } else {
    loading.value = false;
    message.error("无效的项目ID");
  }
});
</script>

<style scoped>
.project-detail-container {
  padding: 1rem;
  background-color: #f8f8fa;
}
</style>
