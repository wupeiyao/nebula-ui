<template>
  <div class="user-management-container">
    <!-- 页面顶栏标题与描述说明 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
        <p class="page-desc">维护系统用户账号、组织部门分配及角色权限关联</p>
      </div>
    </div>

    <!-- 主体双栏布局 -->
    <div class="user-layout">
      <!-- 左侧：部门架构树 Sidebar -->
      <div class="dept-card">
        <div class="dept-header">
          <div class="dept-title-box">
            <div class="dept-icon-box">
              <el-icon class="dept-icon"><OfficeBuilding /></el-icon>
            </div>
            <span class="dept-title" style="font-size: 16px">组织架构</span>
          </div>
          <el-tooltip content="刷新部门树" placement="top">
            <el-button link class="btn-refresh-dept" @click="getDeptTree">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <div class="dept-search">
          <el-input
            v-model="deptSearchKey"
            placeholder="搜索部门名称"
            clearable
            :prefix-icon="Search"
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
          >
            <template #default="{ node, data }">
              <div class="dept-tree-node" :class="{ 'is-selected': queryParams.deptId === data.deptId }">
                <el-icon class="node-icon"><Folder v-if="data.children && data.children.length" /><Document v-else /></el-icon>
                <span class="node-label">{{ node.label }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：用户表格与操作 Panel -->
      <div class="main-card">
        <!-- 综合工具栏 -->
        <div class="toolbar-wrapper">
          <div class="toolbar-left">
            <el-button type="primary" class="btn-create" :icon="Plus" @click="handleAdd">
              新建用户
            </el-button>
            <el-button
              type="danger"
              plain
              class="btn-batch-del"
              :icon="Delete"
              :disabled="selectedUserIds.length === 0"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedUserIds.length }})
            </el-button>
          </div>

          <div class="toolbar-right">
            <div class="search-group">
              <el-input
                v-model="queryParams.username"
                placeholder="搜索用户名"
                clearable
                :prefix-icon="Search"
                class="search-input"
                @keyup.enter="handleQuery"
                @clear="handleQuery"
              />
              <el-input
                v-model="queryParams.mobile"
                placeholder="手机号码"
                clearable
                :prefix-icon="Cellphone"
                class="search-input-sm"
                @keyup.enter="handleQuery"
                @clear="handleQuery"
              />
              <el-select
                v-model="queryParams.status"
                placeholder="账号状态"
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
            :data="userList"
            row-key="userId"
            class="nebula-modern-table"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />

            <!-- 用户基本信息 -->
            <el-table-column label="用户信息" min-width="180" :show-overflow-tooltip="true">
              <template #default="scope">
                <div class="user-info-cell">
                  <el-avatar
                    :size="36"
                    :src="scope.row.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + scope.row.username"
                    class="user-avatar"
                  >
                    {{ scope.row.username?.substring(0, 1).toUpperCase() }}
                  </el-avatar>
                  <div class="user-name-box">
                    <div class="username-row">
                      <span class="username-text">{{ scope.row.username }}</span>
                      <span v-if="scope.row.isAdmin && scope.row.isAdmin()" class="admin-badge">管理员</span>
                    </div>
                    <span class="nickname-text">{{ scope.row.nickname || '-' }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 所属部门 -->
            <el-table-column prop="deptName" label="所属部门" min-width="130" :show-overflow-tooltip="true">
              <template #default="scope">
                <span class="dept-pill" v-if="scope.row.deptName">
                  <el-icon><OfficeBuilding /></el-icon> {{ scope.row.deptName }}
                </span>
                <span v-else class="text-placeholder">未分配</span>
              </template>
            </el-table-column>

            <!-- 绑定角色 -->
            <el-table-column label="关联角色" min-width="180">
              <template #default="scope">
                <div class="roles-wrapper" v-if="scope.row.roles && scope.row.roles.length">
                  <el-tag
                    v-for="role in scope.row.roles"
                    :key="role.roleId"
                    size="small"
                    :class="getRoleTagClass(role.roleCode)"
                    class="role-tag"
                  >
                    <el-icon class="role-icon" v-if="role.roleCode === 'admin'"><Avatar /></el-icon>
                    <el-icon class="role-icon" v-else-if="role.roleCode === 'sys_admin'"><Setting /></el-icon>
                    <el-icon class="role-icon" v-else-if="role.roleCode === 'companion'"><Star /></el-icon>
                    <el-icon class="role-icon" v-else-if="role.roleCode === 'player'"><Trophy /></el-icon>
                    <el-icon class="role-icon" v-else-if="role.roleCode === 'kefu'"><Service /></el-icon>
                    <el-icon class="role-icon" v-else><User /></el-icon>
                    {{ role.roleName }}
                  </el-tag>
                </div>
                <span v-else class="text-placeholder">未绑定</span>
              </template>
            </el-table-column>

            <!-- 联系电话 -->
            <el-table-column prop="mobile" label="手机号码" width="130" align="center">
              <template #default="scope">
                <span class="font-mono">{{ scope.row.mobile || '-' }}</span>
              </template>
            </el-table-column>

            <!-- 邮箱 -->
            <el-table-column prop="email" label="邮箱" min-width="150" :show-overflow-tooltip="true">
              <template #default="scope">
                <span>{{ scope.row.email || '-' }}</span>
              </template>
            </el-table-column>

            <!-- 状态列 -->
            <el-table-column prop="status" label="状态" align="center" width="120">
              <template #default="scope">
                <div class="status-switch-box">
                  <el-switch
                    v-model="scope.row.isEnabled"
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
            <el-table-column prop="createTime" label="创建时间" width="160" align="center">
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
                  <el-tooltip content="重置密码" placement="top">
                    <el-button link type="warning" :icon="Key" class="action-btn-icon reset-btn" @click="handleResetPwd(scope.row)"></el-button>
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

/* 布局双栏 */
.user-layout {
  display: flex;
  gap: 18px;
  align-items: stretch;
}

/* 左侧部门树 */
.dept-card {
  width: 250px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.dept-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-weight: 600;
  font-size: 14px;
}

.dept-icon-box {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dept-icon {
  font-size: 15px;
}

.btn-refresh-dept {
  color: #64748b;
}

.btn-refresh-dept:hover {
  color: #6366f1;
}

.dept-search-input :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.dept-tree-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 400px;
}

.nebula-dept-tree {
  --el-tree-node-hover-bg-color: #f8fafc;
}

.dept-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #475569;
  padding: 6px 0;
}

.dept-tree-node.is-selected {
  color: #4f46e5;
  font-weight: 600;
}

.node-icon {
  color: #94a3b8;
}

/* 右侧主面板容器 */
.main-card {
  flex: 1;
  min-width: 0;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.02);
}

/* 工具栏 */
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.btn-create {
  border-radius: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
}

.btn-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.35);
}

.btn-batch-del {
  border-radius: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 160px;
}

.search-input-sm {
  width: 130px;
}

:deep(.search-input .el-input__wrapper),
:deep(.search-input-sm .el-input__wrapper) {
  border-radius: 8px;
}

.status-select {
  width: 110px;
}

:deep(.status-select .el-input__wrapper) {
  border-radius: 8px;
}

.btn-search {
  border-radius: 8px;
  font-weight: 500;
}

.btn-reset {
  border-radius: 8px;
  color: #64748b;
}

.divider-line {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
}

.btn-refresh {
  border-color: #e2e8f0;
  color: #64748b;
}

.btn-refresh:hover {
  color: #4f46e5;
  border-color: #c7d2fe;
  background-color: #eef2ff;
}

/* 表格容器 */
.table-wrapper {
  border-radius: 8px;
  overflow: hidden;
}

.nebula-modern-table {
  width: 100%;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #ffffff !important;
  color: #64748b !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  height: 50px !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

:deep(.nebula-modern-table .el-table__row:hover > td) {
  background-color: #f8fafc !important;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 12px 0 !important;
  border-bottom: 1px solid #f8fafc !important;
  font-size: 14px;
}

/* 用户信息单元格 */
.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  border: 2px solid #e0e7ff;
  background-color: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name-box {
  display: flex;
  flex-direction: column;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.username-text {
  font-weight: 600;
  color: #1e293b;
}

.admin-badge {
  font-size: 10px;
  padding: 1px 5px;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  font-weight: 600;
}

.nickname-text {
  font-size: 12px;
  color: #94a3b8;
}

.dept-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* 角色标签色彩调色盘 */
.roles-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tag {
  border-radius: 6px;
  font-weight: 500;
  border: none;
}

.tag-admin {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.tag-sysadmin {
  background-color: #e0e7ff;
  color: #4338ca;
}

.tag-companion {
  background-color: #fef3c7;
  color: #d97706;
}

.tag-player {
  background-color: #dcfce7;
  color: #15803d;
}

.tag-kefu {
  background-color: #cff4fc;
  color: #087990;
}

.tag-default {
  background-color: #f1f5f9;
  color: #64748b;
}

.role-icon {
  margin-right: 4px;
  vertical-align: middle;
  font-size: 13px;
}

.status-switch-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: 12px;
  font-size: 11px;
}

.status-active {
  background-color: #ecfdf5;
  color: #059669;
}

.status-active .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
}

.status-disabled {
  background-color: #fef2f2;
  color: #ef4444;
}

.status-disabled .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f87171;
}

.text-placeholder {
  color: #cbd5e1;
  font-size: 13px;
}

.font-mono {
  font-family: monospace;
  color: #334155;
}

.time-text {
  color: #64748b;
  font-size: 12px;
}

/* 操作列按钮 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn-icon {
  font-size: 16px;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background-color: #e0e7ff;
}

.reset-btn:hover {
  background-color: #fef3c7;
}

.del-btn:hover {
  background-color: #fee2e2;
}

/* 底部 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.footer-info {
  color: #64748b;
  font-size: 13px;
}

/* 对话框通用 */
:deep(.custom-dialog) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.custom-dialog .el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.dialog-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
}

.header-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #e0e7ff;
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.warning-box {
  background-color: #fef3c7;
  color: #d97706;
}

.dialog-form {
  padding: 20px 24px 0 24px;
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
  color: #4f46e5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
}

.btn-cancel {
  border-radius: 8px;
}

.btn-submit {
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
}
</style>
