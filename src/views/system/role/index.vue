<template>
  <div class="role-management-container">
    <!-- 主体单栏布局 -->
    <div class="main-card">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar" @submit.prevent>
        <el-form-item label="角色名称">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input
            v-model="queryParams.roleCode"
            placeholder="请输入角色编码"
            clearable
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="状态"
            clearable
            @change="handleQuery"
            style="width: 120px;"
          >
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮栏 -->
      <div class="action-bar">
        <el-button v-hasPermi="['system:role:add']" type="primary" @click="handleAdd">新建角色</el-button>
        <el-button v-hasPermi="['system:role:remove']" type="danger" :disabled="selectedRoleIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
        <div class="right-actions">
          <el-tooltip content="刷新表格" placement="top">
            <el-button :icon="RefreshRight" circle @click="getList" />
          </el-tooltip>
        </div>
      </div>

      <!-- 数据表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="roleList"
          row-key="roleId"
          class="nebula-modern-table"
          @selection-change="handleSelectionChange"
          border
          height="100%"
        >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="roleName" label="角色名称" min-width="150" :show-overflow-tooltip="true" />
        <el-table-column prop="roleCode" label="角色编码" min-width="150" :show-overflow-tooltip="true" />
        <el-table-column prop="roleSort" label="显示顺序" width="100" align="center" />
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="{row}">
            <el-switch
              v-model="row.status"
              active-value="0"
              inactive-value="1"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" align="center">
          <template #default="{row}">
            <span>{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{row}">
            <div class="action-links">
              <el-button v-hasPermi="['system:role:edit']" type="primary" link class="action-link" @click="handleEdit(row)">编辑</el-button>
              <el-button v-hasPermi="['system:role:edit']" type="primary" link class="action-link" @click="handleDataScope(row)">数据权限</el-button>
              <el-button v-hasPermi="['system:role:remove']" type="danger" link class="action-link action-link-danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <!-- 表格底部汇总与分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增 / 修改角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="620px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="dialog-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="form.roleName" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="权限字符" prop="roleCode">
              <el-input v-model="form.roleCode" placeholder="请输入权限字符，例如：admin" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="显示顺序" prop="roleSort">
              <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="角色状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <!-- 菜单功能权限分配 -->
          <el-col :span="24">
             <el-form-item label="菜单权限">
                <div class="tree-control-header">
                  <el-checkbox v-model="menuExpandAll" @change="handleMenuExpandAll">展开/折叠</el-checkbox>
                  <el-checkbox v-model="menuNodeAll" @change="handleMenuNodeAll">全选/全不选</el-checkbox>
                  <el-checkbox v-model="menuCheckStrictly">父子联动</el-checkbox>
                </div>
                <div class="tree-wrapper">
                  <el-tree
                    ref="menuRef"
                    :data="menuOptions"
                    show-checkbox
                    node-key="menuId"
                    :check-strictly="!menuCheckStrictly"
                    empty-text="加载中，请稍候"
                    :props="{ label: 'menuName', children: 'children' }"
                  />
                </div>
             </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="btn-submit" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 数据权限分配对话框 -->
    <el-dialog
      v-model="dataScopeVisible"
      title="分配数据权限"
      width="580px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <div class="pwd-reset-tips">
        为角色 <strong class="text-indigo">{{ dataScopeForm.roleName }}</strong> 设置数据范围：
      </div>

      <el-form ref="dataScopeFormRef" :model="dataScopeForm" label-width="90px">
        <el-form-item label="数据范围" prop="dataScope">
          <el-select v-model="dataScopeForm.dataScope" style="width: 100%">
            <el-option label="全部数据权限" value="1" />
            <el-option label="自定数据权限" value="2" />
            <el-option label="本部门数据权限" value="3" />
            <el-option label="本部门及以下数据权限" value="4" />
            <el-option label="仅本人数据权限" value="5" />
          </el-select>
        </el-form-item>

        <!-- 自定数据权限的部门树 -->
        <el-form-item label="数据权限" v-show="dataScopeForm.dataScope === '2'">
          <div class="tree-control-header">
            <el-checkbox v-model="deptExpandAll" @change="handleDeptExpandAll">展开/折叠</el-checkbox>
            <el-checkbox v-model="deptNodeAll" @change="handleDeptNodeAll">全选/全不选</el-checkbox>
            <el-checkbox v-model="deptCheckStrictly">父子联动</el-checkbox>
          </div>
          <div class="tree-wrapper">
            <el-tree
              ref="deptRef"
              :data="deptOptions"
              show-checkbox
              node-key="deptId"
              :check-strictly="!deptCheckStrictly"
              empty-text="加载中，请稍候"
              :props="{ label: 'deptName', children: 'children' }"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="dataScopeVisible = false">取消</el-button>
          <el-button type="primary" class="btn-submit" :loading="dataScopeSubmitLoading" @click="submitDataScope">确定分配</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Plus, RefreshRight, Edit, Delete, CollectionTag, Filter,
  Avatar, Setting, Star, Trophy, Service, User, Key
} from '@element-plus/icons-vue';
import {
  pageRole, getRole, addRole, updateRole, delRole, changeRoleStatus,
  dataScopeRole, getRoleMenuTreeselect, getRoleDeptTreeselect
} from '../../../api/system/role.js';
import { getMenuTree } from '../../../api/system/menu.js';
import { getDeptTree } from '../../../api/system/dept.js';

const loading = ref(false);
const roleList = ref([]);
const totalCount = ref(0);
const selectedRoleIds = ref([]);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref(null);

const dataScopeVisible = ref(false);
const dataScopeSubmitLoading = ref(false);
const dataScopeFormRef = ref(null);

// 菜单树相关
const menuOptions = ref([]);
const menuRef = ref(null);
const menuExpandAll = ref(false);
const menuNodeAll = ref(false);
const menuCheckStrictly = ref(true);

// 部门树相关
const deptOptions = ref([]);
const deptRef = ref(null);
const deptExpandAll = ref(false);
const deptNodeAll = ref(false);
const deptCheckStrictly = ref(true);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  roleName: '',
  roleCode: '',
  status: ''
});

const form = reactive({
  roleId: undefined,
  roleName: '',
  roleCode: '',
  roleSort: 0,
  status: '0',
  menuIds: []
});

const dataScopeForm = reactive({
  roleId: undefined,
  roleName: '',
  dataScope: '1',
  deptIds: []
});

const rules = {
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleCode: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }]
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await pageRole(queryParams);
    const resultData = res.result || res.data || {};
    roleList.value = resultData.list || [];
    totalCount.value = resultData.total || 0;
  } catch (error) {
    console.error('获取角色列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageIndex = 1;
  getList();
};

const resetQuery = () => {
  queryParams.roleName = '';
  queryParams.roleCode = '';
  queryParams.status = '';
  handleQuery();
};

const handleSizeChange = (val) => {
  queryParams.pageSize = val;
  getList();
};

const handleCurrentChange = (val) => {
  queryParams.pageIndex = val;
  getList();
};

const handleSelectionChange = (selection) => {
  selectedRoleIds.value = selection.map(item => item.roleId);
};

const resetForm = () => {
  form.roleId = undefined;
  form.roleName = '';
  form.roleCode = '';
  form.roleSort = 0;
  form.status = '0';
  form.menuIds = [];
  menuExpandAll.value = false;
  menuNodeAll.value = false;
  menuCheckStrictly.value = true;
};

// 获取菜单树
const getMenuTreeselect = async () => {
  try {
    const res = await getMenuTree();
    menuOptions.value = res.result || res.data || [];
  } catch (error) {
    console.error('获取菜单树失败:', error);
  }
};

// 获取部门树
const getDeptTreeselect = async () => {
  try {
    const res = await getDeptTree();
    deptOptions.value = res.result || res.data || [];
  } catch (error) {
    console.error('获取部门树失败:', error);
  }
};

// 获取已勾选菜单
const getMenuAllCheckedKeys = () => {
  if (!menuRef.value) return [];
  const checkedKeys = menuRef.value.getCheckedKeys();
  const halfCheckedKeys = menuRef.value.getHalfCheckedKeys();
  return [...checkedKeys, ...halfCheckedKeys];
};

// 获取已勾选部门
const getDeptAllCheckedKeys = () => {
  if (!deptRef.value) return [];
  const checkedKeys = deptRef.value.getCheckedKeys();
  const halfCheckedKeys = deptRef.value.getHalfCheckedKeys();
  return [...checkedKeys, ...halfCheckedKeys];
};

const handleMenuExpandAll = (val) => {
  if (!menuRef.value) return;
  const nodes = menuRef.value.store._getAllNodes();
  nodes.forEach(node => node.expanded = val);
};

const handleMenuNodeAll = (val) => {
  if (!menuRef.value) return;
  menuRef.value.setCheckedNodes(val ? menuOptions.value : []);
};

const handleDeptExpandAll = (val) => {
  if (!deptRef.value) return;
  const nodes = deptRef.value.store._getAllNodes();
  nodes.forEach(node => node.expanded = val);
};

const handleDeptNodeAll = (val) => {
  if (!deptRef.value) return;
  deptRef.value.setCheckedNodes(val ? deptOptions.value : []);
};

const handleAdd = async () => {
  resetForm();
  await getMenuTreeselect();
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  resetForm();
  await getMenuTreeselect();
  try {
    const res = await getRole(row.roleId);
    const data = res.result || res.data || row;
    Object.assign(form, data);
    dialogTitle.value = '修改角色';
    dialogVisible.value = true;
    
    // 设置绑定的菜单勾选
    const menuRes = await getRoleMenuTreeselect(row.roleId);
    const checkedMenuIds = menuRes.result || menuRes.data || [];
    nextTick(() => {
      if (menuRef.value) {
        checkedMenuIds.forEach(id => {
          menuRef.value.setChecked(id, true, false);
        });
      }
    });
  } catch (error) {
    console.error('获取角色详情失败:', error);
  }
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      form.menuIds = getMenuAllCheckedKeys();
      if (form.roleId) {
        await updateRole(form);
        ElMessage.success('修改成功');
      } else {
        await addRole(form);
        ElMessage.success('新增成功');
      }
      dialogVisible.value = false;
      getList();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDataScope = async (row) => {
  dataScopeForm.roleId = row.roleId;
  dataScopeForm.roleName = row.roleName;
  dataScopeForm.dataScope = row.dataScope || '1';
  dataScopeForm.deptIds = [];
  deptExpandAll.value = false;
  deptNodeAll.value = false;
  deptCheckStrictly.value = true;

  await getDeptTreeselect();
  
  try {
    const deptRes = await getRoleDeptTreeselect(row.roleId);
    const checkedDeptIds = deptRes.result || deptRes.data || [];
    dataScopeVisible.value = true;
    nextTick(() => {
      if (deptRef.value) {
        checkedDeptIds.forEach(id => {
          deptRef.value.setChecked(id, true, false);
        });
      }
    });
  } catch (error) {
    console.error('获取角色部门数据失败:', error);
  }
};

const submitDataScope = async () => {
  dataScopeSubmitLoading.value = true;
  try {
    dataScopeForm.deptIds = dataScopeForm.dataScope === '2' ? getDeptAllCheckedKeys() : [];
    await dataScopeRole(dataScopeForm);
    ElMessage.success('分配数据权限成功');
    dataScopeVisible.value = false;
    getList();
  } catch (error) {
    console.error('分配数据权限失败:', error);
  } finally {
    dataScopeSubmitLoading.value = false;
  }
};

const handleStatusChange = async (row, val) => {
  try {
    await changeRoleStatus(row.roleId, val);
    ElMessage.success(`角色 ${row.roleName} 状态变更成功`);
  } catch (error) {
    row.status = val === '0' ? '1' : '0';
    console.error('状态修改失败:', error);
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色 "${row.roleName}" 的数据吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delRole(row.roleId);
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
};

const handleBatchDelete = () => {
  if (!selectedRoleIds.value.length) return;
  ElMessageBox.confirm(`确定要批量删除选中的 ${selectedRoleIds.value.length} 个角色吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delRole(selectedRoleIds.value.join(','));
    ElMessage.success('批量删除成功');
    getList();
  }).catch(() => {});
};

const getRoleTagClass = (roleCode) => {
  if (!roleCode) return 'tag-default';
  const code = roleCode.toLowerCase();
  if (code === 'admin') return 'tag-admin';
  if (code === 'sys_admin') return 'tag-sysadmin';
  if (code === 'companion') return 'tag-companion';
  if (code === 'player') return 'tag-player';
  if (code === 'kefu') return 'tag-kefu';
  return 'tag-default';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.role-management-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
  font-size: 16px;
}

.main-card {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 16px;
}
:deep(.search-bar .el-form-item) {
  margin-bottom: 0;
  margin-right: 16px;
}
:deep(.search-bar .el-form-item__label) {
  font-size: 16px;
}
:deep(.search-bar .el-input__inner),
:deep(.search-bar .el-select .el-input__inner),
:deep(.search-bar .el-button) {
  font-size: 16px;
  border-radius: 4px;
}

/* 操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.right-actions {
  margin-left: auto;
}
:deep(.action-bar .el-button) {
  border-radius: 4px;
  font-size: 16px;
}

/* 表格与操作列 */
.table-wrapper {
  flex: 1;
  min-height: 0;
}

/* 表格与操作列 */
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

.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.action-link {
  font-size: 16px;
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
:deep(.pagination-container),
:deep(.pagination-container button),
:deep(.pagination-container span),
:deep(.pagination-container li),
:deep(.pagination-container input) {
  font-size: 15px !important;
}

/* Dialog */
:deep(.el-dialog) {
  border-radius: 4px;
  font-size: 16px;
}
:deep(.el-dialog__header) {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
}
:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}
:deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
  font-size: 16px;
}
:deep(.dialog-form .el-input__inner),
:deep(.dialog-form .el-radio__label),
:deep(.dialog-form .el-tree) {
  font-size: 16px;
}
:deep(.dialog-footer .el-button) {
  font-size: 16px;
}
.el-button {
  border-radius: 4px;
  font-size: 16px;
}

.pwd-reset-tips {
  margin-bottom: 16px;
  color: #606266;
  font-size: 16px;
}

.text-indigo {
  color: #409eff;
}

/* 树形组件相关样式 */
.tree-control-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 16px;
}
:deep(.tree-control-header .el-checkbox__label) {
  font-size: 16px;
}
.tree-wrapper {
  width: 100%;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 12px;
  background-color: #fafafa;
}
</style>
