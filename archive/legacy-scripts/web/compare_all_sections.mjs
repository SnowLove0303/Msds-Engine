import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function parseAllTables(p) {
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const tables = [];
  const trRegex = /<w:tbl[\s\S]*?<\/w:tbl>/g;
  let tblMatch;
  while ((tblMatch = trRegex.exec(xml)) !== null) {
    const fullTbl = tblMatch[0];
    const rows = [];
    const trMatches = fullTbl.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    for (const tr of trMatches) {
      const cells = [];
      const tcMatches = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      for (const tc of tcMatches) {
        const pMatches = tc.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
        const cellParas = [];
        for (const p of pMatches) {
          const tList = (p.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || [])
            .map(t => t.replace(/<[^>]+>/g, '')).join('');
          if (tList.trim()) cellParas.push(tList.trim());
        }
        cells.push(cellParas.join(' \n '));
      }
      rows.push(cells);
    }
    tables.push(rows);
  }
  return tables;
}

async function main() {
  const tplDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates';
  const tplFiles = fs.readdirSync(tplDir);
  const cnTplFile = tplFiles.find(f => f.includes('CN') && f.endsWith('.docx'));
  const enTplFile = tplFiles.find(f => f.includes('EN') && f.endsWith('.docx'));

  const tplCnPath = path.join(tplDir, cnTplFile);
  const tplEnPath = path.join(tplDir, enTplFile);
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
  const outCnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
  const outEnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

  console.log('Loading templates:', { cnTplFile, enTplFile });

  const tplCn = await parseAllTables(tplCnPath);
  const tplEn = await parseAllTables(tplEnPath);
  const src = await parseAllTables(srcPath);
  const outCn = await parseAllTables(outCnPath);
  const outEn = await parseAllTables(outEnPath);

  function findTable(tables, secNum, lang) {
    for (let i = 0; i < tables.length; i++) {
      const firstCell = tables[i][0]?.[0] || '';
      if (lang === 'cn') {
        if (firstCell.includes(`${secNum}.`) || firstCell.includes(`第${secNum}部分`) || firstCell.startsWith(`${secNum}`) || firstCell.includes(`${secNum} `)) {
          return { index: i, rows: tables[i] };
        }
      } else {
        if (firstCell.toLowerCase().includes(`section ${secNum}`) || firstCell.startsWith(`${secNum}.`) || firstCell.startsWith(`${secNum} `) || firstCell.startsWith(`${secNum}`)) {
          return { index: i, rows: tables[i] };
        }
      }
    }
    return { index: -1, rows: [] };
  }

  const sectionsToCompare = [2, 3, 9, 11, 12];
  for (const s of sectionsToCompare) {
    console.log(`\n================================================================`);
    console.log(`                      COMPARING SECTION ${s}                    `);
    console.log(`================================================================`);
    
    console.log(`\n>>> [1. SOURCE DOCX (Section ${s})] <<<`);
    const sSrc = findTable(src, s, 'cn');
    console.log(`Found index: ${sSrc.index}, Rows count: ${sSrc.rows.length}`);
    sSrc.rows.forEach((r, idx) => console.log(`  [Row ${idx}]: ${JSON.stringify(r)}`));

    console.log(`\n>>> [2. CN TEMPLATE (Section ${s})] <<<`);
    const sTplCn = findTable(tplCn, s, 'cn');
    console.log(`Found index: ${sTplCn.index}, Rows count: ${sTplCn.rows.length}`);
    sTplCn.rows.forEach((r, idx) => console.log(`  [Row ${idx}]: ${JSON.stringify(r)}`));

    console.log(`\n>>> [3. EN TEMPLATE (Section ${s})] <<<`);
    const sTplEn = findTable(tplEn, s, 'en');
    console.log(`Found index: ${sTplEn.index}, Rows count: ${sTplEn.rows.length}`);
    sTplEn.rows.forEach((r, idx) => console.log(`  [Row ${idx}]: ${JSON.stringify(r)}`));

    console.log(`\n>>> [4. OUT CN DOCX (Section ${s})] <<<`);
    const sOutCn = findTable(outCn, s, 'cn');
    console.log(`Found index: ${sOutCn.index}, Rows count: ${sOutCn.rows.length}`);
    sOutCn.rows.forEach((r, idx) => console.log(`  [Row ${idx}]: ${JSON.stringify(r)}`));

    console.log(`\n>>> [5. OUT EN DOCX (Section ${s})] <<<`);
    const sOutEn = findTable(outEn, s, 'en');
    console.log(`Found index: ${sOutEn.index}, Rows count: ${sOutEn.rows.length}`);
    sOutEn.rows.forEach((r, idx) => console.log(`  [Row ${idx}]: ${JSON.stringify(r)}`));
  }
}

main().catch(console.error);
