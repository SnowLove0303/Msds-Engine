# Tasks

## 1. 规格立项与代码审查

- [x] 1.1 在 OpenSpec 中确立 4 项法定不变量规格并执行 `openspec validate pu-four-invariants-and-fidelity-repair --strict` 验证合规。
- [x] 1.2 修复 `web/src/smart-matching.js`：落实 Section 9.22 悬挂缩进与双 Run 拆分、Section 11 结构收敛与 11.9 空格、Section 12 说明行保护。
- [x] 1.3 修复 `web/src/pipeline-engine.js`：清除 Section 12 英文底模盲目 `deleteRow` 误删说明行逻辑。
- [x] 1.4 修复 `web/src/docx-engine.js` 与 `web/src/msds-api-controller.js`：彻底清零 `2026/10/10` 假数据，实现跨 XML 节点真实日期提取。
- [x] 1.5 所有代码变更逐个通过 `review_diff_in_vscode` 提交用户检阅并合入。

## 2. API 真实重跑与生成交付

- [x] 2.1 重启 MSDS Studio Agent API 服务，确保最新代码在内存中生效。
- [x] 2.2 调用 `POST /api/msds/pipeline/generate-eight`，以 [`PU-202A msds_CN 国彩_源文件留存.docx`](file:///D:/%E5%86%A0%E5%BF%97/TDS%20MSDS/1-1%20%E5%8D%95%E7%BB%84%E4%BB%BD%E6%B0%B4%E6%80%A7%E8%81%9A%E6%B0%A8%E9%85%AF%E6%A0%91%E8%84%82%20PU/PU-202A/PU-202A%20msds_CN%20%E5%9B%BD%E5%BD%A9_%E6%BA%90%E6%96%87%E4%BB%B6%E7%95%99%E5%AD%98.docx) 为源基准生成全新八格式。
- [x] 2.3 验证输出文件目录 [`D:\冠志\TDS MSDS\1-1 单组份水性聚氨酯树脂 PU\PU-202A\`](file:///D:/%E5%86%A0%E5%BF%97/TDS%20MSDS/1-1%20%E5%8D%95%E7%BB%84%E4%BB%BD%E6%B0%B4%E6%80%A7%E8%81%9A%E6%B0%A8%E9%85%AF%E6%A0%91%E8%84%82%20PU/PU-202A/) 中全部 8 个成果文件的存在性与完整性。

## 3. 逐项指标对账与验收

- [x] 3.1 针对 9.22 固体含量，解析 Word XML 检验悬挂缩进 `457`、制表位 `459`、Times New Roman 序号与黑体标签的真实匹配度。
- [x] 3.2 针对 11.7 与 11.9，检验双列结构与 `11.9  附加信息：` 的 2 空格全局对齐度。
- [x] 3.3 针对 Section 12，检验 Row 1 说明行在中文和英文底模中是否 100% 完整保留。
- [x] 3.4 针对页尾时间，检验所有 4 份 Word 与 4 份 PDF 的页脚中是否真实呈现自适应日期 `2025/12/03`（绝无 `2026/10/10`）。
- [x] 3.5 提请用户人工验收并沉淀 `CHANGELOG.md`。
