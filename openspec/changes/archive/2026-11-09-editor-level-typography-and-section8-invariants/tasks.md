# Tasks: 编辑器底层排版与 Section 8 不变量实施任务书 (Tasks)

## 实施原则
- 严格遵循 Roo-Code/Cline 单焦点执行锁原则：同一时刻严格只能有 1 个任务处于 `[-]` 进行中；
- 任务勾选的充要条件：静态检查零警告零错误 + 测试真实退出码 0 + 物理 XML 见证验证通过；
- 验证平面物理隔离，严禁弱化测试集。

---

## 任务拆解与单焦点执行锁

- [x] **Task 1: 重构制表位与悬挂缩进底层逻辑 (REQ-01) [Focus Lock: 已完成]**
  - 在 `web/src/pipeline-engine.js` 中重写 `applyHangingIndentToP`，在注入 `<w:ind w:left="420" w:hanging="420"/>` 时按 ECMA-376 规范正确注入 `<w:tabs><w:tab w:val="left" w:pos="420"/></w:tabs>`（Section 11 对应为 565）。
  - 在 `rebuildTabbedLabelWithTypography` 中将 Run 1 文本调整为纯净 `seqStr`（不附加多余空格），紧接 `<w:tab/>`，使正文吸附于 420 dxa。
  - 确保未编号标签保持 `applyLeftIndentToP(420)`，与编号标签正文在 420 dxa 实现严格 1:1 垂直对齐。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 2: Section 8 题头保护与子标签排版规范恢复 (REQ-02) [Focus Lock: 已完成]**
  - 在 `standardizeEnglishTypographyAndLabels` 中建立 Section 8 题头拦截保护分支：当命中 `8.1 Exposure controls` 或 `8.2 Engineering/Personal controls` 时，设为顶格左对齐、Arial 10.5pt Bold / 12pt Bold 题头样式，严禁交给 `formatSingleCellRow` 降级为 9.5pt 普通正文。
  - 删除 `formatEnglishLabelCell` 中对 `Recommendation:` 的去缩进特判，让其统一应用 420 dxa 左缩进，与所有 PPE 标签保持对齐。
  - 在文本清洗阶段加入破折号归一化正则，将 `Fluororubber C FKM` 等历史 GBK 乱码纠正为 `Fluororubber - FKM:`。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 3: 植入底层防篡改封印与主审计自动化硬门禁 (REQ-03) [Focus Lock: 已完成]**
  - 在 `web/src/pipeline-engine.js` 关键排版代码块打上 `@ANTIGRAVITY_INVARIANT_LOCK` 源码级不可篡改标记。
  - 在 `web/scripts/run_master_msds_audit.mjs` 中新增 5 项物理断言：
    1. 英文版第一列编号标签段落包含有效 `<w:tabs>` 且位置为 420（Sec 11 为 565）；
    2. 未编号标签缩进量为 420（Sec 11 为 565）；
    3. Section 8.1 题头未被注入 `hanging="420"` 且字号为法定粗体题头（`sz="21"` 或 `24"`）；
    4. Section 8.2 中 `Recommendation:` 具有 `left="420"` 左缩进；
    5. 全文不存在 `Fluororubber C FKM` 乱码。
  - **实测验证命令**:
    ```bash
    node --check "web/scripts/run_master_msds_audit.mjs"
    ```

- [x] **Task 4: 全流程重新生成交付物与 150+ 项全量主审计验收 (Integration & Verification) [Focus Lock: 已完成]**
  - 通过 MCP 官方通道对测试样本（如 EP-1404）执行重新覆写与生成。
  - 运行自动化主审计命令，断言全部项 100% 绿灯（Exit Code 0）。
  - 使用 Python 脚本对生成的 DOCX 进行物理 OpenXML 抽样检查，确认 1.3 与 Name of supplier 垂直对齐，8.1 题头恢复，锯齿与乱码清零。
  - **实测验证命令**:
    ```bash
    node "web/scripts/run_master_msds_audit.mjs"
    ```

- [x] **Task 5: VS Code 原生两栏 Diff 检阅与触觉终审归档 [Focus Lock: 已完成]**
  - 通过 `vscode-review`（`open_in_vscode` / `review_diff_in_vscode`）唤起 VS Code 原生差异检阅界面，供用户核验改动。
  - 编制 1:1 双向物理核销清算表与 CHANGELOG 知识沉淀。
