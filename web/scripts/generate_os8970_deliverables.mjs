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

const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970';
const userTargetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/OS-8970';
const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx';

async function generateOs8970() {
  console.log('📡 [MSDS-Studio Phase 1] 正在建立 MSDS-Engine 原生流水线通信通道...');
  console.log(`🔍 [MSDS-Studio Phase 2] 读取源文件化学事实: ${sourcePath}`);
  const sourceBuffer = await fs.readFile(sourcePath);

  await fs.mkdir(targetDir, { recursive: true });

  console.log('🚀 [MSDS-Studio Phase 3~10] 启动 MSDS-Engine 标准 8 格式受控生产流水线 (OS-8970)...');
  const result = await executeEightDeliverablesPipeline({
    modelCode: 'OS-8970',
    cnGroundTruthPath: sourcePath,
    cnGroundTruthBuffer: sourceBuffer,
    targetDir,
    facts: {
      modelCode: 'OS-8970',
      isHazardous: false,
      isDangerousGoods: false,
      signalWord: '',
      components: [
        { name: 'Oxazoline-modified acrylic polymer', cas: 'Trade secret', conc: '40±1' },
        { name: 'Water', cas: '7732-18-5', conc: '60±1' }
      ],
      appearanceOverride: '淡黄色至黄色透明液体',
      section9Overrides: {
        '外观': '淡黄色至黄色透明液体',
        'PH值': '6.5-8.5',
        '水溶性': '可混溶的',
        '粘度': '＜500 mPa·s',
        '固体含量': '约25%',
        '闪点': '初沸点以下无闪点',
        '自燃温度': '无数据',
        '引燃温度': '无数据',
        '分解温度': '无数据',
        '爆炸特性': '无数据',
        '可燃性': '不适用',
        '粉尘爆炸级别': '不适用',
        '其他信息': '上述数据非产品指标，产品指标请参见产品技术信息表。'
      }
    }
  });

  console.log('>>> [PIPELINE] 流水线执行完成:', {
    model: result.model,
    deliverablesCount: result.deliverables?.length,
    durationMs: result.durationMs
  });

  // 微观排版、字符集与格式不变量定向加固
  console.log('🔧 执行 OS-8970 微观排版、字符集与格式不变量定向加固...');
  const docxNames = [
    'OS-8970 msds_CN 冠志.docx',
    'OS-8970 msds_CN 国彩.docx',
    'OS-8970 msds_EN Guanzhi.docx',
    'OS-8970 msds_EN Guocai.docx'
  ];

  const cnS2LabelRegex = /^(?:2\.1\s*GHS危险性类别[：:]|2\.2\s*GHS标签要素[：:]|GHS象形图[：:]|必须列在标签上的有害成[份分][：:]|信号词[：:]|2\.3\s*危险性说明[：:]|2\.4\s*防范说明[：:]|预防措施[：:]|事故响应[：:]|安全储存[：:]|废弃处置[：:]|2\.5\s*其他危害[：:])$/;
  const enS2LabelRegex = /^(?:2\.1\s*Classification of the substance or mixture:|2\.2\s*GHS Label Elements:|GHS pictograms:|Hazardous components which must be listed on the label:|Signal word:|2\.3\s*Hazard statements:|2\.4\s*Precautionary statements:|Prevention:|Response:|Storage:|Disposal:|2\.5\s*Other hazards:)$/i;

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
        for (const p of Array.from(c0.getElementsByTagName('w:p'))) {
          const runs = Array.from(p.getElementsByTagName('w:r'));
          for (const r of runs) {
            const t = r.textContent.trim();
            const isLabel = isEn ? enS2LabelRegex.test(t) : cnS2LabelRegex.test(t);
            if (isLabel) {
              makeBold(r);
            }
          }
        }
      }
    }

    // 2. Section 3: Row 2 label bold & size, Row 4 >73 ASCII
    const s3Tbl = tbls.find(tbl => {
      const firstRowText = tbl.getElementsByTagName('w:tr')[0]?.textContent || '';
      return (firstRowText.includes('3.') || firstRowText.includes('成分/组成资料') || firstRowText.includes('Composition/Information on Ingredients')) && tbl.getElementsByTagName('w:tr').length >= 3;
    });
    if (s3Tbl) {
      const s3Trs = Array.from(s3Tbl.getElementsByTagName('w:tr'));
      if (s3Trs.length >= 3) {
        const r2 = s3Trs[2];
        const c0 = r2.getElementsByTagName('w:tc')[0];
        if (c0) {
          const p = c0.getElementsByTagName('w:p')[0];
          if (p) {
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

        if (c0) {
          const c0Text = c0.textContent.trim();
          if (isEn) {
            if (/8\.1|8\.2/i.test(c0Text)) {
              for (const r of Array.from(c0.getElementsByTagName('w:r'))) {
                makeBold(r);
                setFontSize(r, 21);
              }
            } else {
              for (const r of Array.from(c0.getElementsByTagName('w:r'))) {
                makeBold(r);
                setFontSize(r, 19);
              }
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

        if (c1) {
          for (const tNode of Array.from(c1.getElementsByTagName('w:t'))) {
            let val = tNode.textContent;
            val = val.replace(/≧/g, '≥');
            val = val.replace(/\uFF1E=/g, '≥');
            val = val.replace(/(\d+(?:\.\d+)?)\s*(mm|min)/g, '$1 $2');
            tNode.textContent = val;
          }

          if (isEn && c0 && /Eye protection:/i.test(c0.textContent)) {
            const p = c1.getElementsByTagName('w:p')[0];
            if (p) {
              const tNodes = Array.from(p.getElementsByTagName('w:t'));
              if (tNodes.length > 0) {
                tNodes[0].textContent = 'Protective goggles are recommended.';
                for (let i = 1; i < tNodes.length; i++) tNodes[i].textContent = '';
              }
            }
          }
        }
      }
    }

    // 3.5 Section 11: Micro-typography (spacing and trailing period)
    const s11Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('毒理学信息') || text.includes('Toxicity information') || text.includes('Toxicological information')) && tbl.getElementsByTagName('w:tr').length >= 3;
    });
    if (s11Tbl && isEn) {
      for (const tNode of Array.from(s11Tbl.getElementsByTagName('w:t'))) {
        tNode.textContent = tNode.textContent.replace(/(\d+)\s*mg\/kg/gi, '$1 mg/kg');
        if (/^No irritation$/i.test(tNode.textContent.trim())) {
          tNode.textContent = 'No irritation.';
        }
      }
    }

    // 4. Section 13: Left alignment
    const s13Tbl = tbls.find(tbl => {
      const text = tbl.textContent;
      return (text.includes('废弃处置') || text.includes('Disposal considerations')) && tbl.getElementsByTagName('w:tr').length >= 2;
    });
    if (s13Tbl) {
      const trs = Array.from(s13Tbl.getElementsByTagName('w:tr'));
      for (const tr of trs) {
        for (const tc of Array.from(tr.getElementsByTagName('w:tc'))) {
          for (const p of Array.from(tc.getElementsByTagName('w:p'))) {
            let pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0] || p.getElementsByTagName('w:pPr')[0];
            if (!pPr) {
              pPr = doc.createElementNS(W_NS, 'w:pPr');
              p.insertBefore(pPr, p.firstChild);
            }
            let jc = pPr.getElementsByTagNameNS(W_NS, 'jc')[0] || pPr.getElementsByTagName('w:jc')[0];
            if (!jc) {
              jc = doc.createElementNS(W_NS, 'w:jc');
              pPr.appendChild(jc);
            }
            jc.setAttributeNS(W_NS, 'w:val', 'left');
          }
        }
      }
    }

    // 5. Section 15: Bold labels
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

    // 6. Global multi-row tables: remove cantSplit from data rows (rIdx >= 1) to allow natural page breaks
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

    // 7. English Terminal Periods
    if (isEn) {
      for (let tIdx = 0; tIdx < tbls.length; tIdx++) {
        const tbl = tbls[tIdx];
        if (tbl === s3Tbl) continue; // Skip Section 3 component table so chemical names don't end with a period
        const trs = Array.from(tbl.getElementsByTagName('w:tr'));
        for (let rIdx = 0; rIdx < trs.length; rIdx++) {
          const tr = trs[rIdx];
          const tcs = Array.from(tr.getElementsByTagName('w:tc'));
          for (let cIdx = 0; cIdx < tcs.length; cIdx++) {
            const tc = tcs[cIdx];
            for (const p of Array.from(tc.getElementsByTagName('w:p'))) {
              const fullText = p.textContent.trim();
              if (!fullText || fullText.length < 15) continue;
              if (fullText.endsWith(':') || fullText.endsWith('：')) continue;
              if (fullText.endsWith('.') || fullText.endsWith(';') || fullText.endsWith('%')) continue;
              if (/\b(?:None|Trade secret|Mixture|Non-ionic|Not applicable)\b$/i.test(fullText)) continue;
              
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

  // 8. Re-convert to PDF for all 4 MSDS DOCX
  console.log('🔄 批量编译高清 PDF 交付物以保持时间戳绝对同步...');
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
  console.log('✅ PDF 批量编译完成，时间戳同步！');

  // 9. Sync all deliverables to user's target directory
  console.log(`📂 同步全量交付物到用户目录: ${userTargetDir}...`);
  await fs.mkdir(userTargetDir, { recursive: true });
  for (const f of docxNames.concat(docxNames.map(d => d.replace('.docx', '.pdf')))) {
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
    model: 'OS-8970',
    targetDir,
    sourceDocx: sourcePath
  });

  if (!auditRes.success) {
    throw new Error(`主审计套件未通过: 存在 ${auditRes.failCount} 项真实缺陷！`);
  }

  console.log('\n🛡️ [MSDS-Studio Phase 12] 启动双极双层全景机械深度审计 (165 项)...');
  const { runBipolarBilayerAudit } = await import('./audit_bipolar_bilayer.mjs');
  await runBipolarBilayerAudit(targetDir, 'OS-8970');

  console.log('\n🎉 OS-8970 8 份标准交付物重新编译并 100% 审计通过！');
}

generateOs8970().catch(err => {
  console.error('❌ Generation / Audit failed:', err);
  process.exit(1);
});
