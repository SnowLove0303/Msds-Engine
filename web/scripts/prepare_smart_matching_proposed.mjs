import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalPath = path.resolve(__dirname, '../src/smart-matching.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_smart-matching.js');

let content = fs.readFileSync(originalPath, 'utf8');

// 1. Add import of getBenchmarkSpecsByCategory at the top
const importInsertion = `import {
  W_NS,`;

const newImport = `import { getBenchmarkSpecsByCategory } from './msds-db.js';
import {
  W_NS,`;

content = content.replace(importInsertion, newImport);

// 2. Add harmonizeWithBenchmarkDatabase right before applyMatchResultToEditor
const harmonizeFn = `/**
 * 同品类基准智能补充通用模块 (Universal Benchmark DB Harmonization)
 * 职责：
 * 1. 严格以源文件事实为最高准则（绝对禁止覆盖源文件已有的CAS、浓度、毒理端点等真实事实）；
 * 2. 仅在细分参数槽位缺失或为空时，从 benchmark_category_specs 数据库中受控补充标准合规参数；
 * 3. 涵盖 Section 8 (手套技术参数), Section 13 (法定处置原则), Section 15 (法规标准列表)；
 * 4. 补充记录显式标记 source: 'BENCHMARK_DB'，提供完全可审计的事实链条。
 */
export function harmonizeWithBenchmarkDatabase(matchResult, categoryCode = 'default') {
  if (!matchResult || !matchResult.matchedSections) return matchResult;

  const benchmark = getBenchmarkSpecsByCategory(categoryCode);
  if (!benchmark) return matchResult;

  const { ppeHandSpecs, wasteDisposalSpecs, regulatorySpecs } = benchmark;

  // 1. Section 8 PPE 手部防护参数受控补充
  const s8Sec = matchResult.matchedSections.find(s => s.sectionNumber === 8);
  if (s8Sec && ppeHandSpecs) {
    s8Sec.matchedRows = s8Sec.matchedRows || [];
    const gloveSpecs = [
      { key: 'ppe_gloves_fkm', label: '合适材料 – 氟化橡胶 – FKM：', val: ppeHandSpecs.fkm },
      { key: 'ppe_gloves_iir', label: '合适材料 – 丁基橡胶 – IIR：', val: ppeHandSpecs.iir },
      { key: 'ppe_gloves_nbr', label: '合适材料 – 丁腈橡胶 – NBR：', val: ppeHandSpecs.nbr },
      { key: 'ppe_gloves_recommendation', label: '建议：', val: ppeHandSpecs.recommendation }
    ];

    for (const g of gloveSpecs) {
      let existing = s8Sec.matchedRows.find(r => r.key === g.key || (r.standardLabel && r.standardLabel.includes(g.label.replace(/[:：]/g, ''))));
      if (!existing && g.val) {
        s8Sec.matchedRows.push({
          key: g.key,
          standardLabel: g.label,
          value: g.val,
          status: 'MATCHED',
          source: 'BENCHMARK_DB',
          confidence: 0.95
        });
      } else if (existing && !existing.value && g.val) {
        existing.value = g.val;
        existing.status = 'MATCHED';
        existing.source = 'BENCHMARK_DB';
      }
    }
  }

  // 2. Section 13 废弃处置原则受控补充
  const s13Sec = matchResult.matchedSections.find(s => s.sectionNumber === 13);
  if (s13Sec && wasteDisposalSpecs) {
    s13Sec.matchedRows = s13Sec.matchedRows || [];
    let generalLawRow = s13Sec.matchedRows.find(r => r.key === 'waste_general_law' || /法规|总则/i.test(r.standardLabel || ''));
    if (!generalLawRow && wasteDisposalSpecs.general_law_cn) {
      s13Sec.matchedRows.push({
        key: 'waste_general_law',
        standardLabel: '法规总则：',
        value: wasteDisposalSpecs.general_law_cn,
        status: 'MATCHED',
        source: 'BENCHMARK_DB',
        confidence: 0.95
      });
    }
    let methodsRow = s13Sec.matchedRows.find(r => r.key === 'waste_treatment_methods' || /处置方法/i.test(r.standardLabel || ''));
    if (methodsRow && wasteDisposalSpecs.methods_supplement_cn && !methodsRow.value.includes('倒空容器')) {
      methodsRow.value = \`\${methodsRow.value}\\n\${wasteDisposalSpecs.methods_supplement_cn}\`.trim();
    }
  }

  // 3. Section 15 法规清单受控补充
  const s15Sec = matchResult.matchedSections.find(s => s.sectionNumber === 15);
  if (s15Sec && regulatorySpecs?.regulations_cn) {
    s15Sec.matchedRows = s15Sec.matchedRows || [];
    let regList = s15Sec.matchedRows.filter(r => r.key?.startsWith('regulation_') || r.key === 'applicable_regulations');
    if (regList.length === 0) {
      regulatorySpecs.regulations_cn.forEach((reg, idx) => {
        s15Sec.matchedRows.push({
          key: \`regulation_\${idx + 1}\`,
          standardLabel: \`法规 \${idx + 1}：\`,
          value: reg,
          status: 'MATCHED',
          source: 'BENCHMARK_DB',
          confidence: 0.95
        });
      });
    }
  }

  return matchResult;
}

export function applyMatchResultToEditor(matchResult, editorEngine) {`;

content = content.replace('export function applyMatchResultToEditor(matchResult, editorEngine) {', harmonizeFn);

// 3. Inside applyMatchResultToEditor, call harmonizeWithBenchmarkDatabase
const targetCall = `  // 1. 全局身份戳记动态注入 (标题、页眉、页脚)
  const hf = matchResult?.headerFooter || {};`;

const targetCallWithHarmonize = `  // 0. 同品类基准库自动对齐补充 (针对非标/信息过少源文档消除空值行)
  const s1SecForHarmonize = matchResult?.matchedSections?.find((s) => s.sectionNumber === 1);
  const targetCategoryCode = matchResult?.fileNaming?.model ||
    s1SecForHarmonize?.matchedRows?.find((r) => r.key === 'model')?.value ||
    'default';
  harmonizeWithBenchmarkDatabase(matchResult, targetCategoryCode);

  // 1. 全局身份戳记动态注入 (标题、页眉、页脚)
  const hf = matchResult?.headerFooter || {};`;

content = content.replace(targetCall, targetCallWithHarmonize);

// 4. Update Section 1 handling in applyMatchResultToEditor
// In skipGenericInjection:
content = content.replace(
  'const skipGenericInjection = s === 3 || s === 11 || (s === 12 && !hasRealEndpoints12);',
  'const skipGenericInjection = s === 1 || s === 3 || s === 11 || (s === 12 && !hasRealEndpoints12);'
);

// Insert Section 1 specialized handling before Section 4 profile binding
const s1Specialized = `      // Section 1 模板专属双槽位精确映射 (Row 1 型号，Row 2 中文名称+型号)
      if (s === 1) {
        for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
          const tRow = tRecord.rows[rIdx];
          const cell0Text = (tRow.cells?.[0]?.text || tRow.cells?.[0]?.labelText || '').trim();
          const valCell = tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null;
          if (!valCell || !valCell.editable) continue;

          if (/1\\.1\\s*(?:产品名称|产品标识|Product\\s*name)/i.test(cell0Text)) {
            const modelVal = matchedSec.matchedRows.find(r => r.key === 'model')?.value || targetModel;
            if (modelVal) {
              writeCellValue(valCell, modelVal, editorEngine.roleStyles?.value);
              injectedCount++;
            }
          } else if (/中文名称|化学品中文名/i.test(cell0Text)) {
            let prodName = matchedSec.matchedRows.find(r => r.key === 'product_name')?.value || '';
            const modelVal = matchedSec.matchedRows.find(r => r.key === 'model')?.value || targetModel;
            if (prodName && modelVal && !prodName.includes(modelVal)) {
              prodName = \`\${prodName} \${modelVal}\`;
            }
            if (prodName) {
              prodName = prodName.replace(/(?<![A-Za-z0-9\\s])((?:PU|PA|OS|HPU)[-\\s]?\\d+[A-Za-z]?)/i, ' $1').trim();
              writeCellValue(valCell, prodName, editorEngine.roleStyles?.value);
              injectedCount++;
            }
          } else if (/化学品分类|化学品类别|Chemical\\s*category/i.test(cell0Text)) {
            const catVal = matchedSec.matchedRows.find(r => r.key === 'chemical_category')?.value || '';
            if (catVal) {
              writeCellValue(valCell, catVal, editorEngine.roleStyles?.value);
              injectedCount++;
            }
          } else if (/1\\.2\\s*(?:产品使用建议|使用建议|Product\\s*use)/i.test(cell0Text)) {
            const useVal = matchedSec.matchedRows.find(r => r.key === 'recommended_use')?.value || '';
            if (useVal) {
              writeCellValue(valCell, useVal, editorEngine.roleStyles?.value);
              injectedCount++;
            }
          }
        }
      }

      // Section 4 模板专属绑定 (CN Template Profile Binding)`;

content = content.replace('      // Section 4 模板专属绑定 (CN Template Profile Binding)', s1Specialized);

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Proposed smart-matching.js written successfully.');
