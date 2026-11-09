# Tasks: MSDS-Studio 通用拓扑结构重构与源文件事实绝对驱动实施任务书 (Tasks)

## 实施原则
- 严格遵循 Roo-Code/Cline 单焦点执行锁原则：同一时刻严格只能有 1 个任务处于 `[-]` 进行中；
- 任务勾选的充要条件：静态检查零警告零错误 + 测试真实退出码 0 + 物理对账验证通过；
- 严禁先改代码再补规格；严禁弱化测试集；严禁任何型号特判硬编码。

---

## 任务拆解与单焦点执行锁

- [x] **Task 1: Section 2 纯净大通栏重构与内框虚线彻底清除 (REQ-05) [Focus Lock: 已完成]**
  - 在 `web/src/docx-engine.js:renderFullWidthRow` 中重构 Section 2 边框逻辑：内部数据行之间横向边框设为 `none`，彻底清除 `dotted` 虚线，仅保留最外层实线边框。
  - 在 `web/src/pipeline-engine.js:buildFullWidthSection2` 中确保 Section 2 调用时不再注入虚线。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/docx-engine.js" && node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 2: 全局表格跨页断行底层放开与消除大空白 (REQ-02) [Focus Lock: 已完成]**
  - 在 `web/src/pipeline-engine.js` 中彻底移除全局盲目对表格行追加 `<w:cantSplit/>` 的循环。
  - 在 `web/src/docx-engine.js` 中确立跨页断行规则：默认不添加 `cantSplit`，多行叙述性章节（S2, S8, S11, S12, S13, S14, S15, S16）全量允许跨页自然流转；仅白名单保留表头行防撕裂。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/docx-engine.js" && node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 3: Section 3 “3.2 成分”标签识别与法定加粗格式底层固化 (REQ-01) [Focus Lock: 已完成]**
  - 在 `web/src/pipeline-engine.js:enforceStructuralTypographyInvariants` 中新增 Section 3 题头单元格处理：
    - 中文版格式化为法定小四 12pt 宋体加粗（`3.2  成分：`）；
    - 英文版格式化为 9.5pt Arial 加粗（`3.2  Ingredients:`）；
    - 下方成分名称及数值行保持常规体，严禁整表全量误加粗。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 4: Section 11 毒理学动态拓扑构建器与 13 项终点全量保真 (REQ-03) [Focus Lock: 已完成]**
  - 重构 Section 11 数据提取器，完整提取源文件中的 13 项毒理终点（急毒、刺激、致敏、突变、生殖、STOT 一次性接触分类结论、CMR 评估、亚急性、体内基因等）。
  - 重构 Section 11 表格构建器：通过通用原语 `addRowAfter` / `insertRow` 动态生成表格行，源文件有几项就动态生成几行，中英文 1:1 双语镜像对称。
  - 彻底废除固定行数截断和模板插槽死板乱匹配。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 5: Section 14 通用原语装配、清除 ADG 澳洲法规与公约全量保真 (REQ-04) [Focus Lock: 已完成]**
  - 全库清除外生硬编码常量（彻底清除 `in accordance with ADG regulations.`）。
  - 100% 还原源文件载明的国际公约（`按《MARPOL73/78》公约附则II和IBC规则：不适用`）与安全防范说明（`参见6-8节`）。
  - 基于通用危化品判定算法，全量调度通用原语 `insertRow` / `deleteRow` / `editLabel` 动态自适应构建表格，彻底废除型号特判。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 6: 主审计套件升级与全量重新生成交付物终审验证 (REQ-01 ~ REQ-05) [Focus Lock: 已完成]**
  - 在 `web/scripts/run_master_msds_audit.mjs` 中升级自动化门禁断言：
    1. Section 2 内框无虚线断言；
    2. Section 3 题头加粗与数据行常规体断言；
    3. 全篇无异常空白与自然跨页断行断言；
    4. Section 11 13项全量毒理终点保真断言；
    5. Section 14 反 ADG 虚假法规与公约保全断言。
  - 重新编译生成 PU-2346A 全量交付物并运行 160+ 项主审计套件与双极双层机械审计，确认真实退出码为 0。
  - **实测验证命令**:
    ```bash
    node "web/scripts/run_master_msds_audit.mjs"
    ```
