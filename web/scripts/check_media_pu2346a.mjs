import fs from 'node:fs/promises';
import JSZip from 'jszip';

async function checkMedia() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A msds_CN 冠志.docx';
  const buf = await fs.readFile(p);
  const zip = await JSZip.loadAsync(buf);
  console.log('Zip files in word/media:');
  for (const name of Object.keys(zip.files)) {
    if (name.startsWith('word/media/')) {
      console.log(' ', name, 'size:', zip.files[name]._data ? zip.files[name]._data.uncompressedSize : 'unknown');
    }
  }
}

checkMedia().catch(console.error);
