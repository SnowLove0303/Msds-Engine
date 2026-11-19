# Tasks: PA-4902 与 PA-4840 覆写生产与全要素法医审计任务清单

> **执行机制**: 严格遵循 Cline / Roo-Code `[-]` 单焦点执行锁，同一时刻仅能有 1 个任务处于执行中，前序任务通过真实退出码 0 验证后方可推进下一项。

## 任务执行清单

- [x] **Task 1: PA-4902 源文件底层事实深度感知与 Facts 字典构建 (RTM-01)**
  - 穿透解读 `PA-4902msds_CN 冠志__.docx` 底层 XML，精准提取品名、水溶性羟基丙烯酸树脂、闪点 63℃（非危品）、乙二醇丁醚 20% + DMEA 3~4%、温控 -5℃~+50℃。
  - 构建上游数据平面结构化 Facts 字典 `scratch/facts_pa4902.mjs`。
  - **实测验证命令**: `node -e "import('./scratch/facts_pa4902.mjs').then(m => console.log('PA-4902 Facts Verified:', m.default.modelCode))"`

- [x] **Task 2: PA-4840 源文件底层事实深度感知与多组分毒理学事实锁定 (RTM-02)**
  - 穿透解读 `PA-4840 msds_CN 冠志.docx` 底层 XML，提取 H412 水生慢性 3 类、初沸点以下无闪点、2-丁氧基乙醇 5~10% + DMEA 3~7%、温控 +5℃~+40℃。
  - 完整锁定 2-丁氧基乙醇与聚丙烯酸酯分散体的全部多组分毒理学实验数据（NOAEL/Ames/OECD 导则）。
  - 构建上游数据平面结构化 Facts 字典 `scratch/facts_pa4840.mjs`。
  - **实测验证命令**: `node -e "import('./scratch/facts_pa4840.mjs').then(m => console.log('PA-4840 Facts Verified:', m.default.modelCode))"`

- [x] **Task 3: PA-4902 标准流水线覆写执行与 WPS COM 矢量 PDF 转译 (RTM-03, RTM-04)**
  - 执行标准七步覆写流水线，生成 4 份标准排版 DOCX 交付物至 `TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902/`。
  - 启动 Windows WPS 原生 COM 接口进行矢量转译，产出 4 份严格 5 页的高清 PDF。
  - **实测验证命令**: `node "scratch/verify_deliverables.mjs" "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902" PA-4902`

- [x] **Task 4: PA-4840 标准流水线覆写执行与 WPS COM 矢量 PDF 转译 (RTM-03, RTM-04)**
  - 执行标准七步覆写流水线，生成 4 份标准排版 DOCX 交付物至 `TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840/`。
  - 启动 Windows WPS 原生 COM 接口进行矢量转译，产出 4 份严格 5 页的高清 PDF。
  - **实测验证命令**: `node "scratch/verify_deliverables.mjs" "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840" PA-4840`

- [x] **Task 5: PA-4902 与 PA-4840 两阶双轨机械主审计核销 (RTM-05)**
  - 运行 `audit_bipolar_bilayer.mjs` 对 PA-4902 与 PA-4840 执行 165 项物理不变量与章节契约审查（退出码 0）。
  - 运行 `run_master_msds_audit.mjs` 对两款产品执行 170 项集中式中央主审计核销（退出码 0，🏆 AUDIT_PASSED）。
  - **实测验证命令**:
    - `node "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs" --model=PA-4902 "--targetDir=F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902" "--sourceDocx=F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志__.docx"`
    - `node "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs" --model=PA-4840 "--targetDir=F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840" "--sourceDocx=F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志.docx"`

- [x] **Task 6: 中英文逐句翻译对照终审与源文件内容继承深度审计 (RTM-06)**
  - 运行 `audit_translation_dual_display.mjs` 逐行比对两款产品中英文交付物。
  - 人工法医级穿透审查源文件事实继承性，验证有无多余口水化套话或字段截断。
  - 输出两份产品的专属深度审计报告。
  - **实测验证命令**:
    - `node "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_translation_dual_display.mjs" "--target=F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902"`
    - `node "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_translation_dual_display.mjs" "--target=F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840"`
