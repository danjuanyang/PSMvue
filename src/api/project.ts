import request from './request';
import type { Project, Subproject, ProjectStage, StageTask, User, ApiResponse } from '@/types/api';

// --- 项目 (Project) ---
export const getProjects = (): Promise<Project[]> => {
    return request.get('/project/projects');
};

export const getProjectById = (id: number): Promise<Project> => {
    return request.get(`/project/projects/${id}`);
}

export const createProject = (data: Partial<Project>): Promise<Project> => {
    return request.post('/project/projects', data);
};

export const updateProject = (id: number, data: Partial<Project>): Promise<Project> => {
    return request.put(`/project/projects/${id}`, data);
};

export const deleteProject = (id: number): Promise<ApiResponse<any>> => {
    return request.delete(`/project/projects/${id}`);
};

// --- 用户 (Users by Role) ---
export const getUsersByRole = (role: 'LEADER' | 'MEMBER'): Promise<Partial<User>[]> => {
    return request.get(`/project/users/by-role/${role}`);
}

// --- 子项目 (Subproject) ---
export const getSubprojects = (projectId: number): Promise<Subproject[]> => {
    return request.get(`/project/projects/${projectId}/subprojects`);
};

export const createSubproject = (projectId: number, data: Partial<Subproject>): Promise<Subproject> => {
    return request.post(`/project/projects/${projectId}/subprojects`, data);
};

export const updateSubproject = (subprojectId: number, data: Partial<Subproject>): Promise<Subproject> => {
    return request.put(`/project/subprojects/${subprojectId}`, data);
};

export const deleteSubproject = (subprojectId: number): Promise<ApiResponse<any>> => {
    return request.delete(`/project/subprojects/${subprojectId}`);
};


// --- 阶段 (Stage) ---
export const getStages = (subprojectId: number): Promise<ProjectStage[]> => {
    return request.get(`/project/subprojects/${subprojectId}/stages`);
};

export const createStage = (subprojectId: number, data: Partial<ProjectStage>): Promise<ProjectStage> => {
    return request.post(`/project/subprojects/${subprojectId}/stages`, data);
};

export const updateStage = (stageId: number, data: Partial<ProjectStage>): Promise<ProjectStage> => {
    return request.put(`/project/stages/${stageId}`, data);
};

export const deleteStage = (stageId: number): Promise<ApiResponse<any>> => {
    return request.delete(`/project/stages/${stageId}`);
};

// --- 任务 (Task) ---
export const getTasks = (stageId: number): Promise<StageTask[]> => {
    return request.get(`/project/stages/${stageId}/tasks`);
};

export const createTask = (stageId: number, data: Partial<StageTask>): Promise<StageTask> => {
    return request.post(`/project/stages/${stageId}/tasks`, data);
};

export const updateTask = (taskId: number, data: Partial<StageTask>): Promise<StageTask> => {
    return request.put(`/project/tasks/${taskId}`, data);
};

export const deleteTask = (taskId: number): Promise<ApiResponse<any>> => {
    return request.delete(`/project/tasks/${taskId}`);
};
