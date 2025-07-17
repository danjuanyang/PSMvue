import request from '@/utils/request'

// 获取文件列表
export function getFiles(params) {
  return request({
    url: '/files',
    method: 'get',
    params
  })
}

// 删除文件
export function deleteFile(fileId) {
  return request({
    url: `/files/${fileId}`,
    method: 'delete'
  })
}

// 下载文件
export function downloadFile(fileId) {
  return request({
    url: `/files/download/${fileId}`,
    method: 'get',
    responseType: 'blob' // 重要：用于下载文件
  })
}

// 获取项目列表
export function getProjects() {
  return request({
    url: '/project/projects',
    method: 'get'
  })
}

// 获取子项目列表
export function getSubprojects(projectId) {
  return request({
    url: `/project/projects/${projectId}/subprojects`,
    method: 'get'
  })
}

// 获取阶段列表
export function getStages(subprojectId) {
  return request({
    url: `/project/subprojects/${subprojectId}/stages`,
    method: 'get'
  })
}

// 获取任务列表
export function getTasks(stageId) {
  return request({
    url: `/project/stages/${stageId}/tasks`,
    method: 'get'
  })
}
