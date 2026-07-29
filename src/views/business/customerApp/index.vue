<template>
  <div class="customer-app-container">
    <!-- 顶部工作台 Header -->
    <div class="app-header-card">
      <div class="header-left">
        <div class="app-title-box">
          <div class="app-icon-wrapper">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="app-title-text">
            <h2>我的应用 · 客户大屏工作台</h2>
            <p>实时订单计时 · 专属陪玩管理 · 账户资金与服务明细</p>
          </div>
        </div>
      </div>

      <div class="header-right">
        <!-- 管理员客户切换下拉框 -->
        <div v-if="isAdmin" class="admin-customer-select">
          <span class="select-lbl">切换客户:</span>
          <el-select
            v-model="selectedCustomerId"
            placeholder="选择预览客户"
            filterable
            style="width: 180px;"
            @change="handleCustomerSelect"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.userId"
              :label="c.user?.nickname || c.user?.username || c.userId"
              :value="c.userId"
            />
          </el-select>
        </div>

        <!-- 客户身份卡片 -->
        <div class="customer-profile-badge">
          <el-avatar :size="36" class="user-avatar">
            {{ currentCustomerName ? currentCustomerName.charAt(0) : '客' }}
          </el-avatar>
          <div class="user-info-text">
            <span class="user-name">{{ currentCustomerName || '当前客户' }}</span>
            <el-tag type="warning" size="small" effect="plain" class="vip-tag">VIP老板</el-tag>
          </div>
        </div>

        <el-button type="primary" size="default" class="btn-refresh" @click="refreshAllData">
          <el-icon class="mr-1"><Refresh /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>

    <!-- KPI 数据统计栏 -->
    <div class="kpi-cards-grid">
      <div class="kpi-card stat-active">
        <div class="kpi-icon-wrapper icon-active">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ activeOrdersCount }}</div>
          <div class="kpi-label">进行中/计时订单</div>
        </div>
      </div>

      <div class="kpi-card stat-wallet">
        <div class="kpi-icon-wrapper icon-wallet">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">￥{{ formatAmount(walletBalance) }}</div>
          <div class="kpi-label">账户可用余额</div>
        </div>
      </div>

      <div class="kpi-card stat-spent">
        <div class="kpi-icon-wrapper icon-spent">
          <el-icon><Money /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">￥{{ formatAmount(totalSpentAmount) }}</div>
          <div class="kpi-label">累计游玩消费</div>
        </div>
      </div>

      <div class="kpi-card stat-hours">
        <div class="kpi-icon-wrapper icon-hours">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ totalPlayHours }} 小时</div>
          <div class="kpi-label">累计游玩时长</div>
        </div>
      </div>
    </div>

    <!-- 主进行中订单高亮秒表卡片 (若有进行中的订单) -->
    <div v-if="currentTimingOrder" class="hero-timer-card">
      <div class="timer-card-header">
        <div class="timer-badge-strip">
          <el-tag :type="currentTimingOrder.rentalType === 'CARPOOL' ? 'warning' : 'danger'" effect="light" class="rental-badge">
            {{ currentTimingOrder.rentalType === 'CARPOOL' ? '拼车模式 (共享陪玩)' : '包车模式 (独享陪玩)' }}
          </el-tag>
          <span class="order-no-text">单号: {{ currentTimingOrder.orderNo }}</span>
          <el-tag type="primary" effect="plain">服务项目: {{ currentTimingOrder.serviceType }}</el-tag>
        </div>
        <div class="timer-status-pulse">
          <span class="pulse-dot"></span> 实时陪玩服务中
        </div>
      </div>

      <div class="timer-main-body">
        <div class="stopwatch-display">
          <div class="clock-icon-anim"><el-icon><Timer /></el-icon></div>
          <div class="ticker-text">{{ liveTickerText }}</div>
        </div>

        <div class="timer-meta-box">
          <div class="meta-item">
            <span class="meta-lbl">已扣费时长:</span>
            <span class="meta-val text-primary">{{ currentTimingOrder.billedHours || 1 }} 小时</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">预计每小时扣额:</span>
            <span class="meta-val text-warning">￥{{ formatAmount(currentTimingOrder.hourlyRate) }}/小时</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">服务开始时间:</span>
            <span class="meta-val">{{ currentTimingOrder.startTime || '刚开始' }}</span>
          </div>
        </div>
      </div>

      <!-- 参与人员展示 -->
      <div class="timer-bottom-bar">
        <div class="participants-bar">
          <div class="part-group">
            <span class="part-lbl">同行陪玩团队:</span>
            <template v-if="currentTimingOrder.playmates && currentTimingOrder.playmates.length">
              <el-tag v-for="p in currentTimingOrder.playmates" :key="p.id" type="success" effect="light" class="user-pill">
                {{ p.playmateUser?.nickname || p.playmateUser?.username || p.playmateId }}
              </el-tag>
            </template>
            <span v-else class="part-val-none">主队长 ({{ currentTimingOrder.creatorPlaymateUser?.nickname || currentTimingOrder.creatorPlaymateId }})</span>
          </div>
        </div>

        <div class="timer-info-hint">
          <el-icon class="mr-1"><InfoFilled /></el-icon> 计时过程中系统每小时自动扣费，结束后由陪玩队长结算。
        </div>
      </div>
    </div>

    <!-- 订单与资金明细展示区域 -->
    <div class="orders-section-card">
      <div class="section-filter-bar">
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabClick">
          <el-tab-pane label="全部关联订单" name="ALL" />
          <el-tab-pane label="未计时" name="WAITING_START" />
          <el-tab-pane label="进行中" name="IN_SERVICE" />
          <el-tab-pane label="已完成" name="COMPLETED" />
          <el-tab-pane label="资金变动明细" name="BALANCE_LOG" />
        </el-tabs>

        <div v-if="activeTab !== 'BALANCE_LOG'" class="filter-right-inputs">
          <el-input
            v-model="queryParams.orderNo"
            placeholder="搜索订单编号"
            clearable
            style="width: 170px;"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />

          <el-select
            v-model="queryParams.status"
            placeholder="订单状态"
            clearable
            style="width: 130px;"
            @change="handleStatusChange"
          >
            <el-option label="未计时" value="WAITING_START" />
            <el-option label="进行中" value="IN_SERVICE" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>

          <el-input
            v-model="queryParams.serviceType"
            placeholder="服务/游戏类型(如LOL)"
            clearable
            style="width: 170px;"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />

          <el-button type="primary" class="toolbar-btn" @click="handleQuery">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button class="toolbar-btn" @click="resetQuery">
            <el-icon><RefreshRight /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <!-- 订单表格展示 -->
      <div v-if="activeTab !== 'BALANCE_LOG'" class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="orderList"
          class="nebula-modern-table"
          border
          height="100%"
          stripe
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="orderNo" label="订单编号" min-width="160" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span class="font-mono font-medium">{{ scope.row.orderNo }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="rentalType" label="模式" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.rentalType === 'CARPOOL' ? 'warning' : 'danger'" size="small" effect="light">
                {{ scope.row.rentalType === 'CARPOOL' ? '拼车' : '包车' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="serviceType" label="服务项目" width="120" align="center" show-overflow-tooltip />

          <el-table-column label="同行陪玩" min-width="170" align="center" show-overflow-tooltip>
            <template #default="scope">
              <div class="user-tags-inline">
                <template v-if="scope.row.playmates && scope.row.playmates.length">
                  <span v-for="p in scope.row.playmates" :key="p.id" class="inline-user-chip chip-pm">
                    {{ p.playmateUser?.nickname || p.playmateId }}
                  </span>
                </template>
                <span v-else class="inline-user-chip chip-pm">{{ scope.row.creatorPlaymateUser?.nickname || scope.row.creatorPlaymateId }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="hourlyRate" label="每小时单价" width="110" align="center">
            <template #default="scope">
              <span class="price-val">￥{{ formatAmount(scope.row.hourlyRate) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="已扣时长/消费" width="140" align="center">
            <template #default="scope">
              <span>{{ scope.row.billedHours || 0 }}h / ￥{{ formatAmount(scope.row.totalAmount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="订单状态" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建/开始时间" min-width="160" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.startTime || scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template #default="scope">
              <el-button link type="primary" class="action-link" @click="handleViewDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 资金变动日志表格展示 -->
      <div v-else class="table-wrapper">
        <el-table
          v-loading="logLoading"
          :data="balanceLogList"
          class="nebula-modern-table"
          border
          height="100%"
          stripe
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          
          <el-table-column prop="changeType" label="变动类型" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getLogTypeTag(scope.row.changeType)" size="small">
                {{ getLogTypeLabel(scope.row.changeType) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="amount" label="变动金额" width="130" align="center">
            <template #default="scope">
              <span :class="Number(scope.row.amount) >= 0 ? 'text-success font-bold' : 'text-danger font-bold'">
                {{ Number(scope.row.amount) >= 0 ? '+' : '' }}{{ formatAmount(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="balanceBefore" label="变动前余额" width="120" align="center">
            <template #default="scope">
              ￥{{ formatAmount(scope.row.balanceBefore) }}
            </template>
          </el-table-column>

          <el-table-column prop="balanceAfter" label="变动后余额" width="120" align="center">
            <template #default="scope">
              ￥{{ formatAmount(scope.row.balanceAfter) }}
            </template>
          </el-table-column>

          <el-table-column prop="orderNo" label="关联订单号" min-width="160" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span class="font-mono">{{ scope.row.orderNo || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="说明备注" min-width="200" align="center" show-overflow-tooltip />

          <el-table-column prop="createTime" label="变动时间" min-width="160" align="center" />
        </el-table>
      </div>

      <!-- 分页栏 -->
      <div class="table-footer">
        <div class="footer-info">
          <span v-if="activeTab !== 'BALANCE_LOG'">共 {{ total }} 条订单数据</span>
          <span v-else>共 {{ logTotal }} 条资金记录</span>
        </div>
        <el-pagination
          v-if="activeTab !== 'BALANCE_LOG'"
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
        <el-pagination
          v-else
          v-model:current-page="logQueryParams.pageIndex"
          v-model:page-size="logQueryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :background="true"
          layout="sizes, prev, pager, next, jumper"
          :total="logTotal"
          class="custom-pagination"
          @size-change="getBalanceLogs"
          @current-change="getBalanceLogs"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { UserFilled, Timer, Wallet, Money, Clock, Refresh, Search, RefreshRight, InfoFilled } from '@element-plus/icons-vue';
import { listOrder } from '../../../api/business/order.js';
import { listCustomer, getCustomerDashboardStats, listCustomerBalanceLog } from '../../../api/business/customer.js';
import { getUserInfo } from '../../../api/auth/auth.js';
import { ElMessageBox } from 'element-plus';

const loading = ref(false);
const logLoading = ref(false);
const orderList = ref([]);
const balanceLogList = ref([]);
const total = ref(0);
const logTotal = ref(0);
const activeTab = ref('ALL');

// 用户与客户选择器
const isAdmin = ref(false);
const selectedCustomerId = ref(null);
const customerOptions = ref([]);
const currentCustomerName = ref('');
const walletBalance = ref(0);

// KPI 统计
const activeOrdersCount = ref(0);
const totalSpentAmount = ref(0);
const totalPlayHours = ref(0);

// 秒表与进行中订单
const currentTimingOrder = ref(null);
const liveTickerText = ref('00:00:00');
let timerInterval = null;

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  customerId: undefined,
  orderNo: undefined,
  status: undefined,
  serviceType: undefined
});

const logQueryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  userId: undefined
});

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

/** 格式化秒数为 HH:MM:SS */
function formatSecondsToHMS(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(v => (v < 10 ? '0' + v : String(v))).join(':');
}

/** 启动秒表定时器 */
function startLiveTimerTicker() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!currentTimingOrder.value || !currentTimingOrder.value.startTime) {
      liveTickerText.value = '00:00:00';
      return;
    }
    const startMs = new Date(currentTimingOrder.value.startTime).getTime();
    const nowMs = new Date().getTime();
    const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    liveTickerText.value = formatSecondsToHMS(diffSec);
  }, 1000);
}

/** 初始化身份与核心统计数据 */
async function initCurrentCustomer() {
  try {
    const res = await getUserInfo();
    const userRes = res.result || res.data || res;
    const userObj = userRes.user || userRes;
    const roles = userRes.roles || [];
    const userId = userObj.userId || userObj.id;

    isAdmin.value = userObj.admin === true || roles.includes('admin') || roles.includes('ADMIN');

    if (isAdmin.value) {
      // 管理员支持下拉框选择全量客户
      try {
        const cListRes = await listCustomer({ pageIndex: 1, pageSize: 100 });
        const cData = cListRes.result || cListRes.data || cListRes;
        customerOptions.value = cData.records || cData.list || [];
        if (!selectedCustomerId.value && customerOptions.value.length > 0) {
          selectedCustomerId.value = customerOptions.value[0].userId;
        }
      } catch (e) {
        console.warn('获取客户列表失败:', e);
      }
    } else {
      selectedCustomerId.value = userId;
    }

    await loadCustomerStats();
  } catch (error) {
    console.error('初始化当前客户身份失败:', error);
  }
}

/** 加载指定客户的核心 KPI 统计数据与主进行中订单 */
async function loadCustomerStats() {
  const targetId = selectedCustomerId.value;
  try {
    const statsRes = await getCustomerDashboardStats({ customerId: targetId });
    const stats = statsRes.result || statsRes.data || {};

    selectedCustomerId.value = stats.userId || targetId;
    currentCustomerName.value = stats.nickname || 'VIP老板';
    walletBalance.value = stats.walletBalance || 0;
    activeOrdersCount.value = stats.activeOrdersCount || 0;
    totalSpentAmount.value = stats.totalSpentAmount || 0;
    totalPlayHours.value = stats.totalPlayHours || 0;

    if (stats.currentTimingOrder) {
      currentTimingOrder.value = stats.currentTimingOrder;
      startLiveTimerTicker();
    } else {
      currentTimingOrder.value = null;
      if (timerInterval) clearInterval(timerInterval);
    }
  } catch (e) {
    console.error('获取客户大屏统计失败:', e);
  }
}

/** 切换客户时触发 */
function handleCustomerSelect() {
  refreshAllData();
}

/** 查询客户订单列表 */
function getList() {
  loading.value = true;
  const req = {
    pageIndex: queryParams.pageIndex,
    pageSize: queryParams.pageSize,
    customerId: selectedCustomerId.value,
    orderNo: queryParams.orderNo || undefined,
    status: queryParams.status || undefined,
    serviceType: queryParams.serviceType || undefined
  };

  listOrder(req).then(res => {
    const resData = res.result || res.data || res;
    orderList.value = resData.records || resData.list || [];
    total.value = resData.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 查询资金变动日志 */
function getBalanceLogs() {
  logLoading.value = true;
  listCustomerBalanceLog({
    pageIndex: logQueryParams.pageIndex,
    pageSize: logQueryParams.pageSize,
    userId: selectedCustomerId.value
  }).then(res => {
    const resData = res.result || res.data || res;
    balanceLogList.value = resData.records || resData.list || [];
    logTotal.value = resData.total || 0;
    logLoading.value = false;
  }).catch(() => {
    logLoading.value = false;
  });
}

/** 刷新全部数据 */
async function refreshAllData() {
  loading.value = true;
  await loadCustomerStats();
  if (activeTab.value === 'BALANCE_LOG') {
    getBalanceLogs();
  } else {
    getList();
  }
}

function handleQuery() {
  queryParams.pageIndex = 1;
  getList();
}

function resetQuery() {
  queryParams.orderNo = undefined;
  queryParams.status = undefined;
  queryParams.serviceType = undefined;
  activeTab.value = 'ALL';
  handleQuery();
}

function handleTabClick(tab) {
  const name = tab ? (tab.props ? tab.props.name : tab.name) : activeTab.value;
  if (name === 'BALANCE_LOG') {
    logQueryParams.pageIndex = 1;
    getBalanceLogs();
  } else {
    if (name === 'ALL') {
      queryParams.status = undefined;
    } else {
      queryParams.status = name;
    }
    handleQuery();
  }
}

function handleStatusChange(val) {
  if (!val) {
    activeTab.value = 'ALL';
  } else if (['WAITING_START', 'IN_SERVICE', 'COMPLETED'].includes(val)) {
    activeTab.value = val;
  } else {
    activeTab.value = 'ALL';
  }
  handleQuery();
}

function handleViewDetail(order) {
  let playmatesStr = '-';
  if (order.playmates && order.playmates.length) {
    playmatesStr = order.playmates.map(p => p.playmateUser?.nickname || p.playmateId).join('、');
  } else if (order.creatorPlaymateUser) {
    playmatesStr = order.creatorPlaymateUser.nickname || order.creatorPlaymateId;
  }

  ElMessageBox.alert(`
    <div style="text-align:left; font-size:14px; line-height:1.8;">
      <p><b>订单号：</b>${order.orderNo}</p>
      <p><b>服务类型：</b>${order.serviceType}</p>
      <p><b>模式：</b>${order.rentalType === 'CARPOOL' ? '拼车' : '包车'}</p>
      <p><b>同行陪玩：</b>${playmatesStr}</p>
      <p><b>每小时单价：</b>￥${formatAmount(order.hourlyRate)}</p>
      <p><b>已扣小时数/已消费：</b>${order.billedHours || 0} 小时 / ￥${formatAmount(order.totalAmount)}</p>
      <p><b>订单状态：</b>${getStatusLabel(order.status)}</p>
      <p><b>创建时间：</b>${order.createTime || '-'}</p>
      <p><b>备注：</b>${order.remark || '无'}</p>
    </div>
  `, '订单详细信息', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  });
}

function getStatusTagType(status) {
  switch (status) {
    case 'IN_SERVICE': return 'danger';
    case 'WAITING_START':
    case 'CREATED':
    case 'UNPAID':
    case 'PAID': return 'warning';
    case 'COMPLETED': return 'success';
    case 'CANCELLED':
    case 'REFUNDED':
    case 'CLOSED': return 'info';
    default: return 'primary';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'WAITING_START':
    case 'CREATED':
    case 'UNPAID':
    case 'PAID': return '未计时';
    case 'IN_SERVICE': return '进行中';
    case 'COMPLETED': return '已完成';
    case 'CANCELLED': return '已取消';
    case 'REFUNDED': return '已退款';
    case 'CLOSED': return '已关闭';
    default: return status || '待处理';
  }
}

function getLogTypeTag(type) {
  switch (type) {
    case 'RECHARGE': return 'success';
    case 'CONSUME':
    case 'AUTO_DEDUCT': return 'danger';
    case 'REFUND': return 'warning';
    default: return 'info';
  }
}

function getLogTypeLabel(type) {
  switch (type) {
    case 'RECHARGE': return '充值';
    case 'CONSUME': return '消费扣费';
    case 'AUTO_DEDUCT': return '自动扣款';
    case 'REFUND': return '退款返还';
    case 'MANUAL_ADJUST': return '人工调账';
    default: return type || '变动';
  }
}

onMounted(async () => {
  await initCurrentCustomer();
  getList();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.customer-app-container {
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
  background: #fdf6ec;
  color: #e6a23c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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
  gap: 16px;
}

.admin-customer-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-lbl {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.customer-profile-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fcfcfc;
  border: 1px solid #ebeef5;
  padding: 6px 14px;
  border-radius: 20px;
}

.user-avatar {
  background-color: #e6a23c;
  color: #fff;
  font-weight: 700;
}

.user-info-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.btn-refresh {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 18px;
}

/* KPI 统计卡片 */
.kpi-cards-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.icon-active { background: #ecf5ff; color: #409eff; }
.icon-wallet { background: #fdf6ec; color: #e6a23c; }
.icon-spent { background: #fef0f0; color: #f56c6c; }
.icon-hours { background: #f0f9eb; color: #67c23a; }

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  color: #1f2f3d;
  line-height: 1.2;
}

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* Hero 秒表卡片 */
.hero-timer-card {
  flex-shrink: 0;
  background: linear-gradient(135deg, #1e2638 0%, #0d111a 100%);
  border-radius: 14px;
  padding: 20px 24px;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(13, 17, 26, 0.25);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.timer-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-badge-strip {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-no-text {
  font-family: monospace;
  font-size: 14px;
  color: #a0aec0;
}

.timer-status-pulse {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #68d391;
  font-weight: 600;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background-color: #68d391;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(104, 211, 145, 0.4);
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(104, 211, 145, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(104, 211, 145, 0); }
  100% { box-shadow: 0 0 0 0 rgba(104, 211, 145, 0); }
}

.timer-main-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.stopwatch-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.clock-icon-anim {
  font-size: 40px;
  color: #409eff;
  animation: rotate-slow 10s linear infinite;
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ticker-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #67c23a;
  text-shadow: 0 0 12px rgba(103, 194, 58, 0.4);
}

.timer-meta-box {
  display: flex;
  gap: 24px;
  background: rgba(255, 255, 255, 0.06);
  padding: 12px 20px;
  border-radius: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-lbl {
  font-size: 12px;
  color: #a0aec0;
}

.meta-val {
  font-size: 15px;
  font-weight: 700;
}

.timer-bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 14px;
}

.participants-bar {
  display: flex;
  align-items: center;
  gap: 20px;
}

.part-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.part-lbl {
  font-size: 13px;
  color: #cbd5e0;
}

.user-pill {
  font-weight: 600;
}

.timer-info-hint {
  font-size: 12px;
  color: #a0aec0;
  display: flex;
  align-items: center;
}

/* 订单与数据表格卡片 */
.orders-section-card {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  min-height: 0;
  overflow: hidden;
}

.section-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.filter-right-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
}

.footer-info {
  font-size: 13px;
  color: #909399;
}

.inline-user-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 2px;
}
.chip-pm { background: #e8f4ff; color: #409eff; }

.price-val {
  color: #f56c6c;
  font-weight: 700;
}

.mr-1 { margin-right: 4px; }
.text-primary { color: #409eff; }
.text-warning { color: #e6a23c; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
</style>
