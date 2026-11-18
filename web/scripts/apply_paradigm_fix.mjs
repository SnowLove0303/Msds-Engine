import fs from 'node:fs/promises';

async function main() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(p, 'utf-8');

  // 1. Fix detectSection11Paradigm knownComponentKeywords
  content = content.replace(
    `const knownComponentKeywords = [\n    '分散体', '丙二醇丁醚', '二乙二醇丁醚', '聚合物', '溶剂', '添加剂'\n  ];`,
    `const knownComponentKeywords = [\n    '丙二醇丁醚', '二乙二醇丁醚', '溶剂', '添加剂'\n  ];`
  );

  // 2. Align enS11Paradigm directly with Chinese Section 11 topology
  content = content.replace(
    `const enS11Paradigm = isMultiComponent ? 'PARADIGM_1_FULL_WIDTH_MERGED' : detectSection11Paradigm(facts?.section11 || baseCnEngine?.records?.find(r => r.sectionNumber === 11) || null);`,
    `const cnS11ForCheck = baseCnEngine?.records?.find(r => r.sectionNumber === 11);
    const isCnS11FullWidth = cnS11ForCheck && cnS11ForCheck.rows.length === 4 && cnS11ForCheck.rows[3]?.cells?.length === 1;
    const enS11Paradigm = (isMultiComponent || isCnS11FullWidth) ? 'PARADIGM_1_FULL_WIDTH_MERGED' : 'PARADIGM_2_STANDARD_SLOTS';`
  );

  // 3. Fix line 3001 in buildBaseEnglishEngine
  content = content.replace(
    `const enS11Paradigm = isMultiComponent ? 'PARADIGM_1_FULL_WIDTH_MERGED' : detectSection11Paradigm(facts?.section11 || baseCnEngine?.records?.find(r => r.sectionNumber === 11) || null);\n  if (s11 && (isMultiComponent || enS11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED')) {`,
    `const cnS11ForCheck2 = baseCnEngine?.records?.find(r => r.sectionNumber === 11);
  const isCnS11FullWidth2 = cnS11ForCheck2 && cnS11ForCheck2.rows.length === 4 && cnS11ForCheck2.rows[3]?.cells?.length === 1;
  const enS11Paradigm = (isMultiComponent || isCnS11FullWidth2) ? 'PARADIGM_1_FULL_WIDTH_MERGED' : 'PARADIGM_2_STANDARD_SLOTS';
  if (s11 && (isMultiComponent || enS11Paradigm === 'PARADIGM_1_FULL_WIDTH_MERGED')) {`
  );

  await fs.writeFile(p, content, 'utf-8');
  console.log('✅ Applied Section 11 paradigm alignment in pipeline-engine.js');
}
main().catch(err => console.error(err));
