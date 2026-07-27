<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '修改订单' : '新增订单'"
    width="1100px"
    align-center
    append-to-body
    destroy-on-close
    class="custom-dialog"
  >
    <template #header>
      <div class="dialog-header-title">
<!--        <el-icon class="header-icon text-primary"><Document /></el-icon>-->
        <span>{{ isEdit ? '修改订单信息' : '创建新订单' }}</span>
      </div>
    </template>

    <el-form ref="orderFormRef" :model="form" :rules="rules" label-width="110px" class="dialog-form">
      <!-- 客户选择区块 -->
      <div class="form-block">
        <div class="block-header">
          <span class="block-title">客户信息</span>
          <el-button type="primary" size="small" plain @click="customerDialogVisible = true">
            {{ form.customerInfo ? '重新选择客户' : '选择客户' }}
          </el-button>
        </div>

        <div v-if="form.customerInfo" class="customer-card">
          <div class="customer-avatar">
            <el-icon size="28"><UserFilled /></el-icon>
          </div>
          <div class="customer-details">
            <div class="customer-name-row">
              <span class="nickname">{{ form.customerInfo.nickname }}</span>
              <span class="username">({{ form.customerInfo.username }})</span>
              <el-tag type="warning" size="small" effect="plain" class="vip-tag">
                VIP {{ form.customerInfo.vipLevel || 0 }}
              </el-tag>
            </div>
            <div class="customer-sub-info">
              <span>手机号: {{ form.customerInfo.mobile || '未绑定' }}</span>
              <span class="divider">|</span>
              <span>客户 ID: {{ form.customerId }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-customer-box" @click="customerDialogVisible = true">
          <el-icon size="20" class="icon-plus"><Plus /></el-icon>
          <span>暂未选择客户，点击选入订单客户</span>
        </div>
      </div>

      <!-- 服务与时间规则区块 -->
      <div class="form-block" style="margin-top: 20px;">
        <div class="block-header">
          <span class="block-title">服务信息与服务时间</span>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务/游戏" prop="serviceType">
              <el-input v-model="form.serviceType" placeholder="例如：LOL, 王者荣耀, 和平精英" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="订单类型" prop="orderType">
              <el-select v-model="form.orderType" placeholder="请选择订单类型" style="width: 100%">
                <el-option label="单排 (1个陪玩)" value="SOLO" />
                <el-option label="双排 (2个陪玩)" value="DUO" />
                <el-option label="三排 (3个陪玩)" value="TRIPLE" />
                <el-option label="包车/车队 (多陪玩)" value="TEAM" />
                <el-option label="自定义玩法" value="CUSTOM" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择预计/实际开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                @change="handleTimeChange"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择预计/实际结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                @change="handleTimeChange"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="数量/时长" prop="serviceHours">
              <div style="display: flex; gap: 10px; width: 100%;">
                <el-input-number
                  v-model="form.serviceHours"
                  :min="0.5"
                  :step="0.5"
                  style="flex: 1;"
                  placeholder="自动或手动输入"
                  @change="recalculateAmounts"
                />
                <el-select v-model="form.serviceUnit" style="width: 90px;">
                  <el-option label="小时" value="HOUR" />
                  <el-option label="局" value="GAME" />
                </el-select>
              </div>
              <div class="form-tip">小时数支持由开始结束时间自动计算</div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="订单总金额" prop="totalAmount">
              <el-input-number
                v-model="form.totalAmount"
                :precision="2"
                :step="10"
                style="width: 100%"
                placeholder="留空则自动按陪玩收益计算"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="订单备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入订单备注说明" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 绑定陪玩人员区块 -->
      <div class="form-block" style="margin-top: 20px;">
        <div class="block-header">
          <span class="block-title">绑定陪玩人员 (已选 {{ form.playmates.length }} 人)</span>
          <el-button type="success" size="small" plain @click="playmateDialogVisible = true">
            挑选陪玩人员
          </el-button>
        </div>

        <el-table :data="form.playmates" border class="playmate-edit-table" style="width: 100%;">
          <el-table-column label="陪玩昵称" min-width="140" align="center">
            <template #default="scope">
              <div class="pm-nickname-box">
                <span class="pm-nickname">{{ scope.row.nickname || scope.row.playmateId }}</span>
                <span v-if="scope.row.username" class="pm-username">({{ scope.row.username }})</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="单价 (元/局/小时)" width="160" align="center">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.unitPrice"
                :precision="2"
                :step="5"
                :controls="false"
                style="width: 100%"
                @change="handlePlaymatePriceChange(scope.row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="预计收益 (元)" width="160" align="center">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.incomeAmount"
                :precision="2"
                :step="5"
                :controls="false"
                style="width: 100%"
              />
            </template>
          </el-table-column>

          <el-table-column label="服务状态" width="130" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.status" style="width: 100%">
                <el-option label="待服务" value="PENDING" />
                <el-option label="服务中" value="SERVING" />
                <el-option label="已完成" value="COMPLETED" />
                <el-option label="已更换" value="REPLACED" />
                <el-option label="已取消" value="CANCELLED" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="70" align="center">
            <template #default="scope">
              <el-button link type="danger" @click="handleRemovePlaymateRow(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn-cancel" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" class="btn-submit" :loading="submitLoading" @click="submitForm">
          确 定
        </el-button>
      </div>
    </template>

    <!-- 弹窗子组件 -->
    <CustomerSelectDialog
      v-model:visible="customerDialogVisible"
      @select="handleCustomerSelected"
    />

    <PlaymateSelectDialog
      v-model:visible="playmateDialogVisible"
      :start-time="form.startTime"
      :end-time="form.endTime"
      @select="handlePlaymatesSelected"
    />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { User, UserFilled, Document, Plus, Delete } from '@element-plus/icons-vue';
import CustomerSelectDialog from './CustomerSelectDialog.vue';
import PlaymateSelectDialog from './PlaymateSelectDialog.vue';
import { addOrder, updateOrder } from '../../../../api/business/order.js';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  orderData: {
    type: Object,
    default: () => ({})
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

const form = reactive({
  id: undefined,
  customerId: '',
  customerInfo: null,
  serviceType: 'LOL',
  orderType: 'SOLO',
  startTime: undefined,
  endTime: undefined,
  serviceHours: 1.0,
  serviceUnit: 'HOUR',
  totalAmount: undefined,
  remark: '',
  playmates: []
});

const rules = {
  serviceType: [{ required: true, message: '请输入服务类型/游戏项目', trigger: 'blur' }],
  orderType: [{ required: true, message: '请选择订单类型', trigger: 'change' }],
  serviceHours: [{ required: true, message: '请输入服务时长/局数', trigger: 'blur' }]
};

/** 选中客户回调 */
function handleCustomerSelected(customer) {
  const user = customer.user || customer;
  form.customerId = customer.userId || user.id;
  form.customerInfo = {
    nickname: user.nickname || customer.nickname || '未设置昵称',
    username: user.username || customer.username || '-',
    mobile: user.mobile || customer.mobile || '',
    vipLevel: customer.vipLevel || 0
  };
}

/** 选中陪玩回调 (数组) */
function handlePlaymatesSelected(selectedPlaymates) {
  selectedPlaymates.forEach(pm => {
    const pmUserId = pm.userId || (pm.user ? pm.user.id : '');
    const pmUser = pm.user || pm;
    const exists = form.playmates.some(p => p.playmateId === pmUserId);
    if (!exists) {
      const price = pm.pricePerOrder || 0;
      form.playmates.push({
        id: undefined,
        playmateId: pmUserId,
        nickname: pmUser.nickname || pm.nickname || pmUserId,
        username: pmUser.username || pm.username || '',
        unitPrice: price,
        incomeAmount: Number((price * (form.serviceHours || 1)).toFixed(2)),
        status: 'PENDING',
        remark: ''
      });
    }
  });
  recalculateAmounts();
  updateAutoOrderType();
}

/** 移除已选陪玩 */
function handleRemovePlaymateRow(index) {
  form.playmates.splice(index, 1);
  recalculateAmounts();
  updateAutoOrderType();
}

/** 更改陪玩单价 */
function handlePlaymatePriceChange(row) {
  row.incomeAmount = Number((row.unitPrice * (form.serviceHours || 1)).toFixed(2));
  recalculateAmounts();
}

/** 开始时间 / 结束时间发生变更时自动计算时长 */
function handleTimeChange() {
  if (form.startTime && form.endTime) {
    const startMs = new Date(form.startTime).getTime();
    const endMs = new Date(form.endTime).getTime();
    if (endMs > startMs) {
      const hours = (endMs - startMs) / (1000 * 60 * 60);
      form.serviceHours = Number(Math.max(0.5, Math.round(hours * 10) / 10).toFixed(1));
      recalculateAmounts();
    } else {
      ElMessage.warning("结束时间必须晚于开始时间");
    }
  }
}

/** 重新计算陪玩收益与订单预估总额 */
function recalculateAmounts() {
  const hours = form.serviceHours || 1;
  let calculatedTotal = 0;
  form.playmates.forEach(pm => {
    pm.incomeAmount = Number(((pm.unitPrice || 0) * hours).toFixed(2));
    calculatedTotal += pm.incomeAmount;
  });
  if (form.totalAmount === undefined || form.totalAmount === null || form.totalAmount === 0) {
    form.totalAmount = calculatedTotal;
  }
}

/** 自动计算订单类型 */
function updateAutoOrderType() {
  const count = form.playmates.length;
  if (count === 1) form.orderType = 'SOLO';
  else if (count === 2) form.orderType = 'DUO';
  else if (count === 3) form.orderType = 'TRIPLE';
  else if (count > 3) form.orderType = 'TEAM';
}

/** 提交表单 */
function submitForm() {
  orderFormRef.value.validate(valid => {
    if (valid) {
      if (!form.customerId) {
        ElMessage.warning("请选择订单对应的客户");
        return;
      }
      if (!form.playmates || form.playmates.length === 0) {
        ElMessage.warning("创建订单至少需要绑定一名陪玩人员");
        return;
      }

      submitLoading.value = true;
      const payload = {
        id: form.id,
        customerId: form.customerId,
        serviceType: form.serviceType,
        orderType: form.orderType,
        startTime: form.startTime,
        endTime: form.endTime,
        serviceHours: form.serviceHours,
        serviceUnit: form.serviceUnit,
        totalAmount: form.totalAmount,
        remark: form.remark,
        playmates: form.playmates.map(pm => ({
          id: pm.id,
          playmateId: pm.playmateId,
          unitPrice: pm.unitPrice,
          incomeAmount: pm.incomeAmount,
          status: pm.status || 'PENDING',
          remark: pm.remark
        }))
      };

      if (props.isEdit) {
        updateOrder(payload).then(() => {
          ElMessage.success("修改订单成功");
          dialogVisible.value = false;
          emit('submit-success');
        }).finally(() => {
          submitLoading.value = false;
        });
      } else {
        addOrder(payload).then(() => {
          ElMessage.success("新增订单成功");
          dialogVisible.value = false;
          emit('submit-success');
        }).finally(() => {
          submitLoading.value = false;
        });
      }
    }
  });
}

/** 监听弹窗显示与编辑数据回显 */
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.isEdit && props.orderData) {
      const data = props.orderData;
      form.id = data.id;
      form.customerId = data.customerId;
      form.customerInfo = {
        nickname: data.customerUser?.nickname || data.customerProfile?.userId || '未知客户',
        username: data.customerUser?.username || data.customerId || '-',
        mobile: data.customerUser?.mobile || '',
        vipLevel: data.customerProfile?.vipLevel || 0
      };
      form.serviceType = data.serviceType || 'LOL';
      form.orderType = data.orderType?.code || data.orderType || 'SOLO';
      form.startTime = data.startTime;
      form.endTime = data.endTime;
      form.serviceHours = data.serviceHours || 1.0;
      form.serviceUnit = data.serviceUnit || 'HOUR';
      form.totalAmount = data.totalAmount;
      form.remark = data.remark || '';
      form.playmates = (data.playmates || []).map(pm => ({
        id: pm.id,
        playmateId: pm.playmateId,
        nickname: pm.playmateUser?.nickname || pm.playmateId,
        username: pm.playmateUser?.username || '',
        unitPrice: pm.unitPrice,
        incomeAmount: pm.incomeAmount,
        status: pm.status || 'PENDING',
        remark: pm.remark
      }));
    } else {
      // 重置新增表单
      form.id = undefined;
      form.customerId = '';
      form.customerInfo = null;
      form.serviceType = 'LOL';
      form.orderType = 'SOLO';
      form.startTime = undefined;
      form.endTime = undefined;
      form.serviceHours = 1.0;
      form.serviceUnit = 'HOUR';
      form.totalAmount = undefined;
      form.remark = '';
      form.playmates = [];
    }
  }
});
</script>

<style scoped>
.form-block {
  background-color: #fcfcfd;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.block-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.customer-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background-color: #f0f7ff;
  border: 1px solid #c6e2ff;
  border-radius: 6px;
  padding: 12px 16px;
}

.customer-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #409eff;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customer-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.username {
  color: #909399;
  font-size: 14px;
}

.vip-tag {
  margin-left: 4px;
}

.customer-sub-info {
  font-size: 13px;
  color: #606266;
}

.divider {
  margin: 0 8px;
  color: #dcdfe6;
}

.empty-customer-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 56px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  color: #909399;
  cursor: pointer;
  background-color: #ffffff;
  transition: border-color 0.2s, color 0.2s;
}

.empty-customer-box:hover {
  border-color: #409eff;
  color: #409eff;
}

.pm-nickname-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pm-nickname {
  font-weight: 500;
}

.pm-username {
  font-size: 12px;
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.text-primary {
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
