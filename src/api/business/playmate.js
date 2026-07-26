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
