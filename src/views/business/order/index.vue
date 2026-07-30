<template>
  <div class="order-container">
    <div class="main-card">
      <!-- 综合搜索与工具栏 -->
      <div class="toolbar-wrapper">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="搜索订单编号"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />

        <el-select
          v-model="queryParams.status"
          placeholder="订单状态"
          clearable
          style="width: 140px"
          @change="handleQuery"
        >
          <el-option label="未计时" value="WAITING_START" />
          <el-option label="进行中" value="IN_SERVICE" />
          <el-option label="已完成" value="COMPLETED" />
        </el-select>

        <el-input
          v-model="queryParams.serviceType"
          placeholder="服务/游戏类型(如LOL)"
          clearable
          class="search-input"
          style="width: 180px"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 240px"
          @change="handleDateRangeChange"
        />

        <el-button type="primary" class="toolbar-btn" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button class="toolbar-btn" @click="resetQuery">
          <el-icon><RefreshRight /></el-icon> 重置
        </el-button>
        <el-button type="primary" class="toolbar-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 发起全新订单
        </el-button>
      </div>

      <!-- 数据表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="orderList"
          class="nebula-modern-table"
          @selection-change="handleSelectionChange"
          border
          height="100%"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="orderNo" label="订单编号" min-width="170" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span class="order-no-link" @click="handleViewDetail(scope.row)">
                {{ scope.row.orderNo }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="customerUser.nickname" label="客户" min-width="130" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.customerUser?.nickname || scope.row.customerProfile?.userId || scope.row.customerId || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="orderType" label="类型" width="90" align="center">
            <template #default="scope">
              <el-tag :type="getOrderTypeTag(scope.row.orderType).type" effect="light">
                {{ getOrderTypeTag(scope.row.orderType).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="serviceType" label="游戏/服务" min-width="120" align="center" :show-overflow-tooltip="true" />

          <el-table-column prop="totalAmount" label="订单总额" min-width="110" align="center">
            <template #default="scope">
              <span class="amount-text">￥{{ formatAmount(scope.row.totalAmount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="serviceHours" label="时长/局数" width="130" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.serviceHours || 1 }} {{ scope.row.serviceUnit === 'GAME' ? '局' : '小时' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="关联陪玩" min-width="160" align="center">
            <template #default="scope">
              <div v-if="scope.row.playmates && scope.row.playmates.length > 0" class="playmate-tags">
                <el-tag
                  v-for="pm in scope.row.playmates"
                  :key="pm.id"
                  size="small"
                  type="info"
                  class="pm-tag"
                >
                  {{ pm.playmateUser?.nickname || pm.playmateId }} (￥{{ formatAmount(pm.incomeAmount) }})
                </el-tag>
              </div>
              <span v-else class="text-gray">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="订单状态" width="110" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <el-tag :type="getOrderStatusTag(scope.row.status).type" effect="dark">
                {{ getOrderStatusTag(scope.row.status).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" min-width="160" align="center" :show-overflow-tooltip="true" />

          <el-table-column label="操作" align="center" width="220" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button
                  v-if="scope.row.status === 'WAITING_START' || scope.row.status === 'CREATED' || scope.row.status === 'UNPAID' || scope.row.status === 'PAID'"
                  link
                  type="success"
                  class="action-link action-link-success"
                  @click="handleStartTimer(scope.row)"
                >
                  开始计时
                </el-button>

                <el-button
                  v-if="scope.row.status === 'IN_SERVICE'"
                  link
                  type="danger"
                  class="action-link action-link-danger"
                  @click="handleStopTimer(scope.row)"
                >
                  结束计时
                </el-button>

                <el-button link type="info" class="action-link" @click="handleViewDetail(scope.row)">详情</el-button>

                <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 表格底部汇总与分页 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条订单数据</span>
        </div>
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :background="true"
          layout="sizes, prev, pager, next, jumper"
          :total="total"
          class="custom-pagination"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>

    <!-- 抽离的新增订单弹窗组件 -->
    <OrderFormDialog
      v-model:visible="formDialogVisible"
      @submit-success="getList"
    />

    <!-- 订单详细信息 Drawer 抽屉 -->
    <el-drawer
      v-model="detailDrawerOpen"
      title="订单详细信息"
      size="760px"
      append-to-body
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">订单详情 ({{ currentOrder.orderNo }})</span>
          <el-tag :type="getOrderStatusTag(currentOrder.status).type" effect="dark" class="drawer-tag">
            {{ getOrderStatusTag(currentOrder.status).label }}
          </el-tag>
        </div>
      </template>

      <div class="detail-container">
        <!-- 订单概览卡片 -->
        <el-descriptions title="基本信息" :column="2" border class="detail-descriptions">
          <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">
            <el-tag :type="getOrderTypeTag(currentOrder.orderType).type">
              {{ getOrderTypeTag(currentOrder.orderType).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="服务/游戏">{{ currentOrder.serviceType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务时长">{{ currentOrder.serviceHours || 1 }} {{ currentOrder.serviceUnit === 'GAME' ? '局' : '小时' }}</el-descriptions-item>
          <el-descriptions-item label="预计开始时间">{{ currentOrder.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计结束时间">{{ currentOrder.endTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单总金额">
            <span class="amount-text bold">￥{{ formatAmount(currentOrder.totalAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentOrder.updateTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注说明" :span="2">{{ currentOrder.remark || '无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 客户资料卡片 -->
        <el-descriptions title="客户信息" :column="2" border class="detail-descriptions" style="margin-top: 20px;">
          <el-descriptions-item label="客户用户名">{{ currentOrder.customerUser?.username || currentOrder.customerProfile?.userId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户昵称">{{ currentOrder.customerUser?.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="VIP 等级">VIP {{ currentOrder.customerProfile?.vipLevel || 0 }}</el-descriptions-item>
          <el-descriptions-item label="关联用户ID">{{ currentOrder.customerId || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 绑定陪玩分账列表 -->
        <div class="detail-section-title" style="margin-top: 20px;margin-bottom: 10px">
          <span>关联陪玩分账收益 (共 {{ currentOrder.playmates?.length || 0 }} 人)</span>
        </div>

        <el-table :data="currentOrder.playmates || []" border stripe class="detail-playmate-table">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="陪玩昵称" min-width="130" align="center">
            <template #default="scope">
              <span>{{ scope.row.playmateUser?.nickname || scope.row.playmateId }}</span>
            </template>
          </el-table-column>
          <el-table-column label="账号" min-width="120" align="center">
            <template #default="scope">
              <span>{{ scope.row.playmateUser?.username || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="接单单价" min-width="100" align="center">
            <template #default="scope">￥{{ formatAmount(scope.row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column prop="incomeAmount" label="陪玩预计/实际收益" min-width="140" align="center">
            <template #default="scope">
              <span class="income-text bold">￥{{ formatAmount(scope.row.incomeAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="服务状态" width="100" align="center">
            <template #default="scope">
              <el-tag size="small" :type="getPmStatusTag(scope.row.status)">
                {{ scope.row.status || 'PENDING' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Search, RefreshRight, Plus } from '@element-plus/icons-vue';
import OrderFormDialog from './component/OrderFormDialog.vue';
import {
  listOrder,
  getOrder,
  delOrder,
  startTimingOrder,
  stopTimingOrder
} from '../../../api/business/order.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const orderList = ref([]);
const loading = ref(true);
const total = ref(0);
const ids = ref([]);

// 弹窗控制
const formDialogVisible = ref(false);

// 详细 Drawer
const detailDrawerOpen = ref(false);
const currentOrder = ref({});

const dateRange = ref([]);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  orderNo: undefined,
  orderType: undefined,
  status: undefined,
  serviceType: undefined,
  beginTime: undefined,
  endTime: undefined
});

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

/** 格式化订单类型 Tag */
function getOrderTypeTag(type) {
  switch (type) {
    case 'SOLO': return { type: '', label: '单排' };
    case 'DUO': return { type: 'success', label: '双排' };
    case 'TRIPLE': return { type: 'warning', label: '三排' };
    case 'TEAM': return { type: 'danger', label: '包车' };
    case 'CARPOOL': return { type: 'warning', label: '拼车' };
    case 'CHARTER': return { type: 'danger', label: '包车' };
    case 'CUSTOM': return { type: 'info', label: '自定义' };
    default: return { type: 'info', label: type || '其他' };
  }
}

/** 格式化订单状态 Tag */
function getOrderStatusTag(status) {
  switch (status) {
    case 'CREATED': return { type: 'info', label: '待创建' };
    case 'UNPAID': return { type: 'warning', label: '待支付' };
    case 'PAID': return { type: '', label: '已支付' };
    case 'WAITING_START': return { type: 'info', label: '未计时' };
    case 'IN_SERVICE': return { type: 'warning', label: '进行中' };
    case 'COMPLETED': return { type: 'success', label: '已完成' };
    case 'CANCELLED': return { type: 'info', label: '已取消' };
    case 'REFUNDED': return { type: 'danger', label: '已退款' };
    case 'CLOSED': return { type: 'info', label: '已关闭' };
    default: return { type: 'info', label: status || '未知' };
  }
}

function getPmStatusTag(status) {
  switch (status) {
    case 'PENDING': return 'info';
    case 'SERVING': return 'warning';
    case 'COMPLETED': return 'success';
    case 'REPLACED': return 'danger';
    case 'CANCELLED': return 'info';
    default: return 'info';
  }
}

/** 查询订单列表 */
function getList() {
  loading.value = true;
  listOrder(queryParams).then(response => {
    const resData = response.result || response.data || response;
    orderList.value = resData.records || resData.list || [];
    total.value = resData.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 搜索与重置 */
function handleQuery() {
  queryParams.pageIndex = 1;
  getList();
}

function handleDateRangeChange(val) {
  if (Array.isArray(val) && val.length === 2) {
    queryParams.beginTime = val[0] + ' 00:00:00';
    queryParams.endTime = val[1] + ' 23:59:59';
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
  handleQuery();
}

function resetQuery() {
  queryParams.orderNo = undefined;
  queryParams.orderType = undefined;
  queryParams.status = undefined;
  queryParams.serviceType = undefined;
  queryParams.beginTime = undefined;
  queryParams.endTime = undefined;
  dateRange.value = [];
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
}

/** 新增订单操作 */
function handleAdd() {
  formDialogVisible.value = true;
}

/** 开始计时 */
function handleStartTimer(row) {
  ElMessageBox.confirm(`确定要开始对订单 [${row.orderNo}] 计时吗？`, '开始计时确认', {
    confirmButtonText: '立即开始',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    return startTimingOrder(row.id);
  }).then(() => {
    ElMessage.success("已成功开始计时！");
    getList();
  }).catch(() => {});
}

/** 结束计时并结算 */
function handleStopTimer(row) {
  ElMessageBox.confirm(`确定要结束订单 [${row.orderNo}] 的计时并结算吗？`, '结束计时确认', {
    confirmButtonText: '结束并结算',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return stopTimingOrder(row.id);
  }).then(() => {
    ElMessage.success("订单已完成结算！");
    getList();
  }).catch(() => {});
}

/** 删除订单 */
function handleDelete(row) {
  const orderIds = row.id || ids.value;
  ElMessageBox.confirm('是否确认删除所选订单数据?', "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(function() {
    return delOrder(orderIds);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  }).catch(() => {});
}

/** 查看订单详情 Drawer */
function handleViewDetail(row) {
  getOrder(row.id).then(res => {
    currentOrder.value = res.result || res.data || res;
    detailDrawerOpen.value = true;
  });
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.order-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
  font-size: 16px;
}

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

.toolbar-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 220px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
}
.search-input :deep(.el-input__inner) {
  font-size: 16px;
}

.toolbar-btn {
  border-radius: 4px;
  font-size: 16px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

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

.order-no-link {
  color: #409eff;
  cursor: pointer;
  font-weight: 500;
}
.order-no-link:hover {
  text-decoration: underline;
}

.amount-text {
  color: #e6a23c;
  font-weight: 600;
}

.income-text {
  color: #67c23a;
}

.bold {
  font-weight: bold;
}

.playmate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.pm-tag {
  font-size: 13px;
}

.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-link {
  font-size: 15px;
  padding: 0;
  height: auto;
  margin: 0 !important;
}

.action-link-success {
  color: #67c23a;
}

.action-link-danger {
  color: #f56c6c;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
}

.footer-info {
  color: #606266;
  font-size: 16px;
}

:deep(.custom-pagination),
:deep(.custom-pagination button),
:deep(.custom-pagination span),
:deep(.custom-pagination li),
:deep(.custom-pagination input) {
  font-size: 15px !important;
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-title {
  font-size: 18px;
  font-weight: bold;
}

.detail-container {
  padding: 0 10px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.detail-descriptions :deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 500;
}
</style>
