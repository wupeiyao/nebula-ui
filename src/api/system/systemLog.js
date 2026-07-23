import request from '../../utils/request.js'

// 查询系统运行日志列表
export function getSystemLogList(query) {
  return request({
    url: '/logger/system',
    method: 'get',
    params: query
  })
}

// 清空系统运行日志
export function cleanSystemLog() {
  return request({
    url: '/logger/system',
    method: 'delete'
  })
}
