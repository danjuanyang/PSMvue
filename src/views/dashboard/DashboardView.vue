<template>
  <a-layout-content style="padding: 24px 0; background: #f0f2f5;">
    <!-- 欢迎头部 -->
    <div class="page-header">
      <h1 class="welcome-title">欢迎回来, {{ username }}!</h1>
      <p class="welcome-subtitle">今天是 {{ formattedDate }}</p>
    </div>

    <!-- 数据统计卡片 -->
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :sm="12" :md="8">
        <a-card :bordered="false" class="statistic-card">
          <a-statistic title="进行中的项目" :value="projects.length" style="margin-right: 50px">
            <template #prefix><ProjectOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="8">
        <a-card :bordered="false" class="statistic-card">
          <a-statistic title="未读提醒" :value="alerts.length" class="demo-class">
            <template #prefix><BellOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
       <a-col :xs="24" :sm="12" :md="8">
        <a-card :bordered="false" class="statistic-card">
          <a-statistic title="未读公告" :value="unreadAnnouncementsCount" class="demo-class">
            <template #prefix><SoundOutlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[24, 24]" style="margin-top: 24px;">
      <!-- 我的项目 -->
      <a-col :xs="24" :lg="16">
        <a-card :bordered="false" title="我的项目" class="data-card">
          <a-table :columns="projectColumns" :data-source="projects" row-key="id" :pagination="{ pageSize: 5 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'progress'">
                <a-progress :percent="record.progress" />
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 最新动态 -->
      <a-col :xs="24" :lg="8">
        <a-card :bordered="false" title="最新动态" class="data-card">
          <a-list item-layout="horizontal" :data-source="combinedFeed">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a href="#">{{ item.title }}</a>
                  </template>
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.type === 'alert' ? '#f5222d' : '#1890ff' }">
                      <template #icon>
                        <component :is="item.icon" />
                      </template>
                    </a-avatar>
                  </template>
                  <template #description>
                    <span>{{ item.time }}</span>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

  </a-layout-content>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue';
import { useStore } from 'vuex';
import { getMyProjects } from '@/api/project';
import { getMyAlerts } from '@/api/alert';
import { getAnnouncements } from '@/api/announcement';
import { ProjectOutlined, BellOutlined, SoundOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime'; // <--- 导入 relativeTime 插件

dayjs.locale('zh-cn');
dayjs.extend(relativeTime); // <--- 使用插件

// ---Vuex和状态 ---
const store = useStore();
const projects = ref([]);
const alerts = ref([]);
const announcements = ref([]);

// --- 计算属性 ---
const username = computed(() => store.getters['user/currentUser']?.username || '用户');
const formattedDate = computed(() => dayjs().format('YYYY年MM月DD日 dddd'));
const unreadAnnouncementsCount = computed(() => announcements.value.filter(a => !a.is_read_by_current_user).length);

const combinedFeed = computed(() => {
  const alertFeed = alerts.value.map(a => ({
    type: 'alert',
    title: a.message,
    time: dayjs(a.created_at).fromNow(),
    icon: h(BellOutlined) // 使用 h 函数渲染组件
  }));
  const announcementFeed = announcements.value.filter(a => !a.is_read_by_current_user).map(a => ({
    type: 'announcement',
    title: a.title,
    time: dayjs(a.created_at).fromNow(),
    icon: h(SoundOutlined) // 使用 h 函数渲染组件
  }));
  
  // 合并并排序，最新的在前面
  const feed = [...alertFeed, ...announcementFeed].sort((a, b) => dayjs(b.time, 'YYYY-MM-DD HH:mm:ss').valueOf() - dayjs(a.time, 'YYYY-MM-DD HH:mm:ss').valueOf());
  return feed.slice(0, 5); // 只显示最新的5条
});


// --- Lifecycle Hooks ---
onMounted(async () => {
  try {
    const [projectData, alertData, announcementData] = await Promise.all([
        getMyProjects(),
        getMyAlerts(),
        getAnnouncements()
    ]);
    projects.value = projectData;
    alerts.value = alertData;
    announcements.value = announcementData;
  } catch (error) {
    console.error("加载Dashboard数据失败:", error);
  }
});

// --- 表和显示逻辑 ---
const projectColumns = [
  { title: '项目名称', dataIndex: 'name', key: 'name' },
  { title: '负责人', dataIndex: 'employee_name', key: 'employee' },
  { title: '进度', dataIndex: 'progress', key: 'progress' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

const getStatusColor = (status) => {
  const colors = {
    'IN_PROGRESS': 'processing',
    'COMPLETED': 'success',
    'PENDING': 'default',
    'PAUSED': 'warning',
  };
  return colors[status] || 'default';
};

const getStatusText = (status) => {
    const texts = {
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'PENDING': '未开始',
    'PAUSED': '已暂停',
  };
  return texts[status] || '未知';
}

</script>

<style scoped>
.page-header {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}
.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}
.welcome-subtitle {
  font-size: 14px;
  color: #6b7280;
}
.statistic-card {
  border-radius: 8px;
}
.statistic-card .ant-statistic-title {
  color: #6b7280;
}
.statistic-card .ant-statistic-content {
  font-size: 28px;
  font-weight: 700;
}
.statistic-card .ant-statistic-content .ant-statistic-content-prefix {
  margin-right: 12px;
  font-size: 24px;
}
.data-card {
  border-radius: 8px;
}
</style>
