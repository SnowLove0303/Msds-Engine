import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx, writeCellValue, deleteRow } = await import('../src/docx-engine.js');

const templateSource = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx';
const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/4-1 水性环氧树脂 EP/EP-1404';
const targetDocx = path.join(targetDir, 'EP-1404 msds_CN 冠志.docx');

async function buildSource() {
  await fs.mkdir(targetDir, { recursive: true });
  const data = await fs.readFile(templateSource);
  const engine = await loadDocx(data, 'EP-1404 msds_CN 冠志.docx');

  // 1. Section 1
  const s1 = engine.records.find(r => r.sectionNumber === 1);
  if (s1) {
    writeCellValue(s1.rows[1].cells[1], 'EP-1404');
    writeCellValue(s1.rows[2].cells[1], '无水环氧');
    writeCellValue(s1.rows[3].cells[1], '无水环氧');
    writeCellValue(s1.rows[4].cells[1], '涂料');
  }

  // 2. Section 3
  // In EP-1736:
  // r4: 改性环氧聚合物 | 商业机密 | 50-57
  // r5: 水 | 7732-18-5 | 20-33
  // r6: 丙二醇甲醚 | 107-98-2 | 5-17
  // In EP-1404:
  // Comp 1: 改性环氧聚合物 | 商业机密 | ＞73
  // Comp 2: 丙二醇甲醚 | 5131-66-8 | 25-30
  let s3 = engine.records.find(r => r.sectionNumber === 3);
  if (s3 && s3.rows.length >= 7) {
    writeCellValue(s3.rows[4].cells[0], '改性环氧聚合物');
    writeCellValue(s3.rows[4].cells[1], '商业机密');
    writeCellValue(s3.rows[4].cells[2], '＞73');

    writeCellValue(s3.rows[5].cells[0], '丙二醇甲醚');
    writeCellValue(s3.rows[5].cells[1], '5131-66-8');
    writeCellValue(s3.rows[5].cells[2], '25-30');

    // Delete row 6 (water row from EP-1736)
    s3 = deleteRow(engine, s3, 6);
  }

  // 3. Section 9
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    for (const row of s9.rows) {
      const lbl = row.cells[0]?.text?.trim() || '';
      if (/外\s*观/i.test(lbl)) {
        writeCellValue(row.cells[1], '微黄透明状液体');
      } else if (/粘度/i.test(lbl)) {
        writeCellValue(row.cells[1], '2000-8000mPa.s');
      } else if (/固体含量/i.test(lbl)) {
        writeCellValue(row.cells[1], '75±2%');
      }
    }
  }

  const outBuf = await engine.exportArrayBuffer();
  await fs.writeFile(targetDocx, Buffer.from(outBuf));
  console.log(`Saved EP-1404 source docx to: ${targetDocx}`);

  // Copy user's original pdf
  const userPdf = 'E:/冠志/TDS MSDS (2)/待处理文件/EP-1404/EP-1404msds_CN 冠志_.pdf';
  await fs.copyFile(userPdf, path.join(targetDir, 'EP-1404msds_CN 冠志_.pdf'));
  console.log(`Copied user source PDF to: ${targetDir}`);
}

buildSource().catch(console.error);
