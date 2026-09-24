/**
 * data-bridge.js — 数据桥接层
 * 后台运营平台配置 → localStorage → 前端政策计算器
 * 前端测算方案 → localStorage → 后台测算方案管理
 */
(function (global) {
    'use strict';

    // ========== localStorage Key 命名规范 ==========
    const KEYS = {
        POLICY_MODEL:    'ceyuan_policy_revenue_model',    // 政策收益模型（对应前端 POLICY_DB）
        POLICY_LIBRARY:  'ceyuan_policy_library',           // 政策库（政策基本信息，供其他模块读取）
        COST_CONFIG:     'ceyuan_cost_config',              // 申报成本参数
        CASHFLOW_CONFIG: 'ceyuan_cashflow_config',          // 资金到账周期配置
        QUAL_RULES:     'ceyuan_qualification_rules',      // 资质判定规则
        CALC_SCHEMES:   'ceyuan_calc_schemes',              // 测算方案存档
        DECLARATION_PROJECTS: 'ceyuan_declaration_projects', // 申报管家项目配置
        DIAGNOSIS_CONFIG: 'ceyuan_diagnosis_config',         // 科创能力诊断配置
        CUSTOMERS:      'ceyuan_customers',                  // 客户管理数据
        SALES_REPORTS:  'ceyuan_sales_reports',              // 智能报告存档
        SERVICE_PRODUCTS: 'ceyuan_service_products',         // 服务商城商品（后台维护→前台展示）
        SERVICE_ORDERS:  'ceyuan_service_orders',            // 服务商城订单（企业下单支付→订单页/运营接单）
        CLUES:          'ceyuan_clues'                         // 销售线索（企业端问答/雷达/雷达行为自动回流）
    };

    // ========== 默认政策收益模型（与前端硬编码 POLICY_DB 一致，作为 fallback） ==========
    const DEFAULT_POLICY_DB = [
        { id:'R&D_JJ',    name:'研发费用加计扣除', type:'税收减免', cat:'tax',     amount:84.5, months:[9,12], mutex:null,       badgeColor:'emerald', desc:'研发投入×100%×25%税率', compatible:['GAOXIN','LIXIANG_ZJ','JSSC'], cost:{hrDays:15, hrRate:800, serviceFee:20000, otherFee:3000} },
        { id:'GAOXIN',    name:'高新技术企业（税率差额）', type:'税收减免', cat:'tax',     amount:42.3, months:[6,10], mutex:null,       badgeColor:'emerald', desc:'利润×(25%-15%)高企优惠税率', compatible:['R&D_JJ','ZHUANJIN'], cost:{hrDays:60, hrRate:800, serviceFee:80000, otherFee:15000} },
        { id:'LIXIANG_ZJ',name:'研发项目立项补贴',       type:'项目补贴', cat:'subsidy', amount:50.0, months:[3,5],  mutex:null,       badgeColor:'blue',    desc:'项目总投资×20%定额补贴',  compatible:['R&D_JJ','ZHUANJIN','CGZH'], cost:{hrDays:20, hrRate:800, serviceFee:30000, otherFee:5000} },
        { id:'CGZH',      name:'科技成果转化补贴',       type:'项目补贴', cat:'subsidy', amount:25.0, months:[4,7],  mutex:null,       badgeColor:'blue',    desc:'技术合同成交额×5%补贴',  compatible:['LIXIANG_ZJ','ZHUANJIN'], cost:{hrDays:10, hrRate:800, serviceFee:10000, otherFee:2000} },
        { id:'ZHUANJIN',  name:'专精特新企业奖励',       type:'资质奖励', cat:'reward',  amount:10.0, months:[2,3],  mutex:'REWARD_A', badgeColor:'indigo',  desc:'省级专精特新一次性奖励', compatible:['GAOXIN','LIXIANG_ZJ','DENGLING'], cost:{hrDays:12, hrRate:800, serviceFee:15000, otherFee:2500} },
        { id:'DENGLING',  name:'瞪羚企业认定奖励',       type:'资质奖励', cat:'reward',  amount:8.0,  months:[2,4],  mutex:'REWARD_A', badgeColor:'indigo',  desc:'瞪羚认定一次性奖励（与专精特新互斥）', compatible:['LIXIANG_ZJ','ZHUANJIN'], cost:{hrDays:10, hrRate:800, serviceFee:12000, otherFee:2000} },
    ];

    // ========== 默认成本参数 ==========
    const DEFAULT_COST_CONFIG = {
        hrDays: 28,        // 申报人力（人·日）
        hrRate: 800,       // 人力单价（元/日）
        serviceFee: 50000, // 第三方服务费（元）
        otherFee: 8000     // 其他/杂项（元）
    };

    // ========== 默认到账周期配置 ==========
    const DEFAULT_CASHFLOW_CONFIG = {
        // 加急系数：标准0月、加急-1月、VIP-2月
        speedCoefficients: { normal: 0, fast: 1, vip: 2 }
    };

    // ========== 默认资质判定规则 ==========
    const DEFAULT_QUAL_RULES = [
        { id:'GAOXIN',  name:'高新技术企业',  score:92, pass:75, warn:'', linkedPolicy:'GAOXIN' },
        { id:'ZHUANJIN',name:'专精特新企业',  score:85, pass:70, warn:'', linkedPolicy:'ZHUANJIN' },
        { id:'KJX',     name:'科技型中小企业',score:88, pass:60, warn:'', linkedPolicy:'' },
        { id:'DENGLING',name:'瞪羚企业',      score:80, pass:70, warn:'', linkedPolicy:'DENGLING' },
        { id:'DJS',     name:'独角兽企业',    score:50, pass:100, warn:'估值 5亿 / 需10亿+', linkedPolicy:'' },
    ];

    // ========== 内部工具：安全读写 localStorage ==========
    function _read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('[data-bridge] 读取失败:', key, e.message);
            return fallback;
        }
    }
    function _write(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('[data-bridge] 写入失败:', key, e.message);
            return false;
        }
    }

    // ========== 读取函数（前端计算器使用） ==========

    /** 读取政策收益模型（对应前端 POLICY_DB） */
    function loadPolicyDB() {
        const data = _read(KEYS.POLICY_MODEL, null);
        if (!data || !Array.isArray(data) || data.length === 0) return DEFAULT_POLICY_DB;
        // 确保每项都有必要字段
        return data.filter(p => p && p.id && p.name).map(p => {
            const d = DEFAULT_POLICY_DB.find(d => d.id === p.id);
            return {
                id: p.id,
                name: p.name,
                type: p.type || '项目补贴',
                cat: p.cat || 'subsidy',
                amount: Number(p.amount) || 0,
                months: Array.isArray(p.months) && p.months.length === 2 ? p.months : [6, 9],
                mutex: p.mutex || null,
                badgeColor: p.badgeColor || 'blue',
                desc: p.desc || '',
                compatible: Array.isArray(p.compatible) ? p.compatible : [],
                cost: p.cost || (d ? d.cost : null)
            };
        });
    }

    // ========== 政策库（政策基本信息，供收益模型等模块读取） ==========
    // 重要业务概念：
    //   effective/expire = 政策本身的有效期（文件效力期间，expire 为空表示长期有效/现行有效）
    //   batches          = 该政策对应项目的「申报批次」窗口，一年可能多批（如高企一年3批、专精特新一年1批），
    //                      每批 { name批次名称, start申报开始, end申报截止 }；雷达申报日历读取 batches
    const DEFAULT_POLICY_LIBRARY = [
        { id:'GAOXIN',    name:'高新技术企业认定管理办法', dept:'科技部', level:'国家级', industry:'信息技术',
          effective:'2016-01-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:5},{type:'ipOwned',op:'==',val:true},{type:'hiTechRatio',op:'>=',val:60}],
          batches:[
            { name:'2026年第一批', start:'2026-03-01', end:'2026-04-20' },
            { name:'2026年第二批', start:'2026-06-01', end:'2026-07-20' },
            { name:'2026年第三批', start:'2026-08-15', end:'2026-09-30' }
          ] },
        { id:'R&D_JJ',    name:'研发费用加计扣除', dept:'财政部 税务总局', level:'国家级', industry:'信息技术',
          effective:'2023-01-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:100}],
          batches:[
            { name:'2025年度汇算清缴', start:'2026-01-01', end:'2026-05-31' },
            { name:'2026年10月预缴申报', start:'2026-10-01', end:'2026-10-20' }
          ] },
        { id:'LIXIANG_ZJ',name:'研发项目立项补贴', dept:'地方科技局', level:'省级', industry:'信息技术',
          effective:'2020-01-01', expire:'2025-12-31',
          conditions:[{type:'projectInvest',op:'>=',val:200}],
          batches:[] },
        { id:'CGZH',      name:'科技成果转化补贴', dept:'地方科技局', level:'省级', industry:'信息技术',
          effective:'2021-01-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:50}],
          batches:[
            { name:'2026年度', start:'2026-10-08', end:'2026-11-20' }
          ] },
        { id:'ZHUANJIN',  name:'专精特新企业奖励', dept:'工信部', level:'国家级', industry:'高端装备',
          effective:'2022-01-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:3},{type:'ipOwned',op:'==',val:true}],
          batches:[
            { name:'2026年度', start:'2026-04-10', end:'2026-05-31' }
          ] },
        { id:'DENGLING',  name:'瞪羚企业认定奖励', dept:'地方科技局', level:'省级', industry:'信息技术',
          effective:'2021-06-01', expire:'',
          conditions:[{type:'revenue',op:'>=',val:1000},{type:'rdRatio',op:'>=',val:3}],
          batches:[
            { name:'2026年度', start:'2026-05-06', end:'2026-06-30' }
          ] }
    ];

    /** 规整单条政策（含申报批次） */
    function _normalizePolicy(p) {
        return {
            id: p.id,
            name: p.name,
            dept: p.dept || '',
            level: p.level || '国家级',
            industry: p.industry || '',
            effective: p.effective || '',
            expire: p.expire || '',
            conditions: Array.isArray(p.conditions) ? p.conditions : [],
            batches: Array.isArray(p.batches)
                ? p.batches.filter(function(b){ return b && b.end; })
                    .map(function(b){ return { name: b.name || '申报批次', start: b.start || '', end: b.end || '' }; })
                : []
        };
    }

    /** 读取政策库（旧数据无 batches 时，按政策 id 合并默认批次做一次迁移） */
    function loadPolicyLibrary() {
        const data = _read(KEYS.POLICY_LIBRARY, null);
        const isEmpty = (!data || !Array.isArray(data) || data.length === 0);
        const src = isEmpty ? DEFAULT_POLICY_LIBRARY : data.filter(p => p && p.id && p.name);
        // 旧版本数据：全部政策都没有 batches 字段时，用默认种子的批次按 id 补齐（不影响用户自建政策）
        const needBatchMerge = !isEmpty && src.every(function(p){ return !Array.isArray(p.batches); });
        const defaultBatchMap = {};
        if (needBatchMerge) {
            DEFAULT_POLICY_LIBRARY.forEach(function(p){ defaultBatchMap[p.id] = p.batches; });
        }
        return src.map(function(p) {
            var np = _normalizePolicy(p);
            if (needBatchMerge && defaultBatchMap[p.id] && np.batches.length === 0) {
                np.batches = defaultBatchMap[p.id].map(function(b){ return { name:b.name, start:b.start, end:b.end }; });
            }
            return np;
        });
    }

    /** 保存政策库 */
    function savePolicyLibrary(list) {
        if (!Array.isArray(list)) return false;
        const cleaned = list.filter(p => p && p.id && p.name).map(_normalizePolicy);
        return _write(KEYS.POLICY_LIBRARY, cleaned);
    }

    /** 申报批次状态：'open'申报中 | 'upcoming'未开始 | 'closed'已截止（today 由参数传入，默认今天） */
    function batchStatus(batch, today) {
        if (!batch || !batch.end) return 'closed';
        var t = today ? new Date(today) : new Date();
        t.setHours(0, 0, 0, 0);
        function d(s) { var a = String(s).split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
        var end = d(batch.end);
        if (t.getTime() > end.getTime()) return 'closed';
        if (batch.start) {
            var start = d(batch.start);
            if (t.getTime() < start.getTime()) return 'upcoming';
        }
        return 'open';
    }

    // ========== 政策雷达：企业条件实时匹配引擎 ==========
    // 企业画像 enterprise = { industry:'信息技术', rdRatio:6, hiTechCert:'是', revenue:2000, region:'浙江杭州', ... }
    // 每条政策的 conditions 为阈值条件（如 rdRatio >= 5），引擎判断企业实际值是否满足
    function _normMatchOp(op) {
        return ({ '>=':'≥', '<=':'≤', '==':'=', '=':'=' })[op] || op;
    }
    function _normMatchVal(v) {
        if (v === true || v === 'true') return '是';
        if (v === false || v === 'false') return '否';
        return v;
    }

    /** 判断单个条件：返回 'hit' 满足 | 'fail' 不满足 | 'unknown' 企业未提供该指标 */
    function evaluatePolicyCondition(cond, entVal) {
        if (entVal === undefined || entVal === null || String(entVal).trim() === '') return 'unknown';
        var op = _normMatchOp(cond.op);
        var pv = _normMatchVal(cond.val);
        var ev = _normMatchVal(entVal);

        // 布尔/资质型：操作符本身即"是/否"
        if (op === '是') return String(ev) === '是' ? 'hit' : 'fail';
        if (op === '否') return String(ev) === '否' ? 'hit' : 'fail';

        // 数值型比较
        var numEnt = parseFloat(ev), numP = parseFloat(pv);
        if (!isNaN(numEnt) && !isNaN(numP)) {
            if (op === '≥') return numEnt >= numP ? 'hit' : 'fail';
            if (op === '≤') return numEnt <= numP ? 'hit' : 'fail';
            if (op === '=') return numEnt === numP ? 'hit' : 'fail';
        }

        // 文本型
        var sEnt = String(ev), sP = String(pv);
        if (op === '包含') return (sEnt.indexOf(sP) >= 0 || sP.indexOf(sEnt) >= 0) ? 'hit' : 'fail';
        // 等值（行业、规模、布尔资质等枚举）
        return sEnt === sP ? 'hit' : 'fail';
    }

    /**
     * 用企业画像匹配政策库
     * @returns [{ policy, total, hit, fail, unknown, score, details:[{label,op,val,unit,status}] }]
     * score = 命中条件数 / 政策条件总数 * 100；仅返回至少命中 1 条的政策，按分数降序
     */
    function matchPoliciesForEnterprise(enterprise) {
        enterprise = enterprise || {};
        var results = [];
        loadPolicyLibrary().forEach(function(p) {
            var conds = p.conditions || [];
            if (conds.length === 0) return;

            var hit = 0, fail = 0, unknown = 0;
            var details = conds.map(function(c) {
                var status = evaluatePolicyCondition(c, enterprise[c.type]);
                if (status === 'hit') hit++;
                else if (status === 'fail') fail++;
                else unknown++;
                return { type: c.type, op: _normMatchOp(c.op), val: _normMatchVal(c.val), status: status };
            });

            if (hit === 0) return; // 一条都不满足，不推荐
            results.push({
                policy: p,
                total: conds.length,
                hit: hit, fail: fail, unknown: unknown,
                score: Math.round(hit / conds.length * 100),
                details: details
            });
        });
        results.sort(function(a, b) { return b.score - a.score; });
        return results;
    }

    // ========== 服务商城商品（后台「服务商品管理」维护，前台商城展示） ==========
    // status: 'on' 已上架 | 'off' 已下架 | 'draft' 草稿；featured: 是否首页推荐位
    const DEFAULT_SERVICE_PRODUCTS = [
        { id:'SVC001', name:'高新技术企业认定全程辅导', category:'政策咨询', provider:'北京中科创服咨询有限公司', price:18800, oldPrice:25000, rating:4.9, sales:1280, icon:'fa-trophy', status:'on', featured:true,
          desc:'资深专家团队全程辅导，覆盖诊断、规划、材料撰写到答辩全流程，助力企业顺利通过高新技术企业认定。',
          tags:['限时特惠','金牌服务'],
          includes:['企业资质诊断与评估','知识产权规划布局','研发费用辅助账搭建','申报材料撰写与审核','专家预审与答辩辅导','后续维护与跟踪服务'],
          process:[{t:'需求沟通',d:'了解企业情况'},{t:'方案制定',d:'定制申报方案'},{t:'材料准备',d:'撰写审核材料'},{t:'提交申报',d:'专家预审答辩'},{t:'跟踪维护',d:'后续政策服务'}],
          cases:[{company:'某智能制造有限公司',year:'2023年成功认定 · 国家级',result:'通过本服务完成高新技术企业认定，获得税收减免优惠累计320万元，并成功获得政府补贴资金80万元。'},{company:'某生物医药科技公司',year:'2023年成功认定 · 国家级',result:'知识产权布局由3项提升至15项，研发费用归集规范化，顺利通过评审。'}] },
        { id:'SVC002', name:'专精特新企业申报一站式服务', category:'申报代理', provider:'华策企业咨询服务有限公司', price:32000, oldPrice:45000, rating:4.8, sales:860, icon:'fa-star-o', status:'on', featured:true,
          desc:'梯度培育规划+全案撰写+答辩辅导，三年跟踪维护，助力企业迈入专精特新行列。',
          tags:['金牌服务','品质保证'],
          includes:['专精特新资质评估','梯度培育规划','申报材料全案撰写','专家内审与答辩','政策解读与培训','三年跟踪维护'],
          process:[{t:'资质评估',d:'对标评价体系'},{t:'梯度规划',d:'制定培育路径'},{t:'材料撰写',d:'全案材料编制'},{t:'内审答辩',d:'专家模拟评审'},{t:'跟踪维护',d:'三年持续服务'}],
          cases:[{company:'某精密制造企业',year:'2024年成功认定 · 省级专精特新',result:'补齐研发管理短板，主导产品细分市场占有率进入全省前列，一次性通过认定。'}] },
        { id:'SVC003', name:'发明专利快速预审服务', category:'知识产权', provider:'知产天下知识产权代理', price:8500, oldPrice:12000, rating:4.9, sales:2156, icon:'fa-shield', status:'on', featured:true,
          desc:'对接快速预审通道，3-6个月快速授权，专业代理人全程跟进审查意见答复。',
          tags:['限时特惠'],
          includes:['专利技术挖掘与检索','专利申请文件撰写','快速预审通道申请','审查意见答复','3-6个月快速授权','授权后年费管理'],
          process:[{t:'技术挖掘',d:'检索分析创新点'},{t:'文件撰写',d:'代理人撰写申请'},{t:'快速预审',d:'提交保护中心'},{t:'审查答复',d:'跟进审查意见'},{t:'授权管理',d:'年费监控提醒'}],
          cases:[{company:'某电子信息科技公司',year:'2024年 · 6件发明专利',result:'通过快速预审通道，6件核心专利平均4个月获得授权，有效支撑高企申报。'}] },
        { id:'SVC004', name:'科技型中小企业评价申报', category:'申报代理', provider:'北京科创服务咨询', price:6800, oldPrice:9800, rating:4.8, sales:856, icon:'fa-pencil-square-o', status:'on', featured:false,
          includes:['入库条件自评','材料整理与填报','系统提交与跟踪','评价结果跟进'] },
        { id:'SVC005', name:'软件著作权登记代理', category:'知识产权', provider:'知产天下知识产权代理', price:1200, oldPrice:1800, rating:4.9, sales:2156, icon:'fa-copyright', status:'on', featured:false,
          includes:['源代码与文档整理','软著申请材料撰写','加急/普通通道办理','证书邮寄与归档'] },
        { id:'SVC006', name:'年度财务审计报告', category:'财务审计', provider:'华信会计师事务所', price:5500, oldPrice:7500, rating:4.7, sales:643, icon:'fa-calculator', status:'on', featured:false,
          includes:['账务梳理与调整','现场审计与取证','出具年度审计报告','税务师复核'] },
        { id:'SVC007', name:'技术合同认定登记', category:'技术转移', provider:'科转桥技术转移服务', price:3200, oldPrice:4500, rating:4.6, sales:423, icon:'fa-exchange', status:'on', featured:false,
          includes:['技术合同合规审核','认定登记材料准备','科技部门提交代办','税收减免备案指导'] },
        { id:'SVC008', name:'产品质检报告服务', category:'检验检测', provider:'中检集团检测中心', price:2800, oldPrice:3800, rating:4.8, sales:982, icon:'fa-flask', status:'on', featured:false,
          includes:['检测标准确认','样品送检与测试','CMA/CNAS报告出具','报告加急服务'] },
        { id:'SVC009', name:'研发费用加计扣除咨询', category:'政策咨询', provider:'税智通财税咨询', price:4500, oldPrice:6500, rating:4.9, sales:736, icon:'fa-file-text-o', status:'on', featured:false,
          includes:['研发项目立项辅导','研发费用归集建账','辅助账体系搭建','汇算清缴申报支持'] },
        { id:'SVC010', name:'专精特新企业申报（标准档）', category:'申报代理', provider:'北京科创服务咨询', price:12800, oldPrice:18000, rating:4.8, sales:524, icon:'fa-pencil-square-o', status:'on', featured:false,
          includes:['基础条件评估','申报材料撰写','系统提交跟踪','一次补正服务'] },
        { id:'SVC011', name:'商标注册全程代理', category:'知识产权', provider:'知产天下知识产权代理', price:880, oldPrice:1200, rating:4.7, sales:3256, icon:'fa-copyright', status:'on', featured:false,
          includes:['商标近似查询','申请类别规划','商标申报与受理','驳回/异议应对'] },
        { id:'SVC012', name:'高新技术企业审计', category:'财务审计', provider:'华信会计师事务所', price:8800, oldPrice:12000, rating:4.9, sales:456, icon:'fa-calculator', status:'on', featured:false,
          includes:['研发费用专项审计','高新技术产品收入审计','专项审计报告出具','申报配套财务指导'] },
        { id:'SVC013', name:'知识产权贯标（IPMS）辅导', category:'政策咨询', provider:'华策企业咨询服务有限公司', price:15800, oldPrice:0, rating:0, sales:0, icon:'fa-certificate', status:'draft', featured:false,
          includes:['贯标差距分析','体系文件搭建','内审员培训','认证审核对接'] },
        { id:'SVC014', name:'创新型中小企业评价（旧版）', category:'申报代理', provider:'科转桥技术转移服务', price:3000, oldPrice:4000, rating:4.5, sales:312, icon:'fa-pencil-square-o', status:'off', featured:false,
          includes:['旧版评价申报','已并入专精特新梯度培育'] }
    ];

    /** 读取服务商品（后台维护页与前台商城共用） */
    function loadServiceProducts() {
        const data = _read(KEYS.SERVICE_PRODUCTS, null);
        const raw = (!data || !Array.isArray(data) || data.length === 0)
            ? DEFAULT_SERVICE_PRODUCTS
            : data.filter(p => p && p.id && p.name);
        // 旧版本地数据补齐新增字段（tags/desc/process/cases）：从默认数据同 id 合并
        const defMap = {};
        DEFAULT_SERVICE_PRODUCTS.forEach(p => { defMap[p.id] = p; });
        return raw.map(p => {
            const d = defMap[p.id] || {};
            return {
                id: p.id,
                name: p.name,
                category: p.category || '',
                provider: p.provider || '',
                price: Number(p.price) || 0,
                oldPrice: Number(p.oldPrice) || 0,
                rating: Number(p.rating) || 0,
                sales: Number(p.sales) || 0,
                icon: p.icon || 'fa-file-text-o',
                status: p.status || 'on',
                featured: !!p.featured,
                desc: p.desc != null ? p.desc : (d.desc || ''),
                tags: Array.isArray(p.tags) ? p.tags : (Array.isArray(d.tags) ? d.tags : []),
                includes: Array.isArray(p.includes) ? p.includes : [],
                process: Array.isArray(p.process) ? p.process : (Array.isArray(d.process) ? d.process : []),
                cases: Array.isArray(p.cases) ? p.cases : (Array.isArray(d.cases) ? d.cases : [])
            };
        });
    }

    /** 保存服务商品 */
    function saveServiceProducts(list) {
        if (!Array.isArray(list)) return false;
        const cleaned = list.filter(p => p && p.id && p.name).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category || '',
            provider: p.provider || '',
            price: Number(p.price) || 0,
            oldPrice: Number(p.oldPrice) || 0,
            rating: Number(p.rating) || 0,
            sales: Number(p.sales) || 0,
            icon: p.icon || 'fa-file-text-o',
            status: p.status || 'draft',
            featured: !!p.featured,
            desc: p.desc || '',
            tags: Array.isArray(p.tags) ? p.tags : [],
            includes: Array.isArray(p.includes) ? p.includes : [],
            process: Array.isArray(p.process) ? p.process : [],
            cases: Array.isArray(p.cases) ? p.cases : []
        }));
        return _write(KEYS.SERVICE_PRODUCTS, cleaned);
    }

    // ========== 服务订单（企业在商城下单支付生成；订单页展示，运营侧接单交付） ==========
    // status: 'unpaid' 待付款 | 'serving' 服务中(已付款) | 'done' 已完成待评价 | 'reviewed' 已评价
    const DEFAULT_SERVICE_ORDERS = [
        { id:'FW20260901001', svcId:'SVC001', svcName:'高新技术企业认定全程辅导', provider:'北京中科创服咨询有限公司', icon:'fa-trophy', category:'政策咨询',
          amount:18800, status:'serving', payMethod:'微信支付', createTime:'2026-09-01 14:22', company:'绿能新能源科技有限公司', contact:'陈志远', phone:'139****8899', progress:40, rating:0 },
        { id:'FW20260828002', svcId:'SVC002', svcName:'专精特新企业申报一站式服务', provider:'华策企业咨询服务有限公司', icon:'fa-star-o', category:'申报代理',
          amount:32000, status:'serving', payMethod:'对公转账', createTime:'2026-08-28 10:05', company:'恒泰机械制造有限公司', contact:'王建国', phone:'138****6677', progress:20, rating:0 },
        { id:'FW20260820003', svcId:'SVC005', svcName:'软件著作权登记代理', provider:'知产天下知识产权代理', icon:'fa-copyright', category:'知识产权',
          amount:1200, status:'done', payMethod:'支付宝', createTime:'2026-08-20 16:40', company:'绿能新能源科技有限公司', contact:'陈志远', phone:'139****8899', progress:100, rating:0 },
        { id:'FW20260810004', svcId:'SVC009', svcName:'研发费用加计扣除咨询', provider:'税智通财税咨询', icon:'fa-file-text-o', category:'政策咨询',
          amount:4500, status:'reviewed', payMethod:'微信支付', createTime:'2026-08-10 09:18', company:'恒泰机械制造有限公司', contact:'刘会计', phone:'137****2233', progress:100, rating:5,
          reviewText:'服务响应及时，专家对加计扣除政策解读清晰，材料准备规范，已顺利通过税务局备案，非常满意！', reviewTime:'2026-08-12 10:30', replyText:'感谢您的认可！后续如有政策更新或年度复核需求，随时联系我们，祝贵司发展顺利。', replyTime:'2026-08-12 14:05' },
        { id:'FW20260904005', svcId:'SVC011', svcName:'商标注册全程代理', provider:'知产天下知识产权代理', icon:'fa-copyright', category:'知识产权',
          amount:880, status:'unpaid', payMethod:'', createTime:'2026-09-04 11:30', company:'绿能新能源科技有限公司', contact:'陈志远', phone:'139****8899', progress:0, rating:0 },
        { id:'FW20260903006', svcId:'SVC006', svcName:'年度财务审计报告', provider:'华信会计师事务所', icon:'fa-calculator', category:'财务审计',
          amount:5500, status:'unpaid', payMethod:'', createTime:'2026-09-03 15:52', company:'恒泰机械制造有限公司', contact:'刘会计', phone:'137****2233', progress:0, rating:0 }
    ];

    // ========== 销售线索种子（与 clue-management.html 原有列表对齐；企业端问答/雷达/诊断触发时由 addClue 追加） ==========
    // source: '政策查询' | '问答触发' | '诊断触发' | '雷达触发'
    // stage:  '待跟进' | '跟进中' | '已转化' | '已流失'
    const DEFAULT_CLUES = [
        { id:'XS20260907001', company:'星河智造科技有限公司', source:'政策查询', sourceIcon:'fa-search', sourceColor:'blue', intent:'高企认定复审', sales:'张销售', salesInitial:'张', stage:'跟进中', stageColor:'blue', enterTime:'2 小时前进入', createTime:'2026-09-07 09:30' },
        { id:'XS20260907002', company:'康泰生物制药有限公司', source:'问答触发', sourceIcon:'fa-comments', sourceColor:'orange', intent:'临床试验加速', sales:'张销售', salesInitial:'张', stage:'跟进中', stageColor:'blue', enterTime:'5 小时前进入', createTime:'2026-09-07 06:30' },
        { id:'XS20260907003', company:'蓝海智能科技有限公司', source:'政策查询', sourceIcon:'fa-search', sourceColor:'blue', intent:'人工智能专项', sales:'', salesInitial:'-', stage:'待跟进', stageColor:'gray', enterTime:'2 小时前进入', createTime:'2026-09-07 09:30' },
        { id:'XS20260906001', company:'锐达新材料股份公司', source:'诊断触发', sourceIcon:'fa-stethoscope', sourceColor:'purple', intent:'新材料专项', sales:'王销售', salesInitial:'王', stage:'跟进中', stageColor:'blue', enterTime:'1 天前进入', createTime:'2026-09-06 10:00' },
        { id:'XS20260904001', company:'云图信息技术有限公司', source:'政策查询', sourceIcon:'fa-search', sourceColor:'blue', intent:'软件退税', sales:'张销售', salesInitial:'张', stage:'已转化', stageColor:'brand', enterTime:'3 天前进入', createTime:'2026-09-04 10:00' },
        { id:'XS20260715001', company:'远东贸易有限公司', source:'政策查询', sourceIcon:'fa-search', sourceColor:'blue', intent:'出口退税', sales:'王销售', salesInitial:'王', stage:'已流失', stageColor:'red', enterTime:'流失于 07-15', lostTime:'2026-07-15', createTime:'2026-07-15 10:00' }
    ];

    /** 读取服务订单 */
    function loadServiceOrders() {
        const data = _read(KEYS.SERVICE_ORDERS, null);
        const src = (!data || !Array.isArray(data) || data.length === 0)
            ? DEFAULT_SERVICE_ORDERS
            : data.filter(o => o && o.id && o.svcName);
        return src.map(o => ({
            id: o.id,
            svcId: o.svcId || '',
            svcName: o.svcName,
            provider: o.provider || '',
            icon: o.icon || 'fa-file-text-o',
            category: o.category || '',
            amount: Number(o.amount) || 0,
            status: o.status || 'unpaid',
            payMethod: o.payMethod || '',
            createTime: o.createTime || '',
            company: o.company || '',
            contact: o.contact || '',
            phone: o.phone || '',
            progress: Number(o.progress) || 0,
            rating: Number(o.rating) || 0,
            settled: !!o.settled,
            auditNote: o.auditNote || '',
            settleNote: o.settleNote || '',
            reviewText: o.reviewText || '',
            reviewTime: o.reviewTime || '',
            replyText: o.replyText || '',
            replyTime: o.replyTime || ''
        }));
    }

    /** 保存服务订单 */
    function saveServiceOrders(list) {
        if (!Array.isArray(list)) return false;
        const cleaned = list.filter(o => o && o.id && o.svcName).map(o => ({
            id: o.id, svcId: o.svcId || '', svcName: o.svcName, provider: o.provider || '',
            icon: o.icon || 'fa-file-text-o', category: o.category || '', amount: Number(o.amount) || 0,
            status: o.status || 'unpaid', payMethod: o.payMethod || '', createTime: o.createTime || '',
            company: o.company || '', contact: o.contact || '', phone: o.phone || '',
            progress: Number(o.progress) || 0, rating: Number(o.rating) || 0,
            settled: !!o.settled, settleNote: o.settleNote || '',
            reviewText: o.reviewText || '', reviewTime: o.reviewTime || '',
            replyText: o.replyText || '', replyTime: o.replyTime || ''
        }));
        return _write(KEYS.SERVICE_ORDERS, cleaned);
    }

    /** 新增一条订单（下单支付后调用），返回新订单 */
    function addServiceOrder(order) {
        const list = loadServiceOrders();
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const id = 'FW' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
                   String(Math.floor(Math.random() * 900) + 100);
        const row = {
            id,
            svcId: order.svcId || '',
            svcName: order.svcName || '',
            provider: order.provider || '',
            icon: order.icon || 'fa-file-text-o',
            category: order.category || '',
            amount: Number(order.amount) || 0,
            status: order.status || 'serving',
            payMethod: order.payMethod || '',
            createTime: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                        ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()),
            company: order.company || '',
            contact: order.contact || '',
            phone: order.phone || '',
            progress: order.status === 'unpaid' ? 0 : 10,
            rating: 0,
            reviewText: '', reviewTime: '', replyText: '', replyTime: ''
        };
        list.unshift(row);
        saveServiceOrders(list);
        return row;
    }

    // ========== 销售线索（企业端问答/雷达/诊断行为自动回流） ==========
    /** 读取销售线索 */
    function loadClues() {
        const data = _read(KEYS.CLUES, null);
        const src = (!data || !Array.isArray(data) || data.length === 0)
            ? DEFAULT_CLUES
            : data.filter(c => c && c.id && c.company);
        return src.map(c => ({
            id: c.id,
            company: c.company,
            source: c.source || '政策查询',
            sourceIcon: c.sourceIcon || 'fa-search',
            sourceColor: c.sourceColor || 'blue',
            intent: c.intent || '',
            sales: c.sales || '',
            salesInitial: c.salesInitial || '-',
            stage: c.stage || '待跟进',
            stageColor: c.stageColor || 'gray',
            enterTime: c.enterTime || '',
            lostTime: c.lostTime || '',
            createTime: c.createTime || '',
            note: c.note || ''
        }));
    }
    /** 保存销售线索 */
    function saveClues(list) {
        if (!Array.isArray(list)) return false;
        const cleaned = list.filter(c => c && c.id && c.company).map(c => ({
            id: c.id, company: c.company, source: c.source || '政策查询',
            sourceIcon: c.sourceIcon || 'fa-search', sourceColor: c.sourceColor || 'blue',
            intent: c.intent || '', sales: c.sales || '', salesInitial: c.salesInitial || '-',
            stage: c.stage || '待跟进', stageColor: c.stageColor || 'gray',
            enterTime: c.enterTime || '', lostTime: c.lostTime || '',
            createTime: c.createTime || '', note: c.note || ''
        }));
        return _write(KEYS.CLUES, cleaned);
    }
    /** 新增一条线索（企业端问答/雷达/诊断触发时调用），返回新线索 */
    function addClue(clue) {
        const list = loadClues();
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const id = 'XS' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
                   String(Math.floor(Math.random() * 900) + 100);
        // 来源默认图标与配色
        const sourceMap = {
            '问答触发': { icon: 'fa-comments', color: 'orange' },
            '诊断触发': { icon: 'fa-stethoscope', color: 'purple' },
            '雷达触发': { icon: 'fa-bullseye', color: 'indigo' },
            '政策查询': { icon: 'fa-search', color: 'blue' }
        };
        const sm = sourceMap[clue.source] || sourceMap['政策查询'];
        const row = {
            id,
            company: clue.company || '匿名企业',
            source: clue.source || '政策查询',
            sourceIcon: sm.icon,
            sourceColor: sm.color,
            intent: clue.intent || '',
            sales: clue.sales || '',
            salesInitial: clue.sales ? clue.sales.charAt(0) : '-',
            stage: clue.stage || '待跟进',
            stageColor: 'gray',
            enterTime: '刚刚进入',
            createTime: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                        ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()),
            note: clue.note || ''
        };
        list.unshift(row);
        saveClues(list);
        return row;
    }

    /** 读取申报成本参数 */
    function loadCostConfig() {
        const data = _read(KEYS.COST_CONFIG, null);
        if (!data) return DEFAULT_COST_CONFIG;
        return {
            hrDays:    Number(data.hrDays)    || DEFAULT_COST_CONFIG.hrDays,
            hrRate:    Number(data.hrRate)    || DEFAULT_COST_CONFIG.hrRate,
            serviceFee:Number(data.serviceFee)|| DEFAULT_COST_CONFIG.serviceFee,
            otherFee:  Number(data.otherFee)  || DEFAULT_COST_CONFIG.otherFee
        };
    }

    /** 读取到账周期配置（加急系数等） */
    function loadCashflowConfig() {
        const data = _read(KEYS.CASHFLOW_CONFIG, null);
        if (!data) return DEFAULT_CASHFLOW_CONFIG;
        return {
            speedCoefficients: data.speedCoefficients || DEFAULT_CASHFLOW_CONFIG.speedCoefficients
        };
    }

    /** 读取资质判定规则 */
    function loadQualRules() {
        const data = _read(KEYS.QUAL_RULES, null);
        if (!data || !Array.isArray(data) || data.length === 0) return DEFAULT_QUAL_RULES;
        return data.filter(q => q && q.id && q.name).map(q => ({
            id: q.id,
            name: q.name,
            score: Number(q.score) || 0,
            pass: Number(q.pass) || 60,
            warn: q.warn || '',
            linkedPolicy: q.linkedPolicy || ''
        }));
    }

    /** 读取测算方案存档列表 */
    function loadCalcSchemes() {
        const data = _read(KEYS.CALC_SCHEMES, null);
        if (!data || !Array.isArray(data)) return [];
        return data;
    }

    // ========== 写入函数（后台页面使用） ==========

    /** 保存政策收益模型 */
    function savePolicyDB(db) {
        return _write(KEYS.POLICY_MODEL, db);
    }

    /** 保存申报成本参数 */
    function saveCostConfig(cfg) {
        return _write(KEYS.COST_CONFIG, cfg);
    }

    /** 保存到账周期配置 */
    function saveCashflowConfig(cfg) {
        return _write(KEYS.CASHFLOW_CONFIG, cfg);
    }

    /** 保存资质判定规则 */
    function saveQualRules(rules) {
        return _write(KEYS.QUAL_RULES, rules);
    }

    /** 新增一条测算方案存档（前端计算器调用） */
    function addCalcScheme(scheme) {
        const list = loadCalcSchemes();
        scheme.id = 'SCH-' + Date.now();
        scheme.createdAt = new Date().toISOString();
        list.unshift(scheme); // 最新的排前面
        // 最多保留 200 条
        if (list.length > 200) list.length = 200;
        return _write(KEYS.CALC_SCHEMES, list);
    }

    /** 清空测算方案存档 */
    function clearCalcSchemes() {
        return _write(KEYS.CALC_SCHEMES, []);
    }

    // ========== 配置同步状态检查 ==========
    /** 返回各配置项的同步状态（是否已有后台下发数据） */
    function getSyncStatus() {
        return {
            policyModel:    localStorage.getItem(KEYS.POLICY_MODEL)    !== null,
            costConfig:     localStorage.getItem(KEYS.COST_CONFIG)     !== null,
            cashflowConfig: localStorage.getItem(KEYS.CASHFLOW_CONFIG) !== null,
            qualRules:      localStorage.getItem(KEYS.QUAL_RULES)     !== null,
            schemeCount:    loadCalcSchemes().length
        };
    }

    // ========== 默认申报项目配置 ==========
    const DEFAULT_DECLARATION_PROJECTS = [
        {
            id: 'gqx',
            name: '国家高新技术企业认定',
            level: '国家级', type: '资金补贴', status: '申报中', statusColor: 'green',
            icon: 'fa-star', iconColor: 'blue',
            dept: '科技部火炬中心',
            deadline: '2026-08-18 (4天后)',
            subsidy: '¥50万 - 200万 + 所得税减免10%',
            progress: 65,
            stages: [
                { name:'材料准备', status:'done', date:'07-01', desc:'企业基础材料+财务+IP归集完成', rate:100 },
                { name:'提交申请', status:'done', date:'07-28', desc:'区科技局在线申报系统提交成功', rate:100 },
                { name:'专家评审', status:'doing', date:'08-10', desc:'技术+财务双维度评审进行中', rate:55 },
                { name:'公示名单', status:'pending', date:'09-15', desc:'拟认定企业名单公示期10个工作日', rate:0 },
                { name:'证书颁发', status:'pending', date:'10-01', desc:'制发高企证书并完成备案', rate:0 }
            ],
            reminders: [
                { lv:'urgent', title:'研发费用明细表缺失', time:'今天', desc:'需3天内上传近3年研发费用辅助账' },
                { lv:'warn', title:'科技成果转化证明待补充', time:'2天后', desc:'高新产品收入占比≥60%佐证材料' },
                { lv:'info', title:'评审反馈回复', time:'12天后', desc:'专家评审反馈窗口开放' },
                { lv:'done', title:'知识产权评价报告', time:'已完成', desc:'12项发明专利+28软著已归集' }
            ],
            groups: [
                { title:'基础资质类材料', icon:'fa-id-card', color:'blue', items:[
                    { id:'m1', name:'高新技术企业认定申请书', required:true, status:'done', tip:'系统在线填写后导出PDF，需法人签字、加盖企业公章后扫描上传。', sampleName:'高企申请书填写样例.pdf', samplePreview:'申请书共包含8个核心章节：企业基本信息、知识产权表、研发项目表等...' },
                    { id:'m2', name:'企业营业执照副本', required:true, status:'done', tip:'三证合一彩色扫描件，需最新年检有效状态。', sampleName:'营业执照扫描件样例.jpg', samplePreview:'统一社会信用代码：913701XXXXXXXXXXXX...' },
                    { id:'m3', name:'近3年年度审计报告', required:true, status:'done', tip:'必须具备资质的会计师事务所出具；报告首页防伪二维码需清晰可扫。', sampleName:'年度审计报告模板.pdf', samplePreview:'审计报告 我们审计了后附的XX公司财务报表...' },
                    { id:'m4', name:'企业所得税年度纳税申报表', required:true, status:'warn', tip:'近3年A类申报表主表+全部附表；研发费用加计扣除优惠明细表务必完整。', sampleName:'企业所得税申报表样例.pdf', samplePreview:'中华人民共和国企业所得税年度纳税申报表(A类)...' }
                ]},
                { title:'知识产权类材料', icon:'fa-shield', color:'orange', items:[
                    { id:'m5', name:'知识产权证书及缴费凭证', required:true, status:'done', tip:'发明专利、实用新型、软著等证书扫描件+最近一次年费缴费收据。', sampleName:'专利证书样例.png', samplePreview:'证书号第XXXXXX号 发明专利证书...' },
                    { id:'m6', name:'知识产权有效性评价报告', required:true, status:'warn', tip:'国家知识产权局出具的专利权评价报告。', sampleName:'专利权评价报告样例.pdf', samplePreview:'国家知识产权局 专利权评价报告...' },
                    { id:'m7', name:'知识产权关联研发项目说明', required:false, status:'todo', tip:'每项IP对应说明其来源、与核心技术关联度、在高新产品中的应用场景。', sampleName:'IP-项目映射表.xlsx', samplePreview:'序号|专利名称|专利号|对应研发项目|转化产品...' }
                ]},
                { title:'研发投入与财务类', icon:'fa-line-chart', color:'green', items:[
                    { id:'m8', name:'近3年研发费用辅助账', required:true, status:'todo', tip:'按八大费用分类；委外需提供合同+发票；其他费用不得超过研发总额20%。', sampleName:'研发费用辅助账模板.xlsx', samplePreview:'研发项目编号：RD03 项目名称：高效光伏组件研发...' },
                    { id:'m9', name:'高新产品收入明细表', required:true, status:'warn', tip:'高新产品（PS）收入须占同期总收入≥60%。', sampleName:'高新产品收入表.xlsx', samplePreview:'高新产品名称 收入金额(万元) 占比 对应核心技术...' },
                    { id:'m10', name:'研发费用加计扣除证明', required:false, status:'done', tip:'税局出具的A107012表或研发项目鉴定意见。', sampleName:'加计扣除鉴定表.pdf', samplePreview:'研发项目鉴定意见书 项目编号：RD03...' }
                ]},
                { title:'科技成果转化与组织管理', icon:'fa-flask', color:'purple', items:[
                    { id:'m11', name:'科技成果转化汇总表', required:true, status:'todo', tip:'近3年年均转化≥5项为满分档。', sampleName:'成果转化汇总表.xlsx', samplePreview:'序号|转化项目名称|转化方式|对应IP|完成时间...' },
                    { id:'m12', name:'研发组织管理制度文件', required:true, status:'done', tip:'研发项目立项管理、研发投入核算、研发人员绩效考核等制度。', sampleName:'研发管理制度汇编.pdf', samplePreview:'济南XX新能源科技有限公司 文件 XX科字〔2025〕008号...' }
                ]}
            ]
        },
        {
            id: 'zjtx',
            name: '山东省专精特新企业认定',
            level: '省级', type: '税收减免', status: '申报中', statusColor: 'green',
            icon: 'fa-rocket', iconColor: 'emerald',
            dept: '山东省工信厅',
            deadline: '2026-09-01 (18天后)',
            subsidy: '¥50万奖励 + 研发费用175%加计扣除',
            progress: 35,
            stages: [
                { name:'准备材料', status:'done', date:'07-20', desc:'专精特新基础数据梳理完成', rate:100 },
                { name:'提交申请', status:'doing', date:'08-12', desc:'省工信厅系统在线填报中', rate:40 },
                { name:'各市初审', status:'pending', date:'09-05', desc:'各市工信局核查+现场抽查', rate:0 },
                { name:'专家评审', status:'pending', date:'09-25', desc:'省厅组织专家量化打分', rate:0 },
                { name:'公示发布', status:'pending', date:'10-20', desc:'拟认定企业名单公示', rate:0 }
            ],
            reminders: [
                { lv:'warn', title:'财务报表尚未上传', time:'2天后', desc:'2023-2025三年审计报告扫描件' },
                { lv:'warn', title:'社保缴纳证明待补充', time:'5天后', desc:'连续6个月社保缴纳人员明细' },
                { lv:'info', title:'现场核查通知', time:'20天后', desc:'市工信局现场检查排期' },
                { lv:'done', title:'研发项目立项材料', time:'已完成', desc:'8项主导产品研发立项报告' }
            ],
            groups: [
                { title:'主体资格与基础信息', icon:'fa-id-card', color:'blue', items:[
                    { id:'z1', name:'专精特新申请表', required:true, status:'done', tip:'工信厅系统在线填报导出；主营业务收入占比需≥70%。', sampleName:'专精特新申请表样例.pdf', samplePreview:'一、企业基本信息 企业名称：山东XX智能装备有限公司...' },
                    { id:'z2', name:'营业执照与章程', required:true, status:'done', tip:'三证合一彩色扫描件；公司章程需含股东签字盖章页。', sampleName:'公司章程样例.pdf', samplePreview:'山东XX智能装备有限公司 章程 第一章 总则...' }
                ]},
                { title:'专业化与精细化', icon:'fa-bullseye', color:'indigo', items:[
                    { id:'z3', name:'财务报表(近2年)', required:true, status:'todo', tip:'营业收入复合增长率≥10%加分；利润率≥10%加分。', sampleName:'利润表对比样例.xlsx', samplePreview:'项目 2023年 2024年 2025年 复合增长率...' },
                    { id:'z4', name:'社保缴纳人员明细', required:true, status:'todo', tip:'近6个月社保局打印版；研发人员占比≥15%为加分档。', sampleName:'社保明细表.xlsx', samplePreview:'月份 参保人数 社保缴纳总额 其中研发人员...' }
                ]},
                { title:'特色化与新颖化', icon:'fa-lightbulb-o', color:'amber', items:[
                    { id:'z5', name:'特色产品证明材料', required:true, status:'warn', tip:'行业标准/团体标准参与证明；产品获省部级奖项。', sampleName:'首台套认定证书.pdf', samplePreview:'山东省首台(套)技术装备 认定证书...' },
                    { id:'z6', name:'研发与创新能力材料', required:true, status:'warn', tip:'有效IP清单≥10项加分；研发投入强度≥5%加分。', sampleName:'IP与创新能力汇总.xlsx', samplePreview:'知识产权类型 数量 其中有效 近3年新增...' }
                ]}
            ]
        },
        {
            id: 'znzz',
            name: '济南市智能制造示范企业',
            level: '市级', type: '资质认定', status: '即将截止', statusColor: 'orange',
            icon: 'fa-bolt', iconColor: 'orange',
            dept: '济南市工信局',
            deadline: '2026-08-08 (3天后·紧急)',
            subsidy: '¥20万奖励 + 项目贷款贴息',
            progress: 85,
            stages: [
                { name:'材料准备', status:'done', date:'06-25', desc:'智能制造场景梳理完成', rate:100 },
                { name:'提交申报', status:'done', date:'07-15', desc:'区工信局线上系统提交', rate:100 },
                { name:'区级初审', status:'done', date:'07-28', desc:'区工信局核查通过', rate:100 },
                { name:'现场核查', status:'doing', date:'08-05', desc:'专家现场核查智能产线', rate:70 },
                { name:'公示发布', status:'pending', date:'08-25', desc:'示范企业名单公示', rate:0 },
                { name:'授牌发证', status:'pending', date:'09-10', desc:'正式授牌+资金下达', rate:0 }
            ],
            reminders: [
                { lv:'urgent', title:'智能车间项目报告缺失', time:'今天', desc:'需3天内补齐1.5万字车间建设报告' },
                { lv:'urgent', title:'行业专家推荐函待签署', time:'1天后', desc:'需2位同行业正高级专家签字推荐' },
                { lv:'info', title:'现场核查日程', time:'3天后', desc:'8月11日上午9:00 专家现场核查' },
                { lv:'done', title:'基础申报材料', time:'已完成', desc:'申请表+营业执照+财务数据已齐' }
            ],
            groups: [
                { title:'示范企业基础材料', icon:'fa-building', color:'blue', items:[
                    { id:'x1', name:'智能制造示范企业申请书', required:true, status:'done', tip:'围绕5大维度：智能制造成熟度、数字化基础设施等。', sampleName:'智能制造申请书样例.pdf', samplePreview:'一、企业基本情况 二、智能制造成熟度评估...' },
                    { id:'x2', name:'营业执照与生产资质', required:true, status:'done', tip:'经营范围含制造类；生产许可证、环评安评等资质有效。', sampleName:'生产许可证样例.jpg', samplePreview:'全国工业产品生产许可证...' }
                ]},
                { title:'车间建设与项目报告', icon:'fa-cogs', color:'cyan', items:[
                    { id:'x3', name:'智能车间建设报告', required:true, status:'todo', tip:'最核心材料：不少于1.5万字；含车间布局图、产线流程图等。', sampleName:'智能车间建设报告模板.docx', samplePreview:'《智能焊接车间建设与运营报告》 摘要：本车间建成于2024年6月...' },
                    { id:'x4', name:'行业专家推荐函(2封)', required:true, status:'todo', tip:'需同行业正高级技术职称专家；手写签字+职称证复印件。', sampleName:'专家推荐函模板.doc', samplePreview:'专家推荐函 致济南市工业和信息化局：...' }
                ]},
                { title:'数字化与绩效数据', icon:'fa-area-chart', color:'purple', items:[
                    { id:'x5', name:'数字化装备清单与联网率', required:true, status:'warn', tip:'关键工序数控化率≥80%加分。', sampleName:'设备联网率报表.xlsx', samplePreview:'工序 设备总数 联网数 联网率 数控化率...' },
                    { id:'x6', name:'综合效益对比表', required:false, status:'done', tip:'建设前后对比：生产效率、运营成本、产品研发周期等。', sampleName:'综合效益对比表.xlsx', samplePreview:'核心指标 建设前 建设后 改善率...' }
                ]}
            ]
        },
        {
            id: 'kjxq',
            name: '科技型中小企业评价入库',
            level: '国家级', type: '资质入库', status: '待申报', statusColor: 'blue',
            icon: 'fa-flask', iconColor: 'purple',
            dept: '科技部服务中心',
            deadline: '2026-09-10 (27天后)',
            subsidy: '研发费用175%加计扣除 + 亏损结转10年',
            progress: 10,
            stages: [
                { name:'企业自评', status:'doing', date:'08-20', desc:'科技型中小企业系统自评分', rate:30 },
                { name:'在线填报', status:'pending', date:'08-28', desc:'科技部火炬中心系统填报', rate:0 },
                { name:'省级审核', status:'pending', date:'09-05', desc:'省科技厅批量审核', rate:0 },
                { name:'公示入库', status:'pending', date:'09-25', desc:'入库名单公示+入库登记编号', rate:0 }
            ],
            reminders: [
                { lv:'info', title:'入库填报窗口开放', time:'10天后', desc:'系统开放日2026-08-20 09:00' },
                { lv:'info', title:'研发费用辅助账归集', time:'建议准备', desc:'2025年度研发费用辅助账建议提前整理' }
            ],
            groups: [
                { title:'入库填报基础材料', icon:'fa-file-text-o', color:'blue', items:[
                    { id:'k1', name:'企业基础信息表', required:true, status:'todo', tip:'职工总数≤500人、年营收≤2亿、资产总额≤2亿。', sampleName:'中小企业基础信息表.xlsx', samplePreview:'指标 数值 达标判断 职工总数(人) 286 ≤500 ✓...' }
                ]},
                { title:'研发与IP证明', icon:'fa-flask', color:'purple', items:[
                    { id:'k2', name:'知识产权清单', required:true, status:'warn', tip:'1项发明专利或5项实用新型/软著即可满分档。', sampleName:'知识产权清单.xlsx', samplePreview:'序号 类型 名称 专利号 获取时间 状态...' },
                    { id:'k3', name:'2025年度研发项目表', required:true, status:'todo', tip:'项目名称、起止时间、参与人员、投入经费。', sampleName:'研发项目表.xlsx', samplePreview:'项目编号 名称 起止 人员 经费(万) 技术领域...' }
                ]}
            ]
        }
    ];

    /** 读取申报项目配置 */
    function loadDeclarationProjects() {
        const data = _read(KEYS.DECLARATION_PROJECTS, null);
        if (!data || !Array.isArray(data) || data.length === 0) return DEFAULT_DECLARATION_PROJECTS;
        return data;
    }

    /** 保存申报项目配置 */
    function saveDeclarationProjects(projects) {
        if (!Array.isArray(projects)) return false;
        return _write(KEYS.DECLARATION_PROJECTS, projects);
    }

    // ========== 默认诊断配置（与 ability-diagnosis.html 硬编码值一致，作为 fallback） ==========
    const DEFAULT_DIAGNOSIS_CONFIG = {
        // 六大维度：行业均值(avg)、行业标杆(best)、建议文案库(suggestions 供提升建议/发展路径共用)
        dims: [
            { key:'tech',      name:'技术创新', desc:'核心技术突破能力', avg:70, best:95,
              suggestions:['加大核心技术研发投入', '布局关键技术专利群', '建立产学研合作机制'] },
            { key:'rd',        name:'研发投入', desc:'研发资源配置',     avg:65, best:90,
              suggestions:['提升研发费用占比至行业均值以上', '申报研发费用加计扣除', '引入高层次研发人才'] },
            { key:'ip',        name:'知识产权', desc:'专利布局质量',     avg:60, best:88,
              suggestions:['加快专利布局速度', '增加发明专利占比', '启动PCT国际专利申请'] },
            { key:'transform', name:'成果转化', desc:'技术落地能力',     avg:55, best:85,
              suggestions:['建设中试基地', '推动技术成果产业化', '申报科技成果转化项目'] },
            { key:'talent',    name:'人才结构', desc:'研发团队配置',     avg:68, best:92,
              suggestions:['引进高层次研发人才', '完善人才激励机制', '优化研发团队结构'] },
            { key:'market',    name:'市场表现', desc:'市场竞争力',       avg:62, best:90,
              suggestions:['拓展高附加值产品线', '提升高新技术产品收入占比', '加强品牌建设'] }
        ],
        // 评级阈值：avg>=min 命中该档
        ratings: [
            { min:90, grade:'A+', rank:'TOP 5%' },
            { min:80, grade:'A',  rank:'TOP 15%' },
            { min:70, grade:'B',  rank:'TOP 35%' },
            { min:60, grade:'C',  rank:'TOP 60%' },
            { min:0,  grade:'D',  rank:'TOP 85%' }
        ],
        // 短板分析分档：差距(企业得分-行业均值) <= max 命中该档，按升序匹配
        shortboardTiers: [
            { max:-15, label:'严重短板' },
            { max:-5,  label:'偏弱' },
            { max:5,   label:'持平' },
            { max:15,  label:'优势' },
            { max:999, label:'领先' }
        ],
        // 发展路径阶段：目标分 = 最弱维度得分 + inc
        devPathStages: [
            { title:'短期提升', range:'1-3个月',  inc:10 },
            { title:'中期攻坚', range:'3-6个月',  inc:20 },
            { title:'长期突破', range:'6-12个月', inc:30 }
        ],
        // 计分公式：维度key → 规则数组，规则三种模式：
        //   unit  {label,field,per,cap,div?}  得分=min(cap, 值/div*per)
        //   tier  {label,field,tiers:[{max,score}]}  值<max 命中该档得分
        //   scale {label,bonus:{微型,小型,中型,大型},cap}  按企业规模取修正分
        scoring: {
            tech: [
                { label:'发明专利',   field:'patent',  mode:'unit', per:1.5, cap:40 },
                { label:'研发占比',   field:'rdPct',   mode:'unit', per:3,   cap:30 },
                { label:'企业资质',   field:'quals',   mode:'unit', per:10,  cap:30 }
            ],
            rd: [
                { label:'研发占比',   field:'rdPct',    mode:'unit', per:4,  cap:40 },
                { label:'研发金额',   field:'rdAmount', mode:'unit', per:5,  cap:30, div:1000 },
                { label:'规模修正',   mode:'scale', bonus:{ '微型':10, '小型':10, '中型':5, '大型':0 }, cap:30 }
            ],
            ip: [
                { label:'发明专利',   field:'patent',   mode:'unit', per:1,   cap:35 },
                { label:'软件著作',   field:'software', mode:'unit', per:0.5, cap:25 },
                { label:'实用新型',   field:'utility',  mode:'unit', per:0.3, cap:20 },
                { label:'企业资质',   field:'quals',    mode:'unit', per:10,  cap:20 }
            ],
            transform: [
                { label:'高新收入占比', field:'htPct', mode:'unit', per:0.8, cap:50 },
                { label:'企业资质',     field:'quals', mode:'unit', per:15,  cap:50 }
            ],
            talent: [
                { label:'员工规模', field:'employees', mode:'tier',
                  tiers:[ { max:50, score:30 }, { max:200, score:60 }, { max:500, score:80 }, { max:99999999, score:100 } ] },
                { label:'企业资质', field:'quals', mode:'unit', per:10, cap:20 }
            ],
            market: [
                { label:'年营收', field:'revenue', mode:'tier',
                  tiers:[ { max:10000, score:40 }, { max:50000, score:60 }, { max:100000, score:80 }, { max:99999999, score:100 } ] },
                { label:'规模修正', mode:'scale', bonus:{ '微型':2, '小型':4, '中型':7, '大型':10 }, cap:10 }
            ]
        }
    };

    /** 读取诊断配置 */
    function loadDiagnosisConfig() {
        const data = _read(KEYS.DIAGNOSIS_CONFIG, null);
        if (!data || typeof data !== 'object') return JSON.parse(JSON.stringify(DEFAULT_DIAGNOSIS_CONFIG));
        const DEF = DEFAULT_DIAGNOSIS_CONFIG;
        // dims 兼容：旧存档可能缺 suggestions 字段，按 key 从默认配置补齐
        const defDimMap = {};
        DEF.dims.forEach(function(d) { defDimMap[d.key] = d; });
        const dims = (Array.isArray(data.dims) && data.dims.length ? data.dims : DEF.dims).map(function(d) {
            const def = defDimMap[d.key] || {};
            if (!Array.isArray(d.suggestions) || !d.suggestions.length) {
                d.suggestions = (def.suggestions || []).slice();
            }
            return d;
        });
        return {
            dims: dims,
            ratings: Array.isArray(data.ratings) && data.ratings.length ? data.ratings : DEF.ratings,
            shortboardTiers: Array.isArray(data.shortboardTiers) && data.shortboardTiers.length ? data.shortboardTiers : DEF.shortboardTiers,
            devPathStages: Array.isArray(data.devPathStages) && data.devPathStages.length ? data.devPathStages : DEF.devPathStages,
            scoring: (data.scoring && typeof data.scoring === 'object') ? data.scoring : JSON.parse(JSON.stringify(DEF.scoring))
        };
    }

    /** 保存诊断配置 */
    function saveDiagnosisConfig(cfg) {
        if (!cfg || typeof cfg !== 'object') return false;
        return _write(KEYS.DIAGNOSIS_CONFIG, cfg);
    }

    // ========== 默认客户数据（客户管理页演示数据） ==========
    const DEFAULT_CUSTOMERS = [
        {
            id: 'C001', name: '星河智造科技有限公司', code: '91330104MA2XXXX5X', industry: '电子信息',
            contact: '王明华', phone: '138****8688', employees: 236, revenue: 12000, status: '成交客户',
            founded: '2018-06-12', regCap: '5000万', region: '杭州余杭', quals: ['国家高新'],
            lastDiagnosis: { date: '2026-08-01', avg: 76, grade: 'B', weak: ['知识产权', '成果转化'] },
            matchedPolicies: [
                { title: '国家高新技术企业认定', match: 98, benefit: '补贴 30万', level: '高匹配' },
                { title: '省级专精特新中小企业', match: 92, benefit: '补贴 50万', level: '高匹配' },
                { title: '研发费用加计扣除', match: 88, benefit: '减税 80万', level: '中匹配' },
                { title: '市级研发中心建设补助', match: 85, benefit: '补贴 20万', level: '中匹配' }
            ],
            followups: [
                { type: '电话沟通', date: '2026-08-01', content: '客户对专精特新政策申报兴趣浓厚，约定下周上门拜访，提供详细申报材料清单。', plan: '2026-08-08' },
                { type: '上门拜访', date: '2026-07-25', content: '与企业财务总监沟通研发费用归集问题，介绍高企认定核心要点。', plan: '2026-08-01' },
                { type: '邮件发送', date: '2026-07-18', content: '发送政策匹配报告及公司服务介绍，客户已确认查收。', plan: '' }
            ]
        },
        {
            id: 'C002', name: '康泰生物制药有限公司', code: '91330104MA2XXXY2K', industry: '生物医药',
            contact: '李建国', phone: '139****2266', employees: 480, revenue: 28000, status: '意向客户',
            founded: '2015-03-20', regCap: '1.2亿', region: '杭州滨江', quals: ['国家高新', '专精特新'],
            lastDiagnosis: { date: '2026-08-02', avg: 83, grade: 'A', weak: ['成果转化'] },
            matchedPolicies: [
                { title: '省生物医药创新专项', match: 88, benefit: '最高 500万', level: '高匹配' },
                { title: '研发费用加计扣除', match: 91, benefit: '减税 210万', level: '高匹配' },
                { title: '市级重点实验室补助', match: 80, benefit: '补贴 100万', level: '中匹配' }
            ],
            followups: [
                { type: '上门拜访', date: '2026-08-02', content: '演示了科创能力诊断报告，客户认可短板分析结论，有意向签约年度服务。', plan: '2026-08-10' }
            ]
        },
        {
            id: 'C003', name: '锐达新材料股份公司', code: '91330104MA2XXXY3L', industry: '新材料',
            contact: '陈晓敏', phone: '137****6699', employees: 120, revenue: 6500, status: '潜在客户',
            founded: '2020-09-01', regCap: '2000万', region: '宁波镇海', quals: [],
            lastDiagnosis: null,
            matchedPolicies: [
                { title: '市新材料研发专项', match: 83, benefit: '最高 300万', level: '中匹配' },
                { title: '科技型中小企业评价', match: 90, benefit: '税收优惠', level: '高匹配' }
            ],
            followups: [
                { type: '电话沟通', date: '2026-07-28', content: '首次触达，客户表示目前暂无申报计划，但同意接收政策资讯。', plan: '2026-08-28' }
            ]
        },
        {
            id: 'C004', name: '智远装备制造有限公司', code: '91330104MA2XXXY4M', industry: '高端装备',
            contact: '赵伟峰', phone: '135****5544', employees: 650, revenue: 52000, status: '成交客户',
            founded: '2012-05-16', regCap: '2亿', region: '杭州萧山', quals: ['国家高新', '企业技术中心'],
            lastDiagnosis: { date: '2026-08-03', avg: 88, grade: 'A', weak: ['知识产权'] },
            matchedPolicies: [
                { title: '智能制造装备发展专项', match: 86, benefit: '最高 800万', level: '高匹配' },
                { title: '省级企业技术中心认定', match: 93, benefit: '奖励 100万', level: '高匹配' }
            ],
            followups: [
                { type: '上门拜访', date: '2026-08-03', content: '签订智能制造专项申报服务合同，预付款已到账。', plan: '2026-08-20' }
            ]
        },
        {
            id: 'C005', name: '新能源科技发展公司', code: '91330104MA2XXXY5N', industry: '新能源',
            contact: '孙丽娜', phone: '136****7788', employees: 300, revenue: 18000, status: '意向客户',
            founded: '2017-11-08', regCap: '8000万', region: '湖州南浔', quals: ['国家高新'],
            lastDiagnosis: null,
            matchedPolicies: [
                { title: '省新能源产业扶持资金', match: 90, benefit: '最高 600万', level: '高匹配' }
            ],
            followups: [
                { type: '微信沟通', date: '2026-07-30', content: '发送了新能源专项政策解读，客户预约下周视频会议详谈。', plan: '2026-08-05' }
            ]
        },
        {
            id: 'C006', name: '云图信息技术有限公司', code: '91330104MA2XXXY6P', industry: '电子信息',
            contact: '周海涛', phone: '138****1234', employees: 45, revenue: 3200, status: '潜在客户',
            founded: '2021-04-15', regCap: '500万', region: '杭州西湖', quals: [],
            lastDiagnosis: null,
            matchedPolicies: [
                { title: '市软件产业发展专项资金', match: 85, benefit: '最高 200万', level: '中匹配' },
                { title: '科技型中小企业评价', match: 88, benefit: '税收优惠', level: '高匹配' }
            ],
            followups: [
                { type: '邮件发送', date: '2026-07-25', content: '发送初创企业政策礼包资料，等待客户反馈。', plan: '2026-08-25' }
            ]
        }
    ];

    /** 读取客户数据 */
    function loadCustomers() {
        const data = _read(KEYS.CUSTOMERS, null);
        if (!Array.isArray(data)) return JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS));
        return data;
    }

    /** 保存客户数据 */
    function saveCustomers(customers) {
        if (!Array.isArray(customers)) return false;
        return _write(KEYS.CUSTOMERS, customers);
    }

    // ========== 默认智能报告（含分享记录 shares[]，每条记录 = 一次分享给某个客户的链接） ==========
    // 报告: { id, title, customerName, type, createdAt, company, diagnosis, summary, profile, policies, advice, shares[] }
    // shares[i]: { shareId, toName, toPhone, createdAt, expireAt, views: [{at, durSec}] }
    const DEFAULT_SALES_REPORTS = [
        {
            id: 'R20260901', title: '绿能新能源政策匹配分析报告', customerName: '绿能新能源科技有限公司',
            type: '政策匹配', createdAt: '2026-09-01 15:40',
            company: { name: '绿能新能源科技有限公司', code: '91330402MA2XXXX7Q', industry: '新能源（光伏储能）', contact: '陈志远', phone: '139****8899', employees: 180, revenue: 18000, region: '嘉兴南湖', quals: ['国家高新', '科技型中小企业'] },
            diagnosis: { avg: 72, grade: 'B', weak: ['研发组织管理', '成长性指标'] },
            summary: '绿能新能源科技有限公司作为国家高新技术企业，专注于光伏储能系统集成与新能源运维服务。经 AI 综合分析，企业可申报政策 3 项，预计可获权益 480 万元，政策匹配度良好，建议重点申报省新能源产业专项及研发费用加计扣除。',
            profile: '企业位于嘉兴南湖，属新能源行业，现有员工 180 人，年营收约 1.8 亿元。已获国家高新、科技型中小企业资质。科创能力综合得分 72 分（评级 B），研发组织管理与成长性指标为当前待补短板；随着储能业务线研发投入持续加大，政策申报空间较大。',
            policies: [
                { title: '省新能源产业发展专项', benefit: '最高 300万', level: '高匹配', match: 90 },
                { title: '研发费用加计扣除', benefit: '减税 150万', level: '高匹配', match: 93 },
                { title: '国家高新技术企业认定（复审）', benefit: '补贴 30万', level: '中匹配', match: 82 }
            ],
            advice: '1. 建议重点申报「省新能源产业发展专项」（最高 300万），储能系统集成研发方向与专项支持领域高度契合。\n2. 高企复审临近，建议提前规范研发组织管理材料，完善研发项目立项与成果转化台账。\n3. 加计扣除与专项申报可同步推进，注意研发费用辅助账口径一致性。',
            shares: [
                { shareId: 'S301', toName: '陈志远', toPhone: '139****8899', createdAt: '2026-09-01 16:05', expireAt: '2026-10-01',
                  views: [ {at:'2026-09-01 20:15',durSec:165}, {at:'2026-09-02 08:40',durSec:230}, {at:'2026-09-03 21:05',durSec:285}, {at:'2026-09-04 09:18',durSec:142} ] },
                { shareId: 'S302', toName: '项目申报-林晓', toPhone: '136****2233', createdAt: '2026-09-02 09:35', expireAt: '2026-10-02',
                  views: [ {at:'2026-09-02 10:05',durSec:120}, {at:'2026-09-04 10:42',durSec:88} ] },
                { shareId: 'AUTO_202609031422', toName: '（匿名访问）', toPhone: '', createdAt: '2026-09-03 14:22', expireAt: '',
                  views: [ {at:'2026-09-03 14:22',durSec:40} ] }
            ]
        },
        {
            id: 'R20260828', title: '恒力精密制造行业分析报告', customerName: '恒力精密制造有限公司',
            type: '行业分析', createdAt: '2026-08-28 16:20',
            company: { name: '恒力精密制造有限公司', code: '91330212MA2XXXX3P', industry: '装备制造（数控机床）', contact: '王建国', phone: '137****3344', employees: 320, revenue: 21000, region: '宁波鄞州', quals: ['国家高新'] },
            diagnosis: { avg: 68, grade: 'C', weak: ['知识产权布局', '研发费用归集'] },
            summary: '恒力精密制造有限公司专注于高精度数控机床及核心功能部件研发制造。经 AI 行业分析，企业可申报政策 3 项，预计可获权益 200 万元；当前知识产权布局与研发费用归集为主要短板，建议补齐后申报省级专精特新中小企业。',
            profile: '企业位于宁波鄞州，属装备制造行业，现有员工 320 人，年营收约 2.1 亿元。已获国家高新资质。科创能力综合得分 68 分（评级 C），知识产权数量与研发费用归集规范性不足，是制约专精特新申报的主要因素。',
            policies: [
                { title: '省级专精特新中小企业', benefit: '补贴 50万', level: '高匹配', match: 89 },
                { title: '研发费用加计扣除', benefit: '减税 120万', level: '中匹配', match: 85 },
                { title: '市级工业技改补助', benefit: '补贴 30万', level: '中匹配', match: 80 }
            ],
            advice: '1. 建议尽快启动「省级专精特新中小企业」申报准备，重点补充发明专利布局与研发费用辅助账。\n2. 数控机床核心部件国产化研发项目可单独归集研发费用，充分享受加计扣除。\n3. 技改设备投入建议同步申报市级工业技改补助。',
            shares: [
                { shareId: 'S201', toName: '王建国', toPhone: '137****3344', createdAt: '2026-08-28 16:40', expireAt: '2026-09-27',
                  views: [ {at:'2026-08-28 17:02',durSec:95}, {at:'2026-08-29 09:12',durSec:210}, {at:'2026-08-30 14:48',durSec:188}, {at:'2026-09-01 10:05',durSec:240}, {at:'2026-09-02 16:30',durSec:175}, {at:'2026-09-03 20:11',durSec:96} ] },
                { shareId: 'S202', toName: '财务部-刘会计', toPhone: '135****6677', createdAt: '2026-08-29 09:05', expireAt: '2026-09-28',
                  views: [ {at:'2026-08-29 10:22',durSec:52} ] },
                { shareId: 'S203', toName: '行政部-陈静', toPhone: '', createdAt: '2026-08-30 11:20', expireAt: '2026-09-29', views: [] }
            ]
        },
        {
            id: 'R20260820', title: '天启信息科创能力诊断报告', customerName: '天启信息技术有限公司',
            type: '能力诊断', createdAt: '2026-08-20 10:05',
            company: { name: '天启信息技术有限公司', code: '91330106MA2XXXX8T', industry: '软件信息（SaaS服务）', contact: '周海燕', phone: '138****5566', employees: 96, revenue: 6800, region: '杭州西湖', quals: ['科技型中小企业'] },
            diagnosis: { avg: 61, grade: 'C', weak: ['知识产权', '成果转化', '研发组织'] },
            summary: '天启信息技术有限公司为企业提供 SaaS 化客户管理与数据分析服务。经 AI 科创能力诊断，综合得分 61 分（评级 C），知识产权、成果转化、研发组织三项为明显短板。企业可申报政策 3 项，预计可获权益 75 万元，建议先夯实研发管理基础再申报高企。',
            profile: '企业位于杭州西湖，属软件信息行业，现有员工 96 人，年营收约 6800 万元。已获科技型中小企业资质。科创能力综合得分 61 分（评级 C），目前以软件著作权为主、发明专利空白，成果转化与研发组织管理需体系化建设。',
            policies: [
                { title: '国家高新技术企业认定', benefit: '补贴 30万', level: '中匹配', match: 78 },
                { title: '研发费用加计扣除', benefit: '减税 45万', level: '中匹配', match: 82 },
                { title: '软件企业增值税即征即退', benefit: '退税约 20万', level: '中匹配', match: 75 }
            ],
            advice: '1. 高企认定得分差距主要在知识产权与成果转化，建议本年度优先申请 2-3 项发明专利并建立成果转化台账。\n2. 规范研发项目立项、工时与费用归集，为加计扣除与高企申报打基础。\n3. 软件企业即征即退可与高企培育同步规划。',
            shares: [
                { shareId: 'S401', toName: '周海燕', toPhone: '138****5566', createdAt: '2026-08-20 10:30', expireAt: '2026-09-19',
                  views: [ {at:'2026-08-20 15:12',durSec:65}, {at:'2026-08-21 09:40',durSec:110} ] },
                { shareId: 'S402', toName: '总经办', toPhone: '', createdAt: '2026-08-22 14:05', expireAt: '2026-09-21', views: [] }
            ]
        },
        {
            id: 'R20260802', title: '星河智造政策匹配分析报告', customerName: '星河智造科技有限公司',
            type: '政策匹配', createdAt: '2026-08-02 14:23',
            company: { name: '星河智造科技有限公司', code: '91330104MA2XXXX5X', industry: '电子信息', contact: '王明华', phone: '138****8688', employees: 236, revenue: 12000, region: '杭州余杭', quals: ['国家高新'] },
            diagnosis: { avg: 76, grade: 'B', weak: ['知识产权', '成果转化'] },
            summary: '星河智造科技有限公司作为国家高新技术企业，在电子信息领域具备较强研发实力。经 AI 综合分析，企业可申报政策 4 项，预计可获权益 180 万元，政策匹配度整体优秀，建议优先申报省级专精特新中小企业及国家高新技术企业认定。',
            profile: '企业位于杭州余杭，属电子信息行业，现有员工 236 人，年营收约 1.2 亿元。已获国家高新资质认定。科创能力综合得分 76 分（评级 B），知识产权与成果转化为当前待补短板，具备较大的政策申报提升空间。',
            policies: [
                { title: '国家高新技术企业认定', benefit: '补贴 30万', level: '高匹配', match: 98 },
                { title: '省级专精特新中小企业', benefit: '补贴 50万', level: '高匹配', match: 92 },
                { title: '研发费用加计扣除', benefit: '减税 80万', level: '中匹配', match: 88 },
                { title: '市级研发中心建设补助', benefit: '补贴 20万', level: '中匹配', match: 85 }
            ],
            advice: '1. 建议优先申报「省级专精特新中小企业」（补贴 50万），申报窗口期临近，建议尽快启动材料准备。\n2. 针对知识产权、成果转化短板，建议在申报前补充专利布局及转化证明材料，提升评审通过率。\n3. 研发费用归集建议采用专业辅助账，可同时满足加计扣除与高企复审要求。',
            shares: [
                { shareId: 'S001', toName: '王明华', toPhone: '138****8688', createdAt: '2026-07-28 10:15', expireAt: '2026-10-26',
                  views: [ {at:'2026-07-29 11:08',durSec:70}, {at:'2026-07-30 14:30',durSec:92}, {at:'2026-08-01 09:45',durSec:138}, {at:'2026-08-02 15:12',durSec:185}, {at:'2026-08-03 10:23',durSec:260} ] },
                { shareId: 'S002', toName: '研发部-张经理', toPhone: '139****1122', createdAt: '2026-08-01 16:40', expireAt: '2026-10-30',
                  views: [ {at:'2026-08-02 09:15',durSec:45}, {at:'2026-08-03 14:20',durSec:88} ] },
                { shareId: 'S003', toName: '董秘办', toPhone: '', createdAt: '2026-08-04 11:00', expireAt: '2026-11-02', views: [] }
            ]
        },
        {
            id: 'R20260801', title: '康泰生物科创能力诊断报告', customerName: '康泰生物制药有限公司',
            type: '能力诊断', createdAt: '2026-08-01 10:15',
            company: { name: '康泰生物制药有限公司', code: '91330104MA2XXXY2K', industry: '生物医药', contact: '李建国', phone: '139****2266', employees: 480, revenue: 28000, region: '杭州滨江', quals: ['国家高新', '专精特新'] },
            diagnosis: { avg: 83, grade: 'A', weak: ['成果转化'] },
            summary: '康泰生物制药有限公司作为国家高新、专精特新双资质企业，在生物医药领域研发实力突出。科创能力综合得分 83 分（评级 A），成果转化为主要短板。经 AI 综合分析，企业可申报政策 3 项，预计可获权益 810 万元。',
            profile: '企业位于杭州滨江，属生物医药行业，现有员工 480 人，年营收约 2.8 亿元。已获国家高新、省级专精特新资质。综合得分 83 分（评级 A），整体科创能力优秀，成果转化环节仍有提升空间。',
            policies: [
                { title: '省生物医药创新专项', benefit: '最高 500万', level: '高匹配', match: 88 },
                { title: '研发费用加计扣除', benefit: '减税 210万', level: '高匹配', match: 91 },
                { title: '市级重点实验室补助', benefit: '补贴 100万', level: '中匹配', match: 80 }
            ],
            advice: '1. 建议优先申报「省生物医药创新专项」（最高 500万），企业研发管线与专项方向高度契合。\n2. 成果转化为当前短板，建议补充产学研合作协议及科技成果转化台账。\n3. 加计扣除可与专项申报同步推进，注意研发费用归集口径一致性。',
            shares: [
                { shareId: 'S101', toName: '李建国', toPhone: '139****2266', createdAt: '2026-08-01 11:00', expireAt: '2026-10-30',
                  views: [ {at:'2026-08-01 14:30',durSec:218}, {at:'2026-08-02 16:45',durSec:172} ] },
                { shareId: 'S102', toName: '技术部-赵部长', toPhone: '136****7788', createdAt: '2026-08-03 09:10', expireAt: '2026-11-01',
                  views: [ {at:'2026-08-03 09:08',durSec:15}, {at:'2026-08-03 11:40',durSec:68} ] }
            ]
        },
        {
            id: 'R20260715', title: '瑞丰食品政策匹配分析报告', customerName: '瑞丰食品科技有限公司',
            type: '政策匹配', createdAt: '2026-07-15 09:30',
            company: { name: '瑞丰食品科技有限公司', code: '91330521MA2XXXX4R', industry: '食品加工（功能性食品）', contact: '孙德旺', phone: '137****9900', employees: 210, revenue: 15000, region: '湖州德清', quals: [] },
            diagnosis: { avg: 55, grade: 'D', weak: ['知识产权', '研发组织', '成果转化'] },
            summary: '瑞丰食品科技有限公司主营功能性食品研发与生产。经 AI 综合分析，企业科创基础较薄弱（综合得分 55 分，评级 D），可申报政策 3 项，预计可获权益 60 万元，建议先入库科技型中小企业，同步规范研发管理后再谋划高企申报。',
            profile: '企业位于湖州德清，属食品加工行业，现有员工 210 人，年营收约 1.5 亿元。目前无科创类资质。科创能力综合得分 55 分（评级 D），研发投入与知识产权储备不足，建议从研发费用归集与科技型中小企业入库起步。',
            policies: [
                { title: '科技型中小企业入库', benefit: '研发补助 10万', level: '中匹配', match: 72 },
                { title: '研发费用加计扣除', benefit: '减税 60万', level: '低匹配', match: 65 },
                { title: '市农业科技专项', benefit: '补贴 20万', level: '中匹配', match: 70 }
            ],
            advice: '1. 建议先完成科技型中小企业入库，享受研发费用补助并建立申报信用。\n2. 功能性食品配方与工艺研发项目应单独立项、归集研发费用，为加计扣除做准备。\n3. 农业科技专项可结合校企合作申报，提升通过率。',
            shares: [
                { shareId: 'S501', toName: '孙德旺', toPhone: '137****9900', createdAt: '2026-07-15 10:05', expireAt: '2026-08-14',
                  views: [ {at:'2026-07-16 14:20',durSec:130}, {at:'2026-07-18 10:15',durSec:75} ] },
                { shareId: 'S502', toName: '财务科', toPhone: '', createdAt: '2026-07-20 16:10', expireAt: '2026-08-19', views: [] }
            ]
        }
    ];

    /** 读取智能报告（自动兼容旧数据；种子演示数据按版本增量合并） */
    var SALES_REPORTS_SEED_KEY = 'ceyuan_sales_reports_seed_v';
    var SALES_REPORTS_SEED_V = 2;
    function loadSalesReports() {
        const data = _read(KEYS.SALES_REPORTS, null);
        var list = Array.isArray(data) ? data : JSON.parse(JSON.stringify(DEFAULT_SALES_REPORTS));
        // 兼容迁移：新版 shares 为分享记录数组（保留）；旧版 shares/views 为计数字段（清理为空数组）
        list.forEach(function(r) {
            if (Array.isArray(r.shares)) {
                if (typeof r.views === 'number') delete r.views;
            } else {
                r.shares = [];
                delete r.views;
            }
        });
        // 种子演示数据增量合并：补入本地缺失的报告；已存在但分享记录为空的种子报告，补回演示分享
        var seedV = parseInt(_read(SALES_REPORTS_SEED_KEY, '0'), 10) || 0;
        if (seedV < SALES_REPORTS_SEED_V) {
            var changed = false;
            DEFAULT_SALES_REPORTS.forEach(function(dr) {
                var hit = null;
                for (var i = 0; i < list.length; i++) if (list[i].id === dr.id) { hit = list[i]; break; }
                if (!hit) {
                    list.push(JSON.parse(JSON.stringify(dr)));
                    changed = true;
                } else if (Array.isArray(hit.shares) && hit.shares.length === 0) {
                    hit.shares = JSON.parse(JSON.stringify(dr.shares));
                    changed = true;
                }
            });
            _write(SALES_REPORTS_SEED_KEY, SALES_REPORTS_SEED_V);
            if (changed) _write(KEYS.SALES_REPORTS, list);
        }
        return list;
    }

    /** 保存智能报告 */
    function saveSalesReports(reports) {
        if (!Array.isArray(reports)) return false;
        return _write(KEYS.SALES_REPORTS, reports);
    }

    // ========== 导出 API ==========
    global.DataBridge = {
        KEYS,
        DEFAULT_POLICY_DB,
        DEFAULT_COST_CONFIG,
        DEFAULT_CASHFLOW_CONFIG,
        DEFAULT_QUAL_RULES,
        DEFAULT_POLICY_LIBRARY,
        DEFAULT_DECLARATION_PROJECTS,
        DEFAULT_DIAGNOSIS_CONFIG,
        DEFAULT_CUSTOMERS,
        DEFAULT_SALES_REPORTS,
        DEFAULT_SERVICE_PRODUCTS,
        DEFAULT_SERVICE_ORDERS,
        DEFAULT_CLUES,
        // 读取
        loadPolicyDB,
        loadPolicyLibrary,
        batchStatus,
        loadCostConfig,
        loadCashflowConfig,
        loadQualRules,
        loadCalcSchemes,
        loadDeclarationProjects,
        loadDiagnosisConfig,
        loadCustomers,
        loadSalesReports,
        loadServiceProducts,
        loadServiceOrders,
        loadClues,
        matchPoliciesForEnterprise,
        evaluatePolicyCondition,
        getSyncStatus,
        // 写入
        savePolicyDB,
        savePolicyLibrary,
        saveCostConfig,
        saveCashflowConfig,
        saveQualRules,
        saveDeclarationProjects,
        saveDiagnosisConfig,
        saveCustomers,
        saveSalesReports,
        saveServiceProducts,
        saveServiceOrders,
        saveClues,
        addServiceOrder,
        addClue,
        addCalcScheme,
        clearCalcSchemes
    };

})(window);
