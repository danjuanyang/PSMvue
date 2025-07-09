import request from '@/utils/request';

// =========================================================================
// 项目 (Project) APIs
// =========================================================================

/**
 * 获取当前用户可见的项目列表
 */
export function getProjects() {
    return request({
        url: '/project/projects',
        method: 'get',
    });
}

/**
 * 获取单个项目的详细信息
 * @param {number} projectId
 */
export function getProjectDetails(projectId) {
    return request({
        url: `/project/projects/${projectId}`,
        method: 'get'
    });
}

/**
 * 创建一个新项目 (仅管理员)
 * @param {object} projectData
 */
export function createProject(projectData) {
    return request({
        url: '/project/projects',
        method: 'post',
        data: projectData,
    });
}

/**
 * 更新一个项目 (仅管理员)
 * @param {number} projectId
 * @param {object} projectData
 */
export function updateProject(projectId, projectData) {
    return request({
        url: `/project/projects/${projectId}`,
        method: 'put',
        data: projectData,
    });
}

/**
 * 删除一个项目 (仅管理员)
 * @param {number} projectId
 */
export function deleteProject(projectId) {
    return request({
        url: `/project/projects/${projectId}`,
        method: 'delete',
    });
}

// =========================================================================
// 子项目 (Subproject) APIs
// =========================================================================

/**
 * 获取指定项目下的所有子项目
 * @param {number} projectId
 */
export function getSubprojects(projectId) {
    return request({
        url: `/project/projects/${projectId}/subprojects`,
        method: 'get'
    });
}

/**
 * 创建一个新子项目 (仅组长)
 * @param {number} projectId
 * @param {object} subprojectData
 */
export function createSubproject(projectId, subprojectData) {
    return request({
        url: `/project/projects/${projectId}/subprojects`,
        method: 'post',
        data: subprojectData
    });
}

/**
 * 更新一个子项目 (仅组长)
 * @param {number} subprojectId
 * @param {object} subprojectData
 */
export function updateSubproject(subprojectId, subprojectData) {
    return request({
        url: `/project/subprojects/${subprojectId}`,
        method: 'put',
        data: subprojectData
    });
}

/**
 * 删除一个子项目 (仅组长)
 * @param {number} subprojectId
 */
export function deleteSubproject(subprojectId) {
    return request({
        url: `/project/subprojects/${subprojectId}`,
        method: 'delete'
    });
}


// =========================================================================
// 阶段 (Stage) 和 任务 (Task) APIs
// =========================================================================

/**
 * 获取指定子项目下的所有阶段（及其任务）
 * @param {number} subprojectId
 */
export function getStagesWithTasks(subprojectId) {
    return request({
        url: `/project/subprojects/${subprojectId}/stages`,
        method: 'get'
    });
}

/**
 * 创建一个新阶段
 * @param {number} subprojectId
 * @param {object} stageData
 */
export function createStage(subprojectId, stageData) {
    return request({
        url: `/project/subprojects/${subprojectId}/stages`,
        method: 'post',
        data: stageData
    });
}

/**
 * 更新一个阶段
 * @param {number} stageId
 * @param {object} stageData
 */
export function updateStage(stageId, stageData) {
    return request({
        url: `/project/stages/${stageId}`,
        method: 'put',
        data: stageData
    });
}


/**
 * 删除一个阶段
 * @param {number} stageId
 */
export function deleteStage(stageId) {
    return request({
        url: `/project/stages/${stageId}`, // 假设后端有此路由，如果没有需要添加
        method: 'delete'
    });
}

/**
 * 创建一个新任务
 * @param {number} stageId
 * @param {object} taskData
 */
export function createTask(stageId, taskData) {
    return request({
        url: `/project/stages/${stageId}/tasks`,
        method: 'post',
        data: taskData
    });
}

/**
 * 更新一个任务
 * @param {number} taskId
 * @param {object} taskData
 */
export function updateTask(taskId, taskData) {
    return request({
        url: `/project/tasks/${taskId}`,
        method: 'put',
        data: taskData
    });
}


/**
 * 更新任务进度
 * @param {number} taskId
 * @param {object} progressData { progress, description }
 */
export function updateTaskProgress(taskId, progressData) {
    return request({
        url: `/project/tasks/${taskId}/progress-updates`,
        method: 'post',
        data: progressData
    });
}

/**
 * 删除一个任务
 * @param {number} taskId
 */
export function deleteTask(taskId) {
    return request({
        url: `/project/tasks/${taskId}`,
        method: 'delete'
    });
}

/**
 * 为任务上传文件
 * @param {number} taskId
 * @param {FormData} formData
 */
export function uploadFileForTask(taskId, formData) {
    return request({
        url: `/files/tasks/${taskId}/upload`,
        method: 'post',
        data: formData,
    });
}

/**
 * 获取指定任务已上传的文件列表
 * @param {number} taskId
 */
export function getTaskFiles(taskId) {
    return request({
        url: `/files/tasks/${taskId}/files`,
        method: 'get'
    });
}




// =========================================================================
// 辅助 APIs
// =========================================================================

/**
 * 按角色获取用户列表，用于分配负责人
 * @param {string} roleName (e.g., 'LEADER', 'MEMBER')
 */
export function getUsersByRole(roleName, leaderId = null) {
    let url = `/project/users/by-role/${roleName}`;
    if (leaderId) {
        url += `?leader_id=${leaderId}`;
    }
    return request({
        url: url,
        method: 'get'
    });
}