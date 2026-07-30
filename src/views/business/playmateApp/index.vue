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

        <el-button type="info" plain size="default" class="btn-customer-lib" @click="handleGoToCustomerList">
          <el-icon class="mr-1"><User /></el-icon> 客户库
        </el-button>

        <el-button type="warning" plain size="default" class="btn-flow-lib" @click="handleGoToFlowList">
          <el-icon class="mr-1"><Money /></el-icon> 我的流水
        </el-button>

        <el-button type="success" size="default" class="btn-batch-start" :loading="batchStartLoading" @click="handleBatchStartTimer">
          <el-icon class="mr-1"><VideoPlay /></el-icon> 一键开始全部计时
        </el-button>

        <el-button type="danger" size="default" class="btn-batch-stop" :loading="batchStopLoading" @click="handleBatchStopTimer">
          <el-icon class="mr-1"><VideoPause /></el-icon> 一键全部结束计时
        </el-button>

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

          <el-table-column label="实时计时" width="130" align="center">
            <template #default="scope">
              <template v-if="scope.row.status === 'IN_SERVICE'">
                <el-tag type="danger" effect="light" class="live-timer-tag">
                  <span class="pulse-dot-small"></span>
                  <span class="font-mono font-bold">{{ getTimingDurationText(scope.row) }}</span>
                </el-tag>
              </template>
              <template v-else-if="scope.row.status === 'COMPLETED'">
                <span class="text-muted">{{ scope.row.serviceHours !== undefined && scope.row.serviceHours !== null ? scope.row.serviceHours + 'h' : (scope.row.billedHours ? scope.row.billedHours + 'h' : '-') }}</span>
              </template>
              <template v-else>
                <span class="text-muted">-</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="服务时长/收益" width="140" align="center">
            <template #default="scope">
              <span>{{ scope.row.serviceHours !== undefined && scope.row.serviceHours !== null ? scope.row.serviceHours : (scope.row.billedHours || 0) }}h / ￥{{ formatAmount(scope.row.totalAmount) }}</span>
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
import { useRouter } from 'vue-router';
import { Plus, Timer, Money, User, Clock, VideoPlay, VideoPause, Monitor, Search, RefreshRight } from '@element-plus/icons-vue';
import { listOrder, startTimingOrder, stopTimingOrder } from '../../../api/business/order.js';
import { getUserInfo } from '../../../api/auth/auth.js';
import { getPlaymate } from '../../../api/business/playmate.js';
import PlaymateAppOrderDialog from './component/PlaymateAppOrderDialog.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const loading = ref(false);

function handleGoToCustomerList() {
  router.push('/business/playmateApp/customer').catch(() => {
    router.push('/business/playmateCustomer');
  });
}

function handleGoToFlowList() {
  router.push('/business/playmateApp/flow').catch(() => {
    router.push('/business/playmateFlow');
  });
}
const stopLoading = ref(false);
const batchStartLoading = ref(false);
const batchStopLoading = ref(false);
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

// 动态计时 tick
const nowTime = ref(Date.now());
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

/** 计算单条订单实时已计时时长 */
function getTimingDurationText(row) {
  if (row.status === 'IN_SERVICE') {
    if (!row.startTime) return '00:00:00';
    const startMs = new Date(row.startTime).getTime();
    if (isNaN(startMs)) return '00:00:00';
    const diffSec = Math.max(0, Math.floor((nowTime.value - startMs) / 1000));
    return formatSecondsToHMS(diffSec);
  }
  return '-';
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

/** 计算陪玩实际净服务时长 (合并同一时间段/拼车多订单的重叠时长) */
function calculateNetServiceHours(orders) {
  if (!orders || orders.length === 0) return 0;
  const intervals = [];
  let fallbackHours = 0;

  orders.forEach(o => {
    if (o.status !== 'IN_SERVICE' && o.status !== 'COMPLETED') return;

    let startMs = o.startTime ? new Date(o.startTime).getTime() : null;
    let endMs = o.endTime ? new Date(o.endTime).getTime() : null;

    if (startMs && !isNaN(startMs)) {
      if (!endMs || isNaN(endMs)) {
        if (o.status === 'IN_SERVICE') {
          endMs = Date.now();
        } else if (o.serviceHours) {
          endMs = startMs + Math.round(Number(o.serviceHours) * 3600 * 1000);
        } else {
          endMs = startMs;
        }
      }
      if (endMs > startMs) {
        intervals.push([startMs, endMs]);
        return;
      }
    }

    if (o.serviceHours && Number(o.serviceHours) > 0) {
      fallbackHours += Number(o.serviceHours);
    }
  });

  if (intervals.length === 0) {
    return fallbackHours;
  }

  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = intervals[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  let totalMs = 0;
  merged.forEach(([start, end]) => {
    totalMs += (end - start);
  });

  return (totalMs / (1000 * 3600)) + fallbackHours;
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

    allOrders.forEach(o => {
      if (o.totalAmount) income += Number(o.totalAmount);
      if (o.customers && o.customers.length) {
        o.customers.forEach(c => bossesSet.add(c.customerId));
      } else if (o.customerId) {
        bossesSet.add(o.customerId);
      }
    });

    todayEstimateIncome.value = income;
    totalBossesCount.value = bossesSet.size;

    const netHours = calculateNetServiceHours(allOrders);
    todayHours.value = netHours.toFixed(1);
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

/** 一键开始全部待计时订单 */
async function handleBatchStartTimer() {
  if (!currentPlaymateId.value) return;
  try {
    const res = await listOrder({ playmateId: currentPlaymateId.value, pageSize: 100 });
    const resData = res.result || res.data || res;
    const allOrders = resData.records || resData.list || [];
    const waitingOrders = allOrders.filter(o => ['WAITING_START', 'CREATED', 'UNPAID', 'PAID'].includes(o.status));
    
    if (waitingOrders.length === 0) {
      ElMessage.warning('当前没有需要开始计时的订单');
      return;
    }
    
    await ElMessageBox.confirm(`确定要为所有未计时订单（共 ${waitingOrders.length} 笔）一键开始计时吗？开始后在线状态将更新为【忙碌中】。`, '一键开始计时确认', {
      confirmButtonText: '一键开始',
      cancelButtonText: '取消',
      type: 'success'
    });

    batchStartLoading.value = true;
    const promises = waitingOrders.map(o => startTimingOrder(o.id));
    await Promise.all(promises);
    ElMessage.success(`已成功为 ${waitingOrders.length} 笔订单开始计时！`);
    refreshAllData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '一键开始计时操作失败');
    }
  } finally {
    batchStartLoading.value = false;
  }
}

/** 一键结束全部进行中订单 */
async function handleBatchStopTimer() {
  if (!currentPlaymateId.value) return;
  try {
    const res = await listOrder({ playmateId: currentPlaymateId.value, pageSize: 100 });
    const resData = res.result || res.data || res;
    const allOrders = resData.records || resData.list || [];
    const inServiceOrders = allOrders.filter(o => o.status === 'IN_SERVICE');
    
    if (inServiceOrders.length === 0) {
      ElMessage.warning('当前没有正在计时的订单');
      return;
    }
    
    await ElMessageBox.confirm(`确定要将所有进行中的订单（共 ${inServiceOrders.length} 笔）一键结束计时并完成结算吗？`, '一键结束计时确认', {
      confirmButtonText: '一键结束结算',
      cancelButtonText: '取消',
      type: 'warning'
    });

    batchStopLoading.value = true;
    const promises = inServiceOrders.map(o => stopTimingOrder(o.id));
    await Promise.all(promises);
    ElMessage.success(`已成功结束 ${inServiceOrders.length} 笔订单的计时并完成结算！`);
    refreshAllData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '一键结束计时操作失败');
    }
  } finally {
    batchStopLoading.value = false;
  }
}

function handleViewDetail(order) {
  ElMessageBox.alert(`
    <div style="text-align:left; font-size:14px; line-height:1.8;">
      <p><b>订单号：</b>${order.orderNo}</p>
      <p><b>服务类型：</b>${order.serviceType}</p>
      <p><b>模式：</b>${order.rentalType === 'CARPOOL' ? '拼车' : '包车'}</p>
      <p><b>每小时单价：</b>￥${formatAmount(order.hourlyRate)}</p>
      <p><b>服务时长/已扣小时数：</b>${order.serviceHours !== undefined && order.serviceHours !== null ? order.serviceHours : (order.billedHours || 0)} 小时</p>
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
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    nowTime.value = Date.now();
  }, 1000);
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

.btn-batch-start,
.btn-batch-stop {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 16px;
}

.btn-batch-start {
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.25);
}

.btn-batch-stop {
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.25);
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
.font-bold { font-weight: 700; }
.font-mono { font-family: monospace; }
.mr-1 { margin-right: 4px; }

.live-timer-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  padding: 0 8px;
}

.pulse-dot-small {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f56c6c;
  animation: pulse-ring-small 1.5s infinite;
}

@keyframes pulse-ring-small {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(245, 108, 108, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 108, 108, 0); }
}
</style>
