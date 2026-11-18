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

async function compareModels() {
  const dirs = fs.readdirSync(root).filter(d => fs.statSync(path.join(root, d)).isDirectory() && !d.includes('源文件') && !d.includes('参考'));
  console.log('正在比对模型目录:', dirs);

  const modelData = {};
  for (const d of dirs) {
    const docxCn = path.join(root, d, `${d} msds_CN 冠志.docx`);
    if (fs.existsSync(docxCn)) {
      modelData[d] = await extractDocxTextBySections(docxCn);
    }
  }

  const modelKeys = Object.keys(modelData);
  console.log('获取到已生成中文交付物的型号:', modelKeys);

  // 对比各章节
  for (let s = 1; s <= 16; s++) {
    console.log(`\n=================== Section ${s} 跨型号内容碰撞比对 ===================`);
    const secTexts = {};
    for (const m of modelKeys) {
      const sec = modelData[m]?.find(item => item.secIndex === s);
      if (sec) {
        secTexts[m] = sec.text;
      }
    }

    for (let i = 0; i < modelKeys.length; i++) {
      for (let j = i + 1; j < modelKeys.length; j++) {
        const m1 = modelKeys[i];
        const m2 = modelKeys[j];
        const t1 = secTexts[m1];
        const t2 = secTexts[m2];
        if (t1 && t2) {
          if (t1 === t2) {
            console.log(`🚨 [100% 字节级完全相同!!] Section ${s}: ${m1} 与 ${m2} 完全一致！`);
            console.log(`   内容前 120 字: ${t1.substring(0, 120)}...`);
          } else {
            if (s === 2 || s === 9 || s === 11 || s === 12 || s === 3) {
              if (t1.includes('饮酒精饮料会加剧毒性影响') && t2.includes('饮酒精饮料会加剧毒性影响')) {
                console.log(`⚠️ [严重硬编码碰撞] Section ${s}: ${m1} 和 ${m2} 均包含 DMAC 特有长句 "饮酒精饮料会加剧毒性影响"!`);
              }
              if (t1.includes('请注意以下物质：N,N-二甲基乙醇胺') && t2.includes('请注意以下物质：N,N-二甲基乙醇胺')) {
                console.log(`⚠️ [严重硬编码碰撞] Section ${s}: ${m1} 和 ${m2} 均包含 DMEA 成盐特有长句!`);
              }
            }
          }
        }
      }
    }
  }
}

compareModels().catch(console.error);
