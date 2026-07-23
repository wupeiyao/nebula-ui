<template>
  <div class="app-container">
    <div class="main-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="日志级别" prop="level">
          <el-select
            v-model="queryParams.level"
            placeholder="请选择级别"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="INFO" value="INFO" />
            <el-option label="WARN" value="WARN" />
            <el-option label="ERROR" value="ERROR" />
            <el-option label="DEBUG" value="DEBUG" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块名称" prop="mavenModule">
          <el-input
            v-model="queryParams.mavenModule"
            placeholder="请输入模块名称"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="类名" prop="className">
          <el-input
            v-model="queryParams.className"
            placeholder="请输入类名"
            clearable
            class="search-input-long"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="日志时间">
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
            @click="handleClean"
          >
            清空日志
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
          :data="logList"
          class="nebula-modern-table"
          border
          height="100%"
        >
          <el-table-column label="编号" align="center" prop="id" width="80" :show-overflow-tooltip="true" />
          <el-table-column label="级别" align="center" prop="level" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.level === 'INFO'" type="info" effect="light">INFO</el-tag>
              <el-tag v-else-if="scope.row.level === 'WARN'" type="warning" effect="light">WARN</el-tag>
              <el-tag v-else-if="scope.row.level === 'ERROR'" type="danger" effect="light">ERROR</el-tag>
              <el-tag v-else-if="scope.row.level === 'DEBUG'" effect="light">DEBUG</el-tag>
              <el-tag v-else type="info" effect="plain">{{ scope.row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="模块" align="center" prop="mavenModule" width="150" :show-overflow-tooltip="true" />
          <el-table-column label="线程" align="center" prop="threadName" width="140" :show-overflow-tooltip="true" />
          <el-table-column label="类名" align="center" prop="className" :show-overflow-tooltip="true" />
          <el-table-column label="方法名" align="center" prop="methodName" width="160" :show-overflow-tooltip="true" />
          <el-table-column label="行号" align="center" prop="lineNumber" width="80" :show-overflow-tooltip="true" />
          <el-table-column label="日志时间" align="center" prop="createTime" width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ formatTime(scope.row.createTime) }}</span>
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

    <!-- 系统日志详细 -->
    <el-dialog v-model="open" title="系统运行日志详细" width="800px" append-to-body destroy-on-close class="custom-dialog">
      <el-form :model="form" label-width="110px" class="dialog-form detail-form">
        <el-row>
          <el-col :span="12">
            <el-form-item label="模块名称：">{{ form.mavenModule }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称：">{{ form.name }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="线程名：">{{ form.threadName }} (ID: {{ form.threadId }})</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日志级别：">
              <el-tag v-if="form.level === 'INFO'" type="info">INFO</el-tag>
              <el-tag v-else-if="form.level === 'WARN'" type="warning">WARN</el-tag>
              <el-tag v-else-if="form.level === 'ERROR'" type="danger">ERROR</el-tag>
              <el-tag v-else-if="form.level === 'DEBUG'">DEBUG</el-tag>
              <el-tag v-else type="info">{{ form.level }}</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="类名：">{{ form.className }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="方法名：">{{ form.methodName }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代码行号：">{{ form.lineNumber }}</el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.java">
            <el-form-item label="代码地址：">{{ form.java }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="日志内容：">
              <div class="code-box">{{ form.message }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.exceptionStack">
            <el-form-item label="异常堆栈：">
              <div class="code-box error-box">{{ form.exceptionStack }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.context && Object.keys(form.context).length > 0">
            <el-form-item label="上下文信息：">
              <div class="code-box json-box">{{ JSON.stringify(form.context, null, 2) }}</div>
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
import { getSystemLogList, cleanSystemLog } from '../../../api/system/systemLog.js'

const loading = ref(true)
const total = ref(0)
const logList = ref([])
const open = ref(false)
const dateRange = ref([])
const form = ref({})

const data = reactive({
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    level: undefined,
    mavenModule: undefined,
    className: undefined
  }
})

const { queryParams } = toRefs(data)

/** 格式化时间戳 */
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const pad = (n) => (n < 10 ? '0' + n : n)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 查询系统日志 */
const getList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = new Date(dateRange.value[0] + ' 00:00:00').getTime()
      params.endTime = new Date(dateRange.value[1] + ' 23:59:59').getTime()
    }
    const res = await getSystemLogList(params)
    const pageData = res.result || res.data || {}
    logList.value = pageData.list || []
    total.value = pageData.total || 0
  } catch (error) {
    console.error('查询异常', error)
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
  queryParams.value.level = undefined
  queryParams.value.mavenModule = undefined
  queryParams.value.className = undefined
  handleQuery()
}

/** 详细按钮操作 */
const handleView = (row) => {
  open.value = true
  form.value = { ...row }
}

/** 清空按钮操作 */
const handleClean = () => {
  ElMessageBox.confirm('是否确认清空所有系统运行日志？此操作不可恢复！', '高危操作警告', {
    confirmButtonText: '确认清空',
    cancelButtonText: '取消',
    type: 'error'
  }).then(async () => {
    await cleanSystemLog()
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
}

.search-input {
  width: 180px;
}

.search-input-long {
  width: 220px;
}

.status-select {
  width: 130px;
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
  min-height: 0;
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
  margin-bottom: 8px;
}

.code-box {
  background-color: #f8f8f9;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 12px;
  width: 100%;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.error-box {
  color: #f56c6c;
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.json-box {
  color: #2c3e50;
  background-color: #f0f2f5;
  font-family: Consolas, "Courier New", monospace;
  white-space: pre;
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
