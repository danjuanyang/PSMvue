// src/stores/user.ts
import { defineStore } from 'pinia';
import { loginApi, logoutApi, getStatusApi } from '@/api/auth';
import type { LoginData, UserInfo } from '@/types/api';

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'), // 从本地存储初始化 token
    userInfo: null,
  }),

  getters: {
    isLoggedIn(): boolean {
      // 判断是否登录的依据是 token 是否存在
      return !!this.token;
    },
    // 可以添加获取用户角色或权限的 getters
    userRole(): string | null {
      return this.userInfo?.role || null;
    }
  },

  actions: {
    async login(loginData: LoginData) {
      try {
        const response: any = await loginApi(loginData);

        // 检查两种成功情况：新登录成功或已登录
        if (response.user || response.message === '用户已登录') {
          const fakeToken = 'logged-in';
          this.token = fakeToken;
          localStorage.setItem('token', fakeToken);

          // 如果已经是登录状态，用户信息可能不在本次响应中，需要主动获取
          if (!this.userInfo) {
            await this.fetchUserInfo();
          }
          return Promise.resolve();
        } else {
          return Promise.reject(new Error(response.error || '登录失败'));
        }
      } catch (error) {
        await this.logout(); // 确保失败时状态被清理
        return Promise.reject(error);
      }
    },
    // 登出
    async logout() {
      try {
        await logoutApi();
      } catch (error) {
        console.error('注销API失败，但仍在清除会话。', error);
      } finally {
        // 无论API是否成功，都清空前端状态
        this.token = null;
        this.userInfo = null;
        localStorage.removeItem('token');
      }
    },

    // 获取当前用户信息
    async fetchUserInfo() {
      if (!this.isLoggedIn) {
        return Promise.reject('未登录');
      }
      try {
        const response: any = await getStatusApi();
        if (response.logged_in && response.user) {
          this.userInfo = response.user;
          return Promise.resolve(response.user);
        } else {
          // 如果API返回未登录，强制前端登出
          await this.logout();
          return Promise.reject('会话过期');
        }
      } catch (error) {
        await this.logout();
        return Promise.reject(error);
      }
    }
  },
});
