/* ============================================================
 * 研知π · 无形资产共享数据集
 * 目的：把分散在各页面的资产数据（身份/身价/省税/时间线/健康度）
 *       聚合到同一份数据集，让每个"宝贝"都有一张完整成长档案。
 * 金额单位：万元
 * ============================================================ */

// 类型 → 图标 / 配色
var ASSET_TYPE_STYLE = {
    '发明专利':     { icon: 'fa-file-text-o', bg: 'bg-blue-50 text-blue-600' },
    '实用新型':     { icon: 'fa-lightbulb-o', bg: 'bg-teal-50 text-teal-600' },
    '外观设计':     { icon: 'fa-picture-o',   bg: 'bg-cyan-50 text-cyan-600' },
    '软件著作权':   { icon: 'fa-code',        bg: 'bg-indigo-50 text-indigo-600' },
    '商标':         { icon: 'fa-tags',        bg: 'bg-purple-50 text-purple-600' },
    '域名':         { icon: 'fa-globe',       bg: 'bg-sky-50 text-sky-600' },
    '土地使用权':   { icon: 'fa-map',         bg: 'bg-lime-50 text-lime-600' },
    '特许经营权':   { icon: 'fa-id-card-o',   bg: 'bg-amber-50 text-amber-600' },
    '非专利技术':   { icon: 'fa-cogs',        bg: 'bg-slate-100 text-slate-600' },
    '客户关系':     { icon: 'fa-handshake-o', bg: 'bg-rose-50 text-rose-600' },
    '品牌价值':     { icon: 'fa-star',        bg: 'bg-orange-50 text-orange-600' }
};

// 资产大类分组（对应 6 大模块的"多类型资产支持"）
var ASSET_CATEGORY_MAP = {
    '发明专利': '知识产权类', '实用新型': '知识产权类', '外观设计': '知识产权类',
    '软件著作权': '知识产权类', '商标': '知识产权类', '域名': '知识产权类',
    '土地使用权': '权利特许类', '特许经营权': '权利特许类',
    '非专利技术': '技术秘密类',
    '客户关系': '市场客户类', '品牌价值': '品牌价值类'
};

// 取得方式字典
var ACQUIRE_METHODS = ['外购', '自主研发', '投资入股', '捐赠', '内部调拨'];

// 权利归属字典
var OWNERSHIP_OPTIONS = ['本公司', '子公司', '个人', '共有'];

// 法律状态字典（扩展为 7 态）
var LEGAL_STATUS_OPTIONS = ['申请中', '审查中', '已授权', '有效中', '失效', '质押冻结', '诉讼中'];

// 变更类型字典（生命周期 - 变更阶段）
var CHANGE_TYPES = ['名称变更', '权属转移', '价值重估', '状态变更'];

// 摊销策略字典
var AMORT_METHODS = ['直线法', '产量法'];

// 使用状态字典（启用/停用/封存）
var USE_STATES = ['启用', '停用', '封存'];

// 生命周期阶段字典
var LIFECYCLE_STAGES = ['取得入库', '变更', '处置', '摊销'];

// 生命周期事件状态字典
var LIFECYCLE_STATUS = ['待审批', '已通过', '已驳回', '已执行'];

// 状态标签字典（badge 样式）
var ASSET_TAG_STYLE = {
    '省税冠军':  'bg-amber-50 text-amber-600 border border-amber-200',
    '高企支撑':  'bg-blue-50 text-blue-600 border border-blue-200',
    '专精特新':  'bg-emerald-50 text-emerald-600 border border-emerald-200',
    '核心资产':  'bg-indigo-50 text-indigo-600 border border-indigo-200',
    '沉睡资产':  'bg-slate-100 text-slate-500 border border-slate-200',
    '在途申请':  'bg-orange-50 text-orange-600 border border-orange-200'
};

/* 资产数据集（内置示例种子，首次使用写入 localStorage；之后以本地维护数据为准）
 * active: true=活跃变现中  false=沉睡（有证但近一年无摊销/无项目/未用于申报）
 * progress: 申请中资产的进度阶段（0-3）
 */
var DEFAULT_ASSETS = [
    {
        id: 'A001',
        name: '一种工业智能控制算法',
        type: '发明专利',
        certNo: 'ZL202410001234.5',
        status: '有效中',
        active: true,
        tags: ['省税冠军', '高企支撑', '核心资产'],
        // 身价（万元）
        cost: 180,          // 研发投入 / 原值
        amortized: 60,      // 累计摊销
        netValue: 120,      // 当前账面净值
        valuation: 756,     // 专家估值
        premium: 320,       // 估值较成本溢价 %
        // 赚钱
        taxSaving: 54,      // 累计省税（加计扣除）
        roi: 420,           // 投资回报率 %
        incomeType: '产品溢价收入',
        supportPolicy: ['高新技术企业认定（核心知识产权）'],
        // 健康度
        grantDate: '2024-09-18',    // 授权日
        expireDate: '2044-09-17',   // 到期日
        lifeYears: 20,              // 法定保护年限
        lifeUsedPct: 10,            // 寿命已用 %
        feeRenewal: { type:'年费', amount: 0.9, dueDate: '2026-08-15', paidDate: '', voucherNo: '' },
        feeRemainDays: 15,          // 年费剩余天数
        feeStatus: 'red',           // red / orange / ok
        // 成长时间线
        timeline: [
            { date: '2023-02', icon: 'fa-flag',       color: 'bg-slate-400',  title: '研发立项', desc: '智能控制算法项目立项，进入研究阶段' },
            { date: '2023-11', icon: 'fa-magic',      color: 'bg-blue-500',   title: '开发支出资本化', desc: '符合资本化条件，研发投入开始转为资产入账' },
            { date: '2024-03', icon: 'fa-send',       color: 'bg-blue-500',   title: '递交专利申请', desc: '完成交底书，向国家知识产权局递交申请' },
            { date: '2024-09', icon: 'fa-certificate',color: 'bg-emerald-500',title: '授权拿证', desc: '获得发明专利授权，证书号 ZL202410001234.5' },
            { date: '2024-10', icon: 'fa-cogs',       color: 'bg-emerald-500',title: '投入产品使用', desc: '应用于主力产品线，形成技术壁垒与产品溢价' },
            { date: '2025-01', icon: 'fa-calculator', color: 'bg-indigo-500', title: '开始摊销省税', desc: '按月摊销并享受研发费用加计扣除，累计省税 54 万' },
            { date: '2026-06', icon: 'fa-line-chart', color: 'bg-amber-500',  title: '评估增值', desc: '专家重新估值 756 万，较成本溢价 320%' }
        ]
    },
    {
        id: 'A002',
        name: '边缘计算网关软件 V2.0',
        type: '软件著作权',
        certNo: '2025SR0123456',
        status: '有效中',
        active: true,
        tags: ['高企支撑'],
        cost: 90,
        amortized: 18,
        netValue: 72,
        valuation: 256,
        premium: 185,
        taxSaving: 21,
        roi: 185,
        incomeType: '技术授权 + 产品溢价',
        supportPolicy: ['高新技术企业认定', '科技型中小企业'],
        grantDate: '2025-01-20',
        expireDate: '2075-01-19',
        lifeYears: 50,
        lifeUsedPct: 3,
        feeRenewal: { type:'维保费', amount: 1.2, dueDate: '2026-09-25', paidDate: '', voucherNo: '' },
        feeRemainDays: 42,
        feeStatus: 'orange',
        timeline: [
            { date: '2024-05', icon: 'fa-flag',       color: 'bg-slate-400',  title: '软件开发启动', desc: '边缘计算网关软件 V2.0 立项开发' },
            { date: '2024-12', icon: 'fa-magic',      color: 'bg-blue-500',   title: '开发完成资本化', desc: '软件开发完成，支出资本化形成无形资产' },
            { date: '2025-01', icon: 'fa-certificate',color: 'bg-emerald-500',title: '取得软著登记', desc: '登记号 2025SR0123456' },
            { date: '2025-03', icon: 'fa-cogs',       color: 'bg-emerald-500',title: '对外授权使用', desc: '向 3 家合作方授权，产生技术授权收入' },
            { date: '2025-04', icon: 'fa-calculator', color: 'bg-indigo-500', title: '摊销省税', desc: '累计加计扣除省税 21 万' }
        ]
    },
    {
        id: 'A003',
        name: '一种工业传感器数据处理方法',
        type: '发明专利',
        certNo: 'ZL202310098765.1',
        status: '有效中',
        active: true,
        tags: ['专精特新', '核心资产'],
        cost: 120,
        amortized: 30,
        netValue: 90,
        valuation: 320,
        premium: 210,
        taxSaving: 28,
        roi: 210,
        incomeType: '产品溢价收入',
        supportPolicy: ['专精特新中小企业认定'],
        grantDate: '2023-08-10',
        expireDate: '2043-08-09',
        lifeYears: 20,
        lifeUsedPct: 15,
        feeRenewal: { type:'年费', amount: 0.4, dueDate: '2026-10-30', paidDate: '', voucherNo: '' },
        feeRemainDays: 210,
        feeStatus: 'ok',
        timeline: [
            { date: '2022-09', icon: 'fa-flag',       color: 'bg-slate-400',  title: '研发立项', desc: '传感器数据处理关键技术攻关' },
            { date: '2023-02', icon: 'fa-magic',      color: 'bg-blue-500',   title: '资本化', desc: '开发支出资本化' },
            { date: '2023-08', icon: 'fa-certificate',color: 'bg-emerald-500',title: '授权拿证', desc: '获得发明专利授权' },
            { date: '2023-10', icon: 'fa-cogs',       color: 'bg-emerald-500',title: '产业化应用', desc: '应用于传感器模组，支撑专精特新认定' },
            { date: '2024-01', icon: 'fa-calculator', color: 'bg-indigo-500', title: '摊销省税', desc: '累计省税 28 万' }
        ]
    },
    {
        id: 'A004',
        name: '研知π 图形商标',
        type: '商标',
        certNo: '第 68765432 号',
        status: '有效中',
        active: false,           // 沉睡
        tags: ['沉睡资产'],
        cost: 5,
        amortized: 0,
        netValue: 5,
        valuation: 80,
        premium: 1500,
        taxSaving: 0,
        roi: 0,
        incomeType: '暂无变现',
        supportPolicy: [],
        grantDate: '2022-05-06',
        expireDate: '2032-05-05',
        lifeYears: 10,
        lifeUsedPct: 43,
        feeRenewal: { type:'续展费', amount: 0.5, dueDate: '2032-05-05', paidDate: '2026-05-06', voucherNo: 'ZK20260506001' },
        feeRemainDays: 300,
        feeStatus: 'ok',
        timeline: [
            { date: '2022-03', icon: 'fa-send',       color: 'bg-blue-500',   title: '提交注册申请', desc: '提交"研知π"图形商标注册' },
            { date: '2022-05', icon: 'fa-certificate',color: 'bg-emerald-500',title: '注册成功', desc: '取得商标注册证' }
        ],
        sleepReason: '已注册但近一年未在主营产品/包装/宣传中规范使用，也未用于品牌授权'
    },
    {
        id: 'A005',
        name: '一种设备固定支架',
        type: '实用新型',
        certNo: 'ZL202220345678.0',
        status: '有效中',
        active: false,           // 沉睡
        tags: ['沉睡资产'],
        cost: 15,
        amortized: 3,
        netValue: 12,
        valuation: 20,
        premium: 33,
        taxSaving: 2,
        roi: 15,
        incomeType: '暂无变现',
        supportPolicy: [],
        grantDate: '2022-11-12',
        expireDate: '2032-11-11',
        lifeYears: 10,
        lifeUsedPct: 38,
        feeRemainDays: 180,
        feeStatus: 'ok',
        timeline: [
            { date: '2022-06', icon: 'fa-send',       color: 'bg-blue-500',   title: '申请实用新型', desc: '针对产线固定支架结构改进提交申请' },
            { date: '2022-11', icon: 'fa-certificate',color: 'bg-emerald-500',title: '授权拿证', desc: '获得实用新型专利' }
        ],
        sleepReason: '技术已被新一代结构替代，近一年无产品使用、无摊销收益、未用于任何政策申报'
    },
    {
        id: 'A006',
        name: '基于AI的设备故障预测方法',
        type: '发明专利',
        certNo: '—（审查中）',
        status: '审查中',
        active: false,
        tags: ['在途申请'],
        progress: 2,            // 0交底书 1已递交 2审查中 3拿证
        cost: 95,               // 已投入研发（资本化在途）
        amortized: 0,
        netValue: 0,
        valuation: 0,
        premium: 0,
        taxSaving: 0,
        roi: 0,
        incomeType: '尚未变现',
        supportPolicy: [],
        grantDate: '',
        expireDate: '',
        lifeYears: 20,
        lifeUsedPct: 0,
        feeRemainDays: null,
        feeStatus: 'ok',
        timeline: [
            { date: '2025-08', icon: 'fa-flag',       color: 'bg-slate-400',  title: '研发立项', desc: 'AI 故障预测方向立项，已投入研发费用 95 万' },
            { date: '2026-04', icon: 'fa-magic',      color: 'bg-blue-500',   title: '资本化', desc: '核心算法进入开发阶段，支出资本化' },
            { date: '2026-07', icon: 'fa-send',       color: 'bg-blue-500',   title: '递交申请', desc: '已向国家知识产权局递交发明专利申请' },
            { date: '2026-09', icon: 'fa-search',     color: 'bg-orange-500', title: '实质审查中', desc: '当前处于实质审查阶段，预计 6-12 个月授权' }
        ]
    }
];

/* ============================================================
 * 统一数据层（localStorage）—— 维护页写入，首页/证书页/档案读取
 * ============================================================ */
var ASSET_STORE_KEY = 'yzp_intangible_assets';

function loadAssets() {
    try {
        var raw = localStorage.getItem(ASSET_STORE_KEY);
        if (raw) {
            var arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length) return arr;
        }
    } catch (e) {}
    // 首次使用：深拷贝内置示例作为种子
    return DEFAULT_ASSETS.map(function (a) { return JSON.parse(JSON.stringify(a)); });
}
function persistAssets() {
    try { localStorage.setItem(ASSET_STORE_KEY, JSON.stringify(ASSETS)); } catch (e) {}
    // 广播变更，同页其他组件可监听刷新
    try { window.dispatchEvent(new CustomEvent('assets-changed')); } catch (e) {}
}
function getAssetById(id) {
    for (var i = 0; i < ASSETS.length; i++) if (ASSETS[i].id === id) return ASSETS[i];
    return null;
}
function nextAssetId() {
    var max = 0;
    ASSETS.forEach(function (a) {
        var n = parseInt(String(a.id).replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return 'A' + String(max + 1).padStart(3, '0');
}

// 资产类型 → 默认摊销年限（月） 与 法定保护年限（年）
var TYPE_DEFAULT_LIFE = {
    '发明专利':     { months: 120, years: 20 },
    '实用新型':     { months: 60,  years: 10 },
    '外观设计':     { months: 60,  years: 15 },
    '软件著作权':   { months: 36,  years: 50 },
    '商标':         { months: 120, years: 10 },
    '域名':         { months: 12,  years: 10 },
    '土地使用权':   { months: 600, years: 50 },
    '特许经营权':   { months: 120, years: 30 },
    '非专利技术':   { months: 60,  years: 10 },
    '客户关系':     { months: 60,  years: 10 },
    '品牌价值':     { months: 120, years: 10 }
};

// 自动生成资产编号（GD+年份+4位序号，总长10）
function genAssetCode() {
    var year = new Date().getFullYear();
    var prefix = 'GD' + year;
    var max = 0;
    ASSETS.forEach(function (a) {
        if (a.assetCode && a.assetCode.indexOf(prefix) === 0) {
            var n = parseInt(a.assetCode.slice(prefix.length), 10);
            if (!isNaN(n) && n > max) max = n;
        }
    });
    return prefix + String(max + 1).padStart(4, '0');
}

// 根据类型取默认年限（月）
function defaultLifeMonthsByType(type) {
    return (TYPE_DEFAULT_LIFE[type] && TYPE_DEFAULT_LIFE[type].months) || 60;
}

// 加月：给 Date 加 N 个月，返回 'YYYY-MM'
function addMonths(dateStr, months) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + Number(months || 0));
    var m = String(d.getMonth() + 1).padStart(2, '0');
    return d.getFullYear() + '-' + m;
}

// 算两个 YYYY-MM 之间过了多少个月
function monthsBetween(fromStr, toStr) {
    if (!fromStr || !toStr) return 0;
    var f = new Date(fromStr), t = new Date(toStr);
    if (isNaN(f.getTime()) || isNaN(t.getTime()) || t < f) return 0;
    return (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
}

// 根据状态/日期/金额自动派生：净值、溢价率、active、寿命、进度、年费状态、时间线
function buildTimeline(d) {
    var y = d.grantDate ? String(d.grantDate).slice(0, 7) : '';
    if (d.status === '审查中') {
        return [
            { date: '', icon: 'fa-flag',      color: 'bg-slate-400',  title: '研发立项',       desc: '项目立项进入研究阶段，已投入研发费用 ' + d.cost + ' 万' },
            { date: '', icon: 'fa-magic',     color: 'bg-blue-500',   title: '开发支出资本化', desc: '符合资本化条件，研发投入转为资产入账' },
            { date: '', icon: 'fa-send',      color: 'bg-blue-500',   title: '递交申请',       desc: '已提交知识产权申请' },
            { date: '', icon: 'fa-search',    color: 'bg-orange-500', title: '实质审查中',     desc: '当前处于审查阶段，等待授权' }
        ];
    }
    var tl = [
        { date: '', icon: 'fa-flag',        color: 'bg-slate-400',  title: '研发立项',       desc: '项目立项进入研究阶段' },
        { date: '', icon: 'fa-magic',       color: 'bg-blue-500',   title: '开发支出资本化', desc: '研发投入资本化形成无形资产' },
        { date: '', icon: 'fa-send',        color: 'bg-blue-500',   title: '递交申请',       desc: '提交知识产权申请' },
        { date: y, icon: 'fa-certificate',  color: 'bg-emerald-500',title: '授权拿证',       desc: d.certNo ? ('证书号 ' + d.certNo) : '取得权利证书' }
    ];
    // 已拿证但还没办取得入库：停在"待入库"节点
    if (d.status === '待入库') {
        tl.push({ date: '', icon: 'fa-hourglass-half', color: 'bg-amber-500', title: '待办理取得入库', desc: '证书已下发，等待「取得入库」审批入账后正式进入资产档案' });
        return tl;
    }
    if (d.tags.indexOf('沉睡资产') < 0) {
        tl.push({ date: '', icon: 'fa-cogs',       color: 'bg-emerald-500', title: '投入使用', desc: '应用于产品/经营，开始创造价值' });
        if (d.taxSaving > 0) tl.push({ date: '', icon: 'fa-calculator', color: 'bg-indigo-500', title: '摊销省税', desc: '累计加计扣除省税 ' + d.taxSaving + ' 万' });
        if (d.valuation > 0) tl.push({ date: '', icon: 'fa-line-chart', color: 'bg-amber-500',  title: '评估估值', desc: '专家估值 ' + d.valuation + ' 万' });
    }
    return tl;
}
function deriveAssetFields(d) {
    if (!Array.isArray(d.tags)) d.tags = [];
    d.cost = Number(d.cost) || 0;
    d.amortized = Number(d.amortized) || 0;
    d.valuation = Number(d.valuation) || 0;
    d.taxSaving = Number(d.taxSaving) || 0;
    d.roi = Number(d.roi) || 0;
    d.netValue = Math.max(0, d.cost - d.amortized);
    d.premium = (d.cost > 0 && d.valuation > 0) ? Math.round((d.valuation - d.cost) / d.cost * 100) : 0;

    // ===== 财务摊销字段（自动计算 + 容错） =====
    if (!d.amortizationMethod) d.amortizationMethod = '平均年限法';
    var lifeMonths = Number(d.usefulLifeMonths);
    if (!lifeMonths || lifeMonths <= 0) {
        lifeMonths = defaultLifeMonthsByType(d.type);
    }
    d.usefulLifeMonths = lifeMonths;
    var rate = Number(d.salvageRate);
    if (isNaN(rate) || rate < 0) rate = 5;
    d.salvageRate = rate;
    // 月摊销额 = (原值 - 原值 × 残值率%) / 年限(月)
    if (d.cost > 0 && lifeMonths > 0) {
        d.monthlyAmortization = Number(((d.cost - d.cost * rate / 100) / lifeMonths).toFixed(2));
    } else {
        d.monthlyAmortization = 0;
    }
    // 摊销截止日期 = 获得日期 + 年限(月)
    if (d.grantDate && d.usefulLifeMonths > 0) {
        // 用 YYYY-MM 粒度（与截图一致）
        d.amortizationEndDate = addMonths(d.grantDate, d.usefulLifeMonths);
    } else {
        d.amortizationEndDate = '';
    }

    // ===== 标签 / 状态 / 寿命 / 进度 / 年费 / 时间线（原有逻辑不变） =====
    // 在途申请标签随状态
    if (d.status !== '有效中') { if (d.tags.indexOf('在途申请') < 0) d.tags.push('在途申请'); }
    else { d.tags = d.tags.filter(function (t) { return t !== '在途申请'; }); }
    d.active = (d.status === '有效中' && d.tags.indexOf('沉睡资产') < 0);
    // 法律寿命
    if (d.grantDate && d.expireDate) {
        var g = new Date(d.grantDate), e = new Date(d.expireDate), now = new Date();
        var total = e - g, used = now - g;
        d.lifeYears = Math.max(1, Math.round(total / (365.25 * 24 * 3600 * 1000)));
        d.lifeUsedPct = total > 0 ? Math.max(0, Math.min(100, Math.round(used / total * 100))) : 0;
    } else {
        d.lifeYears = (d.type === '商标') ? 10 : (d.type === '软件著作权' ? 50 : 20);
        d.lifeUsedPct = 0;
    }
    // 进度
    // 申报进度：有效中/待入库=3(已拿证)；审查中=applyProgress(默认2，可手填0-2)；其他=0
    if (d.status === '有效中' || d.status === '待入库') {
        d.applyProgress = 3;
        d.progress = 3;
    } else if (d.status === '审查中') {
        var ap = Number(d.applyProgress);
        d.applyProgress = (!isNaN(ap) && ap >= 0 && ap <= 2) ? ap : 2;
        d.progress = d.applyProgress;
    } else {
        d.applyProgress = 0;
        d.progress = 0;
    }
    // ===== 申报进度跟踪：applySteps 四节点时间线 =====
    var STEP_LABELS = ['写交底书', '已经递交', '正在审查', '成功拿证'];
    if (!Array.isArray(d.applySteps) || d.applySteps.length === 0) {
        // 按当前 applyProgress 自动初始化：已完成的节点带默认日期，未完成的留空
        d.applySteps = STEP_LABELS.map(function (lb, i) {
            var done = i <= d.applyProgress;
            return {
                step: i,
                label: lb,
                date: done ? (d.grantDate && i === d.applyProgress ? d.grantDate : '') : '',
                operator: '',
                note: '',
                attachment: ''
            };
        });
    }
    // 从 applySteps 推算当前进度（取最后一个有 date 的节点）
    var lastDone = -1;
    d.applySteps.forEach(function (s) { if (s.date) lastDone = s.step; });
    if (lastDone >= 0) d.progress = lastDone;
    // 年费/续展（feeRenewal 为唯一数据源，feeRemainDays/feeStatus 由它派生保持兼容）
    if (!d.feeRenewal) d.feeRenewal = {};
    var fr = d.feeRenewal;
    if (!fr.type) fr.type = (d.type === '商标' ? '续展费' : (d.type === '域名' ? '维保费' : '年费'));
    // amountSet：金额是否为人工录入的真实值（系统按到期日补建的占位记录为 false，台账显示"金额待录"）
    if (Number(fr.amount) > 0) fr.amountSet = true;
    else if (fr.amountSet !== true) fr.amountSet = false;
    if (!(Number(fr.amount) >= 0)) fr.amount = 0;
    if (!fr.dueDate) fr.dueDate = '';
    if (!fr.paidDate) fr.paidDate = '';
    // 自动推断首次到期日（从 expireDate 往前推 1 年，或用授权日+1年）
    if (!fr.dueDate && d.expireDate) {
        var ed = new Date(d.expireDate); ed.setFullYear(ed.getFullYear() - 1);
        fr.dueDate = ed.toISOString().slice(0, 10);
    }
    if (!fr.dueDate && d.grantDate) {
        var gd = new Date(d.grantDate); gd.setFullYear(gd.getFullYear() + 1);
        fr.dueDate = gd.toISOString().slice(0, 10);
    }
    // alertLevel / remainDays 自动计算
    if (fr.dueDate && !fr.paidDate && d.status === '有效中') {
        var days = Math.floor((new Date(fr.dueDate) - new Date()) / 86400000);
        fr.alertLevel = days < 0 ? 'expired' : (days < 30 ? 'urgent' : (days < 90 ? 'remind' : 'normal'));
        fr.remainDays = days;
    } else if (fr.paidDate) {
        fr.alertLevel = 'paid';
        fr.remainDays = null;
    } else {
        fr.alertLevel = 'normal';
        fr.remainDays = null;
    }
    // 同步老字段（兼容 archive.html / home.html / asset-manage.html 等）
    if (fr.alertLevel === 'paid' || d.status !== '有效中') {
        d.feeRemainDays = null; d.feeStatus = 'ok';
    } else if (fr.alertLevel === 'expired' || fr.alertLevel === 'urgent') {
        d.feeRemainDays = fr.remainDays != null ? fr.remainDays : 15;
        d.feeStatus = 'red';
    } else if (fr.alertLevel === 'remind') {
        d.feeRemainDays = fr.remainDays != null ? fr.remainDays : 45;
        d.feeStatus = 'orange';
    } else {
        d.feeRemainDays = fr.remainDays != null ? fr.remainDays : 200;
        d.feeStatus = 'ok';
    }
    if (d.tags.indexOf('沉睡资产') >= 0 && !d.sleepReason) {
        d.sleepReason = '近一年无摊销收益、无项目关联、未用于政策申报，建议评估盘活或停止维护。';
    }
    if (d.tags.indexOf('沉睡资产') < 0) d.sleepReason = '';
    if (!d.timeline || !d.timeline.length) d.timeline = buildTimeline(d);

    // ===== 第一批扩展字段（容错 + 派生） =====
    // 资产大类
    d.category = ASSET_CATEGORY_MAP[d.type] || '其他类';
    // 取得方式
    if (ACQUIRE_METHODS.indexOf(d.acquireMethod) < 0) d.acquireMethod = d.acquireMethod || '';
    // 权利归属
    if (OWNERSHIP_OPTIONS.indexOf(d.ownerShip) < 0) d.ownerShip = d.ownerShip || '本公司';
    // 发明人
    if (!d.inventor) d.inventor = '';
    // 附件数组
    if (!Array.isArray(d.attachments)) d.attachments = [];
    // disposal 字段
    if (!d.disposal) d.disposal = null;
    // 法律状态变更历史
    if (!Array.isArray(d.legalStatusHistory)) {
        d.legalStatusHistory = [{ date: d.grantDate || new Date().toISOString().slice(0,10), status: d.status, note: '初始状态' }];
    }
    // 减值测试
    if (!d.impairment) d.impairment = { method: '收益法', recoverableAmount: 0, impairmentLoss: 0, testDate: '', result: '未减值' };
    return d;
}
function addAsset(d) {
    d.id = nextAssetId();
    if (!d.assetCode) d.assetCode = genAssetCode();
    deriveAssetFields(d);
    ASSETS.unshift(d);
    persistAssets();
    return d;
}

// 推进申报进度到下一步：填日期+操作人+备注+附件
function advanceStep(id, targetStep, info) {
    var a = getAssetById(id);
    if (!a) return null;
    if (!Array.isArray(a.applySteps)) deriveAssetFields(a);
    if (targetStep < 0 || targetStep > 3) return null;
    var s = a.applySteps[targetStep];
    if (!s) return null;
    s.date = info.date || new Date().toISOString().slice(0, 10);
    s.operator = info.operator || '';
    s.note = info.note || '';
    s.attachment = info.attachment || '';
    // 推算当前进度
    var lastDone = -1;
    a.applySteps.forEach(function (st) { if (st.date) lastDone = st.step; });
    a.progress = lastDone >= 0 ? lastDone : a.progress;
    a.applyProgress = a.progress;
    // 拿证(3)：不直接入档案，先进入「待入库」——
    //   · 已有审批通过的取得入库记录（研发支出提前资本化）→ 直接有效中
    //   · 否则置为待入库，并自动生成一条"取得入库"待审批事件，由财务在取得入库模块办理
    if (a.progress >= 3 && a.status === '审查中') {
        var today = info.date || new Date().toISOString().slice(0, 10);
        if (!a.grantDate) a.grantDate = today;
        var doneEvent = ASSET_LIFECYCLE_EVENTS.some(function (e) {
            return e.stage === '取得入库' && e.assetId === a.id && (e.status === '已执行' || e.status === '已通过');
        });
        if (doneEvent) {
            a.status = '有效中';
            a.active = true;
            a.tags = (a.tags || []).filter(function (t) { return t !== '在途申请'; });
        } else {
            a.status = '待入库';
            var pendingEvent = ASSET_LIFECYCLE_EVENTS.some(function (e) {
                return e.stage === '取得入库' && e.assetId === a.id && e.status === '待审批';
            });
            if (!pendingEvent && typeof addLifecycleEvent === 'function') {
                addLifecycleEvent({
                    assetId: a.id,
                    stage: '取得入库',
                    eventType: a.acquireMethod || '自主研发',
                    eventDate: today,
                    operator: info.operator || '',
                    note: '「' + a.name + '」已成功拿证，申请研发支出资本化并办理取得入库，审批通过后正式进入资产档案',
                    attachments: info.attachment ? [{ name: info.attachment }] : [],
                    amount: Number(a.cost) || 0,
                    fromGrant: true
                });
            }
        }
    }
    persistAssets();
    return a;
}
function updateAsset(id, d) {
    var idx = -1, old = null;
    for (var i = 0; i < ASSETS.length; i++) if (ASSETS[i].id === id) { idx = i; old = ASSETS[i]; break; }
    if (idx < 0) return null;
    d.id = id;
    // 关键信息变化时重建时间线，否则保留
    d.timeline = old.timeline;
    deriveAssetFields(d);
    if (d.status !== old.status || d.grantDate !== old.grantDate || d.taxSaving !== old.taxSaving || d.valuation !== old.valuation) {
        d.timeline = buildTimeline(d);
    }
    ASSETS[idx] = d;
    persistAssets();
    return d;
}
function deleteAsset(id) {
    for (var i = 0; i < ASSETS.length; i++) {
        if (ASSETS[i].id === id) { ASSETS.splice(i, 1); persistAssets(); return true; }
    }
    return false;
}
function resetAssetsToDemo() {
    try { localStorage.removeItem(ASSET_STORE_KEY); } catch (e) {}
    ASSETS.length = 0;
    loadAssets().forEach(function (a) { ASSETS.push(a); });
    persistAssets();
}

// 运行时数据（各页面共享）—— 种子数据首次加载时逐条派生
var ASSETS = loadAssets();
ASSETS.forEach(function (a) { deriveAssetFields(a); });

/* ============================================================
 * 处置与核销数据集（ASSET_DISPOSALS）
 * ============================================================ */
var ASSET_DISPOSAL_KEY = 'yzp_asset_disposals';
var DEFAULT_DISPOSALS = [];

function loadDisposals() {
    try {
        var raw = localStorage.getItem(ASSET_DISPOSAL_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_DISPOSALS.map(function (d) { return JSON.parse(JSON.stringify(d)); });
}
function persistDisposals() {
    try { localStorage.setItem(ASSET_DISPOSAL_KEY, JSON.stringify(ASSET_DISPOSALS)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('disposals-changed')); } catch (e) {}
}
var ASSET_DISPOSALS = loadDisposals();

// 发起处置：把资产状态改为"已处置"，写入处置台账
function disposeAsset(id, info) {
    var a = getAssetById(id);
    if (!a) return null;
    a.disposal = {
        type: info.type,           // 出售/报废/失效/注销
        date: info.date,
        reason: info.reason,
        operator: info.operator,
        proceeds: Number(info.proceeds) || 0,   // 处置收入
        approvedBy: info.approvedBy
    };
    a.status = '已处置';
    deriveAssetFields(a);
    persistAssets();
    // 写入处置台账
    var rec = {
        id: 'D' + Date.now(),
        assetId: id,
        assetName: a.name,
        assetCode: a.assetCode || id,
        type: info.type,
        date: info.date,
        reason: info.reason,
        operator: info.operator,
        proceeds: Number(info.proceeds) || 0,
        approvedBy: info.approvedBy
    };
    ASSET_DISPOSALS.unshift(rec);
    persistDisposals();
    return rec;
}
function getDisposals() { return ASSET_DISPOSALS; }

/* ============================================================
 * 合同管理数据集（ASSET_CONTRACTS）
 * ============================================================ */
var ASSET_CONTRACT_KEY = 'yzp_asset_contracts';
var DEFAULT_CONTRACTS = [
    {
        id: 'C001',
        contractNo: 'HT202503001',
        type: '许可合同',
        title: 'AI算法专利普通许可协议',
        assetIds: ['A001'],
        counterparty: '深圳智控科技有限公司',
        amount: 120,
        signDate: '2025-03-15',
        startDate: '2025-04-01',
        endDate: '2027-03-31',
        status: '履约中',
        paymentNodes: [
            { name: '首付款', amount: 36, dueDate: '2025-04-10', paidDate: '2025-04-08', status: '已收' },
            { name: '中期款', amount: 48, dueDate: '2026-04-10', paidDate: '', status: '待收' },
            { name: '尾款',   amount: 36, dueDate: '2027-03-31', paidDate: '', status: '待收' }
        ],
        files: [{ name: 'AI算法许可协议.pdf', uploadDate: '2025-03-15' }]
    },
    {
        id: 'C002',
        contractNo: 'HT202506002',
        type: '转让合同',
        title: '边缘计算软件著作权转让协议',
        assetIds: ['A002'],
        counterparty: '杭州云端网络科技有限公司',
        amount: 80,
        signDate: '2025-06-20',
        startDate: '2025-07-01',
        endDate: '2025-12-31',
        status: '已完成',
        paymentNodes: [
            { name: '一次性付款', amount: 80, dueDate: '2025-07-15', paidDate: '2025-07-12', status: '已收' }
        ],
        files: [{ name: '软著转让合同.pdf', uploadDate: '2025-06-20' }]
    }
];

function loadContracts() {
    try {
        var raw = localStorage.getItem(ASSET_CONTRACT_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_CONTRACTS.map(function (c) { return JSON.parse(JSON.stringify(c)); });
}
function persistContracts() {
    try { localStorage.setItem(ASSET_CONTRACT_KEY, JSON.stringify(ASSET_CONTRACTS)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('contracts-changed')); } catch (e) {}
}
var ASSET_CONTRACTS = loadContracts();

function nextContractId() {
    var max = 0;
    ASSET_CONTRACTS.forEach(function (c) {
        var n = parseInt(String(c.id).replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return 'C' + String(max + 1).padStart(3, '0');
}
function genContractNo() {
    var year = new Date().getFullYear();
    var prefix = 'HT' + year;
    var max = 0;
    ASSET_CONTRACTS.forEach(function (c) {
        if (c.contractNo && c.contractNo.indexOf(prefix) === 0) {
            var n = parseInt(c.contractNo.slice(prefix.length), 10);
            if (!isNaN(n) && n > max) max = n;
        }
    });
    return prefix + String(max + 1).padStart(3, '0');
}
function addContract(c) {
    c.id = nextContractId();
    if (!c.contractNo) c.contractNo = genContractNo();
    if (!Array.isArray(c.paymentNodes)) c.paymentNodes = [];
    if (!Array.isArray(c.files)) c.files = [];
    if (!Array.isArray(c.assetIds)) c.assetIds = [];
    ASSET_CONTRACTS.unshift(c);
    persistContracts();
    return c;
}
function updateContract(id, c) {
    for (var i = 0; i < ASSET_CONTRACTS.length; i++) {
        if (ASSET_CONTRACTS[i].id === id) {
            c.id = id;
            ASSET_CONTRACTS[i] = c;
            persistContracts();
            return c;
        }
    }
    return null;
}
function deleteContract(id) {
    for (var i = 0; i < ASSET_CONTRACTS.length; i++) {
        if (ASSET_CONTRACTS[i].id === id) { ASSET_CONTRACTS.splice(i, 1); persistContracts(); return true; }
    }
    return false;
}
function markNodePaid(contractId, nodeIdx, paidDate, voucherNo) {
    for (var i = 0; i < ASSET_CONTRACTS.length; i++) {
        if (ASSET_CONTRACTS[i].id === contractId) {
            var node = ASSET_CONTRACTS[i].paymentNodes[nodeIdx];
            if (node) {
                node.paidDate = paidDate;
                node.voucherNo = voucherNo || '';
                node.status = '已收';
                var allPaid = ASSET_CONTRACTS[i].paymentNodes.every(function (n) { return n.status === '已收'; });
                ASSET_CONTRACTS[i].status = allPaid ? '已完成' : '履约中';
                persistContracts();
                return ASSET_CONTRACTS[i];
            }
        }
    }
    return null;
}

/* ============================================================
 * 法律状态监控（模拟同步官方数据库）
 * ============================================================ */
// 更新法律状态，写入历史
function updateLegalStatus(id, newStatus, note) {
    var a = getAssetById(id);
    if (!a) return null;
    if (!Array.isArray(a.legalStatusHistory)) a.legalStatusHistory = [];
    a.legalStatusHistory.unshift({
        date: new Date().toISOString().slice(0, 10),
        status: newStatus,
        note: note || '状态变更'
    });
    a.status = newStatus;
    deriveAssetFields(a);
    persistAssets();
    return a;
}
// 模拟从官方数据库同步（随机生成状态变更，原型用）
function mockSyncLegalStatus() {
    // 模拟对接国家知识产权局法律状态查询接口
    // 请求契约：GET /api/zhuanli/status?assetIds=A001,A002
    // 响应契约：{ code:0, data:[{ assetId, legalStatus, changeType, changeDate, registerNo, riskLevel }], syncMeta:{ requestId, latencyMs, source, isIncremental } }
    var changes = [];
    var syncFields = ['主分类号','申请号','公开号','授权号','法律状态','状态变更日','质押登记号','无效宣告请求号','诉讼案号'];
    var requestId = 'SYNC-' + Date.now().toString(36).toUpperCase();
    var latencyMs = Math.floor(80 + Math.random() * 120);
    ASSETS.forEach(function (a) {
        if (a.status !== '有效中') return;
        var r = Math.random();
        if (r < 0.03) {
            var newSt, changeType, registerNo, riskLevel;
            if (r < 0.01)      { newSt = '质押冻结'; changeType = '质押登记';   registerNo = 'ZK' + Math.floor(Math.random()*900000+100000); riskLevel = '中'; }
            else if (r < 0.02) { newSt = '诉讼中';   changeType = '侵权诉讼';   registerNo = 'ZS' + Math.floor(Math.random()*900000+100000); riskLevel = '高'; }
            else               { newSt = '无效宣告'; changeType = '无效宣告请求'; registerNo = 'WX' + Math.floor(Math.random()*900000+100000); riskLevel = '高'; }
            updateLegalStatus(a.id, newSt, '官方同步：' + changeType + '（登记号 ' + registerNo + '）');
            changes.push({
                assetId: a.id, assetName: a.name, assetType: a.type,
                oldStatus: '有效中', newStatus: newSt,
                changeType: changeType, registerNo: registerNo,
                riskLevel: riskLevel, changeDate: new Date().toISOString().slice(0,10)
            });
        }
    });
    return {
        code: 0,
        message: 'ok',
        requestId: requestId,
        latencyMs: latencyMs,
        source: '国家知识产权局法律状态查询接口 v2.3（模拟）',
        isIncremental: true,
        lastSyncTime: new Date().toISOString().slice(0,19).replace('T',' '),
        syncFields: syncFields,
        totalAssets: ASSETS.length,
        changedCount: changes.length,
        changes: changes,
        hasWarning: Math.random() < 0.15,   // 15% 概率有警告（如部分资产查询超时）
        warningMsg: '部分资产法律状态查询超时，将在下次同步重试'
    };
}

/* ============================================================
 * 减值测试
 * ============================================================ */
// 执行减值测试：可收回金额 vs 账面价值，低于则减值
function runImpairmentTest(id, method, recoverableAmount) {
    var a = getAssetById(id);
    if (!a) return null;
    var bv = a.netValue || 0;
    var loss = Math.max(0, bv - recoverableAmount);
    a.impairment = {
        method: method,                          // 成本法/收益法/市场法
        recoverableAmount: Number(recoverableAmount) || 0,
        bookValue: bv,
        impairmentLoss: loss,
        testDate: new Date().toISOString().slice(0, 10),
        result: loss > 0 ? '需减值' : '未减值'
    };
    if (loss > 0) {
        // 计提减值：净值减少
        a.netValue = recoverableAmount;
        a.amortized = a.cost - a.netValue;
    }
    persistAssets();
    return a.impairment;
}

/* ============================================================
 * 侵权监控与维权案件（ASSET_INFRINGEMENT_CASES）
 * ============================================================ */
var ASSET_INFRINGEMENT_KEY = 'yzp_infringement_cases';
var DEFAULT_INFRINGEMENT = [
    {
        id: 'INF001', assetId: 'A001', assetName: '一种工业智能控制算法',
        type: '专利侵权', source: '市场监测', suspect: '某某科技有限公司',
        desc: '发现疑似产品使用了本专利的核心算法',
        status: '调查中', severity: '高',
        detectedDate: '2026-08-15', caseNo: '',
        timeline: [{ date: '2026-08-15', action: '发现疑似侵权', note: '市场监测发现' }]
    }
];
function loadInfringements() {
    try { var raw = localStorage.getItem(ASSET_INFRINGEMENT_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return DEFAULT_INFRINGEMENT.map(function (d) { return JSON.parse(JSON.stringify(d)); });
}
function persistInfringements() {
    try { localStorage.setItem(ASSET_INFRINGEMENT_KEY, JSON.stringify(ASSET_INFRINGEMENTS)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('infringements-changed')); } catch (e) {}
}
var ASSET_INFRINGEMENTS = loadInfringements();
function nextInfId() {
    var max = 0;
    ASSET_INFRINGEMENTS.forEach(function (c) {
        var n = parseInt(String(c.id).replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return 'INF' + String(max + 1).padStart(3, '0');
}
function addInfringementCase(c) {
    c.id = nextInfId();
    if (!c.detectedDate) c.detectedDate = new Date().toISOString().slice(0, 10);
    if (!c.status) c.status = '调查中';
    if (!Array.isArray(c.timeline)) c.timeline = [{ date: c.detectedDate, action: '立案', note: c.desc || '' }];
    ASSET_INFRINGEMENTS.unshift(c);
    persistInfringements();
    return c;
}
function updateInfringementCase(id, update) {
    for (var i = 0; i < ASSET_INFRINGEMENTS.length; i++) {
        if (ASSET_INFRINGEMENTS[i].id === id) {
            Object.assign(ASSET_INFRINGEMENTS[i], update);
            persistInfringements();
            return ASSET_INFRINGEMENTS[i];
        }
    }
    return null;
}
function addCaseTimeline(id, action, note) {
    for (var i = 0; i < ASSET_INFRINGEMENTS.length; i++) {
        if (ASSET_INFRINGEMENTS[i].id === id) {
            ASSET_INFRINGEMENTS[i].timeline.unshift({ date: new Date().toISOString().slice(0, 10), action: action, note: note || '' });
            persistInfringements();
            return ASSET_INFRINGEMENTS[i];
        }
    }
    return null;
}
// 模拟侵权监测（随机生成疑似侵权）
function mockScanInfringement() {
    var actives = ASSETS.filter(function (a) { return a.status === '有效中'; });
    if (!actives.length) return null;
    var a = actives[Math.floor(Math.random() * actives.length)];
    var suspects = ['某某科技有限公司', '创新电子厂', '智联网络公司', '未来智造集团'];
    var types = ['专利侵权', '商标侵权', '著作权侵权', '域名抢注'];
    return addInfringementCase({
        assetId: a.id, assetName: a.name,
        type: types[Math.floor(Math.random() * types.length)],
        source: '模拟舆情监测',
        suspect: suspects[Math.floor(Math.random() * suspects.length)],
        desc: '监测到疑似侵权行为，需进一步核实',
        severity: Math.random() > 0.5 ? '高' : '中'
    });
}

/* ============================================================
 * 工具函数
 * ============================================================ */

// 按状态筛选
function getAssetsByStatus(statusKey) {
    // statusKey: 'granted' 已拿证(有效中) / 'pending' 在途申请(审查中) / 'warehousing' 已拿证待入库 / 'sleep' 沉睡
    return ASSETS.filter(function(a) {
        if (statusKey === 'granted') return a.status === '有效中';
        if (statusKey === 'pending') return a.status === '审查中';
        if (statusKey === 'warehousing') return a.status === '待入库';
        if (statusKey === 'sleep')   return a.active === false && a.status === '有效中';
        return true;
    });
}

// 健康度颜色
function lifeBarColor(pct) {
    // 剩余寿命 = 100 - pct；剩余越少越红
    var remain = 100 - pct;
    if (remain > 60) return 'bg-emerald-500';
    if (remain > 25) return 'bg-amber-500';
    return 'bg-red-500';
}
function feeText(a) {
    if (a.status !== '有效中') return { text: '非有效状态，暂无年费', cls: 'text-slate-400' };
    var fr = a.feeRenewal || {};
    if (fr.alertLevel === 'paid') return { text: fr.type + '已缴（' + (fr.paidDate || '') + '）', cls: 'text-emerald-600' };
    if (fr.alertLevel === 'expired') return { text: fr.type + '已过期 ' + Math.abs(fr.remainDays || 0) + ' 天！请立即补缴', cls: 'text-red-600 font-bold' };
    if (fr.alertLevel === 'urgent') return { text: fr.type + ' ' + (fr.remainDays || 0) + ' 天后到期，请尽快缴费', cls: 'text-red-500' };
    if (fr.alertLevel === 'remind') return { text: fr.type + ' ' + (fr.remainDays || 0) + ' 天后到期，建议设提醒', cls: 'text-orange-500' };
    return { text: fr.type + '正常（剩余 ' + (fr.remainDays || 200) + ' 天）', cls: 'text-emerald-600' };
}

// 生成标签 HTML
function tagsHtml(a, size) {
    var pad = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]';
    return a.tags.map(function(t) {
        var cls = ASSET_TAG_STYLE[t] || 'bg-slate-100 text-slate-500 border border-slate-200';
        return '<span class="' + pad + ' font-bold rounded-full ' + cls + '">' + t + '</span>';
    }).join('');
}

/* ============================================================
 * 资产成长档案弹窗
 * ============================================================ */
function openAssetDetail(id) {
    var a = ASSETS.find(function(x) { return x.id === id; });
    if (!a) return;
    var st = ASSET_TYPE_STYLE[a.type] || ASSET_TYPE_STYLE['发明专利'];
    var fee = feeText(a);
    var isSleep = a.tags.indexOf('沉睡资产') >= 0;
    var isPending = a.status !== '有效中';
    var isWarehousing = a.status === '待入库';

    // 身价数字
    var money = function(v) { return v > 0 ? v.toLocaleString() : '—'; };

    // 时间线
    var tlHtml = a.timeline.map(function(step, i) {
        var last = i === a.timeline.length - 1;
        return '<div class="flex gap-4 ' + (last ? '' : 'pb-5') + ' relative">'
            +   '<div class="flex flex-col items-center">'
            +     '<div class="w-9 h-9 rounded-full ' + step.color + ' text-white flex items-center justify-center text-sm flex-shrink-0 shadow"><i class="fa ' + step.icon + '"></i></div>'
            +     (last ? '' : '<div class="w-0.5 flex-1 bg-slate-200 mt-1"></div>')
            +   '</div>'
            +   '<div class="pt-1.5">'
            +     '<p class="text-[10px] text-slate-400 font-bold">' + step.date + '</p>'
            +     '<p class="text-sm font-bold text-slate-800">' + step.title + '</p>'
            +     '<p class="text-xs text-slate-500 mt-0.5 leading-relaxed">' + step.desc + '</p>'
            +   '</div>'
            + '</div>';
    }).join('');

    // 沉睡提示
    var sleepBanner = isSleep ? (
        '<div class="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-2xl flex gap-3">'
        +   '<div class="w-9 h-9 bg-slate-300 text-white rounded-full flex items-center justify-center flex-shrink-0"><i class="fa fa-moon-o"></i></div>'
        +   '<div>'
        +     '<p class="text-xs font-black text-slate-600">这个宝贝在"睡大觉"</p>'
        +     '<p class="text-[11px] text-slate-500 mt-1 leading-relaxed">' + (a.sleepReason || '近一年无摊销收益、无项目关联、未用于政策申报。') + '</p>'
        +     '<p class="text-[11px] text-blue-600 font-bold mt-1.5">建议：要么投入产品/品牌使用变现，要么评估是否继续维护，别白交年费。</p>'
        +   '</div>'
        + '</div>'
    ) : '';

    var html =
      '<div id="assetModalMask" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)closeAssetDetail()">'
    +   '<div class="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">'
    // 顶部身份
    +   '<div class="p-8 border-b border-slate-100 relative">'
    +     '<button onclick="closeAssetDetail()" class="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
    +     '<div class="flex items-start gap-4">'
    +       '<div class="w-14 h-14 ' + st.bg + ' rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"><i class="fa ' + st.icon + '"></i></div>'
    +       '<div>'
    +         '<h2 class="text-xl font-black text-slate-800">' + a.name + '</h2>'
    +         '<p class="text-xs text-slate-400 mt-1">' + a.type + ' · ' + a.certNo + '</p>'
    +         '<div class="flex flex-wrap gap-1.5 mt-2.5">' + tagsHtml(a) + '</div>'
    +       '</div>'
    +     '</div>'
    // 健康度
    +     '<div class="mt-5 p-4 bg-slate-50 rounded-2xl">'
    +       '<div class="flex justify-between items-center mb-2">'
    +         '<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">' + (isWarehousing ? '入库状态' : (isPending ? '申请进度' : '法律寿命')) + '</span>'
    +         (isWarehousing
    ?           '<span class="text-[11px] font-bold text-amber-500"><i class="fa fa-hourglass-half mr-1"></i>已拿证，待办理取得入库</span>'
    :         (isPending
    ?           '<span class="text-[11px] font-bold text-orange-500">实质审查中</span>'
    :           '<span class="text-[11px] font-bold text-slate-600">' + a.grantDate + ' 授权 · 保护至 ' + a.expireDate + '</span>'))
    +       '</div>'
    +       (isPending ? '' :
          '<div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2"><div class="' + lifeBarColor(a.lifeUsedPct) + ' h-full" style="width:' + a.lifeUsedPct + '%"></div></div>'
        + '<p class="text-[10px] text-slate-400">已使用 ' + a.lifeUsedPct + '% 的法定保护期，剩余约 ' + Math.round(a.lifeYears * (100 - a.lifeUsedPct) / 100) + ' 年</p>')
    +       '<p class="text-[11px] font-bold mt-2 ' + fee.cls + '"><i class="fa fa-bell-o mr-1"></i>' + fee.text + '</p>'
    +     '</div>'
    +   '</div>'

    +   '<div class="p-8">'
    // 身价
    +     '<h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center"><i class="fa fa-diamond mr-2 text-blue-600"></i>这个宝贝值多少钱</h3>'
    +     '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">'
    +       '<div class="p-4 bg-slate-50 rounded-2xl text-center"><p class="text-[10px] text-slate-400 font-bold mb-1">研发投入</p><p class="text-lg font-black text-slate-700">' + money(a.cost) + '<span class="text-[10px]"> 万</span></p></div>'
    +       '<div class="p-4 bg-slate-50 rounded-2xl text-center"><p class="text-[10px] text-slate-400 font-bold mb-1">累计摊销</p><p class="text-lg font-black text-slate-500">' + money(a.amortized) + '<span class="text-[10px]"> 万</span></p></div>'
    +       '<div class="p-4 bg-slate-50 rounded-2xl text-center"><p class="text-[10px] text-slate-400 font-bold mb-1">账面净值</p><p class="text-lg font-black text-slate-700">' + money(a.netValue) + '<span class="text-[10px]"> 万</span></p></div>'
    +       '<div class="p-4 bg-blue-600 rounded-2xl text-center text-white"><p class="text-[10px] text-white/60 font-bold mb-1">专家估值</p><p class="text-lg font-black">' + money(a.valuation) + '<span class="text-[10px]"> 万</span></p>'
    +         (a.premium > 0 ? '<p class="text-[9px] text-emerald-300 font-bold mt-0.5">溢价 ' + a.premium + '%</p>' : '<p class="text-[9px] text-white/50 mt-0.5">待授权后评估</p>') + '</div>'
    +     '</div>'

    // 赚钱记录（已授权才显示）
    +     (isPending ? '' :
        '<h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 mt-7 flex items-center"><i class="fa fa-money mr-2 text-emerald-600"></i>它帮我赚了什么</h3>'
      + '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">'
      +   '<div class="p-4 bg-emerald-50 rounded-2xl"><p class="text-[10px] text-emerald-600/70 font-bold mb-1">累计省税</p><p class="text-lg font-black text-emerald-600">' + money(a.taxSaving) + ' <span class="text-[10px]">万</span></p><p class="text-[9px] text-emerald-600/60 mt-0.5">研发费用加计扣除</p></div>'
      +   '<div class="p-4 bg-indigo-50 rounded-2xl"><p class="text-[10px] text-indigo-600/70 font-bold mb-1">投资回报 ROI</p><p class="text-lg font-black text-indigo-600">' + (a.roi > 0 ? a.roi + '%' : '—') + '</p><p class="text-[9px] text-indigo-600/60 mt-0.5">变现方式：' + a.incomeType + '</p></div>'
      +   '<div class="p-4 bg-amber-50 rounded-2xl col-span-2 md:col-span-1"><p class="text-[10px] text-amber-600/70 font-bold mb-1">政策申报支撑</p><p class="text-[11px] font-black text-amber-700 leading-relaxed pt-1">' + (a.supportPolicy.length ? a.supportPolicy.join('；') : '暂未用于申报') + '</p></div>'
      + '</div>')

    +     sleepBanner

    // 成长时间线
    +     '<h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-5 mt-7 flex items-center"><i class="fa fa-history mr-2 text-indigo-600"></i>成长时间线</h3>'
    +     '<div>' + tlHtml + '</div>'

    +   '</div>'
    + '</div>'
    + '</div>';

    var mask = document.createElement('div');
    mask.innerHTML = html;
    document.body.appendChild(mask.firstChild);
    document.body.style.overflow = 'hidden';
}
function closeAssetDetail() {
    var m = document.getElementById('assetModalMask');
    if (m) m.remove();
    document.body.style.overflow = '';
}

/* ============================================================
 * 首页 KPI 下钻明细（省税 / 估值构成）
 * type: 'tax' 省税明细  /  'valuation' 估值构成
 * ============================================================ */
function openDrillDown(type) {
    var isTax = type === 'tax';
    var granted = ASSETS.filter(function(a) { return a.status === '有效中'; });
    var rows = granted
        .filter(function(a) { return isTax ? a.taxSaving > 0 : a.valuation > 0; })
        .sort(function(x, y) { return isTax ? (y.taxSaving - x.taxSaving) : (y.valuation - x.valuation); });

    var total = rows.reduce(function(s, a) { return s + (isTax ? a.taxSaving : a.valuation); }, 0);
    var max = rows.length ? (isTax ? rows[0].taxSaving : rows[0].valuation) : 1;

    var title = isTax ? '省下来的税，都是哪些宝贝贡献的？' : '8520 万身价，是哪些宝贝撑起来的？';
    var sub   = isTax ? '按研发费用加计扣除测算，点开任意一行看该资产完整档案' : '按专家估值排序，点开任意一行看该资产完整档案';
    var unit  = isTax ? '万' : '万';
    var accent= isTax ? 'emerald' : 'blue';

    var rowsHtml = rows.map(function(a, i) {
        var val = isTax ? a.taxSaving : a.valuation;
        var pct = Math.round(val / max * 100);
        var share = total ? (val / total * 100) : 0;
        var st = ASSET_TYPE_STYLE[a.type];
        return '<div onclick="closeAssetDetail();openAssetDetail(\'' + a.id + '\')" class="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-all">'
            +  '<div class="flex items-center justify-between mb-2">'
            +    '<div class="flex items-center min-w-0">'
            +      '<span class="w-5 h-5 rounded-full bg-' + accent + '-600 text-white text-[10px] font-black flex items-center justify-center mr-2 flex-shrink-0">' + (i+1) + '</span>'
            +      '<div class="w-7 h-7 ' + st.bg + ' rounded-lg flex items-center justify-center mr-2 text-sm flex-shrink-0"><i class="fa ' + st.icon + '"></i></div>'
            +      '<div class="min-w-0"><p class="text-xs font-bold text-slate-800 truncate">' + a.name + '</p>'
            +      '<p class="text-[9px] text-slate-400">' + a.type + (isTax && a.taxSaving === Math.max.apply(null, rows.map(function(r){return r.taxSaving;})) ? ' · 省税冠军' : '') + '</p></div>'
            +    '</div>'
            +    '<div class="text-right flex-shrink-0 ml-2">'
            +      '<p class="text-sm font-black text-' + accent + '-600">' + val + ' <span class="text-[10px]">' + unit + '</span></p>'
            +      '<p class="text-[9px] text-slate-400">占 ' + share.toFixed(0) + '%</p>'
            +    '</div>'
            +  '</div>'
            +  '<div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div class="bg-' + accent + '-600 h-full" style="width:' + pct + '%"></div></div>'
            + '</div>';
    }).join('');

    var html =
      '<div id="assetModalMask" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)closeAssetDetail()">'
    +   '<div class="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">'
    +     '<div class="p-8 border-b border-slate-100 relative">'
    +       '<button onclick="closeAssetDetail()" class="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
    +       '<h2 class="text-lg font-black text-slate-800 pr-10">' + title + '</h2>'
    +       '<p class="text-xs text-slate-400 mt-1.5">' + sub + '</p>'
    +       '<div class="mt-4 p-4 bg-' + accent + '-600 rounded-2xl text-white flex items-baseline gap-2">'
    +         '<span class="text-[10px] font-bold text-white/70 uppercase">' + (isTax ? '可追溯合计' : '可追溯估值') + '</span>'
    +         '<span class="text-2xl font-black">' + total + '</span><span class="text-xs font-bold">' + unit + '</span>'
    +       '</div>'
    +     '</div>'
    +     '<div class="p-8 space-y-3">' + rowsHtml + '</div>'
    +   '</div>'
    + '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstChild);
    document.body.style.overflow = 'hidden';
}

/* ============================================================
 * 全生命周期事件数据集（ASSET_LIFECYCLE_EVENTS）
 * 覆盖资产从"生"到"死"全过程：取得入库 / 变更 / 处置 / 摊销
 * ============================================================ */
var ASSET_LIFECYCLE_KEY = 'yz_lifecycle_events';

// 阶段 → 图标 / 配色（页面渲染统一引用）
var LIFECYCLE_STAGE_STYLE = {
    '取得入库': { icon: 'fa-plus-circle',    color: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-600 border-blue-200' },
    '变更':     { icon: 'fa-exchange',      color: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-600 border-amber-200' },
    '处置':     { icon: 'fa-flag',          color: 'bg-red-500',     badge: 'bg-red-50 text-red-600 border-red-200' },
    '摊销':     { icon: 'fa-calculator',    color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
};

// 事件状态 → 标签样式
var LIFECYCLE_STATUS_STYLE = {
    '待审批': 'bg-orange-50 text-orange-600 border-orange-200',
    '已通过': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    '已驳回': 'bg-red-50 text-red-600 border-red-200',
    '已执行': 'bg-slate-100 text-slate-600 border-slate-200'
};

// 种子事件（首次写入 localStorage 后以本地为准）
var DEFAULT_LIFECYCLE_EVENTS = [
    { id: 'L0001', assetId: 'A001', stage: '取得入库', eventType: '外购',
      eventDate: '2023-02-10', operator: '王财务', approver: '李总', status: '已执行',
      note: '外购取得工业智能控制算法，对价 180 万一次性入账',
      attachments: [{ name: '购买协议.pdf' }, { name: '付款凭证.png' }],
      fromVal: '', toVal: '180', amount: 180 },
    { id: 'L0002', assetId: 'A001', stage: '摊销', eventType: '凭证生成',
      eventDate: '2025-01-31', operator: '张财务', approver: '李总', status: '已执行',
      note: '本月摊销 1.50 万，凭证号 FZ202501001',
      attachments: [], fromVal: '60', toVal: '61.5', amount: 1.5 },
    { id: 'L0003', assetId: 'A001', stage: '变更', eventType: '价值重估',
      eventDate: '2026-06-15', operator: '王评估', approver: '', status: '待审批',
      note: '专家重新估值 756 万，较原账面净值 120 万大幅增值，申请调整估值',
      attachments: [{ name: '评估报告.pdf' }], fromVal: '120', toVal: '756', amount: 0 },
    { id: 'L0004', assetId: 'A002', stage: '取得入库', eventType: '自主研发',
      eventDate: '2024-12-20', operator: '陈研发', approver: '李总', status: '已执行',
      note: '边缘计算网关软件 V2.0 研发完成，开发支出资本化 90 万入账',
      attachments: [{ name: '研发立项书.docx' }, { name: '资本化决议.pdf' }],
      fromVal: '', toVal: '90', amount: 90 },
    { id: 'L0005', assetId: 'A002', stage: '变更', eventType: '名称变更',
      eventDate: '2026-09-05', operator: '陈研发', approver: '', status: '待审批',
      note: '产品升级，申请将"边缘计算网关软件 V2.0"更名为"边缘计算网关软件 V2.5"',
      attachments: [], fromVal: '边缘计算网关软件 V2.0', toVal: '边缘计算网关软件 V2.5', amount: 0 },
    { id: 'L0006', assetId: 'A003', stage: '取得入库', eventType: '自主研发',
      eventDate: '2023-02-08', operator: '陈研发', approver: '李总', status: '已执行',
      note: '传感器数据处理方法研发支出资本化 120 万',
      attachments: [{ name: '研发支出明细.xlsx' }], fromVal: '', toVal: '120', amount: 120 },
    { id: 'L0007', assetId: 'A003', stage: '处置', eventType: '出售',
      eventDate: '2026-09-08', operator: '王财务', approver: '', status: '待审批',
      note: '专利技术对外出售，对价 200 万，待法务/财务审批后办理权属变更',
      attachments: [{ name: '转让意向书.pdf' }], fromVal: '90', toVal: '200', amount: 200 },
    { id: 'L0008', assetId: 'A004', stage: '取得入库', eventType: '投资入股',
      eventDate: '2022-05-06', operator: '王财务', approver: '李总', status: '已执行',
      note: '股东以"研知π"商标作价 5 万入股',
      attachments: [{ name: '验资报告.pdf' }], fromVal: '', toVal: '5', amount: 5 },
    { id: 'L0009', assetId: 'A004', stage: '变更', eventType: '状态变更',
      eventDate: '2026-09-10', operator: '王品牌', approver: '', status: '待审批',
      note: '商标近一年未投入主营使用，申请封存以暂停摊销与年费计提',
      attachments: [], fromVal: '启用', toVal: '封存', amount: 0 },
    { id: 'L0010', assetId: 'A006', stage: '取得入库', eventType: '自主研发',
      eventDate: '2026-08-25', operator: '陈研发', approver: '', status: '待审批',
      note: 'AI 故障预测算法研发投入 95 万，拿证后办理研发支出资本化与取得入库',
      attachments: [{ name: '研发工时表.xlsx' }, { name: '直接投入明细.pdf' }],
      fromVal: '', toVal: '95', amount: 95, fromGrant: true },
    { id: 'L0011', assetId: 'A002', stage: '摊销', eventType: '凭证生成',
      eventDate: '2026-08-31', operator: '张财务', approver: '李总', status: '已执行',
      note: '本月摊销 0.50 万，凭证号 FZ202608001',
      attachments: [], fromVal: '17.5', toVal: '18', amount: 0.5 },
    { id: 'L0012', assetId: 'A005', stage: '处置', eventType: '报废',
      eventDate: '2026-09-02', operator: '王财务', approver: '李总', status: '已通过',
      note: '设备固定支架专利已被新一代结构替代，申请报废核销',
      attachments: [{ name: '技术评估.pdf' }], fromVal: '12', toVal: '0', amount: 0 }
];

function loadLifecycleEvents() {
    try {
        var raw = localStorage.getItem(ASSET_LIFECYCLE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_LIFECYCLE_EVENTS.map(function (e) { return JSON.parse(JSON.stringify(e)); });
}
function persistLifecycleEvents() {
    try { localStorage.setItem(ASSET_LIFECYCLE_KEY, JSON.stringify(ASSET_LIFECYCLE_EVENTS)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('lifecycle-changed')); } catch (e) {}
}
var ASSET_LIFECYCLE_EVENTS = loadLifecycleEvents();

/* ============ 盘点任务模型 ============ */
var INVENTORY_KEY = 'yz_inventory_tasks';
// 盘点结果：未盘点 / 已盘点(正常|异常)
function loadInventoryTasks() {
    try {
        var raw = localStorage.getItem(INVENTORY_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
}
function persistInventoryTasks() {
    try { localStorage.setItem(INVENTORY_KEY, JSON.stringify(INVENTORY_TASKS)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('inventory-changed')); } catch (e) {}
}
var INVENTORY_TASKS = loadInventoryTasks();

function nextInventoryId() {
    var max = 0;
    INVENTORY_TASKS.forEach(function (t) {
        var n = parseInt(String(t.id).replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return 'T' + String(max + 1).padStart(3, '0');
}

// 创建盘点任务：按范围筛选有效中资产生成明细
function createInventoryTask(opts) {
    var items = ASSETS.filter(function (a) {
        if (a.status !== '有效中') return false;
        if (opts.types && opts.types.length && opts.types.indexOf(a.type) < 0) return false;
        return true;
    }).map(function (a) {
        return {
            assetId: a.id, name: a.name, type: a.type, certNo: a.certNo,
            status: '未盘点', result: '', note: '', inventoryDate: ''
        };
    });
    var task = {
        id: nextInventoryId(),
        name: opts.name,
        periodType: opts.periodType || '年度盘点',
        startDate: opts.startDate || '',
        createdAt: opts.createdAt || new Date().toISOString().slice(0, 10),
        owner: opts.owner || '财务部',
        deadline: opts.deadline || '',
        scopeTypes: opts.types || [],
        status: items.length ? '进行中' : '已完成',
        items: items
    };
    INVENTORY_TASKS.unshift(task);
    persistInventoryTasks();
    return task;
}

// 盘点单项资产
function inventoryAsset(taskId, assetId, result, note) {
    var task = INVENTORY_TASKS.find(function (t) { return t.id === taskId; });
    if (!task) return null;
    var item = task.items.find(function (i) { return i.assetId === assetId; });
    if (!item) return null;
    item.status = '已盘点';
    item.result = result || '正常';
    item.note = note || '';
    item.inventoryDate = new Date().toISOString().slice(0, 10);
    if (task.items.every(function (i) { return i.status === '已盘点'; })) task.status = '已完成';
    persistInventoryTasks();
    return task;
}

// 指定任务口径的盘点统计：所有数字仅统计该任务明细，避免跨任务/跨期间混淆
function getInventoryStats(taskId) {
    var task = INVENTORY_TASKS.find(function (t) { return t.id === taskId; }) || INVENTORY_TASKS[0];
    var should = task ? task.items.length : 0;
    var inventoried = 0, normal = 0, abnormal = 0;
    if (task) {
        task.items.forEach(function (i) {
            if (i.status === '已盘点') {
                inventoried++;
                if (i.result === '正常') normal++;
                else if (i.result === '异常') abnormal++;
            }
        });
    }
    return { task: task, should: should, inventoried: inventoried, normal: normal, abnormal: abnormal };
}

// 某盘点任务中盘出"异常"的明细（口径与统计卡一致，仅本任务）
function getTaskAbnormalItems(taskId) {
    var task = INVENTORY_TASKS.find(function (t) { return t.id === taskId; }) || INVENTORY_TASKS[0];
    if (!task) return [];
    return task.items.filter(function (i) { return i.status === '已盘点' && i.result === '异常'; });
}

/* ============ 价值/费用台账 ============ */
// 取在账（有效中）资产 —— 台账只含已入库资产
function getBookAssets() {
    return ASSETS.filter(function (a) { return a.status === '有效中'; });
}
// 估值日期来源：时间线中的"评估增值"节点；无则为空（初始录入值）
function getValuationDate(a) {
    if (Array.isArray(a.timeline)) {
        for (var i = a.timeline.length - 1; i >= 0; i--) {
            if (a.timeline[i] && a.timeline[i].title === '评估增值') return a.timeline[i].date;
        }
    }
    return '';
}
// 登记一条新估值（价值台账"录入新价值记录"的数据源）：更新估值/溢价率，并在时间线留痕
function recordValuation(assetId, value, date, note) {
    var a = getAssetById(assetId);
    if (!a) return null;
    a.valuation = Number(value) || 0;
    var base = Number(a.cost) || 0;
    a.premium = base > 0 ? Math.round((a.valuation - base) / base * 100) : 0;
    if (!Array.isArray(a.timeline)) a.timeline = [];
    a.timeline.push({
        date: (date || '').slice(0, 7),
        icon: 'fa-line-chart', color: 'bg-amber-500', title: '评估增值',
        desc: note || ('专家重新估值 ' + a.valuation + ' 万，较成本溢价 ' + a.premium + '%')
    });
    persistAssets();
    return a;
}
// 价值台账汇总（全部数字来自在账资产字段，可逐项追溯）
function getValueLedgerSummary() {
    var list = getBookAssets();
    var sumCost = 0, sumAmortized = 0, sumNet = 0, sumVal = 0;
    list.forEach(function (a) {
        sumCost += Number(a.cost) || 0;
        sumAmortized += Number(a.amortized) || 0;
        sumNet += Number(a.netValue) || 0;
        sumVal += Number(a.valuation) || 0;
    });
    var premium = sumCost > 0 ? Math.round((sumVal - sumCost) / sumCost * 100) : 0;
    return { count: list.length, cost: sumCost, amortized: sumAmortized, netValue: sumNet, valuation: sumVal, premium: premium };
}
// 按资产类型聚合 成本/估值（价值构成对比图数据源）
function getValueByType() {
    var map = {};
    getBookAssets().forEach(function (a) {
        if (!map[a.type]) map[a.type] = { type: a.type, cost: 0, valuation: 0 };
        map[a.type].cost += Number(a.cost) || 0;
        map[a.type].valuation += Number(a.valuation) || 0;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
}
// 费用台账汇总（来源：各资产权利维持费记录 feeRenewal，凭证号可追溯）
function getExpenseLedgerSummary() {
    var list = getBookAssets();
    var paid = 0, unpaid = 0, paidCnt = 0, unpaidCnt = 0, noAmtCnt = 0;
    var byType = {};
    var rows = [];
    list.forEach(function (a) {
        var f = a.feeRenewal || {};
        if (!f.type) return;
        var isPaid = !!f.paidDate;
        var hasAmount = f.amountSet === true;
        var amt = hasAmount ? Number(f.amount) : 0;
        if (isPaid) { paid += amt; paidCnt++; } else { unpaid += amt; unpaidCnt++; }
        if (!hasAmount) noAmtCnt++;
        byType[f.type] = (byType[f.type] || 0) + amt;
        rows.push({
            assetId: a.id, assetName: a.name, certNo: a.certNo,
            feeType: f.type, amount: amt, hasAmount: hasAmount, dueDate: f.dueDate || '',
            paidDate: f.paidDate || '', voucherNo: f.voucherNo || '',
            remainDays: f.remainDays != null ? f.remainDays : a.feeRemainDays
        });
    });
    return { total: paid + unpaid, paid: paid, unpaid: unpaid, paidCnt: paidCnt, unpaidCnt: unpaidCnt, noAmtCnt: noAmtCnt, byType: byType, rows: rows };
}

function nextLifecycleId() {
    var max = 0;
    ASSET_LIFECYCLE_EVENTS.forEach(function (e) {
        var n = parseInt(String(e.id).replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return 'L' + String(max + 1).padStart(4, '0');
}

// 查询生命周期事件：传 assetId 则只取该资产，否则返回全部；按日期倒序
function getLifecycleEvents(assetId) {
    var list = ASSET_LIFECYCLE_EVENTS;
    if (assetId) list = list.filter(function (e) { return e.assetId === assetId; });
    return list.slice().sort(function (a, b) {
        return (b.eventDate || '').localeCompare(a.eventDate || '');
    });
}

// 新增生命周期事件（自动补 id / status / attachments / 日期）
function addLifecycleEvent(payload) {
    var ev = Object.assign({}, payload);
    ev.id = nextLifecycleId();
    if (!ev.stage) ev.stage = '变更';
    if (!ev.eventDate) ev.eventDate = new Date().toISOString().slice(0, 10);
    if (!ev.status) ev.status = '待审批';
    if (!Array.isArray(ev.attachments)) ev.attachments = [];
    if (ev.fromVal === undefined) ev.fromVal = '';
    if (ev.toVal === undefined) ev.toVal = '';
    if (ev.amount === undefined || ev.amount === '') ev.amount = 0;
    ev.amount = Number(ev.amount) || 0;
    ASSET_LIFECYCLE_EVENTS.unshift(ev);
    persistLifecycleEvents();
    return ev;
}

// 审批生命周期事件：pass=true 通过，false 驳回；通过且 stage='处置' 时同步资产状态
function approveLifecycleEvent(id, approver, pass, note) {
    for (var i = 0; i < ASSET_LIFECYCLE_EVENTS.length; i++) {
        var ev = ASSET_LIFECYCLE_EVENTS[i];
        if (ev.id !== id) continue;
        ev.approver = approver || ev.approver;
        ev.status = pass ? '已通过' : '已驳回';
        if (note) ev.note = (ev.note ? ev.note + ' | 审批意见：' : '审批意见：') + note;
        // 通过 → 自动执行：更新资产字段
        if (pass) {
            applyLifecycleEventToAsset(ev);
            ev.status = '已执行';
        }
        persistLifecycleEvents();
        // 同步持久化资产
        if (pass) { persistAssets(); }
        return ev;
    }
    return null;
}

// 把已通过的事件落到资产字段（仅供 approveLifecycleEvent 内部调用）
function applyLifecycleEventToAsset(ev) {
    var a = getAssetById(ev.assetId);
    if (ev.stage === '取得入库') {
        // 入库审批通过：资产不存在则建档（pendingAsset 携带名称/类型），存在则累加原值
        if (!a && ev.pendingAsset) {
            var pa = ev.pendingAsset;
            var created = addAsset({
                name: pa.name, type: pa.type, certNo: '—（待补）', status: '有效中',
                active: true, tags: [],
                cost: Number(ev.amount) || 0, amortized: 0, netValue: Number(ev.amount) || 0,
                valuation: 0, premium: 0, taxSaving: 0, roi: 0, incomeType: '尚未变现', supportPolicy: [],
                grantDate: ev.eventDate, expireDate: '', lifeYears: 0, lifeUsedPct: 0,
                feeRemainDays: null, feeStatus: 'ok',
                acquireMethod: ev.eventType, ownerShip: '本公司'
            });
            ev.assetId = created.id;   // 回填真实资产编号
            a = created;
        }
        if (a) {
            // 拿证自动生成的入库事件：金额就是已挂账的研发投入，不重复累加
            if (ev.amount && !ev.fromGrant) {
                a.cost = Number(a.cost || 0) + Number(ev.amount);
                a.netValue = Number(a.netValue || 0) + Number(ev.amount);
            }
            a.active = true;
            if (!a.acquireMethod) a.acquireMethod = ev.eventType;
            // 待入库资产经审批后正式进入资产档案
            if (a.status === '待入库') {
                a.status = '有效中';
                if (!a.grantDate) a.grantDate = ev.eventDate;
                a.tags = (a.tags || []).filter(function (t) { return t !== '在途申请'; });
            }
            deriveAssetFields(a);
        }
        return;
    }
    if (!a) return;
    if (ev.stage === '变更') {
        if (ev.eventType === '名称变更') {
            a.name = ev.toVal || a.name;
        } else if (ev.eventType === '权属转移') {
            a.ownerShip = ev.toVal || a.ownerShip;
        } else if (ev.eventType === '价值重估') {
            var newVal = Number(ev.toVal);
            if (!isNaN(newVal) && newVal > 0) {
                a.valuation = newVal;
            }
        } else if (ev.eventType === '状态变更') {
            if (ev.toVal === '启用') { a.active = true; a.tags = a.tags.filter(function(t){return t!=='沉睡资产';}); }
            else if (ev.toVal === '停用') { a.active = false; }
            else if (ev.toVal === '封存') { a.active = false; if (a.tags.indexOf('沉睡资产')<0) a.tags.push('沉睡资产'); }
            if (a.useState !== undefined) a.useState = ev.toVal;
        }
        deriveAssetFields(a);
    } else if (ev.stage === '处置') {
        if (typeof disposeAsset === 'function') {
            // 复用现有处置逻辑（避免重复造轮子；如果已存在 disposal 不再覆盖）
            if (!a.disposal) {
                disposeAsset(a.id, {
                    type: ev.eventType,
                    date: ev.eventDate,
                    reason: ev.note || '生命周期事件审批通过',
                    operator: ev.operator,
                    proceeds: Number(ev.amount) || 0,
                    approvedBy: ev.approver || ''
                });
            }
        }
    } else if (ev.stage === '摊销') {
        // 摊销凭证：累加已摊销额
        if (ev.amount) {
            a.amortized = Number(a.amortized || 0) + Number(ev.amount);
            deriveAssetFields(a);
        }
    }
}

// 取得入库在途列表：stage='取得入库' 且 status != '已执行'
function getAcquirePendingList() {
    return ASSET_LIFECYCLE_EVENTS.filter(function (e) {
        return e.stage === '取得入库' && e.status !== '已执行';
    }).sort(function (a, b) {
        return (b.eventDate || '').localeCompare(a.eventDate || '');
    });
}

// 摊销计划：按策略（直线法/产量法）计算月摊销额
// method: '直线法' = netValue / 剩余月份 ；'产量法' = netValue × 当月产量 / 预估总产量
// years: 用于估算剩余月份（缺省取 TYPE_DEFAULT_LIFE）
function getAmortPlan(assetId, method, years) {
    var a = getAssetById(assetId);
    if (!a) return null;
    var lifeMonths = Number(years) > 0 ? Number(years) * 12 : (a.usefulLifeMonths || defaultLifeMonthsByType(a.type));
    // 已摊销月份
    var used = monthsBetween(a.grantDate, new Date().toISOString().slice(0, 7));
    var remain = Math.max(0, lifeMonths - used);
    var monthly = 0, totalMonths = lifeMonths, desc = '';
    if (method === '产量法') {
        // 产量法：以累计产量（这里用 amortized 反推）估算分摊
        var totalOutput = Math.max(1, Number(a.valuation) || Number(a.cost) || 1);
        var curOutput = Math.max(1, Number(a.cost) / totalOutput * 100);
        monthly = Number(((a.netValue || 0) * curOutput / totalOutput).toFixed(2));
        desc = '按预估总产量分摊：账面净值 ' + (a.netValue || 0) + ' 万 × 当期产量占比 ' + curOutput.toFixed(1) + '% / 总产量基准 ' + totalOutput.toFixed(0);
    } else {
        // 直线法
        monthly = remain > 0 ? Number(((a.netValue || 0) / remain).toFixed(2)) : 0;
        desc = '账面净值 ' + (a.netValue || 0) + ' 万 / 剩余 ' + remain + ' 月（已摊 ' + used + ' 月 / 共 ' + lifeMonths + ' 月）';
    }
    return {
        assetId: assetId,
        assetName: a.name,
        method: method,
        cost: a.cost || 0,
        netValue: a.netValue || 0,
        amortized: a.amortized || 0,
        lifeMonths: lifeMonths,
        usedMonths: used,
        remainMonths: remain,
        monthly: monthly,
        yearly: Number((monthly * 12).toFixed(2)),
        desc: desc
    };
}

// 生成财务凭证号：FZ + 年月 + 3 位序号
function genAmortVoucherNo() {
    var d = new Date();
    var ym = '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
    var prefix = 'FZ' + ym;
    var max = 0;
    ASSET_LIFECYCLE_EVENTS.forEach(function (e) {
        if (e.eventType === '凭证生成' && e.note && e.note.indexOf(prefix) >= 0) {
            var m = e.note.match(new RegExp(prefix + '(\\d{3})'));
            if (m) {
                var n = parseInt(m[1], 10);
                if (!isNaN(n) && n > max) max = n;
            }
        }
    });
    return prefix + String(max + 1).padStart(3, '0');
}
