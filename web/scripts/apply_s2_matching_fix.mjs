import fs from 'fs';

let content = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\web\\src\\smart-matching.js', 'utf8');

// 1. Update Section 2 compound block check in smart-matching.js
const oldS2Check = `        // Section 2 专属：单/双单元格复合块前置解耦 (Decouple Section 2 Compound Blocks)
        if (s === 2) {
          const s2TargetText = !cell1 ? cellText : \`\${cell0.text || ''}\\n\${cell1.text || ''}\`.trim();
          if (/(?:2\\.\\d+|物质或混合物分类|GHS危险性类别|标签要素)/i.test(s2TargetText)) {
            const decoupledS2 = decoupleSection2CompoundBlocks(s2TargetText, row);
            if (decoupledS2.length > 0) {
              rawPairs.push(...decoupledS2);
              if (decoupledS2.some((d) => d.isCompoundS2)) isCompoundS2 = true;
              continue;
            }
          }
        }`;

const newS2Check = `        // Section 2 专属：单/双单元格复合块前置解耦 (Decouple Section 2 Compound Blocks)
        // 关键防护：仅当为单单元格行 (!cell1) 或一个单元格/行中混合了 2 个及以上子标签时才作为复合块解耦；
        // 对于标准双列 (cell0 标签 + cell1 值) 且非混合的规整行，绝不可误入复合解耦，避免误判冲突！
        if (s === 2) {
          const isSingleCell = !cell1;
          const multiTagMatches = \`\${cell0.text || ''}\\n\${cell1?.text || ''}\`.match(/(?:2\\.\\d+|物质或混合物分类|GHS危险性类别|标签要素)/gi) || [];
          const isCompoundBlock = isSingleCell || multiTagMatches.length >= 2;

          if (isCompoundBlock) {
            const s2TargetText = !cell1 ? cellText : \`\${cell0.text || ''}\\n\${cell1.text || ''}\`.trim();
            if (/(?:2\\.\\d+|物质或混合物分类|GHS危险性类别|标签要素)/i.test(s2TargetText)) {
              const decoupledS2 = decoupleSection2CompoundBlocks(s2TargetText, row);
              if (decoupledS2.length > 0) {
                rawPairs.push(...decoupledS2);
                if (decoupledS2.some((d) => d.isCompoundS2)) isCompoundS2 = true;
                continue;
              }
            }
          }
        }`;

if (!content.includes(oldS2Check)) {
  throw new Error('oldS2Check not matched');
}
content = content.replace(oldS2Check, newS2Check);

// 2. Allow REVIEW_AMBIGUOUS values to be populated with best-effort sanitization instead of deleting row
const oldPopulate = `        if (matchedItem && (matchedItem.status === 'MATCHED' || matchedItem.status === 'NOT_APPLICABLE') && matchedItem.value && matchedItem.value.trim()) {
          const valCell = tRow.cells?.[1] || (tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null);
          if (valCell && valCell.editable && valCell.kind !== 'label-only') {
            try {
              writeCellValue(valCell, matchedItem.value, editorEngine.roleStyles?.value);
              injectedCount++;
              populatedRowIndices.add(rIdx);
            } catch (e) {}
          }
        }`;

const newPopulate = `        if (matchedItem && (matchedItem.status === 'MATCHED' || matchedItem.status === 'NOT_APPLICABLE' || matchedItem.status === 'REVIEW_AMBIGUOUS') && matchedItem.value && matchedItem.value.trim()) {
          const valCell = tRow.cells?.[1] || (tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null);
          if (valCell && valCell.editable && valCell.kind !== 'label-only') {
            try {
              let finalVal = matchedItem.value;
              if (matchedItem.status === 'REVIEW_AMBIGUOUS' && matchedItem.conflicts && matchedItem.conflicts.length > 0) {
                const validCat = matchedItem.conflicts.find(c => /生殖毒性|类别|Cat|易燃|刺激|腐蚀|不属于/i.test(c));
                if (validCat) finalVal = validCat;
              }
              writeCellValue(valCell, finalVal, editorEngine.roleStyles?.value);
              injectedCount++;
              populatedRowIndices.add(rIdx);
            } catch (e) {}
          }
        }`;

if (!content.includes(oldPopulate)) {
  throw new Error('oldPopulate not matched');
}
content = content.replace(oldPopulate, newPopulate);

fs.writeFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\web\\src\\smart-matching.js', content, 'utf8');
console.log('Successfully updated smart-matching.js');
