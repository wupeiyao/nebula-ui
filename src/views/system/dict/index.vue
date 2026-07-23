<template>
  <div class="app-container">
    <el-row :gutter="16" class="full-height-row">
      <!-- 左侧：数据字典类型 -->
      <el-col :span="10" :xs="24">
        <div class="main-card left-card">
          <div class="card-title-bar">
            <span class="card-title">
              <el-icon><Notebook /></el-icon>
              数据字典类型
            </span>
            <el-button type="primary" size="small" @click="handleAddType">
              新增字典
            </el-button>
          </div>

          <!-- 字典类型搜索表单 -->
          <el-form :model="typeQueryParams" ref="typeQueryRef" :inline="true" class="search-bar mini-search">
            <el-form-item label="名称" prop="dictName">
              <el-input
                v-model="typeQueryParams.dictName"
                placeholder="字典名称"
                clearable
                class="search-input-small"
                @keyup.enter="handleTypeQuery"
                @clear="handleTypeQuery"
              />
            </el-form-item>
            <el-form-item label="类型" prop="dictType">
              <el-input
                v-model="typeQueryParams.dictType"
                placeholder="字典类型"
                clearable
                class="search-input-small"
                @keyup.enter="handleTypeQuery"
                @clear="handleTypeQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="handleTypeQuery">查询</el-button>
              <el-button size="small" @click="resetTypeQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 字典类型数据表格 -->
          <div class="table-wrapper">
            <el-table
              v-loading="typeLoading"
              :data="typeList"
              highlight-current-row
              @current-change="handleTypeCurrentSelect"
              class="nebula-modern-table"
              border
              height="100%"
            >
              <el-table-column label="字典名称" prop="dictName" :show-overflow-tooltip="true" min-width="110" />
              <el-table-column label="字典类型" prop="dictType" :show-overflow-tooltip="true" min-width="130">
                <template #default="scope">
                  <span class="dict-type-code">{{ scope.row.dictType }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" prop="status" width="75" align="center">
                <template #default="scope">
                  <span>{{ scope.row.status === '0' ? '正常' : '停用' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="100" fixed="right">
                <template #default="scope">
                  <el-button link type="primary" size="small" @click.stop="handleUpdateType(scope.row)">修改</el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDeleteType(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 字典类型分页 -->
          <div class="table-footer mini-footer">
            <span class="footer-info">共 {{ typeTotal }} 条</span>
            <el-pagination
              v-model:current-page="typeQueryParams.pageIndex"
              v-model:page-size="typeQueryParams.pageSize"
              :page-sizes="[10, 20, 30]"
              :background="true"
              layout="prev, pager, next"
              :total="typeTotal"
              class="custom-pagination"
              @size-change="handleTypeSizeChange"
              @current-change="handleTypePageChange"
            />
          </div>
        </div>
      </el-col>

      <!-- 右侧：字典数据值 -->
      <el-col :span="14" :xs="24">
        <div class="main-card right-card">
          <div class="card-title-bar">
            <span class="card-title">
              <el-icon><Operation /></el-icon>
              字典数据值
              <el-tag v-if="selectedType.dictType" type="primary" effect="light" class="selected-tag">
                {{ selectedType.dictName }} ({{ selectedType.dictType }})
              </el-tag>
            </span>
            <div class="card-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="!selectedType.dictType"
                @click="handleAddData"
              >
                新增字典值
              </el-button>
              <el-tooltip content="刷新" placement="top">
                <el-button circle size="small" class="tool-btn" @click="getDataList" />
              </el-tooltip>
            </div>
          </div>

          <template v-if="selectedType.dictType">
            <!-- 字典值搜索表单 -->
            <el-form :model="dataQueryParams" ref="dataQueryRef" :inline="true" class="search-bar mini-search">
              <el-form-item label="标签" prop="dictLabel">
                <el-input
                  v-model="dataQueryParams.dictLabel"
                  placeholder="字典标签"
                  clearable
                  class="search-input-small"
                  @keyup.enter="handleDataQuery"
                  @clear="handleDataQuery"
                />
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select
                  v-model="dataQueryParams.status"
                  placeholder="状态"
                  clearable
                  class="status-select-small"
                  @change="handleDataQuery"
                >
                  <el-option label="正常" value="0" />
                  <el-option label="停用" value="1" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary"  size="small" @click="handleDataQuery">查询</el-button>
                <el-button  size="small" @click="resetDataQuery">重置</el-button>
              </el-form-item>
            </el-form>

            <!-- 字典值表格 -->
            <div class="table-wrapper">
              <el-table
                v-loading="dataLoading"
                :data="dataList"
                class="nebula-modern-table"
                border
                height="100%"
              >
                <el-table-column label="排序" prop="dictSort" width="60" align="center" />
                <el-table-column label="字典标签" prop="dictLabel" :show-overflow-tooltip="true" min-width="110" />
                <el-table-column label="字典键值" prop="dictValue" :show-overflow-tooltip="true" min-width="100" />
                <el-table-column label="样式回显" prop="listClass" width="100" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.listClass || 'info'" effect="light">
                      {{ scope.row.dictLabel }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="默认" prop="isDefault" width="65" align="center">
                  <template #default="scope">
                    <span>{{ scope.row.isDefault === 'Y' ? '是' : '否' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" prop="status" width="75" align="center">
                  <template #default="scope">
                    <span>{{ scope.row.status === '0' ? '正常' : '停用' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
                <el-table-column label="操作" align="center" width="110" fixed="right">
                  <template #default="scope">
                    <el-button link type="primary" size="small" @click="handleUpdateData(scope.row)">修改</el-button>
                    <el-button link type="danger" size="small" @click="handleDeleteData(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 字典值分页 -->
            <div class="table-footer mini-footer">
              <span class="footer-info">共 {{ dataTotal }} 条</span>
              <el-pagination
                v-model:current-page="dataQueryParams.pageIndex"
                v-model:page-size="dataQueryParams.pageSize"
                :page-sizes="[10, 20, 30]"
                :background="true"
                layout="prev, pager, next"
                :total="dataTotal"
                class="custom-pagination"
                @size-change="handleDataSizeChange"
                @current-change="handleDataPageChange"
              />
            </div>
          </template>

          <div v-else class="empty-holder">
            <el-empty description="请在左侧列表中点击选择要管理的数据字典类型" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 字典类型弹窗 -->
    <el-dialog
      :title="typeTitle"
      v-model="typeOpen"
      width="500px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px" class="dialog-form">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="typeForm.dictName" placeholder="请输入字典名称，例：用户性别" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="typeForm.dictType" placeholder="请输入字典类型，例：sys_user_sex" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="typeForm.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="typeOpen = false" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitTypeForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 字典数据值弹窗 -->
    <el-dialog
      :title="dataTitle"
      v-model="dataOpen"
      width="550px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="90px" class="dialog-form">
        <el-form-item label="字典类型">
          <el-input v-model="dataForm.dictType" disabled />
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model="dataForm.dictLabel" placeholder="请输入字典标签，例：男" />
        </el-form-item>
        <el-form-item label="字典键值" prop="dictValue">
          <el-input v-model="dataForm.dictValue" placeholder="请输入字典键值，例：0" />
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="dataForm.dictSort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="dataForm.listClass" placeholder="请选择回显 Tag 样式" clearable style="width: 100%">
            <el-option label="默认 (default)" value="" />
            <el-option label="主要 (primary)" value="primary" />
            <el-option label="成功 (success)" value="success" />
            <el-option label="信息 (info)" value="info" />
            <el-option label="警告 (warning)" value="warning" />
            <el-option label="危险 (danger)" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-radio-group v-model="dataForm.isDefault">
            <el-radio label="Y">是</el-radio>
            <el-radio label="N">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dataForm.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="dataForm.remark" type="textarea" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dataOpen = false" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitDataForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, RefreshRight, Notebook, Operation } from '@element-plus/icons-vue'
import {
  listType,
  getType,
  addType,
  updateType,
  delType,
  listData,
  getData,
  addData,
  updateData,
  delData
} from '../../../api/system/dict.js'

// 左侧字典类型变量
const typeLoading = ref(true)
const typeList = ref([])
const typeTotal = ref(0)
const typeOpen = ref(false)
const typeTitle = ref('')
const selectedType = ref({})
const typeFormRef = ref(null)

const typeData = reactive({
  typeQueryParams: {
    pageIndex: 1,
    pageSize: 10,
    dictName: undefined,
    dictType: undefined
  },
  typeForm: {
    dictId: undefined,
    dictName: '',
    dictType: '',
    status: '0',
    remark: ''
  },
  typeRules: {
    dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
    dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
  }
})

const { typeQueryParams, typeForm, typeRules } = toRefs(typeData)

// 右侧字典值变量
const dataLoading = ref(false)
const dataList = ref([])
const dataTotal = ref(0)
const dataOpen = ref(false)
const dataTitle = ref('')
const dataFormRef = ref(null)

const dataData = reactive({
  dataQueryParams: {
    pageIndex: 1,
    pageSize: 10,
    dictType: undefined,
    dictLabel: undefined,
    status: undefined
  },
  dataForm: {
    dictCode: undefined,
    dictType: '',
    dictLabel: '',
    dictValue: '',
    dictSort: 0,
    listClass: '',
    isDefault: 'N',
    status: '0',
    remark: ''
  },
  dataRules: {
    dictLabel: [{ required: true, message: '字典标签不能为空', trigger: 'blur' }],
    dictValue: [{ required: true, message: '字典键值不能为空', trigger: 'blur' }]
  }
})

const { dataQueryParams, dataForm, dataRules } = toRefs(dataData)

/** 查询字典类型列表 */
const getTypeList = async () => {
  typeLoading.value = true
  try {
    const res = await listType(typeQueryParams.value)
    const pageData = res.result || res.data || {}
    typeList.value = pageData.list || []
    typeTotal.value = pageData.total || 0
    // 如果没有选中项且有数据，默认选择第一行
    if (typeList.value.length > 0 && !selectedType.value.dictType) {
      handleTypeCurrentSelect(typeList.value[0])
    }
  } catch (error) {
    console.error('获取字典类型列表失败', error)
  } finally {
    typeLoading.value = false
  }
}

/** 字典类型搜索操作 */
const handleTypeQuery = () => {
  typeQueryParams.value.pageIndex = 1
  getTypeList()
}

/** 字典类型重置操作 */
const resetTypeQuery = () => {
  typeQueryParams.value.dictName = undefined
  typeQueryParams.value.dictType = undefined
  handleTypeQuery()
}

/** 选中字典类型行 */
const handleTypeCurrentSelect = (row) => {
  if (row) {
    selectedType.value = row
    dataQueryParams.value.dictType = row.dictType
    dataQueryParams.value.pageIndex = 1
    getDataList()
  }
}

/** 新增字典类型 */
const handleAddType = () => {
  typeForm.value = {
    dictId: undefined,
    dictName: '',
    dictType: '',
    status: '0',
    remark: ''
  }
  typeTitle.value = '新增字典类型'
  typeOpen.value = true
}

/** 修改字典类型 */
const handleUpdateType = async (row) => {
  const res = await getType(row.dictId)
  typeForm.value = res.result || res.data || row
  typeTitle.value = '修改字典类型'
  typeOpen.value = true
}

/** 提交字典类型表单 */
const submitTypeForm = () => {
  typeFormRef.value.validate(async (valid) => {
    if (valid) {
      if (typeForm.value.dictId) {
        await updateType(typeForm.value)
        ElMessage.success('修改成功')
        if (selectedType.value.dictId === typeForm.value.dictId) {
          selectedType.value.dictType = typeForm.value.dictType
          selectedType.value.dictName = typeForm.value.dictName
          dataQueryParams.value.dictType = typeForm.value.dictType
          getDataList()
        }
      } else {
        await addType(typeForm.value)
        ElMessage.success('新增成功')
      }
      typeOpen.value = false
      getTypeList()
    }
  })
}

/** 删除字典类型 */
const handleDeleteType = (row) => {
  ElMessageBox.confirm(`是否确认删除字典名称为"${row.dictName}"的数据项？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delType(row.dictId)
    if (selectedType.value.dictId === row.dictId) {
      selectedType.value = {}
      dataList.value = []
      dataTotal.value = 0
    }
    getTypeList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleTypeSizeChange = (val) => {
  typeQueryParams.value.pageSize = val
  getTypeList()
}

const handleTypePageChange = (val) => {
  typeQueryParams.value.pageIndex = val
  getTypeList()
}

// -------------------------------------------------------------
// 右侧字典值处理
// -------------------------------------------------------------

/** 查询字典数据值列表 */
const getDataList = async () => {
  if (!dataQueryParams.value.dictType) return
  dataLoading.value = true
  try {
    const res = await listData(dataQueryParams.value)
    const pageData = res.result || res.data || {}
    dataList.value = pageData.list || []
    dataTotal.value = pageData.total || 0
  } catch (error) {
    console.error('获取字典数据列表失败', error)
  } finally {
    dataLoading.value = false
  }
}

/** 字典值搜索操作 */
const handleDataQuery = () => {
  dataQueryParams.value.pageIndex = 1
  getDataList()
}

/** 字典值重置操作 */
const resetDataQuery = () => {
  dataQueryParams.value.dictLabel = undefined
  dataQueryParams.value.status = undefined
  handleDataQuery()
}

/** 新增字典值 */
const handleAddData = () => {
  dataForm.value = {
    dictCode: undefined,
    dictType: selectedType.value.dictType,
    dictLabel: '',
    dictValue: '',
    dictSort: dataTotal.value + 1,
    listClass: '',
    isDefault: 'N',
    status: '0',
    remark: ''
  }
  dataTitle.value = '新增字典数据'
  dataOpen.value = true
}

/** 修改字典值 */
const handleUpdateData = async (row) => {
  const res = await getData(row.dictCode)
  dataForm.value = res.result || res.data || row
  dataTitle.value = '修改字典数据'
  dataOpen.value = true
}

/** 提交字典值表单 */
const submitDataForm = () => {
  dataFormRef.value.validate(async (valid) => {
    if (valid) {
      if (dataForm.value.dictCode) {
        await updateData(dataForm.value)
        ElMessage.success('修改成功')
      } else {
        await addData(dataForm.value)
        ElMessage.success('新增成功')
      }
      dataOpen.value = false
      getDataList()
    }
  })
}

/** 删除字典值 */
const handleDeleteData = (row) => {
  ElMessageBox.confirm(`是否确认删除字典标签为"${row.dictLabel}"的数据项？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delData(row.dictCode)
    getDataList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleDataSizeChange = (val) => {
  dataQueryParams.value.pageSize = val
  getDataList()
}

const handleDataPageChange = (val) => {
  dataQueryParams.value.pageIndex = val
  getDataList()
}

onMounted(() => {
  getTypeList()
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

.full-height-row {
  height: 100%;
  display: flex;
}

/* 主面板容器 */
.main-card {
  height: 100%;
  min-height: 0;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 卡片标题栏 */
.card-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.selected-tag {
  margin-left: 8px;
  font-weight: normal;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 紧凑搜索栏 */
.mini-search {
  margin-bottom: 8px;
}

:deep(.mini-search .el-form-item) {
  margin-bottom: 8px;
  margin-right: 8px;
}

:deep(.mini-search .el-form-item__label) {
  font-size: 13px;
  color: #606266;
}

.search-input-small {
  width: 130px;
}

.status-select-small {
  width: 100px;
}

.dict-type-code {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #409eff;
}

/* 表格容器控制 */
.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.nebula-modern-table {
  width: 100%;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #f8f8f9 !important;
  color: #515a6e !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  height: 40px !important;
  padding: 4px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 6px 0 !important;
  font-size: 13px;
  color: #606266;
}

:deep(.nebula-modern-table .current-row > td.el-table__cell) {
  background-color: #ecf5ff !important;
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

/* 紧凑版 Table Footer */
.mini-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.footer-info {
  font-size: 12px;
  color: #909399;
}

.empty-holder {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
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
  padding: 10px 0 0 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}

.btn-cancel {
  border-radius: 4px;
}

.tool-btn {
  border-color: #dcdfe6;
  color: #606266;
}
.tool-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}
</style>
