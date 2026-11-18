# Tasks: PA-4780 Section 2 与 Section 11 深度扩充任务分解

- [x] Task 1: 准备 PA-4780 Section 2 与 Section 11 结构化数据载荷 <!-- id: 1 -->
  - [x] 1.1 依据 2-丁氧基乙醇 ECHA 数据库准备 Section 2 四维防范说明与 H 语句双语对照
  - [x] 1.2 编写 Section 11 11.1~11.10 标准插槽结构化数据（含经口/皮/吸入 LD50、刺激性、致敏、致突变、致癌、生殖毒性、STOT、经皮吸收）
- [x] Task 2: 扩展流水线引擎对 PA-4780 结构化表格模态支持 <!-- id: 2 -->
  - [x] 2.1 在 `pipeline-engine.js` 支持 PA-4780 动态构建 16 行 Section 11 结构化表格
  - [x] 2.2 确保英文翻译流水线能够精准 1:1 转换结构化毒理学端点插槽
- [x] Task 3: 扩展双极双层强审计 `audit_bipolar_bilayer.mjs` <!-- id: 3 -->
  - [x] 3.1 增加 PA-4780 Paradigm 2 结构化表格端点断言
  - [x] 3.2 增加 Section 2 全套 H/P 语句双语断言
- [x] Task 4: 受控生产并执行终审 <!-- id: 4 -->
  - [x] 4.1 运行受控驱动脚本生成 PA-4780 标准 8 交付物
  - [x] 4.2 验证交付目录严格 8 交付物并通过双极双层全景机械终审 (`Exit Code 0 [Measured]`)
- [x] Task 5: 规范归档与 CHANGELOG 知识沉淀 <!-- id: 5 -->
  - [x] 5.1 运行 `npx openspec validate enrich-pa4780-sec2-sec11-pu-paradigm --strict`
  - [x] 5.2 提交 `CHANGELOG.md` 并通过 VS Code 原生 Diff 检阅
  - [x] 5.3 Git 原子归档
