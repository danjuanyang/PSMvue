import request from '@/utils/request';

/**
 * 员工提交一个月度的补卡记录
 * @param {object} reportData - 包含 year, month, details 的报告数据
 */
export function submitClockInReport(reportData) {
  return request({
    url: '/hr/clock-in-records',
    method: 'post',
    data: reportData,
  });
}

/**
 * (管理员) 查询补卡记录
 * @param {object} params - 查询参数，例如 { year, month, user_id }
 */
export function getClockInRecords(params) {
  return request({
    url: '/hr/clock-in-records',
    method: 'get',
    params, // 将参数附加到 URL 查询字符串中
  });
}
