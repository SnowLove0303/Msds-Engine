import fs from 'fs';
import JSZip from 'jszip';

async function parseDoc(p) {
  const buf = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  // Parse elements in order
  const elements = [];
  const regex = /<(w:p|w:tbl)[\s\S]*?<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const tag = match[1];
    const full = match[0];
    if (tag === 'w:p') {
      const texts = (full.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || [])
        .map(t => t.replace(/<[^>]+>/g, '')).join('');
      if (texts.trim()) {
        elements.push({ type: 'p', text: texts.trim() });
      }
    } else if (tag === 'w:tbl') {
      // extract rows
      const rows = [];
      const trMatches = full.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
      for (const tr of trMatches) {
        const cells = [];
        const tcMatches = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
        for (const tc of tcMatches) {
          const texts = (tc.match(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g) || [])
            .map(t => t.replace(/<[^>]+>/g, '')).join('');
          cells.push(texts.trim());
        }
        rows.push(cells);
      }
      elements.push({ type: 'tbl', rows });
    }
  }
  return elements;
}

async function main() {
  const srcElems = await parseDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/OS-9547PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx');
  const outCnElems = await parseDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_CN 冠志.docx');
  const outEnElems = await parseDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx');

  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/src_elements.json', JSON.stringify(srcElems, null, 2));
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/out_cn_elements.json', JSON.stringify(outCnElems, null, 2));
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/out_en_elements.json', JSON.stringify(outEnElems, null, 2));

  console.log('Parsed elements. Total elements:', {
    src: srcElems.length,
    outCn: outCnElems.length,
    outEn: outEnElems.length
  });
}

main().catch(console.error);
