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
        <el-button type="primary" @click="handleAdd">新建角色</el-button>
        <el-button type="danger" :disabled="selectedRoleIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
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
              <el-button type="primary" link class="action-link" @click="handleEdit(row)">编辑</el-button>
              <el-button type="primary" link class="action-link" @click="handleDataScope(row)">数据权限</el-button>
              <el-button type="danger" link class="action-link action-link-danger" @click="handleDelete(row)">删除</el-button>
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
      width="580px"
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
          
          <!-- 菜单权限分配 (留位) -->
          <el-col :span="24" v-if="false">
             <el-form-item label="菜单权限">
                <!-- el-tree -->
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
      width="540px"
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
        <!-- 暂时隐藏自定数据权限的部门树，后续完善 -->
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Plus, RefreshRight, Edit, Delete, CollectionTag, Filter,
  Avatar, Setting, Star, Trophy, Service, User, Key
} from '@element-plus/icons-vue';
import {
  pageRole, getRole, addRole, updateRole, delRole, changeRoleStatus
} from '../../../api/system/role.js';

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
  status: '0'
});

const dataScopeForm = reactive({
  roleId: undefined,
  roleName: '',
  dataScope: '1'
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
};

const handleAdd = () => {
  resetForm();
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  resetForm();
  try {
    const res = await getRole(row.roleId);
    const data = res.result || res.data || row;
    Object.assign(form, data);
    dialogTitle.value = '修改角色';
    dialogVisible.value = true;
  } catch (error) {
    console.error('获取角色详情失败:', error);
  }
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
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
  try {
    const res = await getRole(row.roleId);
    const data = res.result || res.data || row;
    dataScopeForm.roleId = data.roleId;
    dataScopeForm.roleName = data.roleName;
    dataScopeForm.dataScope = data.dataScope || '1';
    dataScopeVisible.value = true;
  } catch (error) {
    console.error('获取角色详情失败:', error);
  }
};

const submitDataScope = async () => {
  dataScopeSubmitLoading.value = true;
  try {
    await updateRole({
       roleId: dataScopeForm.roleId,
       dataScope: dataScopeForm.dataScope
    });
    ElMessage.success('分配数据权限成功');
    dataScopeVisible.value = false;
    getList();
  } catch (error) {
    console.error('提交失败:', error);
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
:deep(.search-bar .el-button) {
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
}

/* 表格与操作列 */
.table-wrapper {
  flex: 1;
  min-height: 0;
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
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}
.el-button {
  border-radius: 4px;
}

.pwd-reset-tips {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.text-indigo {
  color: #409eff;
}
</style>
