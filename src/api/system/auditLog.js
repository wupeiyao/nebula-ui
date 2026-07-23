import request from '../../utils/request.js'

// 查询审计日志列表
export function getAuditLogList(query) {
  return request({
    url: '/logger/auditLog',
    method: 'get',
    params: query
  })
}

// 删除审计日志
export function delAuditLog(ids) {
  return request({
    url: '/logger/auditLog/' + ids,
    method: 'delete'
  })
}

// 清空审计日志
export function cleanAuditLog() {
  return request({
    url: '/logger/auditLog/clean',
    method: 'delete'
  })
}
