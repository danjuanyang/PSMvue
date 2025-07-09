import request from '@/utils/request';

/**
 * 获取公告列表
 */
export function getAnnouncements() {
    return request({
        url: '/announcement',
        method: 'get',
    });
}

/**
 * 获取单个公告的详细信息 (会自动标记为已读)
 * @param {number} id Announcement ID
 */
export function getAnnouncementDetail(id) {
    return request({
        url: `/announcement/${id}`,
        method: 'get',
    });
}

/**
 * 创建新公告
 * @param {FormData} formData 包含 title, content, priority, attachments
 */
export function createAnnouncement(formData) {
    return request({
        url: '/announcement',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

/**
 * 更新公告
 * @param {number} id Announcement ID
 * @param {object} data 包含 title, content, priority
 */
export function updateAnnouncement(id, data) {
    return request({
        url: `/announcement/${id}`,
        method: 'put',
        data, // 后端期望是 form data, 但简单更新可以先用json
    });
}

/**
 * 切换公告的上线/下线状态
 * @param {number} id Announcement ID
 */
export function toggleAnnouncementStatus(id) {
    return request({
        url: `/announcement/${id}/toggle-status`,
        method: 'put',
    });
}

/**
 * 获取公告的阅读统计
 * @param {number} id Announcement ID
 */
export function getReadStatistics(id) {
    return request({
        url: `/announcement/${id}/read-status`,
        method: 'get',
    });
}

/**
 * 下载附件
 * @param {number} attachmentId Attachment ID
 */
export function downloadAttachment(attachmentId) {
    return request({
        url: `/announcement/attachments/${attachmentId}/download`,
        method: 'get',
        responseType: 'blob', // 重要：告诉axios期望一个二进制文件
    });
}
