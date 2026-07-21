import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.js';

const modules = import.meta.glob('../views/**/*.vue');

function loadComponent(componentPath) {
  if (!componentPath || componentPath === 'Layout') return null;
  let cleanedPath = componentPath.replace(/^\//, '');
  let filePath = `../views/${cleanedPath}`;
  if (!filePath.endsWith('.vue')) {
    filePath = `${filePath}.vue`;
  }
  if (modules[filePath]) {
    return modules[filePath];
  }
  let indexPath = `../views/${cleanedPath}/index.vue`;
  if (modules[indexPath]) {
    return modules[indexPath];
  }
  console.warn(`未匹配到组件: ${componentPath}`);
  return null;
}

function filterAsyncRoutes(menus, parentPath = '') {
  const res = [];
  menus.forEach(menu => {
    if (menu.menuType === 'F') return;

    let fullPath = menu.path || '';
    if (!fullPath.startsWith('/')) {
      fullPath = parentPath ? `${parentPath.replace(/\/$/, '')}/${fullPath}` : `/${fullPath}`;
    }

    // 如果为已有静态配置的首页路由，避免重复添加到 Layout
    if (fullPath === '/dashboard') return;

    if (menu.menuType === 'C' && menu.component && menu.component !== 'Layout') {
      const comp = loadComponent(menu.component);
      if (comp) {
        res.push({
          path: fullPath,
          name: menu.menuId ? `Menu_${menu.menuId}` : fullPath,
          component: comp,
          meta: {
            title: menu.menuName,
            icon: menu.icon,
            requiresAuth: true,
            visible: menu.visible === '0'
          }
        });
      }
    }

    if (menu.children && menu.children.length > 0) {
      const childRoutes = filterAsyncRoutes(menu.children, fullPath);
      res.push(...childRoutes);
    }
  });
  return res;
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/system/login/index.vue'),
    meta: { title: '登入账户 - 涛神电竞', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/system/home/index.vue'),
        meta: { title: '首页 - 涛神系统', requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 路由守卫：登录拦截与页面标题设置、动态路由加载
router.beforeEach(async (to, from) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  const authStore = useAuthStore();
  const token = authStore.token || localStorage.getItem('nebula_token');

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      const redirectQuery = to.fullPath && to.fullPath !== '/login' ? { redirect: to.fullPath } : {};
      return { path: '/login', query: redirectQuery };
    }

    if (!authStore.user) {
      try {
        await authStore.fetchUserInfo();
      } catch (error) {
        authStore.logout();
        return '/login';
      }
    }

    if (!authStore.routesLoaded) {
      try {
        const menuTree = await authStore.fetchUserMenus();
        const dynamicRoutes = filterAsyncRoutes(menuTree);
        dynamicRoutes.forEach(route => {
          router.addRoute('Layout', route);
        });
        authStore.routesLoaded = true;
        return { ...to, replace: true };
      } catch (error) {
        console.error('动态加载路由产生异常:', error);
        authStore.routesLoaded = true;
        return true;
      }
    }
  } else {
    if (token && authStore.user && to.path === '/login') {
      return '/dashboard';
    }
  }
});

export default router;
