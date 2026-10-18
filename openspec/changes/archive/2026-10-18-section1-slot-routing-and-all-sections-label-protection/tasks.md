# Tasks

## 1. Section 1 专属插槽分流与题头保护

- [x] 1.1 在 `web/src/smart-matching.js` 中重构 Section 1 模板行遍历与插槽匹配逻辑：检测到模板包含 `中文名称` 行时，禁止向 `1.1  产品名称：` 写入值，并使 `product_name` 准确注入到 `中文名称：` 行；验证 PU-2341E 注入后 `中文名称` 填入 `聚氨酯分散体 PU-2341E` 且 `1.1 产品名称` 值格为空。
- [x] 1.2 兼容英文模板：当模板不存在 `中文名称` 行（如 `正式模板_MSDS_EN_冠志(1).docx`）时，保留向 `1.1  Product name：` 正常写入产品名称的能力；验证英文模板注入正常。

## 2. 全 16 章节标签/加粗项与值格严格隔离防护

- [x] 2.1 修复 Section 2 健康危害注入中的 `valCell` 回退漏洞（移除 `|| cell0` 兜底），确保所有章节中 `valCell` 绝不回退至 `kind === 'label-only'` 或具有 `labelText` 的标签单元格；验证无标签被覆盖。
- [x] 2.2 建立全 16 章节大类题头免写守卫（`1.1 产品名称`、`1.3 供应商信息`、`8.1 暴露控制`、`工作场所组分控制参数`、`物质或混合物的相关安全、健康和环保法律法规`、`其它的规定`、`符合下列法规要求` 等），确保大类题头值格物理留空，值严格归位至子项目值格；验证全 16 章节题头无污染。

## 3. 全套回归测试与质量验证

- [x] 3.1 编写 `web/tests/test_section1_and_label_value_separation.mjs` 测试套件，深度覆盖全 16 个 Section 的题头保护、加粗标签不可变性、`中文名称` 与 `1.1 产品名称` 隔离断言；运行并通过测试。
- [x] 3.2 运行全量回归套件（`test_all_views_chinese_first_char_alignment.mjs`、`test_ui_alignment_and_table_headers.mjs`、`test_full_problem_inventory.mjs`、`smoke.mjs`、`npm run build`），确保无任何功能与视图回归。
