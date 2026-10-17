# Tasks: 基于算法训练材料的智能匹配算法优化落地清单

## Phase 1: 基础管道与象形图跨文档克隆修复 (Section 8, 12 & Pictograms)
- [ ] 1.1 在 `web/src/smart-matching.js` 中修复 Section 8 手套建议行提取器，确保 `污染的手套应废弃。` 精准注入 `建议：` 槽位
- [ ] 1.2 在 `web/src/smart-matching.js` / `web/src/render-utils.js` 中增加 Section 12 前缀清洗，剥除 `其他：\n` 等非标前缀
- [ ] 1.3 修复 `smart-matching.js` 中 `srcEngine` 指针获取 Bug，打通跨文档图片迁移底层通道
- [ ] 1.4 在 `docx-engine.js` / `smart-matching.js` 中补齐象形图克隆元数据同步（写入 `targetCell.images`），并在前端实现真实图片 `<img>` 标签原生渲染
- [ ] 1.5 运行 `npm run test:annotations --prefix web`，验证 20 项审阅批注回归测试完全通过（0 报错）

## Phase 2: Section 2 复合块深层多要素解耦与 6 行编排
- [ ] 2.1 在 `web/src/smart-matching.js` 中重构 `decoupleSection2CompoundBlocks`：
  - 提取 `物质或混合物分类` 通栏标题行
  - 提取 `2.1 GHS危险性类别`
  - 提取 `2.2 GHS标签要素`（象形图描述与 H 说明）
  - 提取 `2.3 防范说明`（包含预防措施与废弃处置）
  - 提取 `2.4 其他危害`
- [ ] 2.2 在 `applyMatchResultToEditor` 中优化 Section 2 危险品行布局逻辑，安全剪除多余空行并触发 `renumberRecord` 形成闭合的 2.1~2.4 编号
- [ ] 2.3 验证非危险品（PU-2341E、PU-2702）在 Section 2 上的向下兼容性，杜绝文字错填入象形图

## Phase 3: Section 11 “无可用的毒理学研究”极简自适应剪枝
- [ ] 3.1 在 `web/src/smart-matching.js` 中引入 `isSection11MinimalMode` 判定逻辑（检测有无细分 OECD 动物试验数据）
- [ ] 3.2 在 `applyMatchResultToEditor` 中实现 Section 11 极简剪枝：
  - 对无试验数据的型号，物理删除 15 行预设空白子表（Row 3~17）
  - 仅保留标题行与单行声明，整节收敛为严谨的 2 行
- [ ] 3.3 验证 EP-1702 与 EP-1704 在 Section 11 输出严格为 2 行，与手动调整真值完全对齐

## Phase 4: Section 11 丰富 OECD 试验数据槽位重构
- [ ] 4.1 在 `web/src/smart-matching.js` 中实现体外遗传毒性（Ames + 染色体畸变）智能合并，防止端点错位
- [ ] 4.2 优化体内基因毒性与 CMR 评估的槽位归宿，确保 PU-2702 各端点精确映射

## Phase 5: 中英文版全 16 个 Section 表格跨页断行自适应解禁
- [ ] 5.1 在 `web/src/docx-engine.js` 中实现 `ensureTableRowsCanSplit` 与 `enableCrossPageBreaksForAllSections`，全量移除表格 `<w:cantSplit/>` 限制
- [ ] 5.2 在文档加载（`loadDocx`）、数据注入（`applyMatchResultToEditor`）与导出前置管道（`exportArrayBuffer`）全链路挂接跨页断行解禁
- [ ] 5.3 自动化验证中英文全 16 章节导出文件的 XML 中 `<w:cantSplit>` 数量为 0，Word 中“允许跨页断行”100% 生效

## Phase 6: 英文版专项全流程支撑 (预设、页眉页脚与序号-标签对齐)
- [ ] 6.1 在 `web/src/docx-engine.js` 中新增针对 `EN 冠志` 与 `EN 国彩` 的内嵌预设支持，并联动模板切换自愈重置
- [ ] 6.2 强化英文版页眉页脚：强制默认英文标题 `SAFETY DATA SHEET`，匹配官方英文公司全称，中英文隔离回写
- [ ] 6.3 规范英文版序号-标签等宽垂直对齐空格基线（一位数 2 空格、两位数 1 空格，半角冒号 `:` 加单空格）
- [ ] 6.4 统一英文版字体样式：标签 12pt Times New Roman 加粗，数值 12pt Times New Roman 常规

## Phase 7: 微观排版细节逐项严苛核验 (Forensic Detail Audit)
- [ ] 7.1 检查全 16 章节标点符号：中文模板严格使用全角冒号 `：`、全角括号 `（）`、全角句号 `。`，彻底剥除半角混用
- [ ] 7.2 检查序号等宽空格基线：一位数编号（`2.1  `、`9.1  `）双半角空格，两位数编号（`9.10 `、`11.12 `）单半角空格，保证视觉绝对对齐
- [ ] 7.3 专业单位与特殊符号标准化：摄氏度 `℃`/`°C`、公差 `±`（禁止 `+/-`）、不等号 `≥`（清洗 `≧`）、粘度 `mPa·s`、密度 `g/cm³`
- [ ] 7.4 字体与样式防篡改检查：第一列标签 12pt 宋体加粗不可变性，第二列数值 12pt 宋体常规非加粗不可变性

## Phase 8: 全量扩充样本三方对照与基准回归门禁
- [ ] 8.1 运行 `node test_matching_gt.mjs`，断言 PU-2341E 116/116 项持续 100% 通过（Passed 116, Failed 0）
- [ ] 8.2 编写并执行全新自动化测试脚本 `web/tests/test_training_materials_parity.mjs`，断言全量样本（EP-1702、EP-1704、PU-2702、PU-303C）与手工真值全 16 章节 100% 吻合
- [ ] 8.3 按照 `<RULE[user_global]>` 使用 `vscode-review` 提交代码检阅并同步至本地工作台


