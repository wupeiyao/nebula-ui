import axios from 'axios';
import { ElMessage } from 'element-plus';
import securityConfig from '../config/security';

// 创建 axios 实例
const service = axios.create({
  baseURL: securityConfig.baseURL, // 默认请求的基础路径
  timeout: 10000 // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从 localStorage 获取 Token
    const token = localStorage.getItem('nebula_token');
    if (token) {
      // 头部携带 Token
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 兼容后端 CommonResponse.java 返回格式
    // 成功状态码通常为 200 整数或字符串 "200"
    if (res.status === 200 || res.code === '200') {
      return res; // 返回整个响应对象，包含 result 字段
    } else {
      // 业务错误处理
      const errorMsg = res.message || '系统错误，请稍后重试';
      if (!response.config.skipErrorNotify) {
        ElMessage({
          message: errorMsg,
          type: 'error',
          duration: 5 * 1000
        });
      }
      return Promise.reject(new Error(errorMsg));
    }
  },
  error => {
    console.error('Response interceptor error:', error);
    let message = '网络连接异常，请检查后端服务是否启动';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        // 未授权，清除本地 Token 并跳转到登录页面
        localStorage.removeItem('nebula_token');
        localStorage.removeItem('nebula_user');
        message = '登录已过期或未登录，请重新登录';
        
        // 延迟跳转，防止弹窗还没显示就刷新了页面
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 1500);
      } else if (status === 400) {
        // 请求错误，显示后端返回的具体错误信息
        message = data.message || '请求参数错误';
      } else if (data && data.message) {
        message = data.message;
      }
    }
    
    // 仅在未配置 skipErrorNotify 时进行弹窗提示
    if (!error.config || !error.config.skipErrorNotify) {
      ElMessage({
        message: message,
        type: 'error',
        duration: 5 * 1000
      });
    }
    
    return Promise.reject(error);
  }
);

export default service;
