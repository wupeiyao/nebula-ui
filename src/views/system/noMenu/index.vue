<template>
  <div class="no-menu-simple-container">
    <div class="no-menu-content">
      <!-- 简约插画艺术图 (SVG) -->
      <div class="illustration-wrapper">
        <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 饰品与背景圆形 -->
          <circle cx="140" cy="110" r="65" fill="#F1F5F9" />
          <circle cx="175" cy="80" r="3" fill="#CBD5E1" />
          <circle cx="98" cy="112" r="2" fill="#CBD5E1" />
          <text x="155" y="70" fill="#CBD5E1" font-size="14" font-family="sans-serif">+</text>
          <text x="195" y="115" fill="#CBD5E1" font-size="12" font-family="sans-serif">+</text>
          <text x="75" y="85" fill="#CBD5E1" font-size="11" font-family="sans-serif">+</text>

          <!-- 飘落微装饰 -->
          <path d="M135 152 Q138 148 142 153 Q137 156 135 152 Z" fill="#F87171" opacity="0.6"/>
          <path d="M185 132 Q187 127 192 131 Q188 136 185 132 Z" fill="#F87171" opacity="0.5"/>
          <path d="M92 135 Q94 130 99 133 Q95 138 92 135 Z" fill="#F87171" opacity="0.5"/>

          <!-- 沙发/座椅结构 -->
          <rect x="130" y="102" width="48" height="42" rx="6" fill="#94A3B8" />
          <rect x="124" y="95" width="60" height="16" rx="4" fill="#CBD5E1" />
          <rect x="132" y="144" width="8" height="12" rx="2" fill="#64748B" />
          <rect x="168" y="144" width="8" height="12" rx="2" fill="#64748B" />

          <!-- 人物形象 (无奈耸肩) -->
          <!-- 裤子/双腿 -->
          <rect x="104" y="122" width="7" height="34" rx="3.5" fill="#2563EB" />
          <rect x="114" y="122" width="7" height="34" rx="3.5" fill="#2563EB" />
          <!-- 鞋子 -->
          <ellipse cx="106" cy="156" rx="6" ry="2.5" fill="#1E293B" />
          <ellipse cx="119" cy="156" rx="6" ry="2.5" fill="#1E293B" />
          <!-- 上衣 -->
          <path d="M100 98 L125 98 L123 123 L102 123 Z" fill="#475569" />
          <!-- 耸肩双手手臂 -->
          <path d="M100 98 Q90 92 82 87" stroke="#FDBA74" stroke-width="4.5" stroke-linecap="round" />
          <path d="M125 98 Q134 91 142 87" stroke="#FDBA74" stroke-width="4.5" stroke-linecap="round" />
          <!-- 头部与头发 -->
          <circle cx="112" cy="84" r="8.5" fill="#FDBA74" />
          <path d="M104 82 C103 74, 112 71, 119 74 C122 78, 119 83, 119 83 Z" fill="#312E81" />

          <!-- 标识 🚫 -->
          <g transform="translate(156, 98)">
            <circle cx="20" cy="20" r="18" stroke="#F87171" stroke-width="5" fill="#FFFFFF" fill-opacity="0.2"/>
            <line x1="7" y1="7" x2="33" y2="33" stroke="#F87171" stroke-width="5"/>
          </g>
        </svg>
      </div>

      <!-- 提示文本与交互链接 -->
      <div class="prompt-text-group">
        <span class="prompt-text">您暂无权限使用该后台，</span>
        <a href="javascript:void(0)" class="action-link" @click="handleLogout">点击这里退出登录</a>
        <span class="prompt-text"> 或 </span>
        <a href="javascript:void(0)" class="action-link" @click="handleContactAdmin">联系管理员</a>
      </div>

      <!-- 次要小功能：重新检测权限 -->
      <div class="recheck-wrapper">
        <el-button type="info" link size="small" :loading="refreshing" class="recheck-btn" @click="handleRefresh">
          <el-icon class="mr-1"><Refresh /></el-icon> 重新检测权限
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { useAuthStore } from '../../../store/auth.js';

const router = useRouter();
const authStore = useAuthStore();
const refreshing = ref(false);

// 退出登录
const handleLogout = () => {
  authStore.logout();
  ElMessage.success('已退出登录');
  router.push('/login');
};

// 联系管理员提示
const handleContactAdmin = () => {
  const username = authStore.user?.username || '当前账号';
  ElMessageBox.alert(
    `当前账号 [ ${username} ] 尚未拥有访问权限。\n如需开通权限，请联系统管理员或系统运维人员。`,
    '联系管理员提示',
    {
      confirmButtonText: '我知道了',
      type: 'info',
      customClass: 'custom-contact-dialog'
    }
  );
};

// 重新检测权限
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    await authStore.fetchUserInfo();
    const menuTree = await authStore.fetchUserMenus();
    if (menuTree && menuTree.length > 0) {
      ElMessage.success('权限更新成功，正在重定向至首页...');
      authStore.routesLoaded = false;
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } else {
      ElMessage.warning('提示：当前账号仍未绑定任何菜单权限');
    }
  } catch (error) {
    console.error('重新检测权限失败:', error);
    ElMessage.error('获取权限网络异常，请稍后重试');
  } finally {
    refreshing.value = false;
  }
};
</script>

<style scoped>
.no-menu-simple-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  user-select: none;
}

.no-menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.illustration-wrapper {
  margin-bottom: 24px;
}

.prompt-text-group {
  font-size: 14px;
  color: #64748b;
  line-height: 1.8;
}

.prompt-text {
  color: #64748b;
}

.action-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease, text-decoration 0.2s ease;
}

.action-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.recheck-wrapper {
  margin-top: 16px;
}

.recheck-btn {
  color: #94a3b8 !important;
  font-size: 12px;
}

.recheck-btn:hover {
  color: #3b82f6 !important;
}

.mr-1 {
  margin-right: 4px;
}
</style>
