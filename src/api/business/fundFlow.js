import request from '../../utils/request.js'

// 分页查询资金流水明细
export function listFundFlow(query) {
  return request({
    url: '/business/fund-flow/list',
    method: 'get',
    params: query
  })
}

// 获取平台资金大屏统计指标及排行榜
export function getFundStatistics(query) {
  return request({
    url: '/business/fund-flow/statistics',
    method: 'get',
    params: query
  })
}
