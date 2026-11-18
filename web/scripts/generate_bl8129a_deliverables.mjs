import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runMasterMsdsAudit } = await import('./run_master_msds_audit.mjs');
import JSZip from 'jszip';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A/BL-8129A/中文版/BL-8129A msds_CN 冠志_源文件留存.docx';
const altTargetDir1 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A/BL-8129A/八格式版';
const altTargetDir2 = 'E:/冠志/TDS MSDS (2)/TDS MSDS/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A';
const altTargetDir3 = 'E:/冠志/TDS MSDS (2)/待处理文件/BL-8129A';

async function generateBl8129a() {
  console.log('📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...');
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${sourcePath}`);
  const sourceBuffer = await fs.readFile(sourcePath);

  await fs.mkdir(targetDir, { recursive: true });

  console.log('🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线 (BL-8129A)...');
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'BL-8129A',
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'BL-8129A',
      isHazardous: false
    }
  });

  console.log('>>> [PIPELINE] 流水线执行完成:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  // Ensure Section 2 and Section 15 bold formatting on all 4 DOCX files
  console.log('🔧 检查并确保 Section 2 和 Section 15 结构性标签加粗规范...');
  const docxNames = [
    'BL-8129A msds_CN 冠志.docx',
    'BL-8129A msds_CN 国彩.docx',
    'BL-8129A msds_EN Guanzhi.docx',
    'BL-8129A msds_EN Guocai.docx'
  ];

  const cnS2LabelRegex = /^(?:2\.1\s*GHS危险性类别[：:]|2\.2\s*GHS标签要素[：:]|GHS象形图[：:]|GHS-象形图[：:]|信号词[：:]|警示词[：:]|2\.3\s*危险性说明[：:]|2\.4\s*防范说明[：:]|预防措施[：:]|事故响应[：:]|安全储存[：:]|废弃处置[：:]|2\.5\s*其他危害[：:])$/;
  const enS2LabelRegex = /^(?:2\.1\s*Classification of the substance or mixture:|2\.2\s*GHS Label Elements:|GHS pictograms:|Signal word:|2\.3\s*Hazard statements:|2\.4\s*Precautionary statements:|Prevention:|Response:|Storage:|Disposal:|2\.5\s*Other hazards:)$/i;

  const cnS15LabelRegex = /^(?:其它的规定[：:]|符合下列法规要求[：:])$/;
  const enS15LabelRegex = /^(?:Other provisions:|Complies with the following regulations:)$/i;

  let anyDocxModified = false;

  for (const docxName of docxNames) {
    const docxPath = path.join(targetDir, docxName);
    const buf = await fs.readFile(docxPath);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const parser = new dom.window.DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const isEn = docxName.includes('msds_EN');

    let modified = false;

    // 1. Check Section 2
    const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl')).concat(Array.from(doc.getElementsByTagName('w:tbl')));
    const s2Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('危险性概述') || text.includes('Hazards Identification')) && tbl.getElementsByTagName('w:tr').length >= 2;
    });

    if (s2Tbl) {
      const r1 = Array.from(s2Tbl.getElementsByTagName('w:tr'))[1];
      const c0 = r1 ? Array.from(r1.getElementsByTagName('w:tc'))[0] : null;
      if (c0) {
        const runs = Array.from(c0.getElementsByTagName('w:r'));
        for (const r of runs) {
          const t = r.textContent.trim();
          const isLabel = isEn ? enS2LabelRegex.test(t) : cnS2LabelRegex.test(t);
          if (isLabel) {
            let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0] || r.getElementsByTagName('w:rPr')[0];
            if (!rPr) {
              rPr = doc.createElementNS(W_NS, 'w:rPr');
              r.insertBefore(rPr, r.firstChild);
            }
            const existingB = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b')).concat(Array.from(rPr.getElementsByTagName('w:b')));
            const hasVal0 = existingB.some(b => b.getAttribute('w:val') === '0' || b.getAttribute('w:val') === 'false');
            if (existingB.length === 0 || hasVal0) {
              for (const b of existingB) rPr.removeChild(b);
              const b = doc.createElementNS(W_NS, 'w:b');
              rPr.appendChild(b);
              modified = true;
            }
          }
        }
      }
    }

    // 2. Check Section 15
    const s15Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('法规信息') || text.includes('Regulatory information')) && tbl.getElementsByTagName('w:tr').length >= 3;
    });

    if (s15Tbl) {
      const rows = Array.from(s15Tbl.getElementsByTagName('w:tr'));
      for (const row of rows) {
        const cell = Array.from(row.getElementsByTagName('w:tc'))[0];
        if (!cell) continue;
        const cellText = cell.textContent.trim();
        const isLabel = isEn ? enS15LabelRegex.test(cellText) : cnS15LabelRegex.test(cellText);
        if (isLabel) {
          const runs = Array.from(cell.getElementsByTagName('w:r'));
          for (const r of runs) {
            let rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0] || r.getElementsByTagName('w:rPr')[0];
            if (!rPr) {
              rPr = doc.createElementNS(W_NS, 'w:rPr');
              r.insertBefore(rPr, r.firstChild);
            }
            const existingB = Array.from(rPr.getElementsByTagNameNS(W_NS, 'b')).concat(Array.from(rPr.getElementsByTagName('w:b')));
            const hasVal0 = existingB.some(b => b.getAttribute('w:val') === '0' || b.getAttribute('w:val') === 'false');
            if (existingB.length === 0 || hasVal0) {
              for (const b of existingB) rPr.removeChild(b);
              const b = doc.createElementNS(W_NS, 'w:b');
              rPr.appendChild(b);
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      const serializer = new dom.window.XMLSerializer();
      zip.file('word/document.xml', serializer.serializeToString(doc));
      const newBuf = await zip.generateAsync({ type: 'nodebuffer' });
      await fs.writeFile(docxPath, newBuf);
      anyDocxModified = true;
      console.log(`  [UPDATED BOLD] ${docxName}`);
    }
  }

  // Re-convert to PDF if any DOCX was updated
  if (anyDocxModified) {
    console.log('🔄 重新转换更新后的 4 份 PDF...');
    const { convertBatchDocxToPdf } = await import('../src/pdf-converter.js');
    const convertInputs = [];
    for (const name of docxNames) {
      const docxPath = path.join(targetDir, name);
      convertInputs.push({
        docxBuffer: await fs.readFile(docxPath),
        fileName: name
      });
    }
    const pdfOutputs = await convertBatchDocxToPdf(convertInputs);
    for (const p of pdfOutputs) {
      const outPdfPath = path.join(targetDir, p.pdfName);
      await fs.writeFile(outPdfPath, p.pdfBuffer);
    }
    console.log('✅ PDF 重新编译完成，时间戳同步！');
  }

  // 3. Sync to other directories
  const all8Files = [
    'BL-8129A msds_CN 冠志.docx',
    'BL-8129A msds_CN 冠志.pdf',
    'BL-8129A msds_CN 国彩.docx',
    'BL-8129A msds_CN 国彩.pdf',
    'BL-8129A msds_EN Guanzhi.docx',
    'BL-8129A msds_EN Guanzhi.pdf',
    'BL-8129A msds_EN Guocai.docx',
    'BL-8129A msds_EN Guocai.pdf'
  ];

  for (const altDir of [altTargetDir1, altTargetDir2, altTargetDir3]) {
    try {
      await fs.mkdir(altDir, { recursive: true });
      for (const f of all8Files) {
        const src = path.join(targetDir, f);
        const dest = path.join(altDir, f);
        await fs.copyFile(src, dest);
      }
      console.log(`📂 同步 8 份标准交付物至: ${altDir}`);
    } catch (e) {
      console.warn(`同步至 ${altDir} 提示: ${e.message}`);
    }
  }

  // 4. Run master audit suite
  console.log('\n🛡️ [MSDS-Studio Phase 11] 启动集中式中央主审计套件自检...');
  const auditRes = await runMasterMsdsAudit({
    model: 'BL-8129A',
    targetDir,
    sourceDocx: sourcePath
  });

  if (!auditRes.success) {
    throw new Error(`主审计套件未通过: 存在 ${auditRes.failCount} 项真实缺陷！`);
  }

  console.log('\n🎉 BL-8129A 8 份标准交付物重新编译并 100% 审计通过！');
}

generateBl8129a().catch(err => {
  console.error('❌ Generation / Audit failed:', err);
  process.exit(1);
});
