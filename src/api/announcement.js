import request from '@/utils/request';

/**
 * 获取公告列表
 */
export function getAnnouncements() {
    return request({
        url: '/announcement', // 后端接口地址
        method: 'get'
    });
}