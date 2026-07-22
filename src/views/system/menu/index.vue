<template>
  <div class="menu-management-container">
    <!-- 页面顶栏标题与描述说明 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">菜单管理</h2>
        <p class="page-desc">配置与管理系统的树形导航结构、路由组件与按钮操作权限</p>
      </div>
    </div>

    <!-- 操作与表格主区域面板 -->
    <div class="main-card">
      <!-- 综合工具栏（融合参考图中“创建操作 + 右侧搜索过滤”布局） -->
      <div class="toolbar-wrapper">
        <div class="toolbar-left">
          <el-button type="primary" class="btn-create" :icon="Plus" @click="handleAdd('0')">
            新建菜单
          </el-button>
          <el-button class="btn-secondary" :icon="Sort" @click="toggleExpandAll">
            {{ isExpandAll ? '折叠全部' : '展开全部' }}
          </el-button>
        </div>

        <div class="toolbar-right">
          <!-- 搜索过滤组 -->
          <div class="search-group">
            <el-input
              v-model="queryParams.menuName"
              placeholder="搜索菜单名称"
              clearable
              :prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleQuery"
              @clear="handleQuery"
            />
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
            <el-button type="primary" plain class="btn-search" @click="handleQuery">查询</el-button>
            <el-button class="btn-reset" :icon="Refresh" @click="resetQuery">重置</el-button>
          </div>

          <div class="divider-line"></div>

          <el-tooltip content="刷新表格" placement="top">
            <el-button :icon="RefreshRight" circle class="btn-refresh" @click="getList" />
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
        >
          <!-- 菜单名称列 -->
          <el-table-column prop="menuName" label="菜单名称" min-width="210" :show-overflow-tooltip="true">
            <template #default="scope">
              <div class="menu-name-cell">
                <div class="icon-avatar" :class="`type-${scope.row.menuType?.toLowerCase()}`">
                  <el-icon v-if="scope.row.icon">
                    <component :is="getIconComponent(scope.row.icon)" />
                  </el-icon>
                  <el-icon v-else><Menu /></el-icon>
                </div>
                <span class="menu-name-text">{{ scope.row.menuName }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 菜单类型列 -->
          <el-table-column prop="menuType" label="类型" align="center" width="110">
            <template #default="scope">
              <span v-if="scope.row.menuType === 'M'" class="type-badge badge-dir">
                <el-icon><Folder /></el-icon> 目录
              </span>
              <span v-else-if="scope.row.menuType === 'C'" class="type-badge badge-menu">
                <el-icon><Document /></el-icon> 菜单
              </span>
              <span v-else-if="scope.row.menuType === 'F'" class="type-badge badge-btn">
                <el-icon><Operation /></el-icon> 按钮
              </span>
            </template>
          </el-table-column>

          <!-- 图标列 -->
          <el-table-column prop="icon" label="图标" align="center" width="80">
            <template #default="scope">
              <div v-if="scope.row.icon && scope.row.icon !== '#'" class="simple-icon-preview">
                <el-icon><component :is="getIconComponent(scope.row.icon)" /></el-icon>
              </div>
              <span v-else class="text-placeholder">-</span>
            </template>
          </el-table-column>

          <!-- 排序号 -->
          <el-table-column prop="orderNum" label="排序" align="center" width="80">
            <template #default="scope">
              <span class="order-badge">{{ scope.row.orderNum }}</span>
            </template>
          </el-table-column>

          <!-- 路由地址 -->
          <el-table-column prop="path" label="路由地址" min-width="140" :show-overflow-tooltip="true">
            <template #default="scope">
              <code class="code-text" v-if="scope.row.path">{{ scope.row.path }}</code>
              <span v-else class="text-placeholder">-</span>
            </template>
          </el-table-column>

          <!-- 组件路径 -->
          <el-table-column prop="component" label="组件路径" min-width="170" :show-overflow-tooltip="true">
            <template #default="scope">
              <code class="code-text component-code" v-if="scope.row.component">{{ scope.row.component }}</code>
              <span v-else class="text-placeholder">-</span>
            </template>
          </el-table-column>

          <!-- 权限标识 -->
          <el-table-column prop="perms" label="权限标识" min-width="160" :show-overflow-tooltip="true">
            <template #default="scope">
              <span class="perm-pill" v-if="scope.row.perms">{{ scope.row.perms }}</span>
              <span v-else class="text-placeholder">-</span>
            </template>
          </el-table-column>

          <!-- 状态列（参考图中经典绿点/红点带底色 Pill 样式） -->
          <el-table-column prop="status" label="状态" align="center" width="100">
            <template #default="scope">
              <div v-if="scope.row.status === '0'" class="status-pill status-active">
                <span class="dot"></span>
                <span class="label">正常</span>
              </div>
              <div v-else class="status-pill status-disabled">
                <span class="dot"></span>
                <span class="label">停用</span>
              </div>
            </template>
          </el-table-column>

          <!-- 操作栏 -->
          <el-table-column label="操作" align="center" width="200" fixed="right">
            <template #default="scope">
              <div class="action-buttons">
                <el-tooltip content="修改" placement="top">
                  <el-button link type="primary" :icon="Edit" class="action-btn-icon edit-btn" @click="handleEdit(scope.row)"></el-button>
                </el-tooltip>
                <el-tooltip content="新增子菜单" placement="top">
                  <el-button link type="success" :icon="Plus" class="action-btn-icon add-btn" @click="handleAdd(scope.row.menuId)"></el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button link type="danger" :icon="Delete" class="action-btn-icon del-btn" @click="handleDelete(scope.row)"></el-button>
                </el-tooltip>
                <el-tooltip content="更多" placement="top">
                  <el-button link type="info" :icon="More" class="action-btn-icon more-btn"></el-button>
                </el-tooltip>
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
  gap: 16px;
  width: 100%;
}

.page-header {
  padding: 4px 4px 12px 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.2px;
}

.page-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* 主面板容器 */
.main-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.02);
}

/* 工具栏 */
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.btn-create {
  border-radius: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
}

.btn-secondary {
  border-radius: 8px;
  border-color: #e2e8f0;
  color: #475569;
}

.btn-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}

.btn-secondary {
  border-radius: 8px;
  border-color: #cbd5e1;
  color: #475569;
  font-weight: 500;
}

.btn-secondary:hover {
  background-color: #f8fafc;
  color: #1e293b;
  border-color: #94a3b8;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 200px;
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 8px;
}

.status-select {
  width: 120px;
}

:deep(.status-select .el-input__wrapper) {
  border-radius: 8px;
}

.btn-search {
  border-radius: 8px;
  font-weight: 500;
}

.btn-reset {
  border-radius: 8px;
  color: #64748b;
}

.divider-line {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
}

.btn-refresh {
  border-color: #e2e8f0;
  color: #64748b;
}

.btn-refresh:hover {
  color: #2563eb;
  border-color: #bfdbfe;
  background-color: #eff6ff;
}

/* 表格容器与基础控制 */
.table-wrapper {
  border-radius: 8px;
  overflow: hidden;
  /* 去除外边框以更贴合原图现代感 */
}

.nebula-modern-table {
  width: 100%;
}

:deep(.nebula-modern-table .el-table__header-wrapper th) {
  background-color: #ffffff !important;
  color: #64748b !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  height: 50px !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

:deep(.nebula-modern-table .el-table__row) {
  transition: background-color 0.15s ease;
}

:deep(.nebula-modern-table .el-table__row:hover > td) {
  background-color: #f8fafc !important;
}

:deep(.nebula-modern-table td.el-table__cell) {
  padding: 14px 0 !important;
  border-bottom: 1px solid #f8fafc !important;
  font-size: 14px;
}

/* 单元格特别样式 */
.menu-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.icon-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.menu-name-cell:hover .icon-avatar {
  transform: scale(1.1);
}

.type-m {
  background-color: #f3e8ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

.type-c {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.type-f {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.menu-name-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

/* 菜单类型 Badge */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.badge-dir {
  background-color: #f3e8ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

.badge-menu {
  background-color: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.badge-btn {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.simple-icon-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #334155;
}

.order-badge {
  display: inline-block;
  padding: 1px 8px;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.code-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.component-code {
  color: #475569;
  background-color: #f1f5f9;
}

.perm-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #047857;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 2px 8px;
  border-radius: 6px;
}

.text-placeholder {
  color: #cbd5e1;
}

/* 状态 Pill (绿点/红点) 参考图片中标准样式 */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background-color: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-active .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

.status-disabled {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.status-disabled .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ef4444;
}

/* 操作列按钮组 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px; /* 加大图标间距 */
}

.action-btn-icon {
  font-size: 16px !important;
  padding: 4px !important;
  margin: 0 !important;
  transition: transform 0.2s;
}

.action-btn-icon:hover {
  transform: scale(1.15);
}

.edit-btn {
  color: #3b82f6 !important;
}

.add-btn {
  color: #10b981 !important;
}

.del-btn {
  color: #ef4444 !important;
}

.more-btn {
  color: #64748b !important;
}

/* 表格底部 footer */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  font-size: 14px;
  color: #64748b;
}

:deep(.custom-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
  color: white !important;
  border: none;
}

:deep(.custom-pagination .el-pager li) {
  border-radius: 6px;
  font-weight: 500;
}

/* 弹窗样式 */
:deep(.custom-dialog) {
  border-radius: 16px !important;
  overflow: hidden;
}

.dialog-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.header-icon-box {
  width: 32px;
  height: 32px;
  background-color: #eff6ff;
  color: #2563eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
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
  gap: 12px;
}

.btn-cancel {
  border-radius: 8px;
}

.btn-submit {
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  font-weight: 600;
}
</style>
