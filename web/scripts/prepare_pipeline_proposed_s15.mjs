import fs from 'fs';

const origPath = 'web/src/pipeline-engine.js';
const origContent = fs.readFileSync(origPath, 'utf8');
const normalized = origContent.replace(/\r\n/g, '\n');

// 1. Chinese S15 Row 1-3 preservation
const target1Old = `  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258
  let s15Rec = engine.records.find(r => r.sectionNumber === 15);
  if (s15Rec) {
    const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);`;

const target1New = `  // 10.5 规范化 Section 15：源文件仅 4 部法规时，剔除底模外生强塞的 GB 15258
  let s15Rec = engine.records.find(r => r.sectionNumber === 15);
  if (s15Rec) {
    // 依据 REQ-S15-01: 确保 Row 1 恒久为官方法定子标题，严禁被源文档散文覆盖
    if (s15Rec.rows[1]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[1].cells[0], '物质或混合物的相关安全、健康和环保法律法规');
    }
    if (s15Rec.rows[2]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[2].cells[0], '其它的规定：');
    }
    if (s15Rec.rows[3]?.cells?.[0]) {
      safeWriteCellValue(s15Rec.rows[3].cells[0], '符合下列法规要求：');
    }

    const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);`;

// 2. English S15 Row 1-3 preservation
const target2Old = `    if (cnS15) {
      while (s15.rows.length > cnS15.rows.length) {
        s15 = deleteRow(engine, s15, s15.rows.length - 1);
      }
    }

    const has16483Year = /16483-2008/i.test(cnS15Text);`;

const target2New = `    if (cnS15) {
      while (s15.rows.length > cnS15.rows.length) {
        s15 = deleteRow(engine, s15, s15.rows.length - 1);
      }
    }

    // 依据 REQ-S15-03: 确保英文版 Row 1~3 恒久保全标准二级题头与西文标点 (杜绝 ': .')
    if (s15.rows[1]?.cells?.[0]) {
      safeWrite(s15.rows[1].cells[0], 'Relevant safety, health and environmental regulations for the substance or mixture');
    }
    if (s15.rows[2]?.cells?.[0]) {
      safeWrite(s15.rows[2].cells[0], 'Other provisions:');
    }
    if (s15.rows[3]?.cells?.[0]) {
      safeWrite(s15.rows[3].cells[0], 'Complies with the following regulations:');
    }

    const has16483Year = /16483-2008/i.test(cnS15Text);`;

// 3. Post-processing cleanup in enforceStructuralTypographyInvariants
const target3Old = `          if (isSubheader) {
            rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
            rPr.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
          }
        }
      }
    }
  }`;

const target3New = `          if (isSubheader) {
            rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
            rPr.appendChild(doc.createElementNS(W_NS, 'w:bCs'));
          }
        }
      }
    }
    if (isEn) {
      const allT = Array.from(doc.getElementsByTagNameNS(W_NS, 't'));
      for (const tNode of allT) {
        if (tNode.textContent && /[:：]\\s*\\./.test(tNode.textContent)) {
          tNode.textContent = tNode.textContent.replace(/[:：]\\s*\\./g, ':');
        }
      }
    }
  }`;

// 4. formatSingleCellRow cleanLabel
const target4Old = `  } else if (/^(?:Other provisions|Complies with the following regulations):?/i.test(text)) {
    // Section 15 单列子标题加粗，左对齐
    let cleanLabel = text.replace(/：/g, ':').trim();`;

const target4New = `  } else if (/^(?:Other provisions|Complies with the following regulations):?/i.test(text)) {
    // Section 15 单列子标题加粗，左对齐
    let cleanLabel = text.replace(/：/g, ':').replace(/[:：]\\s*\\./g, ':').trim();`;

if (!normalized.includes(target1Old)) {
  console.error('Target 1 Old not found!');
  process.exit(1);
}
if (!normalized.includes(target2Old)) {
  console.error('Target 2 Old not found!');
  process.exit(1);
}
if (!normalized.includes(target3Old)) {
  console.error('Target 3 Old not found!');
  process.exit(1);
}
if (!normalized.includes(target4Old)) {
  console.error('Target 4 Old not found!');
  process.exit(1);
}

let newContent = normalized.replace(target1Old, target1New);
newContent = newContent.replace(target2Old, target2New);
newContent = newContent.replace(target3Old, target3New);
newContent = newContent.replace(target4Old, target4New);

const isCRLF = origContent.includes('\r\n');
const finalContent = isCRLF ? newContent.replace(/\n/g, '\r\n') : newContent;

const propPath = 'web/src/pipeline-engine.proposed.js';
fs.writeFileSync(propPath, finalContent, 'utf8');
console.log('Successfully created ' + propPath);
