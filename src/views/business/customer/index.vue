<template>
  <div class="customer-container">
    <div class="main-card">
      <!-- 综合工具栏 -->
      <div class="toolbar-wrapper">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />
        <el-button type="primary" class="toolbar-btn" @click="handleQuery">查询</el-button>
        <el-button type="primary" class="toolbar-btn" @click="resetQuery">重置</el-button>
        <el-button type="primary" class="toolbar-btn" @click="handleAdd">新增客户</el-button>
      </div>

      <!-- 数据表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="customerList"
          class="nebula-modern-table"
          @selection-change="handleSelectionChange"
          border
          height="100%"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="userId" label="用户ID" min-width="120" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="user.nickname" label="客户昵称" min-width="120" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.user?.nickname || scope.row.nickname || '-' }}</span>
            </template>
          </el-table-column>

          <!-- 钱包余额 (包含眼睛显隐与明细下钻) -->
          <el-table-column prop="walletBalance" label="钱包余额" min-width="150" align="center">
            <template #header>
              <div class="balance-header-title">
                <span>钱包余额</span>
                <el-tooltip :content="isBalanceVisible ? '点击隐匿金额' : '点击显示金额'" placement="top">
                  <el-icon class="eye-toggle-btn" @click.stop="toggleBalanceVisible">
                    <View v-if="isBalanceVisible" />
                    <Hide v-else />
                  </el-icon>
                </el-tooltip>
              </div>
            </template>
            <template #default="scope">
              <div class="balance-amount-box" @click="handleOpenBalanceLog(scope.row)">
                <span v-if="isBalanceVisible" class="balance-text balance-visible">
                  ￥{{ formatAmount(scope.row.walletBalance) }}
                </span>
                <span v-else class="balance-text balance-hidden">****</span>
                <el-tooltip content="点击下钻查看资金明细" placement="top">
                  <el-icon class="detail-drill-icon"><List /></el-icon>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="withdrawableAmount" label="可提现金额" min-width="120" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span v-if="isBalanceVisible">￥{{ formatAmount(scope.row.withdrawableAmount) }}</span>
              <span v-else>****</span>
            </template>
          </el-table-column>

          <el-table-column prop="vipLevel" label="VIP等级" min-width="100" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <el-tag type="warning" effect="plain">VIP {{ scope.row.vipLevel || 0 }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="lastOrderTime" label="最后下单时间" min-width="180" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.lastOrderTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="230" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="success" class="action-link" @click="handleRecharge(scope.row)">充值</el-button>
                <el-button link type="primary" class="action-link" @click="handleUpdate(scope.row)">编辑</el-button>
                <el-button link type="info" class="action-link" @click="handleOpenBalanceLog(scope.row)">明细</el-button>
                <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 表格底部汇总与分页 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条客户数据</span>
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

    <!-- 添加或修改客户对话框 (不包含直接修改余额，确保资金安全) -->
    <el-dialog
      v-model="open"
      :title="title"
      width="680px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <span>{{ title }}</span>
        </div>
      </template>

      <el-form ref="customerRef" :model="form" :rules="rules" label-width="90px" class="dialog-form">
        <el-row :gutter="20">
          <template v-if="!form.userId">
            <el-col :span="12">
              <el-form-item label="登录账号" prop="username">
                <el-input v-model="form.username" placeholder="请输入登录账号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="登录密码" prop="password">
                <el-input v-model="form.password" type="password" show-password placeholder="请输入登录密码" />
              </el-form-item>
            </el-col>
          </template>

          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号码" prop="mobile">
              <el-input v-model="form.mobile" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="VIP等级" prop="vipLevel">
              <el-input-number v-model="form.vipLevel" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注说明" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="cancel">取 消</el-button>
          <el-button type="primary" class="btn-submit" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 独立充值 / 调账对话框 -->
    <el-dialog
      v-model="rechargeOpen"
      title="客户充值 / 调账"
      width="540px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <el-icon class="header-icon text-success"><Money /></el-icon>
          <span>客户充值与资金调账</span>
        </div>
      </template>

      <el-form ref="rechargeRef" :model="rechargeForm" :rules="rechargeRules" label-width="100px" class="dialog-form">
        <el-form-item label="客户信息">
          <el-input :value="rechargeForm.nickname + ' (' + rechargeForm.userId + ')'" disabled />
        </el-form-item>

        <el-form-item label="当前余额">
          <div class="current-balance-tag">￥{{ formatAmount(rechargeForm.walletBalance) }}</div>
        </el-form-item>

        <el-form-item label="变动类型" prop="changeType">
          <el-radio-group v-model="rechargeForm.changeType">
            <el-radio value="RECHARGE">充值 (增加余额)</el-radio>
            <el-radio value="MANUAL_ADJUST">手动调账</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="变动金额" prop="amount">
          <el-input-number
            v-model="rechargeForm.amount"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="正数为增加，负数为扣减"
          />
          <div class="form-tip">提示：支持输入正数（增加余额）或负数（调账扣减）</div>
        </el-form-item>

        <el-form-item label="操作渠道" prop="channel">
          <el-select v-model="rechargeForm.channel" style="width: 100%">
            <el-option label="微信支付" value="WECHAT" />
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="银行转账" value="BANK" />
            <el-option label="现金收取" value="CASH" />
            <el-option label="后台人工" value="MANUAL" />
            <el-option label="系统自动" value="SYSTEM" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联单号" prop="orderNo">
          <el-input v-model="rechargeForm.orderNo" placeholder="可选，如转账凭证号/外部单号" />
        </el-form-item>

        <el-form-item label="变动说明" prop="remark">
          <el-input v-model="rechargeForm.remark" type="textarea" :rows="3" placeholder="请输入必填的充值/调账原因或备注说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="rechargeOpen = false">取 消</el-button>
          <el-button type="success" class="btn-submit" :loading="rechargeLoading" @click="submitRechargeForm">确认变动</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 资金变动明细下钻 Drawer 抽屉 -->
    <el-drawer
      v-model="logDrawerOpen"
      title="资金变动明细"
      size="820px"
      append-to-body
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">客户资金变动明细 - {{ currentCustomer.user?.nickname || currentCustomer.nickname || currentCustomer.userId }}</span>
          <span class="drawer-sub">客户ID: {{ currentCustomer.userId }} | 当前余额: ￥{{ formatAmount(currentCustomer.walletBalance) }}</span>
        </div>
      </template>

      <div class="log-drawer-container">
        <div class="log-filter-bar">
          <el-select v-model="logQueryParams.changeType" placeholder="全部变动类型" clearable style="width: 180px" @change="getLogList">
            <el-option label="人工充值" value="RECHARGE" />
            <el-option label="手动调账" value="MANUAL_ADJUST" />
            <el-option label="自动扣费" value="AUTO_DEDUCT" />
            <el-option label="订单消费" value="CONSUME" />
            <el-option label="退款入账" value="REFUND" />
          </el-select>
          <el-button type="primary" @click="getLogList">刷新明细</el-button>
        </div>

        <el-table v-loading="logLoading" :data="logList" border stripe class="log-table">
          <el-table-column prop="createTime" label="变动时间" min-width="160" align="center" />
          <el-table-column prop="changeType" label="变动类型" width="110" align="center">
            <template #default="scope">
              <el-tag :type="getChangeTypeTag(scope.row.changeType).type">
                {{ getChangeTypeTag(scope.row.changeType).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="变动金额" min-width="120" align="center">
            <template #default="scope">
              <span :class="scope.row.amount >= 0 ? 'amount-plus' : 'amount-minus'">
                {{ scope.row.amount >= 0 ? '+' : '' }}{{ formatAmount(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceBefore" label="变动前余额" min-width="110" align="center">
            <template #default="scope">￥{{ formatAmount(scope.row.balanceBefore) }}</template>
          </el-table-column>
          <el-table-column prop="balanceAfter" label="变动后余额" min-width="110" align="center">
            <template #default="scope">￥{{ formatAmount(scope.row.balanceAfter) }}</template>
          </el-table-column>
          <el-table-column prop="channel" label="渠道" width="100" align="center">
            <template #default="scope">
              <span>{{ getChannelLabel(scope.row.channel) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="operatorId" label="操作人" min-width="100" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="remark" label="备注说明" min-width="160" align="center" :show-overflow-tooltip="true" />
        </el-table>

        <div class="drawer-pagination">
          <el-pagination
            v-model:current-page="logQueryParams.pageIndex"
            v-model:page-size="logQueryParams.pageSize"
            :page-sizes="[10, 20, 50]"
            layout="sizes, prev, pager, next, total"
            :total="logTotal"
            @size-change="getLogList"
            @current-change="getLogList"
          />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs } from 'vue';
import { View, Hide, Money, List } from '@element-plus/icons-vue';
import {
  listCustomer,
  getCustomer,
  delCustomer,
  addCustomer,
  updateCustomer,
  rechargeCustomer,
  listCustomerBalanceLog
} from '../../../api/business/customer.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const customerList = ref([]);
const open = ref(false);
const loading = ref(true);
const submitLoading = ref(false);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

// 小眼睛金额脱敏控制 (默认为 false 脱敏状态)
const isBalanceVisible = ref(false);

function toggleBalanceVisible() {
  isBalanceVisible.value = !isBalanceVisible.value;
}

function formatAmount(val) {
  if (val === undefined || val === null) return '0.00';
  return Number(val).toFixed(2);
}

// 充值 / 调账弹窗状态
const rechargeOpen = ref(false);
const rechargeLoading = ref(false);
const rechargeRef = ref(null);
const rechargeForm = reactive({
  userId: '',
  nickname: '',
  walletBalance: 0,
  changeType: 'RECHARGE',
  amount: 100.00,
  channel: 'ALIPAY',
  orderNo: '',
  remark: ''
});

const rechargeRules = {
  changeType: [{ required: true, message: '请选择变动类型', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入变动金额', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || value === 0) {
          callback(new Error('变动金额不能为0'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  channel: [{ required: true, message: '请选择操作渠道', trigger: 'change' }],
  remark: [{ required: true, message: '请输入变动原因/备注说明', trigger: 'blur' }]
};

// 资金明细抽屉状态
const logDrawerOpen = ref(false);
const logLoading = ref(false);
const currentCustomer = ref({});
const logList = ref([]);
const logTotal = ref(0);
const logQueryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  userId: '',
  changeType: ''
});

const data = reactive({
  form: {},
  queryParams: {
    pageIndex: 1,
    pageSize: 10,
    userId: undefined
  },
  rules: {
    username: [
      { required: true, message: "登录账号不能为空", trigger: "blur" }
    ],
    password: [
      { required: true, message: "登录密码不能为空", trigger: "blur" }
    ],
    nickname: [
      { required: true, message: "用户昵称不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);
const customerRef = ref(null);

/** 查询客户列表 */
function getList() {
  loading.value = true;
  listCustomer(queryParams.value).then(response => {
    const resData = response.result || response.data || response;
    customerList.value = resData.records || resData.list || [];
    total.value = resData.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    userId: undefined,
    username: undefined,
    password: "",
    nickname: undefined,
    mobile: undefined,
    vipLevel: 0,
    remark: undefined
  };
  if (customerRef.value) {
    customerRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageIndex = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.userId = undefined;
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.userId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增客户";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const userId = row.userId || ids.value[0];
  getCustomer(userId).then(response => {
    const resData = response.result || response.data || response;
    const userData = resData.user || {};
    form.value = {
      ...resData,
      username: userData.username || resData.username,
      nickname: userData.nickname || resData.nickname,
      mobile: userData.mobile || resData.mobile,
      email: userData.email || resData.email,
      vipLevel: resData.vipLevel ?? 0,
      remark: userData.remark || resData.remark
    };
    open.value = true;
    title.value = "修改客户";
  });
}

/** 充值按钮操作 */
function handleRecharge(row) {
  rechargeForm.userId = row.userId;
  rechargeForm.nickname = row.user?.nickname || row.nickname || row.userId;
  rechargeForm.walletBalance = row.walletBalance || 0;
  rechargeForm.changeType = 'RECHARGE';
  rechargeForm.amount = 100.00;
  rechargeForm.channel = 'ALIPAY';
  rechargeForm.orderNo = '';
  rechargeForm.remark = '';
  rechargeOpen.value = true;
}

/** 提交充值表单 */
function submitRechargeForm() {
  if (rechargeRef.value) {
    rechargeRef.value.validate(valid => {
      if (valid) {
        rechargeLoading.value = true;
        rechargeCustomer(rechargeForm).then(() => {
          ElMessage.success("充值/调账成功！");
          rechargeOpen.value = false;
          getList();
        }).finally(() => {
          rechargeLoading.value = false;
        });
      }
    });
  }
}

/** 打开资金变动明细 Drawer */
function handleOpenBalanceLog(row) {
  currentCustomer.value = row;
  logQueryParams.userId = row.userId;
  logQueryParams.changeType = '';
  logQueryParams.pageIndex = 1;
  logDrawerOpen.value = true;
  getLogList();
}

/** 查询资金明细列表 */
function getLogList() {
  logLoading.value = true;
  listCustomerBalanceLog(logQueryParams).then(response => {
    const resData = response.result || response.data || response;
    logList.value = resData.records || resData.list || [];
    logTotal.value = resData.total || 0;
    logLoading.value = false;
  }).catch(() => {
    logLoading.value = false;
  });
}

/** 变动类型 Tag 映射 */
function getChangeTypeTag(type) {
  switch (type) {
    case 'RECHARGE':
      return { type: 'success', label: '人工充值' };
    case 'MANUAL_ADJUST':
      return { type: 'warning', label: '手动调账' };
    case 'AUTO_DEDUCT':
      return { type: 'danger', label: '自动扣费' };
    case 'CONSUME':
      return { type: 'danger', label: '订单消费' };
    case 'REFUND':
      return { type: 'success', label: '退款入账' };
    default:
      return { type: 'info', label: type || '其他' };
  }
}

/** 渠道 Label 映射 */
function getChannelLabel(channel) {
  switch (channel) {
    case 'WECHAT': return '微信支付';
    case 'ALIPAY': return '支付宝';
    case 'BANK': return '银行转账';
    case 'CASH': return '现金收取';
    case 'SYSTEM': return '系统自动';
    case 'MANUAL': return '后台人工';
    default: return channel || '其他';
  }
}

/** 提交基础修改表单 */
function submitForm() {
  customerRef.value.validate(valid => {
    if (valid) {
      submitLoading.value = true;
      if (form.value.userId != null) {
        updateCustomer(form.value).then(response => {
          ElMessage.success("修改成功");
          open.value = false;
          getList();
        }).finally(() => {
          submitLoading.value = false;
        });
      } else {
        addCustomer(form.value).then(response => {
          ElMessage.success("新增成功");
          open.value = false;
          getList();
        }).finally(() => {
          submitLoading.value = false;
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const userIds = row.userId || ids.value;
  ElMessageBox.confirm('是否确认删除客户编号为"' + userIds + '"的数据项?', "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(function() {
    return delCustomer(userIds);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  }).catch(() => {});
}

getList();
</script>

<style scoped>
.customer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
  font-size: 16px;
}

.main-card {
  flex: 1;
  min-width: 0;
  min-height: 0;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.toolbar-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
}

.search-input {
  width: 240px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
}
.search-input :deep(.el-input__inner) {
  font-size: 16px;
}

.toolbar-btn {
  border-radius: 4px;
  font-size: 16px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.nebula-modern-table {
  width: 100%;
  font-size: 16px;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #f8f8f9 !important;
  color: #515a6e !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  height: 44px !important;
  padding: 8px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 8px 0 !important;
  font-size: 16px !important;
  color: #606266;
}

:deep(.nebula-modern-table .el-button) {
  font-size: 16px;
}

/* 钱包余额列专用样式与眼睛开关 */
.balance-header-title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.eye-toggle-btn {
  cursor: pointer;
  font-size: 17px;
  color: #409eff;
  transition: transform 0.2s ease, color 0.2s ease;
}

.eye-toggle-btn:hover {
  transform: scale(1.2);
  color: #66b1ff;
}

.balance-amount-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.balance-amount-box:hover {
  background-color: #e8f4ff;
}

.balance-visible {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.balance-hidden {
  color: #909399;
  letter-spacing: 2px;
  font-weight: bold;
  font-size: 16px;
}

.detail-drill-icon {
  font-size: 15px;
  color: #409eff;
}

.current-balance-tag {
  font-size: 20px;
  font-weight: bold;
  color: #67c23a;
}

.form-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.text-success {
  color: #67c23a;
}

.amount-plus {
  color: #67c23a;
  font-weight: bold;
}

.amount-minus {
  color: #f56c6c;
  font-weight: bold;
}

.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-link {
  font-size: 15px;
  padding: 0;
  height: auto;
  margin: 0 !important;
}

.action-link-danger {
  color: #f56c6c;
}
.action-link-danger:hover {
  color: #f78989;
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
  font-size: 16px;
}

:deep(.custom-pagination),
:deep(.custom-pagination button),
:deep(.custom-pagination span),
:deep(.custom-pagination li),
:deep(.custom-pagination input) {
  font-size: 15px !important;
}

:deep(.custom-dialog) {
  border-radius: 4px;
  font-size: 16px;
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
  font-weight: 500;
  color: #303133;
}

.dialog-form {
  padding: 20px 20px 0 20px;
}

:deep(.dialog-form .el-form-item__label) {
  font-size: 16px;
}

:deep(.dialog-form .el-input__inner),
:deep(.dialog-form .el-textarea__inner),
:deep(.dialog-form .el-radio__label),
:deep(.dialog-form .el-input-number) {
  font-size: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

:deep(.dialog-footer .el-button) {
  font-size: 16px;
}

.btn-cancel {
  border-radius: 4px;
}

.btn-submit {
  border-radius: 4px;
}

/* 明细 Drawer 抽屉专有样式 */
.drawer-header {
  display: flex;
  flex-direction: column;
}

.drawer-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.drawer-sub {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.log-drawer-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 4px;
}

.log-filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.log-table {
  width: 100%;
}

.drawer-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
