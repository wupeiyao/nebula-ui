<template>
  <div class="app-container profile-container">
    <el-row :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <el-col :span="8" :xs="24">
        <el-card class="profile-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">个人信息</span>
            </div>
          </template>

          <div class="user-avatar-section">
            <el-avatar :size="80" class="profile-avatar">
              {{ avatarInitial }}
            </el-avatar>
            <h3 class="user-nickname-text">{{ userInfo.user?.nickname || userInfo.user?.username || '用户' }}</h3>
            <p class="user-role-text">
              <template v-if="rolesList.length > 0">
                <el-tag v-for="(role, idx) in rolesList" :key="idx" size="small" class="role-tag" type="primary" effect="plain">
                  {{ role }}
                </el-tag>
              </template>
              <el-tag v-else size="small" type="info">普通用户</el-tag>
            </p>
          </div>

          <el-divider />

          <ul class="user-info-list">
            <li class="info-list-item">
              <div class="item-left">
                <el-icon class="item-icon"><User /></el-icon>
                <span>登录账号</span>
              </div>
              <span class="item-value font-mono">{{ userInfo.user?.username || '-' }}</span>
            </li>
            <li class="info-list-item">
              <div class="item-left">
                <el-icon class="item-icon"><Iphone /></el-icon>
                <span>手机号码</span>
              </div>
              <span class="item-value">{{ userInfo.user?.mobile || '暂未绑定' }}</span>
            </li>
            <li class="info-list-item">
              <div class="item-left">
                <el-icon class="item-icon"><Message /></el-icon>
                <span>邮箱地址</span>
              </div>
              <span class="item-value">{{ userInfo.user?.email || '暂未绑定' }}</span>
            </li>
            <li class="info-list-item">
              <div class="item-left">
                <el-icon class="item-icon"><OfficeBuilding /></el-icon>
                <span>所属部门</span>
              </div>
              <span class="item-value">{{ userInfo.user?.deptName || '无所属部门' }}</span>
            </li>
            <li class="info-list-item">
              <div class="item-left">
                <el-icon class="item-icon"><Calendar /></el-icon>
                <span>创建时间</span>
              </div>
              <span class="item-value font-mono">{{ formatTime(userInfo.user?.createTime) }}</span>
            </li>
          </ul>
        </el-card>
      </el-col>

      <!-- 右侧：编辑资料与修改密码标签页 -->
      <el-col :span="16" :xs="24">
        <el-card class="detail-card" shadow="hover">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <!-- Tab 1: 基本资料 -->
            <el-tab-pane label="基本资料" name="info">
              <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="90px" class="tab-form">
                <el-form-item label="用户昵称" prop="nickname">
                  <el-input v-model="profileForm.nickname" placeholder="请输入用户昵称" maxlength="30" />
                </el-form-item>
                <el-form-item label="手机号码" prop="mobile">
                  <el-input v-model="profileForm.mobile" placeholder="请输入手机号码" maxlength="11" />
                </el-form-item>
                <el-form-item label="邮箱地址" prop="email">
                  <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" maxlength="50" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="submittingProfile" @click="handleSaveProfile">
                    <el-icon class="mr-1"><Check /></el-icon> 保存更新
                  </el-button>
                  <el-button @click="resetProfileForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- Tab 2: 重置密码 -->
            <el-tab-pane label="重置密码" name="password">
              <el-form ref="passwordFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px" class="tab-form">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前原密码" />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" :loading="submittingPwd" @click="handleSavePassword">
                    <el-icon class="mr-1"><Key /></el-icon> 修改密码
                  </el-button>
                  <el-button @click="resetPwdForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  User, Iphone, Message, OfficeBuilding, Calendar, Check, Key
} from '@element-plus/icons-vue';
import { getUserProfile, updateUserProfile, updateUserPwd } from '../../../../api/system/user.js';
import { useAuthStore } from '../../../../store/auth.js';

const authStore = useAuthStore();

const activeTab = ref('info');
const userInfo = ref({ user: {}, roles: [], permissions: [] });
const profileFormRef = ref(null);
const passwordFormRef = ref(null);

const submittingProfile = ref(false);
const submittingPwd = ref(false);

// 编辑资料表单
const profileForm = reactive({
  nickname: '',
  mobile: '',
  email: ''
});

// 重置密码表单
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 验证规则
const profileRules = {
  nickname: [
    { required: true, message: '用户昵称不能为空', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  mobile: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码', trigger: 'blur' }
  ]
};

const validateConfirmPwd = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const pwdRules = {
  oldPassword: [
    { required: true, message: '原密码不能为空', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需在6到20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPwd, trigger: 'blur' }
  ]
};

// 头像首字母
const avatarInitial = computed(() => {
  const name = userInfo.value.user?.username || 'U';
  return name.charAt(0).toUpperCase();
});

// 角色展示
const rolesList = computed(() => {
  if (!userInfo.value.roles || userInfo.value.roles.length === 0) return [];
  return userInfo.value.roles;
});

// 加载个人资料
const loadUserProfile = async () => {
  try {
    const res = await getUserProfile();
    if (res.result) {
      userInfo.value = res.result;
      const u = res.result.user || {};
      profileForm.nickname = u.nickname || '';
      profileForm.mobile = u.mobile || '';
      profileForm.email = u.email || '';
    }
  } catch (error) {
    console.error('获取个人资料失败:', error);
  }
};

// 保存个人资料
const handleSaveProfile = () => {
  profileFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submittingProfile.value = true;
    try {
      await updateUserProfile(profileForm);
      ElMessage.success('个人资料更新成功');
      // 重新加载并同步 authStore 状态
      await loadUserProfile();
      if (authStore.user) {
        authStore.user.nickName = profileForm.nickname;
        localStorage.setItem('nebula_user', JSON.stringify(authStore.user));
      }
    } catch (error) {
      console.error('更新资料失败:', error);
    } finally {
      submittingProfile.value = false;
    }
  });
};

// 重置资料表单
const resetProfileForm = () => {
  const u = userInfo.value.user || {};
  profileForm.nickname = u.nickname || '';
  profileForm.mobile = u.mobile || '';
  profileForm.email = u.email || '';
};

// 保存修改密码
const handleSavePassword = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submittingPwd.value = true;
    try {
      await updateUserPwd(pwdForm.oldPassword, pwdForm.newPassword);
      ElMessage.success('密码修改成功，请牢记新密码');
      resetPwdForm();
    } catch (error) {
      console.error('修改密码失败:', error);
    } finally {
      submittingPwd.value = false;
    }
  });
};

// 重置密码表单
const resetPwdForm = () => {
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields();
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return String(timeStr).replace('T', ' ').substring(0, 19);
};

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.profile-container {
  padding: 16px;
}

.profile-card,
.detail-card {
  border-radius: 8px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.user-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 8px 0;
}

.profile-avatar {
  background: linear-gradient(135deg, #007eff 0%, #0056b3 100%);
  color: #ffffff;
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 126, 255, 0.25);
}

.user-nickname-text {
  margin: 12px 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.user-role-text {
  margin: 0;
}

.role-tag {
  margin: 0 2px;
}

.user-info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px dashed #f1f5f9;
  font-size: 14px;
}

.info-list-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.item-icon {
  font-size: 16px;
  color: #007eff;
}

.item-value {
  color: #334155;
  font-weight: 500;
}

.profile-tabs {
  min-height: 380px;
}

.tab-form {
  max-width: 480px;
  padding-top: 16px;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.mr-1 {
  margin-right: 4px;
}
</style>
