# 任务清单: PA-3656 8-Format Production & Verification Tasks

- [x] 1. 资产摄入与 Context 1 反向证伪机械审计 <!-- id: task-01 -->
  - [x] 1.1 运行 `run_source_recognition.mjs` 提取 `PA-3656` 原始化学事实形成 Context 1
  - [x] 1.2 运行 `audit_context1_mechanical.mjs` 执行反向证伪机械审计 (验证退出码 0，CRITICAL: 0, WARNING: 0)

- [x] 2. 中英双轨治理与受控通用流水线 8 格式覆写生产 <!-- id: task-02 -->
  - [x] 2.1 锁定非危品状态机 (`isHazardous = false`)，严防虚增象形图/信号词
  - [x] 2.2 驱动专业化学语义英译，标准化度数单位为 `°C`
  - [x] 2.3 模板前置清零与双主体企业预设派生 (冠志/国彩)
  - [x] 2.4 调用统一流水线 `run_universal_msds_pipeline.mjs` 覆写源文档 `PA-3656 msds_CN冠志.docx`
  - [x] 2.5 生成 4 DOCX + 4 PDF 交付物矩阵至 `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3656/`

- [x] 3. 两阶双轨全景深度审计与 1:1 双向物理核销 <!-- id: task-03 -->
  - [x] 3.1 运行 159 项集中式机械主审计 (`run_master_msds_audit.mjs`)，退出码 0，Failures: 0 (实测 173/173 通过)
  - [x] 3.2 运行双极双层法医级深度审计 (`audit_bipolar_bilayer.mjs`)，Failures: 0 (165/165 通过)
  - [x] 3.3 运行 16 章节双语 1:1 事实保真度物理对账审计 (S2~S16 逐行双重对照 95 条全绿)
  - [x] 3.4 检查目标目录 8 份文件物理存在性与文件大小 (> 20KB)
  - [x] 3.5 挂载 VS Code 原生两栏 Diff 检阅通道，出具 1:1 双向物理核销矩阵
