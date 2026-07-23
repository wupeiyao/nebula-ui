import { defineStore } from 'pinia';
import { getPublicSystemConfig, getSystemConfig, updateSystemConfig as updateSystemConfigApi } from '../api/system/systemConfig.js';

export const useSystemConfigStore = defineStore('systemConfig', {
  state: () => ({
    configId: '1',
    sysName: '涛涛电竞一体化运营平台',
    sysLogo: '',
    sysVersion: 'v1.0.0',
    sysCopyright: '© 2026 Nebula Game Companion Platform All Rights Reserved',
    sysIcp: '京ICP备20268888号',
    sysNotice: '欢迎使用涛涛电竞一体化运营平台！',
    sysTheme: '#007EFF',
    maintenanceMode: '0',
    watermarkEnabled: '0',
    allowRegister: '1',
    status: '0',
    loaded: false
  }),

  actions: {
    /**
     * 获取公开系统配置信息
     */
    async fetchPublicConfig() {
      try {
        const res = await getPublicSystemConfig();
        const configData = res.result || res.data;
        if (configData) {
          this.setConfigData(configData);
        }
        this.loaded = true;
        return configData;
      } catch (error) {
        console.error('获取系统公开配置失败', error);
      }
    },

    /**
     * 获取完整系统配置信息（管理员）
     */
    async fetchFullConfig() {
      try {
        const res = await getSystemConfig();
        const configData = res.result || res.data;
        if (configData) {
          this.setConfigData(configData);
        }
        this.loaded = true;
        return configData;
      } catch (error) {
        console.error('获取系统全局配置失败', error);
      }
    },

    /**
     * 更新系统配置
     */
    async updateConfig(formData) {
      const res = await updateSystemConfigApi(formData);
      if (res.result || res.data || res.code === 200 || res.code === '200') {
        this.setConfigData(formData);
      }
      return res;
    },

    /**
     * 批量更新 state 数据
     */
    setConfigData(data) {
      if (data.configId) this.configId = data.configId;
      if (data.sysName !== undefined) this.sysName = data.sysName || '涛涛电竞一体化运营平台';
      if (data.sysLogo !== undefined) this.sysLogo = data.sysLogo || '';
      if (data.sysVersion !== undefined) this.sysVersion = data.sysVersion || 'v1.0.0';
      if (data.sysCopyright !== undefined) this.sysCopyright = data.sysCopyright || '';
      if (data.sysIcp !== undefined) this.sysIcp = data.sysIcp || '';
      if (data.sysNotice !== undefined) this.sysNotice = data.sysNotice || '';
      if (data.sysTheme !== undefined) this.sysTheme = data.sysTheme || '#007EFF';
      if (data.maintenanceMode !== undefined) this.maintenanceMode = data.maintenanceMode || '0';
      if (data.watermarkEnabled !== undefined) this.watermarkEnabled = data.watermarkEnabled || '0';
      if (data.allowRegister !== undefined) this.allowRegister = data.allowRegister || '1';
      if (data.status !== undefined) this.status = data.status || '0';
    }
  }
});
