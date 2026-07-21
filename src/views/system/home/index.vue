<template>
  <div class="home-dashboard">
    <!-- 顶栏标题与快捷按钮 -->
    <div class="home-header">
      <h1 class="page-title">首页</h1>
      <div class="header-actions">
        <el-button type="primary" class="gradient-btn font-semibold">
          <el-icon class="mr-1"><Present /></el-icon> 每日签到
        </el-button>
        <el-button type="primary" class="primary-soft-btn font-semibold">
          <el-icon class="mr-1"><CreditCard /></el-icon> 续费订阅
        </el-button>
      </div>
    </div>

    <!-- 顶层三大核心数据指标卡片 -->
    <div class="metrics-grid">
      <!-- 卡片1: 钱包余额 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">钱包余额</span>
        </div>
        <div class="metric-value">
          <span class="num">0</span> <span class="unit">CNY</span>
        </div>
        <div class="metric-footer">
          <span class="percentage-tag success">100%</span>
          <span class="sub-text">上次记录 0 CNY</span>
        </div>
      </div>

      <!-- 卡片2: 流量统计 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">总流量 / 剩余流量</span>
        </div>
        <div class="metric-value">
          <span class="num font-bold">450 GB</span>
          <span class="divider">/</span>
          <span class="sub-num">346.28 GB</span>
        </div>
        <div class="metric-footer gap-3">
          <span class="percentage-tag info">
            <el-icon class="mr-0.5"><TopRight /></el-icon> 23%
          </span>
          <span class="sub-text">已使用 103.72 GB</span>
          <span class="online-tag">
            <el-icon class="mr-1"><Monitor /></el-icon> 在线设备: 1 / 5
          </span>
        </div>
      </div>

      <!-- 卡片3: 可用佣金 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">可用佣金</span>
        </div>
        <div class="metric-value">
          <span class="num">0</span> <span class="unit">CNY</span>
        </div>
        <div class="metric-footer">
          <span class="percentage-tag success">100%</span>
          <span class="sub-text">确认中佣金 0 CNY</span>
        </div>
      </div>
    </div>

    <!-- 中间区域：我的订阅与快捷导入 -->
    <div class="middle-grid">
      <!-- 左侧：我的订阅 -->
      <div class="panel-card flex-1">
        <div class="panel-header">
          <span class="panel-title">我的订阅</span>
          <el-button link type="primary" class="refresh-btn" @click="handleRefreshSub">
            <el-icon class="mr-1"><Refresh /></el-icon> 刷新订阅
          </el-button>
        </div>

        <div class="sub-info-box">
          <div class="sub-title font-semibold">不限时流量 Small</div>
          <div class="sub-tip">该订阅长期有效！</div>
        </div>

        <div class="quick-ops">
          <div class="ops-title">快捷操作：</div>
          
          <div class="op-item">
            <div class="op-icon-wrapper blue">
              <el-icon><Reading /></el-icon>
            </div>
            <div class="op-desc">
              <div class="op-name font-semibold">知识文库</div>
              <div class="op-sub">学习如何使用客户端和节点</div>
            </div>
            <el-button type="primary" class="op-btn">
              查看教程 <el-icon class="ml-1"><TopRight /></el-icon>
            </el-button>
          </div>

          <div class="op-item">
            <div class="op-icon-wrapper indigo">
              <el-icon><RefreshRight /></el-icon>
            </div>
            <div class="op-desc">
              <div class="op-name font-semibold">流量重置</div>
              <div class="op-sub">流量用完后重置流量以继续使用</div>
            </div>
            <el-button type="primary" class="op-btn">
              重置流量 <el-icon class="ml-1"><TopRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：快捷导入订阅 -->
      <div class="panel-card flex-1 relative-panel">
        <!-- 悬浮公告提示泡 -->
        <div v-if="showNotice" class="notice-floating-toast">
          <span>快点我！阅读公告哦！</span>
          <span class="close-x" @click="showNotice = false">×</span>
        </div>

        <div class="panel-header">
          <span class="panel-title">快捷导入订阅</span>
        </div>

        <!-- 导入按钮流 -->
        <div class="import-buttons-row">
          <el-button type="primary" class="imp-btn b-blue">
            <el-icon class="mr-1"><Link /></el-icon> 一键链接
          </el-button>
          <el-button type="success" class="imp-btn b-teal">
            <el-icon class="mr-1"><Crop /></el-icon> 二维码导入
          </el-button>
          <el-button type="success" class="imp-btn b-emerald">
            <el-icon class="mr-1"><Promotion /></el-icon> 导入 sing-box
          </el-button>
          <el-button type="warning" class="imp-btn b-purple">
            <el-icon class="mr-1"><Position /></el-icon> 导入 Shadowrocket
          </el-button>
          <el-button type="danger" class="imp-btn b-magenta">
            <el-icon class="mr-1"><Connection /></el-icon> 导入 Stash
          </el-button>
          <el-button type="warning" class="imp-btn b-orange">
            <el-icon class="mr-1"><Compass /></el-icon> 导入 Clash
          </el-button>
        </div>

        <!-- 客户端下载区块 -->
        <div class="clients-section">
          <div class="clients-title">客户端下载</div>
          <div class="clients-grid">
            <div v-for="client in clientList" :key="client.name" class="client-card">
              <el-icon class="client-icon"><component :is="client.icon" /></el-icon>
              <span class="client-name">{{ client.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部区域：流量走向与订阅套餐 -->
    <div class="bottom-grid">
      <!-- 流量走向图表卡片 -->
      <div class="panel-card flex-2">
        <div class="panel-header">
          <div class="chart-header-title">
            <span class="panel-title">流量走向(M)</span>
            <el-icon class="info-help-icon"><QuestionFilled /></el-icon>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="dot download"></span> 下载</span>
            <span class="legend-item"><span class="dot upload"></span> 上传</span>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="mock-line-chart">
            <svg viewBox="0 0 500 120" class="svg-line">
              <path d="M 0 100 Q 150 80, 250 110 T 500 70" fill="none" stroke="#3b82f6" stroke-width="3" />
              <path d="M 0 110 Q 180 105, 300 115 T 500 100" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="4,4" />
            </svg>
          </div>
          <div class="chart-axis-y">3600 MB</div>
        </div>
      </div>

      <!-- 订阅套餐卡片 -->
      <div class="panel-card flex-1 flex-col-center">
        <div class="package-banner">
          <div class="package-icon-box">
            <el-icon><Scissor /></el-icon>
          </div>
          <div class="package-info">
            <div class="package-title">订阅套餐</div>
            <div class="package-sub">购买新的套餐 <el-icon><ArrowRight /></el-icon></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Present, CreditCard, Refresh, Reading, RefreshRight, TopRight,
  Monitor, Link, Crop, Promotion, Position, Connection, Compass,
  QuestionFilled, Scissor, ArrowRight, Platform, Cellphone, Download, Cpu, Setting
} from '@element-plus/icons-vue';

const showNotice = ref(true);

const clientList = [
  { name: 'Windows', icon: 'Platform' },
  { name: 'Android', icon: 'Cellphone' },
  { name: '苹果', icon: 'Download' },
  { name: 'Mac AMD', icon: 'Monitor' },
  { name: 'Mac ARM', icon: 'Monitor' },
  { name: 'Linux', icon: 'Cpu' },
  { name: 'Openwrt', icon: 'Setting' }
];

const handleRefreshSub = () => {
  ElMessage.success('订阅状态已刷新！');
};
</script>

<style scoped>
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 页头 */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.gradient-btn {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 10px 20px !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.primary-soft-btn {
  background-color: #3b82f6 !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 10px 20px !important;
}

/* 指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.metric-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-value .num {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.metric-value .sub-num {
  font-size: 20px;
  font-weight: 600;
  color: #334155;
}

.metric-value .unit {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
}

.metric-value .divider {
  font-size: 20px;
  color: #cbd5e1;
}

.metric-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.percentage-tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
}

.percentage-tag.success {
  background-color: #f0fdf4;
  color: #16a34a;
}

.percentage-tag.info {
  background-color: #f0f9ff;
  color: #0284c7;
}

.sub-text {
  color: #94a3b8;
}

.online-tag {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 8px;
  border-radius: 6px;
  color: #475569;
  font-size: 12px;
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* 中间区域面板 */
.middle-grid {
  display: flex;
  gap: 20px;
}

.panel-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.sub-info-box {
  margin-bottom: 20px;
}

.sub-title {
  font-size: 15px;
  color: #1e293b;
}

.sub-tip {
  font-size: 13px;
  color: #60a5fa;
  margin-top: 4px;
}

.quick-ops {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ops-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.op-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: #fafafa;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}

.op-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.op-icon-wrapper.blue {
  background-color: #dbeafe;
  color: #2563eb;
}

.op-icon-wrapper.indigo {
  background-color: #e0e7ff;
  color: #4f46e5;
}

.op-desc {
  flex: 1;
}

.op-name {
  font-size: 14px;
  color: #0f172a;
}

.op-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.op-btn {
  border-radius: 8px !important;
  background-color: #3b82f6 !important;
  border: none !important;
}

/* 快捷导入与客户端 */
.relative-panel {
  position: relative;
}

.notice-floating-toast {
  position: absolute;
  top: -12px;
  right: 20px;
  background-color: #1e293b;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

.close-x {
  cursor: pointer;
  opacity: 0.7;
}

.close-x:hover {
  opacity: 1;
}

.import-buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.imp-btn {
  border: none !important;
  border-radius: 8px !important;
  padding: 10px 14px !important;
  font-weight: 500;
}

.b-blue { background-color: #2563eb !important; color: #ffffff !important; }
.b-teal { background-color: #0d9488 !important; color: #ffffff !important; }
.b-emerald { background-color: #059669 !important; color: #ffffff !important; }
.b-purple { background-color: #7c3aed !important; color: #ffffff !important; }
.b-magenta { background-color: #c026d3 !important; color: #ffffff !important; }
.b-orange { background-color: #ea580c !important; color: #ffffff !important; }

.clients-section {
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

.clients-title {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 16px;
}

.clients-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.client-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.client-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.client-icon {
  font-size: 24px;
  color: #1e293b;
}

.client-name {
  font-size: 12px;
  color: #475569;
}

/* 底部区域 */
.bottom-grid {
  display: flex;
  gap: 20px;
}

.chart-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-help-icon {
  color: #94a3b8;
  font-size: 16px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.download { background-color: #3b82f6; }
.dot.upload { background-color: #93c5fd; }

.chart-placeholder {
  height: 120px;
  position: relative;
}

.svg-line {
  width: 100%;
  height: 100px;
}

.chart-axis-y {
  position: absolute;
  bottom: 0;
  left: 0;
  font-size: 11px;
  color: #cbd5e1;
}

.flex-col-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.package-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 16px 24px;
  border-radius: 12px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  width: 100%;
  transition: all 0.2s ease;
}

.package-banner:hover {
  background-color: #f0f6ff;
  border-color: #bfdbfe;
}

.package-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #dbeafe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.package-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.package-sub {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .middle-grid, .bottom-grid {
    flex-direction: column;
  }
  .clients-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
