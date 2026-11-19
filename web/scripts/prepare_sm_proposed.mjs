import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching.js', 'utf8');

// 1. 在 SECTION_SLOT_REGISTRY 附近或顶部确保 UN_PROPER_SHIPPING_NAMES 导入或定义
if (!code.includes('UN_PROPER_SHIPPING_NAMES')) {
  const topAnchor = `// Section 1~16 标准槽位定义与全面中英双语别名库`;
  const unDef = `// 联合国危险货物正式运输名称中英标准目录
export const UN_PROPER_SHIPPING_NAMES = Object.freeze({
  '1866': { cn: '树脂溶液，易燃', en: 'RESIN SOLUTION, flammable' },
  '1993': { cn: '易燃液体，未另作规定的', en: 'FLAMMABLE LIQUID, N.O.S.' },
  '1263': { cn: '油漆或油漆相关材料', en: 'PAINT or PAINT RELATED MATERIAL' },
  '1139': { cn: '保护层防护液', en: 'COATING SOLUTION' }
});\n\n`;
  code = code.replace(topAnchor, unDef + topAnchor);
}

// 2. 在 applyMatchResultToEditor 中增加既有事实不可否定公理 (hasGhsInhalation)
const oldPruneInh = `          const isSingleHazardousOrPu = targetModel === 'PU-202A' || (matchedSec.matchedRows.some(r => /940|豚鼠/i.test(r.value || '')));
          if (oralItem && !inhItem && inhRow && !isSingleHazardousOrPu) {
            try { const updated = deleteRow(editorEngine, tRecord, tRecord.rows.indexOf(inhRow)); if (updated) tRecord = updated; } catch (e) {}
          }`;

const newPruneInh = `          const isSingleHazardousOrPu = targetModel === 'PU-202A' || (matchedSec.matchedRows.some(r => /940|豚鼠/i.test(r.value || '')));
          // 既有事实不可否定公理：若产品在 Section 2 明确存在吸入急性毒性分类，绝不可误删吸入行
          const hasGhsInhalation = editorEngine.records?.some(r => r.sectionNumber === 2 && r.rows?.some(row => row.cells?.some(c => /急性毒性.*吸入/i.test(c.text || ''))));
          if (oralItem && !inhItem && inhRow && !isSingleHazardousOrPu && !hasGhsInhalation) {
            try { const updated = deleteRow(editorEngine, tRecord, tRecord.rows.indexOf(inhRow)); if (updated) tRecord = updated; } catch (e) {}
          }`;

code = code.replace(oldPruneInh, newPruneInh);

// 3. 在 matchContext1ToTemplateTopology 中增加 1.1_chemical_classification 与 categories 数组支持
const oldS1Slots = `        slots.push({
          slotKey: '1.1_recommended_use',
          label: isEnglish ? 'Recommended use' : '推荐用途',
          value: facts.recommendedUse || secFacts['推荐用途'] || '工业涂料用树脂',
          semanticType: 'CHILD_LABEL',
          sourceOrigin: 'source_grounded'
        });`;

const newS1Slots = `        slots.push({
          slotKey: '1.1_recommended_use',
          label: isEnglish ? 'Recommended use' : '推荐用途',
          value: facts.recommendedUse || secFacts['推荐用途'] || '工业涂料用树脂',
          semanticType: 'CHILD_LABEL',
          sourceOrigin: 'source_grounded'
        });
        if (facts.chemicalClassification || secFacts['化学品分类'] || secFacts['产品类别']) {
          slots.push({
            slotKey: '1.1_chemical_classification',
            label: isEnglish ? 'Chemical category' : '化学品分类',
            value: isEnglish ? (facts.chemicalClassificationEn || facts.chemicalClassification || 'Polymer dispersion') : (facts.chemicalClassification || '聚合物分散体'),
            semanticType: 'CHILD_LABEL',
            sourceOrigin: 'source_grounded'
          });
        }`;

code = code.replace(oldS1Slots, newS1Slots);

const oldS2Cat = `          slots.push({
            slotKey: '2.1_ghs_classification',
            label: isEnglish ? 'GHS classification' : 'GHS危险性类别',
            value: facts.ghs?.classification || secFacts['GHS危险性类别'] || '',
            semanticType: 'CHILD_LABEL',
            sourceOrigin: 'source_grounded'
          });`;

const newS2Cat = `          const catVal = Array.isArray(facts.ghs?.categories) && facts.ghs.categories.length > 0
            ? facts.ghs.categories.join('\\n')
            : (facts.ghs?.classification || secFacts['GHS危险性类别'] || '');
          slots.push({
            slotKey: '2.1_ghs_classification',
            label: isEnglish ? 'GHS classification' : 'GHS危险性类别',
            value: catVal,
            semanticType: 'CHILD_LABEL',
            sourceOrigin: 'source_grounded'
          });`;

code = code.replace(oldS2Cat, newS2Cat);

// 4. 在 matchContext1ToDynamicTemplateTopology 中增加 chemical_classification 与 shipping_name 治理
const oldDynShip = `          case 'shipping_name':
            resolvedValue = facts.transport?.shippingName || (isEnglish ? 'Not classified as dangerous goods' : '非危险化学品运输名称');
            sourceOrigin = 'source_grounded';
            break;`;

const newDynShip = `          case 'chemical_classification':
          case 'chemical_category':
          case 'product_type':
            resolvedValue = isEnglish
              ? (facts.chemicalClassificationEn || facts.chemicalCategoryEn || facts.chemicalClassification || '')
              : (facts.chemicalClassification || facts.chemicalCategory || '');
            sourceOrigin = 'source_grounded';
            break;

          case 'shipping_name': {
            const cleanUn = String(facts.transport?.unNumber || '').replace(/\\D/g, '');
            const unProper = UN_PROPER_SHIPPING_NAMES[cleanUn];
            resolvedValue = isEnglish
              ? (facts.transport?.shippingNameEn && facts.transport.shippingNameEn !== 'CHEMICALS'
                  ? facts.transport.shippingNameEn
                  : (unProper?.en || facts.transport?.shippingName || 'Dangerous goods'))
              : (facts.transport?.shippingNameCn || unProper?.cn || facts.transport?.shippingName || '非危险化学品运输名称');
            sourceOrigin = 'source_grounded';
            break;
          }`;

code = code.replace(oldDynShip, newDynShip);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/smart-matching-proposed.js', code, 'utf8');
console.log('Successfully generated smart-matching-proposed.js!');
