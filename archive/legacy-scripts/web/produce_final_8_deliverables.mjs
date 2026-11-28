import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  loadDocx,
  writeCellLabel,
  writeCellValue,
  applyStandardHangingIndent,
  addRowAfter,
  deleteRow,
  renumberRecord,
  updateHeaderFooterData
} from './src/docx-engine.js';
import { ENTITY_MATRIX } from './src/pipeline-engine.js';
import { convertBatchDocxToPdf } from './src/pdf-converter.js';

async function main() {
  const modelCode = 'OS-8970';
  const cnGuanzhiPath = 'E:/冠志/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/水性噁唑啉交联剂/OS-8970 msds_CN 冠志.docx';
  const targetDirE = 'E:/冠志/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/水性噁唑啉交联剂';
  const targetDirEngine = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/OS-8970';

  console.log('1. Loading user hand-crafted CN Guanzhi baseline...');
  const cnGuanzhiBuf = await fs.readFile(cnGuanzhiPath);
  const cnGuanzhiEngine = await loadDocx(cnGuanzhiBuf, `${modelCode} msds_CN 冠志.docx`);

  console.log('2. Deriving CN Guocai from user baseline...');
  const cnGuocaiBuf = await cnGuanzhiEngine.exportArrayBuffer();
  const cnGuocaiEngine = await loadDocx(cnGuocaiBuf, `${modelCode} msds_CN 国彩.docx`);
  updateHeaderFooterData(cnGuocaiEngine, {
    model: modelCode,
    company: ENTITY_MATRIX.GUOCAI.cn.name,
    title: '物料安全数据表',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: '2026/10/20',
    language: 'CN',
    entity: '国彩'
  });
  const s1CnGuocai = cnGuocaiEngine.records.find(r => r.sectionNumber === 1);
  if (s1CnGuocai) {
    for (const row of s1CnGuocai.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/供应商名称/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.cn.name);
      else if (/供应商地址/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.cn.address);
      else if (/电话/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.cn.tel);
      else if (/传真/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.cn.fax);
    }
  }

  console.log('3. Building Base EN Guanzhi 100% symmetrically matching user CN structure...');
  const enTplBuf = await fs.readFile('./public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const enGuanzhiEngine = await loadDocx(enTplBuf, `${modelCode} msds_EN Guanzhi.docx`);
  updateHeaderFooterData(enGuanzhiEngine, {
    model: modelCode,
    company: ENTITY_MATRIX.GUANZHI.en.name,
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: '2026/10/20',
    language: 'EN',
    entity: '冠志'
  });

  // Section 1 EN
  const s1En = enGuanzhiEngine.records.find(r => r.sectionNumber === 1);
  if (s1En) {
    writeCellValue(s1En.rows[1].cells[1], `Waterborne oxazoline crosslinker ${modelCode}`);
    writeCellValue(s1En.rows[2].cells[1], 'Oxazoline-modified acrylic polymer');
    writeCellValue(s1En.rows[3].cells[1], 'Additive for coatings, inks, and adhesives');
    writeCellValue(s1En.rows[5].cells[1], ENTITY_MATRIX.GUANZHI.en.name);
    writeCellValue(s1En.rows[6].cells[1], ENTITY_MATRIX.GUANZHI.en.address);
    writeCellValue(s1En.rows[7].cells[1], ENTITY_MATRIX.GUANZHI.en.tel);
    writeCellValue(s1En.rows[8].cells[1], ENTITY_MATRIX.GUANZHI.en.fax);
  }

  // Section 2 EN (Strictly 3 rows matching user CN: 2.1, 2.2, 2.3)
  let s2En = enGuanzhiEngine.records.find(r => r.sectionNumber === 2);
  while (s2En.rows.length < 4) s2En = addRowAfter(enGuanzhiEngine, s2En, s2En.rows.length - 1);
  while (s2En.rows.length > 4) s2En = deleteRow(enGuanzhiEngine, s2En, s2En.rows.length - 1);

  writeCellLabel(s2En.rows[1].cells[0], '2.1  Classification of the substance or mixture：', true);
  applyStandardHangingIndent(s2En.rows[1].cells[0], '457', '457', '459');
  writeCellValue(s2En.rows[1].cells[1], 'GHS hazard class:\nNot classified as a hazardous chemical according to GHS.');

  writeCellLabel(s2En.rows[2].cells[0], '2.2  GHS Label Elements：', true);
  applyStandardHangingIndent(s2En.rows[2].cells[0], '457', '457', '459');
  writeCellValue(s2En.rows[2].cells[1], 'GHS pictogram:\nNot classified as a hazardous chemical according to GHS.');

  writeCellLabel(s2En.rows[3].cells[0], '2.3  Other Hazards：', true);
  applyStandardHangingIndent(s2En.rows[3].cells[0], '457', '457', '459');
  writeCellValue(s2En.rows[3].cells[1], 'No applicable information.');

  // Section 3 EN (2 components matching user CN)
  let s3En = enGuanzhiEngine.records.find(r => r.sectionNumber === 3);
  while (s3En.rows.length < 6) s3En = addRowAfter(enGuanzhiEngine, s3En, s3En.rows.length - 1);
  while (s3En.rows.length > 6) s3En = deleteRow(enGuanzhiEngine, s3En, s3En.rows.length - 1);
  writeCellValue(s3En.rows[1].cells[1], 'Mixture');
  writeCellValue(s3En.rows[4].cells[0], 'Oxazoline-modified acrylic polymer');
  writeCellValue(s3En.rows[4].cells[1], 'Trade secret');
  writeCellValue(s3En.rows[4].cells[2], '20-30');
  writeCellValue(s3En.rows[5].cells[0], 'Water');
  writeCellValue(s3En.rows[5].cells[1], '7732-18-5');
  writeCellValue(s3En.rows[5].cells[2], '70-80');

  // Section 4 EN
  const s4En = enGuanzhiEngine.records.find(r => r.sectionNumber === 4);
  if (s4En) {
    writeCellValue(s4En.rows[1].cells[1], 'Remove all contaminated clothing immediately.');
    writeCellValue(s4En.rows[2].cells[1], 'Do NOT induce vomiting. Seek medical attention immediately.');
    writeCellValue(s4En.rows[3].cells[1], 'Hold eyelids open and flush with plenty of warm water for at least 10 minutes. Consult an ophthalmologist.');
    writeCellValue(s4En.rows[4].cells[1], 'Wash immediately with plenty of soap and water. If skin reaction occurs, seek medical advice.');
    writeCellValue(s4En.rows[5].cells[1], 'If respiratory irritation occurs, seek medical advice.');
  }

  // Section 5 EN
  const s5En = enGuanzhiEngine.records.find(r => r.sectionNumber === 5);
  if (s5En) {
    writeCellValue(s5En.rows[1].cells[1], 'Carbon dioxide (CO2), foam, extinguishing powder. For large fires, use water spray.');
    writeCellValue(s5En.rows[2].cells[1], 'High volume water jet.');
    writeCellValue(s5En.rows[3].cells[1], 'Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide.\nDo not breathe fumes/smoke in case of fire or explosion.');
    writeCellValue(s5En.rows[4].cells[1], 'Firefighters must wear self-contained breathing apparatus.\nDo not allow contaminated fire-fighting water to enter soil, groundwater, or surface water.');
  }

  // Section 6 EN
  const s6En = enGuanzhiEngine.records.find(r => r.sectionNumber === 6);
  if (s6En) {
    writeCellValue(s6En.rows[1].cells[1], 'Wear protective equipment.\nEnsure adequate ventilation. Keep unauthorized persons away.');
    writeCellValue(s6En.rows[2].cells[1], 'Do not discharge into drains, wastewater, or soil.');
    writeCellValue(s6En.rows[3].cells[1], 'Absorb with chemical absorbent material or dry sand if necessary, and store in tightly closed containers.');
  }

  // Section 7 EN
  const s7En = enGuanzhiEngine.records.find(r => r.sectionNumber === 7);
  if (s7En) {
    writeCellValue(s7En.rows[1].cells[1], 'Observe common chemical precautions during handling. Avoid contact with skin and eyes.\nKeep away from food, drink and tobacco. Wash hands before breaks and at the end of workday. Store work clothing separately.\nChange contaminated or soaked clothing.');
    writeCellValue(s7En.rows[2].cells[1], 'Keep containers tightly closed in a dry, well-ventilated place. To maintain product quality, strictly follow the storage conditions in our technical data sheet.');
  }

  // Section 8 EN (12 rows, stopping at 8.2)
  let s8En = enGuanzhiEngine.records.find(r => r.sectionNumber === 8);
  while (s8En.rows.length > 12) s8En = deleteRow(enGuanzhiEngine, s8En, s8En.rows.length - 1);
  writeCellValue(s8En.rows[2].cells[1], 'Respiratory protection equipment is required during spraying.');
  writeCellValue(s8En.rows[3].cells[1], 'Protective gloves are recommended.');
  writeCellValue(s8En.rows[4].cells[1], 'EN 374-3');
  writeCellValue(s8En.rows[5].cells[1], 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min.');
  writeCellValue(s8En.rows[6].cells[1], 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min.');
  writeCellValue(s8En.rows[7].cells[1], 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min.');
  writeCellValue(s8En.rows[8].cells[1], 'Contaminated gloves should be discarded.');
  writeCellValue(s8En.rows[9].cells[1], 'Wear protective goggles or face shield.');
  writeCellValue(s8En.rows[10].cells[1], 'Wear appropriate protective clothing.');
  writeCellValue(s8En.rows[11].cells[1], 'Does not contain substances with occupational exposure limit values.');

  // Section 9 EN (Strictly 15 rows matching user CN: 14 test items)
  let s9En = enGuanzhiEngine.records.find(r => r.sectionNumber === 9);
  if (s9En) {
    while (s9En.rows.length > 15) s9En = deleteRow(enGuanzhiEngine, s9En, s9En.rows.length - 1);
    const enS9Items = [
      { label: '9.1  Appearance：', val: 'Light yellow to yellow transparent liquid' },
      { label: '9.2  Odour threshold：', val: 'No data available.' },
      { label: '9.3  pH value：', val: '6.5-8.5' },
      { label: '9.4  Flash point (closed cup)：', val: 'No flash point below initial boiling point' },
      { label: '9.5  Flammability (solid, gaseous)：', val: 'Not applicable' },
      { label: '9.6  Solubility in water：', val: 'Miscible' },
      { label: '9.7  Auto-ignition temperature：', val: 'No data available.' },
      { label: '9.8  Ignition temperature：', val: 'No data available.' },
      { label: '9.9  Decomposition temperature：', val: 'No data available.' },
      { label: '9.10 Dynamic viscosity/25℃：', val: '＜1000 mPa·s' },
      { label: '9.11 Explosive properties：', val: 'No data available.' },
      { label: '9.12 Dust explosion class：', val: 'Not applicable' },
      { label: '9.13 Solid content：', val: 'Approx. 25%' },
      { label: '9.14 Other information：', val: 'The above data are not product specifications. Please refer to the Technical Data Sheet for specifications.' }
    ];
    enS9Items.forEach((item, idx) => {
      const row = s9En.rows[idx + 1];
      writeCellLabel(row.cells[0], item.label, true);
      applyStandardHangingIndent(row.cells[0], '457', '457', '459');
      writeCellValue(row.cells[1], item.val);
    });
  }

  // Section 10 EN
  let s10En = enGuanzhiEngine.records.find(r => r.sectionNumber === 10);
  if (s10En) {
    writeCellValue(s10En.rows[1].cells[1], 'No decomposition if used according to specifications.');
    writeCellValue(s10En.rows[2].cells[1], 'Flammable and harmful gases generated during thermal decomposition.');
    writeCellValue(s10En.rows[3].cells[1], 'No hazardous reactions when stored and handled correctly.');
    while (s10En.rows.length > 4) s10En = deleteRow(enGuanzhiEngine, s10En, s10En.rows.length - 1);
  }

  // Section 11 EN (Strictly 7 rows matching user CN: Header, preamble, 11.1~11.5)
  let s11En = enGuanzhiEngine.records.find(r => r.sectionNumber === 11);
  while (s11En.rows.length > 11) s11En = deleteRow(enGuanzhiEngine, s11En, s11En.rows.length - 1);
  s11En = deleteRow(enGuanzhiEngine, s11En, 6);
  s11En = deleteRow(enGuanzhiEngine, s11En, 5);
  s11En = deleteRow(enGuanzhiEngine, s11En, 4);
  s11En = deleteRow(enGuanzhiEngine, s11En, 2);

  writeCellValue(s11En.rows[1].cells[0], 'No toxicological studies are available for this product.');
  writeCellValue(s11En.rows[2].cells[2], 'LD50 rat: ＞2,000 mg/kg');
  writeCellValue(s11En.rows[3].cells[1], 'Based on available data, the classification criteria are not met.');
  writeCellLabel(s11En.rows[4].cells[0], '11.3  Primary mucous membrane irritation：', true);
  applyStandardHangingIndent(s11En.rows[4].cells[0], '457', '457', '459');
  writeCellValue(s11En.rows[4].cells[1], 'Non-irritating');
  writeCellValue(s11En.rows[5].cells[1], 'Does not cause skin sensitization.');
  writeCellValue(s11En.rows[6].cells[1], 'Negative in the AMES test.');

  // Section 12 EN (Strictly 4 rows matching user CN)
  let s12En = enGuanzhiEngine.records.find(r => r.sectionNumber === 12);
  if (s12En) {
    while (s12En.rows.length > 6) s12En = deleteRow(enGuanzhiEngine, s12En, s12En.rows.length - 1);
    s12En = deleteRow(enGuanzhiEngine, s12En, 2);
    s12En = deleteRow(enGuanzhiEngine, s12En, 1);
    writeCellValue(s12En.rows[1].cells[1], 'No ecotoxicological studies are available for this product.\nDo not allow to enter drains, water courses or soil.');
    writeCellValue(s12En.rows[2].cells[1], 'The product is not readily biodegradable.');
    writeCellValue(s12En.rows[3].cells[1], 'According to ecotoxicological data, the product is classified as non-hazardous to fish and daphnia.');
  }

  // Section 13 EN
  const s13En = enGuanzhiEngine.records.find(r => r.sectionNumber === 13);
  if (s13En) {
    writeCellValue(s13En.rows[1].cells[0], 'Dispose of in accordance with applicable national standards and national or local regulations.\nWithin the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).');
    writeCellValue(s13En.rows[2].cells[1], 'Empty containers as completely as possible (e.g., by pouring, scraping, or draining until “drip-dry”).\nThey may be sent to an appropriate collection point under existing chemical industry recycling schemes.\nRecycle containers in accordance with national regulations and applicable environmental requirements.\nDo not discharge waste via wastewater.');
  }

  // Section 14 EN
  const s14En = enGuanzhiEngine.records.find(r => r.sectionNumber === 14);
  if (s14En) {
    writeCellValue(s14En.rows[1].cells[1], 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.');
    writeCellValue(s14En.rows[2].cells[1], 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.');
    writeCellValue(s14En.rows[3].cells[1], 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.');
    writeCellValue(s14En.rows[4].cells[1], 'Not regulated as dangerous goods.');
  }

  // Section 15 EN (Strictly 9 rows matching user CN)
  let s15En = enGuanzhiEngine.records.find(r => r.sectionNumber === 15);
  if (s15En) {
    while (s15En.rows.length > 9) s15En = deleteRow(enGuanzhiEngine, s15En, s15En.rows.length - 1);
    writeCellValue(s15En.rows[1].cells[0], 'Relevant safety, health and environmental regulations for the substance or mixture');
    writeCellValue(s15En.rows[4].cells[0], 'Regulations on the Safety Administration of Hazardous Chemicals (State Council Decree No. 344)');
    writeCellValue(s15En.rows[5].cells[0], 'GB/T 16483-2008 Safety Data Sheet for Chemical Products - Content and Order of Sections');
    writeCellValue(s15En.rows[6].cells[0], 'GB 13690-2009 General Rules for Classification and Hazard Communication of Chemicals');
    writeCellValue(s15En.rows[7].cells[0], 'GB 20576-GB 20598 Safety Rules for Classification, Precautionary Labelling and Precautionary Statements of Chemicals');
    writeCellValue(s15En.rows[8].cells[0], 'GB 15258 General Rules for Preparation of Precautionary Label for Chemicals');
  }

  // Section 16 EN
  const s16En = enGuanzhiEngine.records.find(r => r.sectionNumber === 16);
  if (s16En) {
    writeCellValue(s16En.rows[1].cells[0], 'To the best of our knowledge, the information provided in this Safety Data Sheet is accurate as of the date of publication. The information given is designed only as guidance for safe handling, use, processing, storage, transportation, disposal, and release and is not to be considered a warranty or quality specification. The information relates only to the specific material designated and may not be valid for such material used in combination with any other materials or in any process, unless specified in the text.');
  }

  console.log('4. Deriving Base EN Guocai from EN Guanzhi...');
  const enGuocaiBuf = await enGuanzhiEngine.exportArrayBuffer();
  const enGuocaiEngine = await loadDocx(enGuocaiBuf, `${modelCode} msds_EN Guocai.docx`);
  updateHeaderFooterData(enGuocaiEngine, {
    model: modelCode,
    company: ENTITY_MATRIX.GUOCAI.en.name,
    title: 'MATERIAL SAFETY DATA SHEET',
    version: 'V1.0',
    docCode: `${modelCode}-MSDS`,
    revisionDate: '2026/10/20',
    language: 'EN',
    entity: 'Guocai'
  });
  const s1EnGuocai = enGuocaiEngine.records.find(r => r.sectionNumber === 1);
  if (s1EnGuocai) {
    for (const row of s1EnGuocai.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Name of supplier/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.en.name);
      else if (/Supplier address/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.en.address);
      else if (/Tel/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.en.tel);
      else if (/Fax/i.test(lbl)) writeCellValue(c1, ENTITY_MATRIX.GUOCAI.en.fax);
    }
  }

  console.log('5. Batch exporting 4 DOCX to destination directories...');
  const docxList = [
    { name: `${modelCode} msds_CN 冠志.docx`, engine: cnGuanzhiEngine },
    { name: `${modelCode} msds_CN 国彩.docx`, engine: cnGuocaiEngine },
    { name: `${modelCode} msds_EN Guanzhi.docx`, engine: enGuanzhiEngine },
    { name: `${modelCode} msds_EN Guocai.docx`, engine: enGuocaiEngine }
  ];

  const convertInputs = [];
  for (const item of docxList) {
    const buf = await item.engine.exportArrayBuffer();
    // Write to E:
    await fs.writeFile(path.join(targetDirE, item.name), Buffer.from(buf));
    // Write to Engine training materials:
    await fs.writeFile(path.join(targetDirEngine, item.name), Buffer.from(buf));
    convertInputs.push({ docxBuffer: buf, fileName: item.name });
    console.log(`  Saved DOCX: ${item.name} (${buf.byteLength} bytes)`);
  }

  console.log('6. Converting 4 high-fidelity PDFs via LibreOffice...');
  const pdfOutputs = await convertBatchDocxToPdf(convertInputs);
  for (const p of pdfOutputs) {
    await fs.writeFile(path.join(targetDirE, p.pdfName), p.pdfBuffer);
    await fs.writeFile(path.join(targetDirEngine, p.pdfName), p.pdfBuffer);
    console.log(`  Saved PDF: ${p.pdfName} (${p.size} bytes, ${p.durationMs}ms)`);
  }

  console.log('7. ALL 8 DELIVERABLES SUCCESSFULLY EXPORTED!');
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
