<template>
  <el-dialog
    v-model="dialogVisible"
    title="挑选陪玩人员"
    width="1000px"
    append-to-body
    destroy-on-close
    class="custom-dialog"
  >
    <div class="playmate-select-container">
      <div class="search-bar">
        <el-input
          v-model="queryParams.userId"
          placeholder="搜索陪玩ID / 用户名 / 昵称 / 游戏"
          clearable
          style="width: 280px"
          @keyup.enter="handleQuery"
          @clear="handleQuery"
        />
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button @click="resetQuery">重置</el-button>
        
        <div style="flex: 1; text-align: right;">
          <el-button
            type="success"
            :disabled="selectedRows.length === 0"
            @click="handleBatchConfirm"
          >
            确认添加选中 ({{ selectedRows.length }})
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="playmateList"
        border
        stripe
        style="width: 100%; margin-top: 12px;"
        max-height="400"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" :selectable="checkSelectable" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="user.nickname" label="陪玩昵称" min-width="120" align="center">
          <template #default="scope">
            <span>{{ scope.row.user?.nickname || scope.row.nickname || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="user.username" label="登录账号" min-width="110" align="center">
          <template #default="scope">
            <span>{{ scope.row.user?.username || scope.row.username || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="games" label="擅长游戏" min-width="140" align="center" :show-overflow-tooltip="true" />

<!--        <el-table-column prop="pricePerOrder" label="接单价格" width="110" align="center">-->
<!--          <template #default="scope">-->
<!--            <span class="price-text">￥{{ scope.row.pricePerOrder || '0.00' }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->

        <el-table-column prop="onlineStatus" label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.onlineStatus === '1'" type="success" size="small">在线</el-tag>
            <el-tag v-else-if="scope.row.onlineStatus === '2'" type="danger" size="small">忙碌</el-tag>
            <el-tag v-else type="info" size="small">离线</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="110" align="center">
          <template #default="scope">
            <el-tooltip
              v-if="scope.row.onlineStatus !== '1'"
              :content="scope.row.onlineStatus === '2' ? '陪玩处于忙碌中，不可选择接单' : '陪玩处于离线中，不可选择接单'"
              placement="top"
            >
              <el-button type="info" size="small" plain disabled>
                无法接单
              </el-button>
            </el-tooltip>
            <el-button v-else type="primary" size="small" plain @click="handleSelectSingle(scope.row)">
              添加
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
import { listPlaymate } from '../../../../api/business/playmate.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: String,
    default: undefined
  },
  endTime: {
    type: String,
    default: undefined
  }
});

const emit = defineEmits(['update:visible', 'select']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const playmateList = ref([]);
const loading = ref(false);
const total = ref(0);
const selectedRows = ref([]);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 10,
  userId: undefined,
  startTime: undefined,
  endTime: undefined
});

function getList() {
  queryParams.startTime = props.startTime;
  queryParams.endTime = props.endTime;
  
  loading.value = true;
  listPlaymate(queryParams).then(res => {
    const resData = res.result || res.data || res;
    playmateList.value = resData.records || resData.list || [];
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

function checkSelectable(row) {
  return row && row.onlineStatus === '1';
}

function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

function handleSelectSingle(row) {
  emit('select', [row]);
  dialogVisible.value = false;
}

function handleBatchConfirm() {
  if (selectedRows.value.length > 0) {
    emit('select', [...selectedRows.value]);
    dialogVisible.value = false;
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedRows.value = [];
    getList();
  }
});
</script>

<style scoped>
.playmate-select-container {
  padding: 10px 0;
}

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.price-text {
  color: #e6a23c;
  font-weight: bold;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
