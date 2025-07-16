<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">月度补卡填报</h1>
      <p class="page-subtitle">请在日历上选择本月的周末进行补卡，最多3天且不能连续。</p>
    </div>

    <!-- 如果本月已经提交过，则显示提示信息 -->
    <a-alert v-if="hasSubmitted" type="success" show-icon style="margin-bottom: 24px">
      <template #message><b>本月您已提交补卡，内容如下：</b></template>
      <template #description>
        <ul>
          <li v-for="item in submittedRecords" :key="item.id">
            {{ item.clockin_date }}: {{ item.remarks }}
          </li>
        </ul>
      </template>
    </a-alert>

    <!-- 如果未提交，则显示日历以供选择 -->
    <a-card :bordered="false" v-if="!hasSubmitted">
      <a-calendar
        v-model:value="selectedDate"
        :locale="locale"
        :disabled-date="disabledDate"
      >
        <template #dateCellRender="{ current }">
          <div class="date-cell" @click="handleDateClick(current)">
            <div
              v-for="item in getRemarksForDate(current)"
              :key="item.date"
              class="remark-item"
            >
              <a-badge status="warning" :text="item.remarks" />
            </div>
          </div>
        </template>
      </a-calendar>
    </a-card>

    <!-- 底部提交工具栏 -->
    <div class="footer-toolbar" v-if="!hasSubmitted">
      <a-button
        type="primary"
        :disabled="!isSubmittable"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交 {{ selectedDate.format("YYYY年MM月") }} 的补卡记录
      </a-button>
      <p v-if="!isSubmittable" class="tip">
        提示：每月只能提交一次，且需在28日后操作。
      </p>
    </div>

    <!-- 编辑/添加备注的弹窗 -->
    <a-modal v-model:open="isModalVisible" title="填写补卡事由" @ok="handleModalOk">
      <p>
        为日期
        <strong>{{ currentEditingDate?.format("YYYY-MM-DD") }}</strong> 添加补卡备注：
      </p>
      <a-textarea
        v-model:value="currentRemark"
        placeholder="必填：请输入具体事由"
        :rows="4"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  submitClockInReport,
  getMyCurrentMonthRecords,
} from "@/api/hr"; // 确保 API 路径和函数名正确
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import locale from "ant-design-vue/es/date-picker/locale/zh_CN";

dayjs.extend(isBetween);

// --- 响应式状态定义 ---
const loading = ref(false);
const submitting = ref(false);

// 用户视图状态
const selectedDate = ref(dayjs());
const reportDetails = ref([]); // 存储用户在本月选择的补卡日期和事由
const hasSubmitted = ref(false); // 本月是否已提交
const submittedRecords = ref([]); // 已提交的记录

// 弹窗状态
const isModalVisible = ref(false);
const currentEditingDate = ref(null);
const currentRemark = ref("");

// --- 计算属性 ---
// 检查是否满足提交条件（例如每月28号之后）
const isSubmittable = computed(() => dayjs().date() >= 28);

// --- 方法 ---

// 检查用户当月是否已经提交过补卡申请
const checkSubmissionStatus = async () => {
  loading.value = true;
  try {
    const records = await getMyCurrentMonthRecords();
    if (records && records.length > 0) {
      hasSubmitted.value = true;
      submittedRecords.value = records;
    }
  } catch (error) {
    message.error("查询提交状态失败，请稍后重试");
    console.error("Check submission status error:", error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时执行检查
onMounted(() => {
  checkSubmissionStatus();
});

// 获取特定日期的备注信息，用于在日历上显示
const getRemarksForDate = (date) =>
  reportDetails.value.filter((item) => dayjs(item.date).isSame(date, "day"));

// 控制日历中哪些日期可选
const disabledDate = (date) => {
  const isCurrentMonth = date.isSame(selectedDate.value, "month");
  const dayOfWeek = date.day(); // 0 是周日, 6 是周六
  // 只允许选择当前月份的周六日
  return !isCurrentMonth || (dayOfWeek !== 0 && dayOfWeek !== 6);
};

// 处理日期点击事件
const handleDateClick = (date) => {
  if (disabledDate(date)) return; // 如果是不可选日期，则不处理

  const dateStr = date.format("YYYY-MM-DD");
  const isSelected = reportDetails.value.some((item) => item.date === dateStr);

  if (!isSelected) {
    // 新增选择
    if (reportDetails.value.length >= 3) {
      message.warn("每月最多只能补卡3天。");
      return;
    }
    // 检查是否连续选择周六日
    const dayOfWeek = date.day();
    if (dayOfWeek === 0) { // 周日
      const prevDay = date.subtract(1, "day").format("YYYY-MM-DD");
      if (reportDetails.value.some((item) => item.date === prevDay)) {
        message.warn("不能选择连续的周六和周日。");
        return;
      }
    }
    if (dayOfWeek === 6) { // 周六
      const nextDay = date.add(1, "day").format("YYYY-MM-DD");
      if (reportDetails.value.some((item) => item.date === nextDay)) {
        message.warn("不能选择连续的周六和周日。");
        return;
      }
    }
  }

  // 打开弹窗填写事由
  currentEditingDate.value = date;
  const existingRemark = reportDetails.value.find((item) => item.date === dateStr);
  currentRemark.value = existingRemark ? existingRemark.remarks : "";
  isModalVisible.value = true;
};

// 弹窗确认事件
const handleModalOk = () => {
  if (!currentRemark.value) {
    message.error("请填写补卡事由");
    return;
  }
  const dateStr = currentEditingDate.value.format("YYYY-MM-DD");
  const existingIndex = reportDetails.value.findIndex((item) => item.date === dateStr);

  if (existingIndex > -1) {
    // 更新事由
    reportDetails.value[existingIndex].remarks = currentRemark.value;
  } else {
    // 添加新记录
    reportDetails.value.push({ date: dateStr, remarks: currentRemark.value });
  }
  isModalVisible.value = false;
};

// 最终提交
const handleSubmit = async () => {
  if (reportDetails.value.length === 0) {
    message.warn("您没有填写任何补卡记录，无需提交。");
    return;
  }
  submitting.value = true;
  try {
    const reportData = {
      year: selectedDate.value.year(),
      month: selectedDate.value.month() + 1,
      details: reportDetails.value.map(item => ({
        clockin_date: item.date,
        remarks: item.remarks,
        weekday: dayjs(item.date).format('dddd') // 按照旧逻辑，可以补充星期
      })),
    };
    await submitClockInReport(reportData);
    message.success("补卡记录提交成功！");
    reportDetails.value = [];
    checkSubmissionStatus(); // 提交成功后刷新状态
  } catch (error) {
    message.error("提交失败，请检查网络或联系管理员");
    console.error("Submit error:", error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.page-container {
  padding: 24px;
  background: #f0f2f5;
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
.date-cell {
  height: 100%;
  cursor: pointer;
}
.remark-item {
  font-size: 12px;
}
.footer-toolbar {
  position: fixed;
  bottom: 0;
  left: 200px; /* 根据你的布局调整 */
  right: 0;
  height: 56px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.03);
  transition: left 0.2s;
  z-index: 100;
}
.footer-toolbar .tip {
  margin-left: 16px;
  color: #888;
}
</style>
