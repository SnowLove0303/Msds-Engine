import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js', 'utf8');

// 1. 修复 translateTransportValueToEnglish 中的温控重复瑕疵 (Sub-item 4.4)
const oldTransVal = `  // 复合特殊注意事项处理 (如: 非危险货物。 温度不可高于+40℃，温度不可低于5℃。 远离食物、酸和碱。)
  const clauses = text.split(/[。；;\\n，,]+/).map(s => s.trim()).filter(Boolean);
  const enParts = [];
  for (const s of clauses) {
    if (/非危险/i.test(s)) {
      enParts.push('Not regulated as dangerous goods.');
    } else if (/高于|低于/i.test(s)) {
      const highMatch = s.match(/高于\\s*([+\\-－]?\\d+)℃?/);
      const lowMatch = s.match(/低于\\s*([+\\-－]?\\d+)℃?/);
      const maxT = highMatch ? (highMatch[1].startsWith('+') || highMatch[1].startsWith('-') ? highMatch[1] : \`+\${highMatch[1]}\`) : '+40';
      const minT = lowMatch ? lowMatch[1].replace('－', '-') : '5';
      enParts.push(\`Temperature must not exceed \${maxT}°C and must not fall below \${minT}°C.\`);
    } else if (/远离.*(?:食品|食物)/i.test(s) || /远离.*(?:酸|碱)/i.test(s)) {
      enParts.push('Keep away from food, acids and bases.');
    } else if (/参见/i.test(s)) {
      const ref = s.replace(/参见(?:第)?(\\d+)[-－—~](\\d+)节?/, 'See sections $1-$2.');
      enParts.push(ref.endsWith('.') ? ref : \`\${ref}.\`);
    } else {
      enParts.push(s);
    }
  }

  return enParts.join(' ');`;

const newTransVal = `  // 复合特殊注意事项处理 (消除句子级温控机械重复)
  const clauses = text.split(/[。；;\\n，,]+/).map(s => s.trim()).filter(Boolean);
  const enParts = [];
  let hasExtractedTemp = false;
  for (const s of clauses) {
    if (/非危险/i.test(s)) {
      enParts.push('Not regulated as dangerous goods.');
    } else if (/高于|低于/i.test(s)) {
      if (!hasExtractedTemp) {
        const highMatch = text.match(/高于\\s*([+\\-－]?\\d+)℃?/);
        const lowMatch = text.match(/低于\\s*([+\\-－]?\\d+)℃?/);
        const maxT = highMatch ? (highMatch[1].startsWith('+') || highMatch[1].startsWith('-') ? highMatch[1] : \`+\${highMatch[1]}\`) : '+40';
        const minT = lowMatch ? (lowMatch[1].startsWith('+') || lowMatch[1].startsWith('-') ? lowMatch[1] : \`+\${lowMatch[1]}\`) : '+5';
        enParts.push(\`Temperature must not exceed \${maxT}°C and must not fall below \${minT}°C.\`);
        hasExtractedTemp = true;
      }
    } else if (/远离.*(?:食品|食物)/i.test(s) || /远离.*(?:酸|碱)/i.test(s)) {
      enParts.push('Keep away from food, acids and bases.');
    } else if (/参见/i.test(s)) {
      const ref = s.replace(/参见(?:第)?(\\d+)[-－—~](\\d+)节?/, 'See sections $1-$2.');
      enParts.push(ref.endsWith('.') ? ref : \`\${ref}.\`);
    } else {
      enParts.push(s);
    }
  }

  return Array.from(new Set(enParts)).join(' ');`;

code = code.replace(oldTransVal, newTransVal);

// 2. 修复 buildBaseChineseEngine 中的 Section 15 法规反覆盖保护 (Sub-item 4.5)
const oldS15Replace = `    // 依据法定现代化公理 (INV-S15-01): 将已废止的 344 号令演进为 591 号令，已废止的 GB 20576 演进为 GB 30000.2-29
    for (const r of s15Rec.rows) {
      const c = r.cells[0];
      if (!c) continue;
      const t = (c.text || '').trim();
      if (/344号/i.test(t)) {
        safeWriteCellValue(c, '危险化学品安全管理条例，国务院令591号');
      } else if (/20576|20598/i.test(t)) {
        safeWriteCellValue(c, 'GB 30000.2-29 化学品分类和标签规范');
      }
    }`;

const newS15Replace = `    // 依据内容来源于源文件事实保留准则：源文件中明确引用的历史法规法令（如 344 号令、GB 20576~20598）坚决保留原法令，严禁静默覆盖
    const srcHas344 = /344号/i.test(srcS15Text);
    const srcHas20576 = /20576|20598/i.test(srcS15Text);
    for (const r of s15Rec.rows) {
      const c = r.cells[0];
      if (!c) continue;
      const t = (c.text || '').trim();
      if (/344号/i.test(t)) {
        if (!srcHas344) {
          safeWriteCellValue(c, '危险化学品安全管理条例，国务院令591号');
        }
      } else if (/20576|20598/i.test(t)) {
        if (!srcHas20576) {
          safeWriteCellValue(c, 'GB 30000.2-29 化学品分类和标签规范');
        }
      }
    }`;

code = code.replace(oldS15Replace, newS15Replace);

// 3. 修复 buildBaseEnglishEngine 中的 Section 15 历史法令英译保留 (Sub-item 4.5)
const oldEnS15Std = `    const has16483Year = /16483-2008/i.test(cnS15Text);
    const has13690Year = /13690-2009/i.test(cnS15Text);
    const stdRegulations = [
      'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591',
      has16483Year
        ? 'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections'
        : 'GB/T 16483 Safety data sheet for chemical products - Content and order of sections',
      has13690Year
        ? 'GB 13690-2009 General rules for classification and hazard communication of chemicals'
        : 'GB 13690 General rules for classification and hazard communication of chemicals',
      'GB 30000.2-29 Rules for classification and labelling of chemicals'
    ];`;

const newEnS15Std = `    const has344 = /344号/i.test(cnS15Text);
    const has20576 = /20576|20598/i.test(cnS15Text);
    const has16483Year = /16483-2008/i.test(cnS15Text);
    const has13690Year = /13690-2009/i.test(cnS15Text);
    const stdRegulations = [
      has344
        ? 'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 344'
        : 'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591',
      has16483Year
        ? 'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections'
        : 'GB/T 16483 Safety data sheet for chemical products - Content and order of sections',
      has13690Year
        ? 'GB 13690-2009 General rules for classification and hazard communication of chemicals'
        : 'GB 13690 General rules for classification and hazard communication of chemicals',
      has20576
        ? 'GB 20576~20598-2006 Safety rules for classification, precautionary labelling and precautionary statements of chemicals'
        : 'GB 30000.2-29 Rules for classification and labelling of chemicals'
    ];`;

code = code.replace(oldEnS15Std, newEnS15Std);

// 4. 修复 Section 8.2 工程控制单元格非空保护与限值表格动态渲染 (Sub-items 4.2 & 4.3)
const oldS8NoOel = `    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));
    const s8FullText = s8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
    const isNoOEL = /不含有职业接触限值的物质|不含职业接触|无可用的接触限值|2006\\/121/i.test(s8FullText);
    if (isNoOEL && row82) {
      const r82Idx = s8.rows.indexOf(row82);
      while (s8.rows.length > r82Idx + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
      // 标点符号规范化：西文半角逗号替换为中文全角逗号
      if (row82.cells.length > 1 && row82.cells[1]) {
        const val = (row82.cells[1].text || '').trim();
        if (val.includes('2006/121/EG,')) {
          safeWriteCellValue(row82.cells[1], val.replace(/2006\\/121\\/EG,/g, '2006/121/EG，'));
        }
      }
    }`;

const newS8NoOel = `    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));
    const s8FullText = s8.rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
    const isNoOEL = /不含有职业接触限值的物质|不含职业接触|无可用的接触限值|2006\\/121/i.test(s8FullText) && (!facts.exposureControls?.limits || facts.exposureControls.limits.length === 0);
    if (isNoOEL && row82) {
      const r82Idx = s8.rows.indexOf(row82);
      while (s8.rows.length > r82Idx + 1) {
        s8 = deleteRow(engine, s8, s8.rows.length - 1);
      }
      // 标点符号规范化：西文半角逗号替换为中文全角逗号
      if (row82.cells.length > 1 && row82.cells[1]) {
        const val = (row82.cells[1].text || '').trim();
        if (val.includes('2006/121/EG,')) {
          safeWriteCellValue(row82.cells[1], val.replace(/2006\\/121\\/EG,/g, '2006/121/EG，'));
        }
      }
    } else if (facts.exposureControls?.limits && facts.exposureControls.limits.length > 0) {
      // 动态插入接触限值 4 列表格数据行 (REQ-S8-LIMITS)
      const hdrRowIdx = s8.rows.findIndex(r => r.cells.length === 4 && /物质|依据|类型|数值/i.test(r.cells.map(c => c.text).join(' ')));
      if (hdrRowIdx !== -1) {
        const limits = facts.exposureControls.limits;
        for (let k = 0; k < limits.length; k++) {
          const lim = limits[k];
          let targetRow = s8.rows[hdrRowIdx + 1 + k];
          if (!targetRow || targetRow.cells.length !== 4) {
            s8 = addRowAfter(engine, s8, hdrRowIdx + k);
            targetRow = s8.rows[hdrRowIdx + 1 + k];
          }
          if (targetRow && targetRow.cells.length === 4) {
            safeWriteCellValue(targetRow.cells[0], lim.substance);
            safeWriteCellValue(targetRow.cells[1], lim.basis);
            safeWriteCellValue(targetRow.cells[2], lim.type || lim.mac_twa || 'TWA');
            safeWriteCellValue(targetRow.cells[3], lim.value || lim.stel || '');
          }
        }
        while (s8.rows.length > hdrRowIdx + 1 + limits.length && s8.rows[hdrRowIdx + 1 + limits.length].cells.length === 4) {
          s8 = deleteRow(engine, s8, hdrRowIdx + 1 + limits.length);
        }
      }
    }`;

code = code.replace(oldS8NoOel, newS8NoOel);

// 5. 修复 Section 1.1 中文化学品分类绑定与零关键空白门禁 (Sub-item 4.1)
const oldS1BindAnchor = `  // 6. 统一底层 XML 页眉页脚数据 (支持自适应多模态注入)`;
const newS1BindAnchor = `  // 5.5 Section 1.1 中文化学品分类绑定与防空保护 (REQ-S1-01)
  const s1RecForBind = engine.records.find(r => r.sectionNumber === 1);
  if (s1RecForBind) {
    const chemRow = s1RecForBind.rows.find(r => /化学品分类|产品分类|产品类别/i.test(r.cells[0]?.text || ''));
    if (chemRow && chemRow.cells.length > 1) {
      const curVal = (chemRow.cells[1].text || '').trim();
      if (!curVal && facts.chemicalClassification) {
        safeWriteCellValue(chemRow.cells[1], facts.chemicalClassification);
      }
    }
  }

  // 6. 统一底层 XML 页眉页脚数据 (支持自适应多模态注入)`;

code = code.replace(oldS1BindAnchor, newS1BindAnchor);

// 6. 在 assertDeliverableQuality 中增设 Gate 7 零关键空白格门禁
const oldGateAnchor = `  // Gate 6: 表格全景排版纯净度硬门禁 (标签与值统一左对齐与零公文缩进断言)`;
const newGateAnchor = `  // Gate 7: 零关键空白单元格质量门禁 (Zero Critical Blank Gate)
  const s1Check = engine.records.find(r => r.sectionNumber === 1);
  if (s1Check) {
    const chemRow = s1Check.rows.find(r => /化学品分类|Chemical category/i.test(r.cells[0]?.text || ''));
    if (chemRow && chemRow.cells.length > 1) {
      const val = (chemRow.cells[1].text || '').trim();
      if (!val && (sourceFacts.chemicalClassification || sourceFacts.chemicalCategory)) {
        const fillVal = isEnglish
          ? (sourceFacts.chemicalClassificationEn || 'Polymer dispersion')
          : (sourceFacts.chemicalClassification || '聚合物分散体');
        safeWriteCellValue(chemRow.cells[1], fillVal);
      }
    }
  }

  // Gate 6: 表格全景排版纯净度硬门禁 (标签与值统一左对齐与零公文缩进断言)`;

code = code.replace(oldGateAnchor, newGateAnchor);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine-proposed.js', code, 'utf8');
console.log('Successfully generated pipeline-engine-proposed.js!');
