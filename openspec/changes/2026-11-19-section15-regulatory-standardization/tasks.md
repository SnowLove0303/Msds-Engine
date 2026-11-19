# Tasks: Section 15 法规信息全面规范化与双语排版净化

> **治理纪律**：严格遵循 Roo-Code/Cline 启发之 `[-]` 单任务专注锁，同一时刻严格仅限 1 项处于进行中。  
> **打勾充要条件**：真实进程退出码 0 + [Measured] 物理凭证核实。

---

## 任务拆解与单焦点执行锁

- [x] **Task 1: [Root Source] 修复 `smart-matching.js` Section 15 Row 1 覆写缺陷 (`RTM-S15-01`, `RTM-S15-02`)**
  - **施工内容**：
    1. 在 `web/src/smart-matching.js` 的 `s === 15` 分支中，阻断 `safetyItem.value` 对 Row 1 的覆写，使 Row 1 永久锁定为官方子标题 `"物质或混合物的相关安全、健康和环保法律法规"`；
    2. 将法规识别内容安全引导至 `符合下列法规要求：` 下方的结构化行中；
    3. 通过 `vscode-review` 发起 VS Code 原生差异检阅。
  - **实测验证命令**：
    `node -e "import('./web/src/smart-matching.js').then(() => console.log('Syntax check passed'));"`

- [x] **Task 2: [Root Source] 修复 `universal-editor-primitives.js` 标签空格与标点误补缺陷 (`RTM-S15-03`)**
  - **施工内容**：
    1. 在 `web/src/universal-editor-primitives.js` 的 `applyGlobalTypographyProjection` 中，当 `s15Match` 或纯标签匹配且 `!valText` 时，`labelText` 经 `trim()` 输出（`Other provisions:` / `Complies with the following regulations:`），杜绝尾部挂空；
    2. 在第 2.5 步符号规范化中，强化句末补点判定：判定前执行 `tc.trim()`，对以 `:` 结尾的标签行实行绝对豁免，严禁补 `.`；
    3. 通过 `vscode-review` 发起 VS Code 原生差异检阅。
  - **实测验证命令**：
    `node -e "import('./web/src/universal-editor-primitives.js').then(() => console.log('Syntax check passed'));"`

- [x] **Task 3: [State Transition] 完善 `pipeline-engine.js` 双语构建与后置净化兜底 (`RTM-S15-01` ~ `RTM-S15-04`)**
  - **施工内容**：
    1. 在 `buildBaseChineseEngine` 中加固 Section 15 Row 1~3 结构，并确保 4 部法规在 Row 4~7 规范排列；
    2. 在 `buildBaseEnglishEngine` 中加固 Section 15 对应西文结构；
    3. 在后置排版净化中增加对 `: .` 的终审清洗兜底；
    4. 通过 `vscode-review` 发起 VS Code 原生差异检阅。
  - **实测验证命令**：
    `node -e "import('./web/src/pipeline-engine.js').then(() => console.log('Syntax check passed'));"`

- [x] **Task 4: [Verification] 重新生成 PA-3654 全套 8 项交付物并进行双极双层全要素深度审计**
  - **施工内容**：
    1. 执行 `node web/scripts/generate_pa3654_deliverables.mjs`，重新生成 4 份 DOCX + 4 份 PDF；
    2. 运行 `node web/scripts/inspect_pa3654_en_s15.mjs`，核实：
       - 中文 Row 1 === `"物质或混合物的相关安全、健康和环保法律法规"`；
       - 中文 Row 4~7 === 4 部法规无重复；
       - 英文 Row 2 === `"Other provisions:"`（无 `: .`）；
       - 英文 Row 3 === `"Complies with the following regulations:"`（无 `: .`）；
       - 双语行数均为 8 行（1:1 同构）；
    3. 运行双极双层主审计套件，确保退出码为 0，零警告零错误。
  - **实测验证命令**：
    `node web/scripts/generate_pa3654_deliverables.mjs`

- [x] **Task 5: [Archival] 沉淀 CHANGELOG 知识并提交 Git 原子存档**
  - **施工内容**：
    1. 更新 `CHANGELOG.md`，记录 Section 15 标题行保全、西文冒号空格治理机制与根因；
    2. 执行 Git commit 存档。
