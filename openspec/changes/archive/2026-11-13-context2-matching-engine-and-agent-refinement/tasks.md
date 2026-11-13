# Tasks: Context 2 匹配引擎融合与 Agent 规范打磨执行计划

- [x] 1. 升级匹配引擎以融合 Pipeline 职能与模板拓扑映射 (REQ-C2-01, REQ-C2-02)
  - [x] 1.1 审查 `web/src/smart-matching.js`，吸收原 pipeline 的槽位匹配与结构映射职能
  - [x] 1.2 导出 `matchContext1ToTemplateTopology(facts, variant)` 纯净初筛函数
  - [x] 1.3 确保 16 章节槽位结构严格依循母版几何拓扑（单列通栏、双列键值、多列成分）
  - *验证命令*: `node -e "import('./web/src/smart-matching.js').then(m => console.log(typeof m.matchContext1ToTemplateTopology))"` (输出 function)

- [x] 2. 建立 Agent 全局与局部规范二次认知打磨规范与工具链 (REQ-C2-03)
  - [x] 2.1 封装规范治理器，集成非危品防虚增（G-01）、无水隔离、度数西文化（`°C`）
  - [x] 2.2 封装专业双语英译接入接口与 16 章节局部排版意图标记
  - [x] 2.3 产出包含完整中英文双轨、富文本标记与编辑器意图的 Context 2 标准数据模型
  - *验证命令*: `node -e "import('./web/src/context-governor.js').then(m => console.log('governor ready'))"` (退出码 0)

- [x] 3. 构建 Context 2 统一生成与准确性检验受控脚本 (REQ-C2-04)
  - [x] 3.1 编写 `web/scripts/produce_context2.mjs` 受控生产脚本（匹配引擎初筛 + 规范打磨）
  - [x] 3.2 编写 `web/scripts/audit_context2_accuracy.mjs` 独立准确性审查器
  - [x] 3.3 确保输出的标准 Markdown 与 JSON 文件能无缝驱动编辑器原语受控写入
  - *验证命令*: `node web/scripts/produce_context2.mjs --help` (退出码 0)

- [x] 4. 端到端实测验证与准确性门禁闭环 (REQ-C2-01 ~ REQ-C2-04)
  - [x] 4.1 在基准型号 `HPU-7651` 上运行 `produce_context2.mjs`，生成完整 Context 2
  - [x] 4.2 运行 `audit_context2_accuracy.mjs` 执行严格准确性审查并断言退出码 0
  - [x] 4.3 验证产出物对通用编辑器万能原语的直接驱动能力
  - *验证命令*: `node web/scripts/audit_context2_accuracy.mjs --target="output/HPU-7651/HPU-7651_context2_CN.json"` (退出码 0)

- [x] 5. 1:1 双向物理核销与 OpenSpec 规范合流归档 (REQ-C2-01 ~ REQ-C2-04)
  - [x] 5.1 汇总实测行数、双语对照度与准确性审查报告
  - [x] 5.2 运行 `openspec validate context2-matching-engine-and-agent-refinement` 确保零错误零警告
  - [x] 5.3 呈报终审交付报告并等待人工验收
