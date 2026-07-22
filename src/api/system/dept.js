import request from '../../utils/request.js';

/**
 * 查询部门列表
 * @param {Object} query 查询参数
 */
export function listDept(query) {
  return request({
    url: '/system/dept/list',
    method: 'get',
    params: query
  });
}

/**
 * 分页查询部门列表
 * @param {Object} query 查询参数
 */
export function pageDept(query) {
  return request({
    url: '/system/dept/page',
    method: 'get',
    params: query
  });
}

/**
 * 查询部门详细
 * @param {String} deptId 部门ID
 */
export function getDept(deptId) {
  return request({
    url: '/system/dept/' + deptId,
    method: 'get'
  });
}

/**
 * 新增部门
 * @param {Object} data 部门数据
 */
export function addDept(data) {
  return request({
    url: '/system/dept',
    method: 'post',
    data: data
  });
}

/**
 * 修改部门
 * @param {Object} data 部门数据
 */
export function updateDept(data) {
  return request({
    url: '/system/dept',
    method: 'put',
    data: data
  });
}

/**
 * 修改部门状态
 * @param {String} deptId 部门ID
 * @param {String} status 状态(0正常 1停用)
 */
export function changeDeptStatus(deptId, status) {
  return request({
    url: '/system/dept/changeStatus',
    method: 'put',
    params: {
      deptId: deptId,
      status: status
    }
  });
}

/**
 * 删除部门
 * @param {String} deptId 部门ID
 */
export function delDept(deptId) {
  return request({
    url: '/system/dept/' + deptId,
    method: 'delete'
  });
}
