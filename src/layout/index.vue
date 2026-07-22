<template>
  <div class="app-layout" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 左侧侧边栏 Sidebar -->
    <aside class="layout-sidebar">
      <!-- Logo 区域 -->
      <div class="sidebar-header">
        <div class="brand-logo">
          <div class="logo-badge">
            <el-icon><Platform /></el-icon>
          </div>
          <span v-if="!isCollapsed" class="brand-title">涛神系统</span>
        </div>
      </div>

      <!-- 动态菜单渲染区 -->
      <div class="sidebar-menu-wrapper">
        <el-scrollbar>
          <el-menu
            :default-active="activeMenu"
            :collapse="isCollapsed"
            :collapse-transition="false"
            class="nebula-menu"
          >
            <!-- 递归渲染后端传来的树形菜单 -->
            <sidebar-item
              v-for="menu in menuTree"
              :key="menu.menuId"
              :item="menu"
            />
          </el-menu>
        </el-scrollbar>
      </div>

      <!-- 侧边栏底部工具栏 -->
      <div class="sidebar-footer">
        <div class="footer-action" title="模式切换" @click="toggleTheme">
          <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
        </div>
        <div class="footer-action" title="帮助说明" @click="handleHelp">
          <el-icon><InfoFilled /></el-icon>
        </div>
        <div class="footer-status">
          <span class="status-dot"></span>
        </div>
      </div>
    </aside>

    <!-- 主体区域 Layout Main -->
    <div class="layout-container">
      <!-- 顶部 Header 栏 -->
      <header class="layout-header">
        <div class="header-left">
          <!-- 侧边栏折叠按钮 -->
          <div class="collapse-trigger" @click="toggleSidebar">
            <el-icon><Expand v-if="isCollapsed" /><Fold v-else /></el-icon>
          </div>

          <!-- 面包屑导向 -->
          <el-breadcrumb separator="/" class="custom-breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle && currentTitle !== '工作台 - 涛神电竞' && currentTitle !== '首页'">
              {{ currentTitle }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 搜索 -->
          <div class="header-action-btn" title="搜索">
            <el-icon><Search /></el-icon>
          </div>

          <!-- 消息通知 -->
          <div class="header-action-btn" title="消息通知">
            <el-badge is-dot class="badge-item" type="danger">
              <el-icon><Bell /></el-icon>
            </el-badge>
          </div>

          <!-- 系统设置 -->
          <div class="header-action-btn" title="系统设置" @click="toggleTheme">
            <el-icon><Setting /></el-icon>
          </div>

          <!-- 全屏切换 -->
          <div class="header-action-btn" title="全屏" @click="toggleFullScreen">
            <el-icon><FullScreen /></el-icon>
          </div>

          <!-- 用户个人中心下拉菜单 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-dropdown-trigger">
              <el-avatar :size="32" class="header-avatar">
                {{ userInitial }}
              </el-avatar>
              <span class="user-nickname">{{ userDisplayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 主视图渲染区 App Main -->
      <main class="layout-body">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Platform, Fold, Expand, Bell, FullScreen, Sunny, Moon, InfoFilled,
  ArrowDown, User, SwitchButton, Search, Setting
} from '@element-plus/icons-vue';
import SidebarItem from './components/SidebarItem.vue';
import { useAuthStore } from '../store/auth.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 侧边栏折叠状态
const isCollapsed = ref(false);
const isDark = ref(false);

// 从 store 获取用户关联的菜单树
const menuTree = computed(() => authStore.menus);

// 激活的菜单 Path
const activeMenu = computed(() => {
  const { path } = route;
  return path;
});

// 当前页面标题
const currentTitle = computed(() => {
  return route.meta?.title || route.name;
});

// 用户展示名
const userDisplayName = computed(() => {
  return authStore.user?.nickName || authStore.user?.username || '管理员';
});

// 头像首字母
const userInitial = computed(() => {
  const name = authStore.user?.username || 'Admin';
  return name.charAt(0).toUpperCase();
});

// 切换侧边栏展开/收起
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 切换主题模式 (夜间/日间)
const toggleTheme = () => {
  isDark.value = !isDark.value;
  ElMessage.info(isDark.value ? '已切换至暗色视图' : '已切换至亮色视图');
};

const handleHelp = () => {
  ElMessage.info('涛神管理控制台 v1.0.0');
};

// 全屏功能
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// 下拉菜单操作
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要安全退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout();
      ElMessage.success('已安全退出');
      router.push('/login');
    }).catch(() => {});
  } else if (command === 'profile') {
    ElMessage.info('个人中心准备中...');
  }
};

onMounted(async () => {
  if (!authStore.menus || authStore.menus.length === 0) {
    try {
      await authStore.fetchUserMenus();
    } catch (error) {
      console.error('加载菜单树失败:', error);
    }
  }
});
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 侧边栏样式 */
.layout-sidebar {
  width: 240px;
  height: 100%;
  background: #191b28; /* 深色主题背景，参考原图 */
  border-right: none;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

.is-collapsed .layout-sidebar {
  width: 64px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-badge {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}

.brand-title {
  font-weight: 700;
  font-size: 18px;
  color: #ffffff;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.sidebar-menu-wrapper {
  flex: 1;
  padding: 16px 12px;
  overflow: hidden;
}

.nebula-menu {
  border-right: none !important;
  background: transparent !important;
}

:deep(.el-menu) {
  background-color: transparent !important;
  border-right: none !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px !important;
  line-height: 48px !important;
  border-radius: 12px !important;
  margin-bottom: 6px !important;
  color: #94a3b8 !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.el-menu-item .menu-icon),
:deep(.el-sub-menu__title .menu-icon) {
  font-size: 20px !important;
  color: #94a3b8 !important;
  transition: all 0.3s ease !important;
  margin-right: 14px !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

:deep(.el-menu-item:hover .menu-icon),
:deep(.el-sub-menu__title:hover .menu-icon) {
  color: #ffffff !important;
  transform: scale(1.1);
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4) !important;
}

:deep(.el-menu-item.is-active .menu-icon) {
  color: #ffffff !important;
  transform: scale(1.1);
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #ffffff !important;
  font-weight: 600 !important;
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title .menu-icon) {
  color: #ffffff !important;
}

/* 侧边栏底部 */
.sidebar-footer {
  height: 56px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 12px;
  color: #64748b;
}

.footer-action {
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.footer-action:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.footer-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

/* 主体容器 */
.layout-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f1f5f9;
}

/* 顶部 Header */
.layout-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  z-index: 5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-trigger {
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.collapse-trigger:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-action-btn {
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.header-action-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.user-dropdown-trigger:hover {
  background-color: #f1f5f9;
}

.header-avatar {
  background-color: #3b82f6;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.user-nickname {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

/* 主内容区 */
.layout-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 动效 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.2s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
