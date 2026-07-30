<template>
  <el-dialog
    v-model="dialogVisible"
    width="940px"
    align-center
    append-to-body
    destroy-on-close
    class="custom-dialog playmate-order-dialog"
  >
    <!-- 顶部 Minimal 头部设计 -->
    <template #header>
      <div class="dialog-minimal-header">
        <div class="header-main-info">
          <div class="header-avatar-badge">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="header-text-group">
            <div class="header-title-row">
              <span class="main-title">发起全新订单</span>
              <el-tag type="primary" effect="light" size="small" class="live-tag">
                <span class="dot-flash"></span> 订单管理
              </el-tag>
            </div>
            <p class="sub-title">租赁模式与单价由字典自动结算 · 智能按老板人数切换包车/拼车</p>
          </div>
        </div>
      </div>
    </template>

    <div class="dialog-content-body">
      <el-form ref="orderFormRef" :model="createForm" label-position="top" class="order-create-form">
        
        <!-- 1. 基础配置与游戏项目卡片 -->
        <div class="form-card-section">
          <div class="card-section-header">
            <div class="csh-title">
              <div class="csh-icon-box bg-blue">
                <el-icon><PriceTag /></el-icon>
              </div>
              <span>核心配置与服务项目</span>
            </div>
<!--            <span class="csh-sub"></span>-->
          </div>

          <div class="card-section-body">
            <div class="form-grid-two">
              <el-form-item label="服务游戏 / 陪玩项目" prop="serviceType" required class="custom-form-item">
                <el-select v-model="createForm.serviceType" placeholder="请选择服务项目" filterable class="custom-select">
                  <el-option
                    v-for="dict in gameTypeOptions"
                    :key="dict.dictCode || dict.dictValue"
                    :label="dict.dictLabel"
                    :value="dict.dictValue"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="租赁结算模式" class="custom-form-item">
                <div class="mode-price-showcase">
                  <el-radio-group v-model="createForm.rentalType" @change="handleRentalTypeChange" size="default">
                    <el-radio-button label="CHARTER" :disabled="selectedBossList.length > 1">包车模式</el-radio-button>
                    <el-radio-button label="CARPOOL">拼车模式</el-radio-button>
                  </el-radio-group>

                  <div class="price-chip-box">
                    <span class="chip-label">扣费单价:</span>
                    <span class="chip-price">￥{{ formatAmount(createForm.hourlyRate) }}</span>
                    <span class="chip-unit">/ 小时</span>
                  </div>
                </div>
              </el-form-item>
            </div>

            <!-- 规则说明提示条 -->
            <div class="notice-info-strip">
              <el-icon class="notice-icon"><InfoFilled /></el-icon>
              <div class="notice-text">
                <template v-if="selectedBossList.length > 1">
                  当前已接入 <b>{{ selectedBossList.length }}</b> 位老板：系统将自动分发生成 <b>{{ selectedBossList.length }} 条独立拼车订单</b>（按优惠价 <b>￥{{ formatAmount(rentalPriceDict.CARPOOL) }}元/小时</b> 独立扣费与计时，方便老板提前下车）。
                </template>
                <template v-else-if="createForm.rentalType === 'CHARTER'">
                  当前为 <b>【包车模式】</b>（按标准单价 <b>￥{{ formatAmount(rentalPriceDict.CHARTER) }}元/小时</b>）：独享服务，支持邀请同行陪玩搭档。<b>注意：包车订单未结束前不能再创建新订单！</b>
                </template>
                <template v-else>
                  当前为 <b>【拼车模式】</b>（按优惠价 <b>￥{{ formatAmount(rentalPriceDict.CARPOOL) }}元/小时</b>）：单老板拼车服务，不支持同行陪玩。<b>拼车服务中后续仍可继续创建新订单。</b>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 老板挑选卡片 -->
        <div class="form-card-section">
          <div class="card-section-header">
            <div class="csh-title">
              <div class="csh-icon-box bg-amber">
                <el-icon><User /></el-icon>
              </div>
              <span>参与老板列表</span>
              <el-tag type="primary" effect="light" class="count-tag ml-2">已关联 {{ selectedBossList.length }} 位老板</el-tag>
            </div>
            
            <el-button type="primary" class="btn-gradient-blue" @click="customerDialogVisible = true">
              <el-icon class="mr-1"><Plus /></el-icon> 弹窗挑选老板
            </el-button>
          </div>

          <div class="card-section-body">
            <!-- 已选老板数据表格 -->
            <div v-if="selectedBossList.length > 0" class="table-card-wrapper">
              <el-table :data="selectedBossList" border stripe size="default" class="boss-display-table">
                <el-table-column type="index" label="序号" width="60" align="center" />
                
                <el-table-column label="老板昵称 / 用户名" min-width="160">
                  <template #default="scope">
                    <div class="boss-user-cell">
                      <div class="boss-avatar-circle">
                        <el-icon><UserFilled /></el-icon>
                      </div>
                      <div class="boss-name-box">
                        <span class="boss-nickname">{{ scope.row.user?.nickname || scope.row.nickname || scope.row.userId }}</span>
                        <span class="boss-username">@{{ scope.row.user?.username || scope.row.username || scope.row.userId }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="vipLevel" label="VIP等级" width="100" align="center">
                  <template #default="scope">
                    <el-tag type="warning" size="small" effect="dark" class="vip-badge">
                      VIP {{ scope.row.vipLevel || 0 }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column prop="walletBalance" label="钱包余额" width="130" align="center">
                  <template #default="scope">
                    <span class="balance-text">￥{{ formatAmount(scope.row.walletBalance) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="小时扣费 (字典)" width="150" align="center">
                  <template #default="scope">
                    <el-tag :type="createForm.rentalType === 'CARPOOL' ? 'warning' : 'danger'" effect="plain" class="rate-tag">
                      ￥{{ formatAmount(scope.row.hourlyRate) }} / h
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="90" align="center">
                  <template #default="scope">
                    <el-button type="danger" link class="btn-table-del" @click="removeBoss(scope.$index)">
                      <el-icon><Delete /></el-icon> 移除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 空状态容器 -->
            <div v-else class="empty-selection-card" @click="customerDialogVisible = true">
              <div class="empty-icon-wrapper">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="empty-text-group">
                <span class="empty-main-text">暂未选择老板</span>
                <span class="empty-sub-text">点击此处或右上角按钮，在弹窗列表检索并选择拉入订单的老板</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 同行陪玩卡片 (仅包车/单老板模式) -->
        <div v-if="createForm.rentalType === 'CHARTER' && selectedBossList.length <= 1" class="form-card-section">
          <div class="card-section-header">
            <div class="csh-title">
              <div class="csh-icon-box bg-emerald">
                <el-icon><UserFilled /></el-icon>
              </div>
              <span>同行陪玩搭档</span>
              <span class="csh-tag-desc">仅包车单老板模式可用</span>
            </div>

            <el-button type="success" plain class="btn-gradient-green" @click="playmateDialogVisible = true">
              <el-icon class="mr-1"><Plus /></el-icon> 挑选同行陪玩
            </el-button>
          </div>

          <div class="card-section-body">
            <div v-if="selectedPlaymateList.length > 0" class="playmate-card-grid">
              <div v-for="(pm, idx) in selectedPlaymateList" :key="pm.userId || pm.id" class="pm-profile-chip">
                <div class="pm-chip-left">
                  <div class="pm-chip-avatar">
                    <el-icon><Avatar /></el-icon>
                  </div>
                  <div class="pm-chip-meta">
                    <div class="pm-chip-name">{{ pm.user?.nickname || pm.nickname || pm.userId }}</div>
                    <div class="pm-chip-game">{{ pm.games || '全能游戏陪玩' }}</div>
                  </div>
                </div>
                <el-button type="danger" circle icon="Delete" size="small" class="btn-remove-chip" @click="removePlaymate(idx)" />
              </div>
            </div>

            <div v-else class="empty-pm-card" @click="playmateDialogVisible = true">
              <el-icon class="empty-pm-icon"><UserFilled /></el-icon>
              <span>暂未邀请同行陪玩。若老板点了多位陪玩，可点击弹窗挑选同行组队</span>
            </div>
          </div>
        </div>

        <!-- 4. 订单备注卡片 -->
        <div class="form-card-section">
          <div class="card-section-header">
            <div class="csh-title">
              <div class="csh-icon-box bg-purple">
                <el-icon><ChatDotSquare /></el-icon>
              </div>
              <span>订单服务备注</span>
            </div>
          </div>

          <div class="card-section-body">
            <el-input
              v-model="createForm.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入服务要求，如：游戏大区、YY/语音房间号、上分段位需求等"
              class="custom-textarea"
            />
          </div>
        </div>

      </el-form>
    </div>

    <!-- 底部按钮区 -->
    <template #footer>
      <div class="dialog-footer-actions">
        <el-button class="btn-footer-cancel" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-footer-submit" :loading="submitLoading" @click="submitCreateOrder">
          <el-icon class="mr-1"><Check /></el-icon> 确认发起订单
        </el-button>
      </div>
    </template>

    <!-- 弹窗组件关联 -->
    <CustomerSelectDialog
      v-model:visible="customerDialogVisible"
      :multiple="true"
      @select="handleSelectCustomers"
    />

    <PlaymateSelectDialog
      v-model:visible="playmateDialogVisible"
      @select="handleSelectPlaymates"
    />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import {
  Monitor, PriceTag, User, UserFilled, Delete, Plus,
  InfoFilled, Avatar, ChatDotSquare, Check
} from '@element-plus/icons-vue';
import { addOrder } from '../../../../api/business/order.js';
import { getDicts } from '../../../../api/system/dict.js';
import CustomerSelectDialog from './CustomerSelectDialog.vue';
import PlaymateSelectDialog from './PlaymateSelectDialog.vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'submit-success']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const orderFormRef = ref(null);
const submitLoading = ref(false);

const customerDialogVisible = ref(false);
const playmateDialogVisible = ref(false);

const gameTypeOptions = ref([]);
const rentalPriceDict = reactive({
  CHARTER: 50.00,
  CARPOOL: 20.00
});

const selectedBossList = ref([]);
const selectedPlaymateList = ref([]);

const createForm = reactive({
  rentalType: 'CHARTER',
  serviceType: '王者荣耀',
  hourlyRate: 50.00,
  remark: ''
});

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

/** 从字典读取服务项目与单价配置 */
function loadDictOptions() {
  getDicts('playmate_game_type').then(res => {
    const list = res.data || res.result || res || [];
    if (Array.isArray(list) && list.length > 0) {
      gameTypeOptions.value = list;
      if (!createForm.serviceType) {
        createForm.serviceType = list[0].dictValue || list[0].dictLabel;
      }
    }
  }).catch(() => {});

  getDicts('playmate_rental_price').then(res => {
    const list = res.data || res.result || res || [];
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (item.dictCode === 'CHARTER' || item.dictValue === 'CHARTER' || item.dictLabel?.includes('包车')) {
          rentalPriceDict.CHARTER = parseFloat(item.dictValue) || 50.00;
        } else if (item.dictCode === 'CARPOOL' || item.dictValue === 'CARPOOL' || item.dictLabel?.includes('拼车')) {
          rentalPriceDict.CARPOOL = parseFloat(item.dictValue) || 20.00;
        }
      });
      recalculateRentalTypeAndPrice();
    }
  }).catch(() => {});
}

/** 陪玩手动切换租赁模式 */
function handleRentalTypeChange(val) {
  if (val === 'CARPOOL') {
    createForm.hourlyRate = rentalPriceDict.CARPOOL || 20.00;
    selectedPlaymateList.value = []; // 拼车模式不可选同行陪玩
  } else {
    createForm.hourlyRate = rentalPriceDict.CHARTER || 50.00;
  }
  selectedBossList.value.forEach(boss => {
    boss.hourlyRate = createForm.hourlyRate;
  });
}

/** 智能根据老板人数判别或调整租赁模式与字典单价 */
function recalculateRentalTypeAndPrice() {
  const count = selectedBossList.value.length;
  if (count > 1) {
    createForm.rentalType = 'CARPOOL';
    createForm.hourlyRate = rentalPriceDict.CARPOOL || 20.00;
    selectedPlaymateList.value = []; // 拼车不可选同行
  } else {
    if (!createForm.rentalType) {
      createForm.rentalType = 'CHARTER';
    }
    createForm.hourlyRate = createForm.rentalType === 'CARPOOL'
      ? (rentalPriceDict.CARPOOL || 20.00)
      : (rentalPriceDict.CHARTER || 50.00);
  }

  selectedBossList.value.forEach(boss => {
    boss.hourlyRate = createForm.hourlyRate;
  });
}

/** 弹窗选择老板回调 */
function handleSelectCustomers(customers) {
  if (!Array.isArray(customers)) customers = [customers];
  customers.forEach(c => {
    const uId = c.userId || c.id;
    if (!selectedBossList.value.some(existing => (existing.userId || existing.id) === uId)) {
      selectedBossList.value.push({
        ...c,
        userId: uId,
        hourlyRate: createForm.hourlyRate
      });
    }
  });
  recalculateRentalTypeAndPrice();
}

/** 移除老板 */
function removeBoss(index) {
  selectedBossList.value.splice(index, 1);
  recalculateRentalTypeAndPrice();
}

/** 弹窗选择同行陪玩回调 */
function handleSelectPlaymates(playmates) {
  if (createForm.rentalType !== 'CHARTER' || selectedBossList.value.length > 1) {
    ElMessage.warning("拼车模式不可添加同行陪玩搭档！只有包车模式支持同行协助。");
    return;
  }
  if (!Array.isArray(playmates)) playmates = [playmates];
  playmates.forEach(p => {
    const pId = p.userId || p.id;
    if (!selectedPlaymateList.value.some(existing => (existing.userId || existing.id) === pId)) {
      selectedPlaymateList.value.push({
        ...p,
        userId: pId
      });
    }
  });
}

/** 移除同行陪玩 */
function removePlaymate(index) {
  selectedPlaymateList.value.splice(index, 1);
}

/** 提交发起订单 */
function submitCreateOrder() {
  if (selectedBossList.value.length === 0) {
    ElMessage.warning("请至少弹窗挑选 1 位老板进入订单！");
    return;
  }
  if (!createForm.serviceType) {
    ElMessage.warning("请选择服务游戏/项目！");
    return;
  }

  submitLoading.value = true;
  const req = {
    rentalType: createForm.rentalType,
    serviceType: createForm.serviceType,
    hourlyRate: createForm.hourlyRate,
    remark: createForm.remark,
    customers: selectedBossList.value.map(c => ({
      customerId: c.userId || c.id,
      hourlyRate: c.hourlyRate
    })),
    playmates: selectedPlaymateList.value.map(p => ({
      playmateId: p.userId || p.id
    }))
  };

  addOrder(req).then(() => {
    ElMessage.success("订单发起成功！状态为 [待开始]，等待点击开始计时");
    dialogVisible.value = false;
    emit('submit-success');
  }).finally(() => {
    submitLoading.value = false;
  });
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedBossList.value = [];
    selectedPlaymateList.value = [];
    createForm.remark = '';
    recalculateRentalTypeAndPrice();
    loadDictOptions();
  }
});
</script>

<style scoped>
/* ================= 全局弹窗与 Header 样式升级 ================= */
:deep(.playmate-order-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
  background: #f8fafc;
}

:deep(.playmate-order-dialog .el-dialog__header) {
  margin: 0;
  padding: 0;
  border-bottom: none;
}

:deep(.playmate-order-dialog .el-dialog__body) {
  padding: 20px 24px;
}

:deep(.playmate-order-dialog .el-dialog__footer) {
  padding: 16px 24px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
}

/* Header 顶部 Minimal 白底视觉 */
.dialog-minimal-header {
  background: #ffffff;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.header-main-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-avatar-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.header-text-group {
  display: flex;
  flex-direction: column;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.live-tag {
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot-flash {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #3b82f6;
  animation: flash 1.2s infinite ease-in-out;
}

@keyframes flash {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.sub-title {
  margin: 3px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

/* ================= 内部卡片 Container 逻辑分块 ================= */
.dialog-content-body {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}

/* 自定义 Webkit 滚动条样式 */
.dialog-content-body::-webkit-scrollbar {
  width: 6px;
}
.dialog-content-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.order-create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 卡片全框基础架构 */
.form-card-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s ease;
}

.form-card-section:hover {
  border-color: #cbd5e1;
}

.card-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.csh-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.csh-icon-box {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #ffffff;
}

.bg-blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.bg-amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.bg-emerald { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.bg-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }

.csh-sub {
  font-size: 12px;
  color: #94a3b8;
}

.csh-tag-desc {
  font-size: 12px;
  color: #64748b;
  font-weight: normal;
  margin-left: 6px;
}

.form-grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.custom-form-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: #334155;
  font-size: 13px;
  margin-bottom: 6px;
}

/* 结算模式展示 View Controls */
.mode-price-showcase {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
}

.mode-badge-pill {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.pill-charter {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.pill-carpool {
  background: #fffbebfb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.price-chip-box {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
}

.chip-label {
  font-size: 12px;
  color: #64748b;
}

.chip-price {
  font-size: 16px;
  font-weight: 800;
  color: #dc2626;
}

.chip-unit {
  font-size: 12px;
  color: #94a3b8;
}

.notice-info-strip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 10px;
}

.notice-icon {
  font-size: 16px;
  color: #0284c7;
  margin-top: 2px;
}

.notice-text {
  font-size: 12px;
  color: #0369a1;
  line-height: 1.5;
}

/* ================= 按钮与表格设计 ================= */
.btn-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  color: #ffffff;
  font-weight: 600;
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}
.btn-gradient-blue:hover {
  background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
}

.btn-gradient-green {
  font-weight: 600;
  border-radius: 8px;
}

.table-card-wrapper {
  margin-top: 4px;
}

.boss-display-table {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.boss-display-table th.el-table__cell) {
  background: #f8fafc !important;
  color: #475569 !important;
  font-weight: 700;
}

.boss-user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.boss-avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.boss-name-box {
  display: flex;
  flex-direction: column;
}

.boss-nickname {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.boss-username {
  font-size: 11px;
  color: #94a3b8;
}

.vip-badge {
  font-weight: 700;
  border-radius: 6px;
}

.balance-text {
  font-weight: 800;
  color: #dc2626;
  font-family: monospace;
}

.rate-tag {
  font-weight: 700;
}

/* 空状态卡片设计 */
.empty-selection-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-selection-card:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}

.empty-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: all 0.2s ease;
}

.empty-selection-card:hover .empty-icon-wrapper {
  background: #3b82f6;
  color: #ffffff;
}

.empty-text-group {
  display: flex;
  flex-direction: column;
}

.empty-main-text {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.empty-sub-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 同行卡片 GRID */
.playmate-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.pm-profile-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
}

.pm-chip-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-chip-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #d1fae5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.pm-chip-meta {
  display: flex;
  flex-direction: column;
}

.pm-chip-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.pm-chip-game {
  font-size: 11px;
  color: #64748b;
}

.empty-pm-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-pm-card:hover {
  background: #f0fdf4;
  border-color: #10b981;
  color: #047857;
}

.empty-pm-icon {
  font-size: 18px;
}

/* 底部操作 Footer */
.dialog-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-footer-cancel {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
}

.btn-footer-submit {
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  border-color: #cbd5e1;
  padding: 10px 12px;
  font-size: 13px;
}

.mr-1 { margin-right: 4px; }
.ml-2 { margin-left: 8px; }
</style>
