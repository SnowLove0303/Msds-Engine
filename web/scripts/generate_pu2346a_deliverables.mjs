import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runMasterMsdsAudit } = await import('./run_master_msds_audit.mjs');
import JSZip from 'jszip';

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A';
const userTargetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';

async function generatePu2346a() {
  console.log('📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...');
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${sourcePath}`);
  const sourceBuffer = await fs.readFile(sourcePath);

  await fs.mkdir(targetDir, { recursive: true });

  console.log('🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线 (PU-2346A)...');
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'PU-2346A',
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'PU-2346A',
      isHazardous: true,
      isDangerousGoods: true,
      marpol: true,
      section9Overrides: {
        'pH': '6-9',
        'pH值': '6-9'
      }
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
    'PU-2346A msds_CN 冠志.docx',
    'PU-2346A msds_CN 国彩.docx',
    'PU-2346A msds_EN Guanzhi.docx',
    'PU-2346A msds_EN Guocai.docx'
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

    // 1.5. Check Section 3 Row 2 bolding
    const s3Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('成分') || text.includes('Composition') || text.includes('Ingredients')) && tbl.getElementsByTagName('w:tr').length >= 3;
    });
    if (s3Tbl) {
      const r2 = Array.from(s3Tbl.getElementsByTagName('w:tr'))[2];
      const c0 = r2 ? Array.from(r2.getElementsByTagName('w:tc'))[0] : null;
      if (c0) {
        const runs = Array.from(c0.getElementsByTagName('w:r'));
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
            const bCs = doc.createElementNS(W_NS, 'w:bCs');
            rPr.appendChild(bCs);
            modified = true;
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

  // 3. Sync to user's directory
  console.log(`📂 同步 8 份标准交付物到用户目录: ${userTargetDir}...`);
  await fs.mkdir(userTargetDir, { recursive: true });
  const all8Files = [
    'PU-2346A msds_CN 冠志.docx',
    'PU-2346A msds_CN 冠志.pdf',
    'PU-2346A msds_CN 国彩.docx',
    'PU-2346A msds_CN 国彩.pdf',
    'PU-2346A msds_EN Guanzhi.docx',
    'PU-2346A msds_EN Guanzhi.pdf',
    'PU-2346A msds_EN Guocai.docx',
    'PU-2346A msds_EN Guocai.pdf'
  ];

  for (const f of all8Files) {
    const src = path.join(targetDir, f);
    const dest = path.join(userTargetDir, f);
    await fs.copyFile(src, dest);
  }

  // Also sync to user's 中文版 subfolder if exists
  const userCnSubDir = path.join(userTargetDir, '中文版');
  try {
    const stat = await fs.stat(userCnSubDir);
    if (stat.isDirectory()) {
      for (const f of all8Files.filter(name => name.includes('msds_CN'))) {
        await fs.copyFile(path.join(targetDir, f), path.join(userCnSubDir, f));
      }
    }
  } catch (e) {}

  console.log('🎉 8 份文件已全部同步到用户目录！');

  // 3.5 校验并修复 TDS 中和剂三乙胺与 pH 7-10 事实 (REQ-06)
  await remediatePu2346aTds();

  // 4. Run master audit suite
  console.log('\n🛡️ [MSDS-Studio Phase 11] 启动集中式中央主审计套件自检...');
  const auditRes = await runMasterMsdsAudit({
    model: 'PU-2346A',
    targetDir,
    sourceDocx: sourcePath
  });

  if (!auditRes.success) {
    throw new Error(`主审计套件未通过: 存在 ${auditRes.failCount} 项真实缺陷！`);
  }

  console.log('\n🎉 PU-2346A 8 份标准交付物重新编译并 100% 审计通过！');
}


async function remediatePu2346aTds() {
  console.log('🧪 [TDS Fix] 校验并纠治 PU-2346A 四大 TDS 文件中和剂与 pH 事实 (REQ-06)...');
  const tdsFiles = [
    'PU-2346A tds_CN 冠志.docx',
    'PU-2346A tds_CN 国彩.docx',
    'PU-2346A tds_EN Guanzhi.docx',
    'PU-2346A tds_EN Guocai.docx'
  ];

  let anyTdsModified = false;
  for (const f of tdsFiles) {
    const docxPath = path.join(targetDir, f);
    try {
      const buf = await fs.readFile(docxPath);
      const zip = await JSZip.loadAsync(buf);
      let xml = await zip.file('word/document.xml').async('text');
      const isEn = f.includes('tds_EN');
      let modified = false;

      // 1. 中和剂纠治：二甲基乙醇胺 -> 三乙胺 / DMEA -> Triethylamine
      if (!isEn && (xml.includes('二甲基乙醇胺') || xml.includes('分散在乙醇/水/'))) {
        xml = xml.replace(/约\s*35%\s*分散[在于]乙醇\s*\/\s*水\s*\/\s*二甲基乙醇胺中[（(]约\s*21\.5\s*:\s*42\s*:\s*1\.5[）)]/g, '约35%分散于乙醇/水中，用三乙胺中和，比例约21.5:42:1.5。');
        modified = true;
      } else if (isEn && (xml.includes('dimethylethanolamine') || xml.includes('dispersed in ethanol / water / dimethylethanolamine'))) {
        xml = xml.replace(/Approx\.\s*35%\s*dispersed\s*in\s*ethanol\s*\/\s*water\s*\/\s*dimethylethanolamine\s*\(\s*approx\.\s*21\.5\s*:\s*42\s*:\s*1\.5\s*\)/gi, 'Approx. 35% dispersed in ethanol / water, neutralized with triethylamine, ratio approx. 21.5 : 42 : 1.5.');
        modified = true;
      }

      // 2. TDS 表格 pH 纠治：6-9 -> 7-10
      const parser = new dom.window.DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      const tbls = Array.from(doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tbl'));
      for (const tbl of tbls) {
        const trs = Array.from(tbl.getElementsByTagName('w:tr'));
        for (const tr of trs) {
          const tcs = Array.from(tr.getElementsByTagName('w:tc'));
          const lblText = (tcs[0]?.textContent || '').trim();
          if (/PH|pH/i.test(lblText) && tcs[1]) {
            const valText = (tcs[1].textContent || '').trim();
            if (valText === '6-9' || valText.includes('6-9')) {
              const ts = Array.from(tcs[1].getElementsByTagName('w:t'));
              if (ts.length > 0) {
                ts[0].textContent = '7-10';
                for (let k = 1; k < ts.length; k++) ts[k].textContent = '';
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
        anyTdsModified = true;
        console.log(`  [UPDATED TDS] ${f}`);
      }
    } catch (e) {
      console.warn(`TDS check warning for ${f}:`, e.message);
    }
  }

  if (anyTdsModified) {
    console.log('🔄 重新转换更新后的 4 份 TDS PDF...');
    const { convertBatchDocxToPdf } = await import('../src/pdf-converter.js');
    const convertInputs = [];
    for (const name of tdsFiles) {
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
    console.log('✅ TDS PDF 重新编译完成！');

    // Sync TDS to user's directory as well!
    for (const f of tdsFiles) {
      const pdfName = f.replace('.docx', '.pdf');
      await fs.copyFile(path.join(targetDir, f), path.join(userTargetDir, f));
      await fs.copyFile(path.join(targetDir, pdfName), path.join(userTargetDir, pdfName));
    }
    console.log('✅ 4 份 TDS 交付物已同步至用户目录！');
  }
}

generatePu2346a().catch(err => {
  console.error('❌ Generation / Audit failed:', err);
  process.exit(1);
});
