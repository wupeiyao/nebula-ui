<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 左侧：梦幻星空插画面板 -->
      <div class="login-visual-panel">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <h2 class="visual-title">Nebula Platform</h2>
          <p class="visual-subtitle">探索未知，连接未来</p>
        </div>
      </div>

      <!-- 右侧：登录表单面板 -->
      <div class="login-form-panel">
        <div class="form-wrapper">
          <!-- 头部标题 -->
          <div class="form-header">
            <h1 class="brand-title">涛神电竞平台</h1>
            <p class="brand-subtitle">
              登入账户 <span class="sparkle-emoji">✨</span>
            </p>
          </div>

          <!-- 登录表单 -->
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            class="custom-form"
            @submit.prevent="handleLogin"
            @keyup.enter.prevent="handleLogin"
          >
            <!-- 账号/邮箱 -->
            <el-form-item label="账号" prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入你的邮箱/账号"
                :prefix-icon="User"
                class="custom-input"
              />
            </el-form-item>

            <!-- 密码 -->
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入你的密码"
                :prefix-icon="Lock"
                show-password
                class="custom-input"
              />
            </el-form-item>

            <!-- 验证码 (后端开启时展示) -->
            <el-form-item v-if="showCaptcha" label="验证码" prop="captchaCode">
              <div class="captcha-container">
                <el-input
                  v-model="loginForm.captchaCode"
                  placeholder="请输入验证码"
                  :prefix-icon="Key"
                  class="custom-input captcha-input-field"
                />
                <div class="captcha-image-wrapper" @click="fetchCaptcha" title="点击刷新验证码">
                  <img
                    v-if="captchaImg"
                    :src="captchaImg"
                    alt="验证码"
                    class="captcha-img"
                  />
                  <div v-else class="captcha-placeholder">加载中...</div>
                </div>
              </div>
            </el-form-item>

            <!-- 选项行 -->
            <div class="form-options">
              <el-checkbox v-model="autoLogin" class="custom-checkbox">自动登录</el-checkbox>
              <el-link type="primary" :underlined="false" class="forgot-link" @click="handleForgot">
                找回密码?
              </el-link>
            </div>

            <!-- 提交按钮 -->
            <el-form-item class="submit-item">
              <el-button
                type="primary"
                :loading="loading"
                class="login-button"
                @click="handleLogin"
              >
                登录账户
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 还没有账户 (占位引导) -->
          <!-- <div class="register-tip">
            还没有账户吗？<span class="register-link-disabled">注册账户</span>
          </div> -->

          <!-- 语言切换选择器 -->
          <!-- <div class="lang-selector-wrapper">
            <el-select v-model="language" size="default" class="custom-select">
              <el-option label="中文 (简体)" value="zh-cn" />
              <el-option label="English" value="en" />
            </el-select>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../../../store/auth.js';
import { getCaptcha } from '../../../api/auth/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 状态定义
const loading = ref(false);
const showCaptcha = ref(false);
const captchaImg = ref('');
const autoLogin = ref(false);
const language = ref('zh-cn');
const loginFormRef = ref(null);

const loginForm = ref({
  username: '',
  password: '',
  captchaCode: '',
  uuid: ''
});

// 验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入你的邮箱或账号', trigger: 'blur' },
    { min: 3, message: '账号长度不能少于3位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入你的密码', trigger: 'blur' },
    { min: 5, message: '密码长度不能少于5位', trigger: 'blur' }
  ],
  captchaCode: [
    {
      validator: (rule, value, callback) => {
        if (showCaptcha.value && !value) {
          callback(new Error('请输入验证码'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ]
};

// 获取验证码
const fetchCaptcha = async () => {
  try {
    const res = await getCaptcha();
    if (res && res.result) {
      showCaptcha.value = true;
      loginForm.value.uuid = res.result.uuid;
      // 后端返回的通常是带或不带前缀的 base64 串，这里做自适应处理
      const imgData = res.result.img;
      if (imgData.startsWith('data:image')) {
        captchaImg.value = imgData;
      } else {
        captchaImg.value = `data:image/png;base64,${imgData}`;
      }
    }
  } catch (error) {
    // 如果获取验证码接口报错，说明后端未开启验证码功能，隐藏验证码输入框
    showCaptcha.value = false;
    loginForm.value.captchaCode = '';
    loginForm.value.uuid = '';
  }
};

// 登录提交
const handleLogin = () => {
  if (loading.value) return;
  loginFormRef.value.validate(async (valid) => {
    if (!valid || loading.value) return;

    loading.value = true;
    try {
      await authStore.login({
        username: loginForm.value.username,
        password: loginForm.value.password,
        captchaCode: loginForm.value.captchaCode,
        uuid: loginForm.value.uuid
      });

      ElMessage.success('登录成功，欢迎回来！');

      // 过滤非法的 redirect 路径 (避免重定向回 /login)
      const targetPath = route.query.redirect && route.query.redirect !== '/login'
        ? route.query.redirect
        : '/dashboard';
      
      await router.replace(targetPath);
    } catch (error) {
      console.error('Login error:', error);
      // 登录失败若开启了验证码，清空已输入的验证码并自动刷新验证码
      if (showCaptcha.value) {
        loginForm.value.captchaCode = '';
        fetchCaptcha();
      }
    } finally {
      loading.value = false;
    }
  });
};

// 找回密码提示
const handleForgot = () => {
  ElMessage.info('请联系系统管理员重置您的密码');
};

onMounted(() => {
  fetchCaptcha();
});
</script>

<style scoped>
/* 全局页面容器 */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background-color: #f7f9fc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

/* 卡片容器 */
.login-card {
  display: flex;
  width: 1050px;
  height: 620px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 左侧：背景插画面板 */
.login-visual-panel {
  position: relative;
  width: 55%;
  height: 100%;
  background-image: url('../../../assets/login-bg.png');
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}

/* 背景蒙版 */
.visual-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 24, 48, 0.4) 0%, rgba(20, 20, 42, 0.2) 100%);
  z-index: 1;
}

/* 背景文字内容 */
.visual-content {
  position: absolute;
  bottom: 60px;
  left: 60px;
  z-index: 2;
  color: #ffffff;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.visual-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  letter-spacing: 1px;
}

.visual-subtitle {
  font-size: 16px;
  opacity: 0.85;
  margin: 0;
}

/* 右侧：表单面板 */
.login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45%;
  height: 100%;
  padding: 40px 60px;
  box-sizing: border-box;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
}

/* 表单头部 */
.form-header {
  margin-bottom: 30px;
}

.brand-title {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  text-align: center;
  letter-spacing: 0.5px;
}

.brand-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sparkle-emoji {
  animation: pulse 1.8s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* 自定义表单样式 */
.custom-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  padding-bottom: 0;
  font-size: 14px;
}

/* 输入框定制 */
.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: none !important;
  padding: 4px 12px;
  transition: all 0.25s ease;
}

.custom-input :deep(.el-input__wrapper.is-focus),
.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #3b82f6;
  background-color: #fff;
}

/* 验证码布局 */
.captcha-container {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-input-field {
  flex: 1;
}

.captcha-image-wrapper {
  width: 110px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  user-select: none;
}

.captcha-image-wrapper:hover {
  border-color: #3b82f6;
  opacity: 0.95;
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.captcha-placeholder {
  font-size: 12px;
  color: #94a3b8;
}

/* 自动登录与忘记密码 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.custom-checkbox :deep(.el-checkbox__label) {
  color: #64748b;
  font-size: 13px;
}

.custom-checkbox :deep(.el-checkbox__inner) {
  border-radius: 4px;
}

.forgot-link {
  font-size: 13px;
  color: #3b82f6;
}

.forgot-link:hover {
  color: #2563eb;
}

/* 登录按钮 */
.submit-item {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 42px;
  border-radius: 8px;
  background-color: #0066ff;
  border-color: #0066ff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.2);
  transition: all 0.25s ease;
}

.login-button:hover {
  background-color: #0052cc;
  border-color: #0052cc;
  box-shadow: 0 6px 16px rgba(0, 102, 255, 0.35);
  transform: translateY(-1px);
}

.login-button:active {
  transform: translateY(0);
}

/* 注册提示 */
.register-tip {
  font-size: 13px;
  color: #64748b;
  text-align: center;
  margin-bottom: 30px;
}

.register-link-disabled {
  color: #3b82f6;
  opacity: 0.65;
  cursor: not-allowed;
  font-weight: 500;
}

/* 语言选择 */
.lang-selector-wrapper {
  display: flex;
  justify-content: center;
}

.custom-select {
  width: 120px;
}

.custom-select :deep(.el-input__wrapper) {
  border-radius: 6px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  box-shadow: none !important;
}

/* 响应式适配 */
@media (max-width: 960px) {
  .login-card {
    width: 460px;
    height: auto;
  }

  .login-visual-panel {
    display: none;
  }

  .login-form-panel {
    width: 100%;
    padding: 40px 30px;
  }
}
</style>
