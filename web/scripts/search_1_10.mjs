import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

async function searchInDocx(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await searchInDocx(full);
    } else if (ent.name.endsWith('.docx')) {
      try {
        const buf = await fs.readFile(full);
        const zip = await JSZip.loadAsync(buf);
        const xml = await zip.file('word/document.xml')?.async('text');
        if (xml && xml.includes('1:10')) {
          console.log(`Found 1:10 in: ${full}`);
          const match = xml.match(/.{0,50}1:10.{0,50}/g);
          console.log('  matches:', match?.slice(0, 2));
        }
      } catch (e) {}
    }
  }
}

searchInDocx('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版').catch(console.error);
