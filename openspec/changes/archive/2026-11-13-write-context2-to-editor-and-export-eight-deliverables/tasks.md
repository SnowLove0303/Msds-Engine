# Tasks: Context 2 编辑器写入与八格式导出执行计划

- [x] 1. 编写受控执行脚本对接 Context 2 与现有编辑器写入功能 (REQ-ED-01)
  - [x] 1.1 读取 `output/HPU-7651/HPU-7651_context2_CN.json` 与 `output/HPU-7651/HPU-7651_context2_EN.json`
  - [x] 1.2 编写执行脚本 `web/scripts/export_hpu7651_deliverables.mjs`，调用 `writeDeliverableViaEditor` 写入四大底模
  - *验证命令*: `node web/scripts/export_hpu7651_deliverables.mjs --dry-run` (退出码 0)

- [x] 2. 受控执行八格式生成与 PDF 批量转换 (REQ-ED-02, REQ-ED-03)
  - [x] 2.1 导出 4 份 DOCX 并批量调用 `convertBatchDocxToPdf` 导出 4 份原生 PDF
  - [x] 2.2 将 8 格式交付物直接输出至 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-2 水性羟基聚氨酯树脂 HPU\HPU-7651\`
  - [x] 2.3 验证目标文件夹下 8 份文件均存在且文件大小大于 0
  - *验证命令*: `(Get-ChildItem 'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-2 水性羟基聚氨酯树脂 HPU\HPU-7651').Count` (输出 8)

- [x] 3. 现场排版问题全面排查与对比存证 (REQ-ED-04)
  - [x] 3.1 检查生成的 DOCX 与 PDF 在 16 章节中的内容完整性与呈现状态
  - [x] 3.2 提取并归纳当前编辑器处理 Context 2 时存在的格式、排版、换行与字段问题
  - [x] 3.3 呈报《编辑器写入与导出问题排查清单》与 1:1 双向物理核销表，交由用户检视
  - *验证命令*: 出具详尽排查报告并完成归档
