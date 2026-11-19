import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalPath = path.resolve(__dirname, '../src/pipeline-engine.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_pipeline-engine.js');

let content = fs.readFileSync(originalPath, 'utf8');

// 1. Add import getBenchmarkSpecsByCategory
content = `import { getBenchmarkSpecsByCategory } from './msds-db.js';\n` + content;

// 2. In translateTransportValueToEnglish, support IMDG, IATA, road transport regulations
const targetTrans = `  if (/^非危险品陆运输方式[，,]?\\s*符合ADG准则[。.]?$/i.test(text)) {
    return 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.';
  }`;

const replacementTrans = `  if (/^非危险品陆运输方式[，,]?\\s*符合ADG准则[。.]?$/i.test(text)) {
    return 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.';
  }
  if (/公路运输规范|公路运输/i.test(text)) {
    return 'Not classified as dangerous goods for land transport, in accordance with road transport regulations.';
  }
  if (/IMDG/i.test(text)) {
    return 'Not classified as dangerous goods for sea transport, in accordance with IMDG Code.';
  }
  if (/IATA/i.test(text)) {
    return 'Not classified as dangerous goods for air transport, in accordance with IATA Dangerous Goods Regulations.';
  }`;

content = content.replace(targetTrans, replacementTrans);

// 3. In buildDynamicSection11Table, introduce srcHasPreamble check
const targetS11Dynamic = `  // 2. 动态自适应调整行数 (Row 0=标题, Row 1=声明1, Row 2=声明2, Row 3..N=终点)
  const targetRowCount = 3 + endpoints.length;
  while (s11.rows.length < targetRowCount) {
    s11 = addRowAfter(engine, s11, s11.rows.length - 1);
  }
  while (s11.rows.length > targetRowCount) {
    s11 = deleteRow(engine, s11, s11.rows.length - 1);
  }

  // 3. 几何拓扑规整：消除 vMerge 与多余列，固化 2800 / 6981 纯净双列结构
  for (let i = 0; i < endpoints.length; i++) {
    const row = s11.rows[3 + i];
    if (row?.node) {
      normalizeTwoColumnRow(row.node, 2800, 6981);
    }
  }
  engine.refresh();
  s11 = engine.records.find(r => r.sectionNumber === 11);

  // 4. 前言声明行排版 (Row 1 & Row 2)
  if (s11.rows[1]) {
    formatSection11PreambleRow(
      s11.rows[1],
      isEnglish ? 'No toxicological studies are available on the product.' : '该产品无可用的毒理学研究。',
      isEnglish,
      0
    );
  }
  if (s11.rows[2]) {
    const srcS11Rec = (srcEngine || baseCnEngine)?.records?.find(r => r.sectionNumber === 11 && r.rows);
    const srcRow2Text = (srcS11Rec?.rows?.[2]?.cells[0]?.text || '').trim();
    let preamble = !isEnglish ? '下面是这些成分的毒理学数据。' : 'The following is toxicological data for these ingredients:';
    if (srcRow2Text) {
      if (!isEnglish) {
        preamble = srcRow2Text.endsWith('：') || srcRow2Text.endsWith(':') ? srcRow2Text : \`\${srcRow2Text}：\`;
      } else {
        if (/类似产品/i.test(srcRow2Text)) {
          preamble = 'Risk assessment data of similar products:';
        } else if (/以[下为](?:是)?(.*?)毒理学数据/i.test(srcRow2Text)) {
          const m = srcRow2Text.match(/以[下为](?:是)?(.*?)毒理学数据/i);
          let targetChem = m[1].trim();
          targetChem = translateChemicalTerm(targetChem) || targetChem;
          targetChem = targetChem.replace(/N,N[－-]二甲基乙酰胺(?:\\s*[（(]DMAC[）)])?/gi, 'N,N-Dimethylacetamide (DMAC)');
          preamble = \`The following is toxicological data for \${targetChem}:\`;
        } else {
          preamble = 'The following is toxicological data for these ingredients:';
        }
      }
    }
    formatSection11PreambleRow(
      s11.rows[2],
      preamble,
      isEnglish,
      34
    );
  }

  // 5. 动态装配每一个毒理终点 (11.1 ~ 11.N)
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    const row = s11.rows[3 + i];
    if (!row || row.cells.length < 2) continue;

    const seqStr = \`11.\${i + 1}\`;
    const labelText = isEnglish ? ep.enLabel : ep.cnLabel;
    formatSection11LabelCell(row.cells[0], seqStr, labelText, isEnglish);

    let val = ep.content;
    if (isEnglish) {
      val = translateToxicologyValueToEnglish(val, ep.key || '');
    }
    writeStructuredToxicologyCellValue(row.cells[1], val, { isEnglish });
  }`;

const replacementS11Dynamic = `  // 1.5 判断源文件是否真正包含多组分/替代说明前言 (源事实防伪门禁)
  const srcS11Rec = (srcEngine || baseCnEngine)?.records?.find(r => r.sectionNumber === 11);
  const srcAllText = srcS11Rec ? (srcS11Rec.rows ? srcS11Rec.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ') : (srcS11Rec.text || '')) : '';
  const srcHasPreamble = Boolean(facts.isMultiComponentComposite || facts.isMultiComponentS11 || /无可用的毒理学研究|下面是这些成分|毒理学研究数据如下|成分的毒理学数据/i.test(srcAllText));

  const preambleRowCount = srcHasPreamble ? 2 : 0;
  const targetRowCount = 1 + preambleRowCount + endpoints.length;

  while (s11.rows.length < targetRowCount) {
    s11 = addRowAfter(engine, s11, s11.rows.length - 1);
  }
  while (s11.rows.length > targetRowCount) {
    s11 = deleteRow(engine, s11, s11.rows.length - 1);
  }

  // 3. 几何拓扑规整：消除 vMerge 与多余列，固化 2800 / 6981 纯净双列结构
  for (let i = 0; i < endpoints.length; i++) {
    const row = s11.rows[1 + preambleRowCount + i];
    if (row?.node) {
      normalizeTwoColumnRow(row.node, 2800, 6981);
    }
  }
  engine.refresh();
  s11 = engine.records.find(r => r.sectionNumber === 11);

  // 4. 前言声明行排版 (仅当源事实具有说明行时保留，严禁凭空伪造)
  if (srcHasPreamble) {
    if (s11.rows[1]) {
      formatSection11PreambleRow(
        s11.rows[1],
        isEnglish ? 'No toxicological studies are available on the product.' : '该产品无可用的毒理学研究。',
        isEnglish,
        0
      );
    }
    if (s11.rows[2]) {
      const srcRow2Text = (srcS11Rec?.rows?.[2]?.cells[0]?.text || '').trim();
      let preamble = !isEnglish ? '下面是这些成分的毒理学数据。' : 'The following is toxicological data for these ingredients:';
      if (srcRow2Text) {
        if (!isEnglish) {
          preamble = srcRow2Text.endsWith('：') || srcRow2Text.endsWith(':') ? srcRow2Text : \`\${srcRow2Text}：\`;
        } else {
          if (/类似产品/i.test(srcRow2Text)) {
            preamble = 'Risk assessment data of similar products:';
          } else if (/以[下为](?:是)?(.*?)毒理学数据/i.test(srcRow2Text)) {
            const m = srcRow2Text.match(/以[下为](?:是)?(.*?)毒理学数据/i);
            let targetChem = m[1].trim();
            targetChem = translateChemicalTerm(targetChem) || targetChem;
            targetChem = targetChem.replace(/N,N[－-]二甲基乙酰胺(?:\\s*[（(]DMAC[）)])?/gi, 'N,N-Dimethylacetamide (DMAC)');
            preamble = \`The following is toxicological data for \${targetChem}:\`;
          } else {
            preamble = 'The following is toxicological data for these ingredients:';
          }
        }
      }
      formatSection11PreambleRow(
        s11.rows[2],
        preamble,
        isEnglish,
        34
      );
    }
  }

  // 5. 动态装配每一个毒理终点 (11.1 ~ 11.N)
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    const row = s11.rows[1 + preambleRowCount + i];
    if (!row || row.cells.length < 2) continue;

    const seqStr = \`11.\${i + 1}\`;
    const labelText = isEnglish ? ep.enLabel : ep.cnLabel;
    formatSection11LabelCell(row.cells[0], seqStr, labelText, isEnglish);

    let val = ep.content;
    if (isEnglish) {
      val = translateToxicologyValueToEnglish(val, ep.key || '');
    }
    writeStructuredToxicologyCellValue(row.cells[1], val, { isEnglish });
  }`;

content = content.replace(targetS11Dynamic, replacementS11Dynamic);

// 4. In buildDynamicSection14Table, support 陆路/陆运 in roadPair
content = content.replace(
  'const roadPair = s14Pairs.find(p => /公路|铁路|land|road|rail/i.test(p.rawLabel));',
  'const roadPair = s14Pairs.find(p => /(?:公路|铁路|陆路|陆运|land|road|rail)/i.test(p.rawLabel));'
);

// 5. In buildBaseChineseEngine, add Section 1 invariant check after applyMatchResultToEditor
const targetAfterApply = `  // 5. 将匹配结果精准装配映射入官方底模插槽，并执行空白精删、防污染与语义剪枝
  applyMatchResultToEditor(matchResult, engine);`;

const replacementAfterApply = `  // 5. 将匹配结果精准装配映射入官方底模插槽，并执行空白精删、防污染与语义剪枝
  applyMatchResultToEditor(matchResult, engine);

  // 5.1 强制保障 Section 1 双槽位法定不变量 (Row 1 型号，Row 2 中文名称+型号)
  const s1Rec = engine.records.find(r => r.sectionNumber === 1);
  if (s1Rec) {
    const row11 = s1Rec.rows.find(r => /1\\.1\\s*(?:产品名称|产品标识)/i.test(r.cells[0]?.text || ''));
    const rowCnName = s1Rec.rows.find(r => /中文名称/i.test(r.cells[0]?.text || ''));
    if (row11 && row11.cells[1]) {
      safeWriteCellValue(row11.cells[1], modelCode);
    }
    if (rowCnName && rowCnName.cells[1]) {
      let cnNameVal = (rowCnName.cells[1].text || '').trim();
      if (!cnNameVal || cnNameVal.includes('此处填写')) {
        cnNameVal = matchResult.facts?.productNameCn || matchResult.matchedSections?.find(s => s.sectionNumber === 1)?.matchedRows?.find(r => r.key === 'product_name')?.value || '';
      }
      if (cnNameVal) {
        if (!cnNameVal.includes(modelCode)) {
          cnNameVal = \`\${cnNameVal} \${modelCode}\`;
        }
        cnNameVal = cnNameVal.replace(/(?<![A-Za-z0-9\\s])((?:PU|PA|OS|HPU)[-\\s]?\\d+[A-Za-z]?)/i, ' $1').trim();
        safeWriteCellValue(rowCnName.cells[1], cnNameVal);
      }
    }
  }`;

content = content.replace(targetAfterApply, replacementAfterApply);

// 6. In buildBaseChineseEngine Section 13, ensure clean 4 rows without leaving row 2 blank
const targetS13Cn = `  // 7. 规范化 Section 13 (严格保持与源文件及英文一致的 4 行标准结构：标题 + 2行独立说明行 + 处置方法)
  let s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13) {
    if (s13.rows.length === 3) {
      const origText = (s13.rows[1].cells[0]?.text || '').trim();
      s13 = addRowAfter(engine, s13, 1);
      if (origText.includes('在欧盟领域内废弃')) {
        const parts = origText.split(/\\r?\\n|。/);
        const line1 = parts.find(p => p.includes('适用的国标') || p.includes('国家或当地法规')) || '必须遵守适用的国标、国家或当地法规进行废弃。';
        const line2 = parts.find(p => p.includes('欧盟领域内废弃')) || '在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。';
        safeWriteCellValue(s13.rows[1].cells[0], line1.endsWith('。') ? line1 : line1 + '。');
        safeWriteCellValue(s13.rows[2].cells[0], line2.endsWith('。') ? line2 : line2 + '。');
      }
    }
    const lastRow = s13.rows[s13.rows.length - 1];
    if (lastRow && lastRow.cells[0]?.node) {
      enforceSection13DoubleCenter(lastRow.cells[0].node);
    }
    if (lastRow && lastRow.cells.length >= 2 && lastRow.cells[1]?.node) {
      let mText = (lastRow.cells[1].text || '').trim();
      if (mText.includes('“滴干”）') && !mText.includes('“滴干”）。')) {
        mText = mText.replace(/“滴干”）(?![。])/g, '“滴干”）。');
        safeWriteCellValue(lastRow.cells[1], mText);
      }
      enforceSection13JustifiedContent(lastRow.cells[1].node);
    }
  }`;

const replacementS13Cn = `  // 7. 规范化 Section 13 (严格保持与源文件及英文一致的 4 行标准结构：标题 + 2行独立说明行 + 处置方法)
  let s13 = engine.records.find(r => r.sectionNumber === 13);
  if (s13) {
    if (s13.rows.length === 3) {
      s13 = addRowAfter(engine, s13, 1);
    }
    if (s13.rows.length >= 4) {
      safeWriteCellValue(s13.rows[1].cells[0], '必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。');
      safeWriteCellValue(s13.rows[2].cells[0], '在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。');
      if (s13.rows[3]?.cells[1]) {
        let mVal = (s13.rows[3].cells[1].text || '').trim();
        if (!mVal || mVal.includes('此处填写')) {
          mVal = '尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。严禁直接排放至废水中。';
        } else {
          if (!mVal.includes('“滴干”')) {
            mVal = \`尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。\${mVal}\`;
          }
          if (!mVal.includes('严禁直接排放') && !mVal.includes('不能将废弃物通过废水')) {
            mVal += ' 严禁直接排放至废水中。';
          }
        }
        safeWriteCellValue(s13.rows[3].cells[1], mVal);
      }
    }
    const lastRow = s13.rows[s13.rows.length - 1];
    if (lastRow && lastRow.cells[0]?.node) {
      enforceSection13DoubleCenter(lastRow.cells[0].node);
    }
    if (lastRow && lastRow.cells.length >= 2 && lastRow.cells[1]?.node) {
      let mText = (lastRow.cells[1].text || '').trim();
      if (mText.includes('“滴干”）') && !mText.includes('“滴干”）。')) {
        mText = mText.replace(/“滴干”）(?![。])/g, '“滴干”）。');
        safeWriteCellValue(lastRow.cells[1], mText);
      }
      enforceSection13JustifiedContent(lastRow.cells[1].node);
    }
  }`;

content = content.replace(targetS13Cn, replacementS13Cn);

// 7. In buildBaseChineseEngine Section 8, supplement benchmark glove values when empty
const targetS8Benchmark = `    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));`;

const replacementS8Benchmark = `    // 结合同品类基准库补充手部防护手套技术参数（消灭 6 行空值栏）
    const benchmark = getBenchmarkSpecsByCategory(modelCode);
    if (benchmark?.ppeHandSpecs) {
      for (const row of s8.rows) {
        const lbl = (row.cells[0]?.text || '').trim();
        const valCell = row.cells[row.cells.length - 1];
        if (!valCell) continue;
        const curVal = (valCell.text || '').trim();
        if (!curVal) {
          if (/氟化橡胶|FKM/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.fkm);
          else if (/丁基橡胶|IIR/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.iir);
          else if (/丁腈橡胶|NBR/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.nbr);
          else if (/建议/i.test(lbl)) safeWriteCellValue(valCell, benchmark.ppeHandSpecs.recommendation);
        }
      }
    }

    const row82 = s8.rows.find(r => /8\\.2\\s*工程控制/i.test(r.cells[0]?.text || ''));`;

content = content.replace(targetS8Benchmark, replacementS8Benchmark);

// 8. In buildBaseChineseEngine Section 15, allow srcS15 without .rows check
content = content.replace(
  'const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15 && r.rows);',
  'const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);'
);

// 9. In buildEnglishFacts, enhance engineering_controls and glove values
const targetEngControls = `    'sec8.engineering_controls': (() => {
      const cnS8Rec = baseCnEngine?.records?.find(r => r.sectionNumber === 8);
      const cnEng = cnS8Rec?.rows?.find(r => /工程控制/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
      if (!cnEng) return '';
      if (/局部排风.*全面通风/i.test(cnEng)) {
        return 'Use local exhaust or general ventilation to maintain workplace concentrations below occupational exposure limits; eyewash and safety shower facilities should be provided in the workplace.';
      }
      if (/2006\\/121|无可用的接触限值/i.test(cnEng)) {
        return 'No exposure limit information is available under EC Directive 2006/121/EC.';
      }
      if (/不含有职业接触限值|不含职业接触/i.test(cnEng)) {
        return 'Contains no substances with occupational exposure limit values.';
      }
      return '';
    })(),`;

const replacementEngControls = `    'sec8.engineering_controls': (() => {
      const cnS8Rec = baseCnEngine?.records?.find(r => r.sectionNumber === 8);
      const cnEng = cnS8Rec?.rows?.find(r => /工程控制/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
      if (!cnEng) return 'Provide adequate ventilation and local exhaust.';
      if (/局部排风.*全面通风/i.test(cnEng)) {
        return 'Use local exhaust or general ventilation to maintain workplace concentrations below occupational exposure limits; eyewash and safety shower facilities should be provided in the workplace.';
      }
      if (/2006\\/121|无可用的接触限值/i.test(cnEng)) {
        return 'No exposure limit information is available under EC Directive 2006/121/EC.';
      }
      if (/不含有职业接触限值|不含职业接触/i.test(cnEng)) {
        return 'Contains no substances with occupational exposure limit values.';
      }
      if (/通风/i.test(cnEng)) {
        return 'Provide adequate ventilation and local exhaust.';
      }
      return 'Provide adequate ventilation and local exhaust.';
    })(),`;

content = content.replace(targetEngControls, replacementEngControls);

// 10. In buildBaseEnglishEngine Section 8, enhance hand protection translation
const targetEnS8Hand = `        else if (/Hand protection/i.test(lbl)) {
          const cnHand = cnS8?.rows?.find(r => /手部/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
          safeWrite(c1, cnHand ? enValues['sec8.hand_protection'] : '');
        }`;

const replacementEnS8Hand = `        else if (/Hand protection/i.test(lbl)) {
          const cnHand = cnS8?.rows?.find(r => /手部/i.test(r.cells[0]?.text || ''))?.cells?.[1]?.text?.trim() || '';
          let enHand = enValues['sec8.hand_protection'];
          if (!enHand && cnHand) {
            if (/丁腈|NBR/i.test(cnHand) && /氟化橡胶|FKM/i.test(cnHand)) {
              enHand = 'Wear nitrile rubber (NBR) or fluororubber (FKM) gloves.';
            } else if (/丁腈|NBR/i.test(cnHand)) {
              enHand = 'Wear nitrile rubber (NBR) gloves.';
            } else {
              enHand = 'Wear suitable protective gloves.';
            }
          }
          safeWrite(c1, enHand || '');
        }`;

content = content.replace(targetEnS8Hand, replacementEnS8Hand);

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Proposed pipeline-engine.js written successfully.');
