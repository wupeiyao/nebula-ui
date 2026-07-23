<template>
  <div class="app-container">
    <!-- 主卡片容器 -->
    <div class="main-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="模糊搜索" prop="blurry">
          <el-input
            v-model="queryParams.blurry"
            placeholder="文件名 / 对象ID"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="存储类型" prop="storage">
          <el-select
            v-model="queryParams.storage"
            placeholder="全部存储类型"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="本地存储 (local)" value="local" />
            <el-option label="MinIO服务 (minio)" value="minio" />
            <el-option label="阿里云 OSS (oss)" value="oss" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储空间" prop="bucket">
          <el-input
            v-model="queryParams.bucket"
            placeholder="存储 Bucket 名称"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="date-picker-input"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary"  @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-button
            type="danger"
            :disabled="multiple"
            @click="handleDelete"
          >
            删除
          </el-button>
        </div>
        <div class="action-right">
          <el-tooltip content="刷新" placement="top">
            <el-button circle class="tool-btn" @click="getList" />
          </el-tooltip>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="objectList"
          @selection-change="handleSelectionChange"
          class="nebula-modern-table"
          border
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="文件ID" align="center" prop="objectId" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="文件名称" prop="name" min-width="180" :show-overflow-tooltip="true" />

          <el-table-column label="存储类型" align="center" prop="storage" width="120">
            <template #default="scope">
              <span>{{ storageFormat(scope.row.storage) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="存储空间" align="center" prop="bucket" width="140" :show-overflow-tooltip="true" />

          <el-table-column label="文件后缀" align="center" prop="suffix" width="100">
            <template #default="scope">
              <span class="suffix-badge">{{ scope.row.suffix ? scope.row.suffix.toUpperCase() : '未知' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="文件大小" align="center" prop="size" width="120">
            <template #default="scope">
              <span>{{ formatFileSize(scope.row.size) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="创建人" align="center" prop="creatorName" width="120" :show-overflow-tooltip="true" />

          <el-table-column label="创建时间" align="center" prop="createTime" width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="150" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="primary" class="action-link" @click="handleViewDetail(scope.row)">详细</el-button>
                <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页区域 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条</span>
        </div>
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :background="true"
          layout="sizes, prev, pager, next, jumper"
          :total="total"
          class="custom-pagination"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 文件元数据详细弹窗 -->
    <el-dialog v-model="openDetail" title="文件元数据详细" width="720px" append-to-body destroy-on-close class="custom-dialog">
      <el-form :model="detailForm" label-width="100px" class="dialog-form detail-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="文件 ID：">{{ detailForm.objectId }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存储类型：">{{ storageFormat(detailForm.storage) }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件名称：">{{ detailForm.name }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存储空间：">{{ detailForm.bucket }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件大小：">{{ formatFileSize(detailForm.size) }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件后缀：">{{ detailForm.suffix }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="存储路径：">
              <div class="code-box path-box">{{ detailForm.path }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建者：">{{ detailForm.creatorName || '-' }} (ID: {{ detailForm.creatorId || '-' }})</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建时间：">{{ detailForm.createTime || '-' }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="HTTP头部：">
              <div class="code-box">{{ formatJson(detailForm.headers) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="自定义元数据：">
              <div class="code-box">{{ formatJson(detailForm.metadata) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="openDetail = false" class="btn-cancel">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, RefreshRight, Delete } from '@element-plus/icons-vue'
import { getObjectList, delObject, delObjectById } from '../../../api/system/object.js'

const loading = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const objectList = ref([])
const openDetail = ref(false)
const dateRange = ref([])
const detailForm = ref({})

const data = reactive({
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    blurry: undefined,
    storage: undefined,
    bucket: undefined
  }
})

const { queryParams } = toRefs(data)

/** 查询文件列表 */
const getList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0] + ' 00:00:00'
      params.endTime = dateRange.value[1] + ' 23:59:59'
    }
    const res = await getObjectList(params)
    const pageData = res.result || res.data || res
    objectList.value = pageData.list || []
    total.value = pageData.total || 0
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageIndex = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = []
  queryParams.value.blurry = undefined
  queryParams.value.storage = undefined
  queryParams.value.bucket = undefined
  handleQuery()
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.objectId)
  multiple.value = !selection.length
}

/** 查看元数据详细 */
const handleViewDetail = (row) => {
  detailForm.value = { ...row }
  openDetail.value = true
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const targetIds = row.objectId ? [row.objectId] : ids.value
  const confirmMsg = row.objectId
    ? `是否确认删除文件名称为 "${row.name}" 的数据项？`
    : `是否确认删除所选的 ${targetIds.length} 项文件元数据？`

  ElMessageBox.confirm(confirmMsg, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    if (row.objectId) {
      await delObjectById(row.objectId)
    } else {
      await delObject(targetIds)
    }
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleSizeChange = (val) => {
  queryParams.value.pageSize = val
  getList()
}

const handleCurrentChange = (val) => {
  queryParams.value.pageIndex = val
  getList()
}

/** 工具方法: 存储类型字典转换 */
const storageFormat = (storage) => {
  const map = {
    local: '本地存储',
    minio: 'MinIO',
    oss: '阿里云 OSS'
  }
  return map[storage] || storage || '-'
}

/** 工具方法: 文件大小格式化 */
const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 工具方法: 格式化 JSON 显示 */
const formatJson = (str) => {
  if (!str) return '-'
  try {
    const obj = typeof str === 'string' ? JSON.parse(str) : str
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return str
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

/* 主面板容器 */
.main-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 0;
}

:deep(.search-bar .el-form-item) {
  margin-bottom: 16px;
  margin-right: 16px;
}

:deep(.search-bar .el-form-item__label) {
  font-weight: 400;
  color: #606266;
}

.search-input {
  width: 200px;
}

.status-select {
  width: 180px;
}

.date-picker-input {
  width: 240px;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left .el-button {
  border-radius: 4px;
}

.tool-btn {
  border-color: #dcdfe6;
  color: #606266;
  padding: 8px;
}
.tool-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

/* 表格容器与基础控制 */
.table-wrapper {
  flex: 1;
}

.nebula-modern-table {
  width: 100%;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #f8f8f9 !important;
  color: #515a6e !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  height: 44px !important;
  padding: 8px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 8px 0 !important;
  font-size: 14px;
  color: #606266;
}

.suffix-badge {
  font-size: 11px;
  font-weight: 600;
  color: #606266;
  background-color: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #e9e9eb;
}

/* 操作列链接 */
.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-link {
  font-size: 13px;
  padding: 0;
  height: auto;
  margin: 0 !important;
}

.action-link-danger {
  color: #f56c6c;
}
.action-link-danger:hover {
  color: #f78989;
}

/* 表格底部 footer */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
}

.footer-info {
  font-size: 14px;
  color: #606266;
}

/* 弹窗样式 */
:deep(.custom-dialog) {
  border-radius: 4px !important;
}

:deep(.custom-dialog .el-dialog__header) {
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.detail-form {
  padding: 10px 0;
}

.detail-form .el-form-item {
  margin-bottom: 10px;
}

.code-box {
  background-color: #f8f8f9;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 12px;
  width: 100%;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 160px;
  overflow-y: auto;
}

.path-box {
  color: #409eff;
  background-color: #ecf5ff;
  border-color: #d9ecff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.btn-cancel {
  border-radius: 4px;
}
</style>
