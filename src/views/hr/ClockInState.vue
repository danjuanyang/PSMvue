<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">补卡记录统计</h1>
      <p class="page-subtitle">筛选并查看所有员工的补卡记录。</p>
    </div>

    <!-- 统计数据卡片 -->
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card>
          <a-statistic title="本月补卡申请数" :value="stats.totalReports" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <a-statistic title="补卡总天数" :value="stats.totalDays" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <a-statistic title="申请总人数" :value="stats.totalUsers" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选与表格 -->
    <a-card :bordered="false" style="margin-top: 24px">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
        <!-- 月份筛选表单 -->
        <a-form layout="inline" :model="queryState" @finish="fetchRecords">
          <a-form-item label="月份">
            <a-date-picker
              v-model:value="queryState.month"
              picker="month"
              :locale="locale"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="loading">查询</a-button>
          </a-form-item>
        </a-form>
        <!-- 导出按钮 -->
        <a-button @click="exportToExcel">
          <template #icon><FileExcelOutlined /></template>
          导出 Excel
        </a-button>
      </div>

      <!-- 补卡记录表格 -->
      <a-table
        :columns="adminColumns"
        :data-source="processedRecordsForTable"
        :loading="loading"
        row-key="id"
        bordered
        :pagination="false"
      />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getClockInRecords } from "@/api/hr"; // 确保 API 路径和函数名正确
import { message } from "ant-design-vue";
import { FileExcelOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import locale from "ant-design-vue/es/date-picker/locale/zh_CN";

// --- 响应式状态定义 ---
const loading = ref(false);
const queryState = ref({ month: dayjs() }); // 筛选条件
const records = ref([]); // 从 API 获取的原始记录

// --- 计算属性 ---

// 统计数据
const stats = computed(() => {
  const userSet = new Set(records.value.map((r) => r.employee_id));
  return {
    totalReports: userSet.size, // 按申请人数统计
    totalDays: records.value.length,
    totalUsers: userSet.size,
  };
});

// 为表格生成带有合并信息的数据
const processedRecordsForTable = computed(() => {
  if (!records.value || records.value.length === 0) return [];

  const result = [];
  const employeeGroups = {};

  // 按 employee_id 分组
  records.value.forEach((item) => {
    if (!employeeGroups[item.employee_id]) {
      employeeGroups[item.employee_id] = [];
    }
    employeeGroups[item.employee_id].push(item);
  });

  // 展开数据并添加 rowSpan 信息
  Object.values(employeeGroups).forEach((group) => {
    group.forEach((item, index) => {
      result.push({
        ...item,
        // 只有每组的第一行需要合并单元格，rowSpan值为组的长度
        rowSpan: index === 0 ? group.length : 0,
      });
    });
  });
  return result;
});

// --- 表格列定义 ---
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
  { title: "补卡日期", dataIndex: "clockin_date" },
  { title: "补卡备注", dataIndex: "remarks" },
];

// --- 方法 ---

// 获取补卡记录
const fetchRecords = async () => {
  loading.value = true;
  try {
    const response = await getClockInRecords({
      year: queryState.value.month.year(),
      month: queryState.value.month.month() + 1,
    });
    // 按员工姓名和提交时间排序，确保相同员工的记录在一起
    records.value = (response.data || response).sort((a, b) => {
      if (a.employee_name < b.employee_name) return -1;
      if (a.employee_name > b.employee_name) return 1;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  } catch (error) {
    message.error("查询记录失败");
    console.error("Fetch records error:", error);
  } finally {
    loading.value = false;
  }
};

// 导出数据到 Excel
const exportToExcel = () => {
  if (records.value.length === 0) {
    message.warn("当前没有数据可导出");
    return;
  }
  const title = [{ A: "补卡记录导出" }];
  const exportTime = [{ A: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}` }];

  // 按员工分组
  const employeeGroups = {};
  records.value.forEach((row) => {
    if (!employeeGroups[row.employee_id]) {
      employeeGroups[row.employee_id] = {
        employee_name: row.employee_name,
        report_date: row.created_at,
        details: [],
      };
    }
    employeeGroups[row.employee_id].details.push(
      `${row.clockin_date}: ${row.remarks || "无"}`
    );
  });

  // 转换为最终导出格式
  const dataForExport = Object.values(employeeGroups).map((group) => ({
    员工姓名: group.employee_name,
    提交时间: dayjs(group.report_date).format("YYYY/MM/DD HH:mm"),
    补卡天数: group.details.length,
    补卡备注: group.details.join("\n"), // 使用换行符连接多条备注
  }));

  const worksheet = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_json(worksheet, title, { skipHeader: true, origin: "A1" });
  XLSX.utils.sheet_add_json(worksheet, exportTime, { skipHeader: true, origin: "A2" });
  XLSX.utils.sheet_add_json(worksheet, dataForExport, { origin: "A4" });

  // 设置列宽
  worksheet["!cols"] = [
    { wch: 15 }, // 员工姓名
    { wch: 20 }, // 提交时间
    { wch: 10 }, // 补卡天数
    { wch: 50 }, // 补卡备注
  ];

  // 设置备注列自动换行
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = 3; R <= range.e.r; ++R) {
    // 从第4行数据开始
    const cell_address = { c: 3, r: R }; // 第4列 (D列)
    const cell_ref = XLSX.utils.encode_cell(cell_address);
    if (worksheet[cell_ref]) {
      worksheet[cell_ref].s = { alignment: { wrapText: true, vertical: "top" } };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "补卡记录");
  XLSX.writeFile(workbook, `补卡记录_${queryState.value.month.format("YYYY-MM")}.xlsx`);
};

// 组件挂载时自动加载当月数据
onMounted(() => {
  fetchRecords();
});
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
</style>
