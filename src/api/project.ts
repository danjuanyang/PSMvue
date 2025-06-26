// src/api/project.ts
import request from './request';
import type { Project, Subproject, ProjectStage, StageTask, ApiResponse } from '@/types/api';

// --- 项目 (Project) ---
export const getProjects = (): Promise<Project[]> => {
    return request.get('/project/projects');
};

export const createProject = (data: Partial<Project>): Promise<Project> => {
    return request.post('/project/projects', data);
};

export const updateProject = (id: number, data: Partial<Project>): Promise<Project> => {
    return request.put(`/project/projects/${id}`, data);
};

export const deleteProject = (id: number): Promise<ApiResponse<any>> => {
    return request.delete(`/project/projects/${id}`);
};

// --- 子项目 (Subproject) ---
export const getSubprojects = (projectId: number): Promise<Subproject[]> => {
    return request.get(`/project/projects/${projectId}/subprojects`);
};

// ... 其他子项目、阶段、任务的API可按需添加