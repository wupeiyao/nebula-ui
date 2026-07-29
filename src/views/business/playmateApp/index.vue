<template>
  <div class="playmate-app-container">
    <!-- 顶部工作台 Header -->
    <div class="app-header-card">
      <div class="header-left">
        <div class="app-title-box">
          <div class="app-icon-wrapper">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="app-title-text">
            <h2>陪玩应用工作台</h2>
            <p>实时订单计时 · 包车/拼车管理 · 收益秒级对账</p>
          </div>
        </div>
      </div>

      <div class="header-right">
        <!-- 接单状态 (查询陪玩档案状态，不可手动修改) -->
        <div class="status-toggle-box">
          <span class="status-label">接单状态:</span>
          <el-tag
            :type="playmateOnlineStatus === '1' ? 'success' : (playmateOnlineStatus === '2' ? 'danger' : 'info')"
            effect="dark"
            size="default"
            class="status-tag-badge"
          >
            <span class="status-dot" :class="playmateOnlineStatus === '1' ? 'dot-online' : (playmateOnlineStatus === '2' ? 'dot-busy' : 'dot-rest')"></span>
            {{ playmateOnlineStatus === '1' ? '在线接单' : (playmateOnlineStatus === '2' ? '忙碌中' : '离线/休息') }}
          </el-tag>
        </div>

        <el-button type="primary" size="default" class="btn-create-order" @click="handleOpenCreateModal">
          <el-icon class="mr-1"><Plus /></el-icon> 发起全新订单
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

      <div class="kpi-card stat-income">
        <div class="kpi-icon-wrapper icon-income">
          <el-icon><Money /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">￥{{ formatAmount(todayEstimateIncome) }}</div>
          <div class="kpi-label">今日预估收益</div>
        </div>
      </div>

      <div class="kpi-card stat-boss">
        <div class="kpi-icon-wrapper icon-boss">
          <el-icon><User /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ totalBossesCount }}</div>
          <div class="kpi-label">关联老板人次</div>
        </div>
      </div>

      <div class="kpi-card stat-hours">
        <div class="kpi-icon-wrapper icon-hours">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ todayHours }} 小时</div>
          <div class="kpi-label">今日服务时长</div>
        </div>
      </div>
    </div>

    <!-- 主进行中订单高亮秒表卡片 (若有进行中的订单) -->
    <div v-if="currentTimingOrder" class="hero-timer-card">
      <div class="timer-card-header">
        <div class="timer-badge-strip">
          <el-tag :type="currentTimingOrder.rentalType === 'CARPOOL' ? 'warning' : 'danger'" effect="light" class="rental-badge">
            {{ currentTimingOrder.rentalType === 'CARPOOL' ? '拼车模式 (多老板)' : '包车模式 (独享老板)' }}
          </el-tag>
          <span class="order-no-text">单号: {{ currentTimingOrder.orderNo }}</span>
          <el-tag type="primary" effect="plain">服务项目: {{ currentTimingOrder.serviceType }}</el-tag>
        </div>
        <div class="timer-status-pulse">
          <span class="pulse-dot"></span> 实时服务中
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
            <span class="meta-lbl">开始时间:</span>
            <span class="meta-val">{{ currentTimingOrder.startTime || '刚开始' }}</span>
          </div>
        </div>
      </div>

      <!-- 参与人员展示与操作 -->
      <div class="timer-bottom-bar">
        <div class="participants-bar">
          <div class="part-group">
            <span class="part-lbl">老板列表:</span>
            <template v-if="currentTimingOrder.customers && currentTimingOrder.customers.length">
              <el-tag v-for="c in currentTimingOrder.customers" :key="c.id" type="info" effect="light" class="user-pill">
                {{ c.customerUser?.nickname || c.customerUser?.username || c.customerId }}
                (￥{{ formatAmount(c.hourlyRate) }}/h)
              </el-tag>
            </template>
            <span v-else class="part-val-none">主老板 ({{ currentTimingOrder.customerUser?.nickname || currentTimingOrder.customerId }})</span>
          </div>

          <div class="part-group">
            <span class="part-lbl">陪玩同行:</span>
            <template v-if="currentTimingOrder.playmates && currentTimingOrder.playmates.length">
              <el-tag v-for="p in currentTimingOrder.playmates" :key="p.id" type="success" effect="light" class="user-pill">
                {{ p.playmateUser?.nickname || p.playmateUser?.username || p.playmateId }}
              </el-tag>
            </template>
            <span v-else class="part-val-none">-</span>
          </div>
        </div>

        <div class="timer-actions">
          <el-button
            type="danger"
            size="default"
            class="btn-stop-timer"
            :loading="stopLoading"
            @click="handleStopTimer(currentTimingOrder)"
          >
            <el-icon class="mr-1"><VideoPause /></el-icon> 结束计时并完成结算
          </el-button>
        </div>
      </div>
    </div>

    <!-- 订单表格区域 -->
    <div class="orders-section-card">
      <div class="section-filter-bar">
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabClick">
          <el-tab-pane label="全部关联订单" name="ALL" />
          <el-tab-pane label="未计时" name="WAITING_START" />
          <el-tab-pane label="进行中" name="IN_SERVICE" />
          <el-tab-pane label="已完成" name="COMPLETED" />
        </el-tabs>

        <div class="filter-right-inputs">
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

      <!-- 订单数据表格展示区域 -->
      <div class="table-wrapper">
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

          <el-table-column prop="rentalType" label="租赁模式" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.rentalType === 'CARPOOL' ? 'warning' : 'danger'" size="small" effect="light">
                {{ scope.row.rentalType === 'CARPOOL' ? '拼车' : '包车' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="serviceType" label="服务项目" width="120" align="center" show-overflow-tooltip />

          <el-table-column label="老板信息" min-width="160" align="center" show-overflow-tooltip>
            <template #default="scope">
              <div class="user-tags-inline">
                <template v-if="scope.row.customers && scope.row.customers.length">
                  <span v-for="c in scope.row.customers" :key="c.id" class="inline-user-chip chip-boss">
                    {{ c.customerUser?.nickname || c.customerId }}
                  </span>
                </template>
                <span v-else class="inline-user-chip chip-boss">{{ scope.row.customerUser?.nickname || scope.row.customerId }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="同行陪玩" min-width="150" align="center" show-overflow-tooltip>
            <template #default="scope">
              <div class="user-tags-inline">
                <template v-if="scope.row.playmates && scope.row.playmates.length">
                  <span v-for="p in scope.row.playmates" :key="p.id" class="inline-user-chip chip-pm">
                    {{ p.playmateUser?.nickname || p.playmateId }}
                  </span>
                </template>
                <span v-else class="text-muted">-</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="hourlyRate" label="每小时单价" width="110" align="center">
            <template #default="scope">
              <span class="price-val">￥{{ formatAmount(scope.row.hourlyRate) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="已扣时长/收益" width="140" align="center">
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

          <el-table-column label="操作" align="center" width="180" fixed="right">
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

                <el-button link type="primary" class="action-link" @click="handleViewDetail(scope.row)">
                  详情
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页栏 -->
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

    <!-- 发起创建订单 Modal 对话框组件 -->
    <PlaymateAppOrderDialog
      v-model:visible="createModalOpen"
      @submit-success="refreshAllData"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Plus, Timer, Money, User, Clock, VideoPause, Monitor, Search, RefreshRight } from '@element-plus/icons-vue';
import { listOrder, startTimingOrder, stopTimingOrder } from '../../../api/business/order.js';
import { getUserInfo } from '../../../api/auth/auth.js';
import { getPlaymate } from '../../../api/business/playmate.js';
import PlaymateAppOrderDialog from './component/PlaymateAppOrderDialog.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const stopLoading = ref(false);
const orderList = ref([]);
const total = ref(0);
const activeTab = ref('ALL');

// 关联当前陪玩ID
const currentPlaymateId = ref(null);

// 统计数据
const activeOrdersCount = ref(0);
const todayEstimateIncome = ref(0);
const totalBossesCount = ref(0);
const todayHours = ref(0);

// 进行中秒表关联
const currentTimingOrder = ref(null);
const liveTickerText = ref('00:00:00');
let timerInterval = null;

// 陪玩当前在线状态
const playmateOnlineStatus = ref('1');

// 模态框控制
const createModalOpen = ref(false);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  playmateId: undefined,
  orderNo: undefined,
  orderType: undefined,
  status: undefined,
  serviceType: undefined
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

/** 初始化获取当前登录陪玩的身份及在线状态 */
function initCurrentPlaymate() {
  return getUserInfo().then(res => {
    const userRes = res.result || res.data || res;
    const userId = userRes.user?.userId || userRes.userId;
    if (userId) {
      currentPlaymateId.value = userId;
      queryParams.playmateId = userId;
      getPlaymate(userId).then(pmRes => {
        const pmData = pmRes.result || pmRes.data || pmRes;
        if (pmData && pmData.onlineStatus !== undefined) {
          playmateOnlineStatus.value = String(pmData.onlineStatus);
        }
      }).catch(() => {});
    }
    return userId;
  }).catch(() => null);
}

/** 独立查询当前正处于 IN_SERVICE 状态的订单 (不受表格选项卡 Tab 筛选影响) */
function loadCurrentTimingOrder() {
  if (!currentPlaymateId.value) return;
  listOrder({
    playmateId: currentPlaymateId.value,
    statusStr: 'IN_SERVICE',
    pageIndex: 1,
    pageSize: 1
  }).then(res => {
    const resData = res.result || res.data || res;
    const records = resData.records || resData.list || [];
    if (records.length > 0) {
      currentTimingOrder.value = records[0];
      startLiveTimerTicker();
    } else {
      currentTimingOrder.value = null;
      if (timerInterval) clearInterval(timerInterval);
    }
  }).catch(() => {});
}

/** 独立计算当前陪玩的总体 KPI 统计数据 (不受表格选项卡 Tab 筛选及分页影响) */
function calculateKPIStats() {
  if (!currentPlaymateId.value) return;
  listOrder({
    playmateId: currentPlaymateId.value,
    pageIndex: 1,
    pageSize: 1000
  }).then(res => {
    const resData = res.result || res.data || res;
    const allOrders = resData.records || resData.list || [];

    activeOrdersCount.value = allOrders.filter(o => o.status === 'IN_SERVICE').length;
    let income = 0;
    let bossesSet = new Set();
    let hours = 0;

    allOrders.forEach(o => {
      if (o.totalAmount) income += Number(o.totalAmount);
      if (o.serviceHours) hours += Number(o.serviceHours);
      if (o.customers && o.customers.length) {
        o.customers.forEach(c => bossesSet.add(c.customerId));
      } else if (o.customerId) {
        bossesSet.add(o.customerId);
      }
    });

    todayEstimateIncome.value = income;
    totalBossesCount.value = bossesSet.size;
    todayHours.value = hours.toFixed(1);
  }).catch(() => {});
}

/** 查询当前 Tab 分页订单列表 */
function getList() {
  loading.value = true;
  if (!currentPlaymateId.value) {
    initCurrentPlaymate().then(() => {
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
    playmateId: queryParams.playmateId || currentPlaymateId.value,
    orderNo: queryParams.orderNo || undefined,
    orderType: queryParams.orderType || undefined,
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

/** 全量刷新页面相关数据 */
async function refreshAllData() {
  loading.value = true;
  await initCurrentPlaymate();
  loadCurrentTimingOrder();
  calculateKPIStats();
  doFetchList();
}

function handleQuery() {
  queryParams.pageIndex = 1;
  getList();
}

function resetQuery() {
  queryParams.orderNo = undefined;
  queryParams.orderType = undefined;
  queryParams.status = undefined;
  queryParams.serviceType = undefined;
  activeTab.value = 'ALL';
  handleQuery();
}

function handleTabClick(tab) {
  const name = tab ? (tab.props ? tab.props.name : tab.name) : activeTab.value;
  if (name === 'ALL') {
    queryParams.status = undefined;
  } else {
    queryParams.status = name;
  }
  handleQuery();
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

/** 打开创建订单 Modal */
function handleOpenCreateModal() {
  createModalOpen.value = true;
}

/** 发起开始计时 */
function handleStartTimer(order) {
  ElMessageBox.confirm(`确定要开始对订单 [${order.orderNo}] 计时吗？开始后将同步把您的在线状态更新为 [忙碌中]。`, '开始计时确认', {
    confirmButtonText: '立即开始',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    startTimingOrder(order.id).then(() => {
      ElMessage.success("已成功开始计时！");
      refreshAllData();
    });
  }).catch(() => {});
}

/** 结束计时并结算 */
function handleStopTimer(order) {
  ElMessageBox.confirm(`确定要结束订单 [${order.orderNo}] 的计时并结算吗？结束计时后系统将根据实际服务时长完成收益发放，并恢复在线状态。`, '结束计时确认', {
    confirmButtonText: '结束并结算',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    stopLoading.value = true;
    stopTimingOrder(order.id).then(() => {
      ElMessage.success("订单已完成结算，收益已自动发放！");
      refreshAllData();
    }).finally(() => {
      stopLoading.value = false;
    });
  }).catch(() => {});
}

function handleViewDetail(order) {
  ElMessageBox.alert(`
    <div style="text-align:left; font-size:14px; line-height:1.8;">
      <p><b>订单号：</b>${order.orderNo}</p>
      <p><b>服务类型：</b>${order.serviceType}</p>
      <p><b>模式：</b>${order.rentalType === 'CARPOOL' ? '拼车' : '包车'}</p>
      <p><b>每小时单价：</b>￥${formatAmount(order.hourlyRate)}</p>
      <p><b>已扣小时数：</b>${order.billedHours || 0} 小时</p>
      <p><b>状态：</b>${getStatusLabel(order.status)}</p>
      <p><b>备注：</b>${order.remark || '无'}</p>
    </div>
  `, '订单详情信息', {
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

onMounted(() => {
  refreshAllData();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.playmate-app-container {
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
  background: #e8f4ff;
  color: #409eff;
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

/* 状态切换 */
.status-toggle-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-label {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.dot-online { background-color: #67c23a; box-shadow: 0 0 6px rgba(103, 194, 58, 0.6); }
.dot-busy { background-color: #f56c6c; box-shadow: 0 0 6px rgba(245, 108, 108, 0.6); }
.dot-rest { background-color: #909399; }

.btn-create-order {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 20px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
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
.icon-income { background: #fef0f0; color: #f56c6c; }
.icon-boss { background: #fdf6ec; color: #e6a23c; }
.icon-hours { background: #f0f9eb; color: #67c23a; }

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

/* 秒表 HERO 卡片 - 白色简约风 */
.hero-timer-card {
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.rental-badge {
  font-weight: 700;
  font-size: 13px;
}

.order-no-text {
  font-family: monospace;
  font-size: 14px;
  color: #475569;
  font-weight: 600;
}

.timer-status-pulse {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #16a34a;
  font-weight: 700;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #16a34a;
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}

.timer-main-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 12px 18px;
}

.stopwatch-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clock-icon-anim {
  font-size: 34px;
  color: #0284c7;
  animation: spin-slow 8s linear infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ticker-text {
  font-family: "Courier New", Courier, monospace;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #0284c7;
}

.timer-meta-box {
  display: flex;
  gap: 24px;
  background: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-lbl {
  color: #64748b;
  font-size: 12px;
}

.meta-val {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
}

.timer-bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 14px;
  border: 1px solid #f1f5f9;
}

.participants-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.part-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.part-lbl {
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}

.part-val-none {
  font-size: 12px;
  color: #94a3b8;
}

.user-pill {
  border-radius: 4px;
}

.btn-stop-timer {
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

/* 订单表格区 */
.orders-section-card {
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
  padding-bottom: 8px;
}

.custom-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  color: #606266;
  height: 38px;
  line-height: 38px;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
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

.user-tags-inline {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
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

.chip-pm {
  background: #f0f9eb;
  color: #67c23a;
}

.price-val {
  color: #f56c6c;
  font-weight: 700;
  font-size: 14px;
}

.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-link {
  font-size: 14px;
  padding: 0;
  height: auto;
  margin: 0 !important;
}

.action-link-success {
  color: #67c23a;
}
.action-link-success:hover {
  color: #85ce61;
}

.action-link-danger {
  color: #f56c6c;
}
.action-link-danger:hover {
  color: #f78989;
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

:deep(.custom-dialog) {
  border-radius: 8px;
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
  font-weight: 600;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  border-radius: 4px;
}

.btn-submit {
  border-radius: 4px;
}

.text-primary { color: #409eff; }
.text-warning { color: #e6a23c; }
.text-muted { color: #909399; }
.font-medium { font-weight: 500; }
.font-mono { font-family: monospace; }
.mr-1 { margin-right: 4px; }
</style>
