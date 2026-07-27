import request from '../../utils/request.js';

// 查询客户列表
export function listCustomer(query) {
  return request({
    url: '/business/customer/list',
    method: 'get',
    params: query
  });
}

// 查询客户详细
export function getCustomer(userId) {
  return request({
    url: `/business/customer/${userId}`,
    method: 'get'
  });
}

// 新增客户
export function addCustomer(data) {
  return request({
    url: '/business/customer',
    method: 'post',
    data: data
  });
}

// 修改客户
export function updateCustomer(data) {
  return request({
    url: '/business/customer',
    method: 'put',
    data: data
  });
}

// 删除客户
export function delCustomer(userId) {
  const ids = Array.isArray(userId) ? userId.join(',') : userId;
  return request({
    url: `/business/customer/${ids}`,
    method: 'delete'
  });
}

// 客户充值/调账
export function rechargeCustomer(data) {
  return request({
    url: '/business/customer/recharge',
    method: 'post',
    data: data
  });
}

// 查询客户资金变动明细
export function listCustomerBalanceLog(query) {
  return request({
    url: '/business/customer/balance-log/list',
    method: 'get',
    params: query
  });
}

