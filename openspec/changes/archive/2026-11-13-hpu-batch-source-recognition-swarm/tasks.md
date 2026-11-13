# Tasks: HPU 系列水性羟基聚氨酯树脂批量识别与审计执行计划

- [x] 1. 扫描与环境准入 (REQ-HPU-01)
  - [x] 1.1 确认目标源文件绝对路径与 6 个型号 `.docx` 物理存在性
  - [x] 1.2 确认输出目录 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\识别模块\识别模块训练夹` 可写状态
  - [x] 1.3 验证官方 CLI 脚本 `web/scripts/run_source_recognition.mjs` 与审计脚本可用性
  - *验证命令*: `node web/scripts/audit_context1_mechanical.mjs --self-test` (退出码 0，26/26 变异通过)

- [x] 2. 并行 Swarm 识别提取与交付 (REQ-HPU-02, REQ-HPU-03)
  - [x] 2.1 执行 HPU-7651 MSDS 源文件识别并生成 `HPU-7651_context1_recognition.md`
  - [x] 2.2 执行 HPU-7660 MSDS 源文件识别并生成 `HPU-7660_context1_recognition.md`
  - [x] 2.3 执行 HPU-7700 MSDS 源文件识别并生成 `HPU-7700_context1_recognition.md`
  - [x] 2.4 执行 HPU-7710 MSDS 源文件识别并生成 `HPU-7710_context1_recognition.md`
  - [x] 2.5 执行 HPU-7711A MSDS 源文件识别并生成 `HPU-7711A_context1_recognition.md`
  - [x] 2.6 执行 HPU-7790 MSDS 源文件识别并生成 `HPU-7790_context1_recognition.md`
  - *验证命令*: `Get-ChildItem "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\识别模块\识别模块训练夹\*.md" | Measure-Object` (输出 Count: 6)

- [x] 3. 独立反向机械审计硬阻断检验 (REQ-HPU-04)
  - [x] 3.1 运行 `audit_context1_mechanical.mjs` 审计 HPU-7651 成果并断言 Exit Code 0
  - [x] 3.2 运行 `audit_context1_mechanical.mjs` 审计 HPU-7660 成果并断言 Exit Code 0
  - [x] 3.3 运行 `audit_context1_mechanical.mjs` 审计 HPU-7700 成果并断言 Exit Code 0
  - [x] 3.4 运行 `audit_context1_mechanical.mjs` 审计 HPU-7710 成果并断言 Exit Code 0
  - [x] 3.5 运行 `audit_context1_mechanical.mjs` 审计 HPU-7711A 成果并断言 Exit Code 0
  - [x] 3.6 运行 `audit_context1_mechanical.mjs` 审计 HPU-7790 成果并断言 Exit Code 0
  - *验证命令*: `node web/scripts/audit_context1_mechanical.mjs --target="F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\识别模块\识别模块训练夹\*.md"` (所有文件 0 violations, 0 warnings, Exit Code 0)

- [x] 4. 1:1 双向物理核销与总结归档 (REQ-HPU-01 ~ REQ-HPU-04)
  - [x] 4.1 汇总 6 大型号的物理事实行数、耗时、表格数与审计结果
  - [x] 4.2 运行 `openspec validate --all --strict` 确保规范契约合流
  - [ ] 4.3 呈报终审交付报告并等待人工验收
