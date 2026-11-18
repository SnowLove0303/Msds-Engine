import fs from 'node:fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/universal-editor-primitives.js';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(
  "import { W_NS, DocxEngineError } from './docx-engine.js';",
  "import { W_NS, DocxEngineError, writeCellValue, updateHeaderFooterData } from './docx-engine.js';"
);

const oldFuncStart = 'export function bindEntityPresetToDocument(';
const idx = content.indexOf(oldFuncStart);
if (idx === -1) throw new Error('Not found oldFuncStart');

const newFunc = `export function bindEntityPresetToDocument(engineOrSession, preset, options = {}) {
  const engine = engineOrSession.engine || engineOrSession;
  if (!engine || !engine.records) {
    throw new DocxEngineError('无效的文档引擎实例', 'INVALID_ENGINE');
  }

  const isEn = options.isEnglish ?? (options.lang === 'en' || engine.language === 'en' || engineOrSession.isEnglish);
  const entityData = preset.entityData || preset.entity || preset;

  const companyName = isEn 
    ? (entityData.name_en || preset.name_en || preset.name)
    : (entityData.name_zh || preset.name_zh || preset.name);

  const shortName = isEn
    ? (entityData.shortName_en || preset.shortName_en || entityData.shortName || preset.shortName || companyName)
    : (entityData.shortName_zh || preset.shortName_zh || entityData.shortName || preset.shortName || companyName);

  const address = isEn
    ? (entityData.address_en || preset.address_en || entityData.address || preset.address || '')
    : (entityData.address_zh || preset.address_zh || entityData.address || preset.address || '');

  const tel = entityData.tel || preset.tel || '';
  const fax = entityData.fax || preset.fax || '';
  const emergencyPhone = isEn
    ? (entityData.emergencyTel_en || preset.emergencyTel_en || entityData.emergencyPhone || preset.emergencyPhone || tel)
    : (entityData.emergencyTel_zh || preset.emergencyTel_zh || entityData.emergencyPhone || preset.emergencyPhone || tel);

  const appliedSlots = [];

  const setVal = (cell, text, slot) => {
    if (!cell) return;
    cell.text = text;
    if (cell.node) {
      if (!cell.editable) cell.editable = true;
      try {
        writeCellValue(cell, text);
      } catch (e) {}
    }
    appliedSlots.push({ slot, value: text });
  };

  // 1. 注入 Section 1 (化学品及企业标识)
  const s1 = (engine.records || []).find(r => r.sectionNumber === 1);
  if (s1 && Array.isArray(s1.rows)) {
    for (const row of s1.rows) {
      const labelCell = row.cells?.[0];
      const valCell = row.cells?.[1];
      if (!valCell) continue;

      const lbl = (labelCell?.text || labelCell?.labelText || '').trim();
      if (/供应商名称|Company\\s*name|Manufacturer|Name\\s*of\\s*supplier|制造商/i.test(lbl)) {
        setVal(valCell, companyName, 'COMPANY_NAME');
      } else if (/供应商地址|地址|Address/i.test(lbl)) {
        setVal(valCell, address, 'COMPANY_ADDRESS');
      } else if (/应急电话|应急咨询电话|Emergency\\s*telephone|Emergency\\s*phone/i.test(lbl)) {
        setVal(valCell, emergencyPhone, 'EMERGENCY_TEL');
      } else if (/电话|Telephone|Phone|\\bTel\\b/i.test(lbl)) {
        setVal(valCell, tel, 'COMPANY_TEL');
      } else if (/传真|Fax/i.test(lbl)) {
        setVal(valCell, fax, 'COMPANY_FAX');
      }
    }
  }

  // 2. 注入 Section 16 免责声明落款
  const s16 = (engine.records || []).find(r => r.sectionNumber === 16);
  if (s16 && Array.isArray(s16.rows)) {
    for (const row of s16.rows) {
      for (const cell of row.cells || []) {
        if (cell.text && /广州冠志|英德国彩/i.test(cell.text)) {
          const updated = cell.text.replace(/广州冠志新材料科技有限公司|英德市国彩精细化工有限公司|英德市国彩新材料有限公司/g, companyName);
          setVal(cell, updated, 'DISCLAIMER_SIGNATURE');
        }
      }
    }
  }

  // 3. 更新页脚与页眉元数据
  try {
    updateHeaderFooterData(engine, {
      model: options.modelCode,
      company: companyName,
      title: isEn ? 'MATERIAL SAFETY DATA SHEET' : '物料安全数据表',
      version: 'V1.0',
      docCode: options.modelCode ? \`\${options.modelCode}-MSDS\` : undefined,
      revisionDate: options.revisionDate,
      language: isEn ? 'EN' : 'CN',
      entity: shortName,
      shortName
    });
  } catch (e) {}

  if (engine.headerFooterData || engine.updateHeaderFooterData) {
    const hfUpdates = {
      company: companyName,
      shortName,
      entity: shortName
    };
    if (options.modelCode) hfUpdates.model = options.modelCode;
    if (options.revisionDate) hfUpdates.revisionDate = options.revisionDate;
    if (typeof engine.updateHeaderFooterData === 'function') {
      engine.updateHeaderFooterData(hfUpdates);
    } else if (engine.headerFooterData) {
      Object.assign(engine.headerFooterData, hfUpdates);
    }
  }

  return {
    success: true,
    companyName,
    shortName,
    appliedSlotsCount: appliedSlots.length,
    appliedSlots
  };
}
`;

const newContent = content.slice(0, idx) + newFunc;
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_universal_editor_primitives.js', newContent, 'utf8');
console.log('Successfully prepared proposed content!');
