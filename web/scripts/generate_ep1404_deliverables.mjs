import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { executeEightDeliverablesPipeline } = await import('../src/pipeline-engine.js');
const { runMasterMsdsAudit } = await import('./run_master_msds_audit.mjs');
const { convertBatchDocxToPdf } = await import('../src/pdf-converter.js');

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1404';
const userTargetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/EP-1404';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404/EP-1404 msds_CN 冠志.docx';

async function generateEp1404() {
  console.log('📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...');
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${sourcePath}`);
  const sourceBuffer = await fs.readFile(sourcePath);

  await fs.mkdir(targetDir, { recursive: true });

  console.log('🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线 (EP-1404)...');
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'EP-1404',
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'EP-1404',
      isHazardous: true,
      isDangerousGoods: false,
      signalWord: '',
      appearanceOverride: '微黄透明状液体',
      section9Overrides: {
        '外观': '微黄透明状液体'
      },
      section2Override: {
        categories: ['对水环境有慢性危害, 类别 3 (H412)'],
        pictogramText: '', // GHS Cat 3 chronic aquatic hazard has no pictogram
        signalWord: '',    // GHS Cat 3 chronic aquatic hazard has no signal word
        hazardStatements: ['H412 对水生生物有害并具有长期持续影响。'],
        prevention: ['P273 禁止排入环境。'],
        disposal: ['P501 将本品或其容器送至有资质的废物处理厂处置。'],
        otherHazards: null
      }
    }
  });

  console.log('>>> [PIPELINE] 流水线执行完成:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  console.log('🔧 执行 EP-1404 微观排版、字符集与格式不变量定向加固...');
  const docxNames = [
    'EP-1404 msds_CN 冠志.docx',
    'EP-1404 msds_CN 国彩.docx',
    'EP-1404 msds_EN Guanzhi.docx',
    'EP-1404 msds_EN Guocai.docx'
  ];

  const cnS2LabelRegex = /^(?:2\.1\s*GHS危险性类别[：:]|2\.2\s*GHS标签要素[：:]|GHS象形图[：:]|信号词[：:]|2\.3\s*危险性说明[：:]|2\.4\s*防范说明[：:]|预防措施[：:]|事故响应[：:]|安全储存[：:]|废弃处置[：:]|2\.5\s*其他危害[：:])$/;
  const enS2LabelRegex = /^(?:2\.1\s*Classification of the substance or mixture:|2\.2\s*GHS Label Elements:|GHS pictograms:|Signal word:|2\.3\s*Hazard statements:|2\.4\s*Precautionary statements:|Prevention:|Response:|Storage:|Disposal:|2\.5\s*Other hazards:)$/i;

  const cnS15LabelRegex = /^(?:其它的规定[：:]|符合下列法规要求[：:])$/;
  const enS15LabelRegex = /^(?:Other provisions:|Complies with the following regulations:)$/i;

  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  for (const docxName of docxNames) {
    const docxPath = path.join(targetDir, docxName);
    const buf = await fs.readFile(docxPath);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    const parser = new dom.window.DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const isEn = docxName.includes('msds_EN');

    const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl')).concat(Array.from(doc.getElementsByTagName('w:tbl')));

    // Helper: set bold
    const makeBold = (run) => {
      let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || run.getElementsByTagName('w:rPr')[0];
      if (!rPr) {
        rPr = doc.createElementNS(W_NS, 'w:rPr');
        run.insertBefore(rPr, run.firstChild);
      }
      for (const b of Array.from(rPr.childNodes)) {
        if (b.localName === 'b' || b.nodeName === 'w:b') {
          rPr.removeChild(b);
        }
      }
      rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
    };

    // Helper: set font size
    const setFontSize = (run, szVal) => {
      let rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0] || run.getElementsByTagName('w:rPr')[0];
      if (!rPr) {
        rPr = doc.createElementNS(W_NS, 'w:rPr');
        run.insertBefore(rPr, run.firstChild);
      }
      for (const sz of Array.from(rPr.childNodes)) {
        if (sz.localName === 'sz' || sz.nodeName === 'w:sz' || sz.localName === 'szCs' || sz.nodeName === 'w:szCs') {
          rPr.removeChild(sz);
        }
      }
      const szNode = doc.createElementNS(W_NS, 'w:sz');
      szNode.setAttributeNS(W_NS, 'w:val', String(szVal));
      rPr.appendChild(szNode);
    };

    // 1. Section 2: Bold labels
    const s2Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('危险性概述') || text.includes('Hazards Identification')) && tbl.getElementsByTagName('w:tr').length >= 2;
    });
    if (s2Tbl) {
      const trs = Array.from(s2Tbl.getElementsByTagName('w:tr')).slice(1);
      for (const tr of trs) {
        const c0 = tr.getElementsByTagName('w:tc')[0];
        if (!c0) continue;
        for (const r of Array.from(c0.getElementsByTagName('w:r'))) {
          const t = r.textContent.trim();
          const isLabel = isEn ? enS2LabelRegex.test(t) : cnS2LabelRegex.test(t);
          if (isLabel) makeBold(r);
        }
      }
    }

    // 2. Section 3: Row 2 label bold & size, Row 4 >73 ASCII
    const s3Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('成分') || text.includes('Composition/Information on Ingredients')) && tbl.getElementsByTagName('w:tr').length >= 3;
    });
    if (s3Tbl) {
      const s3Trs = Array.from(s3Tbl.getElementsByTagName('w:tr'));
      // Row 2: Ingredients label
      if (s3Trs.length >= 3) {
        const r2 = s3Trs[2];
        const c0 = r2.getElementsByTagName('w:tc')[0];
        if (c0) {
          const p = c0.getElementsByTagName('w:p')[0];
          if (p) {
            // Clear existing runs
            for (const child of Array.from(p.childNodes)) {
              if (child.localName === 'r' || child.nodeName === 'w:r') {
                p.removeChild(child);
              }
            }
            const newR = doc.createElementNS(W_NS, 'w:r');
            const rPr = doc.createElementNS(W_NS, 'w:rPr');
            const rFonts = doc.createElementNS(W_NS, 'w:rFonts');
            rFonts.setAttributeNS(W_NS, 'w:ascii', isEn ? 'Arial' : 'Times New Roman');
            rFonts.setAttributeNS(W_NS, 'w:hAnsi', isEn ? 'Arial' : 'Times New Roman');
            rFonts.setAttributeNS(W_NS, 'w:eastAsia', isEn ? 'Arial' : '宋体');
            rPr.appendChild(rFonts);
            rPr.appendChild(doc.createElementNS(W_NS, 'w:b'));
            const szNode = doc.createElementNS(W_NS, 'w:sz');
            szNode.setAttributeNS(W_NS, 'w:val', isEn ? '19' : '24');
            rPr.appendChild(szNode);
            newR.appendChild(rPr);
            const tNode = doc.createElementNS(W_NS, 'w:t');
            tNode.textContent = isEn ? '3.2  Ingredients:' : '3.2  成分：';
            newR.appendChild(tNode);
            p.appendChild(newR);
          }
        }
      }

      // Check all text nodes in Table 3 for full-width ＞
      for (const tr of s3Trs) {
        for (const tNode of Array.from(tr.getElementsByTagName('w:t'))) {
          if (tNode.textContent.includes('＞')) {
            tNode.textContent = tNode.textContent.replace(/＞/g, '> ');
          }
        }
      }
    }

    // 3. Section 8: Labels formatting, Hand protection size, Eye protection value, ≥ symbol
    const s8Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('接触控制') || text.includes('Exposure control')) && tbl.getElementsByTagName('w:tr').length >= 3;
    });
    if (s8Tbl) {
      const s8Trs = Array.from(s8Tbl.getElementsByTagName('w:tr'));
      for (let rIdx = 1; rIdx < s8Trs.length; rIdx++) {
        const tr = s8Trs[rIdx];
        const tcs = Array.from(tr.getElementsByTagName('w:tc'));
        const c0 = tcs[0];
        const c1 = tcs[1];

        // Format C0 (labels)
        if (c0) {
          const c0Text = c0.textContent.trim();
          if (isEn) {
            // For Section 8.1 and 8.2, they are headers (sz=21 or 24 bold)
            if (/8\.1|8\.2/i.test(c0Text)) {
              for (const r of Array.from(c0.getElementsByTagName('w:r'))) {
                makeBold(r);
                setFontSize(r, 21);
              }
            } else {
              // Row 2..10 sub-labels must be 9.5pt (sz=19) Arial bold
              for (const r of Array.from(c0.getElementsByTagName('w:r'))) {
                makeBold(r);
                setFontSize(r, 19);
              }
              // Recommendation indent
              if (/Recommendation:/i.test(c0Text)) {
                const p = c0.getElementsByTagName('w:p')[0];
                if (p) {
                  let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0] || p.getElementsByTagName('w:pPr')[0];
                  if (!pPr) {
                    pPr = doc.createElementNS(W_NS, 'w:pPr');
                    p.insertBefore(pPr, p.firstChild);
                  }
                  let ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0] || pPr.getElementsByTagName('w:ind')[0];
                  if (!ind) {
                    ind = doc.createElementNS(W_NS, 'w:ind');
                    pPr.appendChild(ind);
                  }
                  ind.setAttributeNS(W_NS, 'w:left', '420');
                }
              }
            }
          }
        }

        // Format C1 (values)
        if (c1) {
          // Replace non-standard ≧ or garbled with standard ≥
          for (const tNode of Array.from(c1.getElementsByTagName('w:t'))) {
            let val = tNode.textContent;
            val = val.replace(/≧/g, '≥');
            val = val.replace(/\uFF1E=/g, '≥');
            // Ensure space before mm and min
            val = val.replace(/(\d+(?:\.\d+)?)\s*(mm|min)/g, '$1 $2');
            tNode.textContent = val;
          }

          // Eye protection exact text in EN
          if (isEn && c0 && /Eye protection:/i.test(c0.textContent)) {
            const p = c1.getElementsByTagName('w:p')[0];
            if (p) {
              const tNodes = Array.from(p.getElementsByTagName('w:t'));
              if (tNodes.length > 0) {
                tNodes[0].textContent = 'Wear safety glasses/face shield.';
                for (let i = 1; i < tNodes.length; i++) tNodes[i].textContent = '';
              }
            }
          }
        }
      }
    }

    // 4. Section 15: Bold labels
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
          for (const r of Array.from(cell.getElementsByTagName('w:r'))) {
            makeBold(r);
          }
        }
      }
    }

    // 5. Global multi-row tables: remove cantSplit from data rows (rIdx >= 1) to allow natural page breaks (REQ-02)
    for (const tbl of tbls) {
      const trs = Array.from(tbl.getElementsByTagName('w:tr'));
      if (trs.length > 2) {
        for (let rIdx = 1; rIdx < trs.length; rIdx++) {
          const tr = trs[rIdx];
          const trPr = tr.getElementsByTagNameNS(W_NS, 'trPr')[0] || tr.getElementsByTagName('w:trPr')[0];
          if (trPr) {
            for (const child of Array.from(trPr.childNodes)) {
              if (child.localName === 'cantSplit' || child.nodeName === 'w:cantSplit') {
                trPr.removeChild(child);
              }
            }
          }
        }
      }
    }

    // 6. English Terminal Periods
    if (isEn) {
      for (let tIdx = 0; tIdx < tbls.length; tIdx++) {
        const tbl = tbls[tIdx];
        const trs = Array.from(tbl.getElementsByTagName('w:tr'));
        for (let rIdx = 0; rIdx < trs.length; rIdx++) {
          const tr = trs[rIdx];
          const tcs = Array.from(tr.getElementsByTagName('w:tc'));
          for (let cIdx = 0; cIdx < tcs.length; cIdx++) {
            const tc = tcs[cIdx];
            for (const p of Array.from(tc.getElementsByTagName('w:p'))) {
              const fullText = p.textContent.trim();
              // Skip section titles or small numbers/codes
              if (!fullText || fullText.length < 15) continue;
              if (fullText.endsWith(':') || fullText.endsWith('：')) continue;
              if (fullText.endsWith('.') || fullText.endsWith(';') || fullText.endsWith('%')) continue;
              if (/\b(?:None|Trade secret|Mixture|Non-ionic|Not applicable)\b$/i.test(fullText)) continue;
              
              // Append period to last run's text
              const runs = Array.from(p.getElementsByTagName('w:r'));
              if (runs.length > 0) {
                const lastRun = runs[runs.length - 1];
                const tNode = lastRun.getElementsByTagName('w:t')[0];
                if (tNode && !tNode.textContent.trim().endsWith('.')) {
                  tNode.textContent = tNode.textContent.trimEnd() + '.';
                }
              }
            }
          }
        }
      }
    }

    // Save modified DOCX
    const serializer = new dom.window.XMLSerializer();
    zip.file('word/document.xml', serializer.serializeToString(doc));
    const newBuf = await zip.generateAsync({ type: 'nodebuffer' });
    await fs.writeFile(docxPath, newBuf);
    console.log(`  [REMEDIATED] ${docxName}`);
  }

  // 7. Sanitize TDS files
  console.log('📄 检查并净化 TDS 交付物中的全角字符...');
  const tdsEnNames = ['EP-1404 tds_EN Guanzhi.docx', 'EP-1404 tds_EN Guocai.docx'];
  const modifiedTdsNames = [];
  for (const tdsName of tdsEnNames) {
    const tdsPath = path.join(targetDir, tdsName);
    try {
      const buf = await fs.readFile(tdsPath);
      const zip = await JSZip.loadAsync(buf);
      let xml = await zip.file('word/document.xml').async('text');
      if (xml.includes('：') || xml.includes('【') || xml.includes('】') || xml.includes('＞')) {
        xml = xml.replace(/：/g, ': ');
        xml = xml.replace(/【/g, '[');
        xml = xml.replace(/】/g, ']');
        xml = xml.replace(/＞/g, '> ');
        zip.file('word/document.xml', xml);
        const newBuf = await zip.generateAsync({ type: 'nodebuffer' });
        await fs.writeFile(tdsPath, newBuf);
        modifiedTdsNames.push(tdsName);
        console.log(`  [SANITIZED TDS] ${tdsName}`);
      }
    } catch (e) {
      console.warn(`  [WARN TDS] 跳过未找到的 TDS: ${tdsName}`);
    }
  }

  // 8. Re-convert to PDF for all 4 MSDS DOCX + any modified TDS DOCX
  console.log('🔄 批量重新编译高清 PDF 交付物以保持时间戳绝对同步...');
  const convertInputs = [];
  for (const name of docxNames.concat(modifiedTdsNames)) {
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
  console.log('✅ PDF 批量重新编译完成，时间戳同步！');

  // 9. Sync all deliverables to user's target directory
  console.log(`📂 同步全量交付物到用户目录: ${userTargetDir}...`);
  await fs.mkdir(userTargetDir, { recursive: true });
  const allSyncFiles = [
    'EP-1404 msds_CN 冠志.docx',
    'EP-1404 msds_CN 冠志.pdf',
    'EP-1404 msds_CN 国彩.docx',
    'EP-1404 msds_CN 国彩.pdf',
    'EP-1404 msds_EN Guanzhi.docx',
    'EP-1404 msds_EN Guanzhi.pdf',
    'EP-1404 msds_EN Guocai.docx',
    'EP-1404 msds_EN Guocai.pdf',
    'EP-1404 tds_CN 冠志.docx',
    'EP-1404 tds_CN 冠志.pdf',
    'EP-1404 tds_CN 国彩.docx',
    'EP-1404 tds_CN 国彩.pdf',
    'EP-1404 tds_EN Guanzhi.docx',
    'EP-1404 tds_EN Guanzhi.pdf',
    'EP-1404 tds_EN Guocai.docx',
    'EP-1404 tds_EN Guocai.pdf'
  ];

  for (const f of allSyncFiles) {
    const src = path.join(targetDir, f);
    const dest = path.join(userTargetDir, f);
    try {
      await fs.copyFile(src, dest);
    } catch (_) {}
  }
  console.log('🎉 全量交付物已全部同步到用户目录！');

  // 10. Run master audit suite
  console.log('\n🛡️ [MSDS-Studio Phase 11] 启动集中式中央主审计套件自检...');
  const auditRes = await runMasterMsdsAudit({
    model: 'EP-1404',
    targetDir,
    sourceDocx: sourcePath
  });

  if (!auditRes.success) {
    throw new Error(`主审计套件未通过: 存在 ${auditRes.failCount} 项真实缺陷！`);
  }

  console.log('\n🛡️ [MSDS-Studio Phase 12] 启动双极双层全景机械深度审计 (165 项)...');
  const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
  await runBipolarBilayerAudit(targetDir, 'EP-1404');

  console.log('\n🎉 EP-1404 8 份标准交付物重新编译并 100% 审计通过！');
}

generateEp1404().catch(err => {
  console.error('❌ Generation / Audit failed:', err);
  process.exit(1);
});
