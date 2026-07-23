<template>
  <div class="log-container">
    <div class="main-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="任务编码" prop="taskCode">
          <el-input
            v-model="queryParams.taskCode"
            placeholder="请输入任务编码"
            clearable
            class="search-input"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="执行状态"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="date-picker-input"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary"  @click="handleQuery">查询</el-button>
          <el-button  @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-button type="primary" plain  @click="handleBackToTasks">返回任务列表</el-button>
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
          :data="logList"
          class="nebula-modern-table"
          border
          height="100%"
        >
          <el-table-column label="日志编号" align="center" prop="id" width="90" :show-overflow-tooltip="true" />
          <el-table-column label="任务ID" align="center" prop="taskId" width="90" :show-overflow-tooltip="true" />
          <el-table-column label="任务名称" align="center" prop="taskName" min-width="150" :show-overflow-tooltip="true" />
          <el-table-column label="任务编码" align="center" prop="taskCode" min-width="150" :show-overflow-tooltip="true" />
          <el-table-column label="执行参数" align="center" prop="params" min-width="140" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.params || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="执行状态" align="center" prop="status" width="100">
            <template #default="scope">
              <span v-if="scope.row.status === 1" class="status-plain active-status">成功</span>
              <span v-else class="status-plain disabled-status">失败</span>
            </template>
          </el-table-column>
          <el-table-column label="耗时" align="center" prop="costTime" width="100" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.costTime != null ? scope.row.costTime + 'ms' : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="执行时间" align="center" prop="createTime" width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template #default="scope">
              <el-button link type="primary" :icon="View" class="action-link" @click="handleViewDetail(scope.row)">详细</el-button>
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

    <!-- 任务日志详细对话框 -->
    <el-dialog
      v-model="openDetail"
      title="任务日志详细"
      width="700px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <el-form :model="detailForm" label-width="100px" class="dialog-form detail-form">
        <el-row>
          <el-col :span="12">
            <el-form-item label="日志编号：">{{ detailForm.id }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务ID：">{{ detailForm.taskId }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务名称：">{{ detailForm.taskName }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务编码：">{{ detailForm.taskCode }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行状态：">
              <el-tag v-if="detailForm.status === 1" type="success">成功</el-tag>
              <el-tag v-else type="danger">失败</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行耗时：">{{ detailForm.costTime }} ms</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="执行时间：">{{ detailForm.createTime }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="执行参数：">
              <div class="code-box">{{ detailForm.params || '无' }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="detailForm.status === 0 || detailForm.errorMsg">
            <el-form-item label="异常信息：">
              <div class="code-box error-box">{{ detailForm.errorMsg || '无异常堆栈' }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="openDetail = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, Refresh, RefreshRight, View, Back } from '@element-plus/icons-vue';
import { queryTaskLogPager, getTaskLogById } from '../../../../api/system/task.js';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const total = ref(0);
const logList = ref([]);
const dateRange = ref([]);
const openDetail = ref(false);
const detailForm = ref({});

const data = reactive({
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    taskId: undefined,
    taskCode: undefined,
    status: undefined
  }
});

const { queryParams } = toRefs(data);

/** 查询日志列表 */
const getList = async () => {
  loading.value = true;
  try {
    const params = { ...queryParams.value };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0] + ' 00:00:00';
      params.endTime = dateRange.value[1] + ' 23:59:59';
    }
    const res = await queryTaskLogPager(params);
    const pageData = res.result || res.data || {};
    logList.value = pageData.list || pageData.records || [];
    total.value = pageData.total || 0;
  } catch (error) {
    console.error('获取任务日志失败:', error);
  } finally {
    loading.value = false;
  }
};

/** 搜索 */
const handleQuery = () => {
  queryParams.value.pageIndex = 1;
  getList();
};

/** 重置 */
const resetQuery = () => {
  dateRange.value = [];
  queryParams.value.taskId = undefined;
  queryParams.value.taskCode = undefined;
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

/** 查看详情 */
const handleViewDetail = async (row) => {
  try {
    const res = await getTaskLogById(row.id);
    detailForm.value = res.result || res.data || row;
  } catch (error) {
    detailForm.value = { ...row };
  }
  openDetail.value = true;
};

/** 返回任务列表 */
const handleBackToTasks = () => {
  router.push('/system/tasking/excute');
};

onMounted(() => {
  // 获取 URL 传参，若从任务列表关联跳转过来
  if (route.query.taskId) {
    queryParams.value.taskId = route.query.taskId;
  }
  if (route.query.taskCode) {
    queryParams.value.taskCode = route.query.taskCode;
  }
  getList();
});
</script>

<style scoped>
.log-container {
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

.date-picker-input {
  width: 240px;
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

/* 状态样式 */
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

.action-link {
  font-size: 13px;
  padding: 0;
  height: auto;
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

.detail-form {
  padding: 10px 0;
}

.detail-form .el-form-item {
  margin-bottom: 8px;
}

.code-box {
  background-color: #f8f8f9;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 12px;
  width: 100%;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.error-box {
  color: #f56c6c;
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
