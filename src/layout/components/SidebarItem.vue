<template>
  <!-- 如果菜单类型为按钮 (menuType === 'F') 或被设置为隐藏 (visible === '1')，则不渲染在侧边栏 -->
  <template v-if="item.menuType !== 'F' && item.visible !== '1'">
    <!-- 带有可展示子菜单节点 (有非按钮类型的子菜单) -->
    <el-sub-menu
      v-if="hasChildren(item)"
      :index="resolvePath(item.path)"
      teleported
      class="nebula-sub-menu"
    >
      <template #title>
        <el-icon v-if="item.icon" class="menu-icon">
          <component :is="getIconComponent(item.icon)" />
        </el-icon>
        <span class="menu-title-text">{{ item.menuName }}</span>
      </template>

      <!-- 递归渲染子菜单 -->
      <sidebar-item
        v-for="child in item.children"
        :key="child.menuId"
        :item="child"
        :base-path="resolvePath(item.path)"
      />
    </el-sub-menu>

    <!-- 单节点菜单项 -->
    <el-menu-item
      v-else
      :index="resolvePath(item.path)"
      @click="handleNavigate(resolvePath(item.path))"
      class="nebula-menu-item"
    >
      <el-icon v-if="item.icon" class="menu-icon">
        <component :is="getIconComponent(item.icon)" />
      </el-icon>
      <template #title>
        <span class="menu-title-text">{{ item.menuName }}</span>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  basePath: {
    type: String,
    default: ''
  }
});

const router = useRouter();

// 判断是否包含非按钮类型的可展示子节点
const hasChildren = (menu) => {
  if (!menu.children || menu.children.length === 0) {
    return false;
  }
  // 校验是否存在至少一个可见且非按钮类型('F')的子菜单
  return menu.children.some(child => child.menuType !== 'F' && child.visible !== '1');
};

// 拼接完成的路由路径
const resolvePath = (routePath) => {
  if (!routePath) return props.basePath || '/';
  if (routePath.startsWith('/')) {
    return routePath;
  }
  const base = props.basePath.endsWith('/') ? props.basePath.slice(0, -1) : props.basePath;
  return `${base}/${routePath}`;
};

// 图标别名映射表 (兼容 RuoYi 传统图标名、业务图标名及常用缩写)
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

// 短横线命名转 PascalCase (例如 user-star -> UserStar)
const toPascalCase = (str) => {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

// 获取 Element Plus 图标组件
const getIconComponent = (iconName) => {
  if (!iconName || iconName === '#') return ElementPlusIconsVue.Menu;

  const lowerIcon = iconName.toLowerCase().trim();

  // 1. 优先从别名映射表中获取匹配图标
  if (ICON_ALIAS_MAP[lowerIcon]) {
    const aliasName = ICON_ALIAS_MAP[lowerIcon];
    if (ElementPlusIconsVue[aliasName]) {
      return ElementPlusIconsVue[aliasName];
    }
  }

  // 2. 转为 PascalCase (如 shopping-cart -> ShoppingCart) 匹配
  const pascalName = toPascalCase(iconName);
  if (ElementPlusIconsVue[pascalName]) {
    return ElementPlusIconsVue[pascalName];
  }

  // 3. 首字母大写匹配
  const directName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (ElementPlusIconsVue[directName]) {
    return ElementPlusIconsVue[directName];
  }

  // 4. 默认兜底图标
  return ElementPlusIconsVue.Menu;
};

// 处理页面导航
const handleNavigate = (path) => {
  if (path) {
    router.push(path);
  }
};
</script>

<style scoped>
.menu-icon {
  margin-right: 12px;
  font-size: 20px;
  transition: transform 0.25s ease, color 0.25s ease;
  vertical-align: middle;
}

.menu-title-text {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.3px;
  vertical-align: middle;
}
</style>

