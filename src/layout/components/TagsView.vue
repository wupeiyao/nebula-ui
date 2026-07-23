<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-view-wrapper" @wheel.prevent="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :class="isActive(tag) ? 'active' : ''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        class="tags-view-item"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <span style="font-size: 16px">{{ tag.title }}</span>
        <el-icon v-if="!isAffix(tag)" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)"><Close /></el-icon>
      </router-link>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '../../store/tagsView.js'
import { Close } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const visitedViews = computed(() => tagsViewStore.visitedViews)

const isActive = (tag) => {
  return tag.path === route.path
}

const isAffix = (tag) => {
  return tag.meta && tag.meta.affix
}

const addTags = () => {
  const { name } = route
  if (name) {
    tagsViewStore.addView(route)
  }
  return false
}

const initTags = () => {
  // Add a default home tag if it doesn't exist
  const affixTags = [
    {
      fullPath: '/dashboard',
      path: '/dashboard',
      name: 'Dashboard',
      title: '首页',
      meta: { affix: true }
    }
  ]
  for (const tag of affixTags) {
    tagsViewStore.addVisitedView(tag)
  }
}

const closeSelectedTag = async (view) => {
  const { visitedViews } = await tagsViewStore.delView(view)
  if (isActive(view)) {
    toLastView(visitedViews, view)
  }
}

const toLastView = (visitedViews, view) => {
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath)
  } else {
    // default to home if nothing left
    if (view.name === 'Dashboard') {
      router.replace({ path: '/redirect' + view.fullPath })
    } else {
      router.push('/')
    }
  }
}

watch(route, () => {
  addTags()
}, { immediate: true })

onMounted(() => {
  initTags()
  addTags()
})
</script>

<style scoped>
.tags-view-container {
  height: 48px;
  width: 100%;
  background: #f1f5f9;
  padding: 8px 16px 0 16px;
  box-sizing: border-box;
}

.tags-view-wrapper {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 8px;
}

:deep(.el-scrollbar__view) {
  display: flex;
  align-items: center;
  height: 100%;
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  height: 100%;
  color: #606266;
  padding: 0 16px;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s;
}

/* 竖线分隔符 */
.tags-view-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 14px;
  background-color: #e4e7ed;
}

.tags-view-item:hover {
  color: #1890ff;
}

.tags-view-item.active {
  color: #1890ff;
  font-weight: 500;
}

.el-icon-close {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  text-align: center;
  transition: all 0.2s;
  margin-left: 6px;
  color: #c0c4cc;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.el-icon-close:hover {
  background-color: #f0f2f5;
  color: #f56c6c;
}
</style>
