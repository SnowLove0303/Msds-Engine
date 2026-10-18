# Tasks

## 1. Section 2 细分多槽位行投影与防范说明结构化 (P0)

- [x] 1.1 在 `web/src/smart-matching.js` 中重构 Section 2 事实提取与槽位解耦，精细化分类、标签要素、象形图、信号词、危险性说明、防范说明（多行P代码）、理化危险、健康危害子项、环境危害与其他危害。
- [x] 1.2 在 `applyMatchResultToEditor` 中实现 Section 2 细分槽位精确行投影与独立行写入，倒序物理删除未填充的模板端点行并连续重新排号，达成 12~15 行标准答案结构。

## 2. Section 11 与 Section 12 端点清册与干净收敛 (P0)

- [x] 2.1 建立端点存在性判定（Endpoint Presence Manifest）：当源文档仅声明产品级无可用研究时，物理删除 11.1~11.10、12.1~12.3 模板端点与“无数据资料”占位行。
- [x] 2.2 确保 Section 11 和 12 严格收敛为 2 行（标题行 + 产品级独立说明行），彻底清除“二乙二醇单丁醚”等示例幽灵文本。

## 3. Section 15 法规顺序固定与动态克隆扩容 (P0)

- [x] 3.1 严格按标准答案法定顺序排列 5 项法规及说明行（物质法律法规 -> 其它的规定 -> 符合下列法规要求 -> 危险化学品安全管理条例 -> GB/T 16483 -> GB 13690 -> GB 30000.2-29 -> GB 15258）。
- [x] 3.2 实现自适应行扩容逻辑：若模板可用数据行不足 5 行，自动调用 `addRowAfter` 克隆模板行，保证 GB 15258 完整呈现，绝不静默丢失。

## 4. Section 4 与 Section 5 模板 Profile 绑定与语义换行 (P0/P1)

- [x] 4.1 建立 CN 模板显式行绑定 Profile，确保 Section 4 4.1~4.5 急救措施 100% 替换模板示例值，消除别名歧义导致的漏写。
- [x] 4.2 建立 Section 5 语义分行规则，保留 5.3 特殊危害与 5.4 预防措施中独立陈述句的 `\n` 换行。

## 5. Section 1 与 Section 3 源文案保真与身份格式化 (P1)

- [x] 5.1 Section 1 中文名称强制规范为“源中文产品名 + 半角空格 + 型号名”，杜绝型号紧贴或空格丢失。
- [x] 5.2 Section 3 组分名称保真，避免通用泛化（PU-1002 准确保持“水性聚氨酯树脂分散体”）。

## 6. 导出重载闭环审计与 PU 系列标准答案 Parity 自动化回归套件 (P0/P2)

- [x] 6.1 编写 `web/tests/test_pu_series_standard_parity.mjs` 测试套件，深度对标 PU-1001 至 PU-1004 四大标准答案，涵盖 Section 2 行数、Section 11/12 2行收敛、Section 15 5法规包含 GB 15258、Section 4/5 示例清零与换行、Section 1/3 命名保真度，以及真实的导出重载验证。
- [x] 6.2 运行系统全量回归套件（包括 `test_label_continuation_and_workspace_width.mjs`、`test_ui_alignment_and_table_headers.mjs`、`test_full_problem_inventory.mjs`、`smoke.mjs`、`npm run build`），确保 100% 通过。
