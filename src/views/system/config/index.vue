<template>
  <div class="app-container">
    <div class="main-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="参数名称" prop="configName">
          <el-input
            v-model="queryParams.configName"
            placeholder="请输入参数名称"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input
            v-model="queryParams.configKey"
            placeholder="请输入参数键名"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-select
            v-model="queryParams.configType"
            placeholder="系统内置"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="是" value="Y" />
            <el-option label="否" value="N" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="状态"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary"  @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-button type="primary" @click="handleAdd">
            新增参数
          </el-button>
          <el-button
            type="danger"
            :disabled="multiple"
            @click="handleDelete"
          >
            删除
          </el-button>
<!--          <el-button type="warning" :icon="Refresh" @click="handleRefreshCache">-->
<!--            刷新缓存-->
<!--          </el-button>-->
        </div>
        <div class="action-right">
          <el-tooltip content="刷新" placement="top">
            <el-button circle  class="tool-btn" @click="getList" />
          </el-tooltip>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="configList"
          @selection-change="handleSelectionChange"
          class="nebula-modern-table"
          border
          height="100%"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="主键" align="center" prop="configId" width="90" :show-overflow-tooltip="true" />
          <el-table-column label="参数名称" align="center" prop="configName" :show-overflow-tooltip="true" min-width="150" />
          <el-table-column label="参数键名" align="center" prop="configKey" :show-overflow-tooltip="true" min-width="160">
            <template #default="scope">
              <span class="code-font">{{ scope.row.configKey }}</span>
            </template>
          </el-table-column>
          <el-table-column label="参数键值" align="center" prop="configValue" :show-overflow-tooltip="true" min-width="160" />
          <el-table-column label="系统内置" align="center" prop="configType" width="90">
            <template #default="scope">
              <span>{{ scope.row.configType === 'Y' ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="status" width="80">
            <template #default="scope">
              <span>{{ scope.row.status === '0' ? '正常' : '停用' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" min-width="130" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="160" :show-overflow-tooltip="true" />
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body destroy-on-close class="custom-dialog">
      <el-form ref="configFormRef" :model="form" :rules="rules" label-width="100px" class="dialog-form">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名，例：sys.user.initPassword" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" :rows="3" placeholder="请输入参数键值" />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio label="Y">是</el-radio>
            <el-radio label="N">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="open = false" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, RefreshRight } from '@element-plus/icons-vue'
import {
  listConfig,
  getConfig,
  addConfig,
  updateConfig,
  delConfig,
  refreshCache
} from '../../../api/system/config.js'

const loading = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const configList = ref([])
const open = ref(false)
const title = ref('')
const configFormRef = ref(null)

const data = reactive({
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    configName: undefined,
    configKey: undefined,
    configType: undefined,
    status: undefined
  },
  form: {
    configId: undefined,
    configName: '',
    configKey: '',
    configValue: '',
    configType: 'Y',
    status: '0',
    remark: ''
  },
  rules: {
    configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
    configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
    configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询参数配置列表 */
const getList = async () => {
  loading.value = true
  try {
    const res = await listConfig(queryParams.value)
    const pageData = res.result || res.data || {}
    configList.value = pageData.list || []
    total.value = pageData.total || 0
  } catch (error) {
    console.error('获取参数配置列表失败', error)
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
  queryParams.value.configName = undefined
  queryParams.value.configKey = undefined
  queryParams.value.configType = undefined
  queryParams.value.status = undefined
  handleQuery()
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.configId)
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  form.value = {
    configId: undefined,
    configName: '',
    configKey: '',
    configValue: '',
    configType: 'Y',
    status: '0',
    remark: ''
  }
  title.value = '新增参数配置'
  open.value = true
}

/** 修改按钮操作 */
const handleUpdate = async (row) => {
  const configId = row.configId || ids.value[0]
  const res = await getConfig(configId)
  form.value = res.result || res.data || row
  title.value = '修改参数配置'
  open.value = true
}

/** 提交按钮 */
const submitForm = () => {
  configFormRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.configId) {
        await updateConfig(form.value)
        ElMessage.success('修改成功')
      } else {
        await addConfig(form.value)
        ElMessage.success('新增成功')
      }
      open.value = false
      getList()
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const configIds = row.configId || ids.value
  ElMessageBox.confirm(`是否确认删除参数编号为"${configIds}"的数据项？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delConfig(configIds)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

/** 刷新缓存按钮操作 */
const handleRefreshCache = async () => {
  await refreshCache()
  ElMessage.success('刷新参数缓存成功')
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
  width: 200px;
}

.status-select {
  width: 130px;
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

/* 表格容器控制 */
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

.code-font {
  font-family: Consolas, Monaco, monospace;
  color: #409eff;
  font-size: 13px;
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

.dialog-form {
  padding: 10px 0;
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
