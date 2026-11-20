# Proposal: Context 2 全量逐句英译强制门禁与全章节标准化表格结构调整

## 背景与问题
1. **静态映射无法覆盖新源文件**：`PA-4840_context2.md` 实测显示大量正文、说明行、物理参数值与公司地址在英文列残留中文，仅靠静态词典映射远不及源文件变化快。
2. **表格结构与填写位置失真**：
   - Section 3 多组分被 `\n` 堆叠在单个 `COMPONENT_ROW` 中，未拆分为标准多行多列表格；
   - 通栏合并行与双列 KV 行混用同一扁平表格式，导致通栏内容或说明行易被误填入第一列；
   - Section 8 `OEL_ROW` 在 Markdown 序列化中缺失分支处理。

## 需求 1:1 映射
- **REQ-01**：强制 Agent/执行者对 Context 2 全 16 章节执行逐句全量英文翻译，建立英文槽位零中文残留（`untranslatedCount === 0`）硬门禁与 `--translations` 回填通路。
- **REQ-02**：Context 2 全 16 章节采用标准化表格结构（`2_COL_KV` / `1_COL_MERGED` / `3_COL_TABLE` / `MULTI_COL_TABLE`），显式标注 `colSpan` 与列位坐标，拆分多行组分/OEL 记录，杜绝内容全写第一列。
