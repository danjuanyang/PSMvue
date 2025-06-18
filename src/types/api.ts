// src/types/api.ts

// 登录表单数据类型
export interface LoginData {
    username: string;
    password: any;
  }
  
  // 用户信息类型 (与后端返回的 user 对象对应)
  export interface UserInfo {
    id: number;
    username: string;
    email: string;
    role: string;
  }
  