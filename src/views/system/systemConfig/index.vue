<template>
  <div class="system-config-container">
    <div class="config-wrapper">
      <!-- 顶部实时预览看板 Header Preview Card -->
      <el-card shadow="hover" class="preview-card">
        <div class="preview-header">
          <div class="preview-left">
            <div class="preview-logo-box">
              <img v-if="form.sysLogo" :src="form.sysLogo" alt="System Logo" class="preview-logo-img" />
              <el-icon v-else class="preview-logo-icon"><Platform /></el-icon>
            </div>
            <div class="preview-info">
              <h2 class="preview-title">{{ form.sysName || '涛涛电竞一体化运营平台' }}</h2>
              <div class="preview-tags">
                <el-tag size="large" type="primary" effect="dark">{{ form.sysVersion || 'v1.0.0' }}</el-tag>
                <el-tag v-if="form.maintenanceMode === '1'" size="large" type="danger" effect="dark">维护模式中</el-tag>
                <el-tag v-else size="large" type="success" effect="plain">系统运行正常</el-tag>
              </div>
            </div>
          </div>
          <div class="preview-right">
            <el-button type="primary" size="large" :loading="submitting" @click="submitForm">
              <el-icon class="btn-icon"><Check /></el-icon> 保存系统配置
            </el-button>
            <el-button size="large" @click="resetForm">
              <el-icon class="btn-icon"><RefreshLeft /></el-icon> 重置修改
            </el-button>
          </div>
        </div>
        <div v-if="form.sysNotice" class="preview-notice">
          <el-icon><Bell /></el-icon>
          <span>{{ form.sysNotice }}</span>
        </div>
      </el-card>

      <!-- 主要配置表单卡片 Main Form Tabs Card -->
      <el-card shadow="never" class="form-card">
        <el-tabs v-model="activeTab" class="config-tabs">
          <!-- 标签 1：基础设置 -->
          <el-tab-pane label="基础信息" name="basic">
            <el-form ref="basicFormRef" :model="form" :rules="rules" label-width="140px" class="tab-form">
              <el-form-item label="系统名称" prop="sysName">
                <el-input v-model="form.sysName" placeholder="请输入系统名称，如：涛涛电竞一体化运营平台" maxlength="100" show-word-limit size="large" />
              </el-form-item>

              <el-form-item label="系统 Logo" prop="sysLogo">
                <el-input v-model="form.sysLogo" placeholder="请输入系统 Logo 图片 URL 或相对路径" clearable size="large">
                  <template #append>
                    <el-button @click="handleLogoPreview">预览 Logo</el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="系统版本号" prop="sysVersion">
                <el-input v-model="form.sysVersion" placeholder="例：v1.0.0" style="width: 280px;" size="large" />
              </el-form-item>

              <el-form-item label="默认主题色" prop="sysTheme">
                <div class="color-picker-wrapper">
                  <el-color-picker v-model="form.sysTheme" size="large" />
                  <span class="color-value">{{ form.sysTheme }}</span>
                </div>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 标签 2：页脚与备案 -->
          <el-tab-pane label="页脚与备案" name="footer">
            <el-form ref="footerFormRef" :model="form" label-width="140px" class="tab-form">
              <el-form-item label="版权声明" prop="sysCopyright">
                <el-input v-model="form.sysCopyright" placeholder="请输入版权信息，如：© 2026 Nebula Game Companion Platform All Rights Reserved" size="large" />
              </el-form-item>

              <el-form-item label="ICP 备案号" prop="sysIcp">
                <el-input v-model="form.sysIcp" placeholder="例：京ICP备20268888号" style="width: 320px;" size="large" />
              </el-form-item>

              <el-form-item label="备注说明" prop="remark">
                <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入系统配置备注说明" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 标签 3：开关与策略 -->
          <el-tab-pane label="开关与策略" name="policy">
            <el-form ref="policyFormRef" :model="form" label-width="140px" class="tab-form">
              <el-form-item label="系统维护模式" prop="maintenanceMode">
                <el-radio-group v-model="form.maintenanceMode" size="large">
                  <el-radio label="0">正常运行</el-radio>
                  <el-radio label="1">维护中（禁止普通访问）</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="允许新用户注册" prop="allowRegister">
                <el-radio-group v-model="form.allowRegister" size="large">
                  <el-radio label="1">开启注册</el-radio>
                  <el-radio label="0">关闭注册</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="全局水印开关" prop="watermarkEnabled">
                <el-radio-group v-model="form.watermarkEnabled" size="large">
                  <el-radio label="1">开启水印</el-radio>
                  <el-radio label="0">关闭水印</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="模块可用状态" prop="status">
                <el-radio-group v-model="form.status" size="large">
                  <el-radio label="0">启用</el-radio>
                  <el-radio label="1">停用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 标签 4：公告与标语 -->
          <el-tab-pane label="系统公告" name="notice">
            <el-form ref="noticeFormRef" :model="form" label-width="140px" class="tab-form">
              <el-form-item label="顶部公告标语" prop="sysNotice">
                <el-input v-model="form.sysNotice" type="textarea" :rows="4" placeholder="请输入在系统顶部展示的公告或欢迎通知..." maxlength="500" show-word-limit />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <div class="form-bottom-actions">
          <el-button type="primary" size="large" :loading="submitting" @click="submitForm">
            保存全套配置
          </el-button>
          <el-button size="large" @click="resetForm">
            恢复上次保存
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Platform, Check, RefreshLeft, Bell
} from '@element-plus/icons-vue';
import { useSystemConfigStore } from '../../../store/systemConfig.js';

const systemConfigStore = useSystemConfigStore();

const activeTab = ref('basic');
const loading = ref(false);
const submitting = ref(false);

const basicFormRef = ref(null);
const footerFormRef = ref(null);

const form = reactive({
  configId: '1',
  sysName: '',
  sysLogo: '',
  sysVersion: '',
  sysCopyright: '',
  sysIcp: '',
  sysNotice: '',
  sysTheme: '#007EFF',
  maintenanceMode: '0',
  watermarkEnabled: '0',
  allowRegister: '1',
  status: '0',
  remark: ''
});

const rules = reactive({
  sysName: [{ required: true, message: '系统名称不能为空', trigger: 'blur' }],
  sysVersion: [{ required: true, message: '系统版本号不能为空', trigger: 'blur' }]
});

/**
 * 加载系统配置
 */
const loadConfig = async () => {
  loading.value = true;
  try {
    const data = await systemConfigStore.fetchFullConfig();
    if (data) {
      Object.assign(form, data);
    }
  } catch (error) {
    ElMessage.error('加载系统配置失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 提交表单保存
 */
const submitForm = async () => {
  submitting.value = true;
  try {
    const res = await systemConfigStore.updateConfig(form);
    if (res.code === 200 || res.code === '200' || res.result || res.data) {
      ElMessage.success('系统配置保存成功！');
      // 重新拉取配置以同步全局状态
      await systemConfigStore.fetchPublicConfig();
    } else {
      ElMessage.error(res.message || '保存配置失败');
    }
  } catch (error) {
    console.error('保存系统配置出错:', error);
    ElMessage.error('保存失败，请检查网络或服务端日志');
  } finally {
    submitting.value = false;
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  loadConfig();
  ElMessage.info('已重置为上次保存的设置');
};

/**
 * 预览 Logo
 */
const handleLogoPreview = () => {
  if (!form.sysLogo) {
    ElMessage.warning('请先输入 Logo 图片地址');
    return;
  }
  ElMessage.info('包含 Logo 的图片已被应用至顶部看板中预览');
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.system-config-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 42px);
  box-sizing: border-box;
}

.config-wrapper {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部预览卡片 */
.preview-card {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-logo-box {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-color: #007EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 126, 255, 0.25);
}

.preview-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-logo-icon {
  font-size: 30px;
  color: #ffffff;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
}

.preview-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-right {
  display: flex;
  gap: 12px;
}

.btn-icon {
  margin-right: 4px;
}

.preview-notice {
  margin-top: 14px;
  padding: 10px 14px;
  background-color: #ecf5ff;
  border-radius: 6px;
  color: #409eff;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 主表单卡片 */
.form-card {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.config-tabs {
  margin-bottom: 20px;
}

.tab-form {
  padding: 20px 8px;
  max-width: 800px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 14px;
}

.color-value {
  font-family: Consolas, Monaco, monospace;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.form-bottom-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-start;
  padding-left: 140px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

/* 深度选择器统一强制非标题字体大小为16px */
.system-config-container :deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.system-config-container :deep(.el-input__inner),
.system-config-container :deep(.el-textarea__inner) {
  font-size: 16px;
}

.system-config-container :deep(.el-radio__label) {
  font-size: 16px;
}

.system-config-container :deep(.el-button) {
  font-size: 16px;
}

.system-config-container :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

.system-config-container :deep(.el-tag) {
  font-size: 14px;
}

.system-config-container :deep(.el-input-group__append .el-button) {
  font-size: 16px;
}
</style>
