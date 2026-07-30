<template>
  <div class="playmate-flow-container">
    <!-- 顶部 Header 卡片 -->
    <div class="app-header-card">
      <div class="header-left">
        <div class="app-title-box">
          <div class="app-icon-wrapper icon-flow">
            <el-icon><Money /></el-icon>
          </div>
          <div class="app-title-text">
            <h2>我的收益与资金流水</h2>
            <p>实时查看订单服务完成收益、打赏结算、提现与资金变动明细对账</p>
          </div>
        </div>
      </div>

      <div class="header-right">
<!--        <el-button type="primary" size="default" class="btn-goto-workstation" @click="handleGoToWorkstation">-->
<!--          <el-icon class="mr-1"><Monitor /></el-icon> 返回陪玩工作台-->
<!--        </el-button>-->
<!--        <el-button type="info" plain size="default" class="btn-goto-customer" @click="handleGoToCustomer">-->
<!--          <el-icon class="mr-1"><User /></el-icon> 老板客户库-->
<!--        </el-button>-->
        <el-button class="btn-refresh" @click="getList">
          <el-icon class="mr-1"><Refresh /></el-icon> 刷新流水
        </el-button>
      </div>
    </div>

    <!-- KPI 数据统计卡片 (动态响应时间筛选与查询条件) -->
    <div class="kpi-cards-grid">
      <div class="kpi-card stat-income">
        <div class="kpi-icon-wrapper icon-income-bg">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">￥{{ formatAmount(totalIncomeAmount) }}</div>
          <div class="kpi-label">{{ hasDateRange ? '区间结算收益' : '累计结算收益' }}</div>
        </div>
      </div>

      <div class="kpi-card stat-count">
        <div class="kpi-icon-wrapper icon-count-bg">
          <el-icon><Tickets /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ incomeCount }} 笔</div>
          <div class="kpi-label">{{ hasDateRange ? '区间结算笔数' : '收益结算笔数' }}</div>
        </div>
      </div>

      <div class="kpi-card stat-today">
        <div class="kpi-icon-wrapper icon-today-bg">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">￥{{ formatAmount(todayIncomeAmount) }}</div>
          <div class="kpi-label">{{ hasDateRange ? '区间变动总额' : '今日变动金额' }}</div>
        </div>
      </div>
    </div>

    <!-- 资金流水列表主卡片区 -->
    <div class="flow-section-card">
      <div class="section-filter-bar">
        <div class="filter-left-title">
          <span class="filter-title-text">资金变动明细列表</span>
          <el-tag type="success" effect="plain" class="total-tag">共 {{ total }} 条变动流水</el-tag>
        </div>

        <div class="filter-right-inputs">
<!--          <el-select-->
<!--            v-model="queryParams.businessType"-->
<!--            placeholder="业务变动类型"-->
<!--            clearable-->
<!--            style="width: 160px;"-->
<!--            @change="handleQuery"-->
<!--          >-->
<!--            <el-option label="陪玩服务收益" value="PLAYMATE_INCOME" />-->
<!--            <el-option label="陪玩提现" value="PLAYMATE_WITHDRAW" />-->
<!--            <el-option label="平台抽成" value="PLATFORM_COMMISSION" />-->
<!--            <el-option label="订单退款" value="ORDER_REFUND" />-->
<!--            <el-option label="系统调账" value="ADJUSTMENT" />-->
<!--          </el-select>-->

<!--          <el-select-->
<!--            v-model="queryParams.flowDirection"-->
<!--            placeholder="资金流向"-->
<!--            clearable-->
<!--            style="width: 120px;"-->
<!--            @change="handleQuery"-->
<!--          >-->
<!--            <el-option label="收入 (+)" value="IN" />-->
<!--            <el-option label="支出 (-)" value="OUT" />-->
<!--          </el-select>-->

          <el-input
            v-model="queryParams.orderNo"
            placeholder="搜索关联订单号"
            clearable
            style="width: 170px;"
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
            style="width: 240px;"
            @change="handleDateRangeChange"
          />

          <el-button type="primary" class="toolbar-btn" @click="handleQuery">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button class="toolbar-btn" @click="resetQuery">
            <el-icon><RefreshRight /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <!-- 资金流水数据表格 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="flowList"
          class="nebula-modern-table"
          border
          height="100%"
          stripe
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="flowNo" label="流水单号" min-width="170" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span class="font-mono font-medium text-slate">{{ scope.row.flowNo }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="businessType" label="业务类型" width="140" align="center">
            <template #default="scope">
              <el-tag :type="getBusinessTypeTag(scope.row.businessType)" size="small" effect="light" class="biz-tag">
                {{ getBusinessTypeLabel(scope.row.businessType) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="资金流向 / 金额" width="160" align="center">
            <template #default="scope">
              <span v-if="scope.row.flowDirection === 'IN'" class="amount-in font-bold">
                +￥{{ formatAmount(scope.row.amount) }}
              </span>
              <span v-else class="amount-out font-bold">
                -￥{{ formatAmount(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="afterBalance" label="变动后可用余额" width="150" align="center">
            <template #default="scope">
              <span class="balance-text">￥{{ formatAmount(scope.row.afterBalance) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="关联订单号" min-width="170" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.orderNo" class="font-mono font-medium text-blue">{{ scope.row.orderNo }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column label="关联老板" width="140" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.customerUser || scope.row.customerId" class="inline-user-chip chip-boss">
                {{ scope.row.customerUser?.nickname || scope.row.customerId }}
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column label="流水时间" min-width="160" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注说明" min-width="200" align="left" show-overflow-tooltip />
        </el-table>
      </div>

      <!-- 分页栏 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条资金流水纪录</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Money, Monitor, User, Refresh, Search, RefreshRight, Wallet, Tickets, Clock } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { listFundFlow, getFundFlowSummary } from '../../../api/business/fundFlow.js';
import { getUserInfo } from '../../../api/auth/auth.js';

const router = useRouter();
const loading = ref(false);
const flowList = ref([]);
const total = ref(0);

const currentUserId = ref(null);
const totalIncomeAmount = ref(0);
const incomeCount = ref(0);
const todayIncomeAmount = ref(0);

const dateRange = ref([]);

const hasDateRange = computed(() => {
  return dateRange.value && dateRange.value.length === 2;
});

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  businessType: undefined,
  flowDirection: undefined,
  orderNo: undefined,
  beginTime: undefined,
  endTime: undefined,
  userId: undefined
});

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

/** 改变时间区间筛选 */
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

/** 初始化当前陪玩身份 */
function initUser() {
  return getUserInfo().then(res => {
    const userRes = res.result || res.data || res;
    const uid = userRes.user?.userId || userRes.userId;
    if (uid) {
      currentUserId.value = uid;
      queryParams.userId = uid;
    }
    return uid;
  }).catch(() => null);
}

/** 查询陪玩资金流水列表 */
function getList() {
  loading.value = true;
  if (!currentUserId.value) {
    initUser().then(() => {
      doFetchList();
    });
  } else {
    doFetchList();
  }
}

function doFetchList() {
  const req = {
    pageIndex: queryParams.pageIndex,
    pageSize: queryParams.pageSize,
    userId: queryParams.userId || currentUserId.value,
    businessType: queryParams.businessType || undefined,
    flowDirection: queryParams.flowDirection || undefined,
    orderNo: queryParams.orderNo || undefined,
    beginTime: queryParams.beginTime || undefined,
    endTime: queryParams.endTime || undefined
  };

  listFundFlow(req).then(res => {
    const resData = res.result || res.data || res;
    const records = resData.records || resData.list || [];
    flowList.value = records;
    total.value = resData.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });

  // 获取受当前筛选与时间范围控制的汇总指标数据
  getFundFlowSummary(req).then(res => {
    const sData = res.result || res.data || res || {};
    totalIncomeAmount.value = sData.totalIncome || 0;
    incomeCount.value = sData.incomeCount || 0;
    todayIncomeAmount.value = sData.netAmount || 0;
  }).catch(() => {});
}

/** 动态计算页面小卡片统计 */
function calculateSummary(records) {
  let incomeSum = 0;
  let count = 0;
  let todaySum = 0;

  const todayStr = new Date().toISOString().slice(0, 10);

  records.forEach(r => {
    if (r.flowDirection === 'IN') {
      const amt = Number(r.amount || 0);
      incomeSum += amt;
      count++;
      if (r.createTime && r.createTime.startsWith(todayStr)) {
        todaySum += amt;
      }
    }
  });

  totalIncomeAmount.value = incomeSum;
  incomeCount.value = count;
  todayIncomeAmount.value = todaySum;
}

function handleQuery() {
  queryParams.pageIndex = 1;
  getList();
}

function resetQuery() {
  dateRange.value = [];
  queryParams.businessType = undefined;
  queryParams.flowDirection = undefined;
  queryParams.orderNo = undefined;
  queryParams.beginTime = undefined;
  queryParams.endTime = undefined;
  handleQuery();
}

/** 业务类型 Tag 样式 */
function getBusinessTypeTag(type) {
  switch (type) {
    case 'PLAYMATE_INCOME': return 'success';
    case 'PLAYMATE_WITHDRAW': return 'warning';
    case 'PLATFORM_COMMISSION': return 'info';
    case 'ORDER_REFUND': return 'danger';
    case 'ADJUSTMENT': return 'primary';
    default: return 'primary';
  }
}

/** 业务类型文案映射 */
function getBusinessTypeLabel(type) {
  switch (type) {
    case 'PLAYMATE_INCOME': return '陪玩服务收益';
    case 'PLAYMATE_WITHDRAW': return '陪玩提现';
    case 'PLATFORM_COMMISSION': return '平台抽成';
    case 'ORDER_REFUND': return '订单退款';
    case 'ADJUSTMENT': return '系统调账';
    case 'RECHARGE': return '充值';
    case 'ORDER_PAY': return '订单扣款';
    default: return type || '资金变动';
  }
}

function handleGoToWorkstation() {
  router.push('/business/playmateApp').catch(() => {
    router.push('/playmateApp');
  });
}

function handleGoToCustomer() {
  router.push('/business/playmateApp/customer').catch(() => {
    router.push('/business/playmateCustomer');
  });
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.playmate-flow-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px 24px;
  background-color: #f4f6f9;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  gap: 16px;
  overflow: hidden;
}

/* 顶栏 Header */
.app-header-card {
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.header-left .app-title-box {
  display: flex;
  align-items: center;
  gap: 14px;
}

.app-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.icon-flow {
  background: #f0fdf4;
  color: #16a34a;
}

.app-title-text h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2f3d;
}

.app-title-text p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-goto-workstation {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 18px;
}

.btn-goto-customer {
  border-radius: 8px;
}

.btn-refresh {
  border-radius: 8px;
}

/* KPI 统计卡片 */
.kpi-cards-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.kpi-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.icon-income-bg { background: #f0f9eb; color: #67c23a; }
.icon-count-bg { background: #ecf5ff; color: #409eff; }
.icon-today-bg { background: #fdf6ec; color: #e6a23c; }

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  color: #1f2f3d;
  line-height: 1.2;
}

.kpi-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* 流水表格区 */
.flow-section-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.section-filter-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.filter-left-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.total-tag {
  border-radius: 6px;
}

.filter-right-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-btn {
  border-radius: 4px;
}

/* 数据表格容器撑满 */
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
  font-weight: 600 !important;
  font-size: 14px !important;
  height: 42px !important;
  padding: 6px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 8px 0 !important;
  font-size: 14px !important;
  color: #606266;
}

.amount-in {
  color: #67c23a;
  font-size: 15px;
}

.amount-out {
  color: #f56c6c;
  font-size: 15px;
}

.balance-text {
  color: #1e293b;
  font-weight: 600;
}

.inline-user-chip {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.chip-boss {
  background: #e8f4ff;
  color: #409eff;
}

.table-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.footer-info {
  color: #606266;
  font-size: 14px;
}

:deep(.custom-pagination),
:deep(.custom-pagination button),
:deep(.custom-pagination span),
:deep(.custom-pagination li),
:deep(.custom-pagination input) {
  font-size: 14px !important;
}

.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.font-mono { font-family: monospace; }
.text-slate { color: #475569; }
.text-blue { color: #409eff; }
.text-muted { color: #909399; }
.mr-1 { margin-right: 4px; }
</style>