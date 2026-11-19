import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../src/pipeline-engine.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_pipeline-engine.js');

let content = fs.readFileSync(targetPath, 'utf8');
const hasCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. In buildDynamicSection11Table:
const s11DynamicRegex = /\/\/ 2\. 动态自适应调整行数 \(Row 0=标题, Row 1=声明1, Row 2=声明2, Row 3\.\.N=终点\)[\s\S]*?writeStructuredToxicologyCellValue\(row\.cells\[1\], val, \{ isEnglish \}\);\n  \}/m;

const newS11Dynamic = `// 1.5 判断源文件是否真正包含多组分/替代说明前言 (源事实防伪门禁)
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

if (s11DynamicRegex.test(content)) {
  content = content.replace(s11DynamicRegex, newS11Dynamic);
  console.log('1. s11DynamicRegex matched and replaced!');
} else {
  console.error('1. s11DynamicRegex failed to match!');
}

// 2. In translateTransportValueToEnglish:
if (!content.includes('公路运输规范')) {
  const transTarget = `if (/^非危险品陆运输方式[，,]?\\s*符合ADG准则[。.]?$/i.test(text)) {
    return 'Not classified as dangerous goods for land transport, in accordance with ADG regulations.';
  }`;
  const transRepl = `if (/^非危险品陆运输方式[，,]?\\s*符合ADG准则[。.]?$/i.test(text)) {
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
  content = content.replace(transTarget, transRepl);
  console.log('2. Transport translation updated!');
}

// 3. In buildDynamicSection14Table:
const roadPairTarget = `const roadPair = s14Pairs.find(p => /公路|铁路|land|road|rail/i.test(p.rawLabel));`;
if (content.includes(roadPairTarget)) {
  content = content.replace(roadPairTarget, `const roadPair = s14Pairs.find(p => /(?:公路|铁路|陆路|陆运|land|road|rail)/i.test(p.rawLabel));`);
  console.log('3. roadPair regex updated!');
}

// 4. Section 13 in buildBaseChineseEngine:
const s13Regex = /\/\/ 7\. 规范化 Section 13[\s\S]*?enforceSection13JustifiedContent\(lastRow\.cells\[1\]\.node\);\n    \}\n  \}/m;
const newS13 = `// 7. 规范化 Section 13 (严格保持与源文件及英文一致的 4 行标准结构：标题 + 2行独立说明行 + 处置方法)
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

if (s13Regex.test(content)) {
  content = content.replace(s13Regex, newS13);
  console.log('4. Section 13 updated!');
} else {
  console.error('4. Section 13 regex failed to match!');
}

// 5. Section 15 in buildBaseChineseEngine:
if (content.includes('const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15 && r.rows);')) {
  content = content.replace(
    'const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15 && r.rows);',
    'const srcS15 = srcEngine?.records?.find(r => r.sectionNumber === 15);'
  );
  console.log('5. Section 15 srcS15 check updated!');
}

if (hasCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Proposed pipeline-engine.js written.');
