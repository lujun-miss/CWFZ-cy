<!--
  ============================================================================
  销售赋能中心 H5 · 智能报告（AI 生成页）
  ----------------------------------------------------------------------------
  对应原型：sales-mobile-h5.html → TabBar 第 2 项「报告」
  职责：输入企业名称 → 调用 AI 生成政策匹配报告草稿 → 补充数据重算 → 归档 / 分享
  技术栈：Vue 3 SFC + Vant 4（组件以 van-* 全局注册，见 main.js 说明）
  适配：设计稿按 375px 宽度编写，配合 postcss-px-to-viewport(viewportWidth: 375) 自动转 vw
  ============================================================================
-->
<template>
  <div class="page-report">
    <!-- 顶部输入区：输入企业名称，触发 AI 生成 -->
    <section class="card">
      <div class="card-title"><i class="van-icon van-icon-fire-o"></i>AI 生成企业报告</div>
      <van-field
        v-model="keyword"
        :border="false"
        placeholder="输入企业名称，如：星河智造科技有限公司"
        class="field-soft"
      />
      <div class="btn-row">
        <van-button
          type="primary"
          size="small"
          round
          block
          icon="play-circle-o"
          :loading="loading"
          loading-text="AI 生成中…"
          @click="generate()"
        >生成报告</van-button>
        <van-button size="small" round block plain @click="pickCustomer()">选客户</van-button>
      </div>
      <!-- 演示快捷入口：一键填入原型 Mock 企业 -->
      <div class="quick">
        <span v-for="c in QUICK_COMPANIES" :key="c" class="chip" @click="keyword = c; generate()">{{ c }}</span>
      </div>
    </section>

    <!-- AI 加载态：骨架屏（真实场景可换成 AI 引擎流式进度） -->
    <section v-if="loading" class="card">
      <van-skeleton title :row="6" :loading="true" />
    </section>

    <!-- 报告草稿 -->
    <template v-else-if="report">
      <!-- 结论摘要 -->
      <section class="card">
        <div class="card-title">
          <i class="van-icon van-icon-records-o"></i>{{ report.title }}
          <span class="extra">{{ report.type }} · {{ report.createdAt }}</span>
        </div>
        <p class="text">{{ report.summary }}</p>
      </section>

      <!-- 企业画像 -->
      <section class="card">
        <div class="card-title"><i class="van-icon van-icon-shop-o"></i>企业画像</div>
        <div class="grid2">
          <div>企业名称：{{ report.company.name }}</div>
          <div>所属行业：{{ report.company.industry }}</div>
          <div>联系人：{{ report.company.contact }}</div>
          <div>所在地区：{{ report.company.region }}</div>
          <div>员工人数：{{ report.company.employees }} 人</div>
          <div>年营收：{{ (report.company.revenue / 100).toFixed(0) }} 百万元</div>
        </div>
        <div class="chips">
          <span v-for="q in report.company.quals" :key="q" class="tag t-green">{{ q }}</span>
          <span class="tag t-orange">科创得分 {{ report.diagnosis.avg }} · {{ report.diagnosis.grade }} 级</span>
        </div>
        <p class="note">{{ report.profile }}</p>
      </section>

      <!-- 政策机会 -->
      <section class="card">
        <div class="card-title"><i class="van-icon van-icon-bulb-o"></i>政策机会（{{ report.policies.length }}）</div>
        <div v-for="p in report.policies" :key="p.title" class="policy">
          <div class="policy-head">
            <span class="policy-title">{{ p.title }}</span>
            <span class="tag" :class="p.level === '高匹配' ? 't-green' : 't-orange'">{{ p.level }}</span>
          </div>
          <div class="policy-meta">
            <span>预期权益：{{ p.benefit }}</span>
            <span class="strong">匹配度 {{ p.match }}%</span>
          </div>
          <van-progress :percentage="p.match" :show-pivot="false" stroke-width="4" color="#6366f1" />
        </div>
      </section>

      <!-- 申报建议 -->
      <section class="card">
        <div class="card-title"><i class="van-icon van-icon-volume-o"></i>申报建议</div>
        <p class="text pre">{{ report.advice }}</p>
      </section>

      <!-- 补充数据：重新生成可提升匹配精准度 -->
      <section class="card">
        <div class="card-title"><i class="van-icon van-icon-setting-o"></i>补充数据（选填，可提高精准度）</div>
        <van-cell-group inset>
          <van-field v-model="supplement.revenue" label="年营收" placeholder="单位：万元" />
          <van-field v-model="supplement.rd" label="研发投入" placeholder="单位：万元" />
          <van-field v-model="supplement.patents" label="发明专利" placeholder="件数" />
          <van-field v-model="supplement.staff" label="研发人员" placeholder="人数" />
        </van-cell-group>
        <van-button
          size="small" round block type="primary" plain class="mt-10"
          icon="replay" @click="generate(true)"
        >补充数据并重新生成</van-button>
      </section>

      <!-- 联动系统占位 -->
      <section class="card last">
        <div class="card-title"><i class="van-icon van-icon-exchange"></i>报告联动</div>
        <div class="btn-row">
          <van-button size="small" round block plain @click="pushToCustomer()">推送客户</van-button>
          <van-button size="small" round block plain @click="toServiceOrder()">转服务</van-button>
        </div>
      </section>
    </template>

    <!-- 引导态 -->
    <section v-else class="card">
      <van-empty image="search" description="输入企业名称后点击「生成报告」，AI 将结合政策库、企业画像与历史申报数据生成草稿" />
    </section>

    <!-- 底部固定操作条：一键生成 PDF / 生成分享链接 -->
    <div v-if="report && !loading" class="fixed-bar">
      <van-button size="small" round block type="primary" icon="down" @click="exportPdf()">一键生成 PDF</van-button>
      <van-button size="small" round block plain type="primary" icon="share-o" @click="createShare()">生成分享链接</van-button>
    </div>
  </div>
</template>

<script setup>
/**
 * 智能报告页逻辑
 * · 数据来源：DataBridge（与 PC 端一致）——报告存档写在 ceyuan_sales_reports
 * · AI 生成当前为 1.6s 定时器模拟，替换 generateReportApi 即为真实能力
 */
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
import { loadSalesReports, saveSalesReports, loadCustomers } from '@/data-bridge' // ← 对接时改为真实数据层

/* ---------------------------------------------------------------------------
 * API 占位：对接真实接口时逐项替换（当前全部走本地 Mock / 定时器）
 * ------------------------------------------------------------------------- */
export const API = {
  // POST /api/ai/report  body: { companyName, supplement }  → 返回报告草稿 JSON
  generateReport: null,
  // POST /api/report/pdf  body: { reportId }                → 返回 PDF 下载地址
  exportPdf: null,
  // POST /api/report/share body: { reportId, toPhone }       → 返回 { shareId, url, expireAt }
  createShare: null,
  // POST /api/policy-platform/push body: { reportId }        → 推送至「企业政策服务平台」
  pushToCustomer: null,
  // POST /api/service-center/order body: { companyName }     → 在「服务交易中心」创建服务订单
  toServiceOrder: null
}

/* 演示用的企业名称（正式环境由「选客户」从客户列表带入） */
const QUICK_COMPANIES = ['星河智造科技有限公司', '康泰生物科技', '锐达新材料']

const keyword = ref('')
const loading = ref(false)
const report = ref(null)
const supplement = reactive({ revenue: '', rd: '', patents: '', staff: '' })

/** 生成报告：loading 期间展示骨架屏；命中历史存档则直接复用，否则用档案 + 补充数据兜底拼稿 */
async function generate(isSupplement = false) {
  const key = (keyword.value || '').trim()
  if (!key) { showToast('请先输入企业名称'); return }
  loading.value = true
  report.value = null
  try {
    // 有真实接口时：report.value = await API.generateReport({ companyName: key, supplement })
    await sleep(1600) // 模拟 AI 推理耗时
    const saved = (loadSalesReports() || []).find(r => r.customerName.includes(key) || r.title.includes(key))
    const customer = (loadCustomers() || []).find(c => (c.name || c.realName || '').includes(key))
    report.value = saved
      ? JSON.parse(JSON.stringify(saved))
      : buildDraft(key, customer)
    if (isSupplement) report.value.summary = '已按补充数据重新生成：' + report.value.summary
    showToast(isSupplement ? '已按补充数据重新生成报告' : 'AI 报告草稿已生成')
  } finally {
    loading.value = false
  }
}

/** 未命中存档时按企业档案即时拼一份草稿（仅原型 Mock，真实环境由 AI 引擎返回） */
function buildDraft(key, c) {
  return {
    id: 'R' + Date.now(),
    title: key + ' 政策匹配分析报告',
    type: '政策匹配',
    customerName: key,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    company: {
      name: key,
      code: (c && c.code) || '—',
      industry: (c && c.industry) || '未填行业',
      contact: (c && (c.contact || c.realName)) || '—',
      phone: (c && c.phone) || '—',
      employees: Number(supplement.staff) || 120,
      revenue: Number(supplement.revenue) || 8000,
      region: (c && c.region) || '未填地区',
      quals: ['科技型中小企业']
    },
    diagnosis: { avg: 70, grade: 'B', weak: ['知识产权布局'] },
    summary: `${key}：AI 已结合政策库与企业画像完成初步匹配，预计可申报政策 3 项。补充研发投入与知识产权数据后可进一步提升精准度。`,
    profile: `企业画像基于注册资料${supplement.revenue ? '与本次补充数据' : ''}生成，研发投入 ${supplement.rd || '—'} 万元，发明专利 ${supplement.patents || '—'} 件。`,
    policies: [
      { title: '研发费用加计扣除', benefit: '减税约 100 万', level: '高匹配', match: 90 },
      { title: '国家高新技术企业认定', benefit: '补贴 30 万', level: '中匹配', match: 80 },
      { title: '省专精特新中小企业', benefit: '补贴 50 万', level: '中匹配', match: 76 }
    ],
    advice: '1. 优先申报研发费用加计扣除，注意研发费用辅助账口径一致。\n2. 高企认定建议先补齐知识产权短板。\n3. 可同步准备省级专精特新培育材料。',
    shares: []
  }
}

/** 一键生成 PDF：正式环境调用 API.exportPdf，成功后归档到「报告管理」 */
function exportPdf() {
  showToast('正在生成 PDF 并归档到报告管理（接口占位）')
}

/**
 * 生成分享链接：写入报告存档的 shares 数组，
 * PC 端「分享管理」会立即读到这条记录并能追踪打开次数 / 浏览时长
 */
function createShare() {
  const r = report.value
  if (!r) return
  const sid = 'S' + Date.now().toString().slice(-6)
  const url = `report-viewer.html?id=${r.id}&shareId=${sid}`
  const list = loadSalesReports() || []
  const target = list.find(x => x.id === r.id)
  const record = {
    shareId: sid,
    toName: (r.company.contact || '客户') + '（本次分享）',
    toPhone: r.company.phone,
    createdAt: new Date().toISOString().slice(0, 10) + ' 10:20',
    expireAt: '',
    views: []
  }
  if (target) {
    target.shares = target.shares || []
    target.shares.unshift(record)
    saveSalesReports(list)
  } else {
    r.shares.unshift(record) // 草稿尚未归档时仅存内存演示
  }
  showToast('分享链接已生成：' + url.slice(0, 26) + '…')
}

/* 以下三个为联动系统占位，对接时替换为真实跳转 / 接口调用 */
function pickCustomer() { showToast('从客户列表选择企业（占位：对接客户选择器）') }
function pushToCustomer() { showToast('已推送给客户：企业政策服务平台（占位）') }
function toServiceOrder() { showToast('发起服务订单：服务交易中心（占位）') }

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

onMounted(() => {
  // 若从客户详情跳转进来，可通过 route.query.company 预填
  // keyword.value = String(route.query.company || '')
})
</script>

<style scoped>
/* 设计稿基准宽 375px；postcss-px-to-viewport 会按 viewportWidth:375 将下面 px 转为 vw */
.page-report { padding: 12px 12px 0; }
.card { background: #fff; border-radius: 14px; padding: 14px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(15, 23, 42, .05); }
.card.last { margin-bottom: 72px; } /* 给底部固定条留出安全距离 */
.card-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
.card-title .van-icon { color: #4f46e5; }
.card-title .extra { margin-left: auto; font-size: 11px; font-weight: 500; color: #94a3b8; }
.field-soft { background: #f8fafc !important; border-radius: 10px; }
.btn-row { display: flex; gap: 8px; margin-top: 10px; }
.quick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.chip { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; }
.text { font-size: 11.5px; color: #475569; line-height: 1.7; margin: 0; }
.text.pre { white-space: pre-line; line-height: 1.8; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; font-size: 11.5px; color: #475569; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tag { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
.t-green { background: #ecfdf5; color: #047857; }
.t-orange { background: #fff7ed; color: #c2410c; }
.note { font-size: 11px; color: #64748b; line-height: 1.7; margin: 10px 0 0; }
.policy { padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
.policy:last-child { border-bottom: 0; }
.policy-head { display: flex; align-items: center; justify-content: space-between; }
.policy-title { font-size: 12.5px; font-weight: 700; color: #0f172a; }
.policy-meta { display: flex; align-items: center; justify-content: space-between; margin: 6px 0; font-size: 11px; color: #64748b; }
.policy-meta .strong { color: #4f46e5; font-weight: 700; }
.mt-10 { margin-top: 10px; }
/* 底部固定操作条 */
.fixed-bar { position: sticky; bottom: 0; display: flex; gap: 8px; padding: 10px 12px; background: rgba(255, 255, 255, .96); border-top: 1px solid #e5e7eb; backdrop-filter: blur(8px); }
</style>
