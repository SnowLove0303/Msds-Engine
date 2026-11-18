# Tasks: Agent MSDS-Studio 7 阶受控工作流全面优化重构实施计划

## 验收项总则 (Acceptance Criteria Governance)
- **时效硬指标**: 端到端全量 8 格式（4 DOCX + 4 PDF）生产、分发与审计总耗时严格 $\le 60$ 秒（基准实测 $\le 45$ 秒）；
- **质量硬指标**: 159 项集中式主审计与双极双层深度审计通过率严格为 100%（真实退出码 0，0 错误，0 警告）；
- **纯净性硬指标**: 彻底杜绝针对单一型号编写 ad-hoc 解包/改写/压包脚本，所有型号 100% 收敛至通用受控生产工作流；
- **分发硬指标**: 自动同步 8 份标准命名交付物至用户目录 `E:\冠志\TDS MSDS (2)\待处理文件\<modelCode>\`；
- **通用性硬指标**: 严格解耦黑盒正则与隐式匹配，格式服从原文，前置值格清零，内容 100% 来源于源文件。

---

- [x] 1. 阶段 1 & 2: 物理源文件锁定与 Context1 零损耗化学事实提取规范化 <!-- id: 1 -->
  - 锁定输入源文件路径校验逻辑，校验文件物理存在且字节数 $> 0$
  - 调用 `msds_recognize_source` (`recognition-engine.js`) 零损耗提取 16 章节纯文本与原始网格，形成客观未修饰数据对象 `Context1`
  - 验收命令: 验证 `recognizeSourceDocx` 返回有效 `Context1` 结构体

- [x] 2. 阶段 3: 独立事实标准化治理与高保真双语翻译引擎 (`web/src/context-governor.js` [NEW]) <!-- id: 2 -->
  - 新建 `web/src/context-governor.js`，纯数据流治理，完全解耦 Word DOM 与黑盒正则
  - 实现 GHS 非危品防外生虚增：非危险品强制 `isHazardous: false`，绝对严禁生成“象形图：无”或“信号词：无”
  - 实现 OECD/GHS 化学与毒理学专业语义英译字典与独立组分数组拆解（杜绝组分名粘连拼贴）
  - 实现度数符号与排版标点治理：缺失度数符号统一规范为标准西文 `°C`，清除段末悬挂冒号
  - 严格确保内容 100% 来源于源文件事实，生成中英双语独立完备的法定数据源 `Context2`
  - 验收命令: 对 `context-governor.js` 进行单元断言验证，确认非危防虚增、组分英译独立性与度数符号纠偏 100% PASS

- [x] 3. 阶段 4: 编辑器万能原语装配执行器 (`web/src/editor-writer.js` [NEW]) <!-- id: 3 -->
  - 新建 `web/src/editor-writer.js`，完全封装编辑器万能原语调用（`template-editor.js` & `universal-editor-primitives.js`）
  - 实现前置值格全面清零机制（`clearTemplateValues`），100% 抹除底模历史示范残留数据
  - 践行“格式服从于原文”公理：根据 `Context2` 动态重构表格网格（增行、删行、删列、通栏合并），剪枝无关空白假端点
  - 写入真实数据并自动投影全局排版拓扑（`applyGlobalTypographyProjection`，继承 Design Tokens、内外框线与 420/560 dxa 标尺）
  - 验收命令: 运行单测验证生成的干净模板无历史残留且符合内外边框与字阶标准

- [x] 4. 阶段 5: 严格法定生产工序与生产总调度器 (`web/src/production-orchestrator.js` & CLI) <!-- id: 4 -->
  - 重构 `web/src/production-orchestrator.js`，接入 `context-governor.js` 与 `editor-writer.js`
  - 严格编排线性工序：① 中文 Word (冠志+国彩) $\rightarrow$ ② 英文 Word (Guanzhi+Guocai) $\rightarrow$ ③ 原生转换 4 份高清 PDF
  - 升级 CLI 入口 `web/scripts/produce_standard_deliverables.mjs`，支持 `--model`, `--sourceDocx`, `--targetDir`, `--userSyncDir`
  - 验收命令: `node web/scripts/produce_standard_deliverables.mjs --help` (退出码 0)

- [x] 5. 阶段 6: 两阶双轨全景深度审计套件闭环 <!-- id: 5 -->
  - 第一阶机械确定性主审计：串联 159 项主审计（`run_master_msds_audit.mjs`）与双极双层审计（`audit_bipolar_bilayer.mjs`），以真实退出码 0 作为硬门禁
  - 第二阶 Agent 认知规范审计：输出 16 章节双语逐行保真对照表，核销 OECD 导则号与化学指标
  - 验收命令: 验证审计套件在合格交付物上真实退出码为 0，缺陷项为 0

- [x] 6. 阶段 7: 自动镜像交付至用户目录与 1:1 双向物理核销矩阵 <!-- id: 6 -->
  - 实现自动同步 8 份标准命名交付物至用户工作目录 `E:\冠志\TDS MSDS (2)\待处理文件\<modelCode>\`
  - 校验目标目录下 8 份文件物理存在、时间戳新鲜且大小合规
  - 自动输出标准 1:1 双向物理核销清算表与交付凭证
  - 验收命令: 检查目标用户目录文件状态与时间戳一致性

- [x] 7. 官方 MCP 服务端与网关契约对齐升级与全局技能规范固化 <!-- id: 7 -->
  - 更新 `web/src/mcp-server.js` 与 `web/scripts/msds_mcp_gateway.mjs` 中的 `msds_batch_export_eight` 和 `msds_audit_deliverables`
  - 更新全局技能文件 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，确立 v7.0-ENTERPRISE 7 阶 SOP 规范
  - 验收命令: `node web/scripts/msds_mcp_gateway.mjs --tool=tools/list` 确认工具契约完整

- [x] 8. 全系统受控通用回归测试与规范合流 <!-- id: 8 -->
  - 执行单元与集成测试，验证 Stage 1 至 Stage 7 管道完整连通性，全流程耗时 $\le 60$ 秒
  - 运行 `npx openspec validate streamline-agent-msds-studio-production-workflow` 严格校验
  - 运行 `npx openspec archive -y streamline-agent-msds-studio-production-workflow` 规范归档
