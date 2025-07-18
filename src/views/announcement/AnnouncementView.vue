<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">系统公告</h1>
      <a-button type="primary" @click="openModal('create')" v-if="hasPermission('manage_announcements')">
        <template #icon><PlusOutlined /></template>
        发布新公告
      </a-button>
    </div>

    <!-- 公告列表 -->
    <a-list
      class="announcement-list"
      item-layout="horizontal"
      :data-source="announcements"
      :loading="loading"
    >
      <template #renderItem="{ item }">
        <a-list-item>
          <template #actions>
            <a-space>
              <a-button type="link" @click="openModal('view', item)">查看</a-button>
              <template v-if="isAdmin">
                <a-button type="link" @click="openModal('edit', item)">编辑</a-button>
                <a-popconfirm
                  :title="`确定要'${item.is_active ? '下线' : '上线'}'此公告吗?`"
                  @confirm="handleToggleStatus(item)"
                >
                  <a-button type="link" :danger="item.is_active">{{
                    item.is_active ? "下线" : "上线"
                  }}</a-button>
                </a-popconfirm>
                <a-button type="link" @click="openStatsModal(item)">统计</a-button>
              </template>
            </a-space>
          </template>
          <a-list-item-meta>
            <template #title>
              <a-badge :dot="!item.is_read_by_current_user">
                <a @click="openModal('view', item)">{{ item.title }}</a>
              </a-badge>
            </template>
            <template #avatar>
              <a-avatar :style="{ backgroundColor: getPriorityColor(item.priority) }">
                <template #icon><SoundOutlined /></template>
              </a-avatar>
            </template>
            <template #description>
              <span>发布人: {{ item.creator_name }}</span>
              <a-divider type="vertical" />
              <span>发布于: {{ dayjs(item.created_at).format("YYYY-MM-DD") }}</span>
              <a-divider type="vertical" />
              <a-tag v-if="!item.is_active" color="warning">已下线</a-tag>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>

    <!-- 创建/编辑/查看 Modal -->
    <a-modal
      v-model:open="isModalVisible"
      :title="modalTitle"
      :width="800"
      @ok="handleModalOk"
      :confirm-loading="modalLoading"
      :footer="modalMode === 'view' ? null : undefined"
    >
      <div v-if="modalMode === 'view' && currentAnnouncement">
        <h2>{{ currentAnnouncement.title }}</h2>
        <div v-html="currentAnnouncement.content" class="announcement-content"></div>
        <a-divider />
        <h4>附件列表</h4>
        <p
          v-if="
            !currentAnnouncement.attachments ||
            currentAnnouncement.attachments.length === 0
          "
        >
          无附件
        </p>
        <a-list
          v-else
          item-layout="horizontal"
          :data-source="currentAnnouncement.attachments"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                :description="`大小: ${(item.file_size / 1024).toFixed(2)} KB`"
              >
                <template #title
                  ><a>{{ item.original_filename }}</a></template
                >
                <template #avatar><PaperClipOutlined /></template>
              </a-list-item-meta>
              <template #actions>
                <!-- 新增：预览按钮 -->
                <a-button type="link" @click="handlePreview('announcement', item.id)"
                  >预览</a-button
                >
                <a-button type="link" @click="handleDownload(item)">下载</a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>

      <a-form v-else ref="formRef" :model="formState" layout="vertical">
        <a-form-item name="title" label="标题" :rules="[{ required: true }]"
          ><a-input v-model:value="formState.title"
        /></a-form-item>
        <a-form-item name="content" label="内容" :rules="[{ required: true }]"
          ><a-textarea v-model:value="formState.content" :rows="6"
        /></a-form-item>
        <a-form-item name="priority" label="优先级"
          ><a-radio-group v-model:value="formState.priority"
            ><a-radio :value="0">普通</a-radio><a-radio :value="1">重要</a-radio
            ><a-radio :value="2">紧急</a-radio></a-radio-group
          ></a-form-item
        >
        <a-form-item label="附件 (仅创建时可上传)"
          ><a-upload-dragger
            v-model:fileList="fileList"
            name="attachments"
            multiple
            :before-upload="() => false"
            :disabled="modalMode === 'edit'"
            ><p class="ant-upload-drag-icon"><InboxOutlined /></p>
            <p>点击或拖拽文件上传</p></a-upload-dragger
          ></a-form-item
        >
      </a-form>
    </a-modal>

    <!-- 阅读统计 Modal -->
    <a-modal
      v-model:open="isStatsModalVisible"
      title="阅读统计"
      :width="600"
      :footer="null"
    >
      <div v-if="statsLoading"><a-spin /></div>
      <div v-if="!statsLoading && readStats">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-card size="small" :title="`已读 (${readStats.read_count})`">
              <a-list
                size="small"
                :data-source="readStats.read_users"
                :row-key="(item) => item.id"
                ><template #renderItem="{ item }">
                  <a-list-item>{{ item.username }}</a-list-item></template
                ></a-list
              >
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card size="small" :title="`未读 (${readStats.unread_count})`">
              <a-list
                size="small"
                :data-source="readStats.unread_users"
                :row-key="(item) => item.id"
                ><template #renderItem="{ item }">
                  <a-list-item>{{ item.username }}</a-list-item></template
                ></a-list
              >
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";

const hasPermission = computed(() => store.getters["user/hasPermission"]);
import {
  getAnnouncements,
  getAnnouncementDetail,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  getReadStatistics,
  downloadAttachment,
} from "@/api/announcement";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  SoundOutlined,
  PaperClipOutlined,
  InboxOutlined,
} from "@ant-design/icons-vue";
import { getFilePreviewUrl } from '@/api/utils'; // 引入新的预览 URL 工具
import dayjs from "dayjs";

// --- State & Hooks ---
const store = useStore();
const loading = ref(false);
const announcements = ref([]);
const currentAnnouncement = ref(null);

// Modal State
const isModalVisible = ref(false);
const modalLoading = ref(false);
const modalMode = ref("view"); // 'create', 'edit', 'view'
const modalTitle = ref("");
const formRef = ref();
const formState = ref({});
const fileList = ref([]);

// Stats Modal State
const isStatsModalVisible = ref(false);
const statsLoading = ref(false);
const readStats = ref(null);

// --- Computed ---
const isAdmin = computed(() =>
  ["SUPER", "ADMIN"].includes(store.getters["user/userRole"])
);

// --- Methods ---
const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    announcements.value = await getAnnouncements();
  } catch (error) {
    message.error("加载公告列表失败");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAnnouncements);

// Modal Handling
const openModal = async (mode, item = null) => {
  modalMode.value = mode;
  if (mode === "create") {
    modalTitle.value = "发布新公告";
    formState.value = { title: "", content: "", priority: 0 };
    fileList.value = [];
    isModalVisible.value = true;
  } else if (mode === "edit") {
    modalTitle.value = "编辑公告";
    currentAnnouncement.value = item;
    formState.value = { ...item };
    isModalVisible.value = true;
  } else if (mode === "view") {
    try {
      const detail = await getAnnouncementDetail(item.id);
      currentAnnouncement.value = detail;
      // 更新列表中的已读状态
      const index = announcements.value.findIndex((a) => a.id === item.id);
      if (index !== -1) announcements.value[index].is_read_by_current_user = true;
      modalTitle.value = "公告详情";
      isModalVisible.value = true;
    } catch (error) {
      message.error("获取详情失败");
    }
  }
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    modalLoading.value = true;
    const formData = new FormData();
    formData.append("title", formState.value.title);
    formData.append("content", formState.value.content);
    formData.append("priority", formState.value.priority);

    if (modalMode.value === "create") {
      fileList.value.forEach((file) => {
        formData.append("attachments", file.originFileObj);
      });
      await createAnnouncement(formData);
      message.success("公告发布成功");
    } else {
      // edit mode
      await updateAnnouncement(currentAnnouncement.value.id, {
        title: formState.value.title,
        content: formState.value.content,
        priority: formState.value.priority,
      });
      message.success("公告更新成功");
    }
    isModalVisible.value = false;
    fetchAnnouncements();
  } catch (error) {
    message.error("操作失败");
  } finally {
    modalLoading.value = false;
  }
};

// Actions
const handleToggleStatus = async (item) => {
  try {
    await toggleAnnouncementStatus(item.id);
    message.success("状态更新成功");
    fetchAnnouncements();
  } catch (error) {
    message.error("操作失败");
  }
};

const openStatsModal = async (item) => {
  isStatsModalVisible.value = true;
  statsLoading.value = true;
  try {
    readStats.value = await getReadStatistics(item.id);
  } catch (error) {
    message.error("加载统计数据失败");
  } finally {
    statsLoading.value = false;
  }
};

// 附件下载
const handleDownload = async (attachment) => {
  try {
    const response = await downloadAttachment(attachment.id);
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", attachment.original_filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    message.error("下载失败");
  }
};

// 预览
const handlePreview = (modelName, fileId) => {
    const url = getFilePreviewUrl(modelName, fileId);
    window.open(url, '_blank'); // 在新标签页中打开预览
};


// UI Helpers
const getPriorityColor = (priority) => {
  if (priority === 2) return "#f5222d"; // 紧急
  if (priority === 1) return "#faad14"; // 重要
  return "#1890ff"; // 普通
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
.announcement-list {
  background: #fff;
  padding: 0 24px;
  border-radius: 8px;
}
.announcement-content {
  white-space: pre-wrap; /* 保持换行和空格 */
  word-break: break-all;
}
</style>
