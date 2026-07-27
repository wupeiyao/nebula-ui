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
          v-model="queryParams.orderType"
          placeholder="订单类型"
          clearable
          style="width: 130px"
          @change="handleQuery"
        >
          <el-option label="单排" value="SOLO" />
          <el-option label="双排" value="DUO" />
          <el-option label="三排" value="TRIPLE" />
          <el-option label="包车" value="TEAM" />
          <el-option label="自定义" value="CUSTOM" />
        </el-select>

        <el-select
          v-model="queryParams.status"
          placeholder="订单状态"
          clearable
          style="width: 140px"
          @change="handleQuery"
        >
          <el-option label="待创建" value="CREATED" />
          <el-option label="待支付" value="UNPAID" />
          <el-option label="已支付" value="PAID" />
          <el-option label="待开始" value="WAITING_START" />
          <el-option label="服务中" value="IN_SERVICE" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="已取消" value="CANCELLED" />
          <el-option label="已退款" value="REFUNDED" />
          <el-option label="已关闭" value="CLOSED" />
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

        <el-button type="primary" class="toolbar-btn" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button class="toolbar-btn" @click="resetQuery">
          <el-icon><RefreshRight /></el-icon> 重置
        </el-button>
        <el-button type="primary" class="toolbar-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增订单
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

          <el-table-column prop="serviceHours" label="时长/局数" width="130" align="center" :show-overflow-tooltip="true" >
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

          <el-table-column prop="platformProfit" label="平台收益" min-width="110" align="center">
            <template #default="scope">
              <span class="profit-text">￥{{ formatAmount(scope.row.platformProfit) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="订单状态" width="110" align="center" :show-overflow-tooltip="true" >
            <template #default="scope">
              <el-tag :type="getOrderStatusTag(scope.row.status).type" effect="dark">
                {{ getOrderStatusTag(scope.row.status).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" min-width="160" align="center" :show-overflow-tooltip="true" />

          <el-table-column label="操作" align="center" width="280" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="info" class="action-link" @click="handleViewDetail(scope.row)">详情</el-button>

                <el-button
                  v-if="scope.row.status === 'CREATED' || scope.row.status === 'UNPAID'"
                  link
                  type="warning"
                  class="action-link"
                  @click="handlePay(scope.row)"
                >
                  支付
                </el-button>

                <el-button
                  v-if="scope.row.status === 'PAID' || scope.row.status === 'WAITING_START' || scope.row.status === 'IN_SERVICE'"
                  link
                  type="success"
                  class="action-link"
                  @click="handleComplete(scope.row)"
                >
                  结算
                </el-button>

                <el-button
                  v-if="scope.row.status === 'PAID' || scope.row.status === 'WAITING_START' || scope.row.status === 'IN_SERVICE'"
                  link
                  type="danger"
                  class="action-link"
                  @click="handleOpenRefund(scope.row)"
                >
                  退款
                </el-button>

                <el-button v-if="scope.row.status !== 'COMPLETED'" link type="primary" class="action-link" @click="handleUpdate(scope.row)">编辑</el-button>
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

    <!-- 抽离的新增/编辑订单弹窗组件 -->
    <OrderFormDialog
      v-model:visible="formDialogVisible"
      :is-edit="isEdit"
      :order-data="editingOrder"
      @submit-success="getList"
    />

    <!-- 订单退款对话框 -->
    <el-dialog
      v-model="refundOpen"
      title="订单退款"
      width="540px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <el-icon class="header-icon text-danger"><Money /></el-icon>
          <span>订单退款处理</span>
        </div>
      </template>

      <el-form ref="refundRef" :model="refundForm" :rules="refundRules" label-width="100px" class="dialog-form">
        <el-form-item label="订单编号">
          <el-input :value="refundForm.orderNo" disabled />
        </el-form-item>

        <el-form-item label="订单总金额">
          <div class="amount-text bold">￥{{ formatAmount(refundForm.totalAmount) }}</div>
        </el-form-item>

        <el-form-item label="退款金额" prop="refundAmount">
          <el-input-number
            v-model="refundForm.refundAmount"
            :precision="2"
            :step="10"
            :max="refundForm.totalAmount"
            style="width: 100%"
          />
          <div class="form-tip">提示：默认全额退款，可手动调整部分退款金额</div>
        </el-form-item>

        <el-form-item label="退款原因" prop="remark">
          <el-input v-model="refundForm.remark" type="textarea" :rows="3" placeholder="请输入退款原因或备注说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="refundOpen = false">取 消</el-button>
          <el-button type="danger" class="btn-submit" :loading="refundLoading" @click="submitRefundForm">确认退款</el-button>
        </div>
      </template>
    </el-dialog>

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
          <el-descriptions-item label="平台抽成收益">
            <span class="profit-text bold">￥{{ formatAmount(currentOrder.platformProfit) }}</span>
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
import { Search, RefreshRight, Plus, Money } from '@element-plus/icons-vue';
import OrderFormDialog from './component/OrderFormDialog.vue';
import {
  listOrder,
  getOrder,
  delOrder,
  payOrder,
  completeOrder,
  refundOrder
} from '../../../api/business/order.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const orderList = ref([]);
const loading = ref(true);
const total = ref(0);
const ids = ref([]);

// 弹窗控制
const formDialogVisible = ref(false);
const isEdit = ref(false);
const editingOrder = ref({});

// 详细 Drawer
const detailDrawerOpen = ref(false);
const currentOrder = ref({});

// 退款 Dialog
const refundOpen = ref(false);
const refundLoading = ref(false);
const refundRef = ref(null);
const refundForm = reactive({
  id: '',
  orderNo: '',
  totalAmount: 0,
  refundAmount: 0,
  remark: ''
});

const refundRules = {
  refundAmount: [{ required: true, message: '退款金额不能为空', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入退款原因说明', trigger: 'blur' }]
};

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  orderNo: undefined,
  orderType: undefined,
  status: undefined,
  serviceType: undefined
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
    case 'WAITING_START': return { type: 'info', label: '待开始' };
    case 'IN_SERVICE': return { type: 'warning', label: '服务中' };
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

function resetQuery() {
  queryParams.orderNo = undefined;
  queryParams.orderType = undefined;
  queryParams.status = undefined;
  queryParams.serviceType = undefined;
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
}

/** 新增订单操作 */
function handleAdd() {
  isEdit.value = false;
  editingOrder.value = {};
  formDialogVisible.value = true;
}

/** 修改订单操作 */
function handleUpdate(row) {
  const id = row.id || ids.value[0];
  getOrder(id).then(response => {
    const resData = response.result || response.data || response;
    editingOrder.value = resData;
    isEdit.value = true;
    formDialogVisible.value = true;
  });
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

/** 订单支付 */
function handlePay(row) {
  ElMessageBox.confirm(`确认使用客户账号扣款支付订单 [${row.orderNo}] (总额: ￥${formatAmount(row.totalAmount)})?`, "订单支付", {
    confirmButtonText: "确认扣款支付",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    return payOrder(row.id);
  }).then(() => {
    ElMessage.success("订单支付成功！");
    getList();
  }).catch(() => {});
}

/** 订单服务完成结算 */
function handleComplete(row) {
  ElMessageBox.confirm(`确认结算订单 [${row.orderNo}]? 完成结算后将自动发放陪玩收益与平台抽成！`, "服务完成结算", {
    confirmButtonText: "确认结算发放",
    cancelButtonText: "取消",
    type: "success"
  }).then(() => {
    return completeOrder(row.id);
  }).then(() => {
    ElMessage.success("订单结算发放完成！");
    getList();
  }).catch(() => {});
}

/** 打开退款弹窗 */
function handleOpenRefund(row) {
  refundForm.id = row.id;
  refundForm.orderNo = row.orderNo;
  refundForm.totalAmount = row.totalAmount;
  refundForm.refundAmount = row.totalAmount;
  refundForm.remark = '';
  refundOpen.value = true;
}

/** 提交退款 */
function submitRefundForm() {
  if (refundRef.value) {
    refundRef.value.validate(valid => {
      if (valid) {
        refundLoading.value = true;
        refundOrder(refundForm.id, {
          refundAmount: refundForm.refundAmount,
          remark: refundForm.remark
        }).then(() => {
          ElMessage.success("订单退款成功！");
          refundOpen.value = false;
          getList();
        }).finally(() => {
          refundLoading.value = false;
        });
      }
    });
  }
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

.profit-text {
  color: #67c23a;
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

:deep(.custom-dialog) {
  border-radius: 4px;
  font-size: 16px;
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
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.dialog-form {
  padding: 20px 20px 0 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.text-danger {
  color: #f56c6c;
}

.form-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
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
