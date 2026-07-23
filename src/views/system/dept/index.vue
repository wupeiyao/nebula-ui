<template>
  <div class="dept-page">
    <!-- 主区域 -->
    <div class="dept-layout">
      <!-- 左侧：部门架构树 -->
      <div class="dept-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title">组织列表</div>
        </div>
        <div class="sidebar-search">
          <el-input
            v-model="queryParams.deptName"
            placeholder="请输入内容"
            clearable
            @input="handleQuery"
          >
            <template #suffix>
              <el-icon><Search/></el-icon>
            </template>
          </el-input>
        </div>
        <div class="sidebar-tree">
          <el-tree
              ref="treeRef"
              :data="deptTree"
              node-key="deptId"
              :props="{ label:'deptName', children:'children' }"
              :default-expand-all="isExpandAll"
              highlight-current
              :expand-on-click-node="false"
              @node-click="handleNodeClick"
          >
            <template #default="{node,data}">
              <div class="tree-node" :class="{ active:selectedDept?.deptId===data.deptId }">
                <span class="dept-name">{{data.deptName}}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：详情面板 -->
      <div class="dept-main">
        <div class="main-header">
<!--          <div class="selected-dept-name">{{ selectedDept?.deptName || '顶级部门' }}</div>-->
          <div class="tabs-header">
            <span class="tab-item active">下级部门列表</span>
          </div>
        </div>
        
        <div class="main-content">
          <!-- 工具栏 -->
          <div class="toolbar">
            <el-form :inline="true" class="search-form" @submit.prevent>
              <el-form-item>
                <el-input
                  v-model="pageParams.deptName"
                  placeholder="查询关键字"
                  clearable
                  @keyup.enter="handlePageQuery"
                  @clear="handlePageQuery"
                >
                  <template #suffix><el-icon><Search/></el-icon></template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handlePageQuery">查询</el-button>
                <el-button @click="pageParams.deptName=''; handlePageQuery()">重置</el-button>
                <el-button type="primary" @click="handleAdd(selectedDept)">新增下级</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 表格 -->
          <el-table 
            :data="subDeptList" 
            v-loading="tableLoading" 
            style="width: 100%;" 
            class="nebula-modern-table"
            row-key="deptId"
            border
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="deptName" label="部门名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="leader" label="负责人" width="120" show-overflow-tooltip />
            <el-table-column prop="phone" label="联系电话" width="140" align="center" />
            <el-table-column prop="orderNum" label="排序" width="80" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{row}">
                <span v-if="row.status === '0'" class="status-plain active-status">正常</span>
                <span v-else class="status-plain disabled-status">停用</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{row}">
                <div class="action-links">
                  <el-button type="primary" link class="action-link" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="primary" link class="action-link" @click="handleAdd(row)">新增</el-button>
                  <el-button type="danger" link class="action-link action-link-danger" @click="handleDelete(row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
                v-model:current-page="pageParams.pageIndex"
                v-model:page-size="pageParams.pageSize"
                :page-sizes="[10, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="totalCount"
                @size-change="handlePageQuery"
                @current-change="handlePageQuery"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- 弹窗保持你的原逻辑 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="620px"
        destroy-on-close
    >
      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="90px"
      >
        <el-form-item
            label="上级部门"
            prop="parentId"
        >
          <el-tree-select
              v-model="form.parentId"
              :data="deptOptions"
              :props="{
              value:'deptId',
              label:'deptName',
              children:'children'
            }"
              check-strictly
              style="width:100%"
          />
        </el-form-item>
        <el-form-item
            label="部门名称"
            prop="deptName"
        >
          <el-input
              v-model="form.deptName"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input
              v-model="form.leader"
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
              v-model="form.phone"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
              v-model="form.email"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">
              正常
            </el-radio>
            <el-radio value="1">
              停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">
          取消
        </el-button>
        <el-button
            type="primary"
            @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import {
  ref,
  reactive,
  onMounted,
  nextTick
} from 'vue'
import {
  ElMessage,
  ElMessageBox
} from 'element-plus'
import {
  Plus,
  Search,
  ArrowDown,
  ArrowRight,
  OfficeBuilding,
  FolderOpened,
  Document
} from '@element-plus/icons-vue'
import {
  listDept,
  getDept,
  addDept,
  updateDept,
  delDept,
  changeDeptStatus,
  pageDept
} from '../../../api/system/dept.js'
/**
 * =========================
 * 基础数据
 * =========================
 */
const loading = ref(false)
const rawList = ref([])
const deptTree = ref([])
const deptOptions = ref([])
const treeRef = ref(null)
const selectedDept = ref(null)
const isExpandAll = ref(true)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)

const tableLoading = ref(false)
const subDeptList = ref([])
const totalCount = ref(0)
const pageParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  deptName: '',
  treeDeptId: ''
})
/**
 * 查询
 */
const queryParams = reactive({
  deptName:'',
  status:''
})
/**
 * 表单
 */
const form = reactive({
  deptId:null,
  parentId:'0',
  deptName:'',
  orderNum:0,
  leader:'',
  phone:'',
  email:'',
  status:'0'
})
const rules = {
  parentId:[
    {
      required:true,
      message:'请选择上级部门',
      trigger:'change'
    }
  ],
  deptName:[
    {
      required:true,
      message:'请输入部门名称',
      trigger:'blur'
    }
  ]
}
/**
 * =========================
 * 构造树
 * =========================
 */
const handleTree = (
    list,
    id='deptId',
    parent='parentId'
)=>{
  const result=[]
  const map={}
  list.forEach(item=>{
    map[item[id]]={
      ...item,
      children:[]
    }
  })
  list.forEach(item=>{
    const node=map[item[id]]
    if(
        map[item[parent]]
        &&
        item[parent]!=='0'
    ){
      map[item[parent]]
          .children
          .push(node)
    }
    else{
      result.push(node)
    }
  })
  return result
}
/**
 * =========================
 * 获取列表
 * =========================
 */
const getList = async()=>{
  loading.value=true
  try{
    const res=await listDept(queryParams)
    const list=res.result || res.data || []
    rawList.value=list
    deptTree.value=handleTree(list)
    deptOptions.value=[
      {
        deptId:'0',
        deptName:'顶级部门',
        children:deptTree.value
      }
    ]
    // 保留选中
    if(selectedDept.value){
      const dept=list.find(
          item=>item.deptId===selectedDept.value.deptId
      )
      selectedDept.value=dept
    }
  }
  catch(error){
    console.error(error)
    ElMessage.error(
        '获取部门数据失败'
    )
  }
  finally{
    loading.value=false
  }
}
/**
 * =========================
 * 点击树节点
 * =========================
 */
const handleNodeClick=(data)=>{
  selectedDept.value=data
  pageParams.pageIndex = 1
  pageParams.treeDeptId = data.deptId
  handlePageQuery()
}

/**
 * 分页查询子部门列表
 */
const handlePageQuery = async () => {
  tableLoading.value = true
  try {
    const res = await pageDept(pageParams)
    const resultData = res.result || res.data || {}
    subDeptList.value = resultData.list || []
    totalCount.value = resultData.total || 0
  } catch (error) {
    console.error('获取子部门列表失败:', error)
  } finally {
    tableLoading.value = false
  }
}
/**
 * 获取父部门名称
 */
const getParentName=(id)=>{
  if(!id || id==='0'){
    return '顶级部门'
  }
  const item=rawList.value.find(
      i=>i.deptId===id
  )
  return item
      ?
      item.deptName
      :
      '-'
}
/**
 * 展开收起
 */
const toggleExpandAll=()=>{
  isExpandAll.value=
      !isExpandAll.value
  nextTick(()=>{
    const nodes =
        treeRef.value.store._getAllNodes()
    nodes.forEach(node=>{
      node.expanded=isExpandAll.value
    })
  })
}
/**
 * =========================
 * 新增
 * =========================
 */
const resetForm=()=>{
  form.deptId=null
  form.parentId='0'
  form.deptName=''
  form.orderNum=0
  form.leader=''
  form.phone=''
  form.email=''
  form.status='0'
}
const handleAdd=(row)=>{
  resetForm()
  if(row){
    form.parentId=row.deptId
  }
  dialogTitle.value='新增部门'
  dialogVisible.value=true
}
/**
 * 修改
 */
const handleEdit=async(row)=>{
  resetForm()
  try{
    const res=
        await getDept(row.deptId)
    const data=
        res.result || res.data || row
    Object.assign(
        form,
        data
    )
    dialogTitle.value='修改部门'
    dialogVisible.value=true
  }
  catch(e){
    console.error(e)
  }
}
/**
 * 提交
 */
const submitForm=()=>{
  formRef.value.validate(
      async(valid)=>{
        if(!valid)
          return
        try{
          if(form.deptId){
            await updateDept(form)
            ElMessage.success(
                '修改成功'
            )
          }
          else{
            await addDept(form)
            ElMessage.success(
                '新增成功'
            )
          }
          dialogVisible.value=false
          getList()
          handlePageQuery()
        }
        catch(error){
          console.error(error)
        }
      }
  )
}
/**
 * 删除
 */
const handleDelete=(row)=>{
  if(
      row.children
      &&
      row.children.length
  ){
    ElMessage.warning(
        '存在下级部门，不能删除'
    )
    return
  }
  ElMessageBox.confirm(
      `确定删除 ${row.deptName} 吗？`,
      '提示',
      {
        type:'warning'
      }
  )
      .then(async()=>{
        await delDept(
            row.deptId
        )
        ElMessage.success(
            '删除成功'
        )
        selectedDept.value=null
        getList()
        handlePageQuery()
      })
}
/**
 * 查询
 */
const handleQuery=()=>{
  getList()
}
/**
 * 生命周期
 */
onMounted(()=>{
  getList()
  handlePageQuery()
})
</script>
<style scoped>
.dept-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

.dept-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* 左侧 Sidebar */
.dept-sidebar {
  width: 260px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.sidebar-title {
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
}

.sidebar-search {
  padding: 12px 16px;
}

:deep(.sidebar-search .el-input__wrapper) {
  border-radius: 4px;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 16px;
}

:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

.tree-node {
  width: 100%;
  display: flex;
  align-items: center;
}

.dept-name {
  font-size: 14px;
  color: #303133;
}

.tree-node.active .dept-name {
  color: #409eff;
}

/* 覆盖 el-tree 的高亮背景，截图里似乎没有明显的背景高亮 */
:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: transparent !important;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa !important;
}

/* 右侧 Main Panel */
.dept-main {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  min-width: 0;
}

.main-header {
  padding: 16px 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.selected-dept-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.tabs-header {
  display: flex;
}

.tab-item {
  padding: 8px 0;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-right: 24px;
}

.tab-item.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.main-content {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* Toolbar */
.toolbar {
  margin-bottom: 16px;
}
.search-form {
  display: flex;
  align-items: center;
}
:deep(.search-form .el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}
:deep(.search-form .el-button) {
  border-radius: 4px;
}

/* 表格与操作列 */
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

.status-plain {
  font-size: 12px;
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* Dialog */
:deep(.el-dialog) {
  border-radius: 4px;
}
:deep(.el-dialog__header) {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
}
:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}
:deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}
.el-button {
  border-radius: 4px;
}
</style>
