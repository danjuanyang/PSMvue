<template>
  <div class="page-container">
    <!-- 管理员视图 -->
    <div v-if="isAdmin">
      <div class="page-header">
        <h1 class="page-title">补卡记录统计</h1>
        <p class="page-subtitle">筛选并查看所有员工的补卡记录。</p>
      </div>
      <!-- 统计数据卡片 -->
      <a-row :gutter="16">
        <a-col :span="8"><a-card><a-statistic title="本月补卡申请数" :value="stats.totalReports" /></a-card></a-col>
        <a-col :span="8"><a-card><a-statistic title="补卡总天数" :value="stats.totalDays" /></a-card></a-col>
        <a-col :span="8"><a-card><a-statistic title="申请总人数" :value="stats.totalUsers" /></a-card></a-col>
      </a-row>
      <a-card :bordered="false" style="margin-top: 24px">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
          <a-form layout="inline" :model="queryState" @finish="fetchRecords">
            <a-form-item label="月份"><a-date-picker v-model:value="queryState.month" picker="month" :locale="locale" /></a-form-item>
            <a-form-item><a-button type="primary" html-type="submit" :loading="loading">查询</a-button></a-form-item>
          </a-form>
          <a-button @click="exportToExcel"><FileExcelOutlined /> 导出 Excel</a-button>
        </div>
        <!-- 核心修改 #1: 表格使用新的数据源和列定义 -->
        <a-table
          :columns="adminColumns"
          :data-source="processedRecordsForTable"
          :loading="loading"
          row-key="id"
          bordered
        />
      </a-card>
    </div>

    <!-- 员工视图 -->
    <div v-else>
      <div class="page-header">
        <h1 class="page-title">月度补卡填报</h1>
        <p class="page-subtitle">请在日历上选择本月的周末进行补卡，最多3天且不能连续。</p>
      </div>
      <a-alert v-if="hasSubmitted" type="success" show-icon style="margin-bottom: 24px">
        <template #message><b>本月您已提交补卡，内容如下：</b></template>
        <template #description>
          <ul><li v-for="item in submittedRecords" :key="item.id">{{ item.clockin_date }}: {{ item.remarks }}</li></ul>
        </template>
      </a-alert>
      <a-card :bordered="false" v-if="!hasSubmitted">
        <a-calendar v-model:value="selectedDate" :locale="locale" :disabled-date="disabledDate">
          <template #dateCellRender="{ current }">
            <div class="date-cell" @click="handleDateClick(current)">
              <div v-for="item in getRemarksForDate(current)" :key="item.date" class="remark-item">
                <a-badge status="warning" :text="item.remarks" />
              </div>
            </div>
          </template>
        </a-calendar>
      </a-card>
      <div class="footer-toolbar" v-if="!hasSubmitted">
        <a-button type="primary" :disabled="!isSubmittable" :loading="submitting" @click="handleSubmit">
          提交 {{ selectedDate.format("YYYY年MM月") }} 的补卡记录
        </a-button>
        <p v-if="!isSubmittable" class="tip">提示：每月只能提交一次，且需在28日后操作。</p>
      </div>
    </div>

    <a-modal v-model:open="isModalVisible" title="填写补卡事由" @ok="handleModalOk">
      <p>为日期 <strong>{{ currentEditingDate?.format("YYYY-MM-DD") }}</strong> 添加补卡备注：</p>
      <a-textarea v-model:value="currentRemark" placeholder="必填：请输入具体事由" :rows="4" />
    </a-modal>
  </div>
</template>

<script setup>
// 所有 import 语句必须在最前面
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { submitClockInReport, getClockInRecords, getMyCurrentMonthRecords } from "@/api/hr";
import { message } from "ant-design-vue";
import { FileExcelOutlined } from '@ant-design/icons-vue';
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN'; // 补全 locale 导入

dayjs.extend(isBetween);

// --- State & Hooks ---
const store = useStore();
const loading = ref(false);
const submitting = ref(false);

// Admin State
const queryState = ref({ month: dayjs() });
const records = ref([]);

// User State
const selectedDate = ref(dayjs());
const reportDetails = ref([]);
const hasSubmitted = ref(false);
const submittedRecords = ref([]);

// Modal State
const isModalVisible = ref(false);
const currentEditingDate = ref(null);
const currentRemark = ref('');

// --- Computed Properties ---
const isAdmin = computed(() => ["SUPER", "ADMIN"].includes(store.getters["user/userRole"]));
const isSubmittable = computed(() => dayjs().date() >= 28); // 补全 isSubmittable

const stats = computed(() => {
  const userSet = new Set(records.value.map((r) => r.employee_id));
  return {
    totalReports: userSet.size, // 按申请人数统计
    totalDays: records.value.length,
    totalUsers: userSet.size,
  };
});

// --- Methods ---
const adminColumns = [
  {
    title: "员工姓名",
    dataIndex: "employee_name",
    customRender: ({ record }) => ({
      children: record.employee_name,
      props: { rowSpan: record.rowSpan },
    }),
  },
  {
    title: "提交时间",
    dataIndex: "created_at",
    customRender: ({ text, record }) => ({
      children: dayjs(text).format("YYYY/MM/DD HH:mm"),
      props: { rowSpan: record.rowSpan },
    }),
  },
  { title: "补卡日期", dataIndex: "clockin_date"},
  { title: "补卡备注", dataIndex: "remarks" },
];



const fetchRecords = async () => {
  loading.value = true;
  try {
    const response = await getClockInRecords({
      year: queryState.value.month.year(),
      month: queryState.value.month.month() + 1,
    });
    // 按员工姓名和提交时间排序，确保相同员工的记录在一起
    records.value = response.sort((a, b) => {
        if (a.employee_name < b.employee_name) return -1;
        if (a.employee_name > b.employee_name) return 1;
        return new Date(a.created_at) - new Date(b.created_at);
    });
  } catch (error) { message.error("查询记录失败"); } finally { loading.value = false; }
};

const exportToExcel = () => {
    const title = [{ A: '补卡记录导出' }];
    const exportTime = [{ A: `导出时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}` }];

    // 按员工分组
    const employeeGroups = {};
    records.value.forEach(row => {
        if (!employeeGroups[row.employee_id]) {
            employeeGroups[row.employee_id] = {
                employee_name: row.employee_name,
                report_date: row.created_at,
                details: []
            };
        }
        employeeGroups[row.employee_id].details.push(`${row.clockin_date}: ${row.remarks || '无'}`);
    });


// 转换为最终导出格式
const dataForExport = Object.values(employeeGroups).map(group => ({
        '员工姓名': group.employee_name,
        '提交时间': dayjs(group.report_date).format('YYYY/MM/DD HH:mm'),
        '补卡天数': group.details.length,
        '补卡备注': group.details.join('\n') // 使用换行符连接多条备注
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_json(worksheet, title, { skipHeader: true, origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, exportTime, { skipHeader: true, origin: 'A2' });
    XLSX.utils.sheet_add_json(worksheet, dataForExport, { origin: 'A4' });

    // 设置列宽
    worksheet['!cols'] = [
        { wch: 15 }, // 员工姓名
        { wch: 20 }, // 提交时间
        { wch: 10 }, // 补卡天数
        { wch: 50 }  // 补卡备注
    ];

    // 设置备注列自动换行
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = 3; R <= range.e.r; ++R) { // 从第4行开始 (标题和时间占了3行)
        const cell_address = { c: 3, r: R }; // 第4列 (D列)
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (worksheet[cell_ref]) {
            worksheet[cell_ref].s = { alignment: { wrapText: true, vertical: 'top' } };
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '补卡记录');
    XLSX.writeFile(workbook, `补卡记录_${queryState.value.month.format("YYYY-MM")}.xlsx`);
};

const checkSubmissionStatus = async () => {
  loading.value = true;
  try {
    const records = await getMyCurrentMonthRecords();
    if (records.length > 0) {
      hasSubmitted.value = true;
      submittedRecords.value = records;
    }
  } catch (error) { message.error("查询提交状态失败"); } finally { loading.value = false; }
};

onMounted(() => {
  if (isAdmin.value) { fetchRecords(); } else { checkSubmissionStatus(); }
});

const getRemarksForDate = (date) => reportDetails.value.filter((item) => dayjs(item.date).isSame(date, "day"));

const disabledDate = (date) => {
  const isCurrentMonth = date.isSame(selectedDate.value, "month");
  const dayOfWeek = date.day();
  return !isCurrentMonth || (dayOfWeek !== 0 && dayOfWeek !== 6);
};

const handleDateClick = (date) => {
  if (disabledDate(date)) return;
  const dateStr = date.format("YYYY-MM-DD");
  const isSelected = reportDetails.value.some((item) => item.date === dateStr);
  if (!isSelected) {
    if (reportDetails.value.length >= 3) { message.warn("每月最多只能补卡3天。"); return; }
    const dayOfWeek = date.day();
    if (dayOfWeek === 0) {
      const prevDay = date.subtract(1, "day").format("YYYY-MM-DD");
      if (reportDetails.value.some((item) => item.date === prevDay)) { message.warn("不能选择连续的周六和周日。"); return; }
    }
    if (dayOfWeek === 6) {
      const nextDay = date.add(1, "day").format("YYYY-MM-DD");
      if (reportDetails.value.some((item) => item.date === nextDay)) { message.warn("不能选择连续的周六和周日。"); return; }
    }
  }
  currentEditingDate.value = date;
  const existingRemark = reportDetails.value.find((item) => item.date === dateStr);
  currentRemark.value = existingRemark ? existingRemark.remarks : "";
  isModalVisible.value = true;
};

const handleModalOk = () => {
  if (!currentRemark.value) { message.error("请填写补卡事由"); return; }
  const dateStr = currentEditingDate.value.format("YYYY-MM-DD");
  const existingIndex = reportDetails.value.findIndex((item) => item.date === dateStr);
  if (existingIndex > -1) {
    reportDetails.value[existingIndex].remarks = currentRemark.value;
  } else {
    reportDetails.value.push({ date: dateStr, remarks: currentRemark.value });
  }
  isModalVisible.value = false;
};

// 为表格生成带合并信息的数据
const processedRecordsForTable = computed(() => {
  const result = [];
  const employeeGroups = {};
  // 按 employee_id 分组
  records.value.forEach(item => {
    if (!employeeGroups[item.employee_id]) {
      employeeGroups[item.employee_id] = [];
    }
    employeeGroups[item.employee_id].push(item);
  });

  // 展开数据并添加 rowSpan 信息
  Object.values(employeeGroups).forEach(group => {
    group.forEach((item, index) => {
      result.push({
        ...item,
        rowSpan: index === 0 ? group.length : 0, // 只有每组的第一行有 rowSpan
      });
    });
  });
  return result;
});



const handleSubmit = async () => {
  if (reportDetails.value.length === 0) { message.warn("您没有填写任何补卡记录，无需提交。"); return; }
  submitting.value = true;
  try {
    const reportData = {
      year: selectedDate.value.year(),
      month: selectedDate.value.month() + 1,
      details: reportDetails.value,
    };
    await submitClockInReport(reportData);
    message.success("补卡记录提交成功！");
    reportDetails.value = [];
    checkSubmissionStatus(); // 提交成功后再次检查状态，显示已提交视图
  } catch (error) { console.error("提交失败:", error); } finally { submitting.value = false; }
};
</script>

<style scoped>
.page-container { padding: 24px; }
.page-header { background: #fff; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; margin-bottom: 0; }
.page-subtitle { font-size: 14px; color: #6b7280; }
.date-cell { height: 100%; }
.remark-item { font-size: 12px; }
.footer-toolbar { position: fixed; bottom: 0; left: 200px; right: 0; height: 56px; background: #fff; padding: 0 24px; display: flex; align-items: center; box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.03); transition: left 0.2s; }
.footer-toolbar .tip { margin-left: 16px; color: #888; }
</style>
