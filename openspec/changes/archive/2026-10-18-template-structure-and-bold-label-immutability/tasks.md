# 任务清单：模板结构与加粗标签不可变性防护及六类问题系统性修复 (Implementation Tasks)

- [x] 1. 规约与测试先行：创建加粗结构不可变性与写入范围约束回归测试用例
  - [x] 1.1 编写 `web/tests/test_bold_label_immutability.mjs` 测试套件
  - [x] 1.2 覆盖 Section 3 表头防篡改测试（断言 Row 1 Col 1 必须保持为 `CAS编号`，`components_summary` 不得侵入）
  - [x] 1.3 覆盖 Section 8 标签列防污染测试（断言 `手部防护：` 保持加粗标签且内容不变，值写入对应右侧值格）
  - [x] 1.4 覆盖加粗文本节点只读锁定测试（断言混合格写入时加粗 run 100% 留存，仅非加粗 run 被替换）
  - [x] 1.5 覆盖标签修改白名单约束测试（断言非 Section 9 章节调用 `writeCellLabel` 必须抛出受控拒绝异常）
  - [x] 1.6 覆盖 PU-2341E 真实样本全项核查测试（涵盖 6 大类问题所有具体断言）

- [x] 2. 底层引擎强化：修复单元格角色分类与安全写入机制 (`web/src/docx-engine.js`)
  - [x] 2.1 修复 `cellRole(cell)`：严禁将 `col > 0` 的加粗表头文本（如 `CAS编号`）降级为 `valueNodes`
  - [x] 2.2 强化表头单元格识别与锁定：表头行所有单元格的 `editable` 设为 `false`，锁定结构
  - [x] 2.3 重构 `writeCellValue(cell, value)` 与 `replaceCellValueContent`：杜绝覆盖加粗 run，若无非加粗 run 则安全追加，坚决保护加粗标签
  - [x] 2.4 加固 `writeCellLabel`：引入章节白名单判断，严禁在非 Section 9 章节中修改标签

- [x] 3. 匹配注入重构与六类问题系统性修复 (`web/src/smart-matching.js`)
  - [x] 3.1 【问题一/六】Section 3 专项重构：跳过表头行注入，彻底拦截 `components_summary` 写入表格单元格，仅对数据行填入三列数据
  - [x] 3.2 【问题一/六】Section 8 专项重构：多列合并行严格寻址右侧值单元格，移除 `cells[0]` 兜底逻辑，隔离标签列与值列
  - [x] 3.3 【问题一/六】Section 11 专项保护：保护 11.7（生育力/致畸形/体外遗传毒性）与 11.1 加粗子标签，杜绝大段文本覆盖破坏子结构
  - [x] 3.4 【问题二/四】Section 5 灭火剂防颠倒：5.1 适用灭火剂与 5.2 不适用灭火剂严格对号入座，杜绝覆盖与颠倒丢失
  - [x] 3.5 【问题二】Section 8 建议行、Section 9 相对密度、Section 13 废弃说明与 Section 15 法规条文源值完整注入，杜绝丢失
  - [x] 3.6 【问题三】保留逻辑换行：忠实保留 Section 5.4、6.1、7.1、13 多段换行，消除 Section 5.3 异常双换行空白段
  - [x] 3.7 【问题四】杜绝未经允许的原文改写：Section 9 pH 仅在源文有时加限定词，保留“无数据”严禁改“不适用”，免责声明不得错赋给燃烧值
  - [x] 3.8 【问题五】无值项物理删行与重排：Section 8.2 工程控制、Section 10.4 应避免条件、Section 10.5 禁配物若无源值则执行删行，并重新连贯排号
  - [x] 3.9 增加加粗不变量审计守卫：注入完成后校验非 Section 9 章节的所有加粗标签完整性，若受损立即拦截

- [x] 4. 全量验证与端到端测试验收
  - [x] 4.1 运行 `web/tests/test_bold_label_immutability.mjs`，确保加粗防护与写入范围约束 100% 通过
  - [x] 4.2 运行 `web/tests/test_section2_pruning_and_layout.mjs`，确保 Section 2 删行与排版无回归
  - [x] 4.3 运行 `web/tests/test_template_residual_clearing.mjs`，确保全域清零与旧模板无幽灵残留
  - [x] 4.4 运行 `npm run test:smoke` 冒烟测试全套通过
