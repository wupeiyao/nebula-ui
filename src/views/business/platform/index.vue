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

      <!-- 卡片 5: 全员累计在线总时长 -->
      <div class="kpi-card" @click="handleKpiClick('staff')">
        <div class="kpi-icon-wrapper icon-duration">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ formatMinutes(kpiData.totalOnlineDuration) }}</div>
          <div class="kpi-label">
            <span>全员累计在线时长</span>
            <el-icon class="arrow-icon"><Right /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 大屏核心数据区 -->
    <div class="insights-container">
      <!-- 陪玩状态概览 -->
      <div class="dashboard-card status-card">
        <div class="card-header">
          <el-icon class="header-icon text-success"><Monitor /></el-icon> 陪玩状态分布
        </div>
        <div class="status-grid">
          <div class="status-item online">
            <div class="st-label">在线</div>
            <div class="st-value text-success">{{ playmateStatusStats.online }}</div>
          </div>
          <div class="status-item busy">
            <div class="st-label">忙碌</div>
            <div class="st-value text-danger">{{ playmateStatusStats.busy }}</div>
          </div>
          <div class="status-item offline">
            <div class="st-label">离线</div>
            <div class="st-value text-info">{{ playmateStatusStats.offline }}</div>
          </div>
        </div>
      </div>

      <!-- 陪玩人员数据表格 -->
      <div class="dashboard-card table-card">
        <div class="card-header">
          <el-icon class="header-icon text-primary"><Service /></el-icon> 陪玩人员数据
        </div>
        <el-table
          :data="playmateList"
          style="width: 100%"
          class="playmate-dashboard-table"
          @row-click="goToPlaymate"
          stripe
          height="100%"
        >
          <el-table-column prop="user.username" label="用户名" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.user?.username || scope.row.username || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="user.nickname" label="昵称" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.user?.nickname || scope.row.nickname || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="onlineStatus" label="在线状态" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.onlineStatus === '1'" type="success" size="small">在线</el-tag>
              <el-tag v-else-if="scope.row.onlineStatus === '2'" type="danger" size="small">忙碌</el-tag>
              <el-tag v-else type="info" size="small">离线</el-tag>
            </template>
          </el-table-column>
          <!-- 累计上线时长字段展示 -->
          <el-table-column prop="onlineDuration" label="累计上线时长" min-width="140" align="center">
            <template #default="scope">
              <span class="duration-badge">
                {{ formatMinutes(scope.row.onlineDuration) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  User, Service, Document, Money, Right, Monitor, Timer
} from '@element-plus/icons-vue';
import { getDashboardKpi } from '../../../api/business/dashboard';
import { listPlaymate } from '../../../api/business/playmate.js';

const router = useRouter();

// 顶部 KPI 数据状态
const kpiData = ref({
  userTotal: 0,
  staffTotal: 0,
  orderTotal: 0,
  revenueTotal: 0,
  totalOnlineDuration: 0
});

// 陪玩列表及状态统计
const playmateList = ref([]);
const playmateStatusStats = ref({
  online: 0,
  busy: 0,
  offline: 0
});

// 格式化金额助手函数
const formatAmount = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val).toFixed(2);
};

// 格式化分钟数助手函数
const formatMinutes = (minutes) => {
  if (minutes == null || minutes <= 0) {
    return '0分钟';
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours > 0) {
    return rem > 0 ? `${hours}小时${rem}分` : `${hours}小时`;
  }
  return `${rem}分钟`;
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

// 获取陪玩列表及统计状态
const fetchPlaymateData = async () => {
  try {
    const res = await listPlaymate({ pageIndex: 1, pageSize: 1000 });
    const data = res.result || res.data || res;
    const records = data.records || data.list || [];
    
    // 只取前10条展示在表格中
    playmateList.value = records.slice(0, 10);
    
    // 统计状态
    let online = 0, busy = 0, offline = 0;
    records.forEach(p => {
      if (p.onlineStatus === '1') online++;
      else if (p.onlineStatus === '2') busy++;
      else offline++;
    });
    playmateStatusStats.value = { online, busy, offline };
  } catch (error) {
    console.error('获取陪玩列表失败:', error);
  }
};

// 跳转到陪玩界面
const goToPlaymate = () => {
  router.push({ name: 'Menu_menu_playmate' });
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
  fetchPlaymateData();
});
</script>

<style scoped>
/* 容器布局 */
.workbench-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #f4f6f9;
  padding: 24px;
  box-sizing: border-box;
  font-size: 16px;
  gap: 24px;
  overflow: hidden;
}

/* ================= 顶部 KPI 卡片网格布局 ================= */
.kpi-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  width: 100%;
}

.kpi-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
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
.icon-duration { background-color: #e6f7ff; color: #1890ff; }

.kpi-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-value {
  font-size: 26px;
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
  flex: 1;
  min-height: 0;
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

/* 通用文本颜色 */
.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }
.text-purple { color: #8e44ad; }

/* ================= 陪玩状态卡片 ================= */
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.status-item {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #f0f0f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  background: #ffffff;
  border-color: #ebeef5;
}

.st-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.st-value {
  font-size: 36px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* ================= 陪玩人员表格 ================= */
.table-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.table-card :deep(.el-table) {
  flex: 1;
  min-height: 0;
}

:deep(.playmate-dashboard-table .el-table__row) {
  cursor: pointer;
}

.duration-badge {
  display: inline-block;
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 14px;
}
</style>
