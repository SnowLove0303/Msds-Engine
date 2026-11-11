# Tasks: EP-1404 8 格式标准交付物受控生产与主审计核销

- [x] 1. 事实解析与流水线执行配置校验 (Lock & Ingestion)
  - 锁定源文件 `EP-1404 msds_CN 冠志.docx`，确认 Section 1~16 事实绑定配置
  - 检查 `generate_ep1404_deliverables.mjs` 中的 `facts` 与双语衍生规则，确保完全承袭 Section 5.3 烟尘归属与全局标签纯左对齐
  - 验证命令: `node -e "const f = require('fs'); console.log('Source docx exists:', f.existsSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx'))"`

- [x] 2. EP-1404 标准 8 格式受控生产与排版加固 (Apply & Production)
  - 运行受控生产脚本，调用 `executeEightDeliverablesPipeline` 编译 4 份 DOCX
  - 执行微观排版加固（标签加粗、全角符号 ASCII 化、全篇标签左对齐保证）
  - 执行 `convertBatchDocxToPdf` 高清批处理编译 4 份 PDF，保证 8 份文件时间戳同步
  - 验证命令: `node web/scripts/generate_ep1404_deliverables.mjs`

- [x] 3. 双极双层 165 项全景机械主审计与物理证据验证 (Audit Verification)
  - 针对目标交付目录运行集中式中央主审计脚本 `audit_bipolar_bilayer.mjs`
  - 机械核验 G-01 交付物纯净度、G-36 时间戳新鲜度、G-37 PDF字号、G-38 Section 9 标签垂直绝对对齐、G-09 制表符纯度及 L-S1~L-S16 章节专属契约
  - 运行 Python 提取脚本核对 Section 5.3 烟尘警示与全篇标签左对齐（非左对齐标签数严格为 0）
  - 验证命令: `node web/scripts/audit_bipolar_bilayer.mjs "F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1404" "EP-1404"`

- [x] 4. 双向物理同步至用户目录与终审归档 (Sync & Archive)
  - 将 8 份标准交付物同步覆盖至 `E:\冠志\TDS MSDS (2)\待处理文件\EP-1404\`
  - 校验 `E:\` 盘目录下的文件存在性与时间戳一致性
  - 记录 CHANGELOG.md 与 OpenSpec 归档准备
  - 验证命令: `python -c "import os; p=r'E:\冠志\TDS MSDS (2)\待处理文件\EP-1404'; fs=[f for f in os.listdir(p) if f.startswith('EP-1404 msds')]; print('Synced count:', len(fs)); assert len(fs)==8"`
