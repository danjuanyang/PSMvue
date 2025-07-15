<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">每日进度报告</h1>
      <p class="page-subtitle">查看和筛选所有员工提交的任务进度更新。</p>
    </div>

    <a-card :bordered="false">
      <!-- 修复 #1: 新的筛选区域 -->
      <a-form
        layout="inline"
        :model="filters"
        @finish="fetchData"
        style="margin-bottom: 24px"
      >
        <a-form-item label="筛选范围">
          <a-radio-group v-model:value="filters.period" button-style="solid">
            <a-radio-button value="day">今日</a-radio-button>
            <a-radio-button value="week">本周</a-radio-button>
            <a-radio-button value="month">本月</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="选择员工">
          <a-select
            v-model:value="filters.recorder_id"
            placeholder="所有员工"
            style="width: 150px"
            allow-clear
          >
            <a-select-option
              v-for="user in employeeList"
              :key="user.id"
              :value="user.id"
              >{{ user.username }}</a-select-option
            >
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">查询</a-button>
        </a-form-item>
      </a-form>

      <!-- 修复 #2: 图表区域 -->
      <a-card
        :title="`${
          filters.period === 'month'
            ? '本月'
            : filters.period === 'week'
            ? '本周'
            : '今日'
        }更新统计`"
      >
        <v-chart class="chart" :option="chartOption" autoresize />
      </a-card>

      <!-- 修复 #4: 新的列表样式 -->
      <a-timeline style="margin-top: 24px">
        <a-timeline-item v-for="item in allUpdates" :key="item.id">
          <a-card class="update-card">
            <a-row type="flex" justify="space-between">
              <a-col :span="18">
                <a-space align="center">
                  <a-avatar><UserOutlined /></a-avatar>
                  <span class="recorder-name">{{ item.recorder_name }}</span>
                  <span class="update-time">{{
                    dayjs(item.created_at).format("YYYY-MM-DD HH:mm")
                  }}</span>
                </a-space>
                <a-breadcrumb class="breadcrumb-nav">
                  <a-breadcrumb-item>{{ item.task_info.project }}</a-breadcrumb-item>
                  <a-breadcrumb-item>{{ item.task_info.subproject }}</a-breadcrumb-item>
                  <a-breadcrumb-item
                    ><strong>{{ item.task_info.name }}</strong></a-breadcrumb-item
                  >
                </a-breadcrumb>
                <div class="update-content">{{ item.description }}</div>
              </a-col>
              <a-col :span="6" style="text-align: right">
                <div class="progress-change">
                  <span>{{ item.previous_progress }}%</span>
                  <ArrowRightOutlined style="margin: 0 8px" />
                  <strong>{{ item.progress }}%</strong>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-timeline-item>
      </a-timeline>
      <a-empty v-if="!loading && allUpdates.length === 0" description="暂无数据" />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getTaskProgressUpdates } from "@/api/project";
import { getUsers } from "@/api/admin";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { UserOutlined, ArrowRightOutlined } from "@ant-design/icons-vue";

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
]);

// --- State & Refs ---
const loading = ref(false);
const allUpdates = ref([]);
const allUsers = ref([]);
const filters = ref({
  period: "day",
  recorder_id: null,
});

// --- Data Fetching ---
const fetchData = async () => {
  loading.value = true;
  try {
    const [updatesRes, usersRes] = await Promise.all([
      getTaskProgressUpdates(filters.value),
      getUsers(),
    ]);
    allUpdates.value = updatesRes;
    allUsers.value = usersRes.users;
  } catch (error) {
    message.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

// --- Computed Properties ---
// 修复 #3: 过滤员工列表
const employeeList = computed(() =>
  allUsers.value.filter((u) => u.role === "LEADER" || u.role === "MEMBER")
);

// 修复 #2: 新的图表逻辑
const chartOption = computed(() => {
  const dataByUser = {};
  allUpdates.value.forEach((update) => {
    const name = update.recorder_name;
    if (!dataByUser[name]) dataByUser[name] = 0;
    dataByUser[name]++;
  });

  const dailyData = {};
  allUpdates.value.forEach((update) => {
    const date = dayjs(update.created_at).format("YYYY-MM-DD");
    if (!dailyData[date]) dailyData[date] = 0;
    dailyData[date]++;
  });

  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["更新次数", "用户平均"] },
    xAxis: { type: "category", data: Object.keys(dataByUser) },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      { name: "更新次数", type: "bar", data: Object.values(dataByUser) },
      {
        name: "用户平均",
        type: "line",
        data: Array(Object.keys(dataByUser).length).fill(
          allUpdates.value.length / Object.keys(dataByUser).length || 0
        ),
      },
    ],
  };
});
</script>

<style scoped>
.page-container {
  padding: 24px;
}
.page-header {
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
.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}
.chart {
  height: 300px;
}
.update-card {
  width: 100%;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.3s;
}
.update-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}
.recorder-name {
  font-weight: 500;
}
.update-time {
  font-size: 12px;
  color: #888;
}
.breadcrumb-nav {
  margin: 8px 0;
}
.update-content {
  margin-top: 12px;
  color: #555;
}
.progress-change {
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}
</style>
