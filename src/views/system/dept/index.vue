<template>
  <div class="dept-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2>部门管理</h2>
        <p>维护企业组织架构、部门信息以及上下级关系</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd()">
          <el-icon><Plus /></el-icon>
          新建部门
        </el-button>
        <el-button @click="toggleExpandAll">
          <el-icon>
            <component :is="isExpandAll ? ArrowDown : ArrowRight"/>
          </el-icon>
          {{isExpandAll ? '全部收起':'全部展开'}}
        </el-button>
      </div>
    </div>
    <!-- 主区域 -->
    <div class="dept-content">
      <!-- 左侧组织树 -->
      <div class="tree-panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon>
              <OfficeBuilding/>
            </el-icon>
            <span>
              组织架构
            </span>
          </div>
          <el-input
              v-model="queryParams.deptName"
              placeholder="搜索部门"
              clearable
              size="small"
              @input="handleQuery"
          >
            <template #prefix>
              <el-icon>
                <Search/>
              </el-icon>
            </template>
          </el-input>
        </div>
        <!-- 真正树结构 -->
        <div class="organization-tree">
          <el-tree
              ref="treeRef"
              :data="deptTree"
              node-key="deptId"
              :props="{
              label:'deptName',
              children:'children'
            }"
              :default-expand-all="isExpandAll"
              highlight-current
              :expand-on-click-node="false"
              @node-click="handleNodeClick"
          >
            <template #default="{node,data}">
              <div
                  class="tree-node"
                  :class="{
                  active:selectedDept?.deptId===data.deptId
                }"
              >
                <div class="node-left">
                  <div class="dept-icon">
                    <el-icon v-if="data.children && data.children.length">
                      <FolderOpened/>
                    </el-icon>
                    <el-icon v-else>
                      <Document/>
                    </el-icon>
                  </div>
                  <span class="dept-name">
                    {{data.deptName}}
                  </span>
                </div>
                <div class="node-right">
                  <el-tag
                      size="small"
                      :type="data.status==='0'?'success':'danger'"
                  >
                    {{
                      data.status==='0'
                          ?
                          '正常'
                          :
                          '停用'
                    }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </div>
      <!-- 右侧子部门列表 -->
      <div class="detail-panel">
        <div class="list-toolbar" style="display: flex; margin-bottom: 16px; align-items: center;">
          <el-button
              type="success"
              @click="handleAdd(selectedDept)"
              :disabled="!selectedDept"
          >
            <el-icon><Plus /></el-icon>
            新增下级
          </el-button>
          
          <div style="flex:1"></div>
          
          <el-input
              v-model="pageParams.deptName"
              placeholder="搜索子部门"
              clearable
              size="small"
              style="width: 200px"
              @keyup.enter="handlePageQuery"
              @clear="handlePageQuery"
          >
            <template #prefix>
              <el-icon><Search/></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="small" style="margin-left: 10px" @click="handlePageQuery">搜索</el-button>
        </div>

        <el-table :data="subDeptList" v-loading="tableLoading" style="width: 100%;" class="sub-dept-table" row-key="deptId">
          <el-table-column prop="deptName" label="部门名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="leader" label="负责人" width="120" show-overflow-tooltip />
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column prop="orderNum" label="排序" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{row}">
              <el-tag :type="row.status === '0' ? 'success' : 'danger'">
                {{ row.status === '0' ? '正常' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{row}">
              <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button type="primary" link @click="handleAdd(row)">新增</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
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
  parentId: ''
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
  pageParams.parentId = data.deptId
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
/* =========================
   页面整体
========================= */
.dept-page {
  width:100%;
  min-height:100%;
  background:#f6f8fc;
  padding:24px;
  box-sizing:border-box;
}
/* =========================
   顶部标题
========================= */
.page-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:20px;
}
.page-header h2 {
  margin:0;
  font-size:24px;
  font-weight:700;
  color:#111827;
}
.page-header p {
  margin-top:8px;
  color:#64748b;
  font-size:14px;
}
.header-actions {
  display:flex;
  gap:12px;
}
/* =========================
   主内容布局
========================= */
.dept-content {
  display:flex;
  gap:20px;
  height:calc(100vh - 170px);
}
/* =========================
   左侧树
========================= */
.tree-panel {
  width:380px;
  background:white;
  border-radius:16px;
  box-shadow:
      0 8px 30px rgba(15,23,42,.06);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.panel-header {
  padding:18px;
  border-bottom:1px solid #eef2f7;
}
.panel-title {
  display:flex;
  align-items:center;
  gap:8px;
  font-size:16px;
  font-weight:600;
  margin-bottom:14px;
  color:#1e293b;
}
.organization-tree {
  flex:1;
  overflow:auto;
  padding:16px;
}
/* =========================
   Tree样式覆盖
========================= */
:deep(.el-tree) {
  background:transparent;
  color:#334155;
}
:deep(.el-tree-node__content) {
  height:auto;
  padding:0;
  margin-bottom:8px;
}
:deep(.el-tree-node__expand-icon) {
  color:#94a3b8;
  font-size:16px;
}
.tree-node {
  width:100%;
  height:46px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:0 12px;
  border-radius:10px;
  transition:.25s;
  cursor:pointer;
}
.tree-node:hover {
  background:#f1f5ff;
  transform:translateX(3px);
}
.tree-node.active {
  background:
      linear-gradient(
          135deg,
          #eef2ff,
          #dbeafe
      );
}
.node-left {
  display:flex;
  align-items:center;
  gap:10px;
}
.dept-icon {
  width:32px;
  height:32px;
  border-radius:8px;
  display:flex;
  justify-content:center;
  align-items:center;
  background:#eef2ff;
  color:#6366f1;
}
.dept-name {
  font-size:14px;
  font-weight:500;
  color:#334155;
}
.node-right {
  display:flex;
  align-items:center;
}
/* =========================
   右侧详情
========================= */
.detail-panel {
  flex:1;
  background:white;
  border-radius:16px;
  box-shadow:
      0 8px 30px rgba(15,23,42,.06);
  padding:24px;
  overflow:auto;
}
.detail-card {
  animation:fade .25s ease;
}
@keyframes fade {
  from {
    opacity:0;
    transform:translateY(10px);
  }
  to {
    opacity:1;
    transform:none;
  }
}
.detail-title {
  display:flex;
  align-items:center;
  gap:16px;
  padding-bottom:22px;
  border-bottom:1px solid #eef2f7;
}
.big-icon {
  width:56px;
  height:56px;
  border-radius:14px;
  display:flex;
  justify-content:center;
  align-items:center;
  background:
      linear-gradient(
          135deg,
          #6366f1,
          #3b82f6
      );
  color:white;
  font-size:26px;
}
.detail-title h3 {
  margin:0;
  font-size:22px;
  color:#111827;
}
.detail-title span {
  display:block;
  margin-top:6px;
  font-size:13px;
  color:#94a3b8;
}
/* =========================
   信息列表
========================= */
.info-list {
  margin-top:24px;
}
.info-item {
  display:flex;
  align-items:center;
  padding:14px 0;
  border-bottom:1px dashed #e5e7eb;
}
.info-item label {
  width:120px;
  color:#64748b;
}
.info-item span {
  color:#1e293b;
  font-weight:500;
}
/* =========================
   操作按钮
========================= */
.detail-actions {
  margin-top:30px;
  display:flex;
  gap:12px;
}
/* =========================
   空状态
========================= */
.empty-detail {
  height:100%;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  color:#94a3b8;
}
.empty-detail .el-icon {
  font-size:60px;
  margin-bottom:20px;
}
/* =========================
   Dialog优化
========================= */
:deep(.el-dialog) {
  border-radius:16px;
}
:deep(.el-dialog__header) {
  font-size:18px;
  font-weight:700;
}
:deep(.el-form-item__label) {
  color:#475569;
  font-weight:500;
}
/* =========================
   滚动条
========================= */
::-webkit-scrollbar {
  width:6px;
}
::-webkit-scrollbar-thumb {
  background:#cbd5e1;
  border-radius:10px;
}
</style>
