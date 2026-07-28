import request from '../../utils/request.js';

// 查询陪玩列表
export function listPlaymate(query) {
  return request({
    url: '/business/playmate/list',
    method: 'get',
    params: query
  });
}

// 查询陪玩详细
export function getPlaymate(userId) {
  return request({
    url: `/business/playmate/${userId}`,
    method: 'get'
  });
}

// 新增陪玩
export function addPlaymate(data) {
  return request({
    url: '/business/playmate',
    method: 'post',
    data: data
  });
}

// 修改陪玩
export function updatePlaymate(data) {
  return request({
    url: '/business/playmate',
    method: 'put',
    data: data
  });
}

// 删除陪玩
export function delPlaymate(userId) {
  const ids = Array.isArray(userId) ? userId.join(',') : userId;
  return request({
    url: `/business/playmate/${ids}`,
    method: 'delete'
  });
}

// 打卡/记录陪玩在线时长
export function recordOnlineLog(data) {
  return request({
    url: '/business/playmate/online-log',
    method: 'post',
    data: data
  });
}

// 分页查询陪玩在线时长日志
export function listOnlineLogs(query) {
  return request({
    url: '/business/playmate/online-log/list',
    method: 'get',
    params: query
  });
}

// 多维度在线时长统计
export function getOnlineStats(query) {
  return request({
    url: '/business/playmate/online-log/stats',
    method: 'get',
    params: query
  });
}

// 获取陪玩在线时长统计汇总
export function getOnlineSummary(playmateId) {
  return request({
    url: `/business/playmate/online-log/summary/${playmateId}`,
    method: 'get'
  });
}
