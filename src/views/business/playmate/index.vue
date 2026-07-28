<template>
  <div class="playmate-container">
    <div class="main-card">
      <!-- 综合工具栏 -->
      <div class="toolbar-wrapper">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户账号/昵称/ID"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />
        <el-button type="primary" class="toolbar-btn" @click="handleQuery">查询</el-button>
        <el-button type="primary" class="toolbar-btn" @click="resetQuery">重置</el-button>
        <el-button type="primary" class="toolbar-btn" @click="handleAdd">新增陪玩</el-button>
        <el-button type="success" class="toolbar-btn" @click="handleOpenGlobalStats">多维时长统计</el-button>
      </div>

      <!-- 数据表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="playmateList"
          class="nebula-modern-table"
          @selection-change="handleSelectionChange"
          border
          height="100%"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="user.username" label="用户名" min-width="120" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.user?.username || scope.row.username || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="user.nickname" label="用户昵称" min-width="120" align="center" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.user?.nickname || scope.row.nickname || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pricePerOrder" label="接单价格" min-width="100" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="games" label="擅长游戏" min-width="140" align="center" :show-overflow-tooltip="true" />

          <el-table-column prop="onlineStatus" label="在线状态" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.onlineStatus === '1'" type="success">在线</el-tag>
              <el-tag v-else-if="scope.row.onlineStatus === '2'" type="danger">忙碌</el-tag>
              <el-tag v-else type="info">离线</el-tag>
            </template>
          </el-table-column>

          <!-- 累计在线时长字段展示与格式化 -->
          <el-table-column prop="onlineDuration" label="累计在线时长" min-width="140" align="center">
            <template #default="scope">
              <span class="duration-badge">
                {{ formatMinutes(scope.row.onlineDuration) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="serviceRating" label="服务评分" min-width="90" align="center" :show-overflow-tooltip="true" />

          <el-table-column label="操作" align="center" width="280" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="primary" class="action-link" @click="handleUpdate(scope.row)">编辑</el-button>
                <el-button link type="success" class="action-link action-link-success" @click="handleOpenLogDialog(scope.row)">时长打卡</el-button>
                <el-button link type="warning" class="action-link action-link-warning" @click="handleOpenRowStats(scope.row)">时长统计</el-button>
                <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 表格底部汇总与分页 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ total }} 条陪玩数据</span>
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

    <!-- 添加或修改陪玩对话框 -->
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

      <el-form ref="playmateRef" :model="form" :rules="rules" label-width="90px" class="dialog-form">
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
            <el-form-item label="接单价格" prop="pricePerOrder">
              <el-input-number v-model="form.pricePerOrder" :precision="2" :step="10.0" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="擅长游戏" prop="games">
              <el-input v-model="form.games" placeholder="擅长游戏，逗号分隔" />
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

    <!-- 在线时长记录/打卡对话框 -->
    <el-dialog
      v-model="logOpen"
      title="记录陪玩在线时长"
      width="540px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <span>陪玩在线时长打卡 / 增加记录</span>
        </div>
      </template>

      <el-form ref="logFormRef" :model="logForm" :rules="logRules" label-width="100px" class="dialog-form">
        <el-form-item label="陪玩账号">
          <el-input :value="logPlaymateName" disabled />
        </el-form-item>
        <el-form-item label="在线时长" prop="duration">
          <el-input-number v-model="logForm.duration" :min="1" :max="1440" :step="30" style="width: 200px;" />
          <span style="margin-left: 10px; color: #606266;">分钟</span>
          <span v-if="logForm.duration" style="margin-left: 15px; color: #409eff; font-weight: 500;">
            ({{ (logForm.duration / 60).toFixed(1) }} 小时)
          </span>
        </el-form-item>

        <el-form-item label="记录类型" prop="recordType">
          <el-radio-group v-model="logForm.recordType">
            <el-radio label="SESSION">会话打卡</el-radio>
            <el-radio label="MANUAL">手动录入</el-radio>
            <el-radio label="HEARTBEAT">心跳检测</el-radio>
            <el-radio label="ORDER">订单时长</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="归属日期" prop="logDate">
          <el-date-picker
            v-model="logForm.logDate"
            type="date"
            placeholder="选择归属日期"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="logForm.remark" type="textarea" :rows="2" placeholder="可选填备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="logOpen = false">取 消</el-button>
          <el-button type="primary" class="btn-submit" :loading="logSubmitLoading" @click="submitLogForm">保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 多维度在线时长统计面板对话框 -->
    <el-dialog
      v-model="statsOpen"
      title="陪玩在线时长多维统计"
      width="1200px"
      append-to-body
      destroy-on-close
      class="custom-dialog stats-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <span>陪玩在线时长多维统计面板</span>
        </div>
      </template>

      <div class="stats-container">
        <!-- 如果指定了具体陪玩，展示 KPI 卡片 -->
        <div v-if="summaryData" class="summary-cards">
          <div class="stat-card today">
            <div class="card-title">今日在线</div>
            <div class="card-value">{{ summaryData.todayDurationFormatted }}</div>
            <div class="card-sub">{{ summaryData.todayDuration || 0 }} 分钟</div>
          </div>
          <div class="stat-card week">
            <div class="card-title">本周在线</div>
            <div class="card-value">{{ summaryData.thisWeekDurationFormatted }}</div>
            <div class="card-sub">{{ summaryData.thisWeekDuration || 0 }} 分钟</div>
          </div>
          <div class="stat-card month">
            <div class="card-title">本月在线</div>
            <div class="card-value">{{ summaryData.thisMonthDurationFormatted }}</div>
            <div class="card-sub">{{ summaryData.thisMonthDuration || 0 }} 分钟</div>
          </div>
          <div class="stat-card total">
            <div class="card-title">累计总在线</div>
            <div class="card-value">{{ summaryData.totalDurationFormatted }}</div>
            <div class="card-sub">{{ summaryData.totalDuration || 0 }} 分钟</div>
          </div>
        </div>

        <!-- 统计筛选工具栏 -->
        <div class="stats-filter-bar">
          <div class="filter-item">
            <span class="filter-label">统计维度：</span>
            <el-radio-group v-model="statsQuery.dimension" size="default" @change="loadStatsData">
              <el-radio-button label="DAY">按日统计</el-radio-button>
              <el-radio-button label="WEEK">按周统计</el-radio-button>
              <el-radio-button label="MONTH">按月统计</el-radio-button>
              <el-radio-button label="ALL">全量汇总</el-radio-button>
            </el-radio-group>
          </div>

          <div class="filter-item">
            <el-input
              v-model="statsQuery.keyword"
              placeholder="搜索陪玩账号/昵称"
              clearable
              style="width: 220px;"
              @keyup.enter="loadStatsData"
              @clear="loadStatsData"
            />
            <el-button type="primary" style="margin-left: 10px;" @click="loadStatsData">查询</el-button>
            <el-button v-if="statsQuery.playmateId" type="info" plain @click="clearPlaymateFilter">查看全员</el-button>
          </div>
        </div>

        <!-- 统计结果表格 -->
        <el-table
          v-loading="statsLoading"
          :data="statsList"
          border
          class="nebula-modern-table"
          max-height="400"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="username" label="陪玩账号" min-width="120" align="center" />
          <el-table-column prop="nickname" label="陪玩昵称" min-width="120" align="center" />
          <el-table-column prop="periodKey" label="统计周期 / 时间" min-width="140" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.periodKey === 'TOTAL'" type="info">全量汇总</el-tag>
              <span v-else class="period-key-text">{{ scope.row.periodKey }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="dimension" label="维度" width="90" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.dimension === 'DAY'" type="success">日维度</el-tag>
              <el-tag v-else-if="scope.row.dimension === 'WEEK'" type="warning">周维度</el-tag>
              <el-tag v-else-if="scope.row.dimension === 'MONTH'" type="danger">月维度</el-tag>
              <el-tag v-else type="info">全量</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalDuration" label="在线总时长" min-width="130" align="center">
            <template #default="scope">
              <span style="font-weight: 600; color: #409eff;">{{ scope.row.totalDuration }} 分钟</span>
            </template>
          </el-table-column>
          <el-table-column prop="durationFormatted" label="格式化时长" min-width="130" align="center">
            <template #default="scope">
              <span style="font-weight: 500; color: #67c23a;">{{ scope.row.durationFormatted }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="recordCount" label="打卡/记录次数" min-width="110" align="center" />
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="statsOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs } from 'vue';
import {
  listPlaymate, getPlaymate, delPlaymate, addPlaymate, updatePlaymate,
  recordOnlineLog, getOnlineStats, getOnlineSummary
} from '../../../api/business/playmate.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const playmateList = ref([]);
const open = ref(false);
const loading = ref(true);
const submitLoading = ref(false);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

// 在线时长打卡相关变量
const logOpen = ref(false);
const logSubmitLoading = ref(false);
const logPlaymateName = ref("");
const logFormRef = ref(null);
const logForm = reactive({
  playmateId: "",
  duration: 60,
  recordType: "SESSION",
  logDate: new Date().toISOString().split('T')[0],
  remark: ""
});
const logRules = {
  duration: [
    { required: true, message: "请输入有效的在线时长", trigger: "blur" }
  ],
  logDate: [
    { required: true, message: "请选择归属日期", trigger: "change" }
  ]
};

// 统计面板相关变量
const statsOpen = ref(false);
const statsLoading = ref(false);
const statsList = ref([]);
const summaryData = ref(null);
const statsQuery = reactive({
  playmateId: undefined,
  dimension: "DAY",
  keyword: ""
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
    ],
    pricePerOrder: [
      { required: true, message: "接单价格不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);
const playmateRef = ref(null);

/** 分钟数格式化函数 */
function formatMinutes(minutes) {
  if (minutes == null || minutes <= 0) {
    return '0分钟';
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours > 0) {
    return rem > 0 ? `${hours}小时${rem}分` : `${hours}小时`;
  }
  return `${rem}分钟`;
}

/** 查询陪玩列表 */
function getList() {
  loading.value = true;
  listPlaymate(queryParams.value).then(response => {
    const data = response.result || response.data || response;
    playmateList.value = data.records || data.list || [];
    total.value = data.total || 0;
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
    pricePerOrder: 0,
    games: undefined,
    remark: undefined
  };
  if (playmateRef.value) {
    playmateRef.value.resetFields();
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
  title.value = "新增陪玩";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const userId = row.userId || ids.value[0];
  getPlaymate(userId).then(response => {
    const resData = response.result || response.data || response;
    const userData = resData.user || {};
    form.value = {
      ...resData,
      username: userData.username || resData.username,
      nickname: userData.nickname || resData.nickname,
      mobile: userData.mobile || resData.mobile,
      email: userData.email || resData.email,
      pricePerOrder: resData.pricePerOrder ?? 0,
      games: resData.games,
      remark: userData.remark || resData.remark
    };
    open.value = true;
    title.value = "修改陪玩";
  });
}

/** 提交按钮 */
function submitForm() {
  playmateRef.value.validate(valid => {
    if (valid) {
      submitLoading.value = true;
      if (form.value.userId != null) {
        updatePlaymate(form.value).then(response => {
          ElMessage.success("修改成功");
          open.value = false;
          getList();
        }).finally(() => {
          submitLoading.value = false;
        });
      } else {
        addPlaymate(form.value).then(response => {
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
  ElMessageBox.confirm('是否确认删除陪玩编号为"' + userIds + '"的数据项?', "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(function() {
    return delPlaymate(userIds);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  }).catch(() => {});
}

// --------------------- 在线时长记录/打卡 逻辑 ---------------------
function handleOpenLogDialog(row) {
  logForm.playmateId = row.userId;
  logForm.duration = 60;
  logForm.recordType = "SESSION";
  logForm.logDate = new Date().toISOString().split('T')[0];
  logForm.remark = "";
  logPlaymateName.value = (row.user?.nickname || row.user?.username || row.nickname || row.userId);
  logOpen.value = true;
}

function submitLogForm() {
  logFormRef.value.validate(valid => {
    if (valid) {
      logSubmitLoading.value = true;
      recordOnlineLog(logForm).then(() => {
        ElMessage.success("在线时长记录保存成功！");
        logOpen.value = false;
        getList(); // 刷新表格累计时长
      }).finally(() => {
        logSubmitLoading.value = false;
      });
    }
  });
}

// --------------------- 多维度在线时长统计 逻辑 ---------------------
function handleOpenGlobalStats() {
  statsQuery.playmateId = undefined;
  statsQuery.keyword = "";
  statsQuery.dimension = "DAY";
  summaryData.value = null;
  statsOpen.value = true;
  loadStatsData();
}

function handleOpenRowStats(row) {
  statsQuery.playmateId = row.userId;
  statsQuery.keyword = "";
  statsQuery.dimension = "DAY";
  statsOpen.value = true;
  loadSummary(row.userId);
  loadStatsData();
}

function clearPlaymateFilter() {
  statsQuery.playmateId = undefined;
  summaryData.value = null;
  loadStatsData();
}

function loadSummary(playmateId) {
  getOnlineSummary(playmateId).then(res => {
    summaryData.value = res.result || res.data || res;
  });
}

function loadStatsData() {
  statsLoading.value = true;
  getOnlineStats(statsQuery).then(res => {
    statsList.value = res.result || res.data || res || [];
  }).finally(() => {
    statsLoading.value = false;
  });
}

getList();
</script>

<style scoped>
.playmate-container {
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
  font-size: 15px;
}

.duration-badge {
  display: inline-block;
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 15px;
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

.action-link-success {
  color: #67c23a;
}
.action-link-success:hover {
  color: #85ce61;
}

.action-link-warning {
  color: #e6a23c;
}
.action-link-warning:hover {
  color: #ebb563;
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
  border-radius: 6px;
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
  font-weight: 600;
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

/* 统计弹框样式 */
.stats-container {
  padding: 16px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border-left: 4px solid #409eff;
  display: flex;
  flex-direction: column;
}

.stat-card.today {
  border-left-color: #67c23a;
  background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
}

.stat-card.week {
  border-left-color: #e6a23c;
  background: linear-gradient(135deg, #fffbe6 0%, #ffffff 100%);
}

.stat-card.month {
  border-left-color: #f56c6c;
  background: linear-gradient(135deg, #fff2f0 0%, #ffffff 100%);
}

.stat-card.total {
  border-left-color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%);
}

.card-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  color: #262626;
}

.card-sub {
  font-size: 13px;
  color: #595959;
  margin-top: 4px;
}

.stats-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-label {
  font-size: 15px;
  color: #606266;
  margin-right: 8px;
  font-weight: 500;
}

.period-key-text {
  font-weight: 600;
  color: #303133;
}
</style>
