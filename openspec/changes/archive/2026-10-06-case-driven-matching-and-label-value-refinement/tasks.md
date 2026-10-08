# Tasks: 实际案例驱动的智能匹配引擎与标签/值判定深度优化

## 1. 底座词法解析层标签与值判别器重构 (Lexical Classifier Refinement)

- [x] 1.1 优化 `web/src/docx-engine.js` 中的 `cellRole` 算法：实现加粗文本字数安全阈值（<=10字符或带冒号才判为标签，>10字符且无冒号自动判定为值）、过滤纯标点符号伪标签（如 `。`）、保留非首列（`col > 0`）加粗文本为 `valueText`。
- [x] 1.2 执行单元检测：验证 `PU-1036`、`PA-3617` 中长加粗说明文（如“根据EC指令...”、“在着火或爆炸情况下...”）均被正确捕获至 `valueText`，消除被误切为空白的问题。

## 2. 章节局部匹配规则深化与语义路由增强 (Section-Specific Local Rules & Routing)

- [x] 2.1 增加 Section 9 专有树脂理化指标支持：在 `SECTION_SLOT_REGISTRY[9]` 中扩充 `最低成膜温度 / MFFT`、`玻璃化温度 / Tg`、`羟值` 别名与槽位，确保 PA/PU 样品专属指标 100% 捕获。
- [x] 2.2 增强 Section 5/8/13/15 散文孤行特征路由器：精准定向“不要吸进烟尘”（S5）、“无可用的接触限值信息”（S8）、“欧洲废弃物分类 EWC”（S13）及“GB 20576 / GB 30000”（S15）。
- [x] 2.3 实现 Section 11 结构化毒理学研究试验块聚合（OW-161）与节级说明句识别（OW-055）：解析“物种/分类/结果”三要素并聚类注入致敏等端点，保留宏观毒理说明。
- [x] 2.4 实现 Section 3/4 混排急救措施跨表流转调度器：检测 Section 3 表格尾部出现的急救措施行并自动分流至 Section 4 对应插槽。

## 3. 真实样本全量回归测试与系统打包构建 (Real-Sample Regression & Verification)

- [x] 3.1 扩充 `web/tests/diagnose_samples.mjs` 测试套件，纳入 PU-1007、PU-1036 CN/EN、PU-202A、PA-3617、PA-3615 等典型样本，验证 UNMATCHED 字段数量大幅下降、核心字段 100% 注入。
- [x] 3.2 执行 `npm run test:smoke` 与 `npm run build`，确保冒烟测试与生产打包全绿通过。
