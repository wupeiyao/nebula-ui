import request from '../../utils/request.js'

// 查询文件对象元数据列表
export function getObjectList(query) {
  return request({
    url: '/object',
    method: 'get',
    params: query
  })
}

// 批量删除文件对象
export function delObject(ids) {
  return request({
    url: '/object',
    method: 'delete',
    data: ids
  })
}

// 单条删除文件对象
export function delObjectById(id) {
  return request({
    url: '/object/' + id,
    method: 'delete'
  })
}
