<template>
  <div class="playmate-customer-container">
    <!-- 顶部 Header 卡片 -->
    <div class="app-header-card">
      <div class="header-left">
        <div class="app-title-box">
          <div class="app-icon-wrapper">
            <el-icon><User /></el-icon>
          </div>
          <div class="app-title-text">
            <h2>陪玩专享老板客户库</h2>
            <p>浏览全站老板动态与资产余额 · 快速拉入工作区发起全新订单</p>
          </div>
        </div>
      </div>

      <div class="header-right">
        <el-button type="primary" size="default" class="btn-goto-workstation" @click="handleGoToWorkstation">
          <el-icon class="mr-1"><Monitor /></el-icon> 返回陪玩工作台
        </el-button>
        <el-button class="btn-refresh" @click="getList">
          <el-icon class="mr-1"><Refresh /></el-icon> 刷新老板列表
        </el-button>
      </div>
    </div>

    <!-- 筛选与搜索工具栏卡片 -->
    <div class="customer-section-card">
      <div class="section-filter-bar">
        <div class="filter-left-title">
          <span class="filter-title-text">老板数据列表</span>
          <el-tag type="info" effect="plain" class="total-tag">全站共 {{ total }} 位老板</el-tag>
        </div>

        <div class="filter-right-inputs">
          <el-input
            v-model="queryParams.username"
            placeholder="搜索老板用户名"
            clearable
            style="width: 180px;"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />

          <el-input
            v-model="queryParams.nickname"
            placeholder="搜索老板昵称"
            clearable
            style="width: 180px;"
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

      <!-- 客户数据表格区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="customerList"
          class="nebula-modern-table"
          border
          height="100%"
          stripe
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column label="老板基本信息" min-width="200">
            <template #default="scope">
              <div class="user-profile-cell">
                <div class="user-avatar-circle">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="user-meta-info">
                  <span class="user-nickname">{{ scope.row.user?.nickname || scope.row.nickname || '未设置昵称' }}</span>
                  <span class="user-username">@{{ scope.row.user?.username || scope.row.username || scope.row.userId }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="vipLevel" label="VIP 等级" width="110" align="center">
            <template #default="scope">
              <el-tag type="warning" effect="dark" size="small" class="vip-badge">
                VIP {{ scope.row.vipLevel || 0 }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="walletBalance" label="钱包可用余额" width="150" align="center">
            <template #default="scope">
              <span class="price-val">￥{{ formatAmount(scope.row.walletBalance) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="累计消费" width="130" align="center">
            <template #default="scope">
              <span class="consume-val">￥{{ formatAmount(scope.row.totalConsume) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="联系电话" width="140" align="center">
            <template #default="scope">
              <span class="font-mono">{{ scope.row.user?.mobile || scope.row.mobile || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="注册时间" min-width="160" align="center" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="170" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                link
                class="action-add-btn"
                @click="handleAddToWorkspace(scope.row)"
              >
                <el-icon class="mr-1"><Plus /></el-icon> 添加到工作区
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页栏 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条老板客户记录</span>
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

    <!-- 发起创建订单 Modal 对话框组件 (预填选中的老板) -->
    <PlaymateAppOrderDialog
      v-model:visible="createModalOpen"
      :initial-customer="selectedCustomer"
      @submit-success="handleOrderCreatedSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { User, Monitor, Refresh, Search, RefreshRight, UserFilled, Plus } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { listCustomer } from '../../../api/business/customer.js';
import PlaymateAppOrderDialog from './component/PlaymateAppOrderDialog.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const customerList = ref([]);
const total = ref(0);

const createModalOpen = ref(false);
const selectedCustomer = ref(null);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  username: undefined,
  nickname: undefined
});

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

/** 获取老板客户列表 */
function getList() {
  loading.value = true;
  const req = {
    pageIndex: queryParams.pageIndex,
    pageSize: queryParams.pageSize,
    username: queryParams.username || undefined,
    nickname: queryParams.nickname || undefined
  };

  listCustomer(req).then(res => {
    const resData = res.result || res.data || res;
    customerList.value = resData.records || resData.list || [];
    total.value = resData.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.pageIndex = 1;
  getList();
}

function resetQuery() {
  queryParams.username = undefined;
  queryParams.nickname = undefined;
  handleQuery();
}

/** 一键添加到工作区并发起全新订单 (防误触弹窗提示) */
function handleAddToWorkspace(row) {
  const bossName = row.user?.nickname || row.nickname || row.username || row.userId;
  const userName = row.user?.username || row.username || row.userId;

  ElMessageBox.confirm(
    `确定要将老板 [${bossName}] (@${userName}) 添加到工作区并快速发起订单吗？`,
    '快速加入工作区确认',
    {
      confirmButtonText: '确定添加并发起',
      cancelButtonText: '取消',
      type: 'primary'
    }
  ).then(() => {
    selectedCustomer.value = row;
    createModalOpen.value = true;
  }).catch(() => {});
}

/** 订单发起成功后的后续引导 */
function handleOrderCreatedSuccess() {
  getList();
  ElMessageBox.confirm('订单已成功发起并加入您的工作区！是否立即前往【陪玩工作台】查看订单并开始计时？', '订单已加入工作区', {
    confirmButtonText: '前往工作台',
    cancelButtonText: '留在此页面',
    type: 'success'
  }).then(() => {
    handleGoToWorkstation();
  }).catch(() => {});
}

/** 跳转返回陪玩工作台 index.vue */
function handleGoToWorkstation() {
  router.push('/business/playmateApp').catch(() => {
    router.push('/playmateApp');
  });
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.playmate-customer-container {
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
  background: #f0f7ff;
  color: #0284c7;
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
  gap: 12px;
}

.btn-goto-workstation {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 18px;
}

.btn-refresh {
  border-radius: 8px;
}

/* 客户列表主卡片区 */
.customer-section-card {
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

/* 数据表格容器 */
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

.user-profile-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.user-meta-info {
  display: flex;
  flex-direction: column;
}

.user-nickname {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.user-username {
  font-size: 12px;
  color: #64748b;
  font-family: monospace;
}

.vip-badge {
  font-weight: 700;
}

.price-val {
  color: #f56c6c;
  font-weight: 800;
  font-size: 14px;
}

.consume-val {
  color: #67c23a;
  font-weight: 700;
}

.action-add-btn {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.action-add-btn:hover {
  color: #66b1ff;
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

.font-mono { font-family: monospace; }
.mr-1 { margin-right: 4px; }
</style>
