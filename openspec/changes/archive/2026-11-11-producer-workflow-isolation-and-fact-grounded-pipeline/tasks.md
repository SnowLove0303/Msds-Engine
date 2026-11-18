# Tasks: Producer Workflow Isolation & Fact-Grounded Pipeline Architecture
(`tasks.md`)

## 施工任务清单与单焦点执行锁 (Single-Focus Lock Tasks)

- [x] **Task 1: 系统底座通用化工英译与硬编码消除重构** `[Root Source]`
  - **施工目标**:
    - 在 `web/src/pipeline-engine.js` 中重构 `translateChemicalCategoryToEnglish` 与品名推导逻辑，增加“无水环氧”、“非水环氧”分支，输出 `Anhydrous epoxy resin`；
    - 在英文多句组装逻辑中注入标点后空格自动修复（解决 OBS-01）；
    - 在英文长句结尾注入标点自动闭合（解决 OBS-02）。
  - **验证命令**: `node -c web/src/pipeline-engine.js`，运行单测验证无水环氧英译准确性。

- [x] **Task 2: 标签语义解析空格清洗容错重构** `[Root Source]`
  - **施工目标**:
    - 在 `web/src/smart-matching.js` 与 `pipeline-engine.js` 中，对标签字符串在匹配前执行全角与半角空格消除归一化；
    - 确保 `'外 观：'`、`'外  观'`、`'外观'` 均能 100% 命中 Section 9.1 外观槽位。
  - **验证命令**: `node -c web/src/smart-matching.js`，运行语义解析测试脚本验证容错率。

- [x] **Task 3: 中央主审计套件事实物理对账硬门禁增补** `[State Transition]`
  - **施工目标**:
    - 在 `web/scripts/run_master_msds_audit.mjs` 中增设核心事实对账硬断言：
      - `Section 9.1 外观源文件物理对账门禁`: 若源文件为微黄透明，产出物严禁为乳白；
      - `Section 1.1 品名与分类保真门禁`: 无水环氧严禁输出为 Waterborne 或 emulsion。
  - **验证命令**: `node -c web/scripts/run_master_msds_audit.mjs`，执行主审计套件自检。

- [x] **Task 4: EP-1404 源 docx 构建脚本纠偏与高保真源生成** `[Remediation]`
  - **施工目标**:
    - 修复 `web/scripts/build_ep1404_source.mjs`，消除脆弱窄正则，生成外观正确为 `微黄透明状液体` 的源 docx；
    - 物理检视源 docx 确认 Row 1 为 `微黄透明状液体`。
  - **验证命令**: `node web/scripts/build_ep1404_source.mjs`，运行脚本物理验证生成内容。

- [x] **Task 5: EP-1404 全量流水线生产与集中式主审计验证** `[Verification]`
  - **施工目标**:
    - 运行 `web/scripts/generate_ep1404_deliverables.mjs`，全自动生成 EP-1404 标准 8 格式交付物（4 DOCX + 4 PDF）；
    - 自动挂载最新的 Section 2 阶梯排版规范（480/840 twips CN, 317/677 twips EN）；
    - 执行中央主审计套件，断言全绿通过，真实退出码 0。
  - **验证命令**: `node web/scripts/generate_ep1404_deliverables.mjs`。

- [x] **Task 6: 交付物物理实测、VS Code 检阅与知识沉淀** `[Closure]`
  - **施工目标**:
    - 使用 PyMuPDF 真实检验 4 份 PDF 中 Section 9.1 外观与 Section 1.1 品名分类；
    - 执行 `open_in_vscode` 检阅修改的核心系统文件；
    - 更新 `CHANGELOG.md` 沉淀防线下沉记录与避坑教训；
    - 执行 git commit 物理存档。
  - **验证命令**: `python web/scripts/verify_s2_geometry.py`，`git status`。
