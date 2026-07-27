<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择客户"
    width="750px"
    append-to-body
    destroy-on-close
    class="custom-dialog"
  >
    <div class="customer-select-container">
      <div class="search-bar">
        <el-input
          v-model="queryParams.userId"
          placeholder="搜索用户ID / 用户名 / 昵称"
          clearable
          style="width: 280px"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="customerList"
        border
        stripe
        highlight-current-row
        style="width: 100%; margin-top: 12px;"
        max-height="380"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="user.username" label="用户名" min-width="120" align="center">
          <template #default="scope">
            <span>{{ scope.row.user?.username || scope.row.username || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="user.nickname" label="昵称" min-width="120" align="center">
          <template #default="scope">
            <span>{{ scope.row.user?.nickname || scope.row.nickname || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="user.mobile" label="手机号" min-width="120" align="center">
          <template #default="scope">
            <span>{{ scope.row.user?.mobile || scope.row.mobile || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="vipLevel" label="VIP" width="90" align="center">
          <template #default="scope">
            <el-tag type="warning" effect="plain" size="small">VIP {{ scope.row.vipLevel || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleSelect(scope.row)">
              选择
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[5, 10, 20]"
          layout="prev, pager, next, total"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { listCustomer } from '../../../../api/business/customer.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'select']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const customerList = ref([]);
const loading = ref(false);
const total = ref(0);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  userId: undefined
});

function getList() {
  loading.value = true;
  listCustomer(queryParams).then(res => {
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
  queryParams.userId = undefined;
  handleQuery();
}

function handleSelect(row) {
  emit('select', row);
  dialogVisible.value = false;
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    getList();
  }
});
</script>

<style scoped>
.customer-select-container {
  padding: 10px 0;
}

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
