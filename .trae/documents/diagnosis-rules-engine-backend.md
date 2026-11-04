# 测评规则引擎后台配置页实施计划

## Context（为什么做）

当前 `ability-diagnosis.html` 的三类测评报告（高企/专精特新/小巨人）规则全部以 JavaScript 内联函数的形式硬编码在前端：
- `TAB_REPORTS`（L1412-L1479）的 `check` / `value` / `calc` / `basis` 都是 JS 函数
- `scoreHightech` / `scoreSpecialized` / `scoreGiant`（L1037-L1132）的阈值（如 `≥10%`、`≥60%`、`≥3%`）写死在代码里

这意味着运营人员修改任何阈值/满分/及格线都需要改前端代码并重新部署。已有 `diagnosis-config.html` 仅能配置维度基准与评级阈值，**无法触及报告判定逻辑**。

本计划在运营后台新增一个结构化规则引擎配置页，覆盖三类测评的全部硬性指标与评分项；规则以 JSON DSL 形式存于 localStorage，前端测评页启动时加载并用统一的 `RuleInterpreter` 解释执行，无需改代码即可调整规则。

## 设计：结构化规则 DSL

**核心原则**：所有规则可序列化为 JSON，不依赖 JS 函数。表达式使用受控语法（自定义解析器，禁用 `eval`/`Function`），仅支持算术、比较、逻辑、三元、字段引用、`sum()`/`count()`/`yearsSince()` 三个内置函数。

### DSL 数据结构

```json
{
  "version": 1,
  "rules": {
    "hightech": {
      "type": "高企",
      "passLine": 70.1,
      "hardMetrics": [{
        "key": "personnel",
        "name": "研发人员占比",
        "desc": "≥10%",
        "check": { "expr": "formRdStaff / formEmployees * 100", "op": ">=", "value": 10, "guard": "formEmployees > 0" },
        "value": { "expr": "formRdStaff / formEmployees * 100", "unit": "%", "decimals": 1, "fallback": "未填", "guard": "formEmployees > 0" }
      }],
      "scoreItems": [{
        "key": "transform",
        "name": "成果转化能力",
        "max": 30,
        "calc": { "expr": "formTransform * 4", "cap": 30, "floor": 0 },
        "basis": { "template": "近三年年均成果转化 {formTransform} 项" }
      }]
    }
  }
}
```

### 表达式语法

- 字段引用：`formIP1`、`formRdStaff`、`formRev[2]`（数组索引，0=三年前、2=最近一年）
- 数组聚合：`sum(formRdFee)`、`sum(formRev)`、`count(formQuality)`
- 时间函数：`yearsSince(formFoundDate)`（计算成立年限）
- 运算符：`+ - * /`、`>= <= > < == !=`、`&& || !`、三元 `c ? a : b`
- 字面量：数字、`'是'`/`'否'` 字符串

### 规则全量映射（共 3 套 × 多条规则）

#### 高企（passLine 70.1）
- 硬指标 5 条：注册年限满1年（`yearsSince(formFoundDate) >= 1`）、研发人员占比 ≥10%、高新收入占比 ≥60%、研发费用占比 ≥3%、核心技术领域非空（`formProduct != ''`）
- 评分项 4 条：知识产权 max30（`formIP1 * 20 + formIP2 * 5`）、成果转化 max30（`formTransform * 4`）、研发组织管理 max20（三元链：`(formIUR == '是' && formStd == '是') ? 100 : ((formIUR == '是' || formStd == '是') ? 60 : 20)`）、企业成长性 max20（`(formRev[2] - formRev[0]) / formRev[0] * 100 * 0.4`，guard `formRev[0] > 0`）

#### 专精特新（passLine 70）
- 硬指标 4 条：主导产品 ≥60%、研发人员 ≥10、营收增长 ≥0、资产负债率 ≤70
- 评分项 4 条：专业化 max25（`formProdPct`）、精细化 max25（`count(formQuality) * 25 + (formDebt <= 70 ? 25 : max(0, 25 - (formDebt - 70)))`）、特色化 max25（三元枚举）、新颖化 max25（`formRdStaff * 2 + formPatentTotal * 5 + min(20, formRdFee / 50)`）

#### 小巨人（passLine 75）
- 硬指标 6 条：市场占有率 ≥10%、工业六基且补短板（`formSixBase == '是' && formChain == '是'`）、研发费用占比 ≥3%、研发人员 ≥15、Ⅰ类知识产权 ≥2、资产负债率 ≤70
- 评分项 6 条：市场占有率 max25、产业链补短板 max15、研发费用 max20、研发人员 max15、Ⅰ类知识产权 max15（`formIP1 * 40`）、资产负债率 max10

## 文件改动清单

### 1. 新建：`ceyuan-yida-policy-pc/diagnosis-rules.html`

参照 `qualification-rules.html` 头部/表格/模态框骨架。**注意**：放在 `ceyuan-yida-policy-pc/` 根目录（与 `qualification-rules.html`、`diagnosis-config.html` 同级），不在 `operation-backend/` 下，便于直接复用 `data-bridge.js` 与本地 `libs/css/`。

页面结构：
- **顶部**：标题 + 「保存规则」/「恢复默认」/「导出 JSON」/「导入 JSON」按钮
- **Tab 栏**：高企 / 专精特新 / 小巨人
- **每个 Tab 内容**：
  - 子区块 1：硬性指标表格（列：key / name / desc / check 表达式预览 / 操作）
  - 子区块 2：评分项表格（列：key / name / max / calc 表达式预览 / basis 模板 / 操作）
  - 子区块 3：及格线 + 测评类型名编辑
- **编辑模态框**：分两栏（基础字段 + 表达式试算区）
  - 基础字段：key、name、desc（硬指标）、max、basis.template（评分项）
  - 表达式：check.expr、check.op 下拉、check.value、check.guard；value.expr、value.unit、value.decimals、value.fallback；calc.expr、calc.cap、calc.floor
  - 试算区：填示例 inputs JSON，实时回显 check/value/calc/basis 结果

### 2. 修改：`ceyuan-yida-policy-pc/data-bridge.js`

- `KEYS`（L10-L24）新增 `DIAGNOSIS_RULES: 'ceyuan_diagnosis_rules'`
- 新增 `DEFAULT_DIAGNOSIS_RULES` 常量（按上面规则全量映射，约 60 行 JSON）
- 新增函数 `loadDiagnosisRules()`：读取 localStorage，空或 `version` 不符则返回深拷贝 `DEFAULT_DIAGNOSIS_RULES`；命中存档则对每个 evalType 字段补齐（缺失 hardMetric/scoreItem 从默认补，多余字段保留向前兼容）
- 新增函数 `saveDiagnosisRules(rules)` / `resetDiagnosisRules()`
- 在 `global.DataBridge` 导出（参考现有 `loadDiagnosisConfig` 模式 L964）

### 3. 修改：`ceyuan-yida-policy-pc/ability-diagnosis.html`

**关键改动点**：
- 在 `<script src="data-bridge.js"></script>`（L395）之后，新增内联脚本定义 `RuleInterpreter` 类与表达式解析器（约 200 行）
- 在 `switchTab('gradient')` 初始化（L1914）之前，新增启动加载：
  ```js
  var RULES_CFG = DataBridge.loadDiagnosisRules();
  var interp = new RuleInterpreter(RULES_CFG);
  ```
- `TAB_REPORTS`（L1412-L1479）保留 key/name/desc/max/passLine 元数据外壳，**删除所有 `check`/`value`/`calc`/`basis` 函数体**
- `scoreHightech`（L1037）/ `scoreSpecialized`（L1081）/ `scoreGiant`（L1109）改为：
  ```js
  return interp.evaluate('hightech'|'specialized'|'giant', i);
  ```
- `renderHardship`（L1562）/ `renderScoreTable`（L1591）/ `renderAnalysis`（L1637）中所有 `m.check(i)` → `interp.check(m, i)`、`m.value(i)` → `interp.value(m, i)`、`s.calc(i)` → `interp.calc(s, i)`、`s.basis(i, scores)` → `interp.basis(s, i, scores)`
- `renderReport`（L1482）增加：从 `RULES_CFG.rules[currentTab]` 获取 hardMetrics/scoreItems/passLine 覆盖 `TAB_REPORTS` 当前项

### 4. 修改：`ceyuan-yida-policy-pc/index.html`

在 `diagGroup`（L161-L166）下，紧接 `诊断维度配置` 之后新增菜单项：
```html
<a href="javascript:void(0)" onclick="switchPage('diagnosis-rules.html', this)" class="sidebar-item flex items-center px-3 py-2 rounded-lg transition-all group">
    <i class="fa fa-gavel w-6 text-sm group-hover:scale-110 transition-transform"></i>
    <span class="font-medium text-xs">测评规则引擎</span>
</a>
```

## RuleInterpreter 设计

```js
class RuleInterpreter {
  constructor(cfg) { this.rules = cfg.rules; }
  // 表达式解析：tokenizer + 递归下降，支持算术/比较/逻辑/三元/字段引用/sum/count/yearsSince
  evalExpr(expr, i) { /* ... */ }
  _guard(g, i) { return !g || !!this.evalExpr(g, i); }
  check(m, i) {
    if (!this._guard(m.check.guard, i)) return false;
    if (m.check.boolExpr) return !!this.evalExpr(m.check.boolExpr, i);
    const v = this.evalExpr(m.check.expr, i), t = m.check.value;
    return ({'>=':v>=t,'<=':v<=t,'>':v>t,'<':v<t,'==':v==t,'!=':v!=t})[m.check.op];
  }
  value(m, i) {
    const c = m.value;
    if (!this._guard(c.guard, i)) return c.fallback || '未填';
    const v = this.evalExpr(c.expr, i);
    return (typeof v === 'number' && !isNaN(v)) ? v.toFixed(c.decimals ?? 0) + (c.unit||'') : (c.fallback||'未填');
  }
  calc(s, i) {
    const v = this.evalExpr(s.calc.expr, i);
    return Math.min(s.calc.cap ?? s.max, Math.max(s.calc.floor ?? 0, v));
  }
  basis(s, i) {
    return (s.basis.template||'').replace(/\{(\w+)\}/g, (_, f) => i[f] ?? '');
  }
  evaluate(type, i) {
    const cfg = this.rules[type];
    const scores = {}, pass = {};
    cfg.hardMetrics.forEach(m => pass[m.key] = this.check(m, i));
    cfg.scoreItems.forEach(s => { scores[s.key || s.name] = this.calc(s, i); });
    return { scores, pass, hardMetrics: cfg.hardMetrics, scoreItems: cfg.scoreItems };
  }
}
```

## 验证方案

### 静态验证（不启动浏览器）
1. `ability-diagnosis.html` 加载后控制台执行 `console.log(DataBridge.loadDiagnosisRules())` 应输出完整 3 套默认规则
2. `console.log(new RuleInterpreter(DataBridge.loadDiagnosisRules()))` 应成功构造
3. 用之前测试数据（安徽拓威服饰：100 员工、30 研发、0 项Ⅰ类、15 项Ⅱ类、4 项年均转化、是/否、800/1000/1200 万营收）执行 `interp.evaluate('hightech', inputs)`：
   - `pass.years` = true、`pass.personnel` = true（30%）、`pass.htIncome` = true（75%）、`pass.rdFee` = true（6%）、`pass.field` = true
   - `scores.ip` = 0×20+15×5 = 75（再 ÷100 ×30 = 22.5，验证 calc 路径）
   - `scores.transform` = min(30, 4×4) = 16
   - 总分约 76+，与之前人工测算的 76.75 一致（小幅差异源于旧版 IP 计算系数）

### 浏览器验证（browser_use agent）
1. 打开 `diagnosis-rules.html`，检查三个 Tab 均加载默认规则，硬指标 + 评分项表格完整
2. 在「高企」Tab 修改「研发人员占比」阈值 10 → 35（高于测试数据 30%），保存
3. 重新打开 `ability-diagnosis.html`，填同样的测试数据点击「开始测评」
4. 验证报告第一部分「研发人员占比」显示「不达标 ✗」（因 30% < 35% 新阈值）
5. 改回 10，保存，重测，应恢复「达标 ✓」
6. 点击「下载PDF报告」，验证仍能正常导出

### 回归测试
1. 不打开 `diagnosis-rules.html`，直接打开 `ability-diagnosis.html`（无 localStorage 规则时）应走默认值，与改造前的报告完全一致
2. 切换到「专精特新」「小巨人」Tab 各跑一次，验证规则同样生效

## 风险与权衡

**收益**：
- 阈值/满分/及格线调整无需改代码、无需部署
- 运营可视化自助维护，符合「客户端与运营端配套管理」偏好
- DSL 受控（无 `eval`），可序列化、可版本化
- 与现有 `DataBridge` 模式一致，架构不引入新风险

**代价**：
- DSL 表达力有限：只能覆盖已设计的算子（sum/count/yearsSince/三元/比较/逻辑），未来若需正则匹配、非线性分段需扩展 DSL 与解析器
- 表达式解析器约 150-200 行代码，需手工编写+测试
- 「研发组织管理」「特色化」的枚举三元链较冗长（后续可扩展 tier 模式字段简化）
- localStorage 单机覆盖多端不同步（既有问题，本方案不引入新风险）

## 实施顺序

1. 在 `data-bridge.js` 加 `DEFAULT_DIAGNOSIS_RULES` + 三个函数 + 导出（约 100 行）
2. 在 `ability-diagnosis.html` 实现 `RuleInterpreter` 类与表达式解析器（约 250 行）
3. 改造 `ability-diagnosis.html` 的 `TAB_REPORTS`、三个 score 函数、四个 render 函数（删除函数体，改调 interp）
4. 验证前端测评不回归（用安徽拓威数据 + 专精特新 + 小巨人各跑一次）
5. 新建 `diagnosis-rules.html`（参照 `qualification-rules.html` 骨架，约 400 行）
6. 在 `index.html` 的 `diagGroup` 加菜单项
7. 浏览器端到端验证：改阈值→重测→看报告变化
