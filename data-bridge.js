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
        DECLARATION_TEMPLATES: 'ceyuan_declaration_templates', // 申报书模板库（省份×项目类型）
        DIAGNOSIS_RULES: 'ceyuan_diagnosis_rules',           // 科创测评规则引擎（硬指标/评分项/DSL）
        CUSTOMERS:      'ceyuan_customers',                  // 客户管理数据
        SALES_REPORTS:  'ceyuan_sales_reports',              // 智能报告存档
        SERVICE_PRODUCTS: 'ceyuan_service_products',         // 服务商城商品（后台维护→前台展示）
        SERVICE_ORDERS:  'ceyuan_service_orders',            // 服务商城订单（企业下单支付→订单页/运营接单）
        SERVICE_CART:   'ceyuan_service_cart',              // 服务商城购物车（加入购物车→结算生成订单）
        CLUES:          'ceyuan_clues',                         // 销售线索（企业端问答/雷达/雷达行为自动回流）
        POLICY_CONTRIB: 'ceyuan_policy_contrib',               // 用户贡献政策（待审核队列）
        REDEEM_CODES:   'ceyuan_redeem_codes',                // 策能值兑换码（销售端建模板生成固定码 → 每次分发按序号派生 CY888-01 → 会员中心兑换，每张限用一次）
        POLICY_SHARES:  'ceyuan_policy_shares',                // 政策分享追踪（销售端分享政策给客户 → 落地页上报浏览行为，结构同报告 shares）
        CONSULT_MSGS:   'ceyuan_consult_msgs',                 // 在线咨询消息（客户落地页/详情页发起咨询 → 销售端 H5 消息中心接收并回复）
        ENTRUSTS:       'ceyuan_entrusts',                     // 委托申报单（客户在政策详情页提交委托 → 销售端 H5 消息中心处理）
        CRAWLER_SOURCES: 'ceyuan_crawler_sources',             // 自动采集源配置（站点/方式/栏目范围/频率/启停）
        PROFILE_DICT:   'ceyuan_profile_dict',                   // 企业画像字典（所属产业/企业资质，运营配置→雷达筛选展示）
        ENTERPRISE_PROFILE: 'ceyuan_enterprise_profile'          // 企业档案（能力诊断填写的企业信息与指标，供其他模块调取）
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
        { id:'GAOXIN',    name:'高新技术企业认定管理办法', dept:'科技部', level:'国家级', industry:'信息技术', policyType:'declaration',
          region:{ province:'全国', city:'', district:'' },
          effective:'2016-01-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:5},{type:'ipOwned',op:'==',val:true},{type:'hiTechRatio',op:'>=',val:60}],
          content:'科技部、财政部、国家税务总局联合发布《高新技术企业认定管理办法》，旨在扶持和鼓励高新技术企业发展，调整产业结构，促进经济增长方式转变。\n\n一、认定条件\n1. 企业申请认定时须注册成立一年以上。\n2. 企业通过自主研发、受让、受赠、并购等方式，获得对其主要产品（服务）在技术上发挥核心支持作用的知识产权的所有权。\n3. 对企业主要产品（服务）发挥核心支持作用的技术属于《国家重点支持的高新技术领域》规定的范围。\n4. 企业从事研发和相关技术创新活动的科技人员占企业当年职工总数的比例不低于10%。\n5. 企业近三个会计年度的研究开发费用总额占同期销售收入总额的比例符合如下要求：\n   — 最近一年销售收入小于5000万元（含）的企业，比例不低于5%；\n   — 最近一年销售收入在5000万元至2亿元（含）的企业，比例不低于4%；\n   — 最近一年销售收入在2亿元以上的企业，比例不低于3%。\n6. 近一年高新技术产品（服务）收入占企业同期总收入的比例不低于60%。\n7. 企业创新能力评价应达到相应要求。\n8. 企业申请认定前一年内未发生重大安全、重大质量事故或严重环境违法行为。\n\n二、扶持措施\n经认定的高新技术企业，可依照《企业所得税法》及其《实施条例》等有关规定，申报享受税收优惠政策。企业所得税减按15%征收。\n\n三、认定程序\n1. 企业对照本办法进行自我评价。认为符合认定条件的，在"高新技术企业认定管理工作网"注册登记，向认定机构提出认定申请。\n2. 认定机构收到企业申请材料后，按照技术领域和专家库管理规定，随机抽取不少于5名专家组成专家组进行评审。\n3. 认定机构结合专家组评审意见，对申请企业进行综合审查，提出认定意见并报领导小组办公室。\n4. 领导小组办公室对认定结果公示15个工作日。公示期满无异议的，由领导小组办公室在"高新技术企业认定管理工作网"上公告认定结果，并由认定机构向企业颁发统一印制的"高新技术企业证书"。\n\n四、注意事项\n已认定的高新技术企业有下列行为之一的，由认定机构取消其高新技术企业资格：在申请认定过程中提供虚假信息的；有偷、骗税等行为的；发生重大安全、重大质量事故或有严重环境违法行为的；有其他违反本办法行为的。',
          batches:[
            { name:'2026年第一批', start:'2026-03-01', end:'2026-04-20' },
            { name:'2026年第二批', start:'2026-06-01', end:'2026-07-20' },
            { name:'2026年第三批', start:'2026-08-15', end:'2026-09-30' }
          ] },
        { id:'R&D_JJ',    name:'研发费用加计扣除', dept:'财政部 税务总局', level:'国家级', industry:'信息技术', policyType:'declaration',
          region:{ province:'全国', city:'', district:'' },
          effective:'2023-01-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:100}],
          content:'为进一步激励企业加大研发投入，支持科技创新，财政部、国家税务总局就企业研发费用税前加计扣除政策有关问题公告如下：\n\n一、加计扣除范围\n企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，自2023年1月1日起，再按照实际发生额的100%在税前加计扣除；形成无形资产的，自2023年1月1日起，按照无形资产成本的200%在税前摊销。\n\n二、研发费用归集范围\n1. 人员人工费用：直接从事研发活动人员的工资薪金、基本养老保险费、基本医疗保险费、失业保险费、工伤保险费、生育保险费和住房公积金，以及外聘研发人员的劳务费用。\n2. 直接投入费用：研发活动直接消耗的材料、燃料和动力费用；用于中间试验和产品试制的模具、工艺装备开发及制造费，不构成固定资产的样品、样机及一般测试手段购置费，试制产品的检验费；用于研发活动的仪器、设备的运行维护、调整、检验、维修等费用，以及通过经营租赁方式租入的用于研发活动的仪器、设备租赁费。\n3. 折旧费用：用于研发活动的仪器、设备的折旧费。\n4. 无形资产摊销：用于研发活动的软件、专利权、非专利技术（包括许可证、专有技术、设计和计算方法等）的摊销费用。\n5. 新产品设计费、新工艺规程制定费、新药研制的临床试验费、勘探开发技术的现场试验费。\n6. 其他相关费用：与研发活动直接相关的其他费用，如技术图书资料费、资料翻译费、专家咨询费、高新科技研发保险费，研发成果的检索、分析、评议、论证、鉴定、评审、评估、验收费用，知识产权的申请费、注册费、代理费，差旅费、会议费，职工福利费、补充养老保险费、补充医疗保险费。此类费用总额不得超过可加计扣除研发费用总额的10%。\n\n三、不适用行业\n以下行业的企业不适用本政策：烟草制造业、住宿和餐饮业、批发和零售业、房地产业、租赁和商务服务业、娱乐业、财政部和国家税务总局规定的其他行业。\n\n四、办理方式\n企业享受优惠事项采取"自行判别、申报享受、相关资料留存备查"的办理方式。企业应当根据经营情况以及相关税收规定自行判断是否符合优惠事项规定的条件，符合条件的可以按照规定时间自行计算减免税额，并通过填报企业所得税纳税申报表享受税收优惠。',
          batches:[
            { name:'2025年度汇算清缴', start:'2026-01-01', end:'2026-05-31' },
            { name:'2026年10月预缴申报', start:'2026-10-01', end:'2026-10-20' }
          ] },
        { id:'LIXIANG_ZJ',name:'研发项目立项补贴', dept:'四川省科技厅', level:'省级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'成都市', district:'高新区' },
          effective:'2020-01-01', expire:'2025-12-31',
          conditions:[{type:'projectInvest',op:'>=',val:200}],
          content:'四川省科技厅发布《研发项目立项补贴实施细则》，对省内企业开展的研发项目给予立项资金支持。\n\n一、支持对象\n在四川省内注册、具有独立法人资格的企业，且项目研发投入不低于200万元。\n\n二、支持方式\n1. 事后补助：按研发投入的20%给予补助，单个项目补助最高不超过100万元。\n2. 事前立项资助：对重大研发项目给予不超过项目总投入30%的资助。\n\n三、申报材料\n1. 研发项目立项书；\n2. 企业上年度审计报告；\n3. 研发费用归集表及相关凭证；\n4. 知识产权证明材料（如有）。',
          batches:[] },
        { id:'CGZH',      name:'科技成果转化补贴', dept:'四川省科技厅', level:'省级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'成都市', district:'锦江区' },
          effective:'2021-01-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:50}],
          content:'为促进科技成果转移转化，四川省科技厅设立科技成果转化专项资金。\n\n一、支持范围\n支持企业承接高校、科研院所的科技成果并实施转化。包括：科技成果作价入股、科技成果转让、科技成果许可使用等方式。\n\n二、支持标准\n1. 对企业购买科技成果的，按实际支付金额的10%给予补贴，单个项目最高不超过50万元。\n2. 对企业与高校、科研院所共建研发机构的，按企业实际投入的15%给予补贴。\n\n三、申报条件\n1. 企业上年度研发投入不低于50万元；\n2. 已与成果持有方签订正式的转化协议；\n3. 转化项目在四川省内实施。',
          batches:[
            { name:'2026年度', start:'2026-10-08', end:'2026-11-20' }
          ] },
        { id:'ZHUANJIN',  name:'专精特新企业奖励', dept:'工信部', level:'国家级', industry:'高端装备', policyType:'declaration',
          region:{ province:'全国', city:'', district:'' },
          effective:'2022-01-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:3},{type:'ipOwned',op:'==',val:true}],
          content:'工信部、财政部、证监会联合印发《关于进一步促进中小企业发展的若干意见》，明确对专精特新企业给予重点扶持。\n\n一、基本条件\n1. 在中华人民共和国境内工商注册登记、连续经营3年以上并具有独立法人资格的中小企业；\n2. 符合《中小企业划型标准规定》（工信部联企业〔2011〕300号）中小企业划分标准；\n3. 企业近3年营业收入年均增长率不低于10%；\n4. 企业上年度研发投入强度不低于3%；\n5. 企业拥有有效的知识产权。\n\n二、专精特新"小巨人"企业认定\n在专精特新中小企业中，进一步遴选主营业务突出、竞争能力强、成长性好、专注于细分市场的专精特新"小巨人"企业，给予重点支持。\n\n三、扶持措施\n1. 财政奖励：对首次通过认定的专精特新"小巨人"企业给予一次性50-100万元奖励；\n2. 金融支持：引导金融机构加大对专精特新企业的信贷支持；\n3. 市场开拓：支持专精特新企业参与政府采购和重大项目建设。',
          batches:[
            { name:'2026年度', start:'2026-04-10', end:'2026-05-31' }
          ] },
        { id:'DENGLING',  name:'瞪羚企业认定奖励', dept:'四川省科技厅', level:'省级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'绵阳市', district:'涪城区' },
          effective:'2021-06-01', expire:'',
          conditions:[{type:'revenue',op:'>=',val:1000},{type:'rdRatio',op:'>=',val:3}],
          content:'瞪羚企业是指创业后跨过死亡谷、以科技创新或商业模式创新为支撑进入高成长期的中小企业。\n\n一、认定条件\n1. 在四川省内注册、具有独立法人资格；\n2. 近3年营业收入年均增长率不低于20%；\n3. 上年度营业收入不低于1000万元；\n4. 上年度研发投入强度不低于3%；\n5. 拥有核心自主知识产权。\n\n二、奖励标准\n对首次通过认定的瞪羚企业给予50万元一次性奖励。\n\n三、跟踪服务\n瞪羚企业实行动态管理，每两年进行一次复核。对复核通过的企业，继续享受相关扶持政策；对复核未通过的企业，取消其瞪羚企业资格。',
          batches:[
            { name:'2026年度', start:'2026-05-06', end:'2026-06-30' }
          ] },
        { id:'GXQ_RD',    name:'高新区企业研发投入后补助', dept:'成都高新区科技创新局', level:'区县级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'成都市', district:'高新区' },
          effective:'2024-01-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:50}],
          content:'成都高新区科技创新局对区内企业研发投入给予后补助支持。\n\n一、支持对象\n在成都高新区注册纳税的企业，且上年度研发投入不低于50万元。\n\n二、补助标准\n按企业上年度经认定的研发投入的10%给予补助，单个企业每年补助最高不超过200万元。\n\n三、申报流程\n企业在"成都高新区企业服务平台"在线申报，提交研发费用归集表、审计报告等材料，经审核后公示拨款。',
          batches:[
            { name:'2026年度', start:'2026-09-01', end:'2026-10-31' }
          ] },
        { id:'WH_IP',     name:'武侯区知识产权贯标资助', dept:'武侯区市场监督管理局', level:'区县级', industry:'通用', policyType:'declaration',
          region:{ province:'四川省', city:'成都市', district:'武侯区' },
          effective:'2024-03-01', expire:'',
          conditions:[{type:'ipOwned',op:'==',val:true}],
          content:'成都市武侯区市场监督管理局对区内企业开展知识产权管理体系认证给予资助。\n\n一、资助对象\n在武侯区注册、具有独立法人资格、拥有有效知识产权的企业。\n\n二、资助标准\n1. 首次通过GB/T 29490知识产权管理体系认证的，给予5万元一次性资助；\n2. 通过认证后每年完成监督审核的，给予1万元年度资助。\n\n三、申报材料\n1. 知识产权管理体系认证证书；\n2. 监督审核报告（年度资助需提供）；\n3. 企业营业执照。',
          batches:[
            { name:'2026年第一批', start:'2026-05-01', end:'2026-06-15' }
          ] },
        { id:'MY_JG',     name:'绵阳市技术改造设备补贴', dept:'绵阳市经济和信息化局', level:'市级', industry:'高端装备', policyType:'declaration',
          region:{ province:'四川省', city:'绵阳市', district:'涪城区' },
          effective:'2023-06-01', expire:'',
          conditions:[{type:'projectInvest',op:'>=',val:100}],
          content:'绵阳市经济和信息化局对企业技术改造项目给予设备购置补贴。\n\n一、支持对象\n在绵阳市内注册、独立核算的工业企业，且技改项目总投资不低于100万元。\n\n二、补贴标准\n按项目设备实际投资额的10%给予补贴，单个项目补贴最高不超过200万元。\n\n三、申报条件\n1. 技改项目已备案或核准；\n2. 设备已购置并投入使用；\n3. 项目建设期在2年以内。',
          batches:[
            { name:'2026年度', start:'2026-07-01', end:'2026-08-31' }
          ] },
        { id:'GD_ZXT',    name:'广东省专精特新中小企业贷款贴息', dept:'广东省工业和信息化厅', level:'省级', industry:'通用', policyType:'declaration',
          region:{ province:'广东省', city:'广州市', district:'天河区' },
          effective:'2023-01-01', expire:'',
          conditions:[{type:'qualification',op:'contains',val:'专精特新'}],
          content:'广东省工业和信息化厅对专精特新中小企业申请银行贷款给予贴息支持。\n\n一、支持对象\n经工信部或广东省认定的专精特新中小企业。\n\n二、贴息标准\n对企业实际支付的贷款利息，按LPR的50%给予贴息，单个企业每年贴息最高不超过50万元。\n\n三、办理方式\n企业向属地经信部门提交贷款合同、利息支付凭证等材料，经审核后拨付贴息资金。',
          batches:[
            { name:'2026年度', start:'2026-04-01', end:'2026-06-30' }
          ] },
        // === 以下为申报型政策（批次窗口错开，用于申报日历数量曲线演示） ===
        { id:'SCKJZX',   name:'四川省科技型中小企业评价', dept:'四川省科技厅', level:'省级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'', district:'' },
          effective:'2024-01-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:30}],
          content:'四川省科技厅组织开展年度科技型中小企业评价工作，入库企业可享受研发费用加计扣除、科技创新券等配套支持。\n\n一、评价条件\n在四川省内注册的居民企业，职工总数不超过500人、年销售收入不超过2亿元、资产总额不超过2亿元，且上年度研发投入不低于30万元。\n\n二、入库程序\n企业在全国科技型中小企业信息服务平台自主填报，省级管理部门审核公示后入库。',
          batches:[
            { name:'2026年度评价', start:'2026-09-20', end:'2026-10-15' }
          ] },
        { id:'CD_SZJJ',  name:'成都市数字经济应用场景补贴', dept:'成都市新经济发展委员会', level:'市级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'成都市', district:'' },
          effective:'2024-06-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:80}],
          content:'成都市新经济委对本地企业开放城市数字化转型应用场景，对入选场景建设项目给予补贴。\n\n一、支持方向\n智慧治理、智能制造、智慧医疗等领域的数字经济应用示范项目，企业上年度研发投入不低于80万元。\n\n二、支持标准\n按项目实际投资额的20%给予最高300万元补贴。',
          batches:[
            { name:'2026年第二批', start:'2026-10-01', end:'2026-10-18' }
          ] },
        { id:'TFQ_JCL',  name:'天府新区集成电路设计企业奖励', dept:'四川天府新区创新发展局', level:'区县级', industry:'信息技术', policyType:'declaration',
          region:{ province:'四川省', city:'成都市', district:'天府新区' },
          effective:'2025-01-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:4}],
          content:'四川天府新区对区内集成电路设计企业给予经营贡献奖励与流片补贴。\n\n一、支持对象\n注册纳税在天府新区、从事集成电路设计的企业，研发人员占比不低于4%。\n\n二、支持标准\n对首次完成全掩膜工程产品流片的企业，按流片费用的30%给予最高500万元奖励。',
          batches:[
            { name:'2026年度', start:'2026-10-05', end:'2026-10-25' }
          ] },
        { id:'CQ_ZZX',   name:'重庆市中小微企业转型升级补贴', dept:'重庆市经济和信息化委员会', level:'市级', industry:'通用', policyType:'declaration',
          region:{ province:'重庆市', city:'', district:'' },
          effective:'2023-09-01', expire:'',
          conditions:[{type:'revenue',op:'>=',val:500}],
          content:'重庆市经信委支持中小微企业实施智能化改造与转型升级，对符合条件的技改项目给予补贴。\n\n一、支持对象\n在重庆市注册、年营业收入不低于500万元的中小微工业企业。\n\n二、支持标准\n按项目设备投资额的15%给予最高100万元补贴。',
          batches:[
            { name:'2026年度', start:'2026-09-15', end:'2026-10-12' }
          ] },
        { id:'XA_RD',    name:'西安市企业研发机构建设补贴', dept:'西安市科学技术局', level:'市级', industry:'信息技术', policyType:'declaration',
          region:{ province:'陕西省', city:'西安市', district:'' },
          effective:'2024-03-01', expire:'',
          conditions:[{type:'projectInvest',op:'>=',val:150}],
          content:'西安市科技局鼓励企业建设市级工程技术研究中心和企业研发中心，对新认定机构给予补贴。\n\n一、认定条件\n企业上年度研发项目投入不低于150万元，研发人员占职工总数比例不低于10%。\n\n二、支持标准\n对新认定的市级企业研发机构给予50万元一次性建设补贴。',
          batches:[
            { name:'2026年度认定', start:'2026-10-10', end:'2026-11-10' }
          ] },
        { id:'HZ_ZXT',   name:'杭州市专精特新中小企业培育奖励', dept:'杭州市经济和信息化局', level:'市级', industry:'信息技术', policyType:'declaration',
          region:{ province:'浙江省', city:'杭州市', district:'' },
          effective:'2024-05-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:3}],
          content:'杭州市经信局对纳入专精特新培育库的企业给予分档奖励，推动中小企业走专业化发展道路。\n\n一、培育条件\n企业在杭注册经营三年以上，上年度研发投入强度不低于3%，主导产品在细分市场占有率位居前列。\n\n二、奖励标准\n对首次认定为省级专精特新中小企业的给予30万元奖励，专精特新“小巨人”企业给予100万元奖励。',
          batches:[
            { name:'2026年度', start:'2026-10-01', end:'2026-10-31' }
          ] },
        { id:'WH_AI',    name:'武汉市人工智能产业应用奖励', dept:'武汉市经济和信息化局', level:'市级', industry:'信息技术', policyType:'declaration',
          region:{ province:'湖北省', city:'武汉市', district:'' },
          effective:'2025-03-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:100}],
          content:'武汉市经信局推动人工智能技术与实体经济融合，对示范应用项目给予奖励。\n\n一、支持对象\n在武汉市注册、上年度研发投入不低于100万元，开展人工智能融合应用的企业。\n\n二、支持标准\n按项目投入的30%给予最高200万元奖励，单个企业每年限报一个项目。',
          batches:[
            { name:'2026年度', start:'2026-10-15', end:'2026-11-15' }
          ] },
        { id:'JS_SKD',   name:'江苏省苏科贷风险补偿备选库入库', dept:'江苏省科学技术厅', level:'省级', industry:'通用', policyType:'declaration',
          region:{ province:'江苏省', city:'', district:'' },
          effective:'2023-01-01', expire:'',
          conditions:[{type:'revenue',op:'>=',val:1000}],
          content:'江苏省科技厅设立苏科贷风险补偿资金池，引导合作银行为科技型中小企业提供低息贷款。\n\n一、入库条件\n在江苏省内注册、年销售收入不低于1000万元，具有研发活动的科技型企业。\n\n二、支持方式\n入库企业可获得单户最高1000万元、利率不超过LPR+50BP的信用贷款支持。',
          batches:[
            { name:'2026年第三批', start:'2026-09-01', end:'2026-10-09' }
          ] },
        { id:'HN_JCS',   name:'长沙市工程技术研究中心认定', dept:'长沙市科学技术局', level:'市级', industry:'高端装备', policyType:'declaration',
          region:{ province:'湖南省', city:'长沙市', district:'' },
          effective:'2024-01-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:3},{type:'ipOwned',op:'==',val:true}],
          content:'长沙市科技局开展市级工程技术研究中心认定，强化企业创新平台建设。\n\n一、认定条件\n企业上年度研发投入强度不低于3%，拥有自主知识产权，研发场地与设备满足研发需要。\n\n二、支持政策\n对新认定的市级工程中心给予20万元组建经费支持，并优先推荐省级平台申报。',
          batches:[
            { name:'2026年度认定', start:'2026-10-06', end:'2026-10-22' }
          ] },
        { id:'NATION_GREEN', name:'国家级绿色工厂名单评价', dept:'工业和信息化部', level:'国家级', industry:'高端装备', policyType:'declaration',
          region:{ province:'全国', city:'', district:'' },
          effective:'2024-02-01', expire:'',
          conditions:[{type:'rdRatio',op:'>=',val:3}],
          content:'工信部依据《绿色工厂评价通则》组织开展国家级绿色工厂遴选，入选企业纳入绿色制造名单并享受配套政策支持。\n\n一、评价条件\n企业依法设立、近三年无重大安全环保违法记录，单位产品能耗达到行业先进值，研发投入强度不低于3%。\n\n二、支持措施\n入选国家级绿色工厂后，可在工业转型升级资金、绿色信贷等方面获得优先支持。',
          batches:[
            { name:'2026年度推荐', start:'2026-09-01', end:'2026-10-18' }
          ] },
        { id:'GD_GCGX',  name:'广东省工程技术研究开发中心认定', dept:'广东省科学技术厅', level:'省级', industry:'信息技术', policyType:'declaration',
          region:{ province:'广东省', city:'', district:'' },
          effective:'2024-04-01', expire:'',
          conditions:[{type:'rdInvest',op:'>=',val:200}],
          content:'广东省科技厅组织省级工程技术研究开发中心认定，支持企业建立高水平研发平台。\n\n一、认定条件\n企业在广东省内注册、上年度研发投入不低于200万元，拥有相对固定的研发团队和场地设备。\n\n二、支持政策\n对新认定的省级工程中心，各地市给予20-100万元配套经费支持，并优先承担省级科技计划项目。',
          batches:[
            { name:'2026年度认定', start:'2026-10-12', end:'2026-11-20' }
          ] },
        // === 以下为通知/公告类政策（无申报批次，用于区分展示） ===
        { id:'NOTICE_202602', name:'关于印发《优质中小企业梯度培育管理办法》的通知', dept:'工业和信息化部', level:'国家级', industry:'通用', policyType:'notice',
          region:{ province:'全国', city:'', district:'' },
          effective:'2026-02-10', expire:'', conditions:[],
          content:'为贯彻落实党中央、国务院关于促进中小企业发展的决策部署，加强优质中小企业梯度培育，推动中小企业高质量发展，工业和信息化部制定了《优质中小企业梯度培育管理办法》，现印发给你们，请认真贯彻执行。\n\n本办法所称优质中小企业，是指创新能力强、专注细分市场、成长性好的中小企业，包括创新型中小企业、专精特新中小企业和专精特新"小巨人"企业三个层次。\n\n一、创新型中小企业\n创新型中小企业是指具有较高专业化水平、较强创新能力和发展潜力的中小企业。评价标准由省级中小企业主管部门制定并组织实施。\n\n二、专精特新中小企业\n专精特新中小企业是指专业化、精细化、特色化、新颖化特征明显，创新能力强、发展质量好的中小企业。认定标准由工业和信息化部另行制定。\n\n三、专精特新"小巨人"企业\n专精特新"小巨人"企业是指专精特新中小企业中，主营业务突出、竞争能力强、成长性好、专注于细分市场的"单打冠军"企业。认定标准由工业和信息化部另行制定。\n\n本办法自印发之日起施行。' },
        { id:'NOTICE_202603', name:'财政部 税务总局关于进一步完善研发费用税前加计扣除政策的公告', dept:'财政部 税务总局', level:'国家级', industry:'通用', policyType:'notice',
          region:{ province:'全国', city:'', district:'' },
          effective:'2026-03-05', expire:'', conditions:[],
          content:'为进一步激励企业加大研发投入，支持科技创新，财政部、国家税务总局现就企业研发费用税前加计扣除政策有关问题公告如下：\n\n一、企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，自2026年1月1日起，再按照实际发生额的120%在税前加计扣除；形成无形资产的，按照无形资产成本的240%在税前摊销。\n\n二、本公告所称研发费用，是指企业开展研发活动中实际发生的与研发活动直接相关的各项费用，具体范围按照现有规定执行。\n\n三、本公告自2026年1月1日起执行。此前发布的相关规定与本公告不一致的，以本公告为准。' },
        { id:'NOTICE_SC_202601', name:'四川省经济和信息化厅关于开展专精特新"小巨人"企业培育工作的通知', dept:'四川省经济和信息化厅', level:'省级', industry:'通用', policyType:'notice',
          region:{ province:'四川省', city:'', district:'' },
          effective:'2026-01-28', expire:'', conditions:[],
          content:'四川省经济和信息化厅就开展专精特新"小巨人"企业培育工作通知如下：\n\n一、培育目标\n"十四五"期间，力争全省专精特新"小巨人"企业数量达到200家以上。\n\n二、培育重点\n聚焦全省特色优势产业，重点培育新一代信息技术、高端装备、新材料、新能源、航空航天等领域的专精特新"小巨人"企业。\n\n三、工作安排\n各市（州）经信局负责组织本地区企业申报，省经济和信息化厅将组织专家评审并公示。具体申报时间和要求另行通知。\n\n请各市（州）经信局高度重视，认真组织好本地区的培育申报工作。' }
    ];

    /** 规整单条政策（含申报批次、所属地区、显式类型） */
    function _normalizePolicy(p) {
        var rg = (p.region && typeof p.region === 'object') ? p.region : {};
        var province = rg.province || (p.level === '国家级' ? '全国' : '四川省');
        // policyType：优先用显式字段；旧数据无此字段时，按 batches/conditions 推断
        var policyType = p.policyType;
        if (!policyType) {
            var hasBatches = Array.isArray(p.batches) && p.batches.length > 0;
            var hasConds = Array.isArray(p.conditions) && p.conditions.length > 0;
            policyType = (hasBatches || hasConds) ? 'declaration' : 'notice';
        }
        // 保留调用方已有字段（如 docNo / infoType / source / _ai），避免保存后字段丢失
        return Object.assign({}, p, {
            id: p.id,
            name: p.name,
            dept: p.dept || '',
            level: p.level || '国家级',
            industry: p.industry || '',
            policyType: policyType,
            // 上架状态：draft 草稿 | published 已发布 | offline 已下架（旧数据默认已发布）
            status: (p.status === 'pending' ? 'published' : (p.status || 'published')),
            // 来源：contrib 企业贡献 | manual 手动新增 | crawler 自动采集（旧数据按标记回退）
            sourceType: p.sourceType || (p._contrib ? 'contrib' : 'manual'),
            region: {
                province: province,
                city: rg.city || '',
                district: rg.district || ''
            },
            effective: p.effective || '',
            expire: p.expire || '',
            content: p.content || '',
            conditions: Array.isArray(p.conditions) ? p.conditions : [],
            batches: Array.isArray(p.batches)
                ? p.batches.filter(function(b){ return b && b.end; })
                    .map(function(b){ return { name: b.name || '申报批次', start: b.start || '', end: b.end || '' }; })
                : []
        });
    }

    /** 读取政策库（旧数据无 batches 时，按政策 id 合并默认批次做一次迁移；缺 region 时按默认种子补齐；新增默认种子自动追加） */
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
        // 旧版本数据：政策缺 region 字段时，用默认种子的地区按 id 补齐（惰性内存迁移，后台保存时才持久化）
        const defaultRegionMap = {};
        DEFAULT_POLICY_LIBRARY.forEach(function(p){ defaultRegionMap[p.id] = p.region; });
        const result = src.map(function(p) {
            var np = _normalizePolicy(p);
            if (needBatchMerge && defaultBatchMap[p.id] && np.batches.length === 0) {
                np.batches = defaultBatchMap[p.id].map(function(b){ return { name:b.name, start:b.start, end:b.end }; });
            }
            if (!p.region && defaultRegionMap[p.id]) {
                np.region = { province: defaultRegionMap[p.id].province, city: defaultRegionMap[p.id].city, district: defaultRegionMap[p.id].district };
            }
            return np;
        });
        // 追加默认种子中新增的政策（用户已有旧数据时也能看到新种子，不覆盖用户自建政策）
        const existingIds = new Set(result.map(function(p){ return p.id; }));
        DEFAULT_POLICY_LIBRARY.forEach(function(p){
            if (!existingIds.has(p.id)) result.push(_normalizePolicy(p));
        });
        return result;
    }

    /** 保存政策库 */
    function savePolicyLibrary(list) {
        if (!Array.isArray(list)) return false;
        const cleaned = list.filter(p => p && p.id && p.name).map(_normalizePolicy);
        return _write(KEYS.POLICY_LIBRARY, cleaned);
    }

    // ========== 自动采集源配置 ==========
    const CRAWLER_SCOPES = ['政策发布', '申报通知', '公示公告', '政策解读'];
    const DEFAULT_CRAWLER_SOURCES = [
        { id: 'S01', name: '科技部官网', type: 'RSS 订阅', url: 'www.most.gov.cn', scope: CRAWLER_SCOPES.slice(), freq: '每小时', keywords: '', enabled: true, status: 'ok', lastAt: '10-12 08:00', today: 2 },
        { id: 'S02', name: '工信部官网', type: '爬虫', url: 'www.miit.gov.cn', scope: CRAWLER_SCOPES.slice(), freq: '每小时', keywords: '', enabled: true, status: 'ok', lastAt: '10-12 08:00', today: 1 },
        { id: 'S03', name: '省科技厅', type: '爬虫', url: 'kjt.zj.gov.cn', scope: ['政策发布', '申报通知', '公示公告'], freq: '每天', keywords: '', enabled: true, status: 'ok', lastAt: '10-12 07:30', today: 3 },
        { id: 'S04', name: '市科技局 / 发改委', type: 'RSS 订阅', url: 'kjj.hz.gov.cn', scope: ['申报通知', '公示公告'], freq: '每 6 小时', keywords: '', enabled: true, status: 'warn', lastAt: '10-11 22:00', today: 0 }
    ];
    /** 读取采集源配置（未配置时返回默认源） */
    function loadCrawlerSources() {
        const data = _read(KEYS.CRAWLER_SOURCES, null);
        const src = Array.isArray(data) ? data : DEFAULT_CRAWLER_SOURCES;
        return src.filter(s => s && s.id).map(s => ({
            id: s.id,
            name: s.name || '',
            type: s.type === 'RSS 订阅' ? 'RSS 订阅' : '爬虫',
            url: s.url || '',
            scope: (Array.isArray(s.scope) && s.scope.length) ? s.scope.filter(x => CRAWLER_SCOPES.indexOf(x) > -1) : CRAWLER_SCOPES.slice(),
            freq: s.freq || '每小时',
            keywords: s.keywords || '',
            enabled: s.enabled !== false,
            status: s.status === 'warn' ? 'warn' : 'ok',
            lastAt: s.lastAt || '',
            today: Number(s.today) || 0
        }));
    }
    /** 保存采集源配置 */
    function saveCrawlerSources(list) {
        if (!Array.isArray(list)) return false;
        return _write(KEYS.CRAWLER_SOURCES, list);
    }

    // ========== 企业画像字典（所属产业 / 企业资质） ==========
    const DEFAULT_IND_DICT = ['信息技术','大数据','云计算','软件产业','算法算力','人工智能','脑科学与类脑智能','互联网','电子商务','区块链','元宇宙','量子信息','数字创意','电子竞技','电子技术','半导体与集成电路','5G/6G产业','智能终端','智能机器人','智能传感器','超高清视频显示','网络与通信','可见光通信与光计算','物联网','智能网联汽车','汽车制造业','新能源','节能环保','基因技术','合成生物','生物医药','高端医疗器械','大健康','精密仪器设备','工业母机和装备制造','航空航天','低空经济','海洋产业','深海深海','新材料','激光与增材制造','化学化工','现代农业','采矿业','建筑业','现代物流','贸易与供应链','现代时尚','黄金珠宝','文化产业','体育产业','旅游服务业','教育服务业','高校/研究机构','社会组织/商协会','安全应急预警','军民融合','专业技术服务','检验检测','商务服务业','信用服务业','法律服务','金融业','产业运营','家政服务','其他产业'];
    const DEFAULT_QUAL_DICT = ['高新技术企业','专精特新中小企业','专精特新"小巨人"企业','科技型中小企业','创新型中小企业','单项冠军','技术中心','工业设计中心','工程技术中心','工程实验室','重点实验室','院士专家工作站','博士后工作站','制造业创新中心','技术创新示范企业','获得科研立项/大赛奖励','参展企业','总部企业','参与标准化工作','技术先进型服务企业','工业设计奖','重点软件企业','工业互联网企业','中小企业公共服务示范平台','市科学技术奖','中国500强','世界500强','著名商标','驰名商标','知名品牌','老字号'];
    function _normDict(list, fallback) {
        const arr = Array.isArray(list) && list.length ? list : fallback;
        return arr.filter(function(it) { return it && String(it.name || '').trim(); }).map(function(it) {
            return { name: String(it.name).trim(), enabled: it.enabled !== false };
        });
    }
    /** 读取企业画像字典（未配置时返回默认字典） */
    function loadProfileDict() {
        const data = _read(KEYS.PROFILE_DICT, null) || {};
        return {
            industries: _normDict(data.industries, DEFAULT_IND_DICT.map(function(n) { return { name: n, enabled: true }; })),
            qualifications: _normDict(data.qualifications, DEFAULT_QUAL_DICT.map(function(n) { return { name: n, enabled: true }; }))
        };
    }
    /** 保存企业画像字典 */
    function saveProfileDict(dict) {
        if (!dict) return false;
        const d = loadProfileDict();
        return _write(KEYS.PROFILE_DICT, {
            industries: _normDict(dict.industries, d.industries),
            qualifications: _normDict(dict.qualifications, d.qualifications)
        });
    }

    /** 内部：把旧结构（按页签存的 labels）拍平为统一字段分组 */
    function _legacyFields(rec) {
        const groups = [];
        const labels = rec.labels || {};
        Object.keys(labels).forEach(function(k) {
            (labels[k] || []).forEach(function(g) { groups.push(g); });
        });
        return groups;
    }

    /** 内部：读取企业档案记录列表（兼容早期按页签存储的结构） */
    function _loadEnterpriseRecords() {
        const d = _read(KEYS.ENTERPRISE_PROFILE, null);
        if (!d) return [];
        let list = [];
        if (Array.isArray(d.records)) {
            list = d.records;
        } else if (d.tabs && typeof d.tabs === 'object') {
            // 旧结构：{ tabs: { 页签: { name, labels/fields, inputs } } }
            Object.keys(d.tabs).forEach(function(k) {
                const v = d.tabs[k];
                if (v && typeof v === 'object') list.push(Object.assign({ id: 'ent_' + k }, v));
            });
            if (!list.length) list = [d];
        } else {
            list = [d];
        }
        const out = list.map(function(r) {
            return {
                id: r.id || 'ent_legacy',
                name: String(r.name || '').trim(),
                fields: Array.isArray(r.fields) ? r.fields : _legacyFields(r),
                inputs: r.inputs || {},
                createdAt: r.createdAt || r.updatedAt || '',
                updatedAt: r.updatedAt || ''
            };
        });
        // 旧数据同一企业可能按页签存了多条，读取时按名称合并为一条
        const merged = [];
        out.forEach(function(rec) {
            const same = rec.name ? merged.find(function(x) { return x.name === rec.name; }) : null;
            if (!same) { merged.push(rec); return; }
            same.fields = _mergeFields(same.fields, rec.fields);
            same.inputs = _mergeInputs(same.inputs, rec.inputs);
            if (String(rec.updatedAt) > String(same.updatedAt)) same.updatedAt = rec.updatedAt;
        });
        return merged;
    }

    /** 内部：字段级合并（同名同义字段覆盖，新字段追加，空值不覆盖） */
    function _mergeFields(existing, incoming) {
        // 跨模块同义字段/分组归并，避免雷达与测评各存一份
        const ALIAS = { '企业名称': '企业全称', '核心技术所属产业': '所属行业' };
        const GROUP_ALIAS = { '基本信息': '基本情况' };
        const canonLabel = function (l) { return ALIAS[l] || l; };
        const canonGroup = function (g) { return GROUP_ALIAS[g] || g; };
        const groups = (Array.isArray(existing) ? existing : []).map(function(g) {
            return { group: g.group, items: (g.items || []).map(function(it) { return { label: it.label, value: it.value }; }) };
        });
        (Array.isArray(incoming) ? incoming : []).forEach(function(g) {
            if (!g) return;
            (g.items || []).forEach(function(it) {
                if (!it) return;
                const val = String(it.value === undefined || it.value === null ? '' : it.value).trim();
                if (!val || val === '未选择') return;
                const label = canonLabel(it.label);
                // 先按字段名全表匹配：同名同义字段直接覆盖，不因分组名不同而重复
                let old = null;
                groups.some(function(x) {
                    const hit = x.items.find(function(y) { return canonLabel(y.label) === label; });
                    if (hit) { old = hit; return true; }
                    return false;
                });
                if (old) { old.value = val; return; }
                // 无同名字段则追加到对应分组（分组名做同义归并）
                let target = groups.find(function(x) { return canonGroup(x.group) === canonGroup(g.group); });
                if (!target) {
                    target = { group: g.group || '其他', items: [] };
                    groups.push(target);
                }
                target.items.push({ label: label, value: val });
            });
        });
        return groups.filter(function(g) { return g.items && g.items.length; });
    }

    /** 内部：原始字段合并（新值非空才覆盖） */
    function _mergeInputs(existing, incoming) {
        const out = Object.assign({}, existing || {});
        Object.keys(incoming || {}).forEach(function(k) {
            const v = incoming[k];
            const empty = v === undefined || v === null || v === '' ||
                (Array.isArray(v) && !v.length);
            if (!empty) out[k] = v;
        });
        return out;
    }

    /** 读取企业档案列表（按最近更新倒序，供运营后台「企业档案」列表使用） */
    function loadEnterpriseList() {
        return _loadEnterpriseRecords().slice().sort(function(a, b) {
            return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
        });
    }

    /** 读取单个企业档案：传 id / 企业名称，不传则返回最近更新的一条（供政策雷达/申报管家等模块调取） */
    function loadEnterpriseProfile(key) {
        const list = loadEnterpriseList();
        const k = String(key === undefined || key === null ? '' : key).trim();
        const rec = k
            ? list.find(function(r) { return r.id === key || r.name === k; })
            : list[0];
        return rec
            ? { id: rec.id, name: rec.name || '', fields: rec.fields || [], inputs: rec.inputs || {}, updatedAt: rec.updatedAt || '' }
            : { id: '', name: '', fields: [], inputs: {}, updatedAt: '' };
    }

    /** 保存企业档案：同一企业按名称合并，字段级更新（后填的非空字段覆盖，新字段追加） */
    function saveEnterpriseProfile(payload) {
        if (!payload) return false;
        const list = _loadEnterpriseRecords();
        const name = String(payload.name || '').trim();
        let rec = payload.id ? list.find(function(r) { return r.id === payload.id; }) : null;
        if (!rec && name) rec = list.find(function(r) { return r.name === name; });
        if (!rec && !name) return false; // 名称为空不建档
        if (!rec) {
            rec = { id: 'ent_' + Date.now().toString(36), name: name, fields: [], inputs: {}, createdAt: new Date().toISOString(), updatedAt: '' };
            list.push(rec);
        }
        if (name) rec.name = name;
        rec.fields = _mergeFields(rec.fields, payload.fields);
        rec.inputs = _mergeInputs(rec.inputs, payload.inputs);
        rec.updatedAt = new Date().toISOString();
        const records = list.map(function(r) {
            return { id: r.id, name: r.name, fields: r.fields, inputs: r.inputs, createdAt: r.createdAt, updatedAt: r.updatedAt };
        });
        return _write(KEYS.ENTERPRISE_PROFILE, { records: records });
    }

    /** 删除企业档案 */
    function deleteEnterpriseProfile(id) {
        const list = _loadEnterpriseRecords().filter(function(r) { return r.id !== id; });
        return _write(KEYS.ENTERPRISE_PROFILE, { records: list });
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
          process:[{t:'合同签订',d:'付款后签署服务合同'},{t:'需求评估',d:'评估企业情况与申报条件'},{t:'方案制定',d:'定制申报方案'},{t:'材料准备',d:'撰写审核材料'},{t:'提交申报',d:'专家预审答辩'},{t:'跟踪维护',d:'后续政策服务'}],
          cases:[{company:'某智能制造有限公司',year:'2023年成功认定 · 国家级',result:'通过本服务完成高新技术企业认定，获得税收减免优惠累计320万元，并成功获得政府补贴资金80万元。'},{company:'某生物医药科技公司',year:'2023年成功认定 · 国家级',result:'知识产权布局由3项提升至15项，研发费用归集规范化，顺利通过评审。'}] },
        { id:'SVC002', name:'专精特新企业申报一站式服务', category:'申报代理', provider:'华策企业咨询服务有限公司', price:32000, oldPrice:45000, rating:4.8, sales:860, icon:'fa-star-o', status:'on', featured:true,
          desc:'梯度培育规划+全案撰写+答辩辅导，三年跟踪维护，助力企业迈入专精特新行列。',
          tags:['金牌服务','品质保证'],
          includes:['专精特新资质评估','梯度培育规划','申报材料全案撰写','专家内审与答辩','政策解读与培训','三年跟踪维护'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'资质评估',d:'对标评价体系出具评估表'},{t:'梯度规划',d:'制定梯度培育路径'},{t:'材料撰写',d:'全案申报材料编制'},{t:'内审答辩',d:'专家模拟评审'},{t:'跟踪维护',d:'三年持续跟踪服务'}],
          cases:[{company:'某精密制造企业',year:'2024年成功认定 · 省级专精特新',result:'补齐研发管理短板，主导产品细分市场占有率进入全省前列，一次性通过认定。'}] },
        { id:'SVC003', name:'发明专利快速预审服务', category:'知识产权', provider:'知产天下知识产权代理', price:8500, oldPrice:12000, rating:4.9, sales:2156, icon:'fa-shield', status:'on', featured:true,
          desc:'对接快速预审通道，3-6个月快速授权，专业代理人全程跟进审查意见答复。',
          tags:['限时特惠'],
          includes:['专利技术挖掘与检索','专利申请文件撰写','快速预审通道申请','审查意见答复','3-6个月快速授权','授权后年费管理'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'技术挖掘',d:'检索分析创新点'},{t:'文件撰写',d:'代理人撰写申请文件'},{t:'快速预审',d:'提交保护中心预审'},{t:'审查答复',d:'跟进审查意见答复'},{t:'授权管理',d:'授权通知与年费监控'}],
          cases:[{company:'某电子信息科技公司',year:'2024年 · 6件发明专利',result:'通过快速预审通道，6件核心专利平均4个月获得授权，有效支撑高企申报。'}] },
        { id:'SVC004', name:'科技型中小企业评价申报', category:'申报代理', provider:'北京科创服务咨询', price:6800, oldPrice:9800, rating:4.8, sales:856, icon:'fa-pencil-square-o', status:'on', featured:false,
          includes:['入库条件自评','材料整理与填报','系统提交与跟踪','评价结果跟进'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'条件自评',d:'对标科技型中小企业评价指标'},{t:'信息填报',d:'系统填报与佐证材料整理'},{t:'提交审查',d:'提交评价工作机构形式审查'},{t:'公示入库',d:'跟踪公示并取得入库编号'}] },
        { id:'SVC005', name:'软件著作权登记代理', category:'知识产权', provider:'知产天下知识产权代理', price:1200, oldPrice:1800, rating:4.9, sales:2156, icon:'fa-copyright', status:'on', featured:false,
          includes:['源代码与文档整理','软著申请材料撰写','加急/普通通道办理','证书邮寄与归档'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'材料整理',d:'源代码与操作说明书整理'},{t:'在线申报',d:'向版权保护中心提交申请'},{t:'审查补正',d:'跟进受理审查与补正'},{t:'发证交付',d:'电子/纸质登记证书交付'}] },
        { id:'SVC006', name:'年度财务审计报告', category:'财务审计', provider:'华信会计师事务所', price:5500, oldPrice:7500, rating:4.7, sales:643, icon:'fa-calculator', status:'on', featured:false,
          includes:['账务梳理与调整','现场审计与取证','出具年度审计报告','税务师复核'],
          process:[{t:'合同签订',d:'签署审计业务约定书'},{t:'资料准备',d:'发送审计资料清单并收取资料'},{t:'现场审计',d:'进场审计、抽凭与函证'},{t:'报告出具',d:'出具年度财务审计报告'},{t:'报告交付',d:'盖章报告交付与归档'}] },
        { id:'SVC007', name:'技术合同认定登记', category:'技术转移', provider:'科转桥技术转移服务', price:3200, oldPrice:4500, rating:4.6, sales:423, icon:'fa-exchange', status:'on', featured:false,
          includes:['技术合同合规审核','认定登记材料准备','科技部门提交代办','税收减免备案指导'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'合同梳理',d:'梳理技术合同条款与标的'},{t:'材料申报',d:'线上提交认定登记材料'},{t:'审核跟进',d:'跟进部门审核与补正'},{t:'登记证明',d:'取得技术合同认定登记证明'}] },
        { id:'SVC008', name:'产品质检报告服务', category:'检验检测', provider:'中检集团检测中心', price:2800, oldPrice:3800, rating:4.8, sales:982, icon:'fa-flask', status:'on', featured:false,
          includes:['检测标准确认','样品送检与测试','CMA/CNAS报告出具','报告加急服务'],
          process:[{t:'合同签订',d:'签署委托检测协议'},{t:'样品确认',d:'确认检测项目、标准与送样'},{t:'实验室检测',d:'进场检测与试验分析'},{t:'报告编制',d:'编制并三级审核质检报告'},{t:'报告交付',d:'CMA/CNAS盖章报告交付'}] },
        { id:'SVC009', name:'研发费用加计扣除咨询', category:'政策咨询', provider:'税智通财税咨询', price:4500, oldPrice:6500, rating:4.9, sales:736, icon:'fa-file-text-o', status:'on', featured:false,
          includes:['研发项目立项辅导','研发费用归集建账','辅助账体系搭建','汇算清缴申报支持'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'账务诊断',d:'诊断研发费用归集现状'},{t:'辅助账搭建',d:'建立研发费用辅助账体系'},{t:'资料申报',d:'准备汇算清缴与备查资料'},{t:'申报跟踪',d:'跟踪备案申报与后续核查'}] },
        { id:'SVC010', name:'专精特新企业申报（标准档）', category:'申报代理', provider:'北京科创服务咨询', price:12800, oldPrice:18000, rating:4.8, sales:524, icon:'fa-pencil-square-o', status:'on', featured:false,
          includes:['基础条件评估','申报材料撰写','系统提交跟踪','一次补正服务'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'资质评估',d:'对标专精特新基础条件'},{t:'材料撰写',d:'标准档申报材料编制'},{t:'内审提交',d:'内部审核后系统提交'},{t:'结果跟踪',d:'跟踪认定公示结果'}] },
        { id:'SVC011', name:'商标注册全程代理', category:'知识产权', provider:'知产天下知识产权代理', price:880, oldPrice:1200, rating:4.7, sales:3256, icon:'fa-copyright', status:'on', featured:false,
          includes:['商标近似查询','申请类别规划','商标申报与受理','驳回/异议应对'],
          process:[{t:'合同签订',d:'签署委托代理协议'},{t:'商标查询',d:'近似检索与注册风险评估'},{t:'类别规划',d:'确定申报类别与方案'},{t:'提交申请',d:'向商标局在线提交'},{t:'审查跟进',d:'跟进受理、审查与答复'},{t:'注册交付',d:'商标注册证交付'}] },
        { id:'SVC012', name:'高新技术企业审计', category:'财务审计', provider:'华信会计师事务所', price:8800, oldPrice:12000, rating:4.9, sales:456, icon:'fa-calculator', status:'on', featured:false,
          includes:['研发费用专项审计','高新技术产品收入审计','专项审计报告出具','申报配套财务指导'],
          process:[{t:'合同签订',d:'签署审计业务约定书'},{t:'资料准备',d:'发送研发费审计资料清单'},{t:'专项审计',d:'研发费用与高新收入专项审计'},{t:'报告出具',d:'出具专项审计报告'},{t:'报告交付',d:'盖章报告交付与申报配套指导'}] },
        { id:'SVC013', name:'知识产权贯标（IPMS）辅导', category:'政策咨询', provider:'华策企业咨询服务有限公司', price:15800, oldPrice:0, rating:0, sales:0, icon:'fa-certificate', status:'draft', featured:false,
          includes:['贯标差距分析','体系文件搭建','内审员培训','认证审核对接'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'现状诊断',d:'诊断知识产权管理现状'},{t:'体系搭建',d:'建立知识产权管理体系文件'},{t:'运行辅导',d:'辅导体系运行与内部审核'},{t:'认证审核',d:'对接第三方认证现场审核'},{t:'取证交付',d:'取得IPMS贯标认证证书'}] },
        { id:'SVC014', name:'创新型中小企业评价（旧版）', category:'申报代理', provider:'科转桥技术转移服务', price:3000, oldPrice:4000, rating:4.5, sales:312, icon:'fa-pencil-square-o', status:'off', featured:false,
          includes:['旧版评价申报','已并入专精特新梯度培育'],
          process:[{t:'合同签订',d:'签署服务合同'},{t:'条件自评',d:'对标创新型中小企业评价条件'},{t:'材料填报',d:'系统填报与材料整理'},{t:'提交审核',d:'提交主管部门审核'},{t:'结果跟踪',d:'跟踪公告结果'}] }
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
            // 流程节点迁移：旧版首个节点为"需求沟通"或缺少"合同签订"节点时，升级为内置最新流程
            let proc = Array.isArray(p.process) ? p.process : (Array.isArray(d.process) ? d.process : []);
            if (d.process && proc.length && (proc[0].t === '需求沟通' || !proc.some(s => s.t === '合同签订'))) {
                proc = d.process;
            }
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
                process: proc,
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
          amount:18800, status:'serving', payMethod:'微信支付', createTime:'2026-09-01 14:22', company:'绿能新能源科技有限公司', contact:'陈志远', phone:'139****8899', progress:50, rating:0 },
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
          amount:5500, status:'unpaid', payMethod:'', createTime:'2026-09-03 15:52', company:'恒泰机械制造有限公司', contact:'刘会计', phone:'137****2233', progress:0, rating:0 },
        // —— 与「用户管理」演示客户对应的订单（客户详情抽屉展示消费记录） ——
        { id:'FW20260908011', svcId:'SVC001', svcName:'高新技术企业认定全程辅导', provider:'北京中科创服咨询有限公司', icon:'fa-trophy', category:'政策咨询',
          amount:18800, status:'serving', payMethod:'微信支付', createTime:'2026-09-08 10:12', company:'星河智造科技有限公司', contact:'王明华', phone:'138****8688', progress:40, rating:0 },
        { id:'FW20260826012', svcId:'SVC009', svcName:'研发费用加计扣除咨询', provider:'税智通财税咨询', icon:'fa-file-text-o', category:'政策咨询',
          amount:4500, status:'reviewed', payMethod:'支付宝', createTime:'2026-08-26 15:47', company:'星河智造科技有限公司', contact:'王明华', phone:'138****8688', progress:100, rating:5,
          reviewText:'专家团队很专业，研发费用辅助账梳理得很清楚，加计扣除顺利通过。', reviewTime:'2026-08-30 09:20', replyText:'感谢认可！后续高企复审如有需要欢迎随时联系。', replyTime:'2026-08-30 11:05' },
        { id:'FW20260905013', svcId:'SVC002', svcName:'专精特新企业申报一站式服务', provider:'华策企业咨询服务有限公司', icon:'fa-star-o', category:'申报代理',
          amount:32000, status:'serving', payMethod:'对公转账', createTime:'2026-09-05 14:30', company:'康泰生物制药有限公司', contact:'李建国', phone:'139****2266', progress:25, rating:0 },
        { id:'FW20260912014', svcId:'SVC005', svcName:'软件著作权登记代理', provider:'知产天下知识产权代理', icon:'fa-copyright', category:'知识产权',
          amount:1200, status:'done', payMethod:'微信支付', createTime:'2026-09-12 11:05', company:'锐达新材料股份公司', contact:'陈晓敏', phone:'137****6699', progress:100, rating:0 },
        { id:'FW20260929015', svcId:'SVC011', svcName:'商标注册全程代理', provider:'知产天下知识产权代理', icon:'fa-copyright', category:'知识产权',
          amount:880, status:'unpaid', payMethod:'', createTime:'2026-09-29 20:18', company:'', contact:'张小明', phone:'138****1234', progress:0, rating:0 }
    ];

    // ========== 购物车（加入购物车→结算生成订单） ==========
    /** 读取购物车 */
    function loadCart() {
        const data = _read(KEYS.SERVICE_CART, null);
        if (!data || !Array.isArray(data)) return [];
        return data.map(c => ({
            cartId: c.cartId || ('cart_' + Date.now() + Math.random().toString(36).slice(2,6)),
            svcId: c.svcId || '',
            svcName: c.svcName || '',
            provider: c.provider || '',
            icon: c.icon || 'fa-file-text-o',
            category: c.category || '',
            price: Number(c.price) || 0,
            qty: Number(c.qty) || 1,
            addTime: c.addTime || ''
        }));
    }
    /** 保存购物车 */
    function saveCart(list) {
        if (!Array.isArray(list)) return false;
        return _write(KEYS.SERVICE_CART, list);
    }
    /** 加入购物车（同服务累加数量） */
    function addToCart(item) {
        const list = loadCart();
        const exist = list.find(c => c.svcId === item.svcId);
        if (exist) {
            exist.qty += Number(item.qty) || 1;
        } else {
            list.unshift({
                cartId: 'cart_' + Date.now() + Math.random().toString(36).slice(2,6),
                svcId: item.svcId || '',
                svcName: item.svcName || '',
                provider: item.provider || '',
                icon: item.icon || 'fa-file-text-o',
                category: item.category || '',
                price: Number(item.price) || 0,
                qty: Number(item.qty) || 1,
                addTime: new Date().getFullYear() + '-' + String(new Date().getMonth()+1).padStart(2,'0') + '-' + String(new Date().getDate()).padStart(2,'0')
            });
        }
        saveCart(list);
        return list;
    }
    /** 从购物车移除 */
    function removeFromCart(cartId) {
        const list = loadCart().filter(c => c.cartId !== cartId);
        saveCart(list);
        return list;
    }
    /** 更新购物车数量 */
    function updateCartQty(cartId, qty) {
        const list = loadCart();
        const item = list.find(c => c.cartId === cartId);
        if (item) { item.qty = Math.max(1, Number(qty) || 1); saveCart(list); }
        return list;
    }
    /** 清空购物车 */
    function clearCart() {
        return _write(KEYS.SERVICE_CART, []);
    }

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
    // ========== 政策分享追踪（结构与报告 shares 一致；落地页 policy-viewer.html 上报浏览） ==========
    const DEFAULT_POLICY_SHARES = [
        { shareId: 'P303', policyId: 'ZHUANJIN', policyName: '专精特新企业奖励', batchName: '2026年度',
          toName: '陈志远', toPhone: '139****8899', channel: '站内推送', createdAt: '2026-10-14 16:40',
          converted: false, views: [] },
        // 站内消息演示数据：两条历史政策推送（一条未读、一条已读）
        { shareId: 'P305', policyId: 'CGZH', policyName: '科技成果转化补贴', batchName: '2026年度',
          toName: '陈志远', toPhone: '139****8899', channel: '站内推送', createdAt: '2026-10-13 11:25',
          converted: false, views: [] },
        { shareId: 'P304', policyId: 'GAOXIN', policyName: '高新技术企业认定管理办法', batchName: '2026年第三批',
          toName: '陈志远', toPhone: '139****8899', channel: '站内推送', createdAt: '2026-10-08 09:50',
          converted: false,
          views: [
              { at: '2026-10-08 14:30', durSec: 245 },
              { at: '2026-10-09 10:15', durSec: 130 }
          ] },
        // 个人账号「张三」的站内推送演示数据（一条未读、一条已读）
        { shareId: 'P306', policyId: 'LIXIANG_ZJ', policyName: '研发项目立项补贴', batchName: '2026年度',
          toName: '张三', toPhone: '136****0000', channel: '站内推送', createdAt: '2026-10-16 09:40',
          converted: false, views: [] },
        { shareId: 'P307', policyId: 'DENGLING', policyName: '瞪羚企业认定奖励', batchName: '2026年度认定',
          toName: '张三', toPhone: '136****0000', channel: '站内推送', createdAt: '2026-10-09 15:10',
          converted: false,
          views: [
              { at: '2026-10-09 20:05', durSec: 154 }
          ] },
        { shareId: 'P301', policyId: 'R&D_JJ', policyName: '研发费用加计扣除', batchName: '2026年10月预缴申报',
          toName: '陈志远', toPhone: '138****6601', channel: '外链', createdAt: '2026-10-10 14:20',
          converted: false,
          views: [
              { at: '2026-10-10 20:12', durSec: 95 },
              { at: '2026-10-12 09:40', durSec: 210 },
              { at: '2026-10-14 21:05', durSec: 66 }
          ] },
        { shareId: 'P302', policyId: 'GAOXIN', policyName: '高新技术企业认定管理办法', batchName: '2026年第三批',
          toName: '王明华', toPhone: '138****1234', channel: '站内推送', createdAt: '2026-09-26 10:05',
          converted: false,
          views: [
              { at: '2026-09-26 11:02', durSec: 185 }
          ] }
    ];
    /** 读取政策分享记录（含浏览明细）；缺失的种子分享（如站内推送 P303）幂等补入 */
    function loadPolicyShares() {
        const data = _read(KEYS.POLICY_SHARES, null);
        if (!data || !Array.isArray(data) || data.length === 0) {
            _write(KEYS.POLICY_SHARES, JSON.parse(JSON.stringify(DEFAULT_POLICY_SHARES)));
            return JSON.parse(JSON.stringify(DEFAULT_POLICY_SHARES));
        }
        var added = false;
        DEFAULT_POLICY_SHARES.forEach(function(ds) {
            var exists = false;
            for (var i = 0; i < data.length; i++) if (data[i] && data[i].shareId === ds.shareId) { exists = true; break; }
            if (!exists) { data.unshift(JSON.parse(JSON.stringify(ds))); added = true; }
        });
        if (added) _write(KEYS.POLICY_SHARES, data);
        return data;
    }
    /** 保存政策分享记录 */
    function savePolicyShares(list) {
        if (!Array.isArray(list)) return false;
        return _write(KEYS.POLICY_SHARES, list);
    }
    /** 新增一条政策分享（销售端"发起分享"调用），返回新记录 */
    function addPolicyShare(share) {
        const list = loadPolicyShares();
        const rec = {
            shareId: share.shareId, policyId: share.policyId, policyName: share.policyName,
            batchName: share.batchName || '', toName: share.toName || '', toPhone: share.toPhone || '',
            channel: share.channel || '外链', createdAt: share.createdAt || '',
            converted: false, views: []
        };
        list.unshift(rec);
        savePolicyShares(list);
        return rec;
    }

    // ========== 在线咨询消息（客户侧 policy-view 聊天窗 ↔ 销售端 H5 消息中心） ==========
    // 消息结构：{ id, customerName, policyId, policyName, shareId, from: 'customer'|'advisor', text, at, read(顾问是否已读) }
    const DEFAULT_CONSULT_MSGS = [
        { id: 'M_SEED_01', customerName: '陈志远', policyId: 'ZHUANJIN', policyName: '专精特新企业奖励', shareId: 'P303',
          from: 'customer', text: '张顾问，专精特新这条我们研发占比 4.8% 还差一点点，今年还有机会申报吗？', at: '2026-10-15 14:22', read: false },
        { id: 'M_SEED_02', customerName: '陈志远', policyId: 'ZHUANJIN', policyName: '专精特新企业奖励', shareId: 'P303',
          from: 'customer', text: '另外材料清单里"近两年审计报告"是必须的吗？我们今年的还没出。', at: '2026-10-15 14:35', read: false },
        { id: 'M_SEED_03', customerName: '张三', policyId: 'LIXIANG_ZJ', policyName: '研发项目立项补贴', shareId: 'P306',
          from: 'customer', text: '我公司下个月才注册，这个补贴到时候还能赶上一批吗？', at: '2026-10-16 09:58', read: false }
    ];
    /** 读取咨询消息（缺失的种子消息幂等补入） */
    function loadConsultMessages() {
        const data = _read(KEYS.CONSULT_MSGS, null);
        if (!data || !Array.isArray(data)) {
            _write(KEYS.CONSULT_MSGS, JSON.parse(JSON.stringify(DEFAULT_CONSULT_MSGS)));
            return JSON.parse(JSON.stringify(DEFAULT_CONSULT_MSGS));
        }
        var added = false;
        DEFAULT_CONSULT_MSGS.forEach(function(ds) {
            var exists = false;
            for (var i = 0; i < data.length; i++) if (data[i] && data[i].id === ds.id) { exists = true; break; }
            if (!exists) { data.push(JSON.parse(JSON.stringify(ds))); added = true; }
        });
        if (added) _write(KEYS.CONSULT_MSGS, data);
        return data;
    }
    /** 保存咨询消息 */
    function saveConsultMessages(list) {
        if (!Array.isArray(list)) return false;
        return _write(KEYS.CONSULT_MSGS, list);
    }
    /** 追加一条咨询消息（客户聊天窗/销售端回复调用），返回新消息 */
    function addConsultMessage(msg) {
        const list = loadConsultMessages();
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const rec = {
            id: 'M' + now.getTime() + '_' + Math.floor(Math.random() * 1000),
            customerName: msg.customerName || '访客',
            policyId: msg.policyId || '', policyName: msg.policyName || '',
            shareId: msg.shareId || '',
            from: msg.from === 'advisor' ? 'advisor' : 'customer',
            text: String(msg.text || ''),
            at: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()),
            read: msg.from === 'advisor' ? true : !!msg.read
        };
        list.push(rec);
        saveConsultMessages(list);
        return rec;
    }

    // ========== 委托申报单（客户侧 policy-view 委托表单 → 销售端 H5 消息中心处理） ==========
    // 结构：{ id, customerName, policyId, policyName, shareId, contact, phone, remark, at, status: 待处理|跟进中|已办结 }
    const DEFAULT_ENTRUSTS = [
        { id: 'WT001', customerName: '陈志远', policyId: 'ZHUANJIN', policyName: '专精特新企业奖励', shareId: 'P303',
          contact: '陈志远', phone: '139****8899', remark: '想评估一下我们研发占比 4.8% 今年能不能冲一下，顺便了解服务费用。', at: '2026-10-15 15:02', status: '待处理' },
        { id: 'WT002', customerName: '张三', policyId: 'LIXIANG_ZJ', policyName: '研发项目立项补贴', shareId: 'P306',
          contact: '张三', phone: '137****5566', remark: '公司 11 月注册下来，想先约个时间聊聊申报规划。', at: '2026-10-16 10:20', status: '跟进中' }
    ];
    /** 读取委托申报单（缺失的种子单幂等补入） */
    function loadEntrusts() {
        const data = _read(KEYS.ENTRUSTS, null);
        if (!data || !Array.isArray(data)) {
            _write(KEYS.ENTRUSTS, JSON.parse(JSON.stringify(DEFAULT_ENTRUSTS)));
            return JSON.parse(JSON.stringify(DEFAULT_ENTRUSTS));
        }
        var added = false;
        DEFAULT_ENTRUSTS.forEach(function(ds) {
            var exists = false;
            for (var i = 0; i < data.length; i++) if (data[i] && data[i].id === ds.id) { exists = true; break; }
            if (!exists) { data.push(JSON.parse(JSON.stringify(ds))); added = true; }
        });
        if (added) _write(KEYS.ENTRUSTS, data);
        return data;
    }
    /** 保存委托申报单 */
    function saveEntrusts(list) {
        if (!Array.isArray(list)) return false;
        return _write(KEYS.ENTRUSTS, list);
    }
    /** 新增委托申报单（客户提交委托表单时调用），返回新单 */
    function addEntrust(entrust) {
        const list = loadEntrusts();
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const rec = {
            id: 'WT' + now.getTime().toString().slice(-8),
            customerName: entrust.customerName || '访客',
            policyId: entrust.policyId || '', policyName: entrust.policyName || '',
            shareId: entrust.shareId || '',
            contact: entrust.contact || '', phone: entrust.phone || '',
            remark: entrust.remark || '',
            at: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()),
            status: '待处理'
        };
        list.unshift(rec);
        saveEntrusts(list);
        return rec;
    }

    /** 新增一条线索（企业端问答/雷达/诊断触发时调用），返回新线索 */
    function addClue(clue) {
        const list = loadClues();
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        // 同源同客户去重：待跟进/跟进中的同来源线索已存在时，仅刷新时间与备注（避免同一客户反复咨询刷出多条线索）
        for (var d = 0; d < list.length; d++) {
            var ex = list[d];
            if (ex && ex.company === (clue.company || '匿名企业') && ex.source === (clue.source || '政策查询') &&
                (ex.stage === '待跟进' || ex.stage === '跟进中')) {
                ex.enterTime = '刚刚进入';
                if (clue.intent) ex.intent = clue.intent;
                if (clue.note) ex.note = clue.note;
                saveClues(list);
                return ex;
            }
        }
        const id = 'XS' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
                   String(Math.floor(Math.random() * 900) + 100);
        // 来源默认图标与配色
        const sourceMap = {
            '问答触发': { icon: 'fa-comments', color: 'orange' },
            '诊断触发': { icon: 'fa-stethoscope', color: 'purple' },
            '雷达触发': { icon: 'fa-bullseye', color: 'indigo' },
            '咨询触发': { icon: 'fa-headphones', color: 'amber' },
            '委托触发': { icon: 'fa-briefcase', color: 'green' },
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
    // v11: 申报项目新增 regionOverrides（分层继承地区差异配置），旧数据自动补空对象
    // 数据模型：project.groups = 国家级基础模板（不变）；project.regionOverrides = { [层级标识]: { adds:[], edits:[], removes:[] } }
    const DEFAULT_DECLARATION_PROJECTS = [
        {
            id: 'gqx',
            name: '国家高新技术企业认定',
            level: '国家级', type: '资金补贴', status: '申报中', statusColor: 'green',
            icon: 'fa-star', iconColor: 'blue',
            dept: '科技部火炬中心',
            region: { province: '全国', city: '', district: '' },
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
            ],
            // === 地区差异覆盖（分层继承：国家级为基础 → 省增量覆盖 → 市增量覆盖 → 区县增量覆盖） ===
            // 层级 key: 'province·四川省' / 'province·四川省·city·成都市' / 'province·四川省·city·成都市·district·高新区'
            regionOverrides: {
                // —— 四川省：在国家级 12 项基础上 +2 增量 +1 必填覆盖 ——
                'province·四川省': {
                    adds: [
                        { group:'基础资质类材料', id:'sc1', name:'四川省科技创新平台认定证明', required:true, tip:'四川省高新技术企业培育库入库通知书、省级研发中心/工程中心证明。', sampleName:'四川省创新平台认定样例.pdf', samplePreview:'四川省科学技术厅 关于认定2025年度四川省高新技术企业培育库入库企业的通知...' },
                        { group:'科技成果转化与组织管理', id:'sc2', name:'企业职工人数说明（四川格式）', required:true, tip:'四川省要求附近3年在职职工人数变化表，格式必须用四川省科技厅模板。', sampleName:'四川职工人数模板.xlsx', samplePreview:'| 年度 | 总人数 | 科技人员 | 研发人员 | 占比 | 社保基数 |' }
                    ],
                    edits: [
                        // 国家级 m4 选填 → 四川省改为必填
                        { itemId:'m4', changes:{ required:true, tip:'【四川省要求】近3年A类申报表主表+全部附表；研发费用加计扣除优惠明细表务必完整；四川省对申报表完整性核查比国家级更严。' } }
                    ],
                    removes: []
                },
                // —— 成都市：在继承国家级+四川省基础上 +1 增量 +1 删除 ——
                'province·四川省·city·成都市': {
                    adds: [
                        { group:'基础资质类材料', id:'cd1', name:'成都市高新区/天府新区企业证明', required:true, tip:'注册在高新区/天府新区的企业需提供园区入驻通知书或片区企业认定证明，可享受成都市级配套奖励。', sampleName:'成都高新区入驻证明样例.pdf', samplePreview:'成都高新技术产业开发区管委会 关于同意XX公司入驻的批复...' }
                    ],
                    edits: [],
                    // 成都市不强制要求四川省那个"职工人数说明"（成都走市级简化流程）
                    removes: ['sc2']
                },
                // —— 广东省：在国家级基础上 +2 增量 ——
                'province·广东省': {
                    adds: [
                        { group:'基础资质类材料', id:'gd1', name:'广东省"专精特新"资质证明（如有）', required:false, tip:'已获广东省专精特新认定的企业高企申报可享受广东省科技厅"免审通道"。', sampleName:'广东专精特新证书样例.pdf', samplePreview:'广东省工业和信息化厅 专精特新中小企业证书...' },
                        { group:'知识产权类材料', id:'gd2', name:'广东省知识产权保护中心备案证明', required:true, tip:'广东省要求高企企业须在广东省知识产权保护中心完成备案，提供备案回执。', sampleName:'广东IP备案回执样例.pdf', samplePreview:'广东省知识产权保护中心 备案回执 备案编号：GD-IP-2025-XXXX...' }
                    ],
                    edits: [],
                    removes: []
                }
            }
        },
        {
            id: 'zjtx',
            name: '山东省专精特新企业认定',
            level: '省级', type: '税收减免', status: '申报中', statusColor: 'green',
            icon: 'fa-rocket', iconColor: 'emerald',
            dept: '山东省工信厅',
            region: { province: '山东省', city: '', district: '' },
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
            region: { province: '山东省', city: '济南市', district: '' },
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
            region: { province: '全国', city: '', district: '' },
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

    /** 申报项目 region 反推映射（按 id 兜底，兼容旧数据无 region 字段） */
    const PROJECT_REGION_FALLBACK = {
        gqx:  { province: '全国', city: '', district: '' },
        zjtx: { province: '山东省', city: '', district: '' },
        znzz: { province: '山东省', city: '济南市', district: '' },
        kjxq: { province: '全国', city: '', district: '' }
    };
    function _normalizeDeclarationProjects(list) {
        if (!Array.isArray(list)) return list;
        list.forEach(function (p) {
            if (!p || !p.id) return;
            if (!p.region || !p.region.province) {
                p.region = PROJECT_REGION_FALLBACK[p.id] || { province: '全国', city: '', district: '' };
            }
            // v11: 补 regionOverrides 空对象（兼容旧数据）
            if (!p.regionOverrides || typeof p.regionOverrides !== 'object') {
                p.regionOverrides = {};
            }
            // v12: 高企项目如果 regionOverrides 为空，注入种子演示数据（3 个地区差异配置）
            if (p.id === 'gqx' && Object.keys(p.regionOverrides).length === 0) {
                p.regionOverrides = {
                    'province·四川省': {
                        adds: [
                            { group:'基础资质类材料', id:'sc1', name:'四川省科技创新平台认定证明', required:true, tip:'四川省高新技术企业培育库入库通知书、省级研发中心/工程中心证明。', sampleName:'四川省创新平台认定样例.pdf', samplePreview:'四川省科学技术厅 关于认定2025年度四川省高新技术企业培育库入库企业的通知...' },
                            { group:'科技成果转化与组织管理', id:'sc2', name:'企业职工人数说明（四川格式）', required:true, tip:'四川省要求附近3年在职职工人数变化表，格式必须用四川省科技厅模板。', sampleName:'四川职工人数模板.xlsx', samplePreview:'| 年度 | 总人数 | 科技人员 | 研发人员 | 占比 | 社保基数 |' }
                        ],
                        edits: [
                            { itemId:'m4', changes:{ required:true, tip:'【四川省要求】近3年A类申报表主表+全部附表；研发费用加计扣除优惠明细表务必完整；四川省对申报表完整性核查比国家级更严。' } }
                        ],
                        removes: []
                    },
                    'province·四川省·city·成都市': {
                        adds: [
                            { group:'基础资质类材料', id:'cd1', name:'成都市高新区/天府新区企业证明', required:true, tip:'注册在高新区/天府新区的企业需提供园区入驻通知书或片区企业认定证明，可享受成都市级配套奖励。', sampleName:'成都高新区入驻证明样例.pdf', samplePreview:'成都高新技术产业开发区管委会 关于同意XX公司入驻的批复...' }
                        ],
                        edits: [],
                        removes: ['sc2']
                    },
                    'province·广东省': {
                        adds: [
                            { group:'基础资质类材料', id:'gd1', name:'广东省"专精特新"资质证明（如有）', required:false, tip:'已获广东省专精特新认定的企业高企申报可享受广东省科技厅"免审通道"。', sampleName:'广东专精特新证书样例.pdf', samplePreview:'广东省工业和信息化厅 专精特新中小企业证书...' },
                            { group:'知识产权类材料', id:'gd2', name:'广东省知识产权保护中心备案证明', required:true, tip:'广东省要求高企企业须在广东省知识产权保护中心完成备案，提供备案回执。', sampleName:'广东IP备案回执样例.pdf', samplePreview:'广东省知识产权保护中心 备案回执 备案编号：GD-IP-2025-XXXX...' }
                        ],
                        edits: [],
                        removes: []
                    },
                    'province·浙江省': {
                        adds: [
                            { group:'基础资质类材料', id:'zj1', name:'浙江省科技型中小企业认定证书', required:true, tip:'浙江省要求高企申报前须先取得科技型中小企业认定，提供证书扫描件。', sampleName:'浙江科技型企业证书.pdf', samplePreview:'浙江省科学技术厅 科技型中小企业认定证书...' }
                        ],
                        edits: [],
                        removes: []
                    },
                    'province·北京市': {
                        adds: [],
                        edits: [
                            { itemId:'m4', changes:{ required:false, tip:'【北京市简化】北京市高企申报对审计报告要求较宽松，可用财务报表替代。' } }
                        ],
                        removes: []
                    }
                };
            }
        });
        return list;
    }

    /** 读取申报项目配置 */
    function loadDeclarationProjects() {
        const data = _read(KEYS.DECLARATION_PROJECTS, null);
        if (!data || !Array.isArray(data) || data.length === 0) return JSON.parse(JSON.stringify(DEFAULT_DECLARATION_PROJECTS));
        return _normalizeDeclarationProjects(data);
    }

    /** 保存申报项目配置 */
    function saveDeclarationProjects(projects) {
        if (!Array.isArray(projects)) return false;
        return _write(KEYS.DECLARATION_PROJECTS, projects);
    }

    // ========== 默认申报书模板库（省份 × 项目类型） ==========
    // 字段 source 取值规范：
    //   enterprise.{name|code|industry|region|regCap|employees|founded|quals|contact|phone|revenue}
    //   project.{name|level|dept|subsidy|deadline|progress|type}
    //   material.{材料id}.tip | material.{材料id}.status | material.all
    //   static（使用字段 default 值）
    const DEFAULT_DECLARATION_TEMPLATES = [
        {
            id: 'tpl_sc_zjbt',
            region: '四川省', projectType: '资金补贴',
            name: '四川省资金补贴类项目申报书模板',
            cover: { titleTpl: '${enterprise.name}关于申报${project.name}的报告' },
            sections: [
                { title: '一、申报单位基本情况', fields: [
                    { key: 'companyName', label: '企业名称', source: 'enterprise.name' },
                    { key: 'creditCode', label: '统一社会信用代码', source: 'enterprise.code' },
                    { key: 'industry', label: '所属行业', source: 'enterprise.industry' },
                    { key: 'region', label: '注册所在地', source: 'enterprise.region' },
                    { key: 'regCap', label: '注册资本', source: 'enterprise.regCap' },
                    { key: 'employees', label: '职工人数', source: 'enterprise.employees' },
                    { key: 'founded', label: '成立日期', source: 'enterprise.founded' },
                    { key: 'quals', label: '企业资质', source: 'enterprise.quals' }
                ]},
                { title: '二、项目概况', fields: [
                    { key: 'projName', label: '项目名称', source: 'project.name' },
                    { key: 'projLevel', label: '项目级别', source: 'project.level' },
                    { key: 'projDept', label: '主管部门', source: 'project.dept' },
                    { key: 'subsidy', label: '预计扶持', source: 'project.subsidy' },
                    { key: 'deadline', label: '申报截止', source: 'project.deadline' }
                ]},
                { title: '三、申报理由与依据', fields: [
                    { key: 'reason', label: '申报理由', source: 'static', default: '本企业符合该项目申报条件，相关核心技术与经营指标已达到申报要求，特申请认定并享受相应政策扶持。' },
                    { key: 'condition', label: '符合条件说明', source: 'static', default: '企业依法注册满一年，近三年内未发生重大安全、重大质量事故或严重环境违法、科研严重失信行为，符合申报主体资格。' }
                ]},
                { title: '四、核心材料准备情况', fields: [
                    { key: 'matM1', label: '申请表填写要点', source: 'material.m1.tip' },
                    { key: 'matM1Status', label: '申请表状态', source: 'material.m1.status' },
                    { key: 'matM3', label: '审计报告要点', source: 'material.m3.tip' }
                ]}
            ],
            updatedAt: '2026-10-08'
        },
        {
            id: 'tpl_default',
            region: '通用', projectType: '*',
            name: '通用申报书模板（无匹配省份时回退）',
            cover: { titleTpl: '${enterprise.name}申报书' },
            sections: [
                { title: '一、申报单位基本情况', fields: [
                    { key: 'companyName', label: '企业名称', source: 'enterprise.name' },
                    { key: 'creditCode', label: '统一社会信用代码', source: 'enterprise.code' },
                    { key: 'industry', label: '所属行业', source: 'enterprise.industry' },
                    { key: 'region', label: '注册所在地', source: 'enterprise.region' },
                    { key: 'regCap', label: '注册资本', source: 'enterprise.regCap' },
                    { key: 'employees', label: '职工人数', source: 'enterprise.employees' }
                ]},
                { title: '二、项目概况', fields: [
                    { key: 'projName', label: '项目名称', source: 'project.name' },
                    { key: 'projLevel', label: '项目级别', source: 'project.level' },
                    { key: 'projDept', label: '主管部门', source: 'project.dept' },
                    { key: 'subsidy', label: '预计扶持', source: 'project.subsidy' },
                    { key: 'deadline', label: '申报截止', source: 'project.deadline' }
                ]},
                { title: '三、申报理由', fields: [
                    { key: 'reason', label: '申报理由', source: 'static', default: '本企业符合该项目申报条件，特申请认定并享受相应政策扶持。' }
                ]},
                { title: '四、申报材料清单', fields: [
                    { key: 'materials', label: '材料清单', source: 'material.all' }
                ]}
            ],
            updatedAt: '2026-10-08'
        }
    ];

    /** 读取申报书模板库 */
    function loadDeclarationTemplates() {
        const data = _read(KEYS.DECLARATION_TEMPLATES, null);
        if (!data || !Array.isArray(data) || data.length === 0) return JSON.parse(JSON.stringify(DEFAULT_DECLARATION_TEMPLATES));
        return data;
    }

    /** 保存申报书模板库 */
    function saveDeclarationTemplates(templates) {
        if (!Array.isArray(templates)) return false;
        return _write(KEYS.DECLARATION_TEMPLATES, templates);
    }

    /** 按 省份+项目类型 匹配模板（无匹配回退通用模板） */
    function pickDeclarationTemplate(project) {
        const all = loadDeclarationTemplates();
        const prov = (project && project.region && project.region.province) || '全国';
        const type = (project && project.type) || '';
        // 精确匹配（省份+类型）
        let exact = all.find(function (t) { return t.region === prov && (t.projectType === type || t.projectType === '*'); });
        if (exact) return { tpl: exact, fallback: false, hint: '' };
        // 省份匹配（任意类型）
        let provMatch = all.find(function (t) { return t.region === prov && t.projectType === '*'; });
        if (provMatch) return { tpl: provMatch, fallback: true, hint: '未匹配到「' + prov + '·' + type + '」专有模板，已使用该省份通用模板' };
        // 全国/通用回退
        let general = all.find(function (t) { return t.region === '全国'; }) || all.find(function (t) { return t.region === '通用'; });
        if (general) return { tpl: general, fallback: true, hint: '未匹配到「' + prov + '」专有模板，已使用通用模板' };
        return { tpl: all[0], fallback: true, hint: '未找到任何模板，使用首个可用模板' };
    }

    // ========== 用户贡献政策（待审核队列） ==========
    // 贡献记录结构：{ id, uploaderId, uploaderName, fileName, ocr:{name, docNo, dept, date},
    //                 province, industry, level, remark, points, status:'pending|approved|rejected',
    //                 reviewedBy, reviewedAt, rejectReason, createdAt }
    // 积分规则：国家级 50，省级 20，市级/区县级/通知 10
    const CONTRIB_POINTS = { '国家级': 50, '省级': 20, '市级': 10, '区县级': 10, '通知公告': 10 };

    function buildContribSeeds() {
        var today = new Date().toISOString().slice(0, 10);
        return [
            { id:'ctb_demo_1', uploaderId:'demo_user_01', uploaderName:'四川创智科技有限公司',
              channel:'file',
              fileName:'四川省专精特新中小企业认定管理办法.pdf',
              ocr:{ name:'四川省专精特新中小企业认定管理办法', docNo:'川经信〔2025〕88号', dept:'四川省经济和信息化厅', date:'2025-03-15' },
              province:'四川省', industry:'通用', level:'省级', remark:'刚发布的，之前库里没有',
              points:20, status:'pending', createdAt:today + 'T09:15:00' },
            { id:'ctb_demo_2', uploaderId:'demo_user_02', uploaderName:'上海芯微电子有限公司',
              channel:'link',
              sourceLink:'https://www.shanghai.gov.cn/zwgk/202501/t20250120_ic-tax.html',
              fileName:'上海市集成电路企业税收优惠通知.pdf',
              ocr:{ name:'上海市集成电路企业税收优惠实施通知', docNo:'沪财税〔2025〕12号', dept:'上海市财政局', date:'2025-01-20' },
              province:'上海市', industry:'信息技术', level:'市级', remark:'公司刚享受到这个优惠，分享给大家',
              points:10, status:'pending', createdAt:today + 'T14:30:00' },
            { id:'ctb_demo_3', uploaderId:'demo_user_03', uploaderName:'杭州迅软信息技术有限公司',
              channel:'text',
              textContent:'财政部 税务总局关于进一步完善研发费用税前加计扣除政策的公告\n\n为进一步激励企业加大研发投入，支持科技创新，现将研发费用税前加计扣除政策有关问题公告如下：\n\n一、企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，自2026年1月1日起，再按照实际发生额的100%在税前加计扣除；形成无形资产的，按照无形资产成本的200%在税前摊销。\n\n二、企业享受研发费用加计扣除政策采取“真实发生、自行判别、申报享受、相关资料留存备查”的办理方式。\n\n三、本公告自2026年1月1日起执行。',
              fileName:'研发费用加计扣除政策汇编（网络转载）.pdf',
              ocr:{ name:'研发费用加计扣除政策汇编（2026年继续执行）', docNo:'财税〔2023〕7号（转载）', dept:'财政部 税务总局', date:'2026-01-01' },
              province:'全国', industry:'通用', level:'国家级', remark:'网上找到的汇总版，分享给大家',
              points:50, status:'pending', createdAt:today + 'T16:05:00' },
            { id:'ctb_demo_4', uploaderId:'demo_user_04', uploaderName:'苏州精密仪器股份有限公司',
              fileName:'苏州市智能车间认定补贴办法.pdf',
              ocr:{ name:'苏州市智能车间认定与补贴实施办法', docNo:'苏工信〔2026〕15号', dept:'苏州市工业和信息化局', date:'2026-06-10' },
              province:'江苏省', industry:'高端装备', level:'市级', remark:'我们厂去年申报过这个',
              points:10, status:'approved', createdAt:'2026-10-19T10:12:00', reviewedBy:'运营·王敏', reviewedAt:'2026-10-20T11:30:00' },
            { id:'ctb_demo_5', uploaderId:'demo_user_05', uploaderName:'成都云帆网络科技有限公司',
              fileName:'高新区企业上云补贴实施细则（节选）.pdf',
              ocr:{ name:'成都高新区企业上云用云补贴实施细则', docNo:'成高新〔2026〕8号', dept:'成都高新区经济运行局', date:'2026-07-22' },
              province:'四川省', industry:'信息技术', level:'区县级', remark:'',
              points:10, status:'rejected', rejectReason:'政策正文不完整，仅包含目录与摘要，请补充完整全文后再提交',
              createdAt:'2026-10-21T15:40:00', reviewedBy:'运营·王敏', reviewedAt:'2026-10-22T09:05:00' },
            { id:'ctb_demo_6', uploaderId:'demo_user_06', uploaderName:'深圳创新微电子有限公司',
              fileName:'国家级专精特新小巨人申报通知.pdf',
              ocr:{ name:'第六批专精特新「小巨人」企业培育申报通知', docNo:'工信部企业〔2026〕102号', dept:'工业和信息化部', date:'2026-08-01' },
              province:'全国', industry:'制造业', level:'国家级', remark:'官方刚发布的申报通知',
              points:50, status:'approved', createdAt:'2026-10-23T09:20:00', reviewedBy:'运营·李强', reviewedAt:'2026-10-24T14:18:00' }
        ];
    }

    function loadContributions() {
        const data = _read(KEYS.POLICY_CONTRIB, null);
        if (Array.isArray(data)) {
            // 种子补齐：旧 localStorage 缺少新演示数据时追加；演示数据变更时替换（保证查重演示可见）
            var seeds = buildContribSeeds();
            var changed = false;
            seeds.forEach(function(s) {
                var idx = data.findIndex(function(c) { return c.id === s.id; });
                if (idx === -1) { data.push(s); changed = true; }
                else if (data[idx].fileName !== s.fileName || data[idx].channel !== s.channel) { data[idx] = s; changed = true; }
            });
            if (changed) _write(KEYS.POLICY_CONTRIB, data);
            return data;
        }
        // 首次：给 3 条演示数据（方便运营端看到效果）
        return buildContribSeeds();
    }

    function saveContributions(list) {
        if (!Array.isArray(list)) return false;
        return _write(KEYS.POLICY_CONTRIB, list);
    }

    /** 用户提交政策贡献（模拟自动解析预填 + 用户补盲） */
    function submitContribution(payload) {
        if (!payload || !payload.fileName) return null;
        var list = loadContributions();
        var id = 'ctb_' + Date.now();
        var item = {
            id: id,
            uploaderId: payload.uploaderId || ('user_' + Math.random().toString(36).slice(2, 8)),
            uploaderName: payload.uploaderName || '匿名用户',
            channel: payload.channel || 'file',
            sourceLink: payload.sourceLink || '',
            textContent: payload.textContent || '',
            fileName: payload.fileName,
            ocr: payload.ocr || {},
            province: payload.province || '全国',
            industry: payload.industry || '通用',
            level: payload.level || '通知公告',
            remark: payload.remark || '',
            points: CONTRIB_POINTS[payload.level] || 10,
            status: 'pending',
            createdAt: new Date().toISOString().slice(0, 16)
        };
        list.unshift(item);
        saveContributions(list);
        return item;
    }

    /** 运营审核通过 → 给上传用户加积分（opts.level 可修正政策层级，积分按修正后层级结算，防止误选/误判导致积分失实） */
    function approveContribution(id, opts) {
        var list = loadContributions();
        var item = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                item = list[i];
                list[i].status = 'approved';
                list[i].reviewedAt = new Date().toISOString().slice(0, 16);
                list[i].reviewedBy = (opts && opts.reviewedBy) || '运营';
                // 层级修正：以运营审核确认的层级为准，积分按确认层级重新结算
                if (opts && opts.level && CONTRIB_POINTS[opts.level] !== undefined && opts.level !== list[i].level) {
                    list[i].level = opts.level;
                    list[i].points = CONTRIB_POINTS[opts.level];
                    list[i].levelAdjusted = true;
                }
                break;
            }
        }
        if (!item) return null;
        saveContributions(list);
        // 给用户加积分（演示环境：同一浏览器 localStorage 里的 ceyuan_member_v2）
        try {
            var member = JSON.parse(localStorage.getItem('ceyuan_member_v2') || 'null');
            if (member && typeof member === 'object') {
                member.general = (member.general || 0) + (item.points || 0);
                if (!Array.isArray(member.usage)) member.usage = [];
                member.usage.unshift({
                    date: new Date().toISOString().slice(0, 10),
                    item: '贡献政策通过（' + (item.ocr && item.ocr.name ? item.ocr.name.slice(0, 12) : item.fileName) + '）',
                    cost: -(item.points || 0)
                });
                localStorage.setItem('ceyuan_member_v2', JSON.stringify(member));
            }
        } catch (e) {}
        return item;
    }

    /** 运营驳回 */
    function rejectContribution(id, reason) {
        var list = loadContributions();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) { list[i].status = 'rejected'; list[i].rejectReason = reason || ''; list[i].reviewedAt = new Date().toISOString().slice(0, 16); break; }
        }
        saveContributions(list);
    }

    /** 获取某个用户的贡献列表 */
    function loadUserContributions(uploaderId) {
        var list = loadContributions();
        if (!uploaderId) return list;
        return list.filter(function(c) { return c.uploaderId === uploaderId; });
    }

    // ========== 默认测评规则引擎（高企/专精特新/小巨人 三套规则，DSL 形式） ==========
    // DSL 字段说明：
    //   hardMetrics[].check = { expr, op, value, guard? } 或 { boolExpr, guard? }
    //     expr 算术表达式，op 比较运算符，value 阈值；guard 前置条件，不满足直接 false
    //   hardMetrics[].value = { expr, unit, decimals, fallback, guard? } 取值显示
    //   scoreItems[].calc = { expr, cap, floor? } 计分（结果限制在 [floor, cap]）
    //   scoreItems[].basis = { template } 关键依据模板，{field} 占位替换
    // 表达式语法：字段引用 formXxx；数组索引 formRev[2]；聚合 sum(arr)/count(arr)；
    //   时间 yearsSince(dateStr)；算术 + - * /；比较 >= <= > < == !=；
    //   逻辑 && || !；三元 c ? a : b；字面量数字与 '是'/'否' 字符串
    // 表单重构 v2：checkbox 数组 → count(formQuals)/count(formHonors)；
    //   研发人员占比从派生字段 formRdStaffPct 取（原始字段是绝对数 formRdStaff）；
    //   主营业务收入占比从派生字段 formProdPct 取（formMainRev/formRev 自动计算）；
    //   资产负债率从派生字段 formDebt 取（(formAsset-formNet)/formAsset 自动计算）
    const DEFAULT_DIAGNOSIS_RULES = {
        version: 10, // v10: gradient 补齐 hardMetrics/scoreItems（四级门槛+6维评分），旧数据自动覆盖
        rules: {
            // 高企测评规则
            hightech: {
                type: '高企',
                passLine: 70.1,
                hardMetrics: [
                    { key:'years', name:'注册成立时间', desc:'满1年',
                      check:{ boolExpr:'yearsSince(formFoundDate) >= 1', guard:'formFoundDate != ""' },
                      value:{ expr:'yearsSince(formFoundDate)', unit:'年', decimals:1, fallback:'未填', guard:'formFoundDate != ""' } },
                    { key:'personnel', name:'研发人员占比', desc:'≥10%',
                      check:{ expr:'formRdStaff / formEmployees * 100', op:'>=', value:10, guard:'formEmployees > 0' },
                      value:{ expr:'formRdStaff / formEmployees * 100', unit:'%', decimals:1, fallback:'未填', guard:'formEmployees > 0' } },
                    { key:'htIncome', name:'高新技术产品收入占比', desc:'≥60%',
                      check:{ expr:'sum(formHtInc) / sum(formRev) * 100', op:'>=', value:60, guard:'sum(formRev) > 0' },
                      value:{ expr:'sum(formHtInc) / sum(formRev) * 100', unit:'%', decimals:1, fallback:'未填', guard:'sum(formRev) > 0' } },
                    { key:'rdFee', name:'研发费用占比', desc:'≥3%',
                      check:{ expr:'sum(formRdFee) / sum(formRev) * 100', op:'>=', value:3, guard:'sum(formRev) > 0' },
                      value:{ expr:'sum(formRdFee) / sum(formRev) * 100', unit:'%', decimals:1, fallback:'未填', guard:'sum(formRev) > 0' } },
                    { key:'field', name:'核心技术领域归属', desc:'属于国家支持的高新技术领域',
                      check:{ boolExpr:'formProduct != ""' },
                      value:{ expr:'formProduct', unit:'', decimals:0, fallback:'未填', guard:'formProduct != ""' } }
                ],
                scoreItems: [
                    { key:'ip', name:'知识产权', max:30,
                      calc:{ expr:'formIP1 * 20 + formIP2 * 5', cap:100, floor:0 },
                      basis:{ template:'Ⅰ类 {formIP1} 项，Ⅱ类 {formIP2} 项' } },
                    { name:'成果转化能力', max:30,
                      calc:{ expr:'formTransform * 4', cap:30, floor:0 },
                      basis:{ template:'近三年年均成果转化 {formTransform} 项' } },
                    { key:'mgmt', name:'研发组织管理水平', max:20,
                      calc:{ expr:'(formIUR == "是" && formStd == "是") ? 100 : ((formIUR == "是" || formStd == "是") ? 60 : 20)', cap:100, floor:0 },
                      basis:{ template:'产学研{formIUR}，标准制订{formStd}' } },
                    { name:'企业成长性', max:20,
                      calc:{ expr:'(formRev[2] - formRev[0]) / formRev[0] * 100 * 0.4', cap:20, floor:0, guard:'formRev[0] > 0' },
                      basis:{ template:'近三年营收 {formRev[0]}/{formRev[1]}/{formRev[2]} 万元' } }
                ],
                // === 策源颐达顾问视角的建议文案（v5：去数字变量，纯文字表述，仅保留 {needInvest}） ===
                // 每条关联具体政策、申报时间、补贴金额、材料清单，运营可直接转成客户跟进话术
                suggestionTexts: {
                    years: {
                        fail: '企业成立年限尚未满足高企认定的基本条件。建议先注册入库科技型中小企业、申报省级专精特新培育库储备资质；成立期满即可启动高企申报（省补贴 20 万 + 加计扣除减税）',
                        pass: '企业成立年限已符合高企认定要求。建议立即启动知识产权布局与研发费用归集，目标 5-6 月省级申报截止日前完成材料',
                        excel: '企业成立年限充裕。建议在申报高企的同时筹划省专精特新 + 研发中心补助，一次申报多拿补贴'
                    },
                    personnel: {
                        fail: '科技人员占比尚未达到高企认定要求。高企要求科技人员连续 12 个月占比达标，建议合同签订、社保缴纳同步更新；核心岗位引进 2-3 名研发人员即可达标',
                        pass: '科技人员占比已达到认定要求。申报时需提供 12 个月社保缴纳明细 + 岗位说明书留存备查',
                        excel: '科技人员占比优势明显，团队结构优秀。建议申报省级/市级研发中心认定，可获中心建设补助 10-50 万'
                    },
                    rdFee: {
                        fail: '研发费用投入强度尚未达到高企门槛。按当前营收规模测算，需再投入约 {needInvest} 万元研发费用即可达标；建议立即建立研发费用辅助账、归集工资/折旧/委外费用，5 月前完成归集可享全额加计扣除减税',
                        pass: '研发费用投入强度符合高企要求（按营收规模分档）。建议用最新版辅助账模板重新梳理，避免审计时被剔除；同时申请研发费加计扣除 100%/200% 比例',
                        excel: '研发费用投入强度远超高企门槛。建议叠加申请"工业互联网/人工智能专项"，投入强度达标可额外获省级补助'
                    },
                    htIncome: {
                        fail: '高新技术产品收入占比未达到高企硬性指标。建议梳理已取得的高新产品证书、软件著作权，把相关合同优先归集到高新收入',
                        pass: '高新收入占比达标。申报时需提供高新产品（服务）证书 + 收入明细台账，注意与知识产权关联证明',
                        excel: '高新收入结构优秀。建议申报国家重点新产品/首台套保险补偿，额外获 30-50 万补助'
                    },
                    ip: {
                        fail: '知识产权数量偏少，未达高企申报要求（至少 1 项Ⅰ类 + 若干Ⅱ类）。建议优先走"发明专利加急审查"通道（3 个月拿授权），或通过知识产权受让快速补足',
                        pass: '知识产权数量满足高企Ⅱ类要求。建议补充 1-2 项发明专利（Ⅰ类），可将高企打分拉高一个档次，同时为后续专精特新/小巨人做储备',
                        excel: '知识产权布局扎实。建议筛选核心专利申请 PCT 国际布局，或参与国家/行业标准制订，可叠加申请"专利转化专项"补助'
                    },
                    mgmt: {
                        fail: '产学研合作与标准制订尚未落实。高企研发组织管理板块失分较多，建议与高校院所签订 1-2 份产学研合作协议（需附实质性合作成果），并参与 1 项行业标准制订',
                        pass: '研发管理条件部分具备。建议补齐缺失项：未签产学研的尽快对接本地高校；未参与标准的，申报省/市团体标准可获补助',
                        excel: '研发管理体系完善。建议将已开展的产学研合作打包成"省产学研协同创新项目"申报，可获 10-30 万专项补助'
                    }
                }
            },
            // 专精特新测评规则
            specialized: {
                type: '专精特新',
                passLine: 70,
                hardMetrics: [
                    { key:'profe', name:'主导产品收入占比', desc:'≥60%',
                      check:{ expr:'formProdPct', op:'>=', value:60 },
                      value:{ expr:'formProdPct', unit:'%', decimals:0, fallback:'未填' } },
                    { key:'novel', name:'研发人员占比', desc:'≥10%',
                      check:{ expr:'formRdStaffPct', op:'>=', value:10 },
                      value:{ expr:'formRdStaffPct', unit:'%', decimals:0, fallback:'未填' } },
                    { key:'growth', name:'营收增长率', desc:'≥0%',
                      check:{ expr:'formGrowth', op:'>=', value:0 },
                      value:{ expr:'formGrowth', unit:'%', decimals:0, fallback:'未填' } },
                    { key:'quality', name:'资产负债率', desc:'≤70%',
                      check:{ expr:'formDebt', op:'<=', value:70 },
                      value:{ expr:'formDebt', unit:'%', decimals:0, fallback:'未填' } }
                ],
                scoreItems: [
                    { key:'profe', name:'专业化', max:25,
                      calc:{ expr:'formProdPct', cap:100, floor:0 },
                      basis:{ template:'主导产品收入占比 {formProdPct}%' } },
                    { key:'refine', name:'精细化', max:25,
                      calc:{ expr:'count(formQuals) * 25 + (formDebt <= 70 ? 25 : 0)', cap:100, floor:0 },
                      basis:{ template:'获得资质 {formQuals} 项，负债率 {formDebt}%' } },
                    { key:'special', name:'特色化', max:25,
                      calc:{ expr:'formMarketPos == "全国前列" ? 100 : (formMarketPos == "区域前列" ? 80 : (formMarketPos == "省内前列" ? 60 : 30))', cap:100, floor:0 },
                      basis:{ template:'细分市场地位：{formMarketPos}' } },
                    { key:'novel', name:'新颖化', max:25,
                      calc:{ expr:'formRdStaffPct * 2 + formPatentTotal * 5 + 0', cap:100, floor:0 },
                      basis:{ template:'研发人员占比 {formRdStaffPct}%，专利 {formPatentTotal} 项' } }
                ],
                suggestionTexts: {
                    profe: {
                        fail: '主营业务收入占比尚未达到专精特新"专业化"门槛。建议收缩非核心业务线、把营销资源集中到主导产品上；若暂时无法收缩，可先申报市级专精特新过渡',
                        pass: '主营占比达标，专精特新"专业化"符合要求。建议在申报材料中突出主导产品的细分市场地位、核心客户案例',
                        excel: '主营占比优势明显，专业化程度领先。建议用该主业申报"单项冠军产品"认定，可获省级单项冠军补助 20-50 万'
                    },
                    refine: {
                        fail: '资质认证数量不足，专精特新"精细化"板块存在短板。建议优先办理 ISO9001 质量管理体系认证（最快 3 个月），同步准备省级质量奖；两项齐备该板块基本满分',
                        pass: '资质认证已达标。建议补办 ISO27001 信息安全或 CE/UL 国际认证，可在评分中多拿加分项',
                        excel: '资质认证体系完善，精细化管理领先。建议把质量管控体系打包成"省精益管理示范企业"申报，可获 5-10 万补助'
                    },
                    special: {
                        fail: '数字化水平尚未建立信息化支撑。建议启动"上云用数赋智"专项，目标 1 年内完成两化融合贯标，可获省级贯标补助',
                        pass: '数字化水平已有基础。建议启动两化融合贯标评定，或申报"工业互联网创新示范"企业，两者均有专项补助',
                        excel: '数字化水平领先，特色化优势明显。建议申报省级"智能制造示范工厂"或"数字化车间"，可获 20-50 万补助'
                    },
                    novel: {
                        fail: '研发人员占比尚未达到专精特新"新颖化"门槛。建议通过"揭榜挂帅"项目引进核心人才，同时加快发明专利/PCT 布局；新颖化板块打分权重最高',
                        pass: '研发人员占比达标，新颖化符合要求。建议补充 1-2 项发明专利、申报"省科技特派员"项目，强化人才队伍建设',
                        excel: '研发人员占比优势明显，创新动力充足。建议申报"博士后科研工作站"或"省重点实验室"，搭建高端创新平台'
                    },
                    growth: {
                        fail: '近三年营收增长乏力，成长性偏弱。专精特新要求"连续增长"，建议产品迭代 + 新客户开发双管齐下，或通过并购/增资扩股做大营收规模',
                        pass: '营收增长率符合要求，成长性达标。建议在申报材料中突出增长曲线、核心客户复购情况，成长性是评分加分项',
                        excel: '营收高增长，成长性优秀。建议同步申报"瞪羚企业""独角兽企业"梯度培育，高成长可获额外认定绿色通道'
                    },
                    quality: {
                        fail: '资产负债率超出安全线，专精特新财务板块会扣分。建议通过股权融资/应收账款保理/延期付款等方式优化资本结构后再申报',
                        pass: '负债率在安全线内，财务结构健康。申报时需提供近三年审计报告，确保无大额异常波动',
                        excel: '负债率优秀，财务稳健。建议争取银行科创贷/投贷联动，低负债率背景下可拿到更低融资成本'
                    }
                }
            },
            // 小巨人测评规则（v2: 表单重构为 4 大模块，大量是/否单选 + 三年财务表）
            giant: {
                type: '小巨人',
                passLine: 75,
                // 2026 版工信部《优质中小企业梯度培育管理办法》（工信部企业〔2026〕2 号）7 条门槛
                hardMetrics: [
                    // ① 省级专精特新 + 细分市场年限（新版：从事特定细分市场≥3年）
                    { key:'provincial', name:'省级专精特新资格', desc:'已获省级专精特新认定',
                      check:{ boolExpr:'formProvincial == "是"' },
                      value:{ expr:'formProvincial == "是" ? "已获" : "未获"', unit:'', decimals:0, fallback:'未填' } },
                    { key:'marketYrs', name:'细分市场年限', desc:'≥3年',
                      check:{ expr:'formMarketYears', op:'>=', value:3 },
                      value:{ expr:'formMarketYears', unit:'年', decimals:0, fallback:'未填' } },
                    // ② 营收规模 + 主营占比 + 资产负债率（新版：营收≥5000万、主营≥90%、负债率≤75%）
                    { key:'revScale', name:'营业收入规模', desc:'≥5000万元',
                      check:{ expr:'formRev[2]', op:'>=', value:5000 },
                      value:{ expr:'formRev[2]', unit:'万元', decimals:0, fallback:'未填' } },
                    { key:'mainRev', name:'主营业务占比', desc:'≥90%',
                      check:{ boolExpr:'formMainRevRatio == "是"' },
                      value:{ expr:'formMainRevRatio == "是" ? "≥90%" : "<90%"', unit:'', decimals:0, fallback:'未填' } },
                    // ③ 研发费用（新版双条件：近两年合计≥1200万 且 每年占比≥3%）
                    { key:'rdFeeAmt', name:'研发费用总额', desc:'近两年合计≥1200万元',
                      check:{ expr:'formRdFeeTotal2yr', op:'>=', value:1200 },
                      value:{ expr:'formRdFeeTotal2yr', unit:'万元', decimals:0, fallback:'未填' } },
                    { key:'rdFeePct', name:'研发费用占比', desc:'每年≥3%',
                      check:{ expr:'formRdFeePct', op:'>=', value:3 },
                      value:{ expr:'formRdFeePct', unit:'%', decimals:1, fallback:'未填' } },
                    // ④ 研发机构 + 产业链补短板
                    { key:'rdStaff', name:'研发机构', desc:'自建/联建研发机构',
                      check:{ boolExpr:'formRdOrg == "是"' },
                      value:{ expr:'formRdOrg == "是" ? "已建" : "未建"', unit:'', decimals:0, fallback:'未填' } },
                    { key:'chain', name:'产业链补短板', desc:'补短板/国产替代/卡脖子',
                      check:{ boolExpr:'formChainCase == "是" || formDomesticSub == "是" || formBreakChoke == "是"' },
                      value:{ expr:'(formChainCase == "是" ? "补短板 " : "") + (formDomesticSub == "是" ? "国产替代 " : "") + (formBreakChoke == "是" ? "突破卡脖子" : "")', unit:'', decimals:0, fallback:'未填' } },
                    // ⑤ Ⅰ类知识产权（新版≥4项发明专利）+ 市场占有率
                    { key:'ip1', name:'Ⅰ类知识产权', desc:'≥4项发明专利',
                      check:{ expr:'formIP1', op:'>=', value:4 },
                      value:{ expr:'formIP1', unit:'项', decimals:0, fallback:'未填' } },
                    { key:'share', name:'市场占有率', desc:'全国细分市场≥10%',
                      check:{ boolExpr:'formSharePass == "是"' },
                      value:{ expr:'formSharePass == "是" ? "≥10%" : "<10%"', unit:'', decimals:0, fallback:'未填' } },
                    // ⑥ 资产负债率（新版≤75%）
                    { key:'debt', name:'资产负债率', desc:'≤75%',
                      check:{ boolExpr:'formDebtPass == "是"' },
                      value:{ expr:'formDebtPass == "是" ? "≤75%" : ">75%"', unit:'', decimals:0, fallback:'未填' } }
                ],
                scoreItems: [
                    { key:'share', name:'市场占有率', max:20,
                      calc:{ expr:'formSharePass == "是" ? 100 : 30', cap:100, floor:0 },
                      basis:{ template:'市场占有率{formSharePass}' } },
                    { key:'chain', name:'产业链补短板', max:15,
                      calc:{ expr:'(formChainCase == "是" ? 40 : 0) + (formDomesticSub == "是" ? 30 : 0) + (formBreakChoke == "是" ? 30 : 0)', cap:100, floor:0 },
                      basis:{ template:'补短板{formChainCase}，国产替代{formDomesticSub}，卡脖子{formBreakChoke}' } },
                    { key:'rdFee', name:'研发费用', max:20,
                      calc:{ expr:'(formRdFeeTotal2yr >= 1200 ? 50 : formRdFeeTotal2yr / 1200 * 50) + (formRdFeePct >= 3 ? 50 : formRdFeePct / 3 * 50)', cap:100, floor:0 },
                      basis:{ template:'研发费用合计 {formRdFeeTotal2yr} 万元，占比 {formRdFeePct}%' } },
                    { key:'rdStaff', name:'研发机构', max:15,
                      calc:{ expr:'(formRdOrg == "是" ? 60 : 0) + (formErpMes == "是" ? 20 : 0) + (formIsoCert == "是" ? 20 : 0)', cap:100, floor:0 },
                      basis:{ template:'研发机构{formRdOrg}，ERP/MES{formErpMes}，认证{formIsoCert}' } },
                    { key:'ip1', name:'Ⅰ类知识产权', max:15,
                      calc:{ expr:'formIP1 * 25', cap:100, floor:0 },
                      basis:{ template:'Ⅰ类知识产权 {formIP1} 项' } },
                    { key:'debt', name:'资产负债率', max:15,
                      calc:{ expr:'formDebtPass == "是" ? 100 : 30', cap:100, floor:0 },
                      basis:{ template:'资产负债率{formDebtPass}' } }
                ],
                suggestionTexts: {
                    share: {
                        fail: '小巨人要求主导产品国内市场占有率≥10%（或省内≥30%），当前未达标。建议通过差异化定位 + 精准营销扩大头部客户占比；若短期难达，建议先冲刺"市级专精特新小巨人"过渡',
                        pass: '细分市场占有率已达小巨人门槛。建议在申报材料中突出市场占有率排名、核心客户名单、权威机构佐证（如第三方市场调研报告）',
                        excel: '市场占有率领先，可叠加申报工信部"制造业单项冠军企业/产品"认定（国家级名片 + 省/市补贴合计 50-100 万）'
                    },
                    chain: {
                        fail: '尚未在"补短板/国产替代/卡脖子"三方面形成案例，这是小巨人的核心门槛。建议：① 梳理主导产品的产业链位置 ② 找到被"卡脖子"的环节 ③ 形成国产替代/补短板案例材料，申报"产业链协同创新项目"可获 20-50 万补助',
                        pass: '已有产业链支撑案例。建议补充客户使用证明、性能对标数据、替代表述（如"替代 XX 进口产品，价格下降 XX%"），大幅提升小巨人打分',
                        excel: '产业链地位突出。建议申报"国家制造业核心竞争力提升计划"或"工信部产业链协同配套示范企业"，可获百万级专项补助'
                    },
                    rdFee: {
                        fail: '研发费用投入强度尚未达到小巨人门槛。按当前营收规模测算，需再投入约 {needInvest} 万元研发费用即可达标；建议立即建立研发费用辅助账，归集工资/折旧/委外费用，可享全额加计扣除减税 + 研发费后补助',
                        pass: '研发费用投入强度刚过小巨人门槛。建议稳定投入并保持增长，同时用最新版辅助账模板复核，避免小巨人审计时被剔除研发费用',
                        excel: '研发费用投入强度远超门槛。建议申请企业研发中心/工程技术中心认定，叠加研发费加计扣除 200% 比例试点，减税力度更大'
                    },
                    rdStaff: {
                        fail: '尚未建立自建/联合研发机构，这是小巨人的硬性要求。建议 6 个月内完成：① 与高校院所共建"工程技术中心"或"企业技术中心"（最快 3 个月获批）② 同步申报"博士后科研工作站"，研发机构资质是小巨人评分硬加分',
                        pass: '已建研发机构。建议升级为"省级企业技术中心/工程技术研究中心"（可获 30-50 万补助）；同时推进 ERP/MES 信息化以支撑小巨人"精细化"维度打分',
                        excel: '研发组织能力完善。建议申报"国家级企业技术中心"或"国家重点实验室"，可获 500 万+ 补助 + 配套政策支持'
                    },
                    ip1: {
                        fail: 'Ⅰ类发明专利数量未达小巨人认定门槛，这是申报被拒的最高发原因。建议：① 走发明专利"加急审查"通道（3 个月拿授权）② 受让 1-2 件高相关发明专利快速补足门槛',
                        pass: 'Ⅰ类知识产权刚过小巨人门槛。建议围绕主导产品密集布局形成专利池（10+ 件Ⅰ类），可在小巨人评审中加分，也为后续单项冠军申报做储备',
                        excel: 'Ⅰ类知识产权专利布局扎实。建议：① 筛选核心专利申请 PCT 国际布局 ② 参与国家标准/行业标准制订 ③ 申报"专利优势示范企业"，三重叠加提升技术影响力'
                    },
                    debt: {
                        fail: '资产负债率超出小巨人财务安全线。建议通过股权融资（天使轮/Pre-A）、应收账款保理、控制库存、与供应商谈账期等方式优化资本结构；科创贷投贷联动也是低息融资选项',
                        pass: '财务结构健康，符合小巨人要求。申报时需提供近三年审计报告 + 现金流预测，确保财务数据无大额异常波动',
                        excel: '资本结构稳健，具备扩产融资空间。建议申请"专精特新企业科创贷"（LPR-50BP 优惠）或申报"北交所专精特新专板"实现直接融资'
                    }
                }
            },
            // 梯度培育方案规则（对照工信部《优质中小企业梯度培育管理办法》+ 科技部高企/专精特新/小巨人/单项冠军四级门槛）
            gradient: {
                type: '梯度培育',
                passLine: 70,
                // 硬指标 = 四级晋升门槛（运营可增删修改顺序）
                hardMetrics: [
                    // 第 1 级 → 科技型中小企业入库（最低门槛，大部分企业可入）
                    { key:'kmb', name:'科技型中小企业入库', desc:'注册满1年+填报信息即可',
                      check:{ boolExpr:'yearsSince(formFoundDate) >= 1', guard:'formFoundDate != ""' },
                      value:{ expr:'"已入库"', unit:'', decimals:0, fallback:'未入库', guard:'yearsSince(formFoundDate) >= 1' } },
                    // 第 2 级 → 省级专精特新认定
                    { key:'profe', name:'省级专精特新·主导产品占比', desc:'≥60%',
                      check:{ expr:'formProdPct', op:'>=', value:60 },
                      value:{ expr:'formProdPct', unit:'%', decimals:0, fallback:'未填' } },
                    { key:'rdRatio', name:'省级专精特新·研发费用占比', desc:'≥3%（营收<5000万）/≥2%（5000万-2亿）/≥1%（>2亿）',
                      check:{ expr:'formRdRatio', op:'>=', value:1 },
                      value:{ expr:'formRdRatio', unit:'%', decimals:1, fallback:'未填' } },
                    { key:'ipMin', name:'省级专精特新·知识产权数量', desc:'≥5项（Ⅰ类≥1）',
                      check:{ expr:'formIPTotal', op:'>=', value:5 },
                      value:{ expr:'formIPTotal', unit:'项', decimals:0, fallback:'未填' } },
                    // 第 3 级 → 专精特新"小巨人"
                    { key:'giantGate', name:'小巨人·省级专精特新资格', desc:'已获省级专精特新认定',
                      check:{ boolExpr:'formProvincial == "是"' },
                      value:{ expr:'formProvincial == "是" ? "已获" : "未获"', unit:'', decimals:0, fallback:'未填' } },
                    { key:'giantRev', name:'小巨人·营收规模', desc:'≥5000万元',
                      check:{ expr:'formRev[2]', op:'>=', value:5000 },
                      value:{ expr:'formRev[2]', unit:'万元', decimals:0, fallback:'未填', guard:'formRev[2] > 0' } },
                    { key:'giantIP', name:'小巨人·Ⅰ类知识产权', desc:'≥4项发明专利',
                      check:{ expr:'formIP1', op:'>=', value:4 },
                      value:{ expr:'formIP1', unit:'项', decimals:0, fallback:'未填' } },
                    { key:'giantChain', name:'小巨人·产业链补短板', desc:'补短板/国产替代/卡脖子三选一',
                      check:{ boolExpr:'formChainCase == "是" || formDomesticSub == "是" || formBreakChoke == "是"' },
                      value:{ expr:'(formChainCase == "是" ? "补短板" : "") + (formDomesticSub == "是" ? "国产替代" : "") + (formBreakChoke == "是" ? "卡脖子" : "")', unit:'', decimals:0, fallback:'未填' } },
                    // 第 4 级 → 制造业单项冠军
                    { key:'championShare', name:'单项冠军·市场占有率', desc:'全国细分市场第一',
                      check:{ boolExpr:'formShare1st == "是"' },
                      value:{ expr:'formShare1st == "是" ? "全国第一" : "未达标"', unit:'', decimals:0, fallback:'未填' } },
                    { key:'championRev', name:'单项冠军·营收规模', desc:'单项冠军产品营收≥5000万元',
                      check:{ expr:'formRev[2] * formProdPct / 100', op:'>=', value:5000 },
                      value:{ expr:'formRev[2] * formProdPct / 100', unit:'万元', decimals:0, fallback:'未填' } }
                ],
                // 评分项 = 工信部梯度培育 6 大维度（前端 scoreGradient 硬编码使用同口径）
                scoreItems: [
                    { key:'tech', name:'技术积累', max:15,
                      calc:{ expr:'formIPTotal >= 20 ? 100 : (formIPTotal / 20 * 100)', cap:100, floor:0 },
                      basis:{ template:'知识产权 {formIPTotal} 项（Ⅰ类 {formIP1}）' } },
                    { key:'rd', name:'研发投入', max:20,
                      calc:{ expr:'(formRdFeePct >= 5 ? 60 : formRdFeePct / 5 * 60) + (formRdFeeTotal2yr >= 1200 ? 40 : formRdFeeTotal2yr / 1200 * 40)', cap:100, floor:0 },
                      basis:{ template:'研发费用占比 {formRdFeePct}%，近两年合计 {formRdFeeTotal2yr} 万元' } },
                    { key:'ip', name:'知识产权', max:15,
                      calc:{ expr:'(formIP1 >= 4 ? 60 : formIP1 / 4 * 60) + (formIP2 >= 10 ? 40 : formIP2 / 10 * 40)', cap:100, floor:0 },
                      basis:{ template:'发明专利 {formIP1} 项，实用新型/软著 {formIP2} 项' } },
                    { key:'transform', name:'成果转化', max:15,
                      calc:{ expr:'formTransform * 10', cap:100, floor:0 },
                      basis:{ template:'年均成果转化 {formTransform} 项' } },
                    { key:'talent', name:'人才队伍', max:15,
                      calc:{ expr:'(formRdStaffPct >= 20 ? 60 : formRdStaffPct / 20 * 60) + (formPostdoc == "是" ? 40 : 0)', cap:100, floor:0 },
                      basis:{ template:'研发人员占比 {formRdStaffPct}%，博士后工作站 {formPostdoc}' } },
                    { key:'market', name:'市场表现', max:20,
                      calc:{ expr:'(formRevGrowth >= 20 ? 60 : formRevGrowth / 20 * 60) + (formSharePass == "是" ? 40 : 0)', cap:100, floor:0 },
                      basis:{ template:'营收增长率 {formRevGrowth}%，市场占有率 {formSharePass}' } }
                ],
                suggestionTexts: {
                    tech: {
                        fail: '技术积累薄弱，研发占比和专利数量均处于培育起步线以下。建议先申报"科技型中小企业"入库（全年滚动受理，门槛低），同步启动发明专利加急审查通道，3个月内获权后即可支撑专精特新申报',
                        pass: '技术基础已具备专精特新培育雏形。建议围绕主导产品密集布局发明专利池（6项以上Ⅰ类专利），为后续小巨人申报储备硬指标；同时申报"市级研发机构"提升技术组织力',
                        excel: '技术实力扎实，已具备冲击小巨人乃至单项冠军的条件。建议筛选核心专利申请PCT国际布局，参与国家/行业标准制订，叠加申报"专利优势示范企业"形成技术护城河'
                    },
                    rd: {
                        fail: '研发投入强度不足，距专精特新3%门槛线有差距。建议立即建立研发费用辅助账，归集工资/折旧/材料/委外费用，可享100%加计扣除减税；同时申报"研发费后补助"（按增量10%-20%补贴，最高200万）',
                        pass: '研发投入刚过专精特新门槛。建议保持每年稳定增长，确保近两年研发费合计≥1200万（小巨人门槛）；加计扣除政策2026年延续100%比例，建议用足税收优惠反哺研发',
                        excel: '研发投入强度优秀，已超小巨人门槛。建议申报"省级企业技术中心/工程技术研究中心"（补助30-50万），叠加争取"重点研发计划"专项（百万级），形成研发投入正循环'
                    },
                    ip: {
                        fail: '知识产权储备不足，影响梯度培育各层级申报。建议：① 发明专利走"加急审查"通道（3个月拿权）② 受让1-2件高相关专利快速补量 ③ 软著批量登记（1个月拿证），先满足专精特新数量门槛',
                        pass: '知识产权数量已达专精特新门槛。建议围绕主导产品构建专利组合（10件以上Ⅰ类），为小巨人申报储备；同步注册核心商标和域名，形成"专利+商标"双重保护',
                        excel: '知识产权布局完善。建议筛选核心专利申请PCT国际保护，参与国家/行业标准制订提升话语权，申报"国家知识产权优势/示范企业"（国家级资质+奖补20-50万）'
                    },
                    transform: {
                        fail: '成果转化能力薄弱，尚未形成产业化路径。建议：① 与高校院所共建"技术转移中心"② 申报"产学研合作项目"（省级补贴10-30万）③ 推动至少1项专利产业化，形成成果转化佐证材料',
                        pass: '已具备基础成果转化能力。建议系统梳理近三年成果转化清单（每项含合同/发票/用户证明），申报"科技成果转化专项资金"；若已获高企认定，可叠加享15%所得税优惠',
                        excel: '成果转化体系成熟。建议申报"省级/国家级科技企业孵化器"或"技术转移示范机构"，参与"首台套重大技术装备"保险补偿（最高补贴价值的10%），推动核心技术规模化应用'
                    },
                    talent: {
                        fail: '研发团队规模偏小，制约梯度培育升级。建议：① 申报"高校毕业生社保补贴"降低用工成本 ② 与高校共建"实习基地"储备研发人才 ③ 引进1-2名核心技术骨干，同步申报"市级人才计划"',
                        pass: '研发团队已具规模。建议申报"博士后科研工作站"（最快3个月获批，可获建站补助20-50万+进站博士生活补贴）；同步推进"工程师联合培养基地"建设，匹配专精特新人才要求',
                        excel: '人才团队结构完善。建议申报"省级/国家级专家工作站"或"院士工作站"（补助50-200万），引进高层次人才申报"万人计划""国务院特殊津贴"等，打造行业领军团队'
                    },
                    market: {
                        fail: '市场表现偏弱，营收规模和份额均处于起步阶段。建议：① 先申报"科技型中小企业"入库 ② 聚焦细分市场做深做透，争取区域市场前列 ③ 利用"专精特新贷""科创贷"（LPR-50BP）扩大产能',
                        pass: '市场表现已达专精特新水平。建议冲刺省级专精特新认定（全年滚动申报），拿到省级资质后可享"专精特新"奖补（省级20-50万）+ 晋级小巨人门槛资格',
                        excel: '市场表现优秀，具备冲击小巨人乃至单项冠军的实力。建议申报"国家级制造业单项冠军企业/产品"（国家级名片+奖补50-100万），同步推进北交所专精特新专板上市融资'
                    }
                }
            }
        }
    };

    /** 读取测评规则引擎（高企/专精特新/小巨人） */
    function loadDiagnosisRules() {
        const data = _read(KEYS.DIAGNOSIS_RULES, null);
        const DEF = DEFAULT_DIAGNOSIS_RULES;
        // 版本不匹配 → 强制使用默认规则（表单项重构/字段变更时触发）
        if (!data || data.version !== DEF.version || !data.rules || typeof data.rules !== 'object') {
            return JSON.parse(JSON.stringify(DEF));
        }
        // 合并：保留 saved 独有的类型 + 缺失字段用 default 补齐
        const merged = { version: DEF.version, rules: {} };
        const allTypes = Array.from(new Set(Object.keys(DEF.rules).concat(Object.keys(data.rules))));
        allTypes.forEach(function(type) {
            const saved = data.rules[type] || {};
            const def = DEF.rules[type] || { type: type, passLine: 0, hardMetrics: [], scoreItems: [], suggestionTexts: {} };
            merged.rules[type] = {
                type: saved.type || def.type,
                passLine: (typeof saved.passLine === 'number') ? saved.passLine : def.passLine,
                hardMetrics: (Array.isArray(saved.hardMetrics) && saved.hardMetrics.length) ? saved.hardMetrics : JSON.parse(JSON.stringify(def.hardMetrics)),
                scoreItems: (Array.isArray(saved.scoreItems) && saved.scoreItems.length) ? saved.scoreItems : JSON.parse(JSON.stringify(def.scoreItems)),
                // 建议文案：按维度逐个合并，运营改过的保留，缺失的维度用默认补齐
                suggestionTexts: Object.assign({}, JSON.parse(JSON.stringify(def.suggestionTexts || {})), saved.suggestionTexts || {})
            };
        });
        return merged;
    }

    /** 保存测评规则引擎 */
    function saveDiagnosisRules(rules) {
        if (!rules || typeof rules !== 'object') return false;
        return _write(KEYS.DIAGNOSIS_RULES, rules);
    }

    /** 重置测评规则引擎为默认值 */
    function resetDiagnosisRules() {
        try {
            localStorage.removeItem(KEYS.DIAGNOSIS_RULES);
            return true;
        } catch (e) {
            console.warn('[data-bridge] 重置规则失败:', e.message);
            return false;
        }
    }

    // ========== 默认客户数据（客户管理页演示数据；字段与注册页对齐：企业=名称/信用代码/联系人/地区/手机号，个人=手机号/地区） ==========
    const DEFAULT_CUSTOMERS = [
        // ========== 企业用户（type:enterprise） ==========
        {
            id: 'U001', type: 'enterprise', registerTime: '2026-08-01',
            name: '星河智造科技有限公司', code: '91330104MA2XXXX5X', industry: '电子信息',
            contact: '王明华', phone: '138****8688', region: '浙江省 杭州市 余杭区',
            employees: 236, revenue: 12000, quals: ['国家高新'],   // 档案补充信息（会员中心完善/测评回填），申报书与智能报告引用
            status: '意向客户', source: '平台注册',
            // 政策匹配条件（多维度，科创测评引擎回填 + 销售补充，智能报告与匹配引擎消费）
            // rdRatio 研发费用占比 / ipCount 核心知识产权数 / sciStaffRatio 科技人员占比 / hiTechRatio 高品收入占比
            // loss3y 近三年亏损 / rndProject 在研项目 / industryUni 产学研合作 / fundPref 扶持偏好 / windowPref 申报窗口
            assessmentConditions: { rdRatio: 7.2, ipCount: 5, sciStaffRatio: 14, hiTechRatio: 68, loss3y: false, rndProject: true, industryUni: true, fundPref: '补贴+税收减免', windowPref: 'Q2' },
            credits: 620,
            creditHistory: [
                { date: '2026-09-05', item: '购买 VIP1 套餐（680 元）', amount: 600 },
                { date: '2026-08-10', item: '任务奖励 · 完善企业画像', amount: 50 },
                { date: '2026-08-03', item: '企业认证奖励', amount: 200 },
                { date: '2026-08-01', item: '注册赠送', amount: 100 }
            ],
            followups: [
                { type: '电话沟通', date: '2026-08-06', content: '客户对专精特新政策申报兴趣浓厚，约定下周上门拜访。', plan: '2026-08-13' },
                { type: '上门拜访', date: '2026-07-25', content: '与财务总监沟通研发费用归集问题，介绍高企认定要点。', plan: '' }
            ]
        },
        {
            id: 'U002', type: 'enterprise', registerTime: '2026-07-20',
            name: '康泰生物制药有限公司', code: '91330104MA2XXXY2K', industry: '生物医药',
            contact: '李建国', phone: '139****2266', region: '浙江省 杭州市 滨江区',
            employees: 480, revenue: 28000, quals: ['国家高新', '专精特新'],
            status: '成交客户', source: '平台注册',
            assessmentConditions: { rdRatio: 9.5, ipCount: 12, sciStaffRatio: 18, hiTechRatio: 75, loss3y: false, rndProject: true, industryUni: true, fundPref: '资质认定', windowPref: '全年' },
            credits: 1180,
            creditHistory: [
                { date: '2026-08-15', item: '购买 VIP2 套餐（1680 元）', amount: 1200 },
                { date: '2026-08-05', item: '兑换码兑换（CYOLD-01）', amount: 88 },
                { date: '2026-07-22', item: '企业认证奖励', amount: 200 },
                { date: '2026-07-20', item: '注册赠送', amount: 100 }
            ],
            followups: [
                { type: '上门拜访', date: '2026-07-25', content: '签订生物医药专项申报服务合同，预付款已到账。', plan: '2026-08-15' }
            ]
        },
        {
            id: 'U003', type: 'enterprise', registerTime: '2026-09-10',
            name: '锐达新材料股份公司', code: '91330104MA2XXXY3L', industry: '新材料',
            contact: '陈晓敏', phone: '137****6699', region: '浙江省 宁波市 镇海区',
            employees: 120, revenue: 6500, quals: [],
            status: '潜在客户', source: '平台注册',
            assessmentConditions: { rdRatio: 3.1, ipCount: 1, sciStaffRatio: 6, hiTechRatio: 45, loss3y: true, rndProject: false, industryUni: false, fundPref: '补贴', windowPref: 'Q4' },
            credits: 88,
            creditHistory: [
                { date: '2026-09-10', item: '注册赠送', amount: 100 }
            ],
            followups: []
        },
        // ========== 外部存量客户（source:销售录入，未注册平台 → 仅支持外链分享触达） ==========
        {
            id: 'U007', type: 'enterprise', registerTime: '',   // registerTime 为空 = 无平台账号
            name: '绿能新能源科技有限公司', code: '91330402MA2XXXX7Q', industry: '新能源',
            contact: '陈志远', phone: '139****8899', region: '浙江省 嘉兴市 南湖区',
            employees: 180, revenue: 18000, quals: ['国家高新', '科技型中小企业'],
            status: '意向客户', source: '销售录入',
            // 外部存量客户：销售补充条件，测评未跑（数据不完整，匹配引擎按已知条件保守推荐）
            assessmentConditions: { rdRatio: 4.8, ipCount: 2, sciStaffRatio: 9, hiTechRatio: 52, loss3y: false, rndProject: true, industryUni: false, fundPref: '补贴+资质认定', windowPref: 'Q3', __measured: false },
            credits: 0, creditHistory: [],
            followups: [
                { type: '微信沟通', date: '2026-09-02', content: '客户打开分享的政策匹配报告多次，对省新能源产业专项兴趣浓厚，询问申报窗口期。', plan: '2026-09-10' }
            ]
        },
        // ========== 个人用户（type:personal） ==========
        {
            id: 'U004', type: 'personal', registerTime: '2026-09-15',
            realName: '张小明', phone: '138****1234', occupation: '软件工程师', region: '浙江省 杭州市 西湖区',
            status: '活跃用户', source: '平台注册',
            credits: 620,
            creditHistory: [
                { date: '2026-10-02', item: '购买 VIP1 套餐（680 元）', amount: 600 },
                { date: '2026-09-18', item: '任务奖励 · 完成首次科创测评', amount: 80 },
                { date: '2026-09-15', item: '注册赠送', amount: 100 }
            ],
            followups: [
                { type: '微信沟通', date: '2026-09-20', content: '用户咨询租房补贴申请条件，已发送政策解读。', plan: '' }
            ]
        },
        {
            id: 'U005', type: 'personal', registerTime: '2026-10-01',
            realName: '李晓红', phone: '136****5678', occupation: '高校教师', region: '浙江省 杭州市 拱墅区',
            status: '潜在用户', source: '平台注册',
            credits: 100,
            creditHistory: [
                { date: '2026-10-01', item: '注册赠送', amount: 100 }
            ],
            followups: []
        },
        {
            id: 'U006', type: 'personal', registerTime: '2026-10-05',
            realName: '王大伟', phone: '135****9012', occupation: '算法研究员', region: '浙江省 杭州市 滨江区',
            status: '意向用户', source: '平台注册',
            credits: 120,
            creditHistory: [
                { date: '2026-10-06', item: '任务奖励 · 完善个人职业画像', amount: 50 },
                { date: '2026-10-05', item: '注册赠送', amount: 100 }
            ],
            followups: [
                { type: '电话沟通', date: '2026-10-06', content: '博士刚毕业来杭，咨询安家补贴和人才政策，非常积极。', plan: '2026-10-12' }
            ]
        }
    ];

    /** 读取客户数据 */
    function loadCustomers() {
        const data = _read(KEYS.CUSTOMERS, null);
        if (!Array.isArray(data)) return JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS));
        // 种子升级：旧版无 personal 类型用户（默认 type='enterprise' 补的），强制刷新为新种子
        const hasPersonal = data.some(u => u && u.type === 'personal');
        if (!hasPersonal) return JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS));
        // 客户来源兜底：旧数据无 source 视为「平台注册」（来源取值：平台注册/销售录入/批量导入/分享转化）
        // assessmentConditions 兜底：政策匹配条件（科创测评+销售补充），旧数据无则补一个默认空结构
        data.forEach(function(u) {
            if (u && !u.source) u.source = '平台注册';
            if (u && !u.assessmentConditions) {
                u.assessmentConditions = {
                    rdRatio: null, ipCount: null, sciStaffRatio: null, hiTechRatio: null,
                    loss3y: null, rndProject: null, industryUni: null, fundPref: '', windowPref: '', __measured: false
                };
            }
        });
        // 增量合并：补入本地缺失的种子客户（如 U007 外部存量客户），不覆盖已有数据
        DEFAULT_CUSTOMERS.forEach(function(du) {
            if (!data.some(function(u) { return u && u.id === du.id; })) data.push(JSON.parse(JSON.stringify(du)));
        });
        return data;
    }

    /** 保存客户数据 */
    function saveCustomers(customers) {
        if (!Array.isArray(customers)) return false;
        return _write(KEYS.CUSTOMERS, customers);
    }

    // ========== 默认智能报告（含分享记录 shares[]，每条记录 = 一次分享给某个客户的链接） ==========
    // 报告: { id, title, customerName, type, createdAt, company, diagnosis, summary, profile, policies, advice, shares[] }
    // shares[i]: { shareId, toName, toPhone, channel('站内推送'=客户有平台账号 / '外链'=微信等外部渠道),
    //              createdAt, expireAt, converted(该分享是否已促成注册转化), convertedAt, views: [{at, durSec}] }
    const DEFAULT_SALES_REPORTS = [
        {
            id: 'R20260901', title: '绿能新能源政策匹配分析报告', customerName: '绿能新能源科技有限公司',
            type: '政策匹配', createdAt: '2026-09-01 15:40',
            company: { name: '绿能新能源科技有限公司', code: '91330402MA2XXXX7Q', industry: '新能源（光伏储能）', contact: '陈志远', phone: '139****8899', employees: 180, revenue: 18000, region: '嘉兴南湖', quals: ['国家高新', '科技型中小企业'] },
            diagnosis: { avg: 65, grade: 'B', weak: ['研发费用占比不足 5%（高企门槛）', '核心知识产权数量偏少', '科技人员占比不足 10%', '高品收入占比不足 60%'] },
            matchConditions: {
                '自动补齐 · 行业': '新能源（光伏储能）', '自动补齐 · 资质': '国家高新、科技型中小企业',
                '测评回填 · 科创得分': '65 · B', '测评回填 · 研发占比': '4.8%', '测评回填 · 知识产权': '2 项',
                '销售补充 · 近三年亏损': '否', '销售补充 · 在研项目': '有',
                '销售补充 · 扶持偏好': '补贴+资质认定', '销售补充 · 申报窗口': 'Q3'
            },
            summary: '绿能新能源科技有限公司（新能源）经多维度政策匹配引擎分析：本次采集 9 项条件，命中可申报政策 3 项，预计可获权益 480 万元，科创得分 65 · B 级。国家高新技术企业认定因研发费用占比（4.8%）、科技人员占比（9%）、高品收入占比（52%）三项未达门槛，暂不适用。',
            profile: '企业位于嘉兴南湖，属新能源（光伏储能）行业，现有员工 180 人，年营收约 1.8 亿元。已获国家高新、科技型中小企业资质，但本次测评显示研发费用占比 4.8%、科技人员占比 9%、高品收入占比 52%，均低于高企复审门槛，科创综合得分 65 分（评级 B），建议优先补齐研发费用归集与研发人员配置。',
            policies: [
                { title: '研发费用加计扣除', benefit: '减税 150万', level: '高匹配', match: 100 },
                { title: '省新能源产业发展专项', benefit: '最高 300万', level: '中匹配', match: 80 },
                { title: '省级专精特新中小企业', benefit: '补贴 50万', level: '中匹配', match: 72 },
                { title: '国家高新技术企业认定', benefit: '补贴 30万', level: '不可匹配', match: 0, reason: '研发费用占比 4.8% 未达 5%；科技人员占比 9% 未达 10%；高品收入占比 52% 未达 60%' }
            ],
            advice: '1. 建议优先申报「研发费用加计扣除」（匹配度 100%），可与省新能源产业发展专项同步推进，注意研发费用辅助账口径一致性。\n2. 省新能源产业发展专项匹配度 80%，储能系统集成方向与专项支持领域契合，建议在 Q3 窗口期（7-9月）启动申报。\n3. 国家高新技术企业认定缺口集中在研发费用占比、科技人员占比、高品收入占比三项指标，建议先补齐指标再启动复审。',
            shares: [
                { shareId: 'S303', toName: '陈志远', toPhone: '139****8899', channel: '站内推送', createdAt: '2026-10-15 10:30', expireAt: '',
                  views: [] },
                { shareId: 'S301', toName: '陈志远', toPhone: '139****8899', channel: '外链', createdAt: '2026-09-01 16:05', expireAt: '2026-10-01',
                  views: [ {at:'2026-09-01 20:15',durSec:165}, {at:'2026-09-02 08:40',durSec:230}, {at:'2026-09-03 21:05',durSec:285}, {at:'2026-09-04 09:18',durSec:142} ] },
                { shareId: 'S302', toName: '项目申报-林晓', toPhone: '136****2233', channel: '外链', createdAt: '2026-09-02 09:35', expireAt: '2026-10-02',
                  converted: true, convertedAt: '2026-09-05 10:22',
                  views: [ {at:'2026-09-02 10:05',durSec:120}, {at:'2026-09-04 10:42',durSec:88} ] },
                { shareId: 'AUTO_202609031422', toName: '（匿名访问）', toPhone: '', channel: '外链', createdAt: '2026-09-03 14:22', expireAt: '',
                  views: [ {at:'2026-09-03 14:22',durSec:40} ] }
            ]
        },
        // 绿能新能源第二份报告（站内消息演示数据：已读的历史推送，与未读的 S303 形成新旧对比）
        {
            id: 'R20261010', title: '绿能新能源专精特新申报规划报告', customerName: '绿能新能源科技有限公司',
            type: '申报规划', createdAt: '2026-10-10 15:30',
            company: { name: '绿能新能源科技有限公司', code: '91330402MA2XXXX7Q', industry: '新能源（光伏储能）', contact: '陈志远', phone: '139****8899', employees: 180, revenue: 18000, region: '嘉兴南湖', quals: ['国家高新', '科技型中小企业'] },
            diagnosis: { avg: 65, grade: 'B', weak: ['研发费用占比不足 5%（高企门槛）', '核心知识产权数量偏少'] },
            matchConditions: {
                '自动补齐 · 行业': '新能源（光伏储能）', '自动补齐 · 资质': '国家高新、科技型中小企业',
                '测评回填 · 科创得分': '65 · B', '测评回填 · 研发占比': '4.8%', '测评回填 · 知识产权': '2 项',
                '销售补充 · 近三年亏损': '否', '销售补充 · 在研项目': '有', '销售补充 · 产学研合作': '有',
                '销售补充 · 扶持偏好': '资质认定', '销售补充 · 申报窗口': 'Q4'
            },
            summary: '绿能新能源科技有限公司申报规划专项分析：省级专精特新中小企业当前匹配度 72%，缺口集中在研发费用占比（4.8%＜3% 门槛已达标，但评审竞争力偏弱）与知识产权数量（2 项）。按本规划补齐后，预计 2026 年 Q4 窗口期申报通过率可达 85% 以上。',
            profile: '企业位于嘉兴南湖，属新能源（光伏储能）行业，现有员工 180 人，年营收约 1.8 亿元。已获国家高新、科技型中小企业资质，拥有储能系统集成方向在研项目并与高校建立产学研合作，具备专精特新申报基础。',
            policies: [
                { title: '省级专精特新中小企业', benefit: '补贴 50万', level: '中匹配', match: 72 },
                { title: '省新能源产业发展专项', benefit: '最高 300万', level: '中匹配', match: 80 }
            ],
            advice: '1. Q4 窗口期（10-12月）前完成 2 项实用新型专利申报，知识产权数量达到 4 项。\n2. 规范研发费用辅助账，将研发占比稳定在 5% 以上，同步满足高企复审与专精特新双重要求。\n3. 整理产学研合作协议与在研项目立项文件，作为专精特新「创新能力」评审加分材料。',
            shares: [
                { shareId: 'S304', toName: '陈志远', toPhone: '139****8899', channel: '站内推送', createdAt: '2026-10-10 16:10', expireAt: '',
                  views: [ {at:'2026-10-11 09:22',durSec:196}, {at:'2026-10-13 21:40',durSec:88} ] }
            ]
        },
        // 个人账号「张三」的报告（站内消息演示数据：个人用户场景，未读推送）
        {
            id: 'R20261012', title: '个人科创画像与政策机会报告', customerName: '张三（个人用户）',
            type: '政策匹配', createdAt: '2026-10-12 10:20',
            company: { name: '张三（个人）', code: '', industry: '信息技术（在孵项目）', contact: '张三', phone: '136****0000', employees: 1, revenue: 0, region: '四川 成都', quals: ['在孵创业团队'] },
            diagnosis: { avg: 58, grade: 'C', weak: ['尚无企业主体（多数补贴需企业申报）', '知识产权以个人名义持有，需确权到主体'] },
            matchConditions: {
                '自动补齐 · 身份': '个人用户', '自动补齐 · 地区': '四川 成都',
                '测评回填 · 科创得分': '58 · C', '测评回填 · 知识产权': '1 项（个人持有）',
                '销售补充 · 计划注册企业': '是（3 个月内）', '销售补充 · 扶持偏好': '补贴+孵化',
                '销售补充 · 申报窗口': 'Q4'
            },
            summary: '张三（个人用户）经政策匹配引擎分析：当前以个人身份可直接申报的政策 1 项（科技成果转化补贴，需完成技术合同登记）；另有 3 项政策（研发项目立项补贴、瞪羚企业认定奖励、省级专精特新）需注册企业主体后申报，建议 3 个月内完成公司注册与知识产权确权。',
            profile: '用户位于四川成都，信息技术方向在孵创业项目，持有 1 项个人名义软件著作权，计划 3 个月内注册科技型公司。科创综合得分 58 分（评级 C），主要短板为缺少企业申报主体。',
            policies: [
                { title: '科技成果转化补贴', benefit: '最高 25万', level: '中匹配', match: 68 },
                { title: '研发项目立项补贴', benefit: '最高 50万', level: '不可匹配', match: 0, reason: '需企业申报主体（用户当前为个人身份）' },
                { title: '瞪羚企业认定奖励', benefit: '一次性 8万', level: '不可匹配', match: 0, reason: '需企业申报主体且成立满 3 年' }
            ],
            advice: '1. 先完成技术合同登记，以个人身份申报「科技成果转化补贴」。\n2. 3 个月内注册有限责任公司，将软著确权至公司名下。\n3. 公司注册后联系我重新测评，研发项目立项补贴预计可达「高匹配」。',
            shares: [
                { shareId: 'S305', toName: '张三', toPhone: '136****0000', channel: '站内推送', createdAt: '2026-10-12 10:45', expireAt: '',
                  views: [] }
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
            id: 'R20260820', title: '天启信息科创测评报告', customerName: '天启信息技术有限公司',
            type: '能力诊断', createdAt: '2026-08-20 10:05',
            company: { name: '天启信息技术有限公司', code: '91330106MA2XXXX8T', industry: '软件信息（SaaS服务）', contact: '周海燕', phone: '138****5566', employees: 96, revenue: 6800, region: '杭州西湖', quals: ['科技型中小企业'] },
            diagnosis: { avg: 61, grade: 'C', weak: ['知识产权', '成果转化', '研发组织'] },
            summary: '天启信息技术有限公司为企业提供 SaaS 化客户管理与数据分析服务。经 AI 科创测评，综合得分 61 分（评级 C），知识产权、成果转化、研发组织三项为明显短板。企业可申报政策 3 项，预计可获权益 75 万元，建议先夯实研发管理基础再申报高企。',
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
            diagnosis: { avg: 95, grade: 'A', weak: ['无明显短板'] },
            // 本次匹配使用的条件（三类来源：自动补齐=客户档案 / 测评回填=科创测评引擎 / 销售补充=销售填写）
            matchConditions: {
                '自动补齐 · 行业': '电子信息', '自动补齐 · 资质': '国家高新',
                '测评回填 · 科创得分': '95 · A', '测评回填 · 研发占比': '7.2%', '测评回填 · 知识产权': '5 项',
                '销售补充 · 近三年亏损': '否', '销售补充 · 在研项目': '有',
                '销售补充 · 扶持偏好': '补贴+税收减免', '销售补充 · 申报窗口': 'Q2'
            },
            summary: '星河智造科技有限公司（电子信息）经多维度政策匹配引擎分析：本次采集 9 项条件，命中可申报政策 3 项，预计可获权益 160 万元，科创得分 95 · A 级。省新能源产业发展专项因行业门槛（需含「新能源」）不满足，暂不适用。',
            profile: '企业位于杭州余杭，属电子信息行业，现有员工 236 人，年营收约 1.2 亿元。已获国家高新资质认定。本次测评硬性条件全部达标（研发费用占比 7.2%、核心知识产权 5 项、科技人员占比 14%、高品收入占比 68%），科创能力综合得分 95 分（评级 A），无明显短板。',
            policies: [
                { title: '研发费用加计扣除', benefit: '减税 80万', level: '高匹配', match: 100 },
                { title: '国家高新技术企业认定', benefit: '补贴 30万', level: '高匹配', match: 99 },
                { title: '省级专精特新中小企业', benefit: '补贴 50万', level: '高匹配', match: 91 },
                { title: '省新能源产业发展专项', benefit: '最高 300万', level: '不可匹配', match: 0, reason: '行业不满足门槛（需包含「新能源」，实际「电子信息」）' }
            ],
            advice: '1. 建议优先申报「研发费用加计扣除」（匹配度 100%），可与国家高新技术企业认定复审材料同步准备。\n2. 省级专精特新中小企业匹配度 91%，建议在 Q2 窗口期（4-6月）前完成知识产权与产学研合作材料归档。\n3. 省新能源产业发展专项受行业范围限制不适用；如后续业务拓展至新能源储能方向，可重新评估申报。',
            shares: [
                { shareId: 'S001', toName: '王明华', toPhone: '138****8688', channel: '站内推送', createdAt: '2026-07-28 10:15', expireAt: '2026-10-26',
                  views: [ {at:'2026-07-29 11:08',durSec:70}, {at:'2026-07-30 14:30',durSec:92}, {at:'2026-08-01 09:45',durSec:138}, {at:'2026-08-02 15:12',durSec:185}, {at:'2026-08-03 10:23',durSec:260} ] },
                { shareId: 'S002', toName: '研发部-张经理', toPhone: '139****1122', createdAt: '2026-08-01 16:40', expireAt: '2026-10-30',
                  views: [ {at:'2026-08-02 09:15',durSec:45}, {at:'2026-08-03 14:20',durSec:88} ] },
                { shareId: 'S003', toName: '董秘办', toPhone: '', createdAt: '2026-08-04 11:00', expireAt: '2026-11-02', views: [] }
            ]
        },
        {
            id: 'R20260801', title: '康泰生物科创测评报告', customerName: '康泰生物制药有限公司',
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
                { shareId: 'S101', toName: '李建国', toPhone: '139****2266', channel: '站内推送', createdAt: '2026-08-01 11:00', expireAt: '2026-10-30',
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
    // v3：星河智造 / 绿能新能源两份种子报告按「多条件匹配引擎」重算（含 matchConditions 与不可匹配项）
    // v4：新增绿能申报规划报告（R20261010）；v5：新增个人用户「张三」报告（R20261012）
    var SALES_REPORTS_SEED_V = 5;
    // 需按新匹配引擎刷新分析结论的种子报告 id（仅刷新分析类字段，不动分享记录等业务数据）
    var SALES_REPORTS_RECOMPUTED = ['R20260802', 'R20260901'];
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
        // 分享字段补齐：种子报告的分享记录缺 channel/converted 时按种子补齐；缺失的种子分享（如站内推送 S303）幂等补入；其余旧记录 channel 兜底「外链」（不覆盖业务数据）
        DEFAULT_SALES_REPORTS.forEach(function(dr) {
            var hit = null;
            for (var i = 0; i < list.length; i++) if (list[i].id === dr.id) { hit = list[i]; break; }
            if (!hit || !Array.isArray(hit.shares)) return;
            hit.shares.forEach(function(s) {
                if (!s) return;
                var ds = null;
                for (var j = 0; j < dr.shares.length; j++) if (dr.shares[j].shareId === s.shareId) { ds = dr.shares[j]; break; }
                if (ds) {
                    if (!s.channel && ds.channel) s.channel = ds.channel;
                    if (s.converted == null && ds.converted != null) { s.converted = ds.converted; s.convertedAt = ds.convertedAt; }
                }
                if (!s.channel) s.channel = '外链';
            });
            dr.shares.forEach(function(ds) {
                var exists = false;
                for (var k = 0; k < hit.shares.length; k++) if (hit.shares[k] && hit.shares[k].shareId === ds.shareId) { exists = true; break; }
                if (!exists) hit.shares.push(JSON.parse(JSON.stringify(ds)));
            });
        });
        // 种子演示数据增量合并：补入本地缺失的报告；已存在但分享记录为空的种子报告，补回演示分享
        var seedV = parseInt(_read(SALES_REPORTS_SEED_KEY, '0'), 10) || 0;
        if (seedV < SALES_REPORTS_SEED_V) {
            var changed = false;
            // 按新匹配引擎重算的种子报告：刷新分析结论（policies / matchConditions / diagnosis / 文案）
            SALES_REPORTS_RECOMPUTED.forEach(function(id) {
                var dr = null, hit = null;
                DEFAULT_SALES_REPORTS.forEach(function(d) { if (d.id === id) dr = d; });
                for (var i = 0; i < list.length; i++) if (list[i].id === id) { hit = list[i]; break; }
                if (!dr || !hit) return;
                hit.policies = JSON.parse(JSON.stringify(dr.policies));
                if (dr.matchConditions) hit.matchConditions = JSON.parse(JSON.stringify(dr.matchConditions));
                ['diagnosis', 'summary', 'profile', 'advice'].forEach(function(f) {
                    if (dr[f] != null) hit[f] = JSON.parse(JSON.stringify(dr[f]));
                });
                changed = true;
            });
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
        DEFAULT_DECLARATION_TEMPLATES,
        DEFAULT_DIAGNOSIS_RULES,
        DEFAULT_CUSTOMERS,
        DEFAULT_SALES_REPORTS,
        DEFAULT_SERVICE_PRODUCTS,
        DEFAULT_SERVICE_ORDERS,
        DEFAULT_CLUES,
        CONTRIB_POINTS,
        // 读取
        loadPolicyDB,
        loadPolicyLibrary,
        loadCrawlerSources,
        loadProfileDict,
        saveProfileDict,
        loadEnterpriseProfile,
        loadEnterpriseList,
        saveEnterpriseProfile,
        deleteEnterpriseProfile,
        batchStatus,
        isDeclaration: function(p) { return (p && p.policyType === 'declaration'); },
        isNotice: function(p) { return (p && p.policyType === 'notice'); },
        loadCostConfig,
        loadCashflowConfig,
        loadQualRules,
        loadCalcSchemes,
        loadDeclarationProjects,
        loadDeclarationTemplates,
        pickDeclarationTemplate,
        loadDiagnosisRules,
        loadCustomers,
        loadSalesReports,
        loadServiceProducts,
        loadServiceOrders,
        loadClues,
        loadContributions,
        loadUserContributions,
        matchPoliciesForEnterprise,
        evaluatePolicyCondition,
        getSyncStatus,
        // 写入
        savePolicyDB,
        savePolicyLibrary,
        saveCrawlerSources,
        saveCostConfig,
        saveCashflowConfig,
        saveQualRules,
        saveDeclarationProjects,
        saveDeclarationTemplates,
        saveDiagnosisRules,
        resetDiagnosisRules,
        saveCustomers,
        saveSalesReports,
        saveServiceProducts,
        saveServiceOrders,
        saveClues,
        loadPolicyShares,
        savePolicyShares,
        addPolicyShare,
        loadConsultMessages,
        saveConsultMessages,
        addConsultMessage,
        loadEntrusts,
        saveEntrusts,
        addEntrust,
        saveContributions,
        submitContribution,
        approveContribution,
        rejectContribution,
        addServiceOrder,
        loadCart,
        saveCart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        addClue,
        addCalcScheme,
        clearCalcSchemes
    };

})(window);
