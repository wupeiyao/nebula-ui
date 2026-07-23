<template>
  <div class="menu-management-container">
    <!-- 操作与表格主区域面板 -->
    <div class="main-card">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-bar">
        <el-form-item label="菜单名称" prop="menuName">
          <el-input
            v-model="queryParams.menuName"
            placeholder="请输入菜单名称"
            clearable
            @keyup.enter="handleQuery"
            @clear="handleQuery"
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="菜单状态"
            clearable
            class="status-select"
            @change="handleQuery"
          >
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-button type="primary" @click="handleAdd('0')">新增</el-button>
          <el-button type="primary" @click="toggleExpandAll">展开/折叠</el-button>
        </div>
        <div class="action-right">
          <el-tooltip content="隐藏/显示搜索" placement="top">
            <el-button circle :icon="Search" class="tool-btn" />
          </el-tooltip>
          <el-tooltip content="刷新" placement="top">
            <el-button circle :icon="RefreshRight" class="tool-btn" @click="getList" />
          </el-tooltip>
        </div>
      </div>

      <!-- 树形表格展示区域 -->
      <div class="table-wrapper">
        <el-table
          v-if="refreshTable"
          v-loading="loading"
          :data="menuList"
          row-key="menuId"
          :default-expand-all="isExpandAll"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          class="nebula-modern-table"
          border
        >
          <el-table-column prop="menuName" label="菜单名称" min-width="210" :show-overflow-tooltip="true">
            <template #default="scope">
              <span class="menu-name-text">{{ scope.row.menuName }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="icon" label="图标" align="center" width="80">
            <template #default="scope">
              <div v-if="scope.row.icon && scope.row.icon !== '#'" class="simple-icon">
                <el-icon><component :is="getIconComponent(scope.row.icon)" /></el-icon>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="orderNum" label="排序" align="center" width="80" />

          <el-table-column prop="perms" label="权限标识" min-width="160" :show-overflow-tooltip="true" />

          <el-table-column prop="component" label="组件路径" min-width="170" :show-overflow-tooltip="true" />

          <el-table-column prop="status" label="状态" align="center" width="100">
            <template #default="scope">
              <span v-if="scope.row.status === '0'" class="status-plain active-status">正常</span>
              <span v-else class="status-plain disabled-status">停用</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" align="center" width="160">
            <template #default="scope">
              <span>{{ scope.row.createTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="200" fixed="right">
            <template #default="scope">
              <div class="action-links">
                <el-button link type="primary" class="action-link" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button link type="primary" class="action-link" @click="handleAdd(scope.row.menuId)">新增</el-button>
                <el-button link type="danger" class="action-link action-link-danger" @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 表格底部汇总信息 -->
      <div class="table-footer">
        <div class="footer-info">
          <span>共 {{ totalCount }} 条</span>
        </div>
        <!-- 模拟原图分页 -->
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :background="true"
          layout="sizes, prev, pager, next, jumper"
          :total="totalCount"
          class="custom-pagination"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增 / 修改菜单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="680px"
      append-to-body
      destroy-on-close
      class="custom-dialog"
    >
      <template #header>
        <div class="dialog-header-title">
          <div class="header-icon-box">
            <el-icon><Operation /></el-icon>
          </div>
          <span>{{ dialogTitle }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="dialog-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="上级菜单" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="menuOptions"
                :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
                value-key="menuId"
                placeholder="选择上级菜单"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType" class="type-radio-group">
                <el-radio-button value="M">
                  <el-icon><Folder /></el-icon> 目录
                </el-radio-button>
                <el-radio-button value="C">
                  <el-icon><Document /></el-icon> 菜单
                </el-radio-button>
                <el-radio-button value="F">
                  <el-icon><Operation /></el-icon> 按钮
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item label="菜单图标" prop="icon">
              <el-select v-model="form.icon" placeholder="选择图标" filterable clearable style="width: 100%">
                <template #prefix>
                  <el-icon v-if="form.icon"><component :is="getIconComponent(form.icon)" /></el-icon>
                </template>
                <el-option
                  v-for="iconName in availableIcons"
                  :key="iconName"
                  :label="iconName"
                  :value="iconName"
                >
                  <div class="icon-option flex items-center gap-2">
                    <el-icon><component :is="getIconComponent(iconName)" /></el-icon>
                    <span>{{ iconName }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" :min="0" :max="999" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item label="是否外链">
              <el-radio-group v-model="form.isFrame">
                <el-radio value="0">是</el-radio>
                <el-radio value="1">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item label="路由地址" prop="path">
              <el-input v-model="form.path" placeholder="路由地址 (如 system/menu)" />
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="form.menuType === 'C'">
            <el-form-item label="组件路径" prop="component">
              <el-input v-model="form.component" placeholder="组件路径 (如 system/menu/index)" />
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="form.menuType !== 'M'">
            <el-form-item label="权限字符" prop="perms">
              <el-input v-model="form.perms" placeholder="权限标识 (如 system:menu:list)" />
            </el-form-item>
          </el-col>

          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item label="显示状态">
              <el-radio-group v-model="form.visible">
                <el-radio value="0">显示</el-radio>
                <el-radio value="1">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="菜单状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-cancel" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="btn-submit" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Plus, Sort, RefreshRight, Edit, Delete, Folder, Document, Operation, Menu, More
} from '@element-plus/icons-vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import {
  getMenuTree, getMenu, addMenu, updateMenu, delMenu
} from '../../../api/system/menu.js';

const { proxy } = getCurrentInstance();
const router = useRouter();

const loading = ref(false);
const refreshTable = ref(true);
const isExpandAll = ref(false);
const allMenuList = ref([]);
const menuList = ref([]);
const menuOptions = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref(null);

const currentPage = ref(1);
const pageSize = ref(10);

const availableIcons = [
  'Setting', 'User', 'UserFilled', 'Avatar', 'Grid', 'Operation',
  'OfficeBuilding', 'Platform', 'StarFilled', 'ShoppingCart', 'Headset',
  'Odometer', 'House', 'DocumentText', 'Monitor', 'Collection', 'Bell',
  'Folder', 'Timer', 'Tools', 'Lock', 'Goods', 'Share'
];

const queryParams = reactive({
  menuName: '',
  status: ''
});

const form = reactive({
  menuId: undefined,
  parentId: '0',
  menuName: '',
  icon: 'Menu',
  menuType: 'M',
  orderNum: 1,
  isFrame: '1',
  isCache: '0',
  visible: '0',
  status: '0',
  path: '',
  component: '',
  perms: ''
});

const rules = {
  menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  orderNum: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }]
};

const ICON_ALIAS_MAP = {
  'system': 'Setting',
  'user': 'User',
  'peoples': 'UserFilled',
  'role': 'Avatar',
  'tree-table': 'Grid',
  'tree': 'Operation',
  'dept': 'OfficeBuilding',
  'gamepad': 'Platform',
  'user-star': 'StarFilled',
  'shopping-cart': 'ShoppingCart',
  'game-console': 'Headset',
  'dashboard': 'Odometer',
  'home': 'House',
  'log': 'DocumentText',
  'monitor': 'Monitor',
  'dict': 'Collection',
  'notice': 'Bell',
  'file': 'Folder',
  'job': 'Timer',
  'tool': 'Tools'
};

const toPascalCase = (str) => {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

const getIconComponent = (iconName) => {
  if (!iconName || iconName === '#') return ElementPlusIconsVue.Menu;
  const lowerIcon = iconName.toLowerCase().trim();
  if (ICON_ALIAS_MAP[lowerIcon]) {
    const aliasName = ICON_ALIAS_MAP[lowerIcon];
    if (ElementPlusIconsVue[aliasName]) {
      return ElementPlusIconsVue[aliasName];
    }
  }
  const pascalName = toPascalCase(iconName);
  if (ElementPlusIconsVue[pascalName]) {
    return ElementPlusIconsVue[pascalName];
  }
  const directName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (ElementPlusIconsVue[directName]) {
    return ElementPlusIconsVue[directName];
  }
  return ElementPlusIconsVue.Menu;
};

const totalCount = computed(() => allMenuList.value.length);

const updatePagedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  menuList.value = allMenuList.value.slice(start, end);
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  updatePagedData();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  updatePagedData();
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await getMenuTree(queryParams);
    allMenuList.value = res.result || res.data || [];
    currentPage.value = 1;
    updatePagedData();
  } catch (error) {
    console.error('获取菜单失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  getList();
};

const resetQuery = () => {
  queryParams.menuName = '';
  queryParams.status = '';
  handleQuery();
};

const toggleExpandAll = () => {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
};

const resetForm = () => {
  form.menuId = undefined;
  form.parentId = '0';
  form.menuName = '';
  form.icon = 'Menu';
  form.menuType = 'M';
  form.orderNum = 1;
  form.isFrame = '1';
  form.isCache = '0';
  form.visible = '0';
  form.status = '0';
  form.path = '';
  form.component = '';
  form.perms = '';
};

const loadMenuOptions = () => {
  menuOptions.value = [
    {
      menuId: '0',
      menuName: '主类目 (顶级菜单)',
      children: allMenuList.value
    }
  ];
};

const handleAdd = (parentId) => {
  resetForm();
  loadMenuOptions();
  if (parentId) {
    form.parentId = parentId;
  }
  dialogTitle.value = '新增菜单';
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  resetForm();
  loadMenuOptions();
  try {
    const res = await getMenu(row.menuId);
    const data = res.result || res.data || row;
    Object.assign(form, data);
    dialogTitle.value = '修改菜单';
    dialogVisible.value = true;
  } catch (error) {
    console.error('获取菜单详情失败:', error);
  }
};

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.menuId) {
        await updateMenu(form);
        ElMessage.success('修改成功');
      } else {
        await addMenu(form);
        ElMessage.success('新增成功');
      }
      dialogVisible.value = false;
      getList();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除名称为"${row.menuName}"的菜单吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delMenu(row.menuId);
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.menu-management-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

/* 主面板容器 */
.main-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 0;
}

:deep(.search-bar .el-form-item) {
  margin-bottom: 16px;
  margin-right: 16px;
}

:deep(.search-bar .el-form-item__label) {
  font-weight: 400;
  color: #606266;
}

.search-input {
  width: 200px;
}
:deep(.search-input .el-input__wrapper) {
  border-radius: 4px;
}

.status-select {
  width: 120px;
}
:deep(.status-select .el-input__wrapper) {
  border-radius: 4px;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left .el-button {
  border-radius: 4px;
}

.tool-btn {
  border-color: #dcdfe6;
  color: #606266;
  padding: 8px;
}
.tool-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

/* 表格容器与基础控制 */
.table-wrapper {
  flex: 1;
}

.nebula-modern-table {
  width: 100%;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #f8f8f9 !important;
  color: #515a6e !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  height: 44px !important;
  padding: 8px 0;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 8px 0 !important;
  font-size: 14px;
  color: #606266;
}

/* 单元格样式 */
.menu-name-text {
  color: #303133;
}

.simple-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #409eff;
}

.status-plain {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  display: inline-block;
  line-height: 1.2;
}

.active-status {
  color: #409eff;
  border: 1px solid #d9ecff;
  background-color: #ecf5ff;
}

.disabled-status {
  color: #f56c6c;
  border: 1px solid #fde2e2;
  background-color: #fef0f0;
}

/* 操作列链接 */
.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-link {
  font-size: 13px;
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

/* 表格底部 footer */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
}

.footer-info {
  font-size: 14px;
  color: #606266;
}

/* 弹窗样式 */
:deep(.custom-dialog) {
  border-radius: 4px !important;
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
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-icon-box {
  display: none;
}

.type-radio-group {
  margin-bottom: 4px;
}

:deep(.type-radio-group .el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.btn-cancel, .btn-submit {
  border-radius: 4px;
}
</style>
