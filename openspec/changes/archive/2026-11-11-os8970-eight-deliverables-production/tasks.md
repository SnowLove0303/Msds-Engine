# Tasks: OS-8970 标准 8 格式受控生产与全景深度审计任务清单

> **施工纪律**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中执行锁状态，测通后方可推进下一项，严禁并行涂鸦。

- [x] **Task 1: 构建 OS-8970 专属受控生产脚本与化学事实冻结**
  - **角色**: `[Root Source / Producer]`
  - **内容**: 编写 `web/scripts/generate_os8970_deliverables.mjs`，精确绑定源文件 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\水性噁唑啉交联剂\OS-8970\OS-8970 msds_CN 冠志.docx`，载入 `isHazardous: false`、`isDangerousGoods: false` 与 Section 9 理化参数。
  - **验证命令**: `node -c web/scripts/generate_os8970_deliverables.mjs` (语法检验退出码 0)

- [x] **Task 2: 执行标准 8 格式全量交付物生产与 PDF 编译**
  - **角色**: `[State Transition / Pipeline]`
  - **内容**: 运行 `node web/scripts/generate_os8970_deliverables.mjs`，生成 4 份 DOCX 并自动调用 LibreOffice 编译 4 份 PDF，时间戳控制在 5 分钟内。
  - **验证命令**: `node -e "const fs = require('fs'); const d = fs.readdirSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970'); if (d.length !== 8) process.exit(1);"` (交付物总数必须为 8)

- [x] **Task 3: 执行 Layer 2 源码架构与反过拟合 Lint 检测**
  - **角色**: `[Audit Gate / Static Analysis]`
  - **内容**: 执行 Layer 2 静态代码分析，确保新增脚本与管线代码 100% 遵守 10 大架构硬门禁。
  - **验证命令**: `node web/scripts/lint_code_invariants.mjs` (退出码 0，违规项 0)

- [x] **Task 4: 执行 165 项工业级集中式中央主审计套件**
  - **角色**: `[Audit Gate / Master Audit]`
  - **内容**: 针对 `OS-8970` 交付物执行 `run_master_msds_audit.mjs`，核销物理不变量、非危通栏、表格边框、字阶、PDF 渲染字号与中英文行数同构。
  - **验证命令**: `node web/scripts/run_master_msds_audit.mjs --model=OS-8970 --targetDir="F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970" --sourceDocx="F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx"` (退出码 0，165/165 全绿)

- [x] **Task 5: 执行双极双层全景深度审计 (G-01~G-40 & L-S1~L-S16)**
  - **角色**: `[Audit Gate / Forensic Bilayer]`
  - **内容**: 运行 `audit_bipolar_bilayer.mjs`，验证全局 40 项物理规范与 16 章节专属局部规范，确保 0 缺陷。
  - **验证命令**: `node web/scripts/audit_bipolar_bilayer.mjs "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970" OS-8970` (退出码 0，Failures: 0)

- [x] **Task 6: 同步交付物至用户工作目录并出具双向核销清算表**
  - **角色**: `[Delivery & Checkoff]`
  - **内容**: 将已获双审计全绿通过的 8 份交付物无损同步至 `E:\冠志\TDS MSDS (2)\待处理文件\OS-8970\`，更新 CHANGELOG 并提交 Git 归档。
  - **验证命令**: `Get-ChildItem "E:\冠志\TDS MSDS (2)\待处理文件\OS-8970" | Measure-Object` (文件数必须为 8)
