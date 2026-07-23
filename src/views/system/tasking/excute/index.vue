<template>
  <div class="task-container">
    <!-- 操作与表格主区域面板 -->
    <div class="main-card">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="任务名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
            @clear="handleQuery"
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="任务编码" prop="code">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入任务编码"
            clearable
            @keyup.enter="handleQuery"
            @clear="handleQuery"
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="任务状态"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-button type="primary"  @click="handleAdd">新增</el-button>
          <el-button type="info" plain  @click="handleViewHistory">调度日志</el-button>
        </div>
        <div class="action-right">
          <el-tooltip content="刷新" placement="top">
            <el-button circle class="tool-btn" @click="getList" />
          </el-tooltip>
        </div>
      </div>

      <!-- 表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="taskList"
          class="nebula-modern-table"
          border
          height="100%"
        >
          <el-table-column prop="id" label="任务ID" align="center" width="90" :show-overflow-tooltip="true" />
          <el-table-column prop="name" label="任务名称" min-width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span class="task-name-text">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="任务编码" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column prop="cron" label="Cron表达式" align="center" width="150" :show-overflow-tooltip="true" />
          <el-table-column prop="params" label="执行参数" min-width="150" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.params || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" align="center" width="110">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                :active-value="1"
                :inactive-value="0"
                @change="(val) => handleStatusChange(scope.row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" align="center" width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="220" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="primary" class="action-link" @click="handleRunOnce(scope.row)">执行一次</el-button>
                <el-button link type="primary" class="action-link" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button link type="info" class="action-link" @click="handleTaskLog(scope.row)">日志</el-button>
                <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 表格底部汇总与分页 -->
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

    <!-- 新增 / 修改任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <el-icon><Operation /></el-icon>
          <span>{{ dialogTitle }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="dialog-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="任务编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入Spring Bean标识/任务编码" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Cron表达式" prop="cron">
              <el-input v-model="form.cron" placeholder="如：0 0/5 * * * ? （每5分钟）" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="执行参数" prop="params">
              <el-input
                v-model="form.params"
                type="textarea"
                :rows="3"
                placeholder="请输入任务执行参数（可选）"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" class="btn-submit" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, RefreshRight, Document, Operation } from '@element-plus/icons-vue';
import {
  queryTaskPager,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  runTaskOnce
} from '../../../../api/system/task.js';

const router = useRouter();

const loading = ref(false);
const total = ref(0);
const taskList = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref(null);

const data = reactive({
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    name: undefined,
    code: undefined,
    status: undefined
  }
});

const { queryParams } = toRefs(data);

const form = reactive({
  id: undefined,
  name: '',
  code: '',
  cron: '',
  params: '',
  status: 1
});

const rules = {
  name: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '任务编码不能为空', trigger: 'blur' }],
  cron: [{ required: true, message: 'Cron表达式不能为空', trigger: 'blur' }]
};

/** 查询任务列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await queryTaskPager(queryParams.value);
    const pageData = res.result || res.data || {};
    taskList.value = pageData.list || pageData.records || [];
    total.value = pageData.total || 0;
  } catch (error) {
    console.error('获取定时任务失败:', error);
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageIndex = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.value.name = undefined;
  queryParams.value.code = undefined;
  queryParams.value.status = undefined;
  handleQuery();
};

/** 分页大小变化 */
const handleSizeChange = (val) => {
  queryParams.value.pageSize = val;
  getList();
};

/** 页码变化 */
const handleCurrentChange = (val) => {
  queryParams.value.pageIndex = val;
  getList();
};

/** 重置表单 */
const resetForm = () => {
  form.id = undefined;
  form.name = '';
  form.code = '';
  form.cron = '';
  form.params = '';
  form.status = 1;
};

/** 新增按钮操作 */
const handleAdd = () => {
  resetForm();
  dialogTitle.value = '新增定时任务';
  dialogVisible.value = true;
};

/** 编辑按钮操作 */
const handleEdit = async (row) => {
  resetForm();
  try {
    const res = await getTaskById(row.id);
    const data = res.result || res.data || row;
    Object.assign(form, data);
    dialogTitle.value = '修改定时任务';
    dialogVisible.value = true;
  } catch (error) {
    console.error('获取任务详情失败:', error);
  }
};

/** 提交表单 */
const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.id) {
        await updateTask(form);
        ElMessage.success('修改任务成功');
      } else {
        await createTask(form);
        ElMessage.success('新增任务成功');
      }
      dialogVisible.value = false;
      getList();
    } catch (error) {
      console.error('提交任务失败:', error);
    } finally {
      submitLoading.value = false;
    }
  });
};

/** 状态开关变更 */
const handleStatusChange = async (row, val) => {
  const text = val === 1 ? '启用' : '禁用';
  try {
    await toggleTaskStatus(row.id, val);
    ElMessage.success(`已成功${text}任务"${row.name}"`);
  } catch (error) {
    row.status = val === 1 ? 0 : 1; // 还原状态
    console.error('切换状态失败:', error);
  }
};

/** 立即执行一次 */
const handleRunOnce = (row) => {
  ElMessageBox.confirm(`确定要立即执行一次任务"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    await runTaskOnce(row.id);
    ElMessage.success('任务已触发执行');
  }).catch(() => {});
};

/** 查看单个任务的调度日志 */
const handleTaskLog = (row) => {
  router.push({
    path: '/system/tasking/history',
    query: { taskId: row.id, taskCode: row.code }
  });
};

/** 全局跳转至调度日志页面 */
const handleViewHistory = () => {
  router.push('/system/tasking/history');
};

/** 删除任务 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除任务"${row.name}"吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteTask(row.id);
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.task-container {
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
  width: 120px;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 10px;
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

.task-name-text {
  color: #303133;
  font-weight: 500;
}

/* 操作列链接 */
.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
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

.dialog-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.btn-cancel, .btn-submit {
  border-radius: 4px;
}
</style>
