<template>
  <div ref="containerRef" class="tags-view-container">
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

    <!-- 右键上下文菜单 -->
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">
        <el-icon><Refresh /></el-icon>
        <span>刷新页面</span>
      </li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">
        <el-icon><Close /></el-icon>
        <span>关闭当前</span>
      </li>
      <li @click="closeOthersTags">
        <el-icon><CircleClose /></el-icon>
        <span>关闭其他</span>
      </li>
      <li v-if="!isFirstView()" @click="closeLeftTags">
        <el-icon><Back /></el-icon>
        <span>关闭左侧</span>
      </li>
      <li v-if="!isLastView()" @click="closeRightTags">
        <el-icon><Right /></el-icon>
        <span>关闭右侧</span>
      </li>
      <li @click="closeAllTags">
        <el-icon><FolderDelete /></el-icon>
        <span>关闭所有</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '../../store/tagsView.js'
import { Close, Refresh, CircleClose, Back, Right, FolderDelete } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref({})
const containerRef = ref(null)

const visitedViews = computed(() => tagsViewStore.visitedViews)

const isActive = (tag) => {
  return tag.path === route.path
}

const isAffix = (tag) => {
  if (!tag) return false
  return !!(tag.meta?.affix || tag.path === '/dashboard' || tag.name === 'Dashboard' || tag.title === '首页')
}

const handleScroll = () => {
  // 可扩展横向滚动逻辑
}

const addTags = () => {
  const { name } = route
  if (name) {
    tagsViewStore.addView(route)
  }
  return false
}

const initTags = () => {
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
  if (isAffix(view)) return
  const { visitedViews } = await tagsViewStore.delView(view)
  if (isActive(view)) {
    toLastView(visitedViews, view)
  }
}

const refreshSelectedTag = (view) => {
  tagsViewStore.delCachedView(view).then(() => {
    const { fullPath } = view
    nextTick(() => {
      router.replace({
        path: '/redirect' + fullPath
      })
    })
  })
}

const closeOthersTags = async () => {
  if (selectedTag.value.path !== route.path) {
    router.push(selectedTag.value)
  }
  await tagsViewStore.delOthersViews(selectedTag.value)
}

const closeLeftTags = async () => {
  const { visitedViews: views } = await tagsViewStore.delLeftViews(selectedTag.value)
  if (!views.some(v => v.path === route.path)) {
    router.push(selectedTag.value.fullPath)
  }
}

const closeRightTags = async () => {
  const { visitedViews: views } = await tagsViewStore.delRightViews(selectedTag.value)
  if (!views.some(v => v.path === route.path)) {
    router.push(selectedTag.value.fullPath)
  }
}

const closeAllTags = async () => {
  const { visitedViews: views } = await tagsViewStore.delAllViews()
  if (isAffix(route)) {
    return
  }
  toLastView(views, selectedTag.value)
}

const toLastView = (visitedViews, view) => {
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath)
  } else {
    if (view.name === 'Dashboard' || view.path === '/dashboard') {
      router.replace({ path: '/redirect' + view.fullPath })
    } else {
      router.push('/')
    }
  }
}

const isFirstView = () => {
  const index = visitedViews.value.findIndex(v => v.path === selectedTag.value.path)
  if (index <= 0) return true
  return !visitedViews.value.slice(0, index).some(tag => !isAffix(tag))
}

const isLastView = () => {
  const index = visitedViews.value.findIndex(v => v.path === selectedTag.value.path)
  if (index < 0 || index === visitedViews.value.length - 1) return true
  return !visitedViews.value.slice(index + 1).some(tag => !isAffix(tag))
}

const openMenu = (tag, e) => {
  const menuMinWidth = 110
  if (!containerRef.value) return
  const offsetLeft = containerRef.value.getBoundingClientRect().left
  const offsetWidth = containerRef.value.offsetWidth
  const maxLeft = offsetWidth - menuMinWidth
  const l = e.clientX - offsetLeft + 15

  if (l > maxLeft) {
    left.value = maxLeft
  } else {
    left.value = l
  }

  top.value = e.clientY - containerRef.value.getBoundingClientRect().top + 5
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => {
  visible.value = false
}

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu)
  } else {
    document.body.removeEventListener('click', closeMenu)
  }
})

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
  position: relative;
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

/* 右键菜单 */
.contextmenu {
  margin: 0;
  background: #ffffff;
  z-index: 3000;
  position: absolute;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  color: #333333;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  user-select: none;
}

.contextmenu li {
  margin: 0;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.contextmenu li:hover {
  background: #f0f7ff;
  color: #1890ff;
}

.contextmenu li .el-icon {
  font-size: 14px;
}
</style>
