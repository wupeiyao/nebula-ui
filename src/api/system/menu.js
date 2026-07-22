import request from '../../utils/request.js';

/**
 * 查询菜单列表
 * @param {Object} query 查询参数
 */
export function listMenu(query) {
  return request({
    url: '/system/menu/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询树形菜单结构列表
 * @param {Object} query 查询参数
 */
export function getMenuTree(query) {
  return request({
    url: '/system/menu/tree',
    method: 'get',
    params: query
  });
}

/**
 * 查询当前登录用户的树形菜单结构列表
 */
export function getUserMenuTree() {
  return request({
    url: '/system/menu/userTree',
    method: 'get'
  });
}

/**
 * 获取菜单详细信息
 * @param {string|number} menuId 菜单ID
 */
export function getMenu(menuId) {
  return request({
    url: `/system/menu/${menuId}`,
    method: 'get'
  });
}

/**
 * 新增菜单
 * @param {Object} data 菜单信息
 */
export function addMenu(data) {
  return request({
    url: '/system/menu',
    method: 'post',
    data: data
  });
}

/**
 * 修改菜单
 * @param {Object} data 菜单信息
 */
export function updateMenu(data) {
  return request({
    url: '/system/menu',
    method: 'put',
    data: data
  });
}

/**
 * 修改菜单状态
 * @param {string|number} menuId 菜单ID
 * @param {string} status 状态 (0正常 1停用)
 */
export function changeMenuStatus(menuId, status) {
  return request({
    url: '/system/menu/changeStatus',
    method: 'put',
    params: { menuId, status }
  });
}

/**
 * 删除菜单
 * @param {string|number} menuId 菜单ID
 */
export function delMenu(menuId) {
  return request({
    url: `/system/menu/${menuId}`,
    method: 'delete'
  });
}
