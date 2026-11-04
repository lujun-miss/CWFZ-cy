<!--
  ============================================================================
  销售赋能中心 H5 · 线索管理（跟进页）
  ----------------------------------------------------------------------------
  对应原型：sales-mobile-h5.html → TabBar 第 4 项「线索」
  职责：接收企业端行为回流线索 → 左滑认领 / 跟进 → 标记已转化 / 无效
  数据：与 PC 端「线索管理」同源（ceyuan_clues），状态变更两端实时一致
  说明：原型为兼容桌面鼠标预览曾自研左滑；正式 H5 直接使用 van-swipe-cell
  ============================================================================
-->
<template>
  <div class="page-lead">
    <!-- 顶部待处理提醒（红点角标） -->
    <section class="alert-card">
      <div class="alert-icon"><van-icon name="bell" /></div>
      <div class="alert-main">
        <p class="alert-title">
          待处理线索
          <van-badge :content="pendingCount" :max="99" />
        </p>
        <p class="alert-tip">左滑列表项可「认领 / 跟进」，认领后状态自动变为跟进中</p>
      </div>
    </section>

    <!-- 状态筛选 Tab（与列表互斥展示，避免同屏冗余） -->
    <van-tabs v-model:active="activeTab" class="lead-tabs">
      <van-tab title="全部"></van-tab>
      <van-tab title="待跟进"></van-tab>
      <van-tab title="跟进中"></van-tab>
      <van-tab title="已转化"></van-tab>
    </van-tabs>

    <!-- 线索列表：左滑露出操作按钮 -->
    <van-swipe-cell v-for="l in filteredLeads" :key="l.id">
      <!-- 右侧操作区 -->
      <template #right>
        <van-button
          v-if="l.stage === '待跟进'"
          square type="primary" text="认领 / 跟进" class="swipe-action"
          @click="claimLead(l)"
        />
        <van-button
          v-else
          square type="warning" text="标记结果" class="swipe-action"
          @click="openMarkSheet(l)"
        />
        <van-button square type="default" text="详情" class="swipe-action" @click="openDetail(l)" />
      </template>

      <!-- 列表行主体 -->
      <div class="list-row" @click="openDetail(l)">
        <div class="avatar" :style="{ background: behaviorOf(l).bg, color: behaviorOf(l).color }">
          <van-icon :name="behaviorOf(l).icon" />
        </div>
        <div class="row-main">
          <p class="name">{{ l.company }}</p>
          <div class="info">
            <span class="tag" :class="behaviorOf(l).cls">
              <van-icon name="flash" />{{ behaviorOf(l).text }}
            </span>
          </div>
          <div class="info sub">
            <van-icon name="clock-o" />{{ l.pushTime }} · 意向：{{ l.intent }}
          </div>
        </div>
        <div class="row-right">
          <span class="tag" :class="stageClass(l.stage)">{{ l.stage }}</span>
          <p class="owner">{{ l.sales || '未分配' }}</p>
        </div>
      </div>
    </van-swipe-cell>

    <van-empty v-if="!filteredLeads.length" image="search" description="该状态下暂无线索" />

    <p class="footnote">线索来源：企业端问答 / 政策雷达 / 科创测评行为自动回流（与 PC 线索管理同一份数据）</p>

    <!-- 线索详情：行为轨迹时间轴 -->
    <van-popup v-model:show="showDetail" position="bottom" round :style="{ height: '70%' }">
      <div v-if="current" class="detail">
        <div class="detail-head">
          <p class="detail-name">{{ current.company }}</p>
          <p class="detail-sub">{{ current.pushTime }} · 来源 {{ current.source }} · 意向 {{ current.intent }}</p>
        </div>
        <section class="card">
          <div class="card-title"><van-icon name="flash" />行为轨迹</div>
          <div class="tl">
            <div v-for="(t, i) in trackOf(current)" :key="i" class="tl-item">
              <div class="tl-h"><span>{{ t.action }}</span><span class="tl-d">{{ t.at }}</span></div>
              <p class="tl-c">{{ t.detail }}</p>
            </div>
          </div>
        </section>
        <section class="card">
          <div class="card-title"><van-icon name="user-o" />归属与状态</div>
          <p class="text">
            当前状态：<span class="tag" :class="stageClass(current.stage)">{{ current.stage }}</span>
            归属销售：{{ current.sales || '未分配' }}
          </p>
        </section>
        <div class="btn-row">
          <van-button size="small" round block type="primary" @click="claimLead(current); showDetail = false">认领并跟进</van-button>
          <van-button size="small" round block plain @click="openMarkSheet(current)">标记结果</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 标记结果动作面板（已转化 / 无效） -->
    <van-action-sheet
      v-model:show="showMarkSheet"
      :actions="markActions"
      cancel-text="取消"
      description="标记后将同步到 PC 线索管理"
      @select="onMarkSelect"
    />
  </div>
</template>

<script setup>
/**
 * 线索管理逻辑
 * · 线索来源：企业端行为自动回流（政策查询 / AI 问答 / 测评 / 收益计算器）
 * · 状态机：待跟进 → 跟进中 → 已转化 | 已流失（写回 DataBridge，PC 端同步）
 */
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { loadClues, saveClues } from '@/data-bridge'

/* ---------------------------------------------------------------------------
 * API 占位：对接真实接口时替换（当前读写本地 Mock）
 * ------------------------------------------------------------------------- */
export const API = {
  // GET  /api/leads?stage=&page=                 → 线索列表（分页 + 状态筛选）
  list: null,
  // POST /api/leads/{id}/claim  body:{ salesId } → 认领线索
  claim: null,
  // POST /api/leads/{id}/result body:{ result, reason } → 标记已转化 / 无效
  markResult: null,
  // POST /api/leads/{id}/followup body:{ content } → 写入跟进记录
  followup: null
}

/* 行为标签映射：把线索来源翻译成销售能一眼看懂的行为话术 */
const BEHAVIOR_MAP = {
  政策查询: { text: '频繁查看政策', cls: 't-blue', icon: 'search', bg: '#eff6ff', color: '#1d4ed8' },
  问答触发: { text: '高频 AI 问答', cls: 't-purple', icon: 'comment-o', bg: '#f5f3ff', color: '#6d28d9' },
  诊断触发: { text: '使用测评工具', cls: 't-orange', icon: 'fire-o', bg: '#fff7ed', color: '#c2410c' },
  计算器触发: { text: '使用收益计算器', cls: 't-green', icon: 'gold-coin-o', bg: '#ecfdf5', color: '#047857' }
}
const STAGE_CLASS = { 待跟进: 't-gray', 跟进中: 't-blue', 已转化: 't-green', 已流失: 't-red' }

const activeTab = ref(0)
const showDetail = ref(false)
const showMarkSheet = ref(false)
const current = ref(null)

const markActions = [
  { name: '标记为已转化', subname: '进入成交客户池' },
  { name: '标记为无效', subname: '关闭该线索并记录原因' }
]

/** 列表数据：从共享数据层读取并补充展示字段 */
const leads = ref(
  (loadClues() || []).map(c => ({
    ...c,
    pushTime: c.enterTime || c.createTime || ''
  }))
)

const pendingCount = computed(() => leads.value.filter(l => l.stage === '待跟进').length)
const tabStage = computed(() => ['', '待跟进', '跟进中', '已转化'][activeTab.value])
const filteredLeads = computed(() => (tabStage.value ? leads.value.filter(l => l.stage === tabStage.value) : leads.value))

const behaviorOf = l => BEHAVIOR_MAP[l.source] || { text: '查看政策', cls: 't-gray', icon: 'search', bg: '#f1f5f9', color: '#64748b' }
const stageClass = s => STAGE_CLASS[s] || 't-gray'
/** 行为轨迹：真实环境由行为埋点接口返回，这里按线索字段即时拼装 */
const trackOf = l => [
  { action: l.source, at: l.createTime || '', detail: `触发「${l.intent}」相关行为，系统自动回流为线索` },
  { action: '政策雷达浏览', at: l.createTime || '', detail: '连续查看同领域政策 3 次以上，判定为高意向' },
  { action: '线索入库', at: l.createTime || '', detail: `已分配给${l.sales || '待认领'}` }
]

function openDetail(l) { current.value = l; showDetail.value = true }

/** 认领：状态推进为「跟进中」并写入数据层，PC 端线索管理即刻可见 */
function claimLead(l) {
  if (l.stage === '已转化' || l.stage === '已流失') { showToast('该线索已结束，无需认领'); return }
  l.stage = '跟进中'
  l.sales = l.sales || '张销售'
  persist()
  showToast('已认领，状态更新为「跟进中」')
}

function openMarkSheet(l) { current.value = l; showMarkSheet.value = true }

/** 动作面板选择：已转化 / 无效 */
function onMarkSelect(action) {
  showMarkSheet.value = false
  const l = current.value
  if (!l) return
  l.stage = action.name.includes('已转化') ? '已转化' : '已流失'
  persist()
  showToast(`${action.name}，已同步到 PC 线索管理`)
}

/** 状态回写共享数据层（与 PC 端同一份 localStorage） */
function persist() {
  const list = loadClues() || []
  leads.value.forEach(l => {
    const target = list.find(x => x.id === l.id)
    if (target) { target.stage = l.stage; target.sales = l.sales || target.sales }
  })
  saveClues(list)
}
</script>

<style scoped>
/* 设计稿基准宽 375px；postcss-px-to-viewport(viewportWidth:375) 自动转 vw */
.page-lead { padding: 12px 12px 16px; }
.alert-card { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 14px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(15, 23, 42, .05); }
.alert-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: #fef2f2; color: #ef4444; flex-shrink: 0; }
.alert-main { flex: 1; min-width: 0; }
.alert-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0; }
.alert-tip { font-size: 11px; color: #94a3b8; margin: 3px 0 0; }
.lead-tabs { margin-bottom: 10px; }
/* van-swipe-cell 内的行：去掉自带圆角，由外层统一控制 */
.list-row { display: flex; align-items: center; gap: 10px; background: #fff; padding: 12px; box-shadow: 0 1px 2px rgba(15, 23, 42, .05); }
.avatar { width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 17px; }
.row-main { flex: 1; min-width: 0; }
.name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; margin-top: 4px; }
.info.sub { gap: 4px; }
.row-right { text-align: right; flex-shrink: 0; }
.owner { font-size: 10.5px; color: #94a3b8; margin: 5px 0 0; }
.tag { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
.t-blue { background: #eff6ff; color: #1d4ed8; }
.t-orange { background: #fff7ed; color: #c2410c; }
.t-green { background: #ecfdf5; color: #047857; }
.t-gray { background: #f1f5f9; color: #64748b; }
.t-red { background: #fef2f2; color: #b91c1c; }
.t-purple { background: #f5f3ff; color: #6d28d9; }
.swipe-action { height: 100%; }
.footnote { font-size: 11px; color: #94a3b8; text-align: center; padding: 8px 0 0; }
/* 线索详情 */
.detail { padding: 14px 0 20px; }
.detail-head { padding: 0 14px; }
.detail-name { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; }
.detail-sub { font-size: 11px; color: #94a3b8; margin: 4px 0 0; }
.card { background: #fff; border-radius: 14px; padding: 14px; margin: 10px 12px 0; box-shadow: 0 1px 2px rgba(15, 23, 42, .05); }
.card-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
.card-title .van-icon { color: #4f46e5; }
.text { font-size: 11.5px; color: #475569; margin: 0; }
.btn-row { display: flex; gap: 8px; padding: 12px 12px 0; }
/* 时间轴 */
.tl { position: relative; padding-left: 20px; }
.tl::before { content: ''; position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px; background: #e2e8f0; }
.tl-item { position: relative; padding-bottom: 14px; }
.tl-item:last-child { padding-bottom: 0; }
.tl-item::before { content: ''; position: absolute; left: -19px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #4f46e5; border: 2px solid #fff; box-shadow: 0 0 0 2px #e0e7ff; }
.tl-h { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 700; color: #0f172a; }
.tl-d { font-size: 10px; color: #94a3b8; }
.tl-c { font-size: 11.5px; color: #475569; line-height: 1.6; margin: 4px 0 0; }
</style>
