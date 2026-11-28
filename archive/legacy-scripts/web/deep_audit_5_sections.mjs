import fs from 'fs';
import JSZip from 'jszip';

async function getDocDetails(p) {
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
          cellParas.push(tList);
        }
        cells.push({
          rawText: cellParas.join('\n'),
          paras: cellParas
        });
      }
      rows.push(cells);
    }
    tables.push(rows);
  }
  return tables;
}

async function main() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
  const outCnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx';
  const outEnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

  const srcTbls = await getDocDetails(srcPath);
  const outCnTbls = await getDocDetails(outCnPath);
  const outEnTbls = await getDocDetails(outEnPath);

  let out = '';
  function log(str) { out += str + '\n'; }

  function dumpSection(tbls, secNum, label) {
    log(`\n======================================================`);
    log(`  ${label} - SECTION ${secNum}`);
    log(`======================================================`);
    for (let i = 0; i < tbls.length; i++) {
      const firstText = tbls[i][0]?.[0]?.rawText || '';
      if (firstText.includes(`${secNum}.`) || firstText.includes(`第${secNum}部分`) || firstText.startsWith(`${secNum}`) || firstText.toLowerCase().includes(`section ${secNum}`)) {
        log(`Table index: ${i}, total rows: ${tbls[i].length}`);
        tbls[i].forEach((row, rIdx) => {
          log(`\n[Row ${rIdx}] (${row.length} cells):`);
          row.forEach((cell, cIdx) => {
            log(`  Cell ${cIdx}:\n${cell.rawText.split('\n').map(l => '    ' + l).join('\n')}`);
          });
        });
        return;
      }
    }
    log(`NOT FOUND for secNum ${secNum}`);
  }

  const secs = [2, 3, 9, 11, 12];
  for (const s of secs) {
    dumpSection(srcTbls, s, 'SOURCE');
    dumpSection(outCnTbls, s, 'OUT CN');
    dumpSection(outEnTbls, s, 'OUT EN');
  }

  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/audit_5_sections_utf8.txt', out, 'utf8');
  console.log('Written utf8 log successfully.');
}

main().catch(console.error);
