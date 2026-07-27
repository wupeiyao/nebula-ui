import request from '../../utils/request.js';

// 查询订单列表
export function listOrder(query) {
  return request({
    url: '/business/order/list',
    method: 'get',
    params: query
  });
}

// 获取订单详细信息
export function getOrder(id) {
  return request({
    url: `/business/order/${id}`,
    method: 'get'
  });
}

// 新增订单
export function addOrder(data) {
  return request({
    url: '/business/order',
    method: 'post',
    data: data
  });
}

// 修改订单
export function updateOrder(data) {
  return request({
    url: '/business/order',
    method: 'put',
    data: data
  });
}

// 删除订单
export function delOrder(id) {
  const ids = Array.isArray(id) ? id.join(',') : id;
  return request({
    url: `/business/order/${ids}`,
    method: 'delete'
  });
}

// 订单支付扣款
export function payOrder(id) {
  return request({
    url: `/business/order/${id}/pay`,
    method: 'post'
  });
}

// 订单服务完成结算
export function completeOrder(id) {
  return request({
    url: `/business/order/${id}/complete`,
    method: 'post'
  });
}

// 订单退款
export function refundOrder(id, data) {
  return request({
    url: `/business/order/${id}/refund`,
    method: 'post',
    params: data
  });
}
