import request from '@/utils/request';

/**
 * 获取公告列表
 */
export function getMyAlerts() {
    return request({
        url: '/alert', // 后端接口地址
        method: 'get'
    });
}