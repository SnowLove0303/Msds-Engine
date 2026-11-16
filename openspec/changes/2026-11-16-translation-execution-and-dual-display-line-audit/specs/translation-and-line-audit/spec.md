# Spec: 翻译底层执行写入与机械审计逐行双重对照显示契约

## 1. 底层翻译执行写入与语义映射行为契约 (REQ-01)
- **1.1 条件无损转译契约**:
  - WHEN 源文件 Section 9 包含带有测试条件或稀释条件的 pH 描述（如 `按 1:10 的比例用水稀释`、`1%水溶液`）时，系统 SHALL 生成完整的英文条件（如 `diluted with water at a ratio of 1:10` 或 `1% aqueous solution`），不得使用正则强行丢弃括号内描述。
  - WHEN 标签为 `相对密度` 且包含单位 `g/cm³` 时，系统 SHALL 输出规范的英文对应项（`Density:` 或 `Relative density (Density):`），保持数值与单位匹配。
- **1.2 标准化学命名与法规编号契约**:
  - 系统 SHALL 将 `N,N-二甲基乙醇胺` 标准化翻译为 `N,N-Dimethylethanolamine`（CAS 108-01-0），废除非标准的 `2-Dimethylaminoethanol`。
  - 系统 SHALL 将 EC 指令编号统一为国际通用的 `2006/121/EC`，不得出现语言混杂后缀。
- **1.3 确定性与语气守恒契约**:
  - 系统 SHALL NOT 自行将源文件的确定性陈述（如“燃烧时释放少量的氰化氢”）改写为带 `may` 的推测句或收窄为 `trace amounts`，应忠实采用 `Combustion releases ... small amounts of hydrogen cyanide.`。

## 2. 机械审计逐行双重对照显示契约 (REQ-02)
- **2.1 逐行双重视图渲染契约**:
  - 机械审计套件 SHALL 对 Section 2 至 Section 16 逐节遍历，对每个结构化行输出双重显示块：
    ```text
    [SEC XX.YY] <指标/条款名称>
      ├─ [CN Source]     : <中文源句/母版句>
      └─ [EN Deliverable]: <英文交付物翻译句>
      ↳ Status: [MATCH] | [CONDITION_MISSING_ALARM] | [WARNING]
    ```
- **2.2 关键条件缺失告警契约**:
  - WHEN 中文源句包含稀释关键词（`稀释`、`1:10`）而英文对应句缺少 `dilut` 或 `1:10` 时，系统 SHALL 输出 `[CONDITION_MISSING_ALARM]` 并累计失败计数。
  - WHEN 发现中文字符残留于英文交付物时，系统 SHALL 立即触发致命错误中断。

## 3. 智能体逐行逐句法医级审计任务硬约束 (REQ-03)
- **3.1 五大基准逐项核销契约**:
  - 审计智能体 SHALL 严格依据《中英文逐项核对报告》五大判定基准（`准确`、`基本准确`、`建议修改`、`漏译`、`需核实`）对全量条目逐行给出明确结论。
  - 审计智能体 SHALL 绝不使用“大致相符”、“总体良好”等概括性放行词汇，未出具点对点物理证据时严禁解锁审计任务。

## 4. 双向防回退自动化测试套件契约 (REQ-04)
- **4.1 单元测试退出码 0 充要契约**:
  - `web/tests/test_translation_and_dual_display_invariants.mjs` 中的所有测试用例必须真实通过，退出码为 0。
- **4.2 变异反欺诈契约**:
  - 注入故意截断稀释条件的变异样本时，机械审计套件必须精准报红并返回非零退出码。
