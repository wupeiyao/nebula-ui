import { defineStore } from 'pinia'

const isAffixTag = (v) => {
  if (!v) return false
  return !!(v.meta?.affix || v.path === '/dashboard' || v.name === 'Dashboard' || v.title === '首页')
}

export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    visitedViews: [],
    cachedViews: []
  }),
  actions: {
    addView(view) {
      this.addVisitedView(view)
      this.addCachedView(view)
    },
    addVisitedView(view) {
      if (this.visitedViews.some(v => v.path === view.path)) return
      const isHome = view.path === '/dashboard' || view.name === 'Dashboard'
      const title = isHome ? '首页' : (view.meta?.title?.split(' - ')[0] || view.meta?.title || view.name || '未命名')
      this.visitedViews.push(
        Object.assign({}, view, {
          title,
          meta: {
            ...view.meta,
            affix: isHome || view.meta?.affix
          }
        })
      )
    },
    addCachedView(view) {
      if (!view.name || this.cachedViews.includes(view.name)) return
      if (!view.meta?.noCache) {
        this.cachedViews.push(view.name)
      }
    },
    delView(view) {
      return new Promise(resolve => {
        this.delVisitedView(view)
        this.delCachedView(view)
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews]
        })
      })
    },
    delVisitedView(view) {
      return new Promise(resolve => {
        for (const [i, v] of this.visitedViews.entries()) {
          if (v.path === view.path) {
            if (isAffixTag(v)) return resolve([...this.visitedViews])
            this.visitedViews.splice(i, 1)
            break
          }
        }
        resolve([...this.visitedViews])
      })
    },
    delCachedView(view) {
      return new Promise(resolve => {
        const index = this.cachedViews.indexOf(view.name)
        if (index > -1) {
          this.cachedViews.splice(index, 1)
        }
        resolve([...this.cachedViews])
      })
    },
    delOthersViews(view) {
      return new Promise(resolve => {
        this.delOthersVisitedViews(view)
        this.delOthersCachedViews(view)
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews]
        })
      })
    },
    delOthersVisitedViews(view) {
      return new Promise(resolve => {
        this.visitedViews = this.visitedViews.filter(v => {
          return isAffixTag(v) || v.path === view.path
        })
        resolve([...this.visitedViews])
      })
    },
    delOthersCachedViews(view) {
      return new Promise(resolve => {
        const index = this.cachedViews.indexOf(view.name)
        if (index > -1) {
          this.cachedViews = this.cachedViews.slice(index, index + 1)
        } else {
          this.cachedViews = []
        }
        resolve([...this.cachedViews])
      })
    },
    delLeftViews(view) {
      return new Promise(resolve => {
        this.delLeftVisitedViews(view)
        this.delLeftCachedViews(view)
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews]
        })
      })
    },
    delLeftVisitedViews(view) {
      return new Promise(resolve => {
        const index = this.visitedViews.findIndex(v => v.path === view.path)
        if (index === -1) {
          return resolve([...this.visitedViews])
        }
        this.visitedViews = this.visitedViews.filter((v, i) => {
          if (i < index) {
            return isAffixTag(v)
          }
          return true
        })
        resolve([...this.visitedViews])
      })
    },
    delLeftCachedViews(view) {
      return new Promise(resolve => {
        const index = this.cachedViews.indexOf(view.name)
        if (index > -1) {
          this.cachedViews = this.cachedViews.slice(index)
        }
        resolve([...this.cachedViews])
      })
    },
    delRightViews(view) {
      return new Promise(resolve => {
        this.delRightVisitedViews(view)
        this.delRightCachedViews(view)
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews]
        })
      })
    },
    delRightVisitedViews(view) {
      return new Promise(resolve => {
        const index = this.visitedViews.findIndex(v => v.path === view.path)
        if (index === -1) {
          return resolve([...this.visitedViews])
        }
        this.visitedViews = this.visitedViews.filter((v, i) => {
          if (i > index) {
            return isAffixTag(v)
          }
          return true
        })
        resolve([...this.visitedViews])
      })
    },
    delRightCachedViews(view) {
      return new Promise(resolve => {
        const index = this.cachedViews.indexOf(view.name)
        if (index > -1) {
          this.cachedViews = this.cachedViews.slice(0, index + 1)
        }
        resolve([...this.cachedViews])
      })
    },
    delAllViews() {
      return new Promise(resolve => {
        this.delAllVisitedViews()
        this.delAllCachedViews()
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews]
        })
      })
    },
    delAllVisitedViews() {
      return new Promise(resolve => {
        this.visitedViews = this.visitedViews.filter(tag => isAffixTag(tag))
        resolve([...this.visitedViews])
      })
    },
    delAllCachedViews() {
      return new Promise(resolve => {
        this.cachedViews = []
        resolve([...this.cachedViews])
      })
    }
  }
})
