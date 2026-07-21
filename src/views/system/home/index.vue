<template>
  <div class="dashboard-container">
    <div class="dashboard-card">
      <div class="dashboard-header">
        <div class="user-profile">
          <el-avatar :size="64" class="custom-avatar">
            {{ userInitial }}
          </el-avatar>
          <div class="user-meta">
            <h2 class="welcome-text">欢迎回来，{{ userDisplayName }} 👋</h2>
            <p class="subtitle-text">您已成功登录精灵学院管理控制台</p>
          </div>
        </div>
        <el-button type="danger" :icon="Exit" class="logout-btn" @click="handleLogout">
          退出登录
        </el-button>
      </div>

      <el-divider />

      <div class="dashboard-content">
        <!-- 账户信息卡片 -->
        <div class="info-section">
          <h3>👤 账户基本信息</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">账户ID</span>
              <span class="detail-value">{{ authStore.user?.id || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用户名</span>
              <span class="detail-value">{{ authStore.user?.username || authStore.user?.principal || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">邮箱地址</span>
              <span class="detail-value">{{ authStore.user?.email || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">手机号码</span>
              <span class="detail-value">{{ authStore.user?.phone || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- 权限与角色 -->
        <div class="permissions-section">
          <div class="sec-card">
            <h3>🛡️ 角色集合</h3>
            <div class="tags-container">
              <el-tag v-for="role in authStore.roles" :key="role" type="success" size="default" class="custom-tag">
                {{ role }}
              </el-tag>
              <span v-if="!authStore.roles || authStore.roles.length === 0" class="empty-text">暂无分配角色</span>
            </div>
          </div>

          <div class="sec-card">
            <h3>🔑 接口与菜单权限</h3>
            <div class="tags-container">
              <el-tag v-for="perm in authStore.permissions" :key="perm" type="warning" size="default" class="custom-tag">
                {{ perm }}
              </el-tag>
              <span v-if="!authStore.permissions || authStore.permissions.length === 0" class="empty-text">暂无分配权限码</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { SwitchButton as Exit } from '@element-plus/icons-vue';
import { useAuthStore } from '../../../store/auth.js';

const router = useRouter();
const authStore = useAuthStore();

// 获取首字母用于头像
const userInitial = computed(() => {
  const name = authStore.user?.username || authStore.user?.principal || 'User';
  return name.charAt(0).toUpperCase();
});

// 获取展示名
const userDisplayName = computed(() => {
  return authStore.user?.nickName || authStore.user?.username || authStore.user?.principal || '管理员';
});

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出当前系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout();
    ElMessage.success('已安全退出登录');
    router.push('/login');
  }).catch(() => {});
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background-color: #f3f4f6;
  padding: 20px;
  box-sizing: border-box;
}

.dashboard-card {
  width: 900px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  padding: 40px;
  box-sizing: border-box;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.custom-avatar {
  background-color: #3b82f6;
  color: #ffffff;
  font-weight: bold;
  font-size: 24px;
}

.user-meta h2 {
  font-size: 22px;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.subtitle-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.logout-btn {
  font-weight: 600;
  border-radius: 8px;
}

.dashboard-content {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-section h3,
.sec-card h3 {
  font-size: 16px;
  color: #374151;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #9ca3af;
}

.detail-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.permissions-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.sec-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 20px;
  border-radius: 12px;
  min-height: 150px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-tag {
  border-radius: 6px;
}

.empty-text {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

@media (max-width: 768px) {
  .dashboard-card {
    width: 100%;
    padding: 24px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .logout-btn {
    width: 100%;
  }

  .details-grid,
  .permissions-section {
    grid-template-columns: 1fr;
  }
}
</style>
