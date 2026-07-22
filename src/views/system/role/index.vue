<template>
  <div class="role-management-container">
    <!-- 页面顶栏标题与描述说明 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">角色管理</h2>
        <p class="page-desc">维护系统角色数据，分配菜单权限与数据范围</p>
      </div>
    </div>

    <!-- 主体单栏布局 -->
    <div class="role-layout">
      <div class="main-card">
        <!-- 综合工具栏 -->
        <div class="toolbar-wrapper">
          <div class="toolbar-left">
            <el-button type="primary" class="btn-create" :icon="Plus" @click="handleAdd">
              新建角色
            </el-button>
            <el-button
              type="danger"
              plain
              class="btn-batch-del"
              :icon="Delete"
              :disabled="selectedRoleIds.length === 0"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedRoleIds.length }})
            </el-button>
          </div>

          <div class="toolbar-right">
            <div class="search-group">
              <el-input
                v-model="queryParams.roleName"
                placeholder="搜索角色名称"
                clearable
                :prefix-icon="Search"
                class="search-input"
                @keyup.enter="handleQuery"
                @clear="handleQuery"
              />
              <el-input
                v-model="queryParams.roleCode"
                placeholder="角色编码"
                clearable
                :prefix-icon="Key"
                class="search-input-sm"
                @keyup.enter="handleQuery"
                @clear="handleQuery"
              />
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
              <el-button type="primary" plain class="btn-search" @click="handleQuery">查询</el-button>
              <el-button class="btn-reset" :icon="Refresh" @click="resetQuery">重置</el-button>
            </div>

            <div class="divider-line"></div>

            <el-tooltip content="刷新表格" placement="top">
              <el-button :icon="RefreshRight" circle class="btn-refresh" @click="getList" />
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
          >
            <el-table-column type="selection" width="50" align="center" />

            <!-- 角色名称 -->
            <el-table-column label="角色名称" min-width="180" :show-overflow-tooltip="true">
              <template #default="scope">
                <div class="role-name-cell">
                  <el-icon class="role-item-icon"><CollectionTag /></el-icon>
                  <span class="role-name-text">{{ scope.row.roleName }}</span>
                </div>
              </template>
            </el-table-column>

            <!-- 角色权限编码 -->
            <el-table-column label="角色编码" min-width="160">
              <template #default="scope">
                <el-tag
                  size="small"
                  :class="getRoleTagClass(scope.row.roleCode)"
                  class="role-tag"
                >
                  <el-icon class="role-icon" v-if="scope.row.roleCode === 'admin'"><Avatar /></el-icon>
                  <el-icon class="role-icon" v-else-if="scope.row.roleCode === 'sys_admin'"><Setting /></el-icon>
                  <el-icon class="role-icon" v-else-if="scope.row.roleCode === 'companion'"><Star /></el-icon>
                  <el-icon class="role-icon" v-else-if="scope.row.roleCode === 'player'"><Trophy /></el-icon>
                  <el-icon class="role-icon" v-else-if="scope.row.roleCode === 'kefu'"><Service /></el-icon>
                  <el-icon class="role-icon" v-else><User /></el-icon>
                  {{ scope.row.roleCode }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 显示顺序 -->
            <el-table-column prop="roleSort" label="显示顺序" width="120" align="center">
              <template #default="scope">
                <span class="sort-text">{{ scope.row.roleSort }}</span>
              </template>
            </el-table-column>

            <!-- 状态列 -->
            <el-table-column prop="status" label="状态" align="center" width="140">
              <template #default="scope">
                <div class="status-switch-box">
                  <el-switch
                    v-model="scope.row.status"
                    active-value="0"
                    inactive-value="1"
                    inline-prompt
                    active-text="启"
                    inactive-text="停"
                    @change="(val) => handleStatusChange(scope.row, val)"
                  />
                  <div v-if="scope.row.status === '0'" class="status-pill status-active">
                    <span class="dot"></span>
                    <span class="label">正常</span>
                  </div>
                  <div v-else class="status-pill status-disabled">
                    <span class="dot"></span>
                    <span class="label">停用</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 创建时间 -->
            <el-table-column prop="createTime" label="创建时间" width="180" align="center">
              <template #default="scope">
                <span class="time-text">{{ formatDate(scope.row.createTime) }}</span>
              </template>
            </el-table-column>

            <!-- 操作栏 -->
            <el-table-column label="操作" align="center" width="180" fixed="right">
              <template #default="scope">
                <div class="action-buttons">
                  <el-tooltip content="编辑" placement="top">
                    <el-button link type="primary" :icon="Edit" class="action-btn-icon edit-btn" @click="handleEdit(scope.row)"></el-button>
                  </el-tooltip>
                  <!-- 数据权限入口可以在这里添加，类似安全设置 -->
                  <el-tooltip content="数据权限" placement="top">
                    <el-button link type="success" :icon="Filter" class="action-btn-icon data-btn" @click="handleDataScope(scope.row)"></el-button>
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button link type="danger" :icon="Delete" class="action-btn-icon del-btn" @click="handleDelete(scope.row)"></el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 表格底部汇总与分页 -->
        <div class="table-footer">
          <div class="footer-info">
            <span>共 {{ totalCount }} 条角色数据</span>
          </div>
          <el-pagination
            v-model:current-page="queryParams.pageIndex"
            v-model:page-size="queryParams.pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :background="true"
            layout="sizes, prev, pager, next, jumper"
            :total="totalCount"
            class="custom-pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
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
      <template #header>
        <div class="dialog-header-title">
          <div class="header-icon-box">
            <el-icon><CollectionTag /></el-icon>
          </div>
          <span>{{ dialogTitle }}</span>
        </div>
      </template>

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
      <template #header>
        <div class="dialog-header-title">
          <div class="header-icon-box warning-box">
            <el-icon><Filter /></el-icon>
          </div>
          <span>分配数据权限</span>
        </div>
      </template>

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
/* 样式复用 User 模块的优秀设计风格 */
.role-management-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.page-header {
  padding: 4px 4px 12px 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.2px;
}

.page-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.role-layout {
  display: flex;
  gap: 16px;
}

.main-card {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 工具栏样式 */
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 180px;
}

.search-input-sm {
  width: 140px;
}

.status-select {
  width: 100px;
}

.divider-line {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
  margin: 0 8px;
}

/* 表格内元素样式 */
.role-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-item-icon {
  font-size: 18px;
  color: #6366f1;
}

.role-name-text {
  font-weight: 600;
  color: #1e293b;
}

.sort-text {
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
}

.time-text {
  color: #64748b;
  font-size: 13px;
}

/* 角色标签样式 */
.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border-radius: 12px;
  font-weight: 500;
  border: none;
}

.role-icon {
  font-size: 14px;
}

.tag-admin { background: #fee2e2; color: #ef4444; }
.tag-sysadmin { background: #fef3c7; color: #f59e0b; }
.tag-companion { background: #e0e7ff; color: #6366f1; }
.tag-player { background: #dcfce7; color: #10b981; }
.tag-kefu { background: #fce7f3; color: #ec4899; }
.tag-default { background: #f1f5f9; color: #64748b; }

/* 状态切换样式 */
.status-switch-box {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status-pill.status-active {
  background-color: #ecfdf5;
  color: #10b981;
}

.status-pill.status-disabled {
  background-color: #fef2f2;
  color: #ef4444;
}

.status-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-pill.status-active .dot {
  background-color: #10b981;
}

.status-pill.status-disabled .dot {
  background-color: #ef4444;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.action-btn-icon {
  padding: 4px 8px;
  height: 28px;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn-icon:hover {
  background-color: #f1f5f9;
}

/* 底部栏 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.footer-info {
  font-size: 13px;
  color: #64748b;
}

/* 对话框与表单 */
.dialog-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.header-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.warning-box {
  background: #fef3c7;
  color: #d97706;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
}

.pwd-reset-tips {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
}

.text-indigo {
  color: #4f46e5;
}
</style>
