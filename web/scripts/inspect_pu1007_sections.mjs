import '../src/recognition-engine.js';
import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';

async function test() {
  const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1007/PU-1007 msds_CN 冠志.docx';
  const buf = fs.readFileSync(p);
  const eng = await loadDocx(buf, 'PU-1007.docx');
  console.log('PU-1007 Total records:', eng.records.length);
  for (let i = 0; i < eng.records.length; i++) {
    const r = eng.records[i];
    console.log(`Record ${i}: SecNum=${r.sectionNumber}, Title="${r.title}", Rows=${r.rows?.length}`);
  }
}

test();
