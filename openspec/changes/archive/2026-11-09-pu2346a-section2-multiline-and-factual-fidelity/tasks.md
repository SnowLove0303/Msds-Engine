# Tasks: PU-2346A Section 2 多行重构与全维度事实忠实度实施任务书 (Tasks)

## 实施原则
- 严格遵循 Roo-Code/Cline 单焦点执行锁原则：同一时刻严格只能有 1 个任务处于 `[-]` 进行中；
- 任务勾选的充要条件：静态检查零警告零错误 + 测试真实退出码 0 + 物理对账验证通过；
- 严禁先改代码再补规格；严禁弱化测试集。

---

## 任务拆解与单焦点执行锁

- [x] **Task 1: Section 2 多行表格重构与 `<w:cantSplit/>` 豁免 (REQ-01) [Focus Lock: 已完成]**
  - 在 `web/src/pipeline-engine.js:buildFullWidthSection2` 中，将 Section 2 单行通栏拆解为 5 个独立表格行（2.1 类别、2.2 要素、2.3 危险说明、2.4 防范说明、2.5 其他危害）。
  - 在 `pipeline-engine.js` 表格行 `<w:cantSplit/>` 注入循环中，显式排除 Section 2 数据行（尤其是 Row 4 和 Row 3），解除防跨页撕裂限制，使长文本防范说明跨页平滑流转。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 2: 中英文文本格式均一化与标点粘连修复 (REQ-02, REQ-03) [Focus Lock: 已完成]**
  - 在 `pipeline-engine.js` 中统一中文标签单元格字号：所有字符（含数字序号）设为法定小四 12pt（`sz="24"`），清除 `sz="21"` 混排断层。
  - 恢复英文 Section 8 标签为标准五号 9.5pt（`sz="19"`），清除 `sz="24"` 膨胀。
  - 引入英文安全句子拼接器 `safeSentenceJoiner`（西文空格防连词粘连）并在英文描述性段落末端自动补齐句点。
  - 规范 Section 9 标签序号与标题间距为标准双空格（`9.1  Appearance:`）。
  - 在 Section 8 手部防护无总体描述时自动执行 `deleteRow()` 裁剪空天窗。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/src/pipeline-engine.js"
    ```

- [x] **Task 3: PU-2346A 事实层固化（Section 14 易燃危化品、Section 11 毒理、TDS 三乙胺）(REQ-04, REQ-05, REQ-06) [Focus Lock: 已完成]**
  - 在 PU-2346A 生成脚本中固化 Section 14 事实：`isDangerousGoods: true`, UN 1866, Class 3, PG III, RESIN SOLUTION / 树脂溶液；中文版输出规范 14.1~14.4 四行结构。
  - 固化 Section 11 毒理事实：经口/吸入/经皮分项，保留大鼠经口 $LD_{50} > 2000\text{ mg/kg}$、乙醇 $LD_{50} = 10470\text{ mg/kg}$、乙醇吸入 $LC_{50} = 124.7\text{ mg/L}$；Section 6.1 补齐“远离火源/火种”。
  - 固化 TDS 中和剂为三乙胺（TEA, CAS 121-44-8），解耦锁定 pH 7.0-10.0。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/scripts/generate_pu2346a_deliverables.mjs"
    ```

- [x] **Task 4: 主审计脚本自动化硬门禁升级 (REQ-01 ~ REQ-06) [Focus Lock: 已完成]**
  - 在 `web/scripts/run_master_msds_audit.mjs` 中新增断言：
    1. Section 2 防范说明完整性断言（P403/P501 存在且未被截断）；
    2. Section 14 UN 1866 易燃液体判定断言（中英文一致）；
    3. 中文第一列标签单元格字号均一性断言（全为 `sz="24"`，无 `sz="21"`）；
    4. 英文 Section 8 标签五号字号断言（`sz="19"`，无 `sz="24"`）；
    5. TDS 中和剂三乙胺断言（严禁出现 DMEA）。
  - 通过 `vscode-review` (`review_diff_in_vscode`) 提交 diff 检阅。
  - **实测验证命令**:
    ```bash
    node --check "web/scripts/run_master_msds_audit.mjs"
    ```

- [x] **Task 5: 全量重新生成交付物与独立 Subagent 敌手终审 (REQ-07) [Focus Lock: 已完成]**
  - 主协调 Agent 执行全链路覆写并生成 PU-2346A 八大交付物（4 MSDS + 4 TDS）。
  - 派发全新独立 Subagent（`Role: PU-2346A Deliverables Adversarial Verifier`）执行 16 章节微观对账与 150+ 项主审计核销。
  - 确认 15 项缺陷 100% 清零，主审计进程退出码为 0，PDF 页面流自然无截断。
  - **实测验证命令**:
    ```bash
    node "web/scripts/run_master_msds_audit.mjs"
    ```
