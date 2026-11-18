import JSZip from 'jszip';
import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const DOMParser = dom.window.DOMParser;

async function inspectDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return { xml, doc };
}

async function main() {
  const targetPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';
  const sourcePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx';

  const { doc: outDoc } = await inspectDocx(targetPath);
  const { doc: srcDoc } = await inspectDocx(sourcePath);

  const outTables = outDoc.getElementsByTagName('w:tbl');
  const srcTables = srcDoc.getElementsByTagName('w:tbl');

  console.log(`Out tables: ${outTables.length}, Src tables: ${srcTables.length}`);

  const issues = [];

  for (let s = 0; s < 16; s++) {
    const srcTbl = srcTables[s];
    const outTbl = outTables[s];
    const srcText = srcTbl ? srcTbl.textContent.trim().replace(/\s+/g, ' ') : 'MISSING';
    const outText = outTbl ? outTbl.textContent.trim().replace(/\s+/g, ' ') : 'MISSING';

    console.log(`\n=================== SECTION ${s + 1} ===================`);
    console.log(`SRC [${srcText.slice(0, 100)}...]`);
    console.log(`OUT [${outText.slice(0, 100)}...]`);

    // Section 1
    if (s === 0) {
      if (outText.includes('PU-218A')) {
        console.log('Sec 1 model: PU-218A found');
      } else {
        issues.push('Section 1: 型号未正确匹配为 PU-218A');
      }
    }

    // Section 2
    if (s === 1) {
      if (outText.includes('羟基丙烯酸酯聚合物') || outText.includes('二甲基乙醇胺')) {
        issues.push('Section 2: 严重模板污染！出现了非本产品的“羟基丙烯酸酯聚合物”和“N,N-二甲基乙醇胺”，完全污染！');
      }
      if (outText.includes('GHS危险性类别: 无')) {
        issues.push('Section 2: 致命事实错误！源文件明确有6大GHS危害类别（吸入毒性4、皮肤腐蚀3、眼睛刺激2B、生殖毒性1B、靶器官1和2），产出物却写了“无”！');
      }
      if (!outText.includes('2.1') || !outText.includes('2.2')) {
        issues.push('Section 2: 序号丢失！缺少 2.1、2.2 标签序号！');
      }
      if (!outText.includes('H360') || !outText.includes('H370')) {
        issues.push('Section 2: 关键危害说明丢失！源文件的 H360 (生殖毒性)、H370 (器官伤害)、H373 (肝损伤) 全被抹除！');
      }
    }

    // Section 3
    if (s === 2) {
      if (!outText.includes('2687-91-4') || !outText.includes('NEP')) {
        issues.push('Section 3: NEP成分未正确写入！');
      } else {
        console.log('Sec 3: 成分保留正常');
      }
    }

    // Section 8
    if (s === 7) {
      console.log('Sec 8 text:', outText.slice(0, 200));
    }

    // Section 9
    if (s === 8) {
      console.log('Sec 9 text:', outText.slice(0, 200));
    }

    // Section 11
    if (s === 10) {
      if (!outText.includes('11.7')) {
        issues.push('Section 11: 缺少 11.7 生殖毒性标签！');
      }
      // Check rows in outTbl
      const rows = outTbl.getElementsByTagName('w:tr');
      let found117Merge = false;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        const rTxt = Array.from(cells).map(c => c.textContent.trim());
        if (rTxt.some(t => t.includes('生殖毒性'))) {
          console.log(`Sec 11 Row ${r} cells=${cells.length}: [${rTxt.join(' | ')}]`);
          if (cells.length === 3) {
            found117Merge = true;
          }
        }
      }
      if (!found117Merge) {
        issues.push('Section 11: 11.7 生殖毒性未构建成三列结构（第一列垂直合并通栏，第二列为“生育力：”与“致畸性：”两行子标签，第三列为对应值）！');
      }
    }

    // Section 12
    if (s === 11) {
      console.log('Sec 12 text:', outText.slice(0, 200));
      if (outText.includes('二甲基乙酰胺') && !srcText.includes('二甲基乙酰胺')) {
        issues.push('Section 12: 出现模板残留化学品！');
      }
    }

    // Section 13
    if (s === 12) {
      console.log('Sec 13 text:', outText.slice(0, 200));
    }
  }

  console.log('\n====================================================');
  console.log('ALL DETECTED CRITICAL ISSUES:');
  issues.forEach((iss, idx) => console.log(`${idx + 1}. ${iss}`));
  console.log('====================================================');
}

main().catch(console.error);
