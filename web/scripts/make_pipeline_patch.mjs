import fs from 'fs';

const origPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(origPath, 'utf8');

// 1. In buildBaseChineseEngine around carcRow:
const targetCarc = `      // 8. 11.6 致癌性
      const carcRow = s11.rows.find(r => /致癌性/i.test(r.cells[0]?.text || ''));
      if (carcRow && carcRow.cells.length > 1) {
        writeCellLabel(carcRow.cells[0], '11.6  致癌性：', true);
        applyStandardHangingIndent(carcRow.cells[0], '420', '420');
        const vCell = carcRow.cells[carcRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 9. 11.7 生殖毒性与致畸性
      const repRow = s11.rows.find(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
      if (repRow && repRow.cells.length > 1) {
        writeCellLabel(repRow.cells[0], '11.7  生殖毒性：', true);
        applyStandardHangingIndent(repRow.cells[0], '420', '420');
        const vCell = repRow.cells[repRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      const teratoRow = s11.rows.find(r => r.cells.some(c => /致畸/i.test(c.text || '')));
      if (teratoRow && teratoRow !== repRow) {
        const teratoCell = teratoRow.cells.find(c => /致畸/i.test(c.text || ''));
        if (teratoCell?.node) {
          const XML_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
          const tNodes = Array.from(teratoCell.node.getElementsByTagName('w:t')).concat(
            Array.from(teratoCell.node.getElementsByTagNameNS(XML_W_NS, 't'))
          );
          const uniqueTNodes = Array.from(new Set(tNodes));
          if (uniqueTNodes.length > 0) {
            uniqueTNodes[0].textContent = '致畸性：';
            for (let i = 1; i < uniqueTNodes.length; i++) uniqueTNodes[i].textContent = '';
          }
        }
        const vCell = teratoRow.cells[teratoRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 10. 11.8 特异性靶器官系统毒性
      const stotRow = s11.rows.find(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
      if (stotRow && stotRow.cells.length > 1) {
        writeCellLabel(stotRow.cells[0], '11.8  特异性靶器官系统毒性（一次接触/反复接触）：', true);
        applyStandardHangingIndent(stotRow.cells[0], '420', '420');
        const vCell = stotRow.cells[stotRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 11. 11.9 吸入危险
      const aspRow = s11.rows.find(r => /吸入危险|吸入危害/i.test(r.cells[0]?.text || ''));
      if (aspRow && aspRow.cells.length > 1) {
        writeCellLabel(aspRow.cells[0], '11.9  吸入危险：', true);
        applyStandardHangingIndent(aspRow.cells[0], '420', '420');
        const vCell = aspRow.cells[aspRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      // 12. 11.10 附加信息
      const addRow = s11.rows.find(r => /附加信息/i.test(r.cells?.[0]?.text || ''));
      if (addRow && addRow.cells?.length > 1) {
        writeCellLabel(addRow.cells[0], '11.10 附加信息：', true);
        applyStandardHangingIndent(addRow.cells[0], '420', '420');
        const vCell = addRow.cells[addRow.cells.length - 1];
        let val = vCell?.text?.trim() || '';
        if (!val && matchResult) {
          const addInfoItem = matchResult?.matchedSections?.find(s => s.sectionNumber === 11)?.matchedRows?.find(r => r.key === 'additional_info');
          if (addInfoItem?.value) val = addInfoItem.value.trim();
        }
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }`;

const replaceCarc = `      // 格式服从原文：探知源文件是否具备这些指标，若源文件不具备则彻底剪枝模板占位行，严禁捏造假数据
      const srcS11Rows = srcS11?.rows || [];
      const srcS11AllText = srcS11Rows.map(r => r.cells.map(c => c.text || '').join(' ')).join(' ');
      const srcHasCarc = /致癌/i.test(srcS11AllText);
      const srcHasRep = /生殖毒性/i.test(srcS11AllText);
      const srcHasTerato = /致畸/i.test(srcS11AllText);
      const srcHasStot = /特异性靶器官/i.test(srcS11AllText);
      const srcHasAsp = /吸入危险|吸入危害/i.test(srcS11AllText);
      const srcHasAdd = /附加信息|其它信息|其他信息/i.test(srcS11AllText) && !/上述数据非产品指标/i.test(srcS11AllText);

      // 8. 11.6 致癌性
      const carcRow = s11.rows.find(r => /致癌性/i.test(r.cells[0]?.text || ''));
      if (carcRow && carcRow.cells.length > 1) {
        if (!srcHasCarc) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(carcRow));
        } else {
          writeCellLabel(carcRow.cells[0], '11.6  致癌性：', true);
          applyStandardHangingIndent(carcRow.cells[0], '420', '420');
          const vCell = carcRow.cells[carcRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 9. 11.7 生殖毒性与致畸性
      const repRow = s11.rows.find(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
      if (repRow && repRow.cells.length > 1) {
        if (!srcHasRep) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(repRow));
        } else {
          writeCellLabel(repRow.cells[0], '11.7  生殖毒性：', true);
          applyStandardHangingIndent(repRow.cells[0], '420', '420');
          const vCell = repRow.cells[repRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      const teratoRow = s11.rows.find(r => r.cells.some(c => /致畸/i.test(c.text || '')));
      if (teratoRow && teratoRow !== repRow) {
        if (!srcHasTerato) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(teratoRow));
        } else {
          const teratoCell = teratoRow.cells.find(c => /致畸/i.test(c.text || ''));
          if (teratoCell?.node) {
            const XML_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
            const tNodes = Array.from(teratoCell.node.getElementsByTagName('w:t')).concat(
              Array.from(teratoCell.node.getElementsByTagNameNS(XML_W_NS, 't'))
            );
            const uniqueTNodes = Array.from(new Set(tNodes));
            if (uniqueTNodes.length > 0) {
              uniqueTNodes[0].textContent = '致畸性：';
              for (let i = 1; i < uniqueTNodes.length; i++) uniqueTNodes[i].textContent = '';
            }
          }
          const vCell = teratoRow.cells[teratoRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 10. 11.8 特异性靶器官系统毒性
      const stotRow = s11.rows.find(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
      if (stotRow && stotRow.cells.length > 1) {
        if (!srcHasStot) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(stotRow));
        } else {
          writeCellLabel(stotRow.cells[0], '11.8  特异性靶器官系统毒性（一次接触/反复接触）：', true);
          applyStandardHangingIndent(stotRow.cells[0], '420', '420');
          const vCell = stotRow.cells[stotRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 11. 11.9 吸入危险
      const aspRow = s11.rows.find(r => /吸入危险|吸入危害/i.test(r.cells[0]?.text || ''));
      if (aspRow && aspRow.cells.length > 1) {
        if (!srcHasAsp) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(aspRow));
        } else {
          writeCellLabel(aspRow.cells[0], '11.9  吸入危险：', true);
          applyStandardHangingIndent(aspRow.cells[0], '420', '420');
          const vCell = aspRow.cells[aspRow.cells.length - 1];
          const val = vCell?.text?.trim() || '';
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }

      // 12. 11.10 附加信息
      const addRow = s11.rows.find(r => /附加信息/i.test(r.cells?.[0]?.text || ''));
      if (addRow && addRow.cells?.length > 1) {
        if (!srcHasAdd) {
          s11 = deleteRow(engine, s11, s11.rows.indexOf(addRow));
        } else {
          writeCellLabel(addRow.cells[0], '11.10 附加信息：', true);
          applyStandardHangingIndent(addRow.cells[0], '420', '420');
          const vCell = addRow.cells[addRow.cells.length - 1];
          let val = vCell?.text?.trim() || '';
          if (!val && matchResult) {
            const addInfoItem = matchResult?.matchedSections?.find(s => s.sectionNumber === 11)?.matchedRows?.find(r => r.key === 'additional_info');
            if (addInfoItem?.value) val = addInfoItem.value.trim();
          }
          if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
        }
      }`;

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');
content = normalize(content);

if (!content.includes(normalize(targetCarc))) {
  console.error('targetCarc not found!');
  process.exit(1);
}
content = content.replace(normalize(targetCarc), normalize(replaceCarc));

// 2. In buildBaseEnglishEngine: preamble enIntro for 类似产品的风险评估
const targetEnIntro = `        let enIntro = 'The following are toxicological data for the component:';
        if (/N[－\\-—\\s]*甲基吡咯烷酮|NMP/i.test(cnS11Preambles[1])) {`;

const replaceEnIntro = `        let enIntro = 'The following are toxicological data for the component:';
        if (/类似产品的风险评估/i.test(cnS11Preambles[1])) {
          enIntro = 'Toxicological data from risk assessment of similar products:';
        } else if (/N[－\\-—\\s]*甲基吡咯烷酮|NMP/i.test(cnS11Preambles[1])) {`;

if (!content.includes(normalize(targetEnIntro))) {
  console.error('targetEnIntro not found!');
  process.exit(1);
}
content = content.replace(normalize(targetEnIntro), normalize(replaceEnIntro));

// 3. In buildBaseEnglishEngine: pruning rows
const targetEnPrune = `      // 3. 动态精简：仅删除中文母版中确实不存在且英文模板中无实测值的空白行，严禁误删生殖毒性、STOT与附加信息
      for (let i = s11.rows.length - 1; i >= 3; i--) {
        const row = s11.rows[i];
        const rText = row.cells.map(c => c.text).join(' ');
        const lastCellText = (row.cells[row.cells.length - 1]?.text || '').trim();
        let shouldPrune = false;
        if (/Inhalation:/i.test(rText) && !inhalCn) shouldPrune = true;
        else if (/Dermal:/i.test(rText) && !dermCn) shouldPrune = true;
        else if (/Primary skin irritation/i.test(rText) && !skinIrrCn) shouldPrune = true;
        else if (/Primary eye irritation/i.test(rText) && !eyeIrrCn) shouldPrune = true;
        else if (/Sensitization/i.test(rText) && !sensCn) shouldPrune = true;
        else if (/Mutagenicity/i.test(rText) && !mutCn) shouldPrune = true;
        else if (/Carcinogenicity/i.test(rText) && !carcCn) shouldPrune = true;
        else if (/Teratogenicity/i.test(rText) && !findCnVal(/致畸/i)) shouldPrune = true;
        else if (/In vitro genotoxicity/i.test(rText) && !findCnVal(/体外遗传毒性|体外基因毒性/i)) shouldPrune = true;
        const repRowInCn = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
        const stotRowInCn = cnS11?.rows?.some(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
        if (/Reproductive toxicity/i.test(rText) && !repCn && !repRowInCn) shouldPrune = true;
        else if (/Specific target organ/i.test(rText) && !stotCn && !stotRowInCn) shouldPrune = true;
        else if (/Specific target organ/i.test(rText) && !stotCn) shouldPrune = true;
        else if (/根据现有数据，二乙二醇/i.test(rText)) shouldPrune = true;
        else if (/Aspiration hazard/i.test(rText) && !aspCn) shouldPrune = true;
        else if (/^(?:AA|BB|CC)$/.test(lastCellText)) shouldPrune = true;

        if (shouldPrune) {
          s11 = deleteRow(engine, s11, i);
        }
      }`;

const replaceEnPrune = `      // 3. 动态精简：严格与中文母版 cnS11 结构同构对齐，中文未列入的指标项英文必须同步剪枝
      const cnHasCarc = cnS11?.rows?.some(r => /致癌/i.test(r.cells[0]?.text || ''));
      const cnHasRep = cnS11?.rows?.some(r => /生殖毒性/i.test(r.cells[0]?.text || ''));
      const cnHasStot = cnS11?.rows?.some(r => /特异性靶器官/i.test(r.cells[0]?.text || ''));
      const cnHasAsp = cnS11?.rows?.some(r => /吸入危险|吸入危害/i.test(r.cells[0]?.text || ''));
      const cnHasAdd = cnS11?.rows?.some(r => /附加信息/i.test(r.cells[0]?.text || ''));

      for (let i = s11.rows.length - 1; i >= 3; i--) {
        const row = s11.rows[i];
        const rText = row.cells.map(c => c.text).join(' ');
        const lastCellText = (row.cells[row.cells.length - 1]?.text || '').trim();
        let shouldPrune = false;
        if (/Inhalation:/i.test(rText) && !inhalCn) shouldPrune = true;
        else if (/Dermal:/i.test(rText) && !dermCn) shouldPrune = true;
        else if (/Primary skin irritation/i.test(rText) && !skinIrrCn) shouldPrune = true;
        else if (/Primary eye irritation/i.test(rText) && !eyeIrrCn) shouldPrune = true;
        else if (/Sensitization/i.test(rText) && !sensCn) shouldPrune = true;
        else if (/Mutagenicity/i.test(rText) && !mutCn) shouldPrune = true;
        else if (/Carcinogenicity/i.test(rText) && !cnHasCarc) shouldPrune = true;
        else if (/Teratogenicity/i.test(rText) && !findCnVal(/致畸/i)) shouldPrune = true;
        else if (/In vitro genotoxicity/i.test(rText) && !findCnVal(/体外遗传毒性|体外基因毒性/i)) shouldPrune = true;
        else if (/Reproductive toxicity/i.test(rText) && !cnHasRep) shouldPrune = true;
        else if (/Specific target organ/i.test(rText) && !cnHasStot) shouldPrune = true;
        else if (/Aspiration hazard/i.test(rText) && !cnHasAsp) shouldPrune = true;
        else if (/Additional information/i.test(rText) && !cnHasAdd) shouldPrune = true;
        else if (/根据现有数据，二乙二醇/i.test(rText)) shouldPrune = true;
        else if (/^(?:AA|BB|CC)$/.test(lastCellText)) shouldPrune = true;

        if (shouldPrune) {
          s11 = deleteRow(engine, s11, i);
        }
      }`;

if (!content.includes(normalize(targetEnPrune))) {
  console.error('targetEnPrune not found!');
  process.exit(1);
}
content = content.replace(normalize(targetEnPrune), normalize(replaceEnPrune));

// 4. In buildBaseEnglishEngine: fix typos in S11 xml texts
const targetS11Xml = `    // 消除英文版 Section 11 中残留的中文全角冒号与标点瑕疵
    const s11XmlTexts = Array.from(s11.node?.getElementsByTagNameNS(W_NS, 't') || []);
    for (const tNode of s11XmlTexts) {
      if (tNode.textContent && tNode.textContent.includes('：')) {
        tNode.textContent = tNode.textContent.replace(/：/g, ':');
      }
    }`;

const replaceS11Xml = `    // 消除英文版 Section 11 中残留的中文全角冒号、拼写瑕疵及转义字符
    const s11XmlTexts = Array.from(s11.node?.getElementsByTagNameNS(W_NS, 't') || []);
    for (const tNode of s11XmlTexts) {
      if (tNode.textContent) {
        if (tNode.textContent.includes('：')) tNode.textContent = tNode.textContent.replace(/：/g, ':');
        if (tNode.textContent.includes('orga ntoxicity')) tNode.textContent = tNode.textContent.replace(/orga ntoxicity/g, 'organ toxicity');
        if (tNode.textContent.includes('repeate dexposure')) tNode.textContent = tNode.textContent.replace(/repeate dexposure/g, 'repeated exposure');
        if (tNode.textContent.includes('&gt;')) tNode.textContent = tNode.textContent.replace(/&gt;/g, '>');
      }
    }`;

if (!content.includes(normalize(targetS11Xml))) {
  console.error('targetS11Xml not found!');
  process.exit(1);
}
content = content.replace(normalize(targetS11Xml), normalize(replaceS11Xml));

// 5. In executeEightDeliverablesPipeline: enforceTableStandardBorders
const targetBorders = `  // 3.5 真实性交叉质检门禁（防止再犯：拦截任何模板残留或中英文不一致）
  assertBilingualIntegrity(baseCnEngine, baseEnEngine);`;

const replaceBorders = `  // 3.4 全局强化表格边框规范 (外框实线，内框统一虚线)
  for (const eng of [baseCnEngine, baseEnEngine, cnPresetEngine, enPresetEngine]) {
    for (const record of eng.records) {
      if (record.kind === 'table') {
        enforceTableStandardBorders(record);
      }
    }
  }

  // 3.5 真实性交叉质检门禁（防止再犯：拦截任何模板残留或中英文不一致）
  assertBilingualIntegrity(baseCnEngine, baseEnEngine);`;

if (!content.includes(normalize(targetBorders))) {
  console.error('targetBorders not found!');
  process.exit(1);
}
content = content.replace(normalize(targetBorders), normalize(replaceBorders));

const outPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/proposed_pipeline_engine.js';
fs.writeFileSync(outPath, content, 'utf8');
console.log('Successfully generated scratch/proposed_pipeline_engine.js');
