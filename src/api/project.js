import request from '@/utils/request';

/**
 * 获取当前用户的所有项目
 */
export function getMyProjects() {
    return request({
        url: '/project/projects', // 后端接口地址
        method: 'get'
    });
}