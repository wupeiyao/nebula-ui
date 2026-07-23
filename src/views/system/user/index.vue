<template>
  <div class="user-management-container">
    <!-- 主体双栏布局 -->
    <div class="user-layout">
      <!-- 左侧：部门架构树 Sidebar -->
      <div class="dept-card">
        <div class="dept-search">
          <el-input
            v-model="deptSearchKey"
            placeholder="请输入查询条件"
            clearable
            :suffix-icon="Search"
            class="dept-search-input"
          />
        </div>

        <div class="dept-tree-wrapper" v-loading="deptLoading">
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="deptId"
            :expand-on-click-node="false"
            :filter-node-method="filterDeptNode"
            default-expand-all
            highlight-current
            class="nebula-dept-tree"
            @node-click="handleDeptNodeClick"
          />
        </div>
      </div>

      <!-- 右侧：用户表格与操作 Panel -->
      <div class="main-card">
<!--        <div class="current-selected">-->
<!--          <span>当前选中：</span>-->
<!--          <span class="selected-dept-name">{{ selectedDeptName }}</span>-->
<!--        </div>-->
        <!-- 综合工具栏 -->
        <div class="toolbar-wrapper">
          <el-input
            v-model="queryParams.username"
            placeholder="用户名/真实姓名/工号"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
          <el-button type="primary" class="toolbar-btn" @click="handleQuery">查询</el-button>
<!--          <el-button type="primary" class="toolbar-btn">查看权限集合</el-button>-->
          <el-button type="primary" class="toolbar-btn" @click="handleAdd">新增</el-button>
<!--          <el-button type="primary" class="toolbar-btn">同步</el-button>-->
<!--          <el-button type="primary" class="toolbar-btn btn-batch" :disabled="selectedUserIds.length === 0">批量分配用户</el-button>-->
        </div>

        <!-- 数据表格展示区域 -->
        <div class="table-wrapper">
          <el-table
            v-loading="loading"
            :data="userList"
            row-key="userId"
            class="nebula-modern-table"
            @selection-change="handleSelectionChange"
            border
            height="100%"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center" />
            
            <el-table-column prop="username" label="用户名" min-width="120" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="nickname" label="用户昵称" min-width="120" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="username" label="用户编码(工号)" min-width="130" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="userId" label="用户工牌号" min-width="110" align="center" />
            <el-table-column prop="deptName" label="所属组织" min-width="120" align="center" :show-overflow-tooltip="true" />
            
            <el-table-column prop="status" label="是否启用" align="center" width="90">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.isEnabled"
                  @change="(val) => handleStatusChange(scope.row, val)"
                />
              </template>
            </el-table-column>

            <el-table-column label="操作" align="center" width="280" fixed="right">
              <template #default="scope">
                <div class="action-links">
                  <el-button link type="primary" class="action-link" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button link type="primary" class="action-link" @click="handleResetPwd(scope.row)">重置</el-button>
<!--                  <el-button link type="primary" class="action-link">角色分配</el-button>-->
<!--                  <el-button link type="primary" class="action-link">数据权限分配</el-button>-->
                  <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 表格底部汇总与分页 -->
        <div class="table-footer">
          <div class="footer-info">
            <span>共 {{ totalCount }} 条用户数据</span>
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

    <!-- 新增 / 修改用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="680px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <div class="header-icon-box">
            <el-icon><User /></el-icon>
          </div>
          <span>{{ dialogTitle }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="dialog-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入登录用户名" :disabled="!!form.userId" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="请输入显示昵称" />
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="!form.userId">
            <el-form-item label="登录密码" prop="password">
              <el-input v-model="form.password" type="password" show-password :prefix-icon="Lock" placeholder="请输入登录密码" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="rawDeptList"
                :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
                value-key="deptId"
                placeholder="请选择归属部门"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号码" prop="mobile">
              <el-input v-model="form.mobile" :prefix-icon="Cellphone" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="form.email" :prefix-icon="Message" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="角色分配" prop="roleIds">
              <el-select
                v-model="form.roleIds"
                multiple
                placeholder="请选择分配的角色"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="role in allRoleOptions"
                  :key="role.roleId"
                  :label="role.roleName"
                  :value="role.roleId"
                >
                  <div class="role-option-item">
                    <span style="display: flex; align-items: center;">
                      <el-icon class="role-icon mr-1"><Avatar v-if="role.roleCode==='admin'"/><Setting v-else-if="role.roleCode==='sys_admin'"/><Star v-else-if="role.roleCode==='companion'"/><Trophy v-else-if="role.roleCode==='player'"/><Service v-else-if="role.roleCode==='kefu'"/><User v-else/></el-icon>
                      {{ role.roleName }}
                    </span>
                    <span class="role-code-desc">({{ role.roleCode }})</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="账号状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch v-model="form.isEnabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="头像地址">
              <el-input v-model="form.avatarUrl" placeholder="头像 URL 地址 (留空使用默认头像)">
                <template #append v-if="form.avatarUrl">
                  <el-avatar :size="24" :src="form.avatarUrl" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注说明">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
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

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="重置密码"
      width="440px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <div class="header-icon-box warning-box">
            <el-icon><Key /></el-icon>
          </div>
          <span>重置密码</span>
        </div>
      </template>

      <div class="pwd-reset-tips">
        为账号 <strong class="text-indigo">{{ resetUserTarget?.username }}</strong> 设置新的登录密码：
      </div>

      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="pwdForm.password" type="password" show-password :prefix-icon="Lock" placeholder="请输入新密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" class="btn-submit" :loading="pwdSubmitLoading" @click="submitResetPwd">确定重置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Plus, RefreshRight, Edit, Delete, OfficeBuilding, Key, User, Folder, Document,
  Avatar, Setting, Star, Trophy, Service, Cellphone, Message, Lock
} from '@element-plus/icons-vue';
import {
  listUser, getUser, addUser, updateUser, changeUserStatus, resetUserPwd, delUser
} from '../../../api/system/user.js';
import { listRole } from '../../../api/system/role.js';
import { listDept } from '../../../api/system/dept.js';

const loading = ref(false);
const deptLoading = ref(false);
const userList = ref([]);
const totalCount = ref(0);
const selectedUserIds = ref([]);
const selectedDeptName = ref('');

const deptSearchKey = ref('');
const deptTreeRef = ref(null);
const deptOptions = ref([]);
const rawDeptList = ref([]);
const allRoleOptions = ref([]);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref(null);

const pwdDialogVisible = ref(false);
const pwdSubmitLoading = ref(false);
const pwdFormRef = ref(null);
const resetUserTarget = ref(null);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  username: '',
  mobile: '',
  status: '',
  deptId: ''
});

const form = reactive({
  userId: undefined,
  username: '',
  nickname: '',
  password: '',
  deptId: undefined,
  mobile: '',
  email: '',
  avatarUrl: '',
  status: '0',
  isEnabled: true,
  roleIds: [],
  remark: ''
});

const pwdForm = reactive({
  password: ''
});

const rules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
};

const pwdRules = {
  password: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
};

watch(deptSearchKey, (val) => {
  if (deptTreeRef.value) {
    deptTreeRef.value.filter(val);
  }
});

const filterDeptNode = (value, data) => {
  if (!value) return true;
  return data.deptName.includes(value);
};

const buildDeptTree = (list) => {
  if (!list || !list.length) return [];
  const map = {};
  const tree = [];
  list.forEach(item => {
    map[item.deptId] = { ...item, children: [] };
  });
  list.forEach(item => {
    if (item.parentId && item.parentId !== '0' && map[item.parentId]) {
      map[item.parentId].children.push(map[item.deptId]);
    } else {
      tree.push(map[item.deptId]);
    }
  });
  return tree;
};

const getDeptTree = async () => {
  deptLoading.value = true;
  try {
    const res = await listDept();
    const list = res.result || res.data || [];
    const treeData = buildDeptTree(list);
    rawDeptList.value = treeData;
    deptOptions.value = [
      {
        deptId: '',
        deptName: '全部部门',
        children: treeData
      }
    ];
  } catch (error) {
    console.error('获取部门树失败:', error);
  } finally {
    deptLoading.value = false;
  }
};

const getRoleOptions = async () => {
  try {
    const res = await listRole();
    allRoleOptions.value = res.result || res.data || [];
  } catch (error) {
    console.error('获取角色列表失败:', error);
  }
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listUser(queryParams);
    const resultData = res.result || res.data || {};
    userList.value = resultData.list || [];
    totalCount.value = resultData.total || 0;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleDeptNodeClick = (data) => {
  queryParams.deptId = data.deptId || '';
  selectedDeptName.value = data.deptName || '';
  handleQuery();
};

const handleQuery = () => {
  queryParams.pageIndex = 1;
  getList();
};

const resetQuery = () => {
  queryParams.username = '';
  queryParams.mobile = '';
  queryParams.status = '';
  queryParams.deptId = '';
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
  selectedUserIds.value = selection.map(item => item.userId);
};

const resetForm = () => {
  form.userId = undefined;
  form.username = '';
  form.nickname = '';
  form.password = '';
  form.deptId = undefined;
  form.mobile = '';
  form.email = '';
  form.avatarUrl = '';
  form.status = '0';
  form.isEnabled = true;
  form.roleIds = [];
  form.remark = '';
};

const handleAdd = () => {
  resetForm();
  dialogTitle.value = '新增用户';
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  resetForm();
  try {
    const res = await getUser(row.userId);
    const data = res.result || res.data || row;
    Object.assign(form, data);
    if (data.roleIds) {
      form.roleIds = [...data.roleIds];
    }
    dialogTitle.value = '修改用户';
    dialogVisible.value = true;
  } catch (error) {
    console.error('获取用户详情失败:', error);
  }
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.userId) {
        await updateUser(form);
        ElMessage.success('修改成功');
      } else {
        await addUser(form);
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

const handleStatusChange = async (row, val) => {
  try {
    const statusVal = val ? '0' : '1';
    await changeUserStatus(row.userId, statusVal, val);
    row.status = statusVal;
    ElMessage.success(`用户 ${row.username} 状态变更成功`);
  } catch (error) {
    row.isEnabled = !val;
    console.error('状态修改失败:', error);
  }
};

const handleResetPwd = (row) => {
  resetUserTarget.value = row;
  pwdForm.password = '';
  pwdDialogVisible.value = true;
};

const submitResetPwd = () => {
  pwdFormRef.value.validate(async (valid) => {
    if (!valid) return;
    pwdSubmitLoading.value = true;
    try {
      await resetUserPwd(resetUserTarget.value.userId, pwdForm.password);
      ElMessage.success(`用户 ${resetUserTarget.value.username} 密码重置成功`);
      pwdDialogVisible.value = false;
    } catch (error) {
      console.error('密码重置失败:', error);
    } finally {
      pwdSubmitLoading.value = false;
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户账号为 "${row.username}" 的数据吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delUser(row.userId);
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
};

const handleBatchDelete = () => {
  if (!selectedUserIds.value.length) return;
  ElMessageBox.confirm(`确定要批量删除选中的 ${selectedUserIds.value.length} 个用户账号吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delUser(selectedUserIds.value);
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
  getDeptTree();
  getRoleOptions();
  getList();
});
</script>

<style scoped>
.user-management-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

/* 布局双栏 */
.user-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  height: 100%;
  min-height: 0;
}

/* 左侧部门树 */
.dept-card {
  width: 240px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dept-search {
  padding: 0 10px 10px 10px;
  border-bottom: 1px solid #ebeef5;
}

.dept-search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.dept-tree-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-top: 10px;
}

.nebula-dept-tree {
  color: #606266;
}

:deep(.nebula-dept-tree .el-tree-node__content) {
  height: 32px;
}
:deep(.nebula-dept-tree .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #f5f7fa;
  color: #409eff;
}

/* 右侧主面板容器 */
.main-card {
  flex: 1;
  min-width: 0;
  min-height: 0;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* 当前选中 */
.current-selected {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}
.selected-dept-name {
  color: #303133;
  font-weight: 500;
}

/* 工具栏 */
.toolbar-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
}

.search-input {
  width: 240px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
}

.toolbar-btn {
  border-radius: 4px;
}

.btn-batch {
  background-color: #a0cfff;
  border-color: #a0cfff;
  color: #fff;
}
.btn-batch:disabled {
  background-color: #a0cfff;
  border-color: #a0cfff;
}

/* 表格容器 */
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

/* 操作列链接 */
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

/* 底部 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
}

.footer-info {
  color: #606266;
  font-size: 14px;
}

/* 对话框通用 */
:deep(.custom-dialog) {
  border-radius: 4px;
}

:deep(.custom-dialog .el-dialog__header) {
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.dialog-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-icon-box {
  display: none;
}

.dialog-form {
  padding: 20px 20px 0 20px;
}

.role-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.role-code-desc {
  color: #94a3b8;
  font-size: 12px;
}

.pwd-reset-tips {
  padding: 16px 24px;
  color: #475569;
  font-size: 14px;
}

.text-indigo {
  color: #409eff;
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

.btn-submit {
  border-radius: 4px;
}
</style>
