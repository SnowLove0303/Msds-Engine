import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

async function verify() {
  const targetDir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
  
  console.log('=== 1. 物理交付目录文件与时间戳校验 ===');
  const files = await fs.readdir(targetDir);
  const msdsFiles = files.filter(f => f.includes('msds_') && (f.endsWith('.docx') || f.endsWith('.pdf')));
  console.log(`MSDS 交付物清单 (${msdsFiles.length} 个):`);
  const stats = [];
  for (const f of msdsFiles) {
    const s = await fs.stat(path.join(targetDir, f));
    stats.push({ file: f, mtime: s.mtime.toISOString(), size: s.size });
    console.log(` - ${f} (${s.size} B, mtime: ${s.mtime.toLocaleTimeString()})`);
  }
  
  console.log('\n=== 2. Section 2 通栏与零内框线 XML 物理取证 ===');
  for (const f of ['PU-2346A msds_CN 冠志.docx', 'PU-2346A msds_EN Guanzhi.docx']) {
    const buf = await fs.readFile(path.join(targetDir, f));
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');
    // Extract Table 2
    const tblRegex = /<w:tbl[\s\S]*?<\/w:tbl>/g;
    const tbls = xml.match(tblRegex) || [];
    const tbl2 = tbls[1]; // Table 2
    const hasDotted = /w:val="(?:dotted|dashed)"/.test(tbl2);
    const insideHMatch = tbl2.match(/<w:insideH[^>]*\/>/);
    const insideVMatch = tbl2.match(/<w:insideV[^>]*\/>/);
    console.log(`${f} Table 2:`);
    console.log(`   insideH: ${insideHMatch ? insideHMatch[0] : 'not found'}`);
    console.log(`   insideV: ${insideVMatch ? insideVMatch[0] : 'not found'}`);
    console.log(`   存在内框虚线 (dotted/dashed): ${hasDotted}`);
  }

  console.log('\n=== 3. Section 8 英文标签字阶全景均一性物理取证 ===');
  const enBuf = await fs.readFile(path.join(targetDir, 'PU-2346A msds_EN Guanzhi.docx'));
  const enZip = await JSZip.loadAsync(enBuf);
  const enXml = await enZip.file('word/document.xml').async('text');
  const tbls = enXml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const tbl8 = tbls[7]; // Table 8
  const trs = tbl8.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  console.log(`Table 8 (Section 8) 数据行总数: ${trs.length}`);
  let sz24InLabels = 0;
  let sz19InLabels = 0;
  trs.slice(2).forEach((tr, idx) => {
    const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    const c0 = tcs[0] || '';
    const text = c0.replace(/<[^>]+>/g, '').trim();
    const hasSz24 = /<w:sz\s+w:val="24"/.test(c0);
    const hasSz19 = /<w:sz\s+w:val="19"/.test(c0);
    if (hasSz24) sz24InLabels++;
    if (hasSz19) sz19InLabels++;
    console.log(`   Row ${idx + 3} Label [${text}]: sz=19(${hasSz19}), sz=24(${hasSz24})`);
  });
  console.log(`Section 8 英文标签统计: sz=19 符合数: ${sz19InLabels}, sz=24 违规数: ${sz24InLabels}`);

  console.log('\n=== 4. 标签折行悬挂缩进 (left=420 hanging=420) 物理取证 ===');
  const hangingMatch = enXml.match(/<w:ind[^>]*w:left="420"[^>]*w:hanging="420"[^>]*\/>/g) || [];
  console.log(`全篇命中 left=420 hanging=420 悬挂缩进段落数: ${hangingMatch.length}`);

  console.log('\n=== 5. 中文版第 0 列标签小四号 12pt (sz="24") 全景取证 ===');
  const cnBuf = await fs.readFile(path.join(targetDir, 'PU-2346A msds_CN 冠志.docx'));
  const cnZip = await JSZip.loadAsync(cnBuf);
  const cnXml = await cnZip.file('word/document.xml').async('text');
  const cnTbls = cnXml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  let cnSz21Count = 0;
  let cnSz24Count = 0;
  cnTbls.forEach((tbl, tIdx) => {
    const rows = tbl.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.slice(1).forEach((tr, rIdx) => {
      const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const c0 = tcs[0] || '';
      if (/<w:sz\s+w:val="21"/.test(c0)) {
        cnSz21Count++;
        const lbl = c0.replace(/<[^>]+>/g, '').trim().slice(0, 25);
        console.log(`   Table ${tIdx + 1} Row ${rIdx + 1} [${lbl}] has sz="21"`);
      }
      if (/<w:sz\s+w:val="24"/.test(c0)) cnSz24Count++;
    });
  });
  console.log(`中文表格第 0 列标签字号: sz=24 符合数: ${cnSz24Count}, sz=21 降级跳字数: ${cnSz21Count}`);
}

verify().catch(console.error);
