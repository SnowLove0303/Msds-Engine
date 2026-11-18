import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const TARGET_DIR = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function findFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath));
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      const mtime = stats.mtime;
      const dateStr = `${mtime.getFullYear()}-${String(mtime.getMonth() + 1).padStart(2, '0')}-${String(mtime.getDate()).padStart(2, '0')}`;
      if (dateStr === '2026-11-16' && /msds.*\.docx$/i.test(entry.name)) {
        results.push({
          fullPath,
          name: entry.name,
          mtime,
          size: stats.size
        });
      }
    }
  }
  return results;
}

async function inspectDocxFooter(fileObj) {
  const buf = fs.readFileSync(fileObj.fullPath);
  const zip = await JSZip.loadAsync(buf);
  const parser = new DOMParser();

  const footerFiles = Object.keys(zip.files).filter(k => /^word\/footer\d+\.xml$/.test(k));
  const footerDetails = [];

  for (const ff of footerFiles) {
    const xml = await zip.file(ff).async('text');
    const doc = parser.parseFromString(xml, 'application/xml');

    const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    const rootPs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p')).filter(p => !p.parentNode || p.parentNode.localName !== 'tc');

    const paragraphsText = [];
    const runsInfo = [];

    // Table cells
    for (const tbl of tbls) {
      const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      for (let r = 0; r < rows.length; r++) {
        const cells = Array.from(rows[r].getElementsByTagNameNS(W_NS, 'tc'));
        for (let c = 0; c < cells.length; c++) {
          const ps = Array.from(cells[c].getElementsByTagNameNS(W_NS, 'p'));
          for (let pIdx = 0; pIdx < ps.length; pIdx++) {
            const p = ps[pIdx];
            const text = (p.textContent || '').trim();
            const jc = p.getElementsByTagNameNS(W_NS, 'pPr')?.[0]?.getElementsByTagNameNS(W_NS, 'jc')?.[0]?.getAttributeNS(W_NS, 'val') || 'left';
            paragraphsText.push(`[Tbl r${r} c${c} p${pIdx} ${jc}]: "${text}"`);

            const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
            for (const run of runs) {
              const t = run.getElementsByTagNameNS(W_NS, 't')?.[0]?.textContent || '';
              const rPr = run.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
              const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val');
              const color = rPr?.getElementsByTagNameNS(W_NS, 'color')?.[0]?.getAttributeNS(W_NS, 'val');
              const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')?.[0];
              const eastAsia = rFonts?.getAttributeNS(W_NS, 'eastAsia');
              const ascii = rFonts?.getAttributeNS(W_NS, 'ascii');
              if (t.trim()) {
                runsInfo.push({ text: t, sz: sz ? sz/2 : null, color, font: `${eastAsia||''}/${ascii||''}`, jc });
              }
            }
          }
        }
      }
    }

    // Root paragraphs
    for (let pIdx = 0; pIdx < rootPs.length; pIdx++) {
      const p = rootPs[pIdx];
      const text = (p.textContent || '').trim();
      if (text) {
        paragraphsText.push(`[RootP p${pIdx}]: "${text}"`);
      }
    }

    // Check specific issues
    const hasPArtifact = /P修订日期/i.test(xml);
    const hasThinSpace = /\u2005/.test(xml);
    const rawRevisionDateMatch = xml.match(/(?:[P\s]*修订日期[：:\s]*[^\u2005<]+|Revision\s*Date[：:\s]*[^<]+)/i);

    footerDetails.push({
      partName: ff,
      paragraphsText,
      runsInfo,
      hasPArtifact,
      hasThinSpace,
      rawRevisionDate: rawRevisionDateMatch ? rawRevisionDateMatch[0] : null
    });
  }

  // Derive model and entity from filename
  const isEn = /_EN_|EN\b/i.test(fileObj.name);
  const isGuocai = /国彩|Guocai/i.test(fileObj.name);
  const expectedCompany = isEn
    ? (isGuocai ? 'Yingde Guocai New Material Co., Ltd.' : 'Guangzhou Guanzhi New Material Technology Co., Ltd.')
    : (isGuocai ? '英德市国彩新材料有限公司' : '广州冠志新材料科技有限公司');

  // Check if expectedCompany is in footer
  const allFooterText = footerDetails.map(f => f.paragraphsText.join(' ')).join(' ');
  const companyMatched = allFooterText.includes(expectedCompany);

  return {
    file: fileObj.name,
    relPath: path.relative(TARGET_DIR, fileObj.fullPath),
    isEn,
    isGuocai,
    expectedCompany,
    companyMatched,
    footers: footerDetails
  };
}

async function run() {
  console.log(`Scanning 2026-11-16 MSDS files in: ${TARGET_DIR}...`);
  const files = findFiles(TARGET_DIR);
  console.log(`Found ${files.length} DOCX MSDS files modified on 2026-11-16.\n`);

  const results = [];
  let pArtifactCount = 0;
  let thinSpaceCount = 0;
  let companyMismatchCount = 0;
  let missingDateCount = 0;

  for (const f of files) {
    const res = await inspectDocxFooter(f);
    results.push(res);

    const f1 = res.footers.find(x => x.partName === 'word/footer1.xml');
    if (f1?.hasPArtifact) pArtifactCount++;
    if (f1?.hasThinSpace) thinSpaceCount++;
    if (!res.companyMatched) companyMismatchCount++;
    if (!f1?.rawRevisionDate) missingDateCount++;
  }

  console.log('========================================================================');
  console.log('              2026-11-16 产出物页脚全面排查统计总表                    ');
  console.log('========================================================================');
  console.log(`总排查 DOCX 文件数: ${files.length}`);
  console.log(`存在 "P修订日期" 残留的文件数: ${pArtifactCount} / ${files.length} (${(pArtifactCount/files.length*100).toFixed(1)}%)`);
  console.log(`存在 异形窄空格 (\\u2005) 的文件数: ${thinSpaceCount} / ${files.length} (${(thinSpaceCount/files.length*100).toFixed(1)}%)`);
  console.log(`企业主体名称不匹配的文件数: ${companyMismatchCount} / ${files.length}`);
  console.log(`未找到修订日期的文件数: ${missingDateCount} / ${files.length}`);
  console.log('========================================================================\n');

  // Group by category/folder
  const byFolder = {};
  for (const r of results) {
    const folder = path.dirname(r.relPath);
    if (!byFolder[folder]) byFolder[folder] = [];
    byFolder[folder].push(r);
  }

  for (const [folder, group] of Object.entries(byFolder)) {
    console.log(`\n### 目录: ${folder} (${group.length} 个文件)`);
    for (const item of group) {
      const f1 = item.footers.find(x => x.partName === 'word/footer1.xml');
      console.log(`  - 文件: ${item.file}`);
      console.log(`    主体匹配: ${item.companyMatched ? '✅ 正确' : '❌ 不匹配 (' + item.expectedCompany + ')'}`);
      console.log(`    P 前缀残留: ${f1?.hasPArtifact ? '❌ 有 ("P修订日期")' : '✅ 无'}`);
      console.log(`    窄空格残留: ${f1?.hasThinSpace ? '❌ 有 (\\u2005)' : '✅ 无'}`);
      console.log(`    页脚抓取文本: ${f1?.paragraphsText.join(' | ')}`);
    }
  }

  // Save full JSON output for artifact generation
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/audit_1116_results.json', JSON.stringify({
    summary: {
      totalFiles: files.length,
      pArtifactCount,
      thinSpaceCount,
      companyMismatchCount,
      missingDateCount
    },
    results
  }, null, 2));
}

run().catch(console.error);
