<template>
  <div class="app-container">
    <div class="main-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="系统模块" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入系统模块"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="操作人员" prop="operName">
          <el-input
            v-model="queryParams.operName"
            placeholder="请输入操作人员"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="类型" prop="businessType">
          <el-select
            v-model="queryParams.businessType"
            placeholder="操作类型"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="新增" :value="1" />
            <el-option label="修改" :value="2" />
            <el-option label="删除" :value="3" />
            <el-option label="查询" :value="4" />
            <el-option label="其它" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="操作状态"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="正常" :value="1" />
            <el-option label="异常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="date-picker-input"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
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
          <el-button
            type="danger"
            @click="handleClean"
          >
            清空
          </el-button>
        </div>
        <div class="action-right">
          <el-tooltip content="刷新" placement="top">
            <el-button circle :icon="RefreshRight" class="tool-btn" @click="getList" />
          </el-tooltip>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="logList"
          @selection-change="handleSelectionChange"
          class="nebula-modern-table"
          border
          height="100%"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="日志编号" align="center" prop="id" width="100" :show-overflow-tooltip="true" />
          <el-table-column label="系统模块" align="center" prop="title" :show-overflow-tooltip="true" />
          <el-table-column label="操作类型" align="center" prop="businessType">
            <template #default="scope">
              <el-tag v-if="scope.row.businessType === 1" type="success" effect="light">新增</el-tag>
              <el-tag v-else-if="scope.row.businessType === 2" type="warning" effect="light">修改</el-tag>
              <el-tag v-else-if="scope.row.businessType === 3" type="danger" effect="light">删除</el-tag>
              <el-tag v-else-if="scope.row.businessType === 4" type="info" effect="light">查询</el-tag>
              <el-tag v-else type="info" effect="light">其它</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作人员" align="center" prop="operName" :show-overflow-tooltip="true" />
          <el-table-column label="主机地址" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
          <el-table-column label="操作状态" align="center" prop="status">
            <template #default="scope">
              <span v-if="scope.row.status === 1" class="status-plain active-status">正常</span>
              <span v-else class="status-plain disabled-status">异常</span>
            </template>
          </el-table-column>
          <el-table-column label="操作时间" align="center" prop="createTime" width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.createTime }}</span>
            </template>
          </el-table-column>
          <el-table-column label="消耗时间" align="center" prop="costTime" width="100" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.costTime }}ms</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleView(scope.row)">详细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
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

    <!-- 操作日志详细 -->
    <el-dialog v-model="open" title="操作日志详细" width="700px" append-to-body destroy-on-close class="custom-dialog">
      <el-form :model="form" label-width="100px" class="dialog-form detail-form">
        <el-row>
          <el-col :span="12">
            <el-form-item label="操作模块：">{{ form.title }} / {{ typeFormat(form.businessType) }}</el-form-item>
            <el-form-item label="登录信息：">{{ form.operName }} / {{ form.operIp }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求地址：">{{ form.operUrl }}</el-form-item>
            <el-form-item label="请求方式：">{{ form.requestMethod }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="操作方法：">{{ form.method }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="请求参数：">
              <div class="code-box">{{ form.operParam }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="返回参数：">
              <div class="code-box">{{ form.jsonResult }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作状态：">
              <el-tag v-if="form.status === 1" type="success">正常</el-tag>
              <el-tag v-else type="danger">异常</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="消耗时间：">{{ form.costTime }}毫秒</el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.status === 0">
            <el-form-item label="异常信息：">
              <div class="code-box error-box">{{ form.errorMsg }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="open = false" class="btn-cancel">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, RefreshRight, Delete, View } from '@element-plus/icons-vue'
import { getAuditLogList, delAuditLog, cleanAuditLog } from '../../../../api/system/auditLog.js'

const loading = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const logList = ref([])
const open = ref(false)
const dateRange = ref([])
const form = ref({})

const data = reactive({
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    title: undefined,
    operName: undefined,
    businessType: undefined,
    status: undefined
  }
})

const { queryParams } = toRefs(data)

/** 查询登录日志 */
const getList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0] + ' 00:00:00'
      params.endTime = dateRange.value[1] + ' 23:59:59'
    }
    const res = await getAuditLogList(params)
    const pageData = res.result || res.data || {}
    logList.value = pageData.list || []
    total.value = pageData.total || 0
  } catch (error) {
    console.error('查询异常', error)
  } finally {
    loading.value = false
  }
}

/** 操作日志类型字典翻译 */
const typeFormat = (type) => {
  const map = {
    1: '新增',
    2: '修改',
    3: '删除',
    4: '查询',
    0: '其它'
  }
  return map[type] || '其它'
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageIndex = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = []
  queryParams.value.title = undefined
  queryParams.value.operName = undefined
  queryParams.value.businessType = undefined
  queryParams.value.status = undefined
  handleQuery()
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  multiple.value = !selection.length
}

/** 详细按钮操作 */
const handleView = (row) => {
  open.value = true
  form.value = { ...row }
}

/** 删除按钮操作 */
const handleDelete = () => {
  const logIds = ids.value
  ElMessageBox.confirm(`是否确认删除日志编号为"${logIds}"的数据项？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delAuditLog(logIds)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

/** 清空按钮操作 */
const handleClean = () => {
  ElMessageBox.confirm('是否确认清空所有操作日志数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await cleanAuditLog()
    getList()
    ElMessage.success('清空成功')
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
  font-size: 16px;
}

/* 主面板容器 */
.main-card {
  flex: 1;
  min-height: 0;
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
  font-size: 16px;
}

:deep(.search-bar .el-input__inner),
:deep(.search-bar .el-select .el-input__inner),
:deep(.search-bar .el-button) {
  font-size: 16px;
}

.search-input {
  width: 200px;
}

.status-select {
  width: 150px;
}

.date-picker-input {
  width: 260px;
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
  font-size: 16px;
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
  min-height: 0;
}

.nebula-modern-table {
  width: 100%;
  font-size: 16px;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #f8f8f9 !important;
  color: #515a6e !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  height: 44px !important;
  padding: 8px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 8px 0 !important;
  font-size: 16px !important;
  color: #606266;
}

:deep(.nebula-modern-table .el-button) {
  font-size: 16px;
}

/* 状态样式 */
.status-plain {
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 2px;
  display: inline-block;
  line-height: 1.2;
}
.active-status {
  color: #409eff;
  border: 1px solid #d9ecff;
  background-color: #ecf5ff;
}
.disabled-status {
  color: #f56c6c;
  border: 1px solid #fde2e2;
  background-color: #fef0f0;
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
  font-size: 16px;
  color: #606266;
}

:deep(.custom-pagination),
:deep(.custom-pagination button),
:deep(.custom-pagination span),
:deep(.custom-pagination li),
:deep(.custom-pagination input) {
  font-size: 15px !important;
}

/* 弹窗样式 */
:deep(.custom-dialog) {
  border-radius: 4px !important;
  font-size: 16px;
}

:deep(.custom-dialog .el-dialog__title) {
  font-size: 18px;
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
  margin-bottom: 8px;
}

:deep(.detail-form .el-form-item__label) {
  font-size: 16px;
}

.code-box {
  background-color: #f8f8f9;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 12px;
  width: 100%;
  font-family: Consolas, Monaco, monospace;
  font-size: 15px;
  line-height: 1.5;
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.error-box {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

:deep(.dialog-footer .el-button) {
  font-size: 16px;
}

.btn-cancel {
  border-radius: 4px;
}
</style>
