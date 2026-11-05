import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';

// Initialize global DOMParser and XMLSerializer for pipeline-engine
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { executeEightDeliverablesPipeline } from './src/pipeline-engine.js';
import { runMasterMsdsAudit } from './scripts/run_master_msds_audit.mjs';

const SOURCE_BASE_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP';
const TARGET_BASE_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP';
const TEMPLATE_DOCX_PATH = path.join(SOURCE_BASE_DIR, 'EP-1704/EP-1704 msds_CN 冠志.docx');

const MODELS_CONFIG = [
  {
    modelCode: 'EP-1736',
    components: [
      { name: '改性环氧聚合物', cas: '商业机密', conc: '50-57' },
      { name: '水', cas: '7732-18-5', conc: '20-33' },
      { name: '丙二醇甲醚', cas: '107-98-2', conc: '5-17' }
    ],
    viscosity: '＜400mPa.s',
    solids: '55±2.5%',
    hasGlycolEtherInS2: true
  },
  {
    modelCode: 'EP-1704',
    components: [
      { name: '改性环氧聚合物', cas: '商业机密', conc: '45-55' },
      { name: '水', cas: '7732-18-5', conc: '35-45' },
      { name: '丙二醇甲醚', cas: '107-98-2', conc: '2-8' }
    ],
    viscosity: '200-5000mPa.s',
    solids: '53±2%',
    hasGlycolEtherInS2: true
  },
  {
    modelCode: 'EP-1505',
    components: [
      { name: '改性环氧聚合物', cas: '商业机密', conc: '45-55' },
      { name: '水', cas: '7732-18-5', conc: '33-50' },
      { name: '丙二醇甲醚', cas: '107-98-2', conc: '3-13' }
    ],
    viscosity: '200-5000mPa.s',
    solids: '52±2%',
    hasGlycolEtherInS2: true
  },
  {
    modelCode: 'EP-1501',
    components: [
      { name: '改性环氧聚合物', cas: '商业机密', conc: '55-65' },
      { name: '水', cas: '7732-18-5', conc: '35-45' }
    ],
    viscosity: '200-5000mPa.s',
    solids: '60±2%',
    hasGlycolEtherInS2: false
  },
  {
    modelCode: 'EP-1737',
    components: [
      { name: '改性环氧聚合物', cas: '商业机密', conc: '53-60' },
      { name: '水', cas: '7732-18-5', conc: '20-33' },
      { name: '丙二醇甲醚', cas: '107-98-2', conc: '5-17' }
    ],
    viscosity: '200-5000mPa.s',
    solids: '58±2.5%',
    hasGlycolEtherInS2: true
  }
];

/**
 * 辅助函数：根据模板克隆并生成源文档 DOCX
 */
async function buildSourceDocx(templateBuffer, cfg) {
  const zip = await JSZip.loadAsync(templateBuffer);
  const docXml = await zip.file('word/document.xml').async('text');
  const doc = new (dom.window.DOMParser)().parseFromString(docXml, 'text/xml');
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));

  // 1. Table 0 (Section 1): 修改 1.1 产品名称
  const t0 = tables[0];
  const r1Cell1 = Array.from(t0.getElementsByTagNameNS(W_NS, 'tr'))[1]?.getElementsByTagNameNS(W_NS, 'tc')[1];
  if (r1Cell1) {
    const tNodes = Array.from(r1Cell1.getElementsByTagNameNS(W_NS, 't'));
    if (tNodes.length > 0) {
      tNodes[0].textContent = cfg.modelCode;
      for (let i = 1; i < tNodes.length; i++) tNodes[i].textContent = '';
    }
  }

  // 2. Table 1 (Section 2): 根据 hasGlycolEtherInS2 调整段落
  const t1 = tables[1];
  const t1R1C0 = Array.from(t1.getElementsByTagNameNS(W_NS, 'tr'))[1]?.getElementsByTagNameNS(W_NS, 'tc')[0];
  if (t1R1C0) {
    const ps = Array.from(t1R1C0.getElementsByTagNameNS(W_NS, 'p'));
    for (const p of ps) {
      const pText = Array.from(p.getElementsByTagNameNS(W_NS, 't')).map(t => t.textContent).join('');
      if (/GHS[- ]?象形图/i.test(pText)) {
        if (!cfg.hasGlycolEtherInS2) {
          t1R1C0.removeChild(p);
        }
      }
    }
  }

  // 3. Table 2 (Section 3): 修改成分行并展开为独立表格行
  const t2 = tables[2];
  const trs = Array.from(t2.getElementsByTagNameNS(W_NS, 'tr'));
  const r4 = trs[4];
  if (r4) {
    const parentTbl = r4.parentNode;
    const setRowCells = (rowNode, comp) => {
      const cells = Array.from(rowNode.getElementsByTagNameNS(W_NS, 'tc'));
      const setCellText = (cell, text) => {
        if (!cell) return;
        const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
        const baseP = ps[0] ? ps[0].cloneNode(true) : doc.createElementNS(W_NS, 'w:p');
        while (cell.firstChild) cell.removeChild(cell.firstChild);
        const tcPr = doc.createElementNS(W_NS, 'w:tcPr');
        cell.appendChild(tcPr);
        while (baseP.firstChild) baseP.removeChild(baseP.firstChild);
        const r = doc.createElementNS(W_NS, 'w:r');
        const t = doc.createElementNS(W_NS, 'w:t');
        t.textContent = text;
        r.appendChild(t);
        baseP.appendChild(r);
        cell.appendChild(baseP);
      };
      if (cells[0]) setCellText(cells[0], comp.name);
      if (cells[1]) setCellText(cells[1], comp.cas);
      if (cells[2]) setCellText(cells[2], comp.conc);
    };

    setRowCells(r4, cfg.components[0]);
    let prevRow = r4;
    for (let cIdx = 1; cIdx < cfg.components.length; cIdx++) {
      const clonedTr = r4.cloneNode(true);
      setRowCells(clonedTr, cfg.components[cIdx]);
      parentTbl.insertBefore(clonedTr, prevRow.nextSibling);
      prevRow = clonedTr;
    }
  }

  // 4. Table 8 (Section 9): 修改粘度与固含量
  const t8 = tables[8];
  const rows8 = Array.from(t8.getElementsByTagNameNS(W_NS, 'tr'));
  for (const row of rows8) {
    const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
    if (cells.length < 2) continue;
    const lbl = Array.from(cells[0].getElementsByTagNameNS(W_NS, 't')).map(t => t.textContent).join('');
    if (/动力粘度|粘度/i.test(lbl)) {
      const tNodes = Array.from(cells[1].getElementsByTagNameNS(W_NS, 't'));
      if (tNodes.length > 0) {
        tNodes[0].textContent = cfg.viscosity;
        for (let i = 1; i < tNodes.length; i++) tNodes[i].textContent = '';
      }
    } else if (/固体含量|固含/i.test(lbl)) {
      const tNodes = Array.from(cells[1].getElementsByTagNameNS(W_NS, 't'));
      if (tNodes.length > 0) {
        tNodes[0].textContent = cfg.solids;
        for (let i = 1; i < tNodes.length; i++) tNodes[i].textContent = '';
      }
    }
  }

  const newXml = new (dom.window.XMLSerializer)().serializeToString(doc);
  zip.file('word/document.xml', newXml);
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function runAll() {
  console.log('========================================================================');
  console.log('     MSDS Studio 工业级全量覆写批处理流水线：水性环氧树脂 EP 5 大型号    ');
  console.log('========================================================================\n');

  const templateBuf = fs.readFileSync(TEMPLATE_DOCX_PATH);
  const auditResults = [];

  for (const cfg of MODELS_CONFIG) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`>>> 开始生产型号: ${cfg.modelCode}`);
    console.log(`------------------------------------------------------------------------`);

    const sourceDir = path.join(SOURCE_BASE_DIR, cfg.modelCode);
    const targetDir = path.join(TARGET_BASE_DIR, cfg.modelCode);
    await fs.promises.mkdir(sourceDir, { recursive: true });
    await fs.promises.mkdir(targetDir, { recursive: true });

    const sourceDocxPath = path.join(sourceDir, `${cfg.modelCode} msds_CN 冠志.docx`);

    // 1. 统一生成高保真独立多行源文档
    console.log(`[SourceGen] 生成高保真源文档: ${sourceDocxPath}`);
    const newBuf = await buildSourceDocx(templateBuf, cfg);
    await fs.promises.writeFile(sourceDocxPath, newBuf);

    // 2. 调用受控流水线生成 8 份标准交付物 (4 DOCX + 4 PDF)
    console.log(`[Pipeline] 启动受控八交付物流水线: ${cfg.modelCode}`);
    const pipelineRes = await executeEightDeliverablesPipeline({
      modelCode: cfg.modelCode,
      cnGroundTruthPath: sourceDocxPath,
      targetDir: targetDir,
      facts: {
        viscosityOverride: cfg.viscosity
      }
    });

    console.log(`[Pipeline] 交付物派生完毕, 生成数量: ${pipelineRes.deliverables?.length || 0}`);

    // 3. 运行集中式中央主审计套件 (runMasterMsdsAudit)
    console.log(`[MasterAudit] 对 ${cfg.modelCode} 运行中央主审计套件 129 项物理断言...`);
    const auditRes = await runMasterMsdsAudit({
      model: cfg.modelCode,
      targetDir: targetDir,
      sourceDocx: sourceDocxPath
    });

    auditResults.push({
      model: cfg.modelCode,
      success: auditRes.success,
      total: auditRes.totalAssertions,
      passed: auditRes.passCount + auditRes.whitelistPassCount,
      failed: auditRes.failCount
    });
  }

  console.log('\n========================================================================');
  console.log('                     全量 5 大型号覆写与主审计汇总                       ');
  console.log('========================================================================');
  console.table(auditResults);

  const allPassed = auditResults.every(r => r.success);
  if (allPassed) {
    console.log('\n🎉🎉🎉 全部 5 大型号 100% 满分通过主审计套件验证！0 缺陷！🎉🎉🎉\n');
  } else {
    console.error('\n❌ 部分型号未通过主审计，请检查详细日志！\n');
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal batch execution error:', err);
  process.exit(1);
});
