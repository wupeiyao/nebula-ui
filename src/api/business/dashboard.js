import request from '../../utils/request.js'

// 获取平台大屏核心KPI数据
export function getDashboardKpi() {
  return request({
    url: '/business/dashboard/kpi',
    method: 'get'
  })
}
