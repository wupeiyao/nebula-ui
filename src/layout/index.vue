<template>
  <div class="app-layout" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 顶部 Header 栏 -->
    <header class="layout-header">
      <div class="header-left">
        <!-- Logo 区域 -->
        <div class="brand-logo" :class="{ 'is-collapsed': isCollapsed }">
          <div class="logo-badge">
            <img v-if="systemConfigStore.sysLogo" :src="systemConfigStore.sysLogo" class="logo-img" alt="Logo" />
            <el-icon v-else><Platform /></el-icon>
          </div>
          <span v-if="!isCollapsed" class="brand-title">{{ systemConfigStore.sysName }}</span>
        </div>
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

    <div class="layout-main-wrapper">
      <!-- 左侧侧边栏 Sidebar -->
      <aside class="layout-sidebar">
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
          <div class="footer-action collapse-btn" :title="isCollapsed ? '展开' : '折叠'" @click="toggleSidebar">
            <el-icon><Expand v-if="isCollapsed" /><Fold v-else /></el-icon>
          </div>
          <template v-if="!isCollapsed">
            <div class="footer-action" title="模式切换" @click="toggleTheme">
              <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
            </div>
            <div class="footer-action" title="帮助说明" @click="handleHelp">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <div class="footer-status">
              <span class="status-dot"></span>
            </div>
          </template>
        </div>
      </aside>

      <!-- 主体区域 Layout Main -->
      <div class="layout-container">
        <!-- 多页签 TagsView -->
        <tags-view />
        
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
import TagsView from './components/TagsView.vue';
import { useAuthStore } from '../store/auth.js';
import { useSystemConfigStore } from '../store/systemConfig.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const systemConfigStore = useSystemConfigStore();

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
  ElMessage.info(`${systemConfigStore.sysName} ${systemConfigStore.sysVersion}`);
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
  systemConfigStore.fetchPublicConfig();
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
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f1f5f9;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 顶部 Header */
.layout-header {
  height: 42px;
  background-color: #007EFF; /* Reference screenshot blue */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px 0 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 20;
  color: #ffffff;
}

.header-left {
  display: flex;
  align-items: center;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 240px;
  height: 50px;
  padding: 0 16px;
  transition: width 0.3s;
}

.brand-logo.is-collapsed {
  width: 80px;
  justify-content: center;
  padding: 0;
}

.logo-badge {
  width: 50px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.brand-title {
  font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #ffffff;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-action-btn {
  font-size: 18px;
  color: #ffffff;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.header-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s;
  color: #ffffff;
}

.user-dropdown-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header-avatar {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.user-nickname {
  font-size: 14px;
  font-weight: 500;
}

/* Main Layout Wrapper */
.layout-main-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏样式 */
.layout-sidebar {
  width: 180px;
  height: calc(100% - 32px);
  margin: 8px 0 12px 8px;
  background: #F0FCFF; /* From user requirements */
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  overflow: hidden;
}

.is-collapsed .layout-sidebar {
  width: 64px;
}

.sidebar-menu-wrapper {
  flex: 1;
  padding: 8px 0;
  overflow: hidden;
}

.nebula-menu {
  border-right: none !important;
  background: transparent !important;
  transform: translateX(-5px);
}

:deep(.el-menu) {
  background-color: transparent !important;
  border-right: none !important;
}

/* 基础菜单项样式 (块状样式) */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px !important;
  line-height: 48px !important;
  color: #334155 !important;
  font-size: 18px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  margin: 0 !important;
  border-radius: 0 !important;
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
}

/* 一级目录 */
:deep(.nebula-menu > .el-menu-item),
:deep(.nebula-menu > .el-sub-menu > .el-sub-menu__title) {
  font-weight: 600 !important;
  color: #000000 !important;
  font-size: 18px !important;
}

/* 二级目录 */
:deep(.el-menu--inline .el-menu-item),
:deep(.el-menu--inline .el-sub-menu__title) {
  font-weight: 400 !important;
  color: #808080 !important;
  font-size: 17px !important;
}

/* 图标样式 */
:deep(.el-menu-item .menu-icon),
:deep(.el-sub-menu__title .menu-icon) {
  font-size: 22px !important;
  color: #3b82f6 !important;
  transition: all 0.3s ease !important;
  margin-right: 14px !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #ffffff !important;
  color: #1890ff !important;
}

:deep(.el-menu-item:hover .menu-icon),
:deep(.el-sub-menu__title:hover .menu-icon) {
  color: #1890ff !important;
}

/* 激活状态 */
:deep(.el-menu-item.is-active) {
  background: #ffffff !important;
  color: #1890ff !important;
  border-right: none !important;
}

/* 一级目录激活加粗 */
:deep(.nebula-menu > .el-menu-item.is-active) {
  font-weight: 600 !important;
  color: #1890ff !important;
}
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  font-weight: 600 !important;
}

/* 二级目录激活不加粗 */
:deep(.el-menu--inline .el-menu-item.is-active) {
  font-weight: 400 !important;
}

:deep(.el-menu-item.is-active .menu-icon) {
  color: #1890ff !important;
}

/* 侧边栏底部 */
.sidebar-footer {
  height: 48px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 12px;
  color: #64748b;
}

.footer-action {
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 16px;
}

.collapse-btn {
  font-size: 18px;
}

.footer-action:hover {
  background-color: #f1f5f9;
  color: #1890ff;
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
}

/* 主体容器 */
.layout-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: transparent;
}

/* 主内容区 */
.layout-body {
  flex: 1;
  padding: 0px;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
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
