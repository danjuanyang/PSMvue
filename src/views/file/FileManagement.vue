<template>
  <div class="app-container">
    <a-card>
      <!-- 筛选区域 -->
      <a-form layout="inline" :model="queryParams" class="filter-form">
        <a-form-item label="项目">
          <a-select v-model:value="queryParams.project_id" @change="handleProjectChange" placeholder="请选择项目" style="width: 180px;">
            <a-select-option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="子项目">
          <a-select v-model:value="queryParams.subproject_id" @change="handleSubprojectChange" placeholder="请选择子项目" style="width: 180px;">
            <a-select-option v-for="sp in subprojects" :key="sp.id" :value="sp.id">{{ sp.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="阶段">
          <a-select v-model:value="queryParams.stage_id" @change="handleStageChange" placeholder="请选择阶段" style="width: 180px;">
            <a-select-option v-for="st in stages" :key="st.id" :value="st.id">{{ st.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="任务">
          <a-select v-model:value="queryParams.task_id" placeholder="请选择任务" style="width: 180px;">
            <a-select-option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="文件类型">
          <a-select v-model:value="queryParams.is_public" placeholder="请选择文件类型" style="width: 120px;">
            <a-select-option :value="null">全部</a-select-option>
            <a-select-option :value="true">公共文件</a-select-option>
            <a-select-option :value="false">非公共文件</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleQuery">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetQuery">重置</a-button>
        </a-form-item>
      </a-form>

      <!-- 表格区域 -->
      <a-table
        :columns="columns"
        :data-source="fileList"
        :loading="loading"
        row-key="id"
        style="margin-top: 20px"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="handleDownload(record)">下载</a-button>
            <!-- 预览 -->
            <a-button type="link" @click="handlePreview(record)">预览</a-button>
            <a-popconfirm
              title="确定删除这个文件吗?"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import { 
  getFiles, 
  deleteFile, 
  downloadFile, 
  getProjects, 
  getSubprojects, 
  getStages, 
  getTasks 
} from '@/api/file';
import { message } from 'ant-design-vue';
import { getFilePreviewUrl } from '@/api/utils'; // 引入新的预览 URL 工具

const fileList = ref([]);
const loading = ref(false);
const queryParams = ref({
  project_id: null,
  subproject_id: null,
  stage_id: null,
  task_id: null,
  is_public: null
});

const projects = ref([]);
const subprojects = ref([]);
const stages = ref([]);
const tasks = ref([]);

const columns = [
  { title: '文件名', dataIndex: 'original_name', key: 'original_name' },
  { title: '上传者', dataIndex: 'uploader_name', key: 'uploader_name' },
  { title: '上传时间', dataIndex: 'upload_date', key: 'upload_date' },
  { title: '文件类型', dataIndex: 'file_type', key: 'file_type' },
  { title: '是否公开', dataIndex: 'is_public', key: 'is_public', customRender: ({ text }) => (text ? '是' : '否') },
  { title: '操作', key: 'action' }
];

// 获取文件列表
const fetchFiles = async () => {
  loading.value = true;
  try {
    const response = await getFiles(queryParams.value);
    fileList.value = response;
  } catch (error) {
    message.error('获取文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取项目
const fetchProjects = async () => {
  try {
    projects.value = await getProjects();
  } catch (error) {
    message.error('获取项目列表失败');
  }
};

// 获取子项目
const fetchSubprojects = async (projectId) => {
  try {
    subprojects.value = await getSubprojects(projectId);
  } catch (error) {
    message.error('获取子项目列表失败');
  }
};

// 获取阶段
const fetchStages = async (subprojectId) => {
  try {
    stages.value = await getStages(subprojectId);
  } catch (error) {
    message.error('获取阶段列表失败');
  }
};

// 获取任务
const fetchTasks = async (stageId) => {
  try {
    tasks.value = await getTasks(stageId);
  } catch (error) {
    message.error('获取任务列表失败');
  }
};

// 预览
const handlePreview = (modelName, fileId) => {
    const url = getFilePreviewUrl(modelName, fileId);
    window.open(url, '_blank'); // 在新标签页中打开预览
};

// 处理项目选择变化
const handleProjectChange = (projectId) => {
  queryParams.value.subproject_id = null;
  queryParams.value.stage_id = null;
  queryParams.value.task_id = null;
  subprojects.value = [];
  stages.value = [];
  tasks.value = [];
  if (projectId) {
    fetchSubprojects(projectId);
  }
};

// 处理子项目选择变化
const handleSubprojectChange = (subprojectId) => {
  queryParams.value.stage_id = null;
  queryParams.value.task_id = null;
  stages.value = [];
  tasks.value = [];
  if (subprojectId) {
    fetchStages(subprojectId);
  }
};

// 处理阶段选择变化
const handleStageChange = (stageId) => {
  queryParams.value.task_id = null;
  tasks.value = [];
  if (stageId) {
    fetchTasks(stageId);
  }
};

// 查询
const handleQuery = () => {
  fetchFiles();
};

// 重置查询
const resetQuery = () => {
  queryParams.value = {
    project_id: null,
    subproject_id: null,
    stage_id: null,
    task_id: null,
    is_public: null
  };
  subprojects.value = [];
  stages.value = [];
  tasks.value = [];
  fetchFiles();
};

// 下载文件
const handleDownload = async (record) => {
  try {
    const response = await downloadFile(record.id);
    const blob = new Blob([response], { type: response.type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', record.original_name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    message.error('下载失败');
  }
};

// 删除文件
const handleDelete = async (record) => {
  try {
    await deleteFile(record.id);
    message.success('删除成功');
    fetchFiles(); // 重新加载列表
  } catch (error) {
    message.error('删除失败');
  }
};

onMounted(() => {
  fetchFiles();
  fetchProjects();
});

</script>

<style scoped>
.filter-form {
  margin-bottom: 20px;
}
.app-container {
    padding: 20px;
}
</style>