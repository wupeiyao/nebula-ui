<template>
  <div class="fund-flow-container">
    <!-- 资金统计大屏卡片区 -->
    <div class="statistics-wrapper" v-loading="statLoading">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card turnover-card" shadow="hover">
            <div class="stat-icon-wrapper"><el-icon><Money /></el-icon></div>
            <div class="stat-content">
              <div class="stat-title">期间营业额</div>
              <div class="stat-value">￥{{ formatAmount(statistics.todayTurnover) }}</div>
              <div class="stat-desc">累计营业额 ￥{{ formatAmount(statistics.totalTurnover) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card profit-card" shadow="hover">
            <div class="stat-icon-wrapper"><el-icon><DataLine /></el-icon></div>
            <div class="stat-content">
              <div class="stat-title">期间平台收益</div>
              <div class="stat-value">￥{{ formatAmount(statistics.todayPlatformCommission) }}</div>
              <div class="stat-desc">累计平台收益 ￥{{ formatAmount(statistics.totalPlatformCommission) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card recharge-card" shadow="hover">
            <div class="stat-icon-wrapper"><el-icon><Wallet /></el-icon></div>
            <div class="stat-content">
              <div class="stat-title">期间充值金额</div>
              <div class="stat-value">￥{{ formatAmount(statistics.todayRecharge) }}</div>
              <div class="stat-desc">期间总流水 ￥{{ formatAmount(statistics.todayTotalFlowAmount) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card refund-card" shadow="hover">
            <div class="stat-icon-wrapper"><el-icon><Warning /></el-icon></div>
            <div class="stat-content">
              <div class="stat-title">期间退款金额</div>
              <div class="stat-value">￥{{ formatAmount(statistics.todayRefund) }}</div>
              <div class="stat-desc">期间提现 ￥{{ formatAmount(statistics.todayWithdraw) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 流水明细卡片 -->
    <div class="main-card">
      <div class="main-header">
        <span class="main-title">资金流水明细</span>
      </div>

      <!-- 综合搜索与工具栏 -->
      <div class="toolbar-wrapper">
        <el-input
          v-model="queryParams.flowNo"
          placeholder="搜索流水号"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />

        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 320px"
          @change="handleQuery"
        />

        <el-input
          v-model="queryParams.orderNo"
          placeholder="搜索订单编号"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />

        <el-select
          v-model="queryParams.userType"
          placeholder="主体类型"
          clearable
          style="width: 130px"
          @change="handleQuery"
        >
          <el-option label="客户" value="CUSTOMER" />
          <el-option label="陪玩" value="PLAYMATE" />
          <el-option label="平台" value="PLATFORM" />
        </el-select>

        <el-select
          v-model="queryParams.businessType"
          placeholder="业务类型"
          clearable
          style="width: 140px"
          @change="handleQuery"
        >
          <el-option label="用户充值" value="RECHARGE" />
          <el-option label="订单支付" value="ORDER_PAY" />
          <el-option label="订单退款" value="ORDER_REFUND" />
          <el-option label="平台抽成" value="PLATFORM_COMMISSION" />
          <el-option label="陪玩收入" value="PLAYMATE_INCOME" />
          <el-option label="陪玩提现" value="PLAYMATE_WITHDRAW" />
          <el-option label="人工加款" value="MANUAL_ADD" />
          <el-option label="人工扣款" value="MANUAL_DEDUCT" />
          <el-option label="活动奖励" value="ACTIVITY_REWARD" />
          <el-option label="资金调整" value="ADJUSTMENT" />
        </el-select>

        <el-select
          v-model="queryParams.flowDirection"
          placeholder="资金方向"
          clearable
          style="width: 120px"
          @change="handleQuery"
        >
          <el-option label="收入" value="IN" />
          <el-option label="支出" value="OUT" />
        </el-select>

        <el-button type="primary" class="toolbar-btn" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button class="toolbar-btn" @click="resetQuery">
          <el-icon><RefreshRight /></el-icon> 重置
        </el-button>
      </div>

      <!-- 数据表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="flowList"
          class="nebula-modern-table"
          border
          height="100%"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="flowNo" label="流水号" min-width="180" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span class="flow-no-text">{{ scope.row.flowNo }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="orderNo" label="关联订单号" min-width="160" align="center" :show-overflow-tooltip="true">
             <template #default="scope">
              <span class="order-no-text">{{ scope.row.orderNo || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="归属用户" min-width="140" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.user?.nickname || scope.row.userId || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="userType" label="主体类型" width="90" align="center">
            <template #default="scope">
              <el-tag :type="getUserTypeTag(scope.row.userType).type" effect="light" size="small">
                {{ getUserTypeTag(scope.row.userType).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="businessType" label="业务类型" width="110" align="center">
            <template #default="scope">
              <el-tag :type="getBusinessTypeTag(scope.row.businessType).type" effect="plain">
                {{ getBusinessTypeTag(scope.row.businessType).label }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="flowDirection" label="方向" width="80" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.flowDirection === 'IN' ? 'success' : 'danger'" effect="dark">
                {{ scope.row.flowDirection === 'IN' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="amount" label="变动金额" min-width="120" align="center">
            <template #default="scope">
              <span :class="scope.row.flowDirection === 'IN' ? 'amount-in' : 'amount-out'">
                {{ scope.row.flowDirection === 'IN' ? '+' : '-' }}￥{{ formatAmount(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="afterBalance" label="变动后余额" min-width="110" align="center">
            <template #default="scope">
              <span class="balance-text">￥{{ formatAmount(scope.row.afterBalance) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="产生时间" min-width="160" align="center" :show-overflow-tooltip="true" />
          
          <el-table-column prop="remark" label="备注说明" min-width="150" align="center" :show-overflow-tooltip="true" />
        </el-table>
      </div>

      <!-- 表格底部汇总与分页 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条流水记录</span>
        </div>
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50, 100]"
          :background="true"
          layout="sizes, prev, pager, next, jumper"
          :total="total"
          class="custom-pagination"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Search, RefreshRight, Money, DataLine, Wallet, Warning } from '@element-plus/icons-vue';
import { listFundFlow, getFundStatistics } from '../../../api/business/fundFlow.js';

const flowList = ref([]);
const loading = ref(true);
const statLoading = ref(true);
const total = ref(0);
const dateRange = ref([]);

const statistics = ref({
  todayTurnover: 0,
  todayPlatformCommission: 0,
  todayRecharge: 0,
  todayWithdraw: 0,
  todayRefund: 0,
  todayTotalFlowAmount: 0,
  totalTurnover: 0,
  totalPlatformCommission: 0
});

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 20,
  flowNo: undefined,
  orderNo: undefined,
  userType: undefined,
  businessType: undefined,
  flowDirection: undefined
});

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

function getUserTypeTag(type) {
  switch (type) {
    case 'CUSTOMER': return { type: '', label: '客户' };
    case 'PLAYMATE': return { type: 'warning', label: '陪玩' };
    case 'PLATFORM': return { type: 'danger', label: '平台' };
    default: return { type: 'info', label: type || '其他' };
  }
}

function getBusinessTypeTag(type) {
  switch (type) {
    case 'RECHARGE': return { type: 'success', label: '用户充值' };
    case 'ORDER_PAY': return { type: 'warning', label: '订单支付' };
    case 'ORDER_REFUND': return { type: 'danger', label: '订单退款' };
    case 'PLATFORM_COMMISSION': return { type: 'primary', label: '平台抽成' };
    case 'PLAYMATE_INCOME': return { type: 'success', label: '陪玩收入' };
    case 'PLAYMATE_WITHDRAW': return { type: 'warning', label: '陪玩提现' };
    case 'MANUAL_ADD': return { type: 'success', label: '人工加款' };
    case 'MANUAL_DEDUCT': return { type: 'danger', label: '人工扣款' };
    case 'ACTIVITY_REWARD': return { type: 'primary', label: '活动奖励' };
    case 'ADJUSTMENT': return { type: 'info', label: '资金调整' };
    default: return { type: 'info', label: type || '未知' };
  }
}

/** 获取统计大屏数据 */
function getStatistics() {
  statLoading.value = true;
  getFundStatistics(queryParams).then(res => {
    const data = res.result || res.data || res;
    statistics.value = data;
    statLoading.value = false;
  }).catch(() => {
    statLoading.value = false;
  });
}

/** 查询流水列表 */
function getList() {
  loading.value = true;
  listFundFlow(queryParams).then(response => {
    const resData = response.result || response.data || response;
    flowList.value = resData.records || resData.list || [];
    total.value = resData.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 搜索与重置 */
function handleQuery() {
  queryParams.pageIndex = 1;
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.beginTime = dateRange.value[0];
    queryParams.endTime = dateRange.value[1];
  } else {
    queryParams.beginTime = undefined;
    queryParams.endTime = undefined;
  }
  getStatistics();
  getList();
}

function resetQuery() {
  queryParams.flowNo = undefined;
  queryParams.orderNo = undefined;
  queryParams.userType = undefined;
  queryParams.businessType = undefined;
  queryParams.flowDirection = undefined;
  dateRange.value = [];
  handleQuery();
}

onMounted(() => {
  getStatistics();
  getList();
});
</script>

<style scoped>
.fund-flow-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
  font-size: 16px;
  overflow: auto;
}

/* 顶部统计卡片 */
.statistics-wrapper {
  margin-bottom: 16px;
}

.stat-card {
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  margin-right: 16px;
  color: #fff;
}

.turnover-card .stat-icon-wrapper {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
}

.profit-card .stat-icon-wrapper {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4);
}

.recharge-card .stat-icon-wrapper {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  box-shadow: 0 4px 12px rgba(253, 160, 133, 0.4);
}

.refund-card .stat-icon-wrapper {
  background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%);
  box-shadow: 0 4px 12px rgba(255, 8, 68, 0.4);
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  color: #303133;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-desc {
  font-size: 13px;
  color: #909399;
}


/* 主列表区 */
.main-card {
  flex: 1;
  min-width: 0;
  min-height: 400px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.main-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.main-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.toolbar-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
}
.search-input :deep(.el-input__inner) {
  font-size: 15px;
}

.toolbar-btn {
  border-radius: 4px;
  font-size: 15px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.nebula-modern-table {
  width: 100%;
  font-size: 15px;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #f8f8f9 !important;
  color: #515a6e !important;
  font-weight: 500 !important;
  font-size: 15px !important;
  height: 44px !important;
  padding: 8px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 10px 0 !important;
  font-size: 15px !important;
  color: #606266;
}

.flow-no-text, .order-no-text {
  font-family: monospace;
  color: #606266;
}

.amount-in {
  color: #67c23a;
  font-weight: bold;
  font-size: 16px;
}

.amount-out {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.balance-text {
  color: #409eff;
  font-weight: 500;
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
  font-size: 15px;
}

:deep(.custom-pagination),
:deep(.custom-pagination button),
:deep(.custom-pagination span),
:deep(.custom-pagination li),
:deep(.custom-pagination input) {
  font-size: 14px !important;
}
</style>
