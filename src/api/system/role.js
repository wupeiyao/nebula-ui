import request from '../../utils/request.js';

/**
 * 查询角色列表
 * @param {Object} query 查询参数
 */
export function listRole(query) {
  return request({
    url: '/system/role/list',
    method: 'get',
    params: query
  });
}

/**
 * 分页查询角色列表
 * @param {Object} query 查询参数
 */
export function pageRole(query) {
  return request({
    url: '/system/role/page',
    method: 'get',
    params: query
  });
}

/**
 * 查询角色详细
 * @param {String} roleId 角色ID
 */
export function getRole(roleId) {
  return request({
    url: '/system/role/' + roleId,
    method: 'get'
  });
}

/**
 * 新增角色
 * @param {Object} data 角色数据
 */
export function addRole(data) {
  return request({
    url: '/system/role',
    method: 'post',
    data: data
  });
}

/**
 * 修改角色
 * @param {Object} data 角色数据
 */
export function updateRole(data) {
  return request({
    url: '/system/role',
    method: 'put',
    data: data
  });
}

/**
 * 角色状态修改
 * @param {String} roleId 角色ID
 * @param {String} status 状态(0正常 1停用)
 */
export function changeRoleStatus(roleId, status) {
  return request({
    url: '/system/role/changeStatus',
    method: 'put',
    params: {
      roleId: roleId,
      status: status
    }
  });
}

/**
 * 删除角色
 * @param {String} roleId 角色ID
 */
export function delRole(roleId) {
  return request({
    url: '/system/role/' + roleId,
    method: 'delete'
  });
}
