<template>
  <div class="playmate-container">
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
        <el-button type="primary" class="toolbar-btn" @click="handleAdd">新增</el-button>
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
          <el-table-column prop="userId" label="用户ID" min-width="120" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="pricePerOrder" label="接单价格" min-width="120" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="games" label="擅长游戏" min-width="150" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="onlineStatus" label="在线状态" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.onlineStatus === '1'" type="success">在线</el-tag>
              <el-tag v-else-if="scope.row.onlineStatus === '2'" type="danger">忙碌</el-tag>
              <el-tag v-else type="info">离线</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="serviceRating" label="服务评分" min-width="100" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="操作" align="center" width="180" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="primary" class="action-link" @click="handleUpdate(scope.row)">编辑</el-button>
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

          <el-col :span="12">
            <el-form-item label="是否接单" prop="isTakingOrders">
              <el-radio-group v-model="form.isTakingOrders">
                <el-radio label="1">接单中</el-radio>
                <el-radio label="0">休息</el-radio>
              </el-radio-group>
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
  </div>
</template>

<script setup>
import { ref, reactive, toRefs } from 'vue';
import { listPlaymate, getPlaymate, delPlaymate, addPlaymate, updatePlaymate } from '../../../api/business/playmate.js';
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

const data = reactive({
  form: {
    isTakingOrders: "0"
  },
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
    isTakingOrders: "0",
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
      isTakingOrders: resData.isTakingOrders != null ? String(resData.isTakingOrders) : "0",
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
  font-size: 16px;
}

.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-link {
  font-size: 16px;
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
</style>

