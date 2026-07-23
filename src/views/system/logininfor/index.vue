<template>
  <div class="app-container">
    <div class="main-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="用户账号" prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户账号"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="登录IP" prop="ipaddr">
          <el-input
            v-model="queryParams.ipaddr"
            placeholder="请输入登录IP"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="登录状态"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="成功" value="0" />
            <el-option label="失败" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="访问时间">
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
          <el-table-column label="访问编号" align="center" prop="infoId" width="130" :show-overflow-tooltip="true" />
          <el-table-column label="用户账号" align="center" prop="username" width="140" :show-overflow-tooltip="true" />
          <el-table-column label="登录IP" align="center" prop="ipaddr" width="130" :show-overflow-tooltip="true" />
          <el-table-column label="登录地点" align="center" prop="loginLocation" width="120" :show-overflow-tooltip="true" />
          <el-table-column label="浏览器" align="center" prop="browser" width="140" :show-overflow-tooltip="true" />
          <el-table-column label="操作系统" align="center" prop="os" width="130" :show-overflow-tooltip="true" />
          <el-table-column label="登录状态" align="center" prop="status" width="100">
            <template #default="scope">
              <span v-if="scope.row.status === '0'" class="status-plain active-status">成功</span>
              <span v-else class="status-plain disabled-status">失败</span>
            </template>
          </el-table-column>
          <el-table-column label="提示消息" align="center" prop="msg" :show-overflow-tooltip="true" />
          <el-table-column label="访问时间" align="center" prop="loginTime" width="170" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.loginTime }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" fixed="right">
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

    <!-- 登录日志详细 -->
    <el-dialog v-model="open" title="登录日志详细" width="650px" append-to-body destroy-on-close class="custom-dialog">
      <el-form :model="form" label-width="100px" class="dialog-form detail-form">
        <el-row>
          <el-col :span="12">
            <el-form-item label="访问编号：">{{ form.infoId }}</el-form-item>
            <el-form-item label="用户账号：">{{ form.username }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录IP：">{{ form.ipaddr }}</el-form-item>
            <el-form-item label="登录地点：">{{ form.loginLocation }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="浏览器：">{{ form.browser }}</el-form-item>
            <el-form-item label="操作系统：">{{ form.os }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户端：">{{ form.client || 'PC' }}</el-form-item>
            <el-form-item label="访问时间：">{{ form.loginTime }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录状态：">
              <el-tag v-if="form.status === '0'" type="success">成功</el-tag>
              <el-tag v-else type="danger">失败</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="提示消息：">
              <div class="code-box" :class="{ 'error-box': form.status !== '0' }">{{ form.msg }}</div>
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
import { RefreshRight } from '@element-plus/icons-vue'
import { listLogininfor, delLogininfor, cleanLogininfor } from '../../../api/system/logininfor.js'

const loading = ref(true)
const infoIds = ref([])
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
    username: undefined,
    ipaddr: undefined,
    status: undefined
  }
})

const { queryParams } = toRefs(data)

/** 查询登录日志列表 */
const getList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0] + ' 00:00:00'
      params.endTime = dateRange.value[1] + ' 23:59:59'
    }
    const res = await listLogininfor(params)
    const pageData = res.result || res.data || {}
    logList.value = pageData.list || []
    total.value = pageData.total || 0
  } catch (error) {
    console.error('查询登录日志异常', error)
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
  queryParams.value.username = undefined
  queryParams.value.ipaddr = undefined
  queryParams.value.status = undefined
  handleQuery()
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  infoIds.value = selection.map(item => item.infoId)
  multiple.value = !selection.length
}

/** 详细按钮操作 */
const handleView = (row) => {
  open.value = true
  form.value = { ...row }
}

/** 删除按钮操作 */
const handleDelete = () => {
  const ids = infoIds.value
  ElMessageBox.confirm(`是否确认删除访问编号为"${ids}"的数据项？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delLogininfor(ids)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

/** 清空按钮操作 */
const handleClean = () => {
  ElMessageBox.confirm('是否确认清空所有系统登录日志数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await cleanLogininfor()
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

/* 状态样式 */
.status-plain {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  display: inline-block;
  line-height: 1.2;
}
.active-status {
  color: #67c23a;
  border: 1px solid #e1f3d8;
  background-color: #f0f9eb;
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
  max-height: 150px;
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

.btn-cancel {
  border-radius: 4px;
}
</style>
