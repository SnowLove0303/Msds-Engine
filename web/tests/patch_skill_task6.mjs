import fs from 'fs';

const skillPath = 'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md';
let content = fs.readFileSync(skillPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update frontmatter description
const oldDesc = `description: "MSDS Studio 工业级受控工作流体系与 Agent 生产治理规范 (v8.0-ENTERPRISE)：收敛 10 大标准原子 MCP 工具、端到端 12 阶标准作业规程 SOP（哪一步/做什么/汇报什么）、两大人机交互确认门禁（意图模板确认门禁1/方案英译双清单门禁2）、模板拓扑样式原生继承与前置值格清零、编辑器底层排版几何硬锁（Design Tokens字阶/单个Tab无空格/Tier A 420与Tier B 560自适应标尺/未编号标签同基线齐平/多列值顶格左对齐）、双主体预设派生（冠志/国彩）、8 格式标准交付矩阵（4 DOCX + 4 PDF）及两阶双轨全要素深度审计对账体系。"`;

const newDesc = `description: "MSDS Studio 工业级受控工作流体系与 Agent 生产治理规范 (v9.0-ENTERPRISE)：三层正交解耦（模板=排版拓扑/源文件=化学事实/预设=主体元数据）、收敛 10 大标准原子 MCP 工具、端到端 12 阶标准作业规程 SOP（哪一步/做什么/汇报什么）、两大人机交互确认门禁（意图模板预设对齐门禁1/方案英译双清单门禁2）、模板拓扑样式原生继承与前置值格清零、编辑器底层排版几何硬锁（Design Tokens字阶/单个Tab无空格/Tier A 420与Tier B 560自适应标尺/未编号标签同基线齐平/多列值顶格左对齐）、动态企业预设治理（支持任意主体增删与默认切换）、自适应笛卡尔积交付矩阵（N_presets × N_languages × N_formats，按需产出不锁死8格式）及两阶双轨全要素深度审计对账体系。"`;

content = content.replace(oldDesc, newDesc);

// 2. Update Core Mission & Architecture in Section 1
const oldMission = `> **版本**：v8.0-ENTERPRISE (全生命周期 12 阶标准工作流闭环版)  
> **制定时间**：2026-11-13  
> **适用范围**：MSDS-Engine 文档处理工作台、\`msds-studio\` 技能生态、Antigravity 跨线程协作、MSDS 生产与审计智能体。  
> **核心使命**：为智能体赋予精确的感官（识别/下钻/透视/对账）与稳健的手脚（编辑器万能原语：清空值格/单节恢复/企业预设/增删行/删列/横向合并/富文本化学式/激光对齐），遵循“格式服从于原文”公理、“模板即拓扑边框样式基座”、“前置值格全量清零”机制，确立“哪一步、做什么、汇报什么”端到端 12 阶 SOP，依托底层排版几何硬锁（单Tab、自适应标尺、未编号标签齐平、多列顶格）与两阶双轨全要素深度审计，彻底终结历史型号特判与脆弱黑盒过拟合，打造 100% 工业级通用文档工作台。`;

const newMission = `> **版本**：v9.0-ENTERPRISE (三层正交解耦与自适应多格式交付闭环版)  
> **制定时间**：2026-11-16  
> **适用范围**：MSDS-Engine 文档处理工作台、\`msds-studio\` 技能生态、Antigravity 跨线程协作、MSDS 生产与审计智能体。  
> **核心使命**：为智能体确立**三层正交解耦最高公理**（模板 = 排版格式与拓扑骨架；源文件 = 唯一化学技术事实；预设 = 企业个体元数据），彻底剥离底层代码与拓扑结构中任何写死特定企业（如冠志/国彩）或硬编码 8 格式的僵化逻辑。赋予智能体精确感官（自省探测模板拓扑与企业预设）与稳健手脚（编辑器万能原语：清空值格/单节恢复/动态预设绑定/增删行/删列/横向合并/富文本化学式/激光对齐），遵循“格式服从于原文”公理、“模板即拓扑边框样式基座”、“前置值格全量清零”机制，确立“哪一步、做什么、汇报什么”端到端 12 阶 SOP，支持按需动态产出笛卡尔积自适应交付矩阵（$N_{\\text{presets}} \\times N_{\\text{languages}} \\times N_{\\text{formats}}$），依托底层排版几何硬锁与两阶双轨全要素深度审计，打造 100% 工业级通用文档工作台。`;

content = content.replace(oldMission, newMission);

// 3. Update Mermaid Flowchart and SOP Table
const oldFlowchart = `    P0["Phase 0: 模板自省感知与意图对齐"] --> Gate1["🚨【法定门禁 1: 交付矩阵与模板选用门禁】\\n做什么: 呈报模板清单、型号、双主体(冠志/国彩)、8格式清单\\n汇报什么: 停机等待用户确认生产意图与底模选用"]:::gateStyle

    Gate1 -->|确认意图| P1["Phase 1: 源文件事实提取 (Context 1) 与 16 章节定性"]
    P1 --> P2["Phase 2: Context 2 中英双轨治理与专业语义英译"]
    P2 --> P3["Phase 3: 16 章节手术编排与双清单规格立法"]

    P3 --> Gate2["🚨【法定门禁 2: 方案、英译与双清单规格门禁】\\n做什么: 呈报形态定性、专业英译预览、双清单(拟变/保现)\\n汇报什么: 停机等待用户回复'执行'或'同意'"]:::gateStyle

    Gate2 -->|用户授权| P4["Phase 4: 模板加载与前置值格 100% 清零 (模板仅作拓扑)"]
    P4 --> P5["Phase 5: 编辑器万能原语写入与几何微观渲染 (化学式富文本)"]
    P5 --> P6["Phase 6: 全局排版拓扑投影与几何硬锁 (Tokens/单Tab/标尺/顶格)"]
    P6 --> P7["Phase 7: 广州冠志与英德国彩双主体预设派生 (隔离防串号)"]
    P7 --> P8["Phase 8: 批量持久化导出 4 份标准中英双语 DOCX"]
    P8 --> P9["Phase 9: 无头高保真原生矢量 PDF 批量转换 (4 PDF)"]
    P9 --> P10["Phase 10: 两阶双轨全要素深度审计与事实物理核销 (退出码 0)"]

    P10 --> P11["Phase 11: 8 格式全量交付与人机触觉检阅归档 (VS Code Diff)"]:::reportStyle`;

const newFlowchart = `    P0["Phase 0: 模板自省感知、预设探测与意图对齐"] --> Gate1["🚨【法定门禁 1: 交付矩阵、模板选用与预设确认门禁】\\n做什么: 探测模板拓扑、查询企业预设、推断匹配意图、列出自适应交付矩阵\\n汇报什么: 停机等待用户确认生产意图、选用底模与企业预设/格式"]:::gateStyle

    Gate1 -->|确认意图| P1["Phase 1: 源文件事实提取 (Context 1) 与 16 章节定性"]
    P1 --> P2["Phase 2: Context 2 中英双轨治理与专业语义英译"]
    P2 --> P3["Phase 3: 16 章节手术编排与双清单规格立法"]

    P3 --> Gate2["🚨【法定门禁 2: 方案、英译与双清单规格门禁】\\n做什么: 呈报形态定性、专业英译预览、双清单(拟变/保现)\\n汇报什么: 停机等待用户回复'执行'或'同意'"]:::gateStyle

    Gate2 -->|用户授权| P4["Phase 4: 模板加载与前置值格 100% 清零 (模板仅作拓扑骨架)"]
    P4 --> P5["Phase 5: 编辑器万能原语写入与几何微观渲染 (化学式富文本)"]
    P5 --> P6["Phase 6: 全局排版拓扑投影与几何硬锁 (Tokens/单Tab/标尺/顶格)"]
    P6 --> P7["Phase 7: 动态企业主体预设装配与信息绑定 (bindEntityPresetToDocument)"]
    P7 --> P8["Phase 8: 自适应持久化导出所选 Word 文档 (N_presets × N_languages)"]
    P8 --> P9["Phase 9: 无头高保真原生矢量 PDF 自适应转换 (根据勾选格式)"]
    P9 --> P10["Phase 10: 动态两阶双轨全要素深度审计与物理核销 (退出码 0)"]

    P10 --> P11["Phase 11: 自适应多格式交付与人机触觉检阅归档 (VS Code Diff)"]:::reportStyle`;

content = content.replace(oldFlowchart, newFlowchart);

// 4. Update SOP Table (Phase 0, Gate 1, Phase 7-11)
const oldPhase0 = `| **Phase 0<br/>模板自省感知与意图对齐** | 1. 扫描 \`web/public/templates/\` 目录；<br/>2. 自动识别官方标准模板（冠志中/英、国彩中/英）及自定义模板；<br/>3. 解析输入源文件路径与目标产品型号。 | **【法定门禁 1 呈报】**：<br/>• 探测到的可用模板元数据列表（文件名、语言、主体）；<br/>• 检测到的目标产品型号；<br/>• 拟交付范围（标准 8 格式全矩阵或特定单品）；<br/>• 提请用户确认选用底模与交付矩阵。 | 🛑 **【门禁 1 停机点】**：<br/>未获得用户明确确认回复前，严禁开启解析与写入！ |`;

const newPhase0 = `| **Phase 0<br/>模板自省、预设感知与意图对齐** | 1. 扫描可用模板列表（支持 \`/api/msds/templates\` 及 16 章节拓扑自省）；<br/>2. 查询企业预设库（\`/api/msds/presets\`，探测冠志、国彩及自定义企业主体，标定默认主体）；<br/>3. 解析输入源文件路径与目标产品型号；<br/>4. 依据三层正交解耦公理（模板=排版拓扑，源文件=化学事实，预设=主体元数据），根据用户任务指令智能推断最匹配的模板、主体预设与输出格式（Word/PDF/中/英）。 | **【法定门禁 1 呈报】**：<br/>• 探测到的可用模板及其 16 章节拓扑概况；<br/>• 当前可用企业预设清单与系统默认主体；<br/>• 检测到的目标产品型号与源文件化学事实概况；<br/>• **自适应交付矩阵建议**（如：仅单主体英文 Word、单主体中英双语双格式 4 份、或完整矩阵）；<br/>• **提请用户确认/选择**：选用何种模板、何种企业预设、何种语言及何种文件格式（可直接使用推荐默认）。 | 🛑 **【门禁 1 停机点】**：<br/>绝对禁止 Agent 主观硬编码固定 8 格式或死锁冠志/国彩！必须停机等待用户明确确认意图！ |`;

content = content.replace(oldPhase0, newPhase0);

const oldPhase7to11 = `| **Phase 7<br/>双主体预设派生与信息绑定** | 1. 应用企业预设：广州冠志新材料 / 英德国彩精细化工；<br/>2. 注入法定企业名称、信用代码、注册地址、应急联系电话与传真；<br/>3. 在 \`docx-engine.js:updateHeaderFooterData\` 中以保真方式更新页眉型号、页脚公司与修订日期。 | **实时播报**：<br/>\`🏢 [实体派生] 广州冠志与英德国彩双主体预设已分别注入，公司信息完全隔离防串号。\` | 冠志与国彩的信用代码、地址、电话物理隔离，严禁交叉串号污染。 |
| **Phase 8<br/>批量持久化导出 4 份 DOCX** | 1. 持久化保存编辑器工作会话；<br/>2. 导出 4 份正式标准 Word 文档：<br/>• \`<Model> msds_CN 冠志.docx\`<br/>• \`<Model> msds_CN 国彩.docx\`<br/>• \`<Model> msds_EN Guanzhi.docx\`<br/>• \`<Model> msds_EN Guocai.docx\` | **实时播报**：<br/>\`📄 [DOCX 导出] 4 份标准中英双语双主体 DOCX 正式文件已成功落盘。\`<br/>**阶段汇报**：<br/>呈报 4 份 DOCX 文件大小、路径与落盘时间戳。 | 4 份 DOCX 全部写入成功，底层 XML 格式校验无损。 |
| **Phase 9<br/>无头高保真原生 PDF 批量转换** | 1. 调用本地无头 PDF 转换通道（支持 WPS COM 与 LibreOffice 守护降级）；<br/>2. 转换为 4 份原生高清矢量 PDF：<br/>• \`<Model> msds_CN 冠志.pdf\`<br/>• \`<Model> msds_CN 国彩.pdf\`<br/>• \`<Model> msds_EN Guanzhi.pdf\`<br/>• \`<Model> msds_EN Guocai.pdf\`<br/>3. 执行版面预检（导言 9.5pt、理化垂线对齐、字体嵌入）。 | **实时播报**：<br/>\`🖨️ [PDF 转换] 4 份原生高清 PDF 全部转换完成，版面预检合格。\`<br/>**阶段汇报**：<br/>呈报 4 份 PDF 大小与版面预检通过状态。 | 4 份 PDF 转换退出码 0，无字体缺失乱码，无豆腐块。 |
| **Phase 10<br/>两阶双轨全要素深度审计与对账** | **阶 1（机器确定性硬指标）**：<br/>运行 \`test_editor_indent_and_alignment_invariants.mjs\`（spacing、label-alignment、value-alignment 全部通过）；<br/>**阶 2（智能体语义与全景证据链）**：<br/>运行 \`run_exhaustive_msds_audit.mjs\`，执行 159 项全要素深度审计探针，核对 8 格式数量、时间戳、中文残留归零、空值格。 | **阶段汇报**：<br/>呈报《全要素多维深度审计探针报告》：<br/>• 自动化测试套件通过数与退出码；<br/>• 英文版中文残留数统计（恒为 0）；<br/>• 源文件 vs 交付物 1:1 事实物理对账清算表。 | 机械审计退出码恒为 0；<br/>英文版中文残留数 $= 0$；<br/>未覆盖端点数 $= 0$。 |
| **Phase 11<br/>最终交付与人机触觉检阅归档** | 1. 汇总结算 8 格式全量交付清单；<br/>2. 挂载 VS Code 原生检阅通道（\`vscode-review\`）；<br/>3. 记录遇到问题与解法，同步沉淀至 \`CHANGELOG.md\`；<br/>4. 执行 git commit 原子归档。 | **【最终交付报告】**：<br/>• 8 格式全部产出物文件绝对路径与大小卡片；<br/>• 1:1 需求物理对账清算表；<br/>• 遇到的核心技术难点与解法沉淀；<br/>• 提示用户在 VS Code 中完成最终检阅。 | 8 格式文件全部完好可读，用户拥有终审掌控权。 |`;

const newPhase7to11 = `| **Phase 7<br/>动态企业预设装配与信息绑定** | 1. 应用用户或 Gate 1 所选企业预设（通过 \`universal-editor-primitives.js:bindEntityPresetToDocument\`）；<br/>2. 动态注入法定企业全称、简称、社会信用代码、注册地址、应急/技术咨询电话与传真；<br/>3. 更新页眉型号、页脚公司名称与修订日期，彻底剥离代码中写死主体。 | **实时播报**：<br/>\`🏢 [实体绑定] 所选企业预设已成功装配至文档，主体信息物理隔离防混淆。\` | 企业元数据准确对应预设定义，信用代码、地址、电话无跨主体串号。 |
| **Phase 8<br/>自适应多格式 Word 文档导出** | 1. 依据 Gate 1 确认的 Presets × Languages 维度；<br/>2. 调用 \`pipeline-engine.js:executeAdaptiveDeliverablesPipeline\` 导出对应 Word 文档；<br/>• 若选单主体单语言：精准输出 1 份 DOCX；<br/>• 若选中英双语双主体：输出 4 份 DOCX。 | **实时播报**：<br/>\`📄 [DOCX 导出] 自适应 Word 正式文档已成功落盘 (共 \${N} 份)。\`<br/>**阶段汇报**：<br/>呈报各 DOCX 文件大小、路径与落盘时间戳。 | 所选 DOCX 全部写入成功，底层 XML 格式校验无损。 |
| **Phase 9<br/>无头高保真原生 PDF 自适应转换** | 1. 若用户选择交付 PDF，调用本地无头转换通道（支持 WPS COM 与 LibreOffice 守护降级）；<br/>2. 转换为对应数量的原生高清矢量 PDF；<br/>3. 执行版面预检（导言 9.5pt、理化垂线对齐、字体嵌入）。 | **实时播报**：<br/>\`🖨️ [PDF 转换] 原生高清 PDF 全部转换完成，版面预检合格 (共 \${M} 份)。\`<br/>**阶段汇报**：<br/>呈报所生成 PDF 大小与版面预检通过状态。 | 所选 PDF 转换退出码 0，无字体缺失乱码，无豆腐块。 |
| **Phase 10<br/>两阶双轨全要素深度审计与对账** | **阶 1（机器确定性硬指标）**：<br/>运行 \`test_editor_indent_and_alignment_invariants.mjs\`（spacing、label-alignment、value-alignment 全部通过）；<br/>**阶 2（智能体语义与动态矩阵对账）**：<br/>运行 \`audit_bipolar_bilayer.mjs\`（传入 \`expectedDeliverables\` 动态矩阵），执行全要素深度审计探针，核对实际交付物数量、时间戳、英文版中文残留数（恒为 0）、空值格。 | **阶段汇报**：<br/>呈报《全要素多维深度审计探针报告》：<br/>• 自动化测试套件通过数与退出码；<br/>• 英文版中文残留数统计（恒为 0）；<br/>• 交付物清算表（动态 $N$ 份）1:1 事实物理对账。 | 机械审计退出码恒为 0；<br/>英文版中文残留数 $= 0$；<br/>交付物数量与选定矩阵 100% 守恒。 |
| **Phase 11<br/>最终交付与人机触觉检阅归档** | 1. 汇总结算自适应多格式全量交付清单（$N_{\\text{presets}} \\times N_{\\text{languages}} \\times N_{\\text{formats}}$）；<br/>2. 挂载 VS Code 原生检阅通道（\`vscode-review\`）；<br/>3. 记录遇到问题与解法，同步沉淀至 \`CHANGELOG.md\`；<br/>4. 执行 git commit 原子归档。 | **【最终交付报告】**：<br/>• 自适应全部产出物文件绝对路径与大小卡片；<br/>• 1:1 需求物理对账清算表；<br/>• 遇到的核心技术难点与解法沉淀；<br/>• 提示用户在 VS Code 中完成最终检阅。 | 交付文件全部完好可读，用户拥有终审掌控权。 |`;

content = content.replace(oldPhase7to11, newPhase7to11);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_skill.md', content, 'utf8');
console.log('proposed_skill.md generated successfully!');
