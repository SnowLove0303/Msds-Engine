import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/docx-engine.js', 'utf8');

// 1. In applyStandardHangingIndent
const old1 = '  const existingInds = Array.from(pPr.getElementsByTagNameNS(W_NS, \'ind\'));';
const new1 = '  // 物理清除任何继承的自动编号属性 (numPr)，杜绝 Word/WPS 动态编号与静态序号双重渲染 (REQ-S3-DUP-PURGE)\n  const existingNumPrs = Array.from(pPr.getElementsByTagNameNS(W_NS, \'numPr\'));\n  existingNumPrs.forEach(node => pPr.removeChild(node));\n  const localNumPrs = Array.from(pPr.getElementsByTagName(\'numPr\'));\n  localNumPrs.forEach(node => pPr.removeChild(node));\n\n  const existingInds = Array.from(pPr.getElementsByTagNameNS(W_NS, \'ind\'));';
if (!code.includes(old1)) { console.error('old1 not found'); process.exit(1); }
code = code.replace(old1, new1);

// 2. In healAllTableTopologies
const old2 = 'export function healAllTableTopologies(docXml) {\n  if (!docXml) return;';
const new2 = 'export function healAllTableTopologies(docXml) {\n  if (!docXml) return;\n  // 全局物理清除所有表格内的 <w:numPr> 自动编号属性 (REQ-S3-DUP-PURGE)\n  // 杜绝从原始母版残留的列表定义在 Word 中触发自动编号叠加导致序号重复 (如 3.1 3.1)\n  const numPrs = Array.from(docXml.getElementsByTagNameNS(W_NS, \'numPr\'));\n  for (const np of numPrs) {\n    np.parentNode?.removeChild(np);\n  }\n  const localNumPrs = Array.from(docXml.getElementsByTagName(\'numPr\'));\n  for (const np of localNumPrs) {\n    np.parentNode?.removeChild(np);\n  }';
if (!code.includes(old2)) { console.error('old2 not found'); process.exit(1); }
code = code.replace(old2, new2);

// 3. In formatSection9LabelCell
const old3 = '  const p = ps[0];\n  // 物理清除第一段之外的所有多余段落';
const new3 = '  const p = ps[0];\n  // 清除段落上残留的 numPr 自动编号定义 (REQ-S3-DUP-PURGE)\n  const pNumPrs = Array.from(p.getElementsByTagNameNS(W_NS, \'numPr\'));\n  pNumPrs.forEach(n => n.parentNode?.removeChild(n));\n  // 物理清除第一段之外的所有多余段落';
if (!code.includes(old3)) { console.error('old3 not found'); process.exit(1); }
code = code.replace(old3, new3);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/docx_engine_proposed.js', code, 'utf8');
console.log('Successfully prepared docx_engine_proposed.js');
