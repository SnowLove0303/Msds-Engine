import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const root = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料';

async function extractDocxTextBySections(docxPath) {
  if (!fs.existsSync(docxPath)) return null;
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')?.async('text');
  if (!xml) return null;
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));
  return tbls.map((t, idx) => {
    return {
      secIndex: idx + 1,
      text: (t.textContent || '').replace(/\s+/g, ' ').trim()
    };
  });
}

async function deepInspectCoreSections() {
  const models = ['PU-202A', 'PU-202B', 'PU-202C', 'PU-218A', 'PA-3223'];
  const data = {};
  for (const m of models) {
    const p = path.join(root, m, `${m} msds_CN 冠志.docx`);
    if (fs.existsSync(p)) {
      data[m] = await extractDocxTextBySections(p);
    }
  }

  const checkSecs = [2, 3, 8, 9, 11, 12];
  for (const s of checkSecs) {
    console.log(`\n=================== Section ${s} 详情 ===================`);
    for (const m of Object.keys(data)) {
      const sec = data[m]?.find(item => item.secIndex === s);
      console.log(`\n[${m}] Section ${s} (长度 ${sec?.text?.length || 0}):`);
      console.log(`   ${sec?.text?.substring(0, 200)}...`);
    }
  }
}

deepInspectCoreSections().catch(console.error);
