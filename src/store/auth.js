import { defineStore } from 'pinia';
import { login as loginApi, getUserInfo as getUserInfoApi } from '../api/auth/auth.js';
import { getUserMenuTree } from '../api/system/menu.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('nebula_token') || '',
    user: JSON.parse(localStorage.getItem('nebula_user') || 'null'),
    roles: [],
    permissions: [],
    menus: [],
    routesLoaded: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userInfo: (state) => state.user || {}
  },

  actions: {
    /**
     * 账户密码登录
     * @param {Object} loginForm
     */
    async login(loginForm) {
      try {
        const response = await loginApi(loginForm);
        // AuthorizationResponse 包括 token, accessToken, user, expiresIn
        const { token, accessToken, user } = response.result || {};
        const activeToken = token || accessToken;

        this.token = activeToken;
        this.user = user;

        // 缓存到本地
        if (activeToken) {
          localStorage.setItem('nebula_token', activeToken);
        }
        if (user) {
          localStorage.setItem('nebula_user', JSON.stringify(user));
        }

        // 登录成功后同步获取用户最新角色和权限信息 (进行容错捕获，防止异常阻断登录成功流程)
        try {
          await this.fetchUserInfo();
        } catch (userInfoError) {
          console.warn('同步获取用户信息失败，使用登录接口返回的基础信息:', userInfoError);
        }

        return response;
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },

    /**
     * 获取当前用户信息及权限
     */
    async fetchUserInfo() {
      try {
        const response = await getUserInfoApi();
        // UserInfoResponse 包括 user, roles, permissions
        const { user, roles, permissions } = response.result;

        this.user = user;
        this.roles = roles || [];
        this.permissions = permissions || [];

        localStorage.setItem('nebula_user', JSON.stringify(user));

        return response.result;
      } catch (error) {
        console.error('Fetch user info failed:', error);
        throw error;
      }
    },

    /**
     * 获取当前用户的动态菜单树
     */
    async fetchUserMenus() {
      try {
        const response = await getUserMenuTree();
        const menuTree = response.result || response.data || [];
        this.menus = menuTree;
        return menuTree;
      } catch (error) {
        console.error('Fetch user menus failed:', error);
        throw error;
      }
    },

    /**
     * 退出登录，清空缓存与状态
     */
    logout() {
      this.clearAuth();
    },

    /**
     * 清空认证信息
     */
    clearAuth() {
      this.token = '';
      this.user = null;
      this.roles = [];
      this.permissions = [];
      this.menus = [];
      this.routesLoaded = false;
      localStorage.removeItem('nebula_token');
      localStorage.removeItem('nebula_user');
    }
  }
});
