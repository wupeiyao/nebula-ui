<template>
  <div class="workbench-container">
    <!-- 顶部 KPI 数据概览卡片区 -->
    <div class="kpi-cards-grid">
      <!-- 卡片 1: 用户总数 -->
      <div class="kpi-card" @click="handleKpiClick('user')">
        <div class="kpi-icon-wrapper icon-user">
          <el-icon><User /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.userTotal || 0 }}</div>
          <div class="kpi-label">
            <span>用户总数</span>
            <el-icon class="arrow-icon"><Right /></el-icon>
          </div>
        </div>
      </div>

      <!-- 卡片 2: 工作人员总数 -->
      <div class="kpi-card" @click="handleKpiClick('staff')">
        <div class="kpi-icon-wrapper icon-staff">
          <el-icon><Service /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.staffTotal || 0 }}</div>
          <div class="kpi-label">
            <span>陪玩总数</span>
            <el-icon class="arrow-icon"><Right /></el-icon>
          </div>
        </div>
      </div>

      <!-- 卡片 3: 总订单数 -->
      <div class="kpi-card" @click="handleKpiClick('order')">
        <div class="kpi-icon-wrapper icon-order">
          <el-icon><Document /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.orderTotal || 0 }}</div>
          <div class="kpi-label">
            <span>总订单数</span>
            <el-icon class="arrow-icon"><Right /></el-icon>
          </div>
        </div>
      </div>

      <!-- 卡片 4: 平台总流水 -->
      <div class="kpi-card" @click="handleKpiClick('revenue')">
        <div class="kpi-icon-wrapper icon-revenue">
          <el-icon><Money /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">￥{{ formatAmount(kpiData.revenueTotal) }}</div>
          <div class="kpi-label">
            <span>平台总流水</span>
            <el-icon class="arrow-icon"><Right /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 大屏核心数据区 -->
    <div class="insights-container">
      <!-- 今日数据快照 -->
      <div class="dashboard-card snapshot-card">
        <div class="card-header">
          <el-icon class="header-icon text-primary"><DataLine /></el-icon> 今日数据概览
        </div>
        <div class="snapshot-grid">
          <div class="snapshot-item">
            <div class="s-label">今日营业额</div>
            <div class="s-value text-primary">￥{{ formatAmount(statsData.todayTurnover) }}</div>
          </div>
          <div class="snapshot-item">
            <div class="s-label">今日平台收益</div>
            <div class="s-value text-success">￥{{ formatAmount(statsData.todayPlatformCommission) }}</div>
          </div>
          <div class="snapshot-item">
            <div class="s-label">今日充值总计</div>
            <div class="s-value text-warning">￥{{ formatAmount(statsData.todayRecharge) }}</div>
          </div>
          <div class="snapshot-item">
            <div class="s-label">今日总资金流转</div>
            <div class="s-value text-purple">￥{{ formatAmount(statsData.todayTotalFlowAmount) }}</div>
          </div>
        </div>
      </div>

      <!-- 数据排行榜 -->
      <div class="rankings-wrapper">
        <!-- 陪玩收入榜 -->
        <div class="dashboard-card ranking-card">
          <div class="card-header">
            <el-icon class="header-icon text-warning"><Trophy /></el-icon> 陪玩收入排行榜 Top 10
          </div>
          <div class="ranking-list" v-if="statsData.playmateIncomeRanking && statsData.playmateIncomeRanking.length">
            <div class="ranking-item" v-for="(item, index) in statsData.playmateIncomeRanking" :key="index">
              <div class="r-rank" :class="{'top-3': index < 3}">{{ index + 1 }}</div>
              <div class="r-avatar">
                <img :src="item.avatarUrl || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              </div>
              <div class="r-info">
                <div class="r-name">{{ item.nickname || '匿名陪玩' }}</div>
                <div class="r-count">共 {{ item.count || 0 }} 单收益</div>
              </div>
              <div class="r-amount">￥{{ formatAmount(item.totalAmount) }}</div>
            </div>
          </div>
          <div class="empty-state" v-else>暂无陪玩收入数据</div>
        </div>

        <!-- 客户消费榜 -->
        <div class="dashboard-card ranking-card">
          <div class="card-header">
            <el-icon class="header-icon text-danger"><Star /></el-icon> 客户消费排行榜 Top 10
          </div>
          <div class="ranking-list" v-if="statsData.customerConsumeRanking && statsData.customerConsumeRanking.length">
            <div class="ranking-item" v-for="(item, index) in statsData.customerConsumeRanking" :key="index">
              <div class="r-rank" :class="{'top-3': index < 3}">{{ index + 1 }}</div>
              <div class="r-avatar">
                <img :src="item.avatarUrl || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              </div>
              <div class="r-info">
                <div class="r-name">{{ item.nickname || '匿名客户' }}</div>
                <div class="r-count">共 {{ item.count || 0 }} 笔消费</div>
              </div>
              <div class="r-amount text-primary">￥{{ formatAmount(item.totalAmount) }}</div>
            </div>
          </div>
          <div class="empty-state" v-else>暂无客户消费数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  User, Service, Document, Money, Right, Trophy, Star, DataLine
} from '@element-plus/icons-vue';
import { getDashboardKpi } from '../../../api/business/dashboard';
import { getFundStatistics } from '../../../api/business/fundFlow';

const router = useRouter();

// 顶部 KPI 数据状态
const kpiData = ref({
  userTotal: 0,
  staffTotal: 0,
  orderTotal: 0,
  revenueTotal: 0
});

// 大屏统计图表数据状态
const statsData = ref({
  todayTurnover: 0,
  todayPlatformCommission: 0,
  todayRecharge: 0,
  todayTotalFlowAmount: 0,
  playmateIncomeRanking: [],
  customerConsumeRanking: []
});

// 格式化金额助手函数
const formatAmount = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val).toFixed(2);
};

// 获取KPI数据
const fetchDashboardKpi = async () => {
  try {
    const res = await getDashboardKpi();
    if (res && res.result) {
      kpiData.value = res.result;
    } else if (res && res.data) {
      kpiData.value = res.data;
    }
  } catch (error) {
    console.error('获取Dashboard KPI失败:', error);
  }
};

// 获取大屏核心指标及排行榜
const fetchStatistics = async () => {
  try {
    const res = await getFundStatistics();
    if (res && res.result) {
      statsData.value = res.result;
    } else if (res && res.data) {
      statsData.value = res.data;
    }
  } catch (error) {
    console.error('获取资金流水统计失败:', error);
  }
};

// KPI卡片点击跳转列表页
const handleKpiClick = (type) => {
  const routeMap = {
    user: { name: 'Menu_menu_customer' },
    staff: { name: 'Menu_menu_playmate' },
    order: { name: 'Menu_menu_order' },
    revenue: { name: 'Menu_menu_fund_flow' }
  };
  if (routeMap[type]) {
    router.push(routeMap[type]);
  }
};

onMounted(() => {
  fetchDashboardKpi();
  fetchStatistics();
});
</script>

<style scoped>
/* 容器布局 */
.workbench-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background-color: #f4f6f9;
  padding: 24px;
  box-sizing: border-box;
  font-size: 16px;
  gap: 24px;
}

/* ================= 顶部 KPI 卡片网格布局 ================= */
.kpi-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
}

.kpi-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.kpi-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  transition: transform 0.3s;
}

.kpi-card:hover .kpi-icon-wrapper {
  transform: scale(1.05);
}

.icon-user { background-color: #e8f4ff; color: #409eff; }
.icon-staff { background-color: #e8f8f0; color: #67c23a; }
.icon-order { background-color: #fdf6ec; color: #e6a23c; }
.icon-revenue { background-color: #f4ecf5; color: #8e44ad; }

.kpi-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.kpi-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #909399;
  margin-top: 6px;
}

.arrow-icon {
  font-size: 14px;
  transition: transform 0.2s ease, color 0.2s;
}

.kpi-card:hover .arrow-icon {
  transform: translateX(6px);
  color: #409eff;
}

/* ================= 大屏核心数据区 ================= */
.insights-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 22px;
}

/* 今日数据快照 */
.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.snapshot-item {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #f0f0f0;
}

.snapshot-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  background: #ffffff;
  border-color: #ebeef5;
}

.s-label {
  font-size: 15px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.s-value {
  font-size: 32px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 通用文本颜色 */
.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }
.text-purple { color: #8e44ad; }

/* ================= 数据排行榜 ================= */
.rankings-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fafbfc;
  border-radius: 10px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.ranking-item:hover {
  background: #ffffff;
  border-color: #ebeef5;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateX(4px);
}

.r-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  color: #909399;
  background: #e4e7ed;
  margin-right: 16px;
  flex-shrink: 0;
}

.r-rank.top-3 {
  color: #ffffff;
}

/* 金银铜牌渐变与阴影 */
.ranking-item:nth-child(1) .r-rank {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  box-shadow: 0 4px 10px rgba(253, 160, 133, 0.4);
}
.ranking-item:nth-child(2) .r-rank {
  background: linear-gradient(135deg, #e2ebf0 0%, #cfd9df 100%);
  color: #5c6b77;
  box-shadow: 0 4px 10px rgba(207, 217, 223, 0.6);
}
.ranking-item:nth-child(3) .r-rank {
  background: linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%);
  color: #9e7f5b;
  box-shadow: 0 4px 10px rgba(227, 238, 255, 0.6);
}

.r-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.r-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.r-info {
  flex: 1;
  min-width: 0;
}

.r-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-count {
  font-size: 13px;
  color: #909399;
}

.r-amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
  font-family: Monaco, Consolas, "Courier New", monospace;
  margin-left: 16px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #909399;
  font-size: 15px;
  background: #fafafa;
  border-radius: 8px;
}
</style>
