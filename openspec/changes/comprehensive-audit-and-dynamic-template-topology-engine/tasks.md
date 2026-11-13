# Tasks: 全景多维深度审计与模板识别层动态解耦执行计划

- [x] 1. 编写全要素多维深度审计脚本并产出详细 Markdown 审计报告 (REQ-AUDIT-01)
  - [x] 1.1 编写 `web/scripts/run_exhaustive_msds_audit.mjs`，深入审查页眉页脚与 16 章节的 XML DOM 属性
  - [x] 1.2 涵盖文字内容、表格网格、文本格式、字号字阶、排版位置、悬挂缩进、激光制表位、历史剪枝与英文中文残留
  - [x] 1.3 运行审计脚本并在 `docs/audit/` 输出《HPU-7651_MSDS_全维度全景深度审计报告.md》
  - *验证命令*: `node web/scripts/run_exhaustive_msds_audit.mjs --targetDir="算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651"` (退出码 0)

- [x] 2. 研发通用模板拓扑识别层 (Template Recognition Layer) (REQ-TOPO-02)
  - [x] 2.1 编写 `web/src/template-topology-recognizer.js`，动态解析任意 DOCX 母版
  - [x] 2.2 自动萃取 16 章节表格索引、行列分布、列宽比例、边框样式及单元格语义角色 (Header/Label/Value/Explanation)
  - [x] 2.3 导出标准模板拓扑蓝图 (Template Topology Blueprint) 数据结构
  - *验证命令*: `node -e "import('./web/src/template-topology-recognizer.js').then(m => console.log(typeof m.recognizeTemplateTopology))"` (输出 function)

- [x] 3. 改造匹配引擎消费动态拓扑并验证母版更换自适应联动 (REQ-TOPO-03)
  - [x] 3.1 在 `web/src/smart-matching.js` 中新增 `matchContext1ToDynamicTemplateTopology` 函数
  - [x] 3.2 对接模板识别层产出的动态拓扑，替换静态写死的槽位映射逻辑
  - [x] 3.3 编写测试用例验证不同母版切换时，输出拓扑随新母版几何自动同步改变
  - *验证命令*: `node web/tests/test_dynamic_template_topology.mjs` (退出码 0)

- [x] 4. 1:1 双向物理核销与 OpenSpec 规范合流归档 (REQ-AUDIT-01 ~ REQ-TOPO-03)
  - [x] 4.1 汇总实测行数、报告生成指标与自适应验证凭据
  - [x] 4.2 运行 `openspec validate comprehensive-audit-and-dynamic-template-topology-engine` 确保零错误零警告
  - [x] 4.3 呈报终审交付报告并等待人工验收
