import request from '../../utils/request.js';

/**
 * 分页查询定时任务
 * @param {Object} query 查询参数 (name, code, status, pageIndex, pageSize)
 */
export function queryTaskPager(query) {
  return request({
    url: '/task',
    method: 'get',
    params: query
  });
}

/**
 * 查询定时任务详情
 * @param {number|string} id 任务ID
 */
export function getTaskById(id) {
  return request({
    url: `/task/${id}`,
    method: 'get'
  });
}

/**
 * 新增定时任务
 * @param {Object} data 任务实体
 */
export function createTask(data) {
  return request({
    url: '/task',
    method: 'post',
    data: data
  });
}

/**
 * 更新定时任务
 * @param {Object} data 任务实体
 */
export function updateTask(data) {
  return request({
    url: '/task',
    method: 'put',
    data: data
  });
}

/**
 * 删除定时任务
 * @param {number|string} id 任务ID
 */
export function deleteTask(id) {
  return request({
    url: `/task/${id}`,
    method: 'delete'
  });
}

/**
 * 开启或关闭定时任务开关
 * @param {number|string} id 任务ID
 * @param {number} status 状态：0-禁用，1-启用
 */
export function toggleTaskStatus(id, status) {
  return request({
    url: `/task/${id}/toggle`,
    method: 'post',
    params: { status }
  });
}

/**
 * 立即执行一次定时任务
 * @param {number|string} id 任务ID
 */
export function runTaskOnce(id) {
  return request({
    url: `/task/${id}/run`,
    method: 'post'
  });
}

/**
 * 分页查询任务执行日志
 * @param {Object} query 查询参数 (taskId, taskCode, status, startTime, endTime, pageIndex, pageSize)
 */
export function queryTaskLogPager(query) {
  return request({
    url: '/task/log',
    method: 'get',
    params: query
  });
}

/**
 * 查询定时任务执行日志详情
 * @param {number|string} id 日志ID
 */
export function getTaskLogById(id) {
  return request({
    url: `/task/log/${id}`,
    method: 'get'
  });
}
