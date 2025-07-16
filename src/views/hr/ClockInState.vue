
<template>
  <div class="clock-in-stats-container">
    <a-card title="补卡记录统计">
      <div class="filter-bar">
        <a-form layout="inline" @finish="fetchReports">
          <a-form-item label="员工">
            <a-select
              v-model:value="filterParams.employee_id"
              placeholder="选择员工"
              allow-clear
              show-search
              :options="employeeOptions"
              :filter-option="filterOption"
              style="width: 150px"
            />
          </a-form-item>
          <a-form-item label="日期范围">
            <a-range-picker v-model:value="filterParams.dateRange" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">查询</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-table
        :columns="columns"
        :data-source="reportData"
        :loading="loading"
        row-key="id"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'employee_name'">
            {{ record.employee.username }}
          </template>
          <template v-if="column.key === 'report_date'">
            {{ dayjs(record.report_date).format('YYYY-MM-DD') }}
          </template>
          <template v-if="column.key === 'details'">
            <div v-if="record.details && record.details.length > 0">
              <div v-for="detail in record.details" :key="detail.id">
                <p><strong>日期:</strong> {{ detail.clockin_date }} ({{ detail.weekday }})</p>
                <p><strong>事由:</strong> {{ detail.remarks }}</p>
              </div>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import {   message } from 'ant-design-vue';
import { getClockinReports, getAllUsers } from '@/api/hr'; // 确保 API 已定义
import dayjs from 'dayjs';

const loading = ref(false);
const reportData = ref([]);
const employeeOptions = ref([]);

const filterParams = reactive({
  employee_id: undefined,
  dateRange: [],
});

const columns = [
  { title: '报告ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '员工', key: 'employee_name', width: 120 },
  { title: '提交日期', dataIndex: 'report_date', key: 'report_date', width: 120 },
  { title: '补卡详情', key: 'details' },
];

// 获取所有用户用于筛选
const fetchAllUsers = async () => {
  try {
    const res = await getAllUsers();
    employeeOptions.value = res.data.map(user => ({
      value: user.id,
      label: user.username,
    }));
  } catch (error) {
    message.error('获取员工列表失败');
  }
};

// 获取报告数据
const fetchReports = async () => {
  loading.value = true;
  try {
    const params = {
      employee_id: filterParams.employee_id,
      start_date: filterParams.dateRange && filterParams.dateRange.length > 0 ? dayjs(filterParams.dateRange[0]).format('YYYY-MM-DD') : undefined,
      end_date: filterParams.dateRange && filterParams.dateRange.length > 0 ? dayjs(filterParams.dateRange[1]).format('YYYY-MM-DD') : undefined,
    };
    const res = await getClockinReports(params);
    reportData.value = res.data;
  } catch (error) {
    message.error('获取补卡报告失败');
    console.error('获取报告失败:', error);
  } finally {
    loading.value = false;
  }
};

// 自定义 Select 筛选逻辑
const filterOption = (input, option) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

onMounted(() => {
  fetchAllUsers();
  fetchReports();
});
</script>

<style scoped>
.clock-in-stats-container {
  padding: 24px;
}
.filter-bar {
  margin-bottom: 20px;
}
p {
  margin: 0;
}
</style>