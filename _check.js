
    // ========== 0. 企业材料库（模拟数据，真实场景来自 material_library 接口）==========
    var LIBRARY_CATS = ['全部', '营业执照', '财务报告', 'IP证书', '资质文件', '管理制度'];
    var LIBRARY = [
        { id:'L01', name:'营业执照_2024版.pdf', cat:'营业执照', size:'2.3MB', time:'2025-06-12', usage:['高企2025','专精特新2025'], matched:false },
        { id:'L02', name:'2024年度审计报告.pdf', cat:'财务报告', size:'8.7MB', time:'2025-04-30', usage:['高企2025'], matched:true, matchReason:'与当前项目"审计报告"需求匹配' },
        { id:'L03', name:'2023年度审计报告.pdf', cat:'财务报告', size:'7.9MB', time:'2024-05-15', usage:['高企2024'], matched:true, matchReason:'与当前项目"审计报告"需求匹配' },
        { id:'L04', name:'2022年度审计报告.pdf', cat:'财务报告', size:'6.5MB', time:'2023-06-20', usage:['高企2023'], matched:true, matchReason:'与当前项目"审计报告"需求匹配' },
        { id:'L05', name:'发明专利_高效组件封装ZL20211.pdf', cat:'IP证书', size:'1.2MB', time:'2023-06-15', usage:['高企2023','高企2025'], matched:true, matchReason:'匹配"知识产权证书"需求' },
        { id:'L06', name:'发明专利_MPPT算法ZL20211.pdf', cat:'IP证书', size:'1.1MB', time:'2024-01-08', usage:['高企2025'], matched:true, matchReason:'匹配"知识产权证书"需求' },
        { id:'L07', name:'实用新型_智能汇流箱ZL20222.pdf', cat:'IP证书', size:'0.8MB', time:'2024-03-22', usage:['高企2025'], matched:true, matchReason:'匹配"知识产权证书"需求' },
        { id:'L08', name:'软件著作权登记证书_监控系统.pdf', cat:'IP证书', size:'0.5MB', time:'2024-05-10', usage:['高企2025'], matched:true, matchReason:'匹配"知识产权证书"需求' },
        { id:'L09', name:'高新技术企业证书.pdf', cat:'资质文件', size:'0.6MB', time:'2023-10-25', usage:['高企2023'], matched:false },
        { id:'L10', name:'ISO9001质量管理体系认证.pdf', cat:'资质文件', size:'1.8MB', time:'2024-08-01', usage:['客户审核'], matched:false },
        { id:'L11', name:'研发项目管理制度汇编.pdf', cat:'管理制度', size:'3.4MB', time:'2025-01-15', usage:['高企2025'], matched:true, matchReason:'匹配"研发组织管理制度"需求' },
        { id:'L12', name:'知识产权管理办法.pdf', cat:'管理制度', size:'1.2MB', time:'2025-01-15', usage:['内部管理'], matched:true, matchReason:'匹配"IP关联研发项目说明"需求' },
        { id:'L13', name:'2024年度企业所得税申报表.pdf', cat:'财务报告', size:'4.2MB', time:'2025-03-18', usage:['高企2025'], matched:true, matchReason:'匹配"所得税申报表"需求' },
        { id:'L14', name:'社保缴纳证明_202601-06.pdf', cat:'资质文件', size:'1.5MB', time:'2026-07-08', usage:['专精特新2025'], matched:false }
    ];

    // ========== 基础导航 ==========
    function goPage(url) {
        if (parent && parent.window && parent.window.switchPage) {
            parent.window.switchPage(url, null);
        } else {
            window.location.href = url;
        }
    }
    function newChat() { alert('已创建新对话'); }
    function switchHistory(el, title) { goPage('dashboard.html'); }
    function showToast(msg, type) {
        type = type || 'success';
        var m = { success:'bg-green-500', info:'bg-blue-500', warn:'bg-orange-500', error:'bg-red-500'};
        var i = { success:'check-circle', info:'info-circle', warn:'exclamation-triangle', error:'times-circle'};
        var d = document.createElement('div');
        d.className = m[type]+' text-white px-5 py-3 rounded-xl shadow-xl fixed top-6 right-6 z-[9999] text-sm font-bold flex items-center space-x-2';
        d.style.cssText='opacity:0;transform:translateX(20px);transition:all .3s;';
        d.innerHTML = '<i class="fa fa-'+i[type]+'"></i><span>'+msg+'</span>';
        document.body.appendChild(d);
        requestAnimationFrame(function(){ d.style.opacity='1'; d.style.transform='translateX(0)'; });
        setTimeout(function(){ d.style.opacity='0'; d.style.transform='translateX(20px)'; setTimeout(function(){ d.remove(); }, 300); }, 2600);
    }

    // ========== 1. 项目数据（按政策类型动态配置材料清单与阶段）==========
    var PROJECTS = [
        {
            id: 'gqx',
            name: '2026年国家高新技术企业认定',
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
            // 个性化材料清单（按政策类型自动生成）
            groups: [
                { title:'一、基础资质类材料', icon:'fa-id-card', color:'blue', items:[
                    { id:'m1', name:'高新技术企业认定申请书', required:true, status:'done', tip:'系统在线填写后导出PDF，需法人签字、加盖企业公章后扫描上传；填写数据需与审计报告、纳税申报表口径完全一致。', sampleName:'高企申请书填写样例.pdf', samplePreview:'申请书共包含8个核心章节：企业基本信息、知识产权表、研发项目表、科技成果转化表、研发组织管理水平表、企业财务状况表、近3年研发投入表、高新产品收入表。...' },
                    { id:'m2', name:'企业营业执照副本', required:true, status:'done', tip:'三证合一彩色扫描件，需最新年检有效状态；若企业名称有变更，需同步上传工商局名称变更核准通知书。', sampleName:'营业执照扫描件样例.jpg', samplePreview:'统一社会信用代码：913701XXXXXXXXXXXX 企业名称：济南XX新能源科技有限公司 类型：有限责任公司 法定代表人：XXX 注册资本：5000万元整 成立日期：2018年XX月XX日...' },
                    { id:'m3', name:'近3年年度审计报告', required:true, status:'done', tip:'必须具备资质的会计师事务所出具；合并报表需同时提供单体报告；报告首页防伪二维码需清晰可扫。', sampleName:'年度审计报告模板.pdf', samplePreview:'XX会专审字[2025]第XXX号 审计报告 我们审计了后附的XX公司财务报表，包括202X年12月31日的资产负债表、202X年度的利润表、现金流量表、所有者权益变动表以及财务报表附注。...' },
                    { id:'m4', name:'企业所得税年度纳税申报表', required:true, status:'warn', tip:'近3年A类申报表主表+全部附表；需税务局章或电子税务局在线导出；研发费用加计扣除优惠明细表(A107012)务必完整。', sampleName:'企业所得税申报表样例.pdf', samplePreview:'中华人民共和国企业所得税年度纳税申报表(A类) 税款所属期间：2025年01月01日 至 2025年12月31日 金额单位：人民币元(列至角分) 行次 类别 项 目 金 额 ...' },
                ]},
                { title:'二、知识产权类材料', icon:'fa-shield', color:'orange', items:[
                    { id:'m5', name:'知识产权证书及缴费凭证', required:true, status:'done', tip:'发明专利、实用新型、软著等证书扫描件+最近一次年费缴费收据；权属人须为申报企业，未发生转让或变更。', sampleName:'专利证书样例.png', samplePreview:'证书号第XXXXXX号 发明专利证书 发明名称：一种高效光伏组件封装方法 发明人：XXX 专利号：ZL 2021 1 0XXXXXX.X 专利权人：济南XX新能源科技有限公司...' },
                    { id:'m6', name:'知识产权有效性评价报告', required:true, status:'warn', tip:'国家知识产权局出具的专利权评价报告（针对实用新型/软著）；或由省级以上协会出具的IP有效性证明；出具时间需在申报期内。', sampleName:'专利权评价报告样例.pdf', samplePreview:'国家知识产权局 专利权评价报告 专利号：ZL 2022 2 XXXXXXXX 专利权人：济南XX新能源科技有限公司 外观设计名称：智能光伏汇流箱外壳 评价结论：全部权利要求符合专利法规定...' },
                    { id:'m7', name:'知识产权关联研发项目说明', required:false, status:'todo', tip:'每项IP对应说明其来源（自主研发/受让/独占许可）、与核心技术关联度、在高新产品中的应用场景。建议按IP清单做一张映射矩阵表。', sampleName:'IP-项目映射表.xlsx', samplePreview:'序号|专利名称|专利号|对应研发项目|转化产品|应用情况 1|高效光伏组件封装|ZL20211...|RD03 高效组件研发|P2 450W组件|核心工艺 2|智能汇流箱结构|ZL20222...|RD05 监控系统|P5 智能汇流箱|核心结构...' },
                ]},
                { title:'三、研发投入与财务类', icon:'fa-line-chart', color:'green', items:[
                    { id:'m8', name:'近3年研发费用辅助账', required:true, status:'todo', tip:'**核心打分项**：按八大费用分类（人员人工、直接投入、折旧、装备调试、无形资产摊销、设计费、委外研发、其他）；委外需提供合同+发票；其他费用不得超过研发总额20%。', sampleName:'研发费用辅助账模板.xlsx', samplePreview:'研发项目编号：RD03 项目名称：高效光伏组件研发 科目 2023年度 2024年度 2025年度 合计 人员人工 180.5 240.8 320.5 741.8 直接投入 96.2 138.5 185.2 419.9 折旧费用 48.0 52.0 58.0 158.0 ...' },
                    { id:'m9', name:'高新产品收入明细表', required:true, status:'warn', tip:'高新产品（PS）收入须占同期总收入≥60%；每项PS提供对应销售发票样本（3-5张大额）、合同首页关键页；核心PS收入建议单独标注。', sampleName:'高新产品收入表.xlsx', samplePreview:'高新产品名称 收入金额(万元) 占比 对应核心技术 对应知识产权 P2 450W高效组件 8,200 32.5% 低损耗封装工艺 ZL20211... P5 智能汇流箱 3,600 14.3% MPPT算法 ZL20222... 合计 25,800 100% - -' },
                    { id:'m10', name:'研发费用加计扣除证明', required:false, status:'done', tip:'税局出具的A107012表或研发项目鉴定意见；**加分项**：已享受加计扣除可侧面证明研发投入合规性。', sampleName:'加计扣除鉴定表.pdf', samplePreview:'研发项目鉴定意见书 项目编号：RD03 项目名称：高效光伏组件研发 技术领域：新能源与节能 - 高效光伏技术 鉴定结论：符合研发活动加计扣除条件 鉴定机构：XX市科技创新服务中心...' },
                ]},
                { title:'四、科技成果转化与组织管理', icon:'fa-flask', color:'purple', items:[
                    { id:'m11', name:'科技成果转化汇总表', required:true, status:'todo', tip:'近3年年均转化≥5项为满分档；每项转化提供对应合同、验收报告、样品检测报告；同一IP多次转化按项计数。', sampleName:'成果转化汇总表.xlsx', samplePreview:'序号|转化项目名称|转化方式|对应IP|完成时间|证明材料 1|高效组件量产|自行投资|ZL20211+软著|2025.03|量产验收报告 2|监控系统升级|技术服务|ZL20222|2025.06|客户验收单 3|...' },
                    { id:'m12', name:'研发组织管理制度文件', required:true, status:'done', tip:'研发项目立项管理、研发投入核算、研发人员绩效考核、IP保护制度、人才培养引进制度、科技成果转化激励制度等；建议出具红头文件加盖公章。', sampleName:'研发管理制度汇编.pdf', samplePreview:'济南XX新能源科技有限公司 文件 XX科字〔2025〕008号 关于印发《研发项目立项与过程管理办法》等5项制度的通知 各部门：为规范公司研发活动管理，经总经理办公会审议通过，现印发《研发项目立项管理办法》《研发投入核算办法》《研发人员绩效考核办法》...' },
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
                { title:'一、主体资格与基础信息', icon:'fa-id-card', color:'blue', items:[
                    { id:'z1', name:'专精特新申请表', required:true, status:'done', tip:'工信厅系统在线填报导出；主营业务收入占比需≥70%；细分市场占有率行业排名须有佐证。', sampleName:'专精特新申请表样例.pdf', samplePreview:'一、企业基本信息 企业名称：山东XX智能装备有限公司 统一社会信用代码：XXXX 注册地址：济南市高新区XX路XX号 法定代表人：XXX 二、主营业务情况 2025年营业收入总额：18,500万元 主导产品收入：14,800万元 占比：80.0%...' },
                    { id:'z2', name:'营业执照与章程', required:true, status:'done', tip:'三证合一彩色扫描件；公司章程需含股东签字盖章页；实缴资本佐证（验资报告或银行进账单）。', sampleName:'公司章程样例.pdf', samplePreview:'山东XX智能装备有限公司 章程 第一章 总则 第一条 为维护公司、股东和债权人的合法权益，规范公司的组织和行为，根据《中华人民共和国公司法》...' },
                ]},
                { title:'二、专业化与精细化', icon:'fa-bullseye', color:'indigo', items:[
                    { id:'z3', name:'财务报表(近2年)', required:true, status:'todo', tip:'营业收入复合增长率≥10%加分；利润率≥10%加分；需事务所审计报告+税局申报表数据一致。', sampleName:'利润表对比样例.xlsx', samplePreview:'项目 2023年 2024年 2025年 复合增长率 一、营业总收入 13,500 15,800 18,500 +17.1% 减：营业成本 9,200 10,600 12,400 - 毛利 4,300 5,200 6,100 +19.2% 毛利率 31.9% 32.9% 33.0% -' },
                    { id:'z4', name:'社保缴纳人员明细', required:true, status:'todo', tip:'近6个月社保局打印版；研发人员占比≥15%为加分档；须与个税申报、工资表口径一致。', sampleName:'社保明细表.xlsx', samplePreview:'月份 参保人数 社保缴纳总额 其中研发人员 研发人员占比 2026.01 318 1,258,500 62 19.5% 2026.02 321 1,268,400 63 19.6%...' },
                ]},
                { title:'三、特色化与新颖化', icon:'fa-lightbulb-o', color:'amber', items:[
                    { id:'z5', name:'特色产品证明材料', required:true, status:'warn', tip:'行业标准/团体标准参与证明；产品获省部级奖项、首台套认定、名优名牌等。', sampleName:'首台套认定证书.pdf', samplePreview:'山东省首台(套)技术装备 认定证书 证书编号：SDSTS-2025-0112 产品名称：XX-880智能六轴焊接机器人 完成单位：山东XX智能装备有限公司...' },
                    { id:'z6', name:'研发与创新能力材料', required:true, status:'warn', tip:'有效IP清单（发明专利/实用新型/软著）≥10项加分；研发投入强度≥5%加分；省级以上创新平台加分。', sampleName:'IP与创新能力汇总.xlsx', samplePreview:'知识产权类型 数量 其中有效 近3年新增 发明专利 5 5 3 实用新型 18 18 8 软件著作权 12 12 5 合计 35 35 16 研发投入强度：6.8% 省级创新平台：1个（山东省机器人关节工程技术研究中心）' },
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
                { title:'一、示范企业基础材料', icon:'fa-building', color:'blue', items:[
                    { id:'x1', name:'智能制造示范企业申请书', required:true, status:'done', tip:'围绕5大维度：智能制造成熟度、数字化基础设施、关键工序自动化、数据采集互联互通、综合效益。', sampleName:'智能制造申请书样例.pdf', samplePreview:'一、企业基本情况 二、智能制造成熟度评估（自评估等级：三级-集成级） 三、数字化基础设施建设（工业互联网平台部署情况、ERP/MES/PLM/CRM上线率） 四、关键工序自动化情况（数控机床联网率、机器人密度、AGV应用场景）...' },
                    { id:'x2', name:'营业执照与生产资质', required:true, status:'done', tip:'经营范围含制造类；生产许可证、环评安评等资质有效。', sampleName:'生产许可证样例.jpg', samplePreview:'全国工业产品生产许可证 证书编号：(鲁)XK06-001-XXXXX 产品名称：智能焊接机器人 住所：济南市高新区XX产业园 生产地址：XX产业园1号楼...' },
                ]},
                { title:'二、车间建设与项目报告', icon:'fa-cogs', color:'cyan', items:[
                    { id:'x3', name:'智能车间建设报告', required:true, status:'todo', tip:'**最核心材料**：不少于1.5万字；含车间布局图、产线流程图、设备清单、工艺路线、数据采集点、数字化应用场景、成效对比（人工替代、效率提升、不良率下降、能耗降低）。', sampleName:'智能车间建设报告模板.docx', samplePreview:'《智能焊接车间建设与运营报告》 摘要：本车间建成于2024年6月，总投资5800万元，部署六轴焊接机器人28台、AGV智能物流车12台、MES系统1套，实现关键工序100%自动化。投产后人员从186人减至62人，单班产能从120台提升至260台，产品不良率从2.8%降至0.6%...' },
                    { id:'x4', name:'行业专家推荐函(2封)', required:true, status:'todo', tip:'需同行业正高级技术职称专家；每人独立出具；需注明专家单位职称联系方式；手写签字+职称证复印件。', sampleName:'专家推荐函模板.doc', samplePreview:'专家推荐函 致济南市工业和信息化局： 本人XXX，教授级高工，任职于山东省机械设计研究院，从事智能制造研究26年。现郑重推荐济南XX智能装备有限公司申报济南市智能制造示范企业...' },
                ]},
                { title:'三、数字化与绩效数据', icon:'fa-area-chart', color:'purple', items:[
                    { id:'x5', name:'数字化装备清单与联网率', required:true, status:'warn', tip:'设备名称/型号/数量/单价/供应商/是否联网/接入系统；关键工序数控化率≥80%加分。', sampleName:'设备联网率报表.xlsx', samplePreview:'工序 设备总数 联网数 联网率 数控化率 焊接 28 28 100% 100% 装配 42 38 90.5% 90.5% 检测 16 16 100% 100% 物流 12 12 100% - 合计 98 94 95.9% 95.8%' },
                    { id:'x6', name:'综合效益对比表', required:false, status:'done', tip:'建设前后对比：生产效率、运营成本、产品研发周期、不良率、能耗、人均产值。至少3项改善≥20%。', sampleName:'综合效益对比表.xlsx', samplePreview:'核心指标 建设前 建设后 改善率 人均产值(万元/年) 82 215 +162% 产品不良率 2.8% 0.6% -78.6% 单位产品能耗 85kWh 52kWh -38.8% 订单交付周期 18天 9天 -50%' },
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
                { lv:'info', title:'研发费用辅助账归集', time:'建议准备', desc:'2025年度研发费用辅助账建议提前整理' },
            ],
            groups: [
                { title:'一、入库填报基础材料', icon:'fa-file-text-o', color:'blue', items:[
                    { id:'k1', name:'企业基础信息表', required:true, status:'todo', tip:'职工总数≤500人、年营收≤2亿、资产总额≤2亿；三项同时满足是入库前提。', sampleName:'中小企业基础信息表.xlsx', samplePreview:'指标 数值 达标判断 职工总数(人) 286 ≤500 ✓ 年销售收入(万元) 18,500 ≤20,000 ✓ 资产总额(万元) 25,800 ≤20,000 ✗ 需提供分公司或合并口径调整说明...' },
                ]},
                { title:'二、研发与IP证明', icon:'fa-flask', color:'purple', items:[
                    { id:'k2', name:'知识产权清单', required:true, status:'warn', tip:'1项发明专利或5项实用新型/软著即可满分档；需为近5年内获取且仍有效。', sampleName:'知识产权清单.xlsx', samplePreview:'序号 类型 名称 专利号 获取时间 状态 发明人 1 发明 高效组件封装 ZL20211... 2023.06 有效 XX 2 发明 MPPT算法 ZL20211... 2024.01 有效 XX 合计：发明5 实用18 软著28' },
                    { id:'k3', name:'2025年度研发项目表', required:true, status:'todo', tip:'项目名称、起止时间、参与人员、投入经费、核心技术、创新点；不少于3项为佳。', sampleName:'研发项目表.xlsx', samplePreview:'项目编号 名称 起止 人员 经费(万) 技术领域 RD01 高效晶体硅组件研发 2025.01-12 38人 680 新能源 RD02 光储一体化控制 2025.03-2026.02 24人 420 新能源...' },
                ]}
            ]
        }
    ];

    var CURRENT_PROJECT_ID = PROJECTS[0].id;
    var FILTERED_IDS = PROJECTS.map(function(p){ return p.id; });

    // ========== 2. 页面初始化 + 项目切换 ==========
    document.addEventListener('DOMContentLoaded', function() {
        renderProjectChips();
        switchProject(CURRENT_PROJECT_ID);
        updateStats();
    });

    function renderProjectChips() {
        var box = document.getElementById('projectChips');
        var html = '';
        PROJECTS.forEach(function(p) {
            if (FILTERED_IDS.indexOf(p.id) === -1) return;
            var active = p.id === CURRENT_PROJECT_ID ? 'active' : '';
            var sc = { green:'bg-green-50 text-green-600', orange:'bg-orange-50 text-orange-500', blue:'bg-blue-50 text-blue-600' }[p.statusColor] || 'bg-slate-100 text-slate-600';
            var lc = { '国家级':'bg-red-50 text-red-500', '省级':'bg-orange-50 text-orange-500', '市级':'bg-blue-50 text-blue-500' }[p.level];
            html += '<div class="project-chip '+active+' px-3 py-2 rounded-xl border border-slate-200 bg-white min-w-[200px]" onclick="switchProject(\''+p.id+'\')">';
            html += '  <div class="flex items-center justify-between mb-1">';
            html += '    <div class="flex items-center space-x-1.5">';
            html += '      <span class="w-6 h-6 rounded-lg bg-'+p.iconColor+'-100 text-'+p.iconColor+'-600 flex items-center justify-center"><i class="fa '+p.icon+' text-[11px]"></i></span>';
            html += '      <span class="px-1.5 py-px rounded '+lc+' text-[9px] font-bold">'+p.level+'</span>';
            html += '      <span class="px-1.5 py-px rounded '+sc+' text-[9px] font-bold">'+p.status+'</span>';
            html += '    </div>';
            html += '    <span class="text-[11px] font-black text-blue-600">'+p.progress+'%</span>';
            html += '  </div>';
            html += '  <div class="text-[11.5px] font-bold text-slate-700 truncate">'+p.name+'</div>';
            html += '  <div class="text-[9px] text-slate-400 mt-0.5 truncate">'+p.dept+' · 截止 '+p.deadline.split(' ')[0]+'</div>';
            html += '</div>';
        });
        box.innerHTML = html;
    }

    function filterProjects(q) {
        q = (q||'').trim();
        if (!q) { FILTERED_IDS = PROJECTS.map(function(p){ return p.id; }); }
        else {
            FILTERED_IDS = PROJECTS.filter(function(p){
                return p.name.indexOf(q) !== -1 || p.dept.indexOf(q) !== -1;
            }).map(function(p){ return p.id; });
            if (FILTERED_IDS.length === 0) { FILTERED_IDS = PROJECTS.map(function(p){ return p.id; }); }
            if (FILTERED_IDS.indexOf(CURRENT_PROJECT_ID) === -1) {
                CURRENT_PROJECT_ID = FILTERED_IDS[0];
            }
        }
        renderProjectChips();
        switchProject(CURRENT_PROJECT_ID);
    }

    function getCurrentProject() {
        for (var i = 0; i < PROJECTS.length; i++) { if (PROJECTS[i].id === CURRENT_PROJECT_ID) return PROJECTS[i]; }
        return PROJECTS[0];
    }

    function switchProject(pid) {
        CURRENT_PROJECT_ID = pid;
        renderProjectChips();
        updateStats();
        var p = getCurrentProject();
        // ===== 材料包头部 =====
        var lc = { '国家级':'bg-red-50 text-red-500', '省级':'bg-orange-50 text-orange-500', '市级':'bg-blue-50 text-blue-500' }[p.level];
        var tc = { '资金补贴':'bg-blue-50 text-blue-600', '税收减免':'bg-green-50 text-green-600', '资质认定':'bg-purple-50 text-purple-600', '资质入库':'bg-indigo-50 text-indigo-600' }[p.type];
        var sc = { green:'bg-green-50 text-green-600', orange:'bg-orange-50 text-orange-500', blue:'bg-blue-50 text-blue-600' }[p.statusColor];
        document.getElementById('pkgBadges').innerHTML =
            '<span class="px-2 py-0.5 rounded '+lc+' text-[10px] font-bold">'+p.level+'</span>'+
            '<span class="px-2 py-0.5 rounded '+tc+' text-[10px] font-bold">'+p.type+'</span>'+
            '<span class="px-2 py-0.5 rounded '+sc+' text-[10px] font-bold">'+p.status+'</span>';
        document.getElementById('pkgTitle').innerText = p.name;
        document.getElementById('pkgSubtitle').innerText = p.dept + ' · 截止 ' + p.deadline + ' · 预计扶持 ' + p.subsidy;
        // 统计材料完成度
        var total = 0, done = 0, warn = 0, todo = 0;
        p.groups.forEach(function(g) {
            g.items.forEach(function(m) {
                total++;
                if (m.status === 'done') done++;
                else if (m.status === 'warn') warn++;
                else todo++;
            });
        });
        var pct = Math.round(done / total * 100);
        document.getElementById('pkgPercent').innerText = pct + '%';
        document.getElementById('pkgRatio').innerText = '已上传 ' + done + '/' + total + ' · 待完善 ' + warn + ' · 缺失 ' + todo;
        setTimeout(function(){
            document.getElementById('pkgBar').style.width = pct + '%';
        }, 50);
        // ===== 材料分组列表渲染 =====
        renderMaterialGroups(p);
        // ===== 进度看板渲染 =====
        renderProgressBoard(p);
    }

    // ========== 2.1 统计卡片动态刷新（数据来源：实时聚合 PROJECTS + HISTORY_DONE）==========
    // 已完成的历史申报项目（真实场景从 project 表 WHERE status='已完成' 查询）
    var HISTORY_DONE = [
        { name:'2025年高新技术企业认定', subsidy:200, year:2025 },
        { name:'2025年山东省专精特新认定', subsidy:50, year:2025 },
        { name:'2024年科技型中小企业入库', subsidy:85, year:2024 },
        { name:'2024年济南市智能制造示范', subsidy:20, year:2024 },
        { name:'2024年研发费用加计扣除', subsidy:120, year:2024 },
        { name:'2023年高新技术企业认定', subsidy:200, year:2023 },
        { name:'2023年山东省专精特新认定', subsidy:50, year:2023 },
        { name:'2023年科技型中小企业入库', subsidy:70, year:2023 },
        { name:'2022年高新技术企业认定', subsidy:200, year:2022 },
        { name:'2022年研发费用加计扣除', subsidy:80, year:2022 },
        { name:'2021年高新技术企业认定', subsidy:200, year:2021 },
        { name:'2021年科技型中小企业入库', subsidy:60, year:2021 },
        { name:'2020年济南市智能制造示范', subsidy:20, year:2020 },
        { name:'2020年研发费用加计扣除', subsidy:60, year:2020 },
        { name:'2019年高新技术企业认定', subsidy:200, year:2019 },
        { name:'2019年山东省专精特新认定', subsidy:50, year:2019 },
        { name:'2018年科技型中小企业入库', subsidy:45, year:2018 },
        { name:'2017年高新技术企业认定', subsidy:200, year:2017 },
        { name:'2016年研发费用加计扣除', subsidy:40, year:2016 },
        { name:'2015年高新技术企业认定', subsidy:200, year:2015 },
        { name:'2014年科技型中小企业入库', subsidy:35, year:2014 },
        { name:'2013年济南市智能制造示范', subsidy:20, year:2013 },
        { name:'2012年高新技术企业认定', subsidy:200, year:2012 }
    ];
    function updateStats() {
        var ongoing = 0, pending = 0, warnTotal = 0;
        var minDeadlineDays = null;
        PROJECTS.forEach(function(p) {
            if (p.status === '申报中' || p.status === '即将截止') {
                ongoing++;
                // 解析截止日期距今天数
                var m = p.deadline.match(/\((\d+)天后/);
                if (m) {
                    var days = parseInt(m[1]);
                    if (minDeadlineDays === null || days < minDeadlineDays) minDeadlineDays = days;
                }
            }
            else if (p.status === '待申报') {
                pending++;
                var m2 = p.deadline.match(/\((\d+)天后/);
                if (m2) {
                    var days2 = parseInt(m2[1]);
                    if (minDeadlineDays === null || days2 < minDeadlineDays) minDeadlineDays = days2;
                }
            }
            // 统计预警材料（缺失状态）
            p.groups.forEach(function(g){ g.items.forEach(function(m){
                if (m.status === 'todo') warnTotal++;
            });});
        });
        // 已完成项目统计
        var completedCount = HISTORY_DONE.length;
        var subsidyTotal = 0;
        HISTORY_DONE.forEach(function(h){ subsidyTotal += h.subsidy; });

        // 更新DOM
        var setText = function(id, val) { var el = document.getElementById(id); if (el) el.innerText = val; };
        setText('statOngoing', ongoing);
        setText('statOngoingSub', '个申报项目');
        setText('statCompleted', completedCount);
        setText('statCompletedSub', '累计扶持 ¥' + subsidyTotal + '万');
        setText('statPending', pending);
        setText('statPendingSub', pending > 0 ? '最近截止 ' + (minDeadlineDays !== null ? minDeadlineDays + ' 天后' : '—') : '暂无待申报');
        setText('statWarn', warnTotal);
        setText('statWarnSub', warnTotal > 0 ? '项材料需补充' : '暂无预警');
    }

    // ========== 3. 个性化材料清单自动生成 ==========
    function renderMaterialGroups(p) {
        var box = document.getElementById('materialGroups');
        var html = '';
        p.groups.forEach(function(g) {
            var groupDone = 0, groupTotal = g.items.length;
            g.items.forEach(function(m){ if (m.status === 'done') groupDone++; });
            var gpct = Math.round(groupDone / groupTotal * 100);
            var gcColor = { blue:'blue', orange:'orange', green:'emerald', purple:'purple', indigo:'indigo', amber:'amber', cyan:'cyan' }[g.color] || 'slate';
            html += '<div class="border border-slate-100 rounded-xl overflow-hidden">';
            // 分组头部
            html += '  <div class="px-4 py-3 bg-'+gcColor+'-50/60 border-b border-'+gcColor+'-100 flex items-center justify-between">';
            html += '    <div class="flex items-center space-x-2">';
            html += '      <span class="w-7 h-7 rounded-lg bg-'+gcColor+'-100 text-'+gcColor+'-600 flex items-center justify-center"><i class="fa '+g.icon+' text-xs"></i></span>';
            html += '      <span class="text-xs font-black text-slate-700">'+g.title+'</span>';
            html += '      <span class="px-1.5 py-px bg-white rounded text-[10px] text-slate-500 font-bold border border-slate-200">'+groupDone+'/'+groupTotal+' · '+gpct+'%</span>';
            html += '    </div>';
            html += '    <div class="w-28 h-1.5 bg-white rounded-full overflow-hidden"><div class="h-full bg-'+gcColor+'-500 rounded-full" style="width:'+gpct+'%"></div></div>';
            html += '  </div>';
            // 材料行
            html += '  <div>';
            g.items.forEach(function(m) {
                var statMap = {
                    done:   { dot:'bg-green-500', text:'已上传', badge:'bg-green-50 text-green-600 border-green-200', btnColor:'bg-green-50 text-green-600 hover:bg-green-100' },
                    warn:   { dot:'bg-orange-400', text:'待完善', badge:'bg-orange-50 text-orange-600 border-orange-200', btnColor:'bg-orange-50 text-orange-600 hover:bg-orange-100' },
                    todo:   { dot:'bg-rose-500', text:'缺失', badge:'bg-rose-50 text-rose-600 border-rose-200', btnColor:'bg-rose-50 text-rose-600 hover:bg-rose-100' }
                }[m.status];
                html += '    <div class="mat-row px-4 py-3 border-b border-slate-50 last:border-none flex items-center space-x-3">';
                html += '      <span class="w-2 h-2 rounded-full '+statMap.dot+' flex-shrink-0"></span>';
                // 名称+必填+智能提示
                html += '      <div class="flex-1 min-w-0 relative tip-trigger">';
                html += '        <div class="flex items-center flex-wrap gap-1 mb-0.5">';
                html += '          <span class="text-xs font-bold text-slate-700">'+m.name+'</span>';
                if (m.required) html += '<span class="text-rose-500 text-[10px] font-bold">*必填</span>';
                else html += '<span class="text-slate-400 text-[10px] font-bold">选填</span>';
                html += '          <span class="mat-badge border '+statMap.badge+'"><i class="fa fa-'+(m.status==='done'?'check':(m.status==='warn'?'exclamation':'times'))+'-circle mr-1"></i>'+statMap.text+'</span>';
                html += '        </div>';
                html += '        <div class="text-[10.5px] text-slate-500 truncate">'+m.tip.substring(0, Math.min(60, m.tip.length)) + (m.tip.length>60?'...':'')+'</div>';
                // 智能提示气泡（hover出现）
                html += '        <div class="tip-pop">';
                html += '          <div class="flex items-center space-x-1 mb-2"><i class="fa fa-info-circle text-blue-300"></i><span class="text-[11px] font-black text-blue-200">智能填写提示</span></div>';
                html += '          <div class="text-[11.5px] leading-relaxed text-slate-200">'+m.tip+'</div>';
                html += '          <div class="mt-2 pt-2 border-t border-white/10 text-[10.5px] text-slate-400"><i class="fa fa-lightbulb-o text-amber-300 mr-1"></i>点击右侧「样例」可查看参考文档</div>';
                html += '        </div>';
                html += '      </div>';
                // 操作按钮组
                html += '      <div class="flex items-center space-x-1.5 flex-shrink-0">';
                html += '        <button onclick="showSample(\''+p.id+'\',\''+m.id+'\')" class="px-2 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all text-[10.5px] font-bold" title="查看样例参考"><i class="fa fa-file-text-o mr-1"></i>样例</button>';
                if (m.status === 'done') {
                    html += '      <button onclick="toggleMatStatus(\''+p.id+'\',\''+m.id+'\')" class="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all text-[10.5px] font-bold"><i class="fa fa-eye mr-1"></i>查看</button>';
                } else {
                    html += '      <button onclick="toggleMatStatus(\''+p.id+'\',\''+m.id+'\')" class="px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10.5px] font-bold"><i class="fa fa-upload mr-1"></i>上传</button>';
                }
                html += '      </div>';
                html += '    </div>';
            });
            html += '  </div>';
            html += '</div>';
        });
        box.innerHTML = html;
    }

    // 状态切换（上传/撤销）
    function toggleMatStatus(pid, mid) {
        var p = null;
        for (var i=0;i<PROJECTS.length;i++) if (PROJECTS[i].id===pid) { p = PROJECTS[i]; break; }
        if (!p) return;
        for (var gi=0;gi<p.groups.length;gi++) {
            var g = p.groups[gi];
            for (var mi=0;mi<g.items.length;mi++) {
                if (g.items[mi].id === mid) {
                    var cur = g.items[mi].status;
                    if (cur === 'done') { g.items[mi].status = 'warn'; showToast('已撤销上传：' + g.items[mi].name, 'info'); }
                    else if (cur === 'warn') { g.items[mi].status = 'done'; showToast('已标记为已上传：' + g.items[mi].name, 'success'); }
                    else { g.items[mi].status = 'warn'; showToast('已上传草稿：' + g.items[mi].name + '（待完善）', 'warn'); }
                    switchProject(pid);
                    return;
                }
            }
        }
    }

    // ========== 4. 样例参考弹窗 ==========
    function findMaterial(pid, mid) {
        for (var i=0;i<PROJECTS.length;i++) {
            if (PROJECTS[i].id !== pid) continue;
            for (var gi=0;gi<PROJECTS[i].groups.length;gi++) {
                for (var mi=0;mi<PROJECTS[i].groups[gi].items.length;mi++) {
                    if (PROJECTS[i].groups[gi].items[mi].id === mid) return PROJECTS[i].groups[gi].items[mi];
                }
            }
        }
        return null;
    }
    function showSample(pid, mid) {
        var m = findMaterial(pid, mid);
        if (!m) return;
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'sampleModalMask';
        mask.onclick = function(e) { if (e.target.id === 'sampleModalMask') closeSample(); };
        mask.innerHTML = '<div class="sample-modal">'
            + '<div class="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 flex items-center justify-between">'
            + '  <div class="flex items-center space-x-2"><i class="fa fa-file-pdf-o text-red-500"></i><div><div class="text-sm font-black text-slate-800">'+m.sampleName+'</div><div class="text-[10.5px] text-slate-500">样例参考 · 仅供学习与模板使用</div></div></div>'
            + '  <div class="flex items-center space-x-2">'
            + '    <button onclick="copySampleText()" class="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"><i class="fa fa-copy mr-1"></i>复制内容</button>'
            + '    <button onclick="closeSample()" class="w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
            + '  </div>'
            + '</div>'
            + '<div id="sampleBody" class="p-6 max-h-[60vh] overflow-y-auto scroll-thin">'
            + '  <div class="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11.5px] text-blue-700 leading-relaxed"><i class="fa fa-info-circle mr-1"></i><b>智能提示：</b>' + m.tip + '</div>'
            + '  <pre id="sampleText" style="white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.85;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">' + escapeHtml(m.samplePreview) + '</pre>'
            + '</div>'
            + '<div class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">'
            + '  <span class="text-[10.5px] text-slate-400"><i class="fa fa-shield mr-1"></i>样例来自2025年成功申报案例，已脱敏处理</span>'
            + '  <button onclick="showToast(\'已下载样例文档到本地\',\'success\'); closeSample();" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"><i class="fa fa-download mr-1"></i>下载该样例</button>'
            + '</div>'
            + '</div>';
        document.body.appendChild(mask);
    }
    function closeSample() {
        var m = document.getElementById('sampleModalMask');
        if (m) { m.style.transition='opacity .25s'; m.style.opacity='0'; setTimeout(function(){ m.remove(); }, 250); }
    }
    function copySampleText() {
        var s = document.getElementById('sampleText');
        if (!s) return;
        try {
            var ta = document.createElement('textarea');
            ta.value = s.innerText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            showToast('样例内容已复制到剪贴板', 'success');
        } catch(e) { showToast('复制失败，请手动选中', 'error'); }
    }
    function viewAllSamples() {
        var p = getCurrentProject();
        var first = null;
        for (var gi=0;gi<p.groups.length && !first;gi++) {
            for (var mi=0;mi<p.groups[gi].items.length && !first;mi++) {
                if (p.groups[gi].items[mi].status !== 'done') first = p.groups[gi].items[mi];
            }
        }
        if (!first && p.groups.length && p.groups[0].items.length) first = p.groups[0].items[0];
        if (first) showSample(p.id, first.id);
        showToast('可点击每个材料行右侧「样例」按钮分别查看参考文档', 'info');
    }
    function escapeHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ========== 5. 进度跟踪看板渲染 ==========
    function renderProgressBoard(p) {
        // 徽章 + 标题 + 信息
        var lc = { '国家级':'bg-red-50 text-red-500', '省级':'bg-orange-50 text-orange-500', '市级':'bg-blue-50 text-blue-500' }[p.level];
        var sc = { green:'bg-green-50 text-green-600', orange:'bg-orange-50 text-orange-500', blue:'bg-blue-50 text-blue-600' }[p.statusColor];
        document.getElementById('boardBadges').innerHTML =
            '<span class="px-1.5 py-px rounded '+lc+' text-[9px] font-bold">'+p.level+'</span>'+
            '<span class="px-1.5 py-px rounded '+sc+' text-[9px] font-bold">'+p.status+'</span>';
        document.getElementById('boardTitle').innerText = p.name;
        document.getElementById('boardDept').innerText = p.dept;
        document.getElementById('boardDeadline').innerText = p.deadline;
        document.getElementById('boardSubsidy').innerText = p.subsidy.split(' + ')[0];

        // 环形进度
        document.getElementById('ringPercent').innerText = p.progress + '%';
        var circumference = 2 * Math.PI * 52; // 326.73
        var offset = circumference * (1 - p.progress / 100);
        var circle = document.getElementById('ringCircle');
        circle.style.transition = 'stroke-dashoffset .8s ease';
        setTimeout(function(){ circle.setAttribute('stroke-dashoffset', offset.toFixed(2)); }, 50);

        // 阶段数量
        document.getElementById('stageCount').innerText = p.stages.length;
        // 横向阶段时间线
        renderStageTimeline(p);
        // 关键节点提醒
        renderReminders(p);
        // 阶段完成率条
        renderStageBars(p);
    }

    function renderStageTimeline(p) {
        var box = document.getElementById('stageTimeline');
        var html = '';
        p.stages.forEach(function(s, idx) {
            var cls = s.status === 'done' ? 'done' : (s.status === 'doing' ? 'doing' : 'pending');
            var dot = '', icon = '';
            if (s.status === 'done') {
                dot = 'bg-green-500 text-white';
                icon = '<i class="fa fa-check text-xs"></i>';
            } else if (s.status === 'doing') {
                dot = 'bg-blue-500 text-white ring-4 ring-blue-100 animate-pulse';
                icon = '<span class="text-xs font-bold">'+(idx+1)+'</span>';
            } else {
                dot = 'bg-slate-200 text-slate-500';
                icon = '<span class="text-xs font-bold">'+(idx+1)+'</span>';
            }
            var labelColor = s.status === 'done' ? 'text-green-600' : (s.status === 'doing' ? 'text-blue-600 font-black' : 'text-slate-400');
            html += '<div class="stage-node '+cls+'">';
            html += '  <div class="w-8 h-8 rounded-full flex items-center justify-center z-10 '+dot+'">'+icon+'</div>';
            html += '  <div class="mt-2 text-center">';
            html += '    <div class="text-[11px] text-slate-700 font-bold whitespace-nowrap">'+s.name+'</div>';
            html += '    <div class="text-[10px] '+labelColor+' whitespace-nowrap mt-0.5">'+s.date+'</div>';
            html += '  </div>';
            html += '</div>';
        });
        box.innerHTML = html;
    }

    function renderReminders(p) {
        var box = document.getElementById('reminderList');
        var html = '';
        // 排序：urgent 先，然后 warn, info, done
        var order = { urgent:0, warn:1, info:2, done:3 };
        var list = p.reminders.slice().sort(function(a,b){ return (order[a.lv]||9) - (order[b.lv]||9); });
        list.forEach(function(r) {
            var cfg = {
                urgent: { icon:'fa-exclamation-circle', bg:'bg-rose-50', border:'border-rose-100', dot:'bg-rose-500', lv:'紧急', lvBg:'bg-rose-500 text-white' },
                warn:   { icon:'fa-exclamation-triangle', bg:'bg-orange-50', border:'border-orange-100', dot:'bg-orange-400', lv:'提醒', lvBg:'bg-orange-400 text-white' },
                info:   { icon:'fa-info-circle', bg:'bg-blue-50', border:'border-blue-100', dot:'bg-blue-500', lv:'通知', lvBg:'bg-blue-500 text-white' },
                done:   { icon:'fa-check-circle', bg:'bg-green-50', border:'border-green-100', dot:'bg-green-500', lv:'已完成', lvBg:'bg-green-500 text-white' }
            }[r.lv];
            html += '<div class="flex items-start space-x-3 p-3 rounded-xl '+cfg.bg+' border '+cfg.border+'">';
            html += '  <span class="w-6 h-6 rounded-full '+cfg.dot+' flex items-center justify-center flex-shrink-0"><i class="fa '+cfg.icon+' text-white text-[10px]"></i></span>';
            html += '  <div class="flex-1 min-w-0">';
            html += '    <div class="flex items-center justify-between mb-1">';
            html += '      <div class="flex items-center space-x-2">';
            html += '        <span class="text-xs font-black text-slate-700">'+r.title+'</span>';
            html += '        <span class="px-1.5 py-px rounded text-[9px] font-bold '+cfg.lvBg+'">'+cfg.lv+'</span>';
            html += '      </div>';
            html += '      <span class="text-[10px] font-bold text-slate-600 whitespace-nowrap">'+r.time+'</span>';
            html += '    </div>';
            html += '    <p class="text-[10.5px] text-slate-600 leading-relaxed">'+r.desc+'</p>';
            html += '  </div>';
            html += '</div>';
        });
        box.innerHTML = html;
    }

    function renderStageBars(p) {
        var box = document.getElementById('stageBars');
        var html = '';
        p.stages.forEach(function(s, idx) {
            var color = s.status === 'done' ? 'from-green-400 to-emerald-500'
                : (s.status === 'doing' ? 'from-blue-400 to-indigo-500' : 'from-slate-200 to-slate-300');
            var labelColor = s.status === 'done' ? 'text-green-600' : (s.status === 'doing' ? 'text-blue-600' : 'text-slate-400');
            var dotColor = s.status === 'done' ? 'bg-green-500' : (s.status === 'doing' ? 'bg-blue-500' : 'bg-slate-300');
            html += '<div>';
            html += '  <div class="flex items-center justify-between mb-1.5">';
            html += '    <div class="flex items-center space-x-2">';
            html += '      <span class="w-1.5 h-1.5 rounded-full '+dotColor+'"></span>';
            html += '      <span class="text-[11px] font-bold text-slate-700">'+(idx+1)+'. '+s.name+'</span>';
            html += '      <span class="text-[9.5px] text-slate-400">'+s.date+'</span>';
            html += '    </div>';
            html += '    <span class="text-[11px] font-black '+labelColor+'">'+s.rate+'%</span>';
            html += '  </div>';
            html += '  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">';
            html += '    <div class="h-full rounded-full bg-gradient-to-r '+color+' transition-all duration-700" style="width:0%"></div>';
            html += '  </div>';
            html += '  <p class="text-[10px] text-slate-400 mt-1 leading-relaxed pl-3.5">'+s.desc+'</p>';
            html += '</div>';
        });
        box.innerHTML = html;
        // 对每个条做 width 动画
        requestAnimationFrame(function(){
            var wraps = box.children;
            for (var i=0;i<wraps.length;i++) {
                (function(idx){
                    var bar = wraps[idx].querySelector('.h-full');
                    if (bar) setTimeout(function(){ bar.style.width = p.stages[idx].rate + '%'; }, 80 + idx * 120);
                })(i);
            }
        });
    }

    // ========== 6. 企业材料库弹窗 ==========
    var LIB_FILTER = { cat:'全部', q:'' };
    function openMaterialLibrary() {
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'libraryMask';
        mask.onclick = function(e){ if(e.target.id==='libraryMask') closeModal('libraryMask'); };
        var matchedCount = LIBRARY.filter(function(l){ return l.matched; }).length;
        mask.innerHTML =
        '<div style="width:720px;max-height:82vh;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);display:flex;flex-direction:column;">'
        + '<div class="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100 flex items-center justify-between">'
        + '  <div class="flex items-center space-x-2"><i class="fa fa-database text-blue-600 text-lg"></i><div><div class="text-sm font-black text-slate-800">企业材料库</div><div class="text-[10.5px] text-slate-500">共 '+LIBRARY.length+' 份历史材料 · AI已智能匹配 <span class="text-blue-600 font-bold">'+matchedCount+'</span> 份适用材料</div></div></div>'
        + '  <button onclick="closeModal(\'libraryMask\')" class="w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
        + '</div>'
        + '<div class="px-5 py-3 bg-white border-b border-slate-100">'
        + '  <div class="flex items-center justify-between">'
        + '    <div class="flex items-center space-x-1" id="libCats"></div>'
        + '    <div class="relative">'
        + '      <i class="fa fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>'
        + '      <input type="text" oninput="LIB_FILTER.q=this.value;renderLibraryList()" placeholder="搜索材料..." class="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 w-44">'
        + '    </div>'
        + '  </div>'
        + '</div>'
        + '<div id="libList" class="flex-1 overflow-y-auto scroll-thin p-5"></div>'
        + '<div class="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">'
        + '  <span class="text-[10.5px] text-slate-500"><i class="fa fa-lightbulb-o text-amber-400 mr-1"></i>点击材料行可预览详情，勾选后一键同步到当前申报项目</span>'
        + '  <div class="flex items-center space-x-2">'
        + '    <button onclick="closeModal(\'libraryMask\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">关闭</button>'
        + '    <button onclick="syncMatchedToProject()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"><i class="fa fa-refresh mr-1"></i>同步已匹配 ('+matchedCount+') 份到当前项目</button>'
        + '  </div>'
        + '</div>'
        + '</div>';
        document.body.appendChild(mask);
        // 渲染分类tab
        var catsBox = document.getElementById('libCats');
        var catsHtml = '';
        LIBRARY_CATS.forEach(function(c){
            var active = LIB_FILTER.cat === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            catsHtml += '<button onclick="LIB_FILTER.cat=\''+c+'\';renderLibraryCats();renderLibraryList()" class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all '+active+'">'+c+'</button>';
        });
        catsBox.innerHTML = catsHtml;
        renderLibraryList();
    }
    function renderLibraryCats() {
        var catsBox = document.getElementById('libCats');
        var catsHtml = '';
        LIBRARY_CATS.forEach(function(c){
            var active = LIB_FILTER.cat === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            catsHtml += '<button onclick="LIB_FILTER.cat=\''+c+'\';renderLibraryCats();renderLibraryList()" class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all '+active+'">'+c+'</button>';
        });
        catsBox.innerHTML = catsHtml;
    }
    function renderLibraryList() {
        var box = document.getElementById('libList');
        var list = LIBRARY.filter(function(l){
            var catOk = LIB_FILTER.cat === '全部' || l.cat === LIB_FILTER.cat;
            var qOk = !LIB_FILTER.q || l.name.indexOf(LIB_FILTER.q) !== -1;
            return catOk && qOk;
        });
        var html = '';
        if (list.length === 0) {
            html = '<div class="text-center py-12 text-slate-400 text-xs"><i class="fa fa-inbox text-3xl mb-2"></i><div>暂无匹配的材料</div></div>';
        }
        list.forEach(function(l){
            var catColor = {
                '营业执照':'bg-blue-50 text-blue-600',
                '财务报告':'bg-emerald-50 text-emerald-600',
                'IP证书':'bg-purple-50 text-purple-600',
                '资质文件':'bg-amber-50 text-amber-600',
                '管理制度':'bg-rose-50 text-rose-600'
            }[l.cat] || 'bg-slate-50 text-slate-600';
            var matchTag = l.matched
                ? '<span class="px-1.5 py-px bg-green-50 text-green-600 text-[9.5px] font-bold rounded border border-green-200"><i class="fa fa-check-circle mr-0.5"></i>已匹配</span>'
                : '<span class="px-1.5 py-px bg-slate-50 text-slate-500 text-[9.5px] font-bold rounded border border-slate-200">未匹配</span>';
            var matchInfo = l.matched
                ? '<div class="text-[10px] text-green-600 mt-1"><i class="fa fa-lightbulb-o mr-1"></i>'+l.matchReason+'</div>'
                : '';
            var usedBy = l.usage.map(function(u){ return '<span class="px-1.5 py-px bg-slate-100 rounded text-[9px] text-slate-500 mr-1">'+u+'</span>'; }).join('');
            html += '<div class="border border-slate-100 rounded-xl p-3 mb-2 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer" onclick="previewLibraryItem(\''+l.id+'\')">';
            html += '  <div class="flex items-start justify-between">';
            html += '    <div class="flex items-start space-x-3">';
            html += '      <span class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><i class="fa fa-file-pdf-o text-red-500"></i></span>';
            html += '      <div class="min-w-0">';
            html += '        <div class="flex items-center flex-wrap gap-1.5 mb-1">';
            html += '          <span class="text-[12px] font-bold text-slate-700">'+l.name+'</span>';
            html += '          <span class="px-1.5 py-px rounded text-[9.5px] font-bold '+catColor+'">'+l.cat+'</span>';
            html += '          '+matchTag;
            html += '        </div>';
            html += '        <div class="flex items-center text-[10px] text-slate-400 space-x-3 mb-1">';
            html += '          <span><i class="fa fa-calendar mr-1"></i>'+l.time+'</span>';
            html += '          <span><i class="fa fa-hdd-o mr-1"></i>'+l.size+'</span>';
            html += '        </div>';
            html += '        <div class="flex items-center">'+usedBy+'</div>';
            html += '        '+matchInfo;
            html += '      </div>';
            html += '    </div>';
            html += '    <span class="text-slate-300"><i class="fa fa-chevron-right"></i></span>';
            html += '  </div>';
            html += '</div>';
        });
        box.innerHTML = html;
    }
    function previewLibraryItem(id) {
        var l = null;
        for (var i=0;i<LIBRARY.length;i++) if (LIBRARY[i].id===id) { l = LIBRARY[i]; break; }
        if (!l) return;
        showToast('预览：' + l.name + '（真实系统将打开PDF在线预览）', 'info');
    }
    function syncMatchedToProject() {
        var p = getCurrentProject();
        var matched = LIBRARY.filter(function(l){ return l.matched; });
        // 把当前项目中 todo 的材料标记为已匹配同步
        var synced = 0;
        outer:
        for (var gi=0;gi<p.groups.length;gi++) {
            for (var mi=0;mi<p.groups[gi].items.length;mi++) {
                if (p.groups[gi].items[mi].status === 'todo' && synced < matched.length) {
                    p.groups[gi].items[mi].status = 'warn';
                    synced++;
                    if (synced >= matched.length) break outer;
                }
            }
        }
        closeModal('libraryMask');
        showToast('已同步 '+synced+' 份材料到「'+p.name+'」的材料包', 'success');
        switchProject(p.id);
    }
    // ========== 7. 下载申报包弹窗 ==========
    function downloadPkg() {
        var p = getCurrentProject();
        var pkgName = p.name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_');
        // 计算当前项目材料统计
        var total=0, done=0, warn=0, todo=0;
        p.groups.forEach(function(g){ g.items.forEach(function(m){
            total++;
            if (m.status==='done') done++;
            else if (m.status==='warn') warn++;
            else todo++;
        });});
        var files = [];
        p.groups.forEach(function(g){ g.items.forEach(function(m){
            files.push({ name:m.sampleName.replace('.pdf','.pdf').replace('.xlsx','.xlsx').replace('.docx','.docx'), status:m.status, required:m.required });
        });});
        openDownloadModal('materialPkgModal', {
            title: '下载申报材料包',
            subtitle: p.name,
            pkgName: pkgName + '_申报材料包.zip',
            sections: [
                { label:'项目文件', files:[ p.name+'_申请表.docx', p.name+'_填写指南.pdf', p.name+'_政策解读.pdf' ] },
                { label:'样例模板 ('+files.length+' 份)', files: files.map(function(f){ return f.name + (f.required?' [必填]':'') }), count: files.length },
                { label:'智能提示文档', files: [ p.name+'_材料填写要点.pdf', p.name+'_常见问题FAQ.pdf' ] }
            ],
            stats: { total: files.length, done:done, warn:warn, todo:todo },
            btnText: '打包下载（含样例+模板+指南）'
        });
    }
    function downloadAllPackage() {
        var totalFiles = 0, projects = PROJECTS.length;
        PROJECTS.forEach(function(p){
            p.groups.forEach(function(g){ g.items.forEach(function(){ totalFiles++; }); });
        });
        var pkgName = '策源易答_全部申报材料包';
        var sections = [];
        PROJECTS.forEach(function(p){
            var files = [];
            p.groups.forEach(function(g){ g.items.forEach(function(m){ files.push(m.sampleName); }); });
            sections.push({ label: p.name+' ('+p.level+')', files: files, count: files.length });
        });
        openDownloadModal('allPkgModal', {
            title: '一键下载全部申报包',
            subtitle: '共 '+projects+' 个进行中项目',
            pkgName: pkgName + '.zip',
            sections: sections,
            stats: { total: totalFiles, projects: projects },
            btnText: '打包全部 ' + projects + ' 个项目的材料（' + totalFiles + ' 份文件）'
        });
    }
    function openDownloadModal(id, cfg) {
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = id;
        mask.onclick = function(e){ if(e.target.id===id) closeModal(id); };
        var statsHtml = '';
        if (cfg.stats.projects) {
            statsHtml = '<div class="flex items-center space-x-4 text-[11px]"><span class="text-slate-600">项目数: <b class="text-blue-600">'+cfg.stats.projects+'</b></span><span class="text-slate-600">文件总数: <b class="text-blue-600">'+cfg.stats.total+'</b></span></div>';
        } else {
            statsHtml = '<div class="flex items-center space-x-3 text-[11px]"><span class="text-slate-600">材料总数: <b class="text-blue-600">'+cfg.stats.total+'</b></span><span class="text-green-600">已就绪: '+cfg.stats.done+'</span><span class="text-orange-500">待完善: '+cfg.stats.warn+'</span><span class="text-rose-500">缺失: '+cfg.stats.todo+'</span></div>';
        }
        var sectionsHtml = '';
        cfg.sections.forEach(function(sec){
            sectionsHtml += '<div class="mb-4">'
                + '<div class="flex items-center justify-between mb-2"><span class="text-[12px] font-black text-slate-700">'+sec.label+'</span><span class="text-[10px] text-slate-400">'+sec.count+' 份</span></div>'
                + '<div class="bg-slate-50 rounded-lg p-3 max-h-[120px] overflow-y-auto scroll-thin">'
                + sec.files.map(function(f){ return '<div class="text-[10.5px] text-slate-600 py-0.5"><i class="fa fa-file-text-o text-slate-400 mr-1.5"></i>'+f+'</div>'; }).join('')
                + '</div></div>';
        });
        mask.innerHTML =
        '<div style="width:560px;max-height:85vh;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);display:flex;flex-direction:column;">'
        + '<div class="px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100 flex items-center justify-between">'
        + '  <div class="flex items-center space-x-2"><i class="fa fa-download text-indigo-600 text-lg"></i><div><div class="text-sm font-black text-slate-800">'+cfg.title+'</div><div class="text-[10.5px] text-slate-500">'+cfg.subtitle+'</div></div></div>'
        + '  <button onclick="closeModal(\''+id+'\')" class="w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
        + '</div>'
        + '<div class="px-6 py-4 border-b border-slate-100 bg-white">'
        + '  <div class="flex items-center justify-between mb-2">'
        + '    <span class="text-[11px] text-slate-500">输出文件名</span>'
        + '    <span class="text-[11px] font-bold text-slate-700">'+cfg.pkgName+'</span>'
        + '  </div>'
        + statsHtml
        + '</div>'
        + '<div class="flex-1 overflow-y-auto scroll-thin px-6 py-4">'+sectionsHtml+'</div>'
        + '<div class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">'
        + '  <span class="text-[10.5px] text-slate-500"><i class="fa fa-shield mr-1"></i>所有文件来自运营后台"政策模板库"，已脱敏处理</span>'
        + '  <div class="flex items-center space-x-2">'
        + '    <button onclick="closeModal(\''+id+'\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">取消</button>'
        + '    <button onclick="confirmDownload(\''+id+'\',\''+cfg.pkgName+'\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-indigo-200"><i class="fa fa-download mr-1"></i>'+cfg.btnText+'</button>'
        + '  </div>'
        + '</div>'
        + '</div>';
        document.body.appendChild(mask);
    }
    function confirmDownload(maskId, fileName) {
        closeModal(maskId);
        showToast('正在打包生成「'+fileName+'」，浏览器将自动开始下载...', 'success');
    }
    // ========== 8. 同步材料库增强版 ==========
    function syncFromLibrary() {
        var p = getCurrentProject();
        var matched = LIBRARY.filter(function(l){ return l.matched; });
        var todoCount = 0;
        p.groups.forEach(function(g){ g.items.forEach(function(m){ if (m.status==='todo') todoCount++; }); });
        if (matched.length === 0 || todoCount === 0) {
            showToast('当前项目已无待同步材料，材料库中也无匹配项', 'info');
            return;
        }
        // 显示同步进度弹窗
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'syncMask';
        mask.onclick = function(e){ if(e.target.id==='syncMask') closeModal('syncMask'); };
        mask.innerHTML =
        '<div style="width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);">'
        + '<div class="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 text-center">'
        + '  <i class="fa fa-cloud-download text-4xl text-blue-500 mb-3"></i>'
        + '  <div class="text-sm font-black text-slate-800 mb-1">正在同步企业材料库</div>'
        + '  <div class="text-[11px] text-slate-500">目标项目：'+p.name+'</div>'
        + '</div>'
        + '<div class="px-6 py-5">'
        + '  <div class="mb-3">'
        + '    <div class="flex items-center justify-between text-[11px] mb-2"><span class="text-slate-600">AI智能匹配进度</span><span id="syncPct" class="font-black text-blue-600">0%</span></div>'
        + '    <div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div id="syncBar" class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300" style="width:0%"></div></div>'
        + '  </div>'
        + '  <div id="syncLog" class="bg-slate-50 rounded-lg p-3 text-[10.5px] text-slate-500 max-h-[120px] overflow-y-auto scroll-thin space-y-1"></div>'
        + '</div>'
        + '<div id="syncFooter" class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between" style="display:none;">'
        + '  <span id="syncResult" class="text-[11px] text-slate-600"></span>'
        + '  <button onclick="closeModal(\'syncMask\');switchProject(\''+p.id+'\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700">完成</button>'
        + '</div>'
        + '</div>';
        document.body.appendChild(mask);

        var steps = [
            { text:'正在连接企业材料库（共 '+LIBRARY.length+' 份材料）...', delay:400 },
            { text:'正在分析当前项目材料需求（共 '+todoCount+' 项待完善）...', delay:600 },
            { text:'AI语义匹配中...', delay:500 },
            { text:'匹配到 '+matched.length+' 份可复用材料', delay:500 },
            { text:'写入项目材料包...', delay:500 },
            { text:'同步完成！', delay:300 }
        ];
        var log = document.getElementById('syncLog');
        var bar = document.getElementById('syncBar');
        var pctEl = document.getElementById('syncPct');
        var idx = 0;
        (function nextStep(){
            if (idx >= steps.length) {
                document.getElementById('syncFooter').style.display = 'flex';
                // 把 todo 的材料标记为 warn 演示效果
                var synced = 0;
                outer:
                for (var gi=0;gi<p.groups.length;gi++) {
                    for (var mi=0;mi<p.groups[gi].items.length;mi++) {
                        if (p.groups[gi].items[mi].status === 'todo') {
                            p.groups[gi].items[mi].status = 'warn';
                            synced++;
                            if (synced >= matched.length) break outer;
                        }
                    }
                }
                document.getElementById('syncResult').innerText = '✓ 成功同步 '+synced+' 份材料，'+(todoCount-synced)+' 份仍需手动上传';
                return;
            }
            var s = steps[idx];
            var line = document.createElement('div');
            line.innerHTML = '<span class="text-slate-400">[步骤'+(idx+1)+']</span> '+s.text;
            log.appendChild(line);
            log.scrollTop = log.scrollHeight;
            var pct = Math.round((idx+1)/steps.length*100);
            bar.style.width = pct+'%';
            pctEl.innerText = pct+'%';
            idx++;
            setTimeout(nextStep, s.delay);
        })();
    }
    // ========== 9. 通用关闭弹窗 ==========
    function closeModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.transition = 'opacity .2s';
            m.style.opacity = '0';
            setTimeout(function(){ m.remove(); }, 200);
        }
    }
    // ========== 10. 新建申报向导 ==========
    // 可选政策目录（真实场景从 policy_catalog 表查询 status=1 的政策）
    var POLICY_CATALOG = [
        { code:'GXQ_2026', name:'国家高新技术企业认定', level:'国家级', dept:'科技部火炬中心', subsidy:'¥50-200万+所得税减免', deadline:'2026-08-18', icon:'fa-star', color:'blue',
          desc:'适用：拥有核心自主知识产权、研发投入持续增长的科技型企业。核心指标：IP≥15项、研发投入占比≥5%、高新产品收入占比≥60%。' },
        { code:'ZJTX_2026', name:'山东省专精特新企业认定', level:'省级', dept:'山东省工信厅', subsidy:'¥50万+175%加计扣除', deadline:'2026-09-01', icon:'fa-rocket', color:'emerald',
          desc:'适用：主营业务突出、竞争力强的中小企业。核心指标：主营占比≥70%、营收复合增长≥10%、研发人员占比≥15%。' },
        { code:'KJXQ_2026', name:'科技型中小企业评价入库', level:'国家级', dept:'科技部服务中心', subsidy:'175%加计扣除+亏损结转10年', deadline:'2026-09-10', icon:'fa-flask', color:'purple',
          desc:'适用：职工≤500人、营收≤2亿、资产≤2亿的科技型企业。门槛较低，是高企认定的前置跳板。' },
        { code:'ZNZZ_2026', name:'济南市智能制造示范企业', level:'市级', dept:'济南市工信局', subsidy:'¥20万+贷款贴息', deadline:'2026-08-08', icon:'fa-bolt', color:'orange',
          desc:'适用：关键工序数控化率≥80%的制造企业。核心指标：数字化装备联网率、MES/ERP覆盖率、综合效益改善≥20%。' },
        { code:'YFFY_2026', name:'研发费用加计扣除', level:'国家级', dept:'税务总局', subsidy:'175%税前加计扣除', deadline:'2027-05-31', icon:'fa-calculator', color:'indigo',
          desc:'适用：所有开展研发活动的居民企业。按研发投入的175%在税前加计扣除，无需单独申报，汇算清缴时享受。' },
        { code:'JSHT_2026', name:'技术合同登记认定', level:'国家级', dept:'科技部', subsidy:'增值税免征+所得税优惠', deadline:'全年滚动', icon:'fa-file-text-o', color:'cyan',
          desc:'适用：技术开发/转让/咨询/服务合同。四技合同经登记后可享受增值税免征（技术开发/转让）及所得税优惠。' },
        { code:'RCYJ_2026', name:'济南市人才引进补贴', level:'市级', dept:'济南市人社局', subsidy:'¥10-100万/人', deadline:'2026-10-15', icon:'fa-users', color:'rose',
          desc:'适用：引进高层次人才的企业。按人才层级给予购房补贴、生活补贴、项目资助等。' },
        { code:'RJQY_2026', name:'软件企业税收优惠', level:'国家级', dept:'工信部+税务总局', subsidy:'所得税两免三减半+增值税超3%即征即退', deadline:'2026-12-31', icon:'fa-code', color:'green',
          desc:'适用：以软件开发为主营业务的企业。需先通过软件企业评估，享受所得税"两免三减半"及增值税优惠。' }
    ];
    var WIZARD_STEP = 1;
    var WIZARD_SELECTED = null;
    function openNewProjectWizard() {
        WIZARD_STEP = 1;
        WIZARD_SELECTED = null;
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'wizardMask';
        mask.onclick = function(e){ if(e.target.id==='wizardMask') closeModal('wizardMask'); };
        mask.innerHTML = '<div id="wizardBox" style="width:680px;max-height:88vh;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);display:flex;flex-direction:column;"></div>';
        document.body.appendChild(mask);
        renderWizardStep();
    }
    function renderWizardStep() {
        var box = document.getElementById('wizardBox');
        var steps = ['选择政策类型', '填写项目信息', '确认并生成材料包'];
        var dotsHtml = '';
        steps.forEach(function(s, i){
            var n = i + 1;
            var cls = n < WIZARD_STEP ? 'bg-green-500 text-white' : (n === WIZARD_STEP ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500');
            var labelCls = n === WIZARD_STEP ? 'text-blue-600 font-black' : (n < WIZARD_STEP ? 'text-green-600 font-bold' : 'text-slate-400');
            dotsHtml += '<div class="flex items-center '+(i < steps.length-1 ? 'flex-1' : '')+'">'
                + '<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold '+cls+'">'+(n < WIZARD_STEP ? '<i class="fa fa-check"></i>' : n)+'</div>'
                + '<span class="ml-2 text-[11px] '+labelCls+'">'+s+'</span>'
                + (i < steps.length-1 ? '<div class="flex-1 h-0.5 mx-3 '+(n < WIZARD_STEP ? 'bg-green-400' : 'bg-slate-200')+'"></div>' : '')
                + '</div>';
        });
        var bodyHtml = '';
        if (WIZARD_STEP === 1) {
            // 步骤1：选择政策类型
            bodyHtml = '<div class="px-6 py-4"><div class="text-[11px] text-slate-500 mb-3">请选择要申报的政策类型，系统将根据政策自动生成个性化材料清单：</div><div class="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto scroll-thin pr-1">';
            POLICY_CATALOG.forEach(function(p){
                var lc = { '国家级':'bg-red-50 text-red-500', '省级':'bg-orange-50 text-orange-500', '市级':'bg-blue-50 text-blue-500' }[p.level];
                bodyHtml += '<div onclick="selectPolicy(\''+p.code+'\')" class="border-2 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md '+(WIZARD_SELECTED===p.code?'border-blue-500 bg-blue-50/50':'border-slate-100 hover:border-blue-200')+'">'
                    + '<div class="flex items-center justify-between mb-2">'
                    +   '<div class="flex items-center space-x-2">'
                    +     '<span class="w-8 h-8 rounded-lg bg-'+p.color+'-100 text-'+p.color+'-600 flex items-center justify-center"><i class="fa '+p.icon+' text-sm"></i></span>'
                    +     '<span class="text-xs font-black text-slate-700">'+p.name+'</span>'
                    +   '</div>'
                    +   (WIZARD_SELECTED===p.code ? '<i class="fa fa-check-circle text-blue-500"></i>' : '')
                    + '</div>'
                    + '<div class="flex items-center space-x-1 mb-2"><span class="px-1.5 py-px rounded text-[9px] font-bold '+lc+'">'+p.level+'</span><span class="px-1.5 py-px rounded text-[9px] font-bold bg-slate-100 text-slate-500">'+p.dept+'</span></div>'
                    + '<p class="text-[10px] text-slate-500 leading-relaxed mb-2">'+p.desc+'</p>'
                    + '<div class="flex items-center justify-between text-[10px]"><span class="text-green-600 font-bold">'+p.subsidy+'</span><span class="text-orange-500">截止 '+p.deadline+'</span></div>'
                    + '</div>';
            });
            bodyHtml += '</div></div>';
        } else if (WIZARD_STEP === 2) {
            // 步骤2：填写项目信息
            var p = getPolicyByCode(WIZARD_SELECTED);
            bodyHtml = '<div class="px-6 py-4 max-h-[420px] overflow-y-auto scroll-thin">'
                + '<div class="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">'
                +   '<div class="flex items-center space-x-2 mb-1"><i class="fa fa-info-circle text-blue-500"></i><span class="text-xs font-bold text-blue-700">已选政策：'+p.name+'</span></div>'
                +   '<p class="text-[10.5px] text-blue-600 leading-relaxed">'+p.desc+'</p>'
                + '</div>'
                + '<div class="space-y-3">'
                +   '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">项目名称 <span class="text-rose-500">*</span></label><input id="wizName" type="text" value="'+p.name+'" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"></div>'
                +   '<div class="grid grid-cols-2 gap-3">'
                +     '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">企业名称 <span class="text-rose-500">*</span></label><input id="wizCompany" type="text" value="济南XX新能源科技有限公司" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"></div>'
                +     '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">统一社会信用代码</label><input id="wizCreditCode" type="text" value="913701XXXXXXXXXX" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"></div>'
                +   '</div>'
                +   '<div class="grid grid-cols-2 gap-3">'
                +     '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">联系人</label><input id="wizContact" type="text" value="张先生" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"></div>'
                +     '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">联系电话</label><input id="wizPhone" type="text" value="138XXXX1234" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"></div>'
                +   '</div>'
                +   '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">申报截止日期</label><input id="wizDeadline" type="text" value="'+p.deadline+'" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"></div>'
                +   '<div><label class="text-[11px] font-bold text-slate-600 block mb-1">备注说明</label><textarea id="wizRemark" rows="2" placeholder="可填写特殊需求或注意事项..." class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400 resize-none"></textarea></div>'
                + '</div></div>';
        } else if (WIZARD_STEP === 3) {
            // 步骤3：确认并生成
            var p = getPolicyByCode(WIZARD_SELECTED);
            var wizName = document.getElementById('wizName') ? document.getElementById('wizName').value : p.name;
            bodyHtml = '<div class="px-6 py-4 max-h-[420px] overflow-y-auto scroll-thin">'
                + '<div class="text-center mb-4"><div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"><i class="fa fa-check text-green-500 text-2xl"></i></div><div class="text-sm font-black text-slate-800">确认创建申报项目</div><div class="text-[11px] text-slate-500 mt-1">系统将自动生成个性化材料清单和进度阶段</div></div>'
                + '<div class="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">'
                +   '<div class="flex justify-between text-[11px]"><span class="text-slate-500">项目名称</span><span class="font-bold text-slate-700">'+wizName+'</span></div>'
                +   '<div class="flex justify-between text-[11px]"><span class="text-slate-500">政策类型</span><span class="font-bold text-slate-700">'+p.name+' ('+p.level+')</span></div>'
                +   '<div class="flex justify-between text-[11px]"><span class="text-slate-500">主管部门</span><span class="font-bold text-slate-700">'+p.dept+'</span></div>'
                +   '<div class="flex justify-between text-[11px]"><span class="text-slate-500">截止日期</span><span class="font-bold text-orange-600">'+p.deadline+'</span></div>'
                +   '<div class="flex justify-between text-[11px]"><span class="text-slate-500">预计扶持</span><span class="font-bold text-green-600">'+p.subsidy+'</span></div>'
                + '</div>'
                + '<div class="p-3 bg-blue-50 rounded-xl border border-blue-100">'
                +   '<div class="flex items-center space-x-1 mb-2"><i class="fa fa-magic text-blue-500"></i><span class="text-[11px] font-black text-blue-700">系统将自动执行以下操作：</span></div>'
                +   '<div class="space-y-1.5 text-[10.5px] text-blue-600">'
                +     '<div class="flex items-center"><i class="fa fa-check-circle mr-2"></i>从政策模板库拉取「'+p.name+'」标准化材料清单</div>'
                +     '<div class="flex items-center"><i class="fa fa-check-circle mr-2"></i>自动生成材料分组与智能填写提示</div>'
                +     '<div class="flex items-center"><i class="fa fa-check-circle mr-2"></i>创建申报进度阶段时间线与关键节点提醒</div>'
                +     '<div class="flex items-center"><i class="fa fa-check-circle mr-2"></i>匹配企业材料库中可复用的历史材料</div>'
                +   '</div>'
                + '</div></div>';
        }
        // 底部按钮
        var footerHtml = '<div class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">'
            + '<button onclick="closeModal(\'wizardMask\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">取消</button>'
            + '<div class="flex items-center space-x-2">'
            + (WIZARD_STEP > 1 ? '<button onclick="WIZARD_STEP--;renderWizardStep()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"><i class="fa fa-arrow-left mr-1"></i>上一步</button>' : '')
            + (WIZARD_STEP < 3
                ? '<button onclick="wizardNext()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 '+(WIZARD_STEP===1 && !WIZARD_SELECTED ? 'opacity-50 pointer-events-none' : '')+'">下一步<i class="fa fa-arrow-right ml-1"></i></button>'
                : '<button onclick="confirmCreateProject()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 shadow-lg shadow-green-200"><i class="fa fa-check mr-1"></i>确认创建</button>')
            + '</div></div>';
        box.innerHTML =
            '<div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between">'
            + '<div class="flex items-center space-x-2"><i class="fa fa-plus-circle text-blue-600 text-lg"></i><div><div class="text-sm font-black text-slate-800">新建申报项目</div><div class="text-[10.5px] text-slate-500">选择政策类型 → 填写信息 → 自动生成材料包</div></div></div>'
            + '<button onclick="closeModal(\'wizardMask\')" class="w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
            + '</div>'
            + '<div class="px-6 py-3 bg-white border-b border-slate-100"><div class="flex items-center justify-between">' + dotsHtml + '</div></div>'
            + '<div class="flex-1 overflow-y-auto scroll-thin">' + bodyHtml + '</div>'
            + footerHtml;
    }
    function getPolicyByCode(code) {
        for (var i=0;i<POLICY_CATALOG.length;i++) if (POLICY_CATALOG[i].code === code) return POLICY_CATALOG[i];
        return POLICY_CATALOG[0];
    }
    function selectPolicy(code) {
        WIZARD_SELECTED = code;
        renderWizardStep();
    }
    function wizardNext() {
        if (WIZARD_STEP === 1 && !WIZARD_SELECTED) { showToast('请先选择一个政策类型', 'warn'); return; }
        WIZARD_STEP++;
        renderWizardStep();
    }
    function confirmCreateProject() {
        closeModal('wizardMask');
        var p = getPolicyByCode(WIZARD_SELECTED);
        var wizName = document.getElementById('wizName') ? document.getElementById('wizName').value : p.name;
        // 创建进度弹窗
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'createMask';
        mask.innerHTML =
        '<div style="width:440px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);">'
        + '<div class="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 text-center">'
        + '  <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3"><i class="fa fa-cog fa-spin text-blue-500 text-2xl"></i></div>'
        + '  <div class="text-sm font-black text-slate-800 mb-1">正在创建申报项目</div>'
        + '  <div class="text-[11px] text-slate-500">'+wizName+'</div>'
        + '</div>'
        + '<div class="px-6 py-5">'
        + '  <div id="createLog" class="space-y-1.5 text-[10.5px] text-slate-500 max-h-[140px] overflow-y-auto scroll-thin"></div>'
        + '  <div class="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div id="createBar" class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300" style="width:0%"></div></div>'
        + '</div></div>';
        document.body.appendChild(mask);
        var matCount = p.code.indexOf('GXQ')!==-1 ? 12 : (p.code.indexOf('ZJTX')!==-1 ? 6 : 4);
        var steps = [
            { text:'创建项目记录...', delay:400 },
            { text:'拉取「'+p.name+'」政策模板...', delay:500 },
            { text:'生成材料清单（'+matCount+'项材料）...', delay:500 },
            { text:'生成申报阶段时间线...', delay:400 },
            { text:'匹配企业材料库历史材料...', delay:500 },
            { text:'创建关键节点提醒...', delay:400 },
            { text:'项目创建完成！', delay:300 }
        ];
        var log = document.getElementById('createLog');
        var bar = document.getElementById('createBar');
        var idx = 0;
        (function nextStep(){
            if (idx >= steps.length) {
                closeModal('createMask');
                // 切换到新项目
                var targetId = null;
                if (p.code.indexOf('GXQ') !== -1) targetId = 'gqx';
                else if (p.code.indexOf('ZJTX') !== -1) targetId = 'zjtx';
                else if (p.code.indexOf('KJXQ') !== -1) targetId = 'kjxq';
                else if (p.code.indexOf('ZNZZ') !== -1) targetId = 'znzz';
                if (targetId) switchProject(targetId);
                updateStats();
                // 弹出创建成功 + 下一步指引面板
                showCreateSuccessPanel(wizName, p, matCount, targetId);
                return;
            }
            var s = steps[idx];
            var line = document.createElement('div');
            line.innerHTML = '<span class="text-slate-400">['+(idx+1)+'/'+steps.length+']</span> '+s.text;
            log.appendChild(line);
            log.scrollTop = log.scrollHeight;
            bar.style.width = Math.round((idx+1)/steps.length*100) + '%';
            idx++;
            setTimeout(nextStep, s.delay);
        })();
    }
    // ========== 11. 创建成功后的下一步指引面板 ==========
    function showCreateSuccessPanel(wizName, policy, matCount, targetId) {
        // 统计当前项目的材料状态
        var done=0, warn=0, todo=0;
        if (targetId) {
            var p = null;
            for (var i=0;i<PROJECTS.length;i++) if (PROJECTS[i].id===targetId) { p=PROJECTS[i]; break; }
            if (p) {
                p.groups.forEach(function(g){ g.items.forEach(function(m){
                    if (m.status==='done') done++;
                    else if (m.status==='warn') warn++;
                    else todo++;
                });});
            }
        }
        var totalMat = done + warn + todo;
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'successMask';
        mask.onclick = function(e){ if(e.target.id==='successMask') closeModal('successMask'); };
        mask.innerHTML =
        '<div style="width:520px;max-height:88vh;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);display:flex;flex-direction:column;">'
        // 头部：成功标志
        + '<div class="px-6 py-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-b border-slate-100 text-center relative">'
        + '  <button onclick="closeModal(\'successMask\')" class="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
        + '  <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"><i class="fa fa-check-circle text-green-500 text-3xl"></i></div>'
        + '  <div class="text-base font-black text-slate-800">项目创建成功！</div>'
        + '  <div class="text-[12px] text-slate-500 mt-1">'+wizName+'</div>'
        + '</div>'
        // 生成结果摘要
        + '<div class="px-6 py-4 bg-white border-b border-slate-100">'
        + '  <div class="grid grid-cols-4 gap-3 text-center">'
        + '    <div class="p-2 bg-blue-50 rounded-lg"><div class="text-lg font-black text-blue-600">'+totalMat+'</div><div class="text-[9px] text-slate-500 mt-0.5">材料总数</div></div>'
        + '    <div class="p-2 bg-green-50 rounded-lg"><div class="text-lg font-black text-green-600">'+done+'</div><div class="text-[9px] text-slate-500 mt-0.5">已就绪</div></div>'
        + '    <div class="p-2 bg-orange-50 rounded-lg"><div class="text-lg font-black text-orange-500">'+warn+'</div><div class="text-[9px] text-slate-500 mt-0.5">待完善</div></div>'
        + '    <div class="p-2 bg-rose-50 rounded-lg"><div class="text-lg font-black text-rose-500">'+todo+'</div><div class="text-[9px] text-slate-500 mt-0.5">需准备</div></div>'
        + '  </div>'
        + '</div>'
        // 下一步行动指引
        + '<div class="flex-1 overflow-y-auto scroll-thin px-6 py-4">'
        + '  <div class="text-[11px] font-black text-slate-700 mb-3 flex items-center"><i class="fa fa-compass text-blue-500 mr-1.5"></i>下一步建议操作</div>'
        + '  <div class="space-y-2">'
        // 行动1：填写材料
        + '    <div onclick="goFillMaterials(\''+targetId+'\')" class="flex items-start space-x-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">'
        + '      <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">1</span>'
        + '      <div class="flex-1">'
        + '        <div class="text-xs font-bold text-slate-700">开始填写申报材料</div>'
        + '        <div class="text-[10.5px] text-slate-500 mt-0.5">还有 <b class="text-rose-500">'+todo+' 项</b>材料缺失，点击每项材料可查看智能提示与样例参考</div>'
        + '      </div>'
        + '      <i class="fa fa-arrow-right text-slate-300 mt-1"></i>'
        + '    </div>'
        // 行动2：同步材料库
        + '    <div onclick="goSyncLibrary()" class="flex items-start space-x-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:border-green-200 hover:bg-green-50/30 transition-all">'
        + '      <span class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">2</span>'
        + '      <div class="flex-1">'
        + '        <div class="text-xs font-bold text-slate-700">同步企业材料库</div>'
        + '        <div class="text-[10.5px] text-slate-500 mt-0.5">从历史材料中智能匹配可复用的文件，快速补齐已有材料</div>'
        + '      </div>'
        + '      <i class="fa fa-arrow-right text-slate-300 mt-1"></i>'
        + '    </div>'
        // 行动3：查看进度看板
        + '    <div onclick="goCheckProgress()" class="flex items-start space-x-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:border-purple-200 hover:bg-purple-50/30 transition-all">'
        + '      <span class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">3</span>'
        + '      <div class="flex-1">'
        + '        <div class="text-xs font-bold text-slate-700">查看申报进度看板</div>'
        + '        <div class="text-[10.5px] text-slate-500 mt-0.5">了解当前阶段、截止日期倒计时与关键节点提醒</div>'
        + '      </div>'
        + '      <i class="fa fa-arrow-right text-slate-300 mt-1"></i>'
        + '    </div>'
        // 行动4：下载模板
        + '    <div onclick="goDownloadTemplate()" class="flex items-start space-x-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">'
        + '      <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">4</span>'
        + '      <div class="flex-1">'
        + '        <div class="text-xs font-bold text-slate-700">下载材料模板包</div>'
        + '        <div class="text-[10.5px] text-slate-500 mt-0.5">一键下载全部样例模板与填写指南，离线准备材料</div>'
        + '      </div>'
        + '      <i class="fa fa-arrow-right text-slate-300 mt-1"></i>'
        + '    </div>'
        + '  </div>'
        // 提示
        + '  <div class="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10.5px] text-amber-700 leading-relaxed">'
        + '    <i class="fa fa-lightbulb-o mr-1"></i><b>温馨提示：</b>距申报截止仅剩 <b class="text-rose-500">'+(policy.deadline.match(/(\d+)/)?policy.deadline.match(/(\d+)/)[1]+'天':'请关注截止日期')+'</b>，建议优先准备标注"必填"的核心材料。'
        + '  </div>'
        + '</div>'
        // 底部按钮
        + '<div class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">'
        + '  <span class="text-[10.5px] text-slate-500"><i class="fa fa-info-circle mr-1"></i>项目已自动切换至左侧材料包视图</span>'
        + '  <button onclick="closeModal(\'successMask\');showToast(\'已进入材料填写页面\',\'info\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 shadow-lg shadow-green-200"><i class="fa fa-check mr-1"></i>开始填写材料</button>'
        + '</div>'
        + '</div>';
        document.body.appendChild(mask);
    }
    // 下一步行动 - 跳转函数
    function goFillMaterials(targetId) {
        closeModal('successMask');
        if (targetId) switchProject(targetId);
        // 滚动到材料包区域
        var el = document.getElementById('materialGroups');
        if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
        showToast('已定位到材料清单，点击每项材料可查看智能提示', 'info');
    }
    function goSyncLibrary() {
        closeModal('successMask');
        syncFromLibrary();
    }
    function goCheckProgress() {
        closeModal('successMask');
        var el = document.getElementById('stageTimeline');
        if (el) {
            el.scrollIntoView({ behavior:'smooth', block:'center' });
            // 闪烁高亮
            el.style.transition = 'box-shadow 0.3s';
            el.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.3)';
            setTimeout(function(){ el.style.boxShadow = ''; }, 1500);
        }
        showToast('已定位到进度跟踪看板', 'info');
    }
    function goDownloadTemplate() {
        closeModal('successMask');
        downloadPkg();
    }
    // ========== 12. 提交申报（提交到政府系统 + 状态推进）==========
    // 各政策对应的提交渠道（真实场景从 policy_catalog.submit_channels 配置）
    var SUBMIT_CHANNELS = {
        'gqx':  { name:'科技部火炬中心高企认定系统', url:'http://www.chinatorch.gov.cn', desc:'在线填报申请书 + 上传PDF附件', needOnline:true },
        'zjtx': { name:'山东省工信厅专精特新申报系统', url:'http://gxt.shandong.gov.cn', desc:'在线填报 + 材料扫描件上传', needOnline:true },
        'kjxq': { name:'科技型中小企业评价系统', url:'http://www.innofund.gov.cn', desc:'在线自评 + 自动入库', needOnline:true },
        'znzz': { name:'济南市工信局智能制造申报平台', url:'http://gxj.jinan.gov.cn', desc:'区级初审 → 市级复审', needOnline:true }
    };
    function submitDeclaration() {
        var p = getCurrentProject();
        // 1. 材料齐全度检查
        var total=0, done=0, warn=0, todo=0;
        var missingRequired = [];
        p.groups.forEach(function(g){
            g.items.forEach(function(m){
                total++;
                if (m.status==='done') done++;
                else if (m.status==='warn') warn++;
                else todo++;
                if (m.required && m.status === 'todo') missingRequired.push(m.name);
            });
        });
        var readiness = Math.round(done/total*100);
        var channel = SUBMIT_CHANNELS[p.id] || { name:'政府申报系统', url:'#', desc:'在线提交', needOnline:true };

        // 2. 提交确认弹窗
        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'submitMask';
        mask.onclick = function(e){ if(e.target.id==='submitMask') closeModal('submitMask'); };

        // 校验结果区域
        var checkHtml = '';
        if (missingRequired.length > 0) {
            // 有必填材料缺失 → 阻断提交
            checkHtml = '<div class="p-3 bg-rose-50 rounded-xl border border-rose-200 mb-3">'
                + '<div class="flex items-center space-x-2 mb-2"><i class="fa fa-exclamation-triangle text-rose-500"></i><span class="text-xs font-black text-rose-700">材料校验未通过（'+missingRequired.length+'项必填材料缺失）</span></div>'
                + '<div class="space-y-1 max-h-[100px] overflow-y-auto scroll-thin">'
                + missingRequired.map(function(n){ return '<div class="text-[10.5px] text-rose-600"><i class="fa fa-times-circle mr-1"></i>'+n+'</div>'; }).join('')
                + '</div></div>'
                + '<div class="text-[11px] text-slate-500 text-center py-2">请先补齐以上必填材料后再提交申报</div>';
        } else {
            // 校验通过
            checkHtml = '<div class="p-3 bg-green-50 rounded-xl border border-green-200 mb-3">'
                + '<div class="flex items-center space-x-2 mb-1"><i class="fa fa-check-circle text-green-500"></i><span class="text-xs font-black text-green-700">材料校验通过</span></div>'
                + '<div class="grid grid-cols-4 gap-2 mt-2">'
                +   '<div class="text-center"><div class="text-sm font-black text-blue-600">'+total+'</div><div class="text-[9px] text-slate-500">材料总数</div></div>'
                +   '<div class="text-center"><div class="text-sm font-black text-green-600">'+done+'</div><div class="text-[9px] text-slate-500">已就绪</div></div>'
                +   '<div class="text-center"><div class="text-sm font-black text-orange-500">'+warn+'</div><div class="text-[9px] text-slate-500">待完善</div></div>'
                +   '<div class="text-center"><div class="text-sm font-black text-rose-500">'+todo+'</div><div class="text-[9px] text-slate-500">缺失</div></div>'
                + '</div></div>';
            // 提交渠道
            checkHtml += '<div class="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-3">'
                + '<div class="flex items-center space-x-2 mb-1"><i class="fa fa-send text-blue-500"></i><span class="text-[11px] font-black text-blue-700">提交渠道</span></div>'
                + '<div class="text-[11px] text-slate-700 font-bold">'+channel.name+'</div>'
                + '<div class="text-[10px] text-slate-500 mt-0.5">'+channel.desc+'</div>'
                + '<div class="text-[10px] text-blue-500 mt-1"><i class="fa fa-link mr-1"></i>'+channel.url+'</div>'
                + '</div>';
            // 提交须知
            checkHtml += '<div class="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-3">'
                + '<div class="flex items-center space-x-1 mb-1"><i class="fa fa-info-circle text-amber-500"></i><span class="text-[11px] font-black text-amber-700">提交须知</span></div>'
                + '<div class="space-y-1 text-[10px] text-amber-700">'
                +   '<div>• 提交后材料将锁定，如需修改需联系主管部门撤回</div>'
                +   '<div>• 提交后将自动进入"专家评审"阶段，预计周期 20-30 个工作日</div>'
                +   '<div>• 系统将持续跟踪审核状态，有进展时自动推送提醒</div>'
                + '</div></div>';
        }

        mask.innerHTML =
        '<div style="width:520px;max-height:88vh;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);display:flex;flex-direction:column;">'
        + '<div class="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-100 flex items-center justify-between">'
        + '  <div class="flex items-center space-x-2"><i class="fa fa-paper-plane text-green-600 text-lg"></i><div><div class="text-sm font-black text-slate-800">提交申报</div><div class="text-[10.5px] text-slate-500">'+p.name+'</div></div></div>'
        + '  <button onclick="closeModal(\'submitMask\')" class="w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-500 flex items-center justify-center"><i class="fa fa-times"></i></button>'
        + '</div>'
        + '<div class="flex-1 overflow-y-auto scroll-thin px-6 py-4">'
        +   '<div class="mb-3 flex items-center justify-between"><span class="text-[11px] font-black text-slate-700">材料就绪度</span><span class="text-lg font-black '+(readiness>=80?'text-green-600':'text-orange-500')+'">'+readiness+'%</span></div>'
        +   '<div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-4"><div class="h-full rounded-full transition-all duration-500 '+(readiness>=80?'bg-gradient-to-r from-green-400 to-emerald-500':'bg-gradient-to-r from-orange-400 to-amber-500')+'" style="width:'+readiness+'%"></div></div>'
        +   checkHtml
        + '</div>'
        + '<div class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">'
        + '  <span class="text-[10.5px] text-slate-500"><i class="fa fa-shield mr-1"></i>提交前系统已自动完成材料完整性校验</span>'
        + '  <div class="flex items-center space-x-2">'
        +    '<button onclick="closeModal(\'submitMask\')" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">取消</button>';
        var actionBtn = missingRequired.length > 0
            ? '<button onclick="closeModal(\'submitMask\');syncFromLibrary()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600"><i class="fa fa-refresh mr-1"></i>去补齐材料</button>'
            : '<button onclick="executeSubmit()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 shadow-lg shadow-green-200"><i class="fa fa-paper-plane mr-1"></i>确认提交到 '+channel.name.split('部')[0]+'部</button>';
        mask.innerHTML += actionBtn
        +   '</div>'
        + '</div>'
        + '</div>';
        document.body.appendChild(mask);
    }
    // 执行提交（提交进度动画 + 状态推进）
    function executeSubmit() {
        closeModal('submitMask');
        var p = getCurrentProject();
        var channel = SUBMIT_CHANNELS[p.id] || { name:'政府申报系统' };

        var mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.id = 'execSubmitMask';
        mask.innerHTML =
        '<div style="width:460px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(15,23,42,0.4);">'
        + '<div class="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 text-center">'
        + '  <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3"><i class="fa fa-cloud-upload text-blue-500 text-2xl"></i></div>'
        + '  <div class="text-sm font-black text-slate-800 mb-1">正在提交申报</div>'
        + '  <div class="text-[11px] text-slate-500">'+p.name+' → '+channel.name+'</div>'
        + '</div>'
        + '<div class="px-6 py-5">'
        + '  <div id="submitLog" class="space-y-1.5 text-[10.5px] text-slate-500 max-h-[160px] overflow-y-auto scroll-thin mb-3"></div>'
        + '  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div id="submitBar" class="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300" style="width:0%"></div></div>'
        + '</div>'
        + '<div id="submitFooter" class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between" style="display:none;">'
        + '  <span id="submitResult" class="text-[11px] text-slate-600"></span>'
        + '  <button onclick="closeModal(\'execSubmitMask\');afterSubmitRefresh()" class="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700">查看申报状态</button>'
        + '</div>'
        + '</div>';
        document.body.appendChild(mask);

        var steps = [
            { text:'正在加密打包材料（'+p.groups.reduce(function(s,g){return s+g.items.length;},0)+'份文件）...', delay:500 },
            { text:'连接到 '+channel.name+'...', delay:500 },
            { text:'身份认证中（统一社会信用代码校验）...', delay:500 },
            { text:'上传申请表...', delay:400 },
            { text:'上传附件材料（'+p.groups.reduce(function(s,g){return s+g.items.length;},0)+'份）...', delay:600 },
            { text:'系统校验材料格式与完整性...', delay:500 },
            { text:'提交成功！申报编号：SB-'+new Date().getFullYear()+'-'+String(Math.floor(Math.random()*9000)+1000), delay:400 },
            { text:'已自动推进至"专家评审"阶段', delay:400 },
            { text:'已创建审核状态跟踪任务，有进展将自动提醒', delay:300 }
        ];
        var log = document.getElementById('submitLog');
        var bar = document.getElementById('submitBar');
        var idx = 0;
        (function nextStep(){
            if (idx >= steps.length) {
                // ===== 状态推进 =====
                advanceProjectStage(p);
                document.getElementById('submitFooter').style.display = 'flex';
                document.getElementById('submitResult').innerHTML = '<i class="fa fa-check-circle text-green-500 mr-1"></i>申报已成功提交，项目状态已更新';
                return;
            }
            var s = steps[idx];
            var line = document.createElement('div');
            var isLast = idx === steps.length - 1;
            line.innerHTML = '<span class="text-slate-400">['+(idx+1)+'/'+steps.length+']</span> '+s.text;
            if (idx >= 6) line.innerHTML = '<span class="text-green-400">['+(idx+1)+'/'+steps.length+']</span> <span class="text-green-600">'+s.text+'</span>';
            log.appendChild(line);
            log.scrollTop = log.scrollHeight;
            bar.style.width = Math.round((idx+1)/steps.length*100) + '%';
            idx++;
            setTimeout(nextStep, s.delay);
        })();
    }
    // 提交后推进项目阶段状态
    function advanceProjectStage(p) {
        // 找到"提交申请"阶段，标记为done
        for (var i=0;i<p.stages.length;i++) {
            if (p.stages[i].name.indexOf('提交') !== -1 || p.stages[i].name.indexOf('申请') !== -1) {
                if (p.stages[i].status !== 'done') {
                    p.stages[i].status = 'done';
                    p.stages[i].rate = 100;
                    p.stages[i].actualDate = new Date().toISOString().slice(5,10).replace('-','/');
                }
                // 推进下一阶段为doing
                if (i+1 < p.stages.length && p.stages[i+1].status === 'pending') {
                    p.stages[i+1].status = 'doing';
                    p.stages[i+1].rate = Math.max(p.stages[i+1].rate, 10);
                }
                break;
            }
        }
        // 更新综合进度
        var stageSum = 0;
        p.stages.forEach(function(s){ stageSum += s.rate; });
        p.progress = Math.round(stageSum / p.stages.length);
        // 在提醒中添加提交成功记录
        var hasSubmitReminder = false;
        p.reminders.forEach(function(r){ if (r.title.indexOf('提交') !== -1) hasSubmitReminder = true; });
        if (!hasSubmitReminder) {
            p.reminders.unshift({
                lv:'done',
                title: '申报已提交至'+(SUBMIT_CHANNELS[p.id]||{}).name,
                time: '刚刚',
                desc: '申报编号已生成，等待主管部门审核，预计20-30个工作日出结果'
            });
        }
    }
    // 提交后刷新页面
    function afterSubmitRefresh() {
        var p = getCurrentProject();
        switchProject(p.id);
        updateStats();
        showToast('申报已提交，进度看板已更新', 'success');
        // 高亮进度看板
        var el = document.getElementById('stageTimeline');
        if (el) {
            el.scrollIntoView({ behavior:'smooth', block:'center' });
            el.style.transition = 'box-shadow 0.3s';
            el.style.boxShadow = '0 0 0 4px rgba(34,197,94,0.3)';
            setTimeout(function(){ el.style.boxShadow = ''; }, 2000);
        }
    }
