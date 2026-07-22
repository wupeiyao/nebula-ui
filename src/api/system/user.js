import request from '../../utils/request.js';

/**
 * 分页查询用户列表
 * @param {Object} query 查询参数 (pageIndex, pageSize, username, mobile, status, deptId, isEnabled)
 */
export function listUser(query) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  });
}

/**
 * 获取用户详细信息
 * @param {string|number} userId 用户ID
 */
export function getUser(userId) {
  return request({
    url: `/system/user/${userId}`,
    method: 'get'
  });
}

/**
 * 新增用户
 * @param {Object} data 用户信息
 */
export function addUser(data) {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  });
}

/**
 * 修改用户
 * @param {Object} data 用户信息
 */
export function updateUser(data) {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  });
}

/**
 * 修改用户状态/启用状态
 * @param {string|number} userId 用户ID
 * @param {string} status 状态 (0正常 1停用)
 * @param {boolean} isEnabled 是否启用
 */
export function changeUserStatus(userId, status, isEnabled) {
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    params: { userId, status, isEnabled }
  });
}

/**
 * 重置用户密码
 * @param {string|number} userId 用户ID
 * @param {string} password 新密码
 */
export function resetUserPwd(userId, password) {
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    params: { userId, password }
  });
}

/**
 * 删除用户
 * @param {string|number|Array} userId 用户ID或用户ID数组
 */
export function delUser(userId) {
  const ids = Array.isArray(userId) ? userId.join(',') : userId;
  return request({
    url: `/system/user/${ids}`,
    method: 'delete'
  });
}
