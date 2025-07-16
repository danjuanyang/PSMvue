<template>
  <div class="clock-in-apply-container">
    <a-card title="补卡填报">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        @finish="onFinish"
        layout="vertical"
      >
        <a-form-item label="选择需要补卡的日期" name="clockInDate">
          <a-date-picker
            v-model:value="formState.clockInDate"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="星期" name="weekday">
          <a-input v-model:value="formState.weekday" disabled />
        </a-form-item>

        <a-form-item label="补卡事由" name="remarks">
          <a-textarea
            v-model:value="formState.remarks"
            :rows="4"
            placeholder="请输入详细的补卡事由"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">
            提交申请
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import {  Input , message } from 'ant-design-vue';
import { clockinReport } from '@/api/hr'; // 确保你的 API 文件中有此函数
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn'); // 设置 dayjs 为中文

const ATextarea = Input.TextArea;
const formRef = ref();

const formState = reactive({
  clockInDate: null,
  weekday: '',
  remarks: '',
});

const rules = {
  clockInDate: [{ required: true, message: '请选择需要补卡的日期' }],
  remarks: [{ required: true, message: '请输入补卡事由' }],
};

const loading = ref(false);

// 监听日期变化，自动计算星期
watch(() => formState.clockInDate, (newDate) => {
  if (newDate) {
    formState.weekday = dayjs(newDate).format('dddd');
  } else {
    formState.weekday = '';
  }
});

const onFinish = async (values) => {
  loading.value = true;
  const payload = {
    details: [{
      clockin_date: values.clockInDate,
      weekday: formState.weekday,
      remarks: values.remarks,
    }]
  };

  try {
    await clockinReport(payload);
    message.success('补卡申请提交成功！');
    formRef.value.resetFields(); // 重置表单
    formState.weekday = '';
  } catch (error) {
    message.error(error.message || '提交失败，请稍后重试');
    console.error('提交补卡申请失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.clock-in-apply-container {
  padding: 24px;
}
</style>