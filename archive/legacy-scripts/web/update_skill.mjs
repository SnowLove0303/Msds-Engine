import fs from 'fs';

const p = 'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md';
let content = fs.readFileSync(p, 'utf8');

const target = `5. **通用型 MSDS Studio 与彻底铲除特判 (Strict Anti-Overfitting Invariant)**：
   - MSDS Studio 是工业级通用文档处理工作台，必须保持 100% 通用性；
   - 严禁针对特定产品型号（如 \`PU-202A\`、\`PA-4780\`、\`PU-218A\` 等）在代码或规则中编写 \`if (model === 'xxx')\` 特判分支；
   - 所有排版与结构决策必须完全基于通用的数据形态（是否危化品、组分数量 $N$、列数、文本是否包含化学式、是否只有叙述性说明等）进行通用逻辑分流。`;

const addition = `5. **通用型 MSDS Studio 与彻底铲除特判 (Strict Anti-Overfitting Invariant)**：
   - MSDS Studio 是工业级通用文档处理工作台，必须保持 100% 通用性；
   - 严禁针对特定产品型号（如 \`PU-202A\`、\`PA-4780\`、\`PU-218A\` 等）在代码或规则中编写 \`if (model === 'xxx')\` 特判分支；
   - 所有排版与结构决策必须完全基于通用的数据形态（是否危化品、组分数量 $N$、列数、文本是否包含化学式、是否只有叙述性说明等）进行通用逻辑分流。

6. **全局表格边框规范公理 (Unified Table Border Invariant)**：
   - 全局法定表格边框铁律：**各 section 表格外框用实线 (\`single\`)，内框用统一虚线 (\`dotted\`)**；
   - 动态增减行（如 Section 3 组分自适应增行、Section 8 控制参数增行等）或单元格拆分时，底座必须严格保持：首行顶框与末行底框为实线，表格左右外侧框线为实线；行间水平分割线及列间垂直分割线必须统一为虚线 (\`dotted\`)，严禁中间出现局部实线断层或末行底线虚化。

7. **最终审计与对账方案强制硬门禁 (Mandatory Deep Audit & Fact Witness Hard Blocker)**：
   - 最终交付前的全景机械深度审计 (\`msds_audit_deliverables\` / \`audit_bipolar_bilayer.mjs\`) 与 1:1 事实物理对账矩阵提升为**最高法定强制级别 (Mandatory Hard Blocker)**；
   - 审计方案必须涵盖：① TDS/源文件核心指标双语 100% 覆写与一致性；② 英文版 \`<w:t>\` 零中文；③ 格式服从原文（严禁捏造生殖毒性等假端点、严禁擅删关键前置定性行）；④ 导言行不重复冗余；⑤ 全局表格外框实线/内框虚线纯净度；⑥ 避免末页纯空 (G-40)。
   - 必须通过外部见证者 (\`[Measured]\`) 获取真实退出码 0，任何单项违规一票否决，严禁消极放行或形式主义打勾。`;

// normalize CRLF
content = content.replace(/\r\n/g, '\n');
if (content.includes(target)) {
  content = content.replace(target, addition);
  // restore CRLF
  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, content, 'utf8');
  console.log('Successfully updated SKILL.md');
} else {
  console.log('Target not found in SKILL.md');
}
