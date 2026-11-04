/**
 * ============================================================================
 * 销售赋能中心 H5 —— 底栏 TabBar 架构与路由配置
 * ----------------------------------------------------------------------------
 * 设计原则：5 个业务模块 = 1 个底栏 TabBar（一级），模块内部再分页/弹层（二级）；
 *          不把 5 个模块拆成侧边栏菜单，避免出现重复入口。
 * 终端：移动端 H5，一级页面全屏，二级内容用 van-popup / van-action-sheet 承载。
 * ============================================================================
 */
import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 底栏 TabBar 配置（渲染 van-tabbar 时直接遍历本数组）
 * icon 为 Vant 内置图标名；route 需与下方 routes 的 path 一致
 */
export const TAB_BAR = [
  { key: 'customers', route: '/customers', label: '客户', icon: 'friends-o' },
  { key: 'report',    route: '/report',    label: '报告', icon: 'records-o' },
  { key: 'shares',    route: '/shares',    label: '分享', icon: 'share-o' },
  { key: 'leads',     route: '/leads',     label: '线索', icon: 'bulb-o' },
  { key: 'dashboard', route: '/dashboard', label: '业绩', icon: 'bar-chart-o' }
]

/**
 * 路由表：5 个一级模块（对应 TabBar）+ 若干二级页
 * meta.title   → 顶部 van-nav-bar 标题
 * meta.tabBar  → 是否显示底栏（详情类二级页可置 false）
 */
export const routes = [
  { path: '/', redirect: '/customers' },

  // 1. 客户管理：列表页 → 详情（底部弹层承载，含基本信息 / 政策诊断报告 / 沟通纪要 / 跟进计划）
  {
    path: '/customers',
    name: 'CustomerList',
    component: () => import('../views/CustomerList.vue'),
    meta: { title: '客户管理', tabBar: true }
  },

  // 2. 智能报告：AI 生成 → 报告草稿 → PDF / 分享
  {
    path: '/report',
    name: 'SmartReport',
    component: () => import('../SmartReport.vue'),
    meta: { title: '智能报告', tabBar: true, keepAlive: true } // keepAlive：切走再回来保留已生成的报告草稿
  },

  // 3. 分享管理：已分享报告 / 已分享政策（Tab 切换）+ 追踪二维码弹窗
  {
    path: '/shares',
    name: 'ShareManagement',
    component: () => import('../views/ShareManagement.vue'),
    meta: { title: '分享管理', tabBar: true }
  },

  // 4. 线索管理：待处理 → 左滑认领 → 标记结果
  {
    path: '/leads',
    name: 'LeadManagement',
    component: () => import('../LeadManagement.vue'),
    meta: { title: '线索管理', tabBar: true }
  },

  // 5. 业绩看板：个人 / 团队切换 + 时间维度筛选
  {
    path: '/dashboard',
    name: 'SalesBoard',
    component: () => import('../views/SalesBoard.vue'),
    meta: { title: '业绩看板', tabBar: true }
  },

  // 二级页示例：报告分享给客户后，客户侧打开的只读页（无底栏）
  {
    path: '/report-viewer',
    name: 'ReportViewer',
    component: () => import('../views/ReportViewer.vue'),
    meta: { title: '报告详情', tabBar: false }
  },

  { path: '/:pathMatch(.*)*', redirect: '/customers' }
]

const router = createRouter({
  history: createWebHashHistory(), // H5 分享链接走 hash，避免后端额外配置重写规则
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router

/**
 * ----------------------------------------------------------------------------
 * main.js 装配示例（供研发接入参考）
 * ----------------------------------------------------------------------------
 * import { createApp } from 'vue'
 * import Vant from 'vant'                 // 全局注册，模板里可直接用 <van-*>
 * import 'vant/lib/index.css'
 * import App from './App.vue'
 * import router from './router'
 *
 * createApp(App).use(router).use(Vant).mount('#app')
 *
 * // App.vue 内底栏（仅 meta.tabBar 为 true 时渲染）：
 * // <van-tabbar :model-value="activeTab" :fixed="true" active-color="#4f46e5" inactive-color="#94a3b8">
 * //   <van-tabbar-item v-for="t in TAB_BAR" :key="t.key" :icon="t.icon" :to="t.route">{{ t.label }}</van-tabbar-item>
 * // </van-tabbar>
 * ----------------------------------------------------------------------------
 */
