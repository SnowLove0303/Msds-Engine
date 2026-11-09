# Tasks: PU-218A TDS 与 MSDS 双智能体协同标准化生产

- [x] Task 1: 派发 TDS 覆写任务并生成 TDS 8 格式交付物 <!-- id: 1 -->
  - 委派 TDS 专用 Subagent (`3c8a7a90-0c92-4294-ae83-9495eee12ae8`)
  - 从 `PU-218A tds_CN 冠志.docx` 提取事实并进行标准化翻译
  - 覆写生成 4 DOCX + 4 PDF 并输出至目标专有目录
  - 验证命令: `node -e "const fs = require('fs'); const d = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A'; const f = fs.readdirSync(d).filter(x => x.includes('tds_')); console.log('TDS count:', f.length); if (f.length !== 8) process.exit(1);"`

- [x] Task 2: 派发 MSDS 覆写任务并生成 MSDS 8 格式交付物 <!-- id: 2 -->
  - 委派 MSDS 专用 Subagent (`f880401d-21e5-4669-ac37-6acb83060e9d`)
  - 从 `PU-218A msds_CN 冠志.docx` 读取事实，执行模板清空与数据装配
  - 落地 Section 2 象形图居左/空行、Section 9 垂线对齐、Section 11 垂直合并三列拓扑、Section 13 加粗
  - 覆写生成 4 DOCX + 4 PDF 并输出至目标专有目录
  - 验证命令: `node -e "const fs = require('fs'); const d = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A'; const f = fs.readdirSync(d).filter(function(x){ return x.includes('msds_'); }); console.log('MSDS count:', f.length); if (f.length !== 8) process.exit(1);"`

- [x] Task 3: 主 Agent 零信任双极双层机械审计与 1:1 双向物理核销 <!-- id: 3 -->
  - 执行机械全景审计脚本核验 MSDS 与 TDS 8 格式交付物几何对齐与排版质量
  - 检查目标目录文件纯度（严格 16 份正式交付物，零临时杂件）
  - 检查 Git 仓库状态（确保零交付物污染版本库）
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\audit_bipolar_bilayer.mjs" "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-218A"`
