# Proposal: 恢复标签视觉分行排版并建立标准化中英文内容值换行体系 (Restore Label Layout & Standardize Value Line Breaks)

## Why

用户明确指出：
1. **标签视觉分行是用户的显式排版要求**：底模中英文标签的断行（如 `12.2 Persistence and\ndegradability：`、`5.3 Special hazards of\nsubstances or mixtures：`）是原本精心设计的视觉分行排版，平整化标签破坏了排版美感与既定规范，必须立刻恢复原本的标签视觉分行。
2. **核心瓶颈在于内容值（Value）的换行体系未建立**：
   - 中文版在 Section 5.3（危害与烟尘）、5.4（自给呼吸器与灭火水）、6.1（防护设备与排气）、7.1（操作防范、洗手休息、更换衣物 3 段）、12.1（生态毒性声明与防排入下水道）、14.4（非危货物、温度区间、远离食酸碱 3 段）均有严整的换行分行；
   - 而英文版的值在这些章节全部挤成了一整大段未换行的长句，未能与中文版形成对称的专业换行分行规范；
   - 面对不同模板时，系统缺乏统一的值换行契约。

## What Changes

1. **彻底撤销标签平整化修改**：
   - 从 `docx-engine.js` 与 `pipeline-engine.js` 中移除 `harmonizeTableLabels`；
   - 保持官方底模原有的标签视觉分行、多段排版与字间结构；
2. **建立中英文内容值（Value）标准化换行体系**：
   - 升级 `pipeline-engine.js` 中的 `buildEnglishFacts`，为 Section 2.1、2.2、2.3、5.3、5.4、6.1、7.1、12.1、13、14.4 的英文值建立与中文 100% 对称的语义换行规范（`\n`）；
   - 在底层 `docx-engine.js` 中确保值单元格写入时，精准支持规范换行渲染，不产生多余空行，行间紧凑美观；
3. **保留并巩固自适应通用页尾时间中枢**：
   - 保持自适应从源文件中抽取真实修订日期（`2026/10/20`）并多模态注入 Footer；
4. **端到端流水线重新执行与实测检验**：
   - 重新生成 EP-1702 的 4 DOCX + 4 PDF 标准交付物，验证标签视觉分行已恢复，值换行已精准对称。

## Capabilities

### Modified Capabilities
- `template-agnostic-label-harmonization`: 调整为保护用户设定的标签视觉分行排版，严禁强行平整化。
- `english-sixteen-sections-standardization`: 确立 16 章节中英文内容值（Value）的语义换行规范对齐。
