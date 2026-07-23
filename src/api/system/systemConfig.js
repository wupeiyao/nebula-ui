import request from '../../utils/request.js';

// 获取系统配置 (需鉴权)
export function getSystemConfig() {
  return request({
    url: '/system/systemConfig',
    method: 'get'
  });
}

// 获取公开系统配置 (免鉴权)
export function getPublicSystemConfig() {
  return request({
    url: '/system/systemConfig/public',
    method: 'get'
  });
}

// 更新系统配置
export function updateSystemConfig(data) {
  return request({
    url: '/system/systemConfig',
    method: 'put',
    data: data
  });
}
