# Tasks: 典型 PA 官方基准模板与受控流水线

- [x] Task 1: 提炼成分事实与准备 Section 2 / Section 11 典型数据 <!-- id: 1 -->
  - [x] 1.1 提取 PA-4780 GHS 象形图图片与 H412、P273、P501 事实
  - [x] 1.2 编写 2-丁氧基乙醇与丙烯酸聚合物典型毒理学参数（经口/经皮 LD50、刺激性、AMES）
- [x] Task 2: 注册官方典型 PA 母版与适配流水线 <!-- id: 2 -->
  - [x] 2.1 在 `template-editor.js` 注册 PA 官方基准母版
  - [x] 2.2 确保 `pipeline-engine.js` 能够正确填充 PA 典型危害与毒理数据
- [x] Task 3: 扩展双极双层强审计 `audit_bipolar_bilayer.mjs` <!-- id: 3 -->
  - [x] 3.1 增加 PA-4780 特征断言（H412、P273、P501、经口 LD50）
  - [x] 3.2 增加反向断言禁止空洞无数据或错位标签
- [x] Task 4: 受控生产标准 8 交付物并执行机械强终审 <!-- id: 4 -->
  - [x] 4.1 编写并运行受控驱动脚本 `generate_pa4780_canonical_deliverables.mjs`
  - [x] 4.2 验证交付目录严格 8 交付物且通过 `audit_bipolar_bilayer.mjs` (Exit Code 0 [Measured])
- [x] Task 5: 终审检阅、知识沉淀与规范合流 <!-- id: 5 -->
  - [x] 5.1 运行 `npx openspec validate canonical-pa-benchmark-template --strict`
  - [x] 5.2 提交 `CHANGELOG.md` 并通过 VS Code 原生 Diff 检阅
  - [x] 5.3 Git 原子提交
