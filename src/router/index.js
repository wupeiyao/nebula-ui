import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登入账户 - 精灵学院', requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '工作台 - 精灵学院', requiresAuth: true }
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

// 路由守卫：登录拦截与页面标题设置
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  
  const authStore = useAuthStore();
  const token = authStore.token || localStorage.getItem('nebula_token');
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 需要登录的页面
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原目标页面，登录成功后跳回
      });
    } else {
      // 已登录，如果没有用户信息则获取
      if (!authStore.user) {
        try {
          await authStore.fetchUserInfo();
          next();
        } catch (error) {
          authStore.logout();
          next('/login');
        }
      } else {
        next();
      }
    }
  } else {
    // 不需要登录的页面 (如登录页)
    if (token && to.path === '/login') {
      next('/dashboard'); // 已登录的访问登录页，直接重定向至主页
    } else {
      next();
    }
  }
});

export default router;
