<template>
  <div class="login-container">
    <div class="login-card" :class="{ 'is-register': activeTab === 'register' }">
      <!-- 左侧：梦幻星空插画面板 -->
      <div class="login-visual-panel">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <h2 class="visual-title">{{ sysName }}</h2>
          <p class="visual-subtitle">
            {{ activeTab === 'login' ? '寻找默契玩伴，开启你的上分之旅' : '注册成为客户，尽享专业配对与预约服务' }}
          </p>
        </div>
      </div>

      <!-- 右侧：表单面板 -->
      <div class="login-form-panel">
        <div class="form-wrapper">
          <!-- 顶部切换 Tab -->
          <div class="tab-switcher">
            <div
              class="tab-btn"
              :class="{ active: activeTab === 'login' }"
              @click="switchTab('login')"
            >
              登录账户
            </div>
            <div
              class="tab-btn"
              :class="{ active: activeTab === 'register' }"
              @click="switchTab('register')"
            >
              注册客户
            </div>
          </div>

          <!-- 头部标题 -->
          <div class="form-header">
            <h1 class="brand-title">
              {{ activeTab === 'login' ? sysName : '' }}
            </h1>
            <p class="brand-subtitle">
              <template v-if="activeTab === 'login'">
                登入专属账号，连接游戏世界 <span class="sparkle-emoji">🎮</span>
              </template>
<!--              <template v-else>-->
<!--                仅限注册【客户】角色，邮箱验证安全开启 <span class="sparkle-emoji">✉️</span>-->
<!--              </template>-->
            </p>
          </div>

          <!-- 1. 登录表单 -->
          <el-form
            v-if="activeTab === 'login'"
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

            <!-- 图形验证码 (后端开启时展示) -->
            <el-form-item v-if="showCaptcha" label="图形验证码" prop="captchaCode">
              <div class="captcha-container">
                <el-input
                  v-model="loginForm.captchaCode"
                  placeholder="请输入图形验证码"
                  :prefix-icon="Key"
                  class="custom-input captcha-input-field"
                />
                <div class="captcha-image-wrapper" @click="fetchCaptcha" title="点击刷新验证码">
                  <img
                    v-if="captchaImg"
                    :src="captchaImg"
                    alt="图形验证码"
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

            <!-- 登录提交按钮 -->
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

            <!-- 还没有账户 -->
            <div class="register-tip">
              还没有账户？
              <span class="register-link" @click="switchTab('register')">立即注册客户账号</span>
            </div>
          </el-form>

          <!-- 2. 注册表单 -->
          <el-form
            v-else
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            class="custom-form register-form-body"
            @submit.prevent="handleRegister"
            @keyup.enter.prevent="handleRegister"
          >
            <!-- 角色固定提示 -->
<!--            <div class="role-badge-tip">-->
<!--              <el-tag type="success" effect="light" class="role-tag">-->
<!--                <el-icon class="tag-icon"><User /></el-icon> 账户身份：客户角色（已固定）-->
<!--              </el-tag>-->
<!--            </div>-->

            <!-- 用户名 -->
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="设置用户名 (3-12位)"
                :prefix-icon="User"
                class="custom-input"
              />
            </el-form-item>

            <!-- 电子邮箱 -->
            <el-form-item label="电子邮箱" prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="请输入常用邮箱地址"
                :prefix-icon="Message"
                class="custom-input"
              />
            </el-form-item>

            <!-- 邮箱验证码 -->
            <el-form-item label="邮箱验证码" prop="emailCode">
              <div class="email-code-container">
                <el-input
                  v-model="registerForm.emailCode"
                  placeholder="请输入6位邮箱验证码"
                  :prefix-icon="Key"
                  class="custom-input email-code-input"
                />
                <el-button
                  type="primary"
                  plain
                  :disabled="countdown > 0 || sendingEmail"
                  :loading="sendingEmail"
                  class="send-code-btn"
                  @click="handleSendEmailCode"
                >
                  {{ countdown > 0 ? `${countdown}s 后重发` : (countdownStarted ? '重新获取' : '获取验证码') }}
                </el-button>
              </div>
            </el-form-item>

            <!-- 密码 -->
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="设置登录密码 (5-20位)"
                :prefix-icon="Lock"
                show-password
                class="custom-input"
              />
            </el-form-item>

            <!-- 确认密码 -->
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                :prefix-icon="Lock"
                show-password
                class="custom-input"
              />
            </el-form-item>

<!--            &lt;!&ndash; 手机号 (选填) &ndash;&gt;-->
<!--            <el-form-item label="手机号码 (选填)" prop="mobile">-->
<!--              <el-input-->
<!--                v-model="registerForm.mobile"-->
<!--                placeholder="请输入手机号码"-->
<!--                :prefix-icon="Iphone"-->
<!--                class="custom-input"-->
<!--              />-->
<!--            </el-form-item>-->

<!--            &lt;!&ndash; 昵称 (选填) &ndash;&gt;-->
<!--            <el-form-item label="用户昵称 (选填)" prop="nickname">-->
<!--              <el-input-->
<!--                v-model="registerForm.nickname"-->
<!--                placeholder="设置对外展示昵称，默认与用户名一致"-->
<!--                :prefix-icon="UserFilled"-->
<!--                class="custom-input"-->
<!--              />-->
<!--            </el-form-item>-->

            <!-- 图形验证码 (后端开启时展示) -->
            <el-form-item v-if="showCaptcha" label="图形验证码" prop="captchaCode">
              <div class="captcha-container">
                <el-input
                  v-model="registerForm.captchaCode"
                  placeholder="请输入图形验证码"
                  :prefix-icon="Key"
                  class="custom-input captcha-input-field"
                />
                <div class="captcha-image-wrapper" @click="fetchCaptcha" title="点击刷新验证码">
                  <img
                    v-if="captchaImg"
                    :src="captchaImg"
                    alt="图形验证码"
                    class="captcha-img"
                  />
                  <div v-else class="captcha-placeholder">加载中...</div>
                </div>
              </div>
            </el-form-item>

            <!-- 注册提交按钮 -->
            <el-form-item class="submit-item">
              <el-button
                type="primary"
                :loading="loading"
                class="login-button register-button"
                @click="handleRegister"
              >
                完成注册
              </el-button>
            </el-form-item>

            <!-- 已有账户提示 -->
            <div class="register-tip">
              已有客户账户？
              <span class="register-link" @click="switchTab('login')">返回登录</span>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, Key, Message, Iphone, UserFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../../../store/auth.js';
import { useSystemConfigStore } from '../../../store/systemConfig.js';
import { getCaptcha, register, sendEmailCode } from '../../../api/auth/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const systemConfigStore = useSystemConfigStore();

const sysName = computed(() => systemConfigStore.sysName || '桃桃陪伴平台');

// 当前 Tab 状态: 'login' | 'register'
const activeTab = ref('login');

// 状态定义
const loading = ref(false);
const showCaptcha = ref(false);
const captchaImg = ref('');
const autoLogin = ref(false);
const loginFormRef = ref(null);
const registerFormRef = ref(null);

// 邮箱验证码发送与倒计时状态
const countdown = ref(0);
const countdownStarted = ref(false);
const sendingEmail = ref(false);
let timer = null;

const loginForm = ref({
  username: '',
  password: '',
  captchaCode: '',
  uuid: ''
});

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  mobile: '',
  nickname: '',
  captchaCode: '',
  uuid: ''
});

// 登录验证规则
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
          callback(new Error('请输入图形验证码'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ]
};

// 注册验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 12, message: '用户名长度需在 3 到 12 位之间', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && /[\u4e00-\u9fa5]/.test(value)) {
          callback(new Error('不能输入中文'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { len: 6, message: '邮箱验证码为 6 位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度需在 5 到 20 位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入密码'));
        } else if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  captchaCode: [
    {
      validator: (rule, value, callback) => {
        if (showCaptcha.value && !value) {
          callback(new Error('请输入图形验证码'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ]
};

// 获取图形验证码
const fetchCaptcha = async () => {
  try {
    const res = await getCaptcha();
    if (res && res.result) {
      showCaptcha.value = true;
      loginForm.value.uuid = res.result.uuid;
      registerForm.value.uuid = res.result.uuid;

      const imgData = res.result.img;
      if (imgData.startsWith('data:image')) {
        captchaImg.value = imgData;
      } else {
        captchaImg.value = `data:image/png;base64,${imgData}`;
      }
    }
  } catch (error) {
    showCaptcha.value = false;
    loginForm.value.captchaCode = '';
    loginForm.value.uuid = '';
    registerForm.value.captchaCode = '';
    registerForm.value.uuid = '';
  }
};

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  if (!registerForm.value.email) {
    ElMessage.warning('请先输入电子邮箱地址');
    return;
  }
  const emailReg = /^[A-Za-z0-9+_.-]+@(.+)$/;
  if (!emailReg.test(registerForm.value.email)) {
    ElMessage.warning('请输入有效的电子邮箱地址');
    return;
  }

  sendingEmail.value = true;
  try {
    await sendEmailCode(registerForm.value.email);
    ElMessage.success('验证码已发送至您的邮箱，请查收！');

    countdown.value = 60;
    countdownStarted.value = true;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (countdown.value > 0) {
        countdown.value--;
      } else {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  } catch (error) {
    console.error('Send email code error:', error);
  } finally {
    sendingEmail.value = false;
  }
};

// 切换 Tab
const switchTab = (tab) => {
  activeTab.value = tab;
  fetchCaptcha();
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

      const targetPath = route.query.redirect && route.query.redirect !== '/login'
        ? route.query.redirect
        : '/dashboard';

      await router.replace(targetPath);
    } catch (error) {
      console.error('Login error:', error);
      if (showCaptcha.value) {
        loginForm.value.captchaCode = '';
        fetchCaptcha();
      }
    } finally {
      loading.value = false;
    }
  });
};

// 注册提交
const handleRegister = () => {
  if (loading.value) return;
  registerFormRef.value.validate(async (valid) => {
    if (!valid || loading.value) return;

    loading.value = true;
    try {
      await register({
        username: registerForm.value.username,
        password: registerForm.value.password,
        confirmPassword: registerForm.value.confirmPassword,
        email: registerForm.value.email,
        emailCode: registerForm.value.emailCode,
        mobile: registerForm.value.mobile,
        nickname: registerForm.value.nickname,
        captchaCode: registerForm.value.captchaCode,
        uuid: registerForm.value.uuid
      });

      ElMessage.success('客户账号注册成功！已为您自动填入登录账号');

      // 切换至登录模式，预填用户名
      loginForm.value.username = registerForm.value.username;
      loginForm.value.password = '';
      activeTab.value = 'login';

      // 清空注册表单
      registerForm.value = {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        emailCode: '',
        mobile: '',
        nickname: '',
        captchaCode: '',
        uuid: ''
      };

      fetchCaptcha();
    } catch (error) {
      console.error('Register error:', error);
      if (showCaptcha.value) {
        registerForm.value.captchaCode = '';
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
  systemConfigStore.fetchPublicConfig();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
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
  overflow-y: auto;
  padding: 20px 0;
  box-sizing: border-box;
}

/* 卡片容器 */
.login-card {
  display: flex;
  width: 1060px;
  min-height: 640px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.login-card.is-register {
  min-height: 760px;
}

/* 左侧：背景插画面板 */
.login-visual-panel {
  position: relative;
  width: 50%;
  min-height: 100%;
  background-image: url('../../../assets/login-bg.svg');
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
  background: linear-gradient(180deg, rgba(255, 245, 247, 0) 45%, rgba(252, 231, 243, 0.65) 75%, rgba(224, 231, 255, 0.75) 100%);
  z-index: 1;
}

/* 背景文字内容 */
.visual-content {
  position: absolute;
  bottom: 60px;
  left: 60px;
  right: 40px;
  z-index: 2;
  color: #1e293b;
}

.visual-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  letter-spacing: 1px;
  color: #1e293b;
}

.visual-subtitle {
  font-size: 16px;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

/* 右侧：表单面板 */
.login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  min-height: 100%;
  padding: 36px 50px;
  box-sizing: border-box;
}

.form-wrapper {
  width: 100%;
  max-width: 380px;
}

/* Tab 切换按钮组 */
.tab-switcher {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}

.tab-btn:hover {
  color: #3b82f6;
}

.tab-btn.active {
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 表单头部 */
.form-header {
  margin-bottom: 20px;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
  text-align: center;
  letter-spacing: 0.5px;
}

.brand-subtitle {
  font-size: 14px;
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

/* 角色分配提示框 */
.role-badge-tip {
  margin-bottom: 16px;
  text-align: center;
}

.role-tag {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}

.tag-icon {
  vertical-align: middle;
  margin-right: 4px;
}

/* 自定义表单样式 */
.custom-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.custom-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
  padding-bottom: 0;
  font-size: 13px;
}

/* 输入框定制 */
.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: none !important;
  padding: 3px 12px;
  transition: all 0.25s ease;
}

.custom-input :deep(.el-input__wrapper.is-focus),
.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #3b82f6;
  background-color: #fff;
}

/* 邮箱验证码容器 */
.email-code-container {
  display: flex;
  gap: 10px;
  width: 100%;
}

.email-code-input {
  flex: 1;
}

.send-code-btn {
  height: 38px;
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
  padding: 0 14px;
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
  height: 36px;
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
  margin-bottom: 20px;
  font-size: 13px;
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

/* 登录/注册按钮 */
.submit-item {
  margin-top: 6px;
  margin-bottom: 16px;
}

.login-button {
  width: 100%;
  height: 42px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7b2cbf 0%, #3a0ca3 100%);
  border: none;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(123, 44, 191, 0.3);
  transition: all 0.3s ease;
}

.register-button {
  background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.login-button:hover {
  background: linear-gradient(135deg, #9d4edd 0%, #4361ee 100%);
  box-shadow: 0 6px 16px rgba(157, 78, 221, 0.4);
  transform: translateY(-1px);
}

.register-button:hover {
  background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
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
  margin-top: 10px;
}

.register-link {
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* 响应式适配 */
@media (max-width: 960px) {
  .login-card {
    width: 460px;
    min-height: auto;
  }

  .login-visual-panel {
    display: none;
  }

  .login-form-panel {
    width: 100%;
    padding: 30px 24px;
  }
}
</style>
