import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx, W_NS } from '../src/docx-engine.js';
import { applyGlobalTypographyProjection, MSDS_DESIGN_TOKENS } from '../src/universal-editor-primitives.js';

async function testUnifiedSectionTypography() {
  console.log('Testing Unified Section Typography across all 16 sections...');

  const tplCnPath = 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const tplEnPath = 'web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

  for (const tplPath of [tplCnPath, tplEnPath]) {
    const isEn = tplPath.includes('_EN_');
    const buf = fs.readFileSync(tplPath);
    const engine = await loadDocx(buf);

    // 执行全局统一排版投影
    applyGlobalTypographyProjection(engine, isEn);

    const doc = engine.documentXml;
    const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    assert(tables.length >= 16, `Document must contain at least 16 section tables, found ${tables.length}`);

    const expectedTokens = isEn ? MSDS_DESIGN_TOKENS.EN : MSDS_DESIGN_TOKENS.CN;
    let totalVerifiedRuns = 0;
    let nonStandardFontRuns = 0;

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const tbl = tables[tIdx];
      const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      if (rows.length === 0) continue;

      let sectionNum = tIdx + 1;
      const r0Text = (rows[0]?.textContent || '').trim();
      const secMatch = r0Text.match(/^(\d+)\./);
      if (secMatch) sectionNum = parseInt(secMatch[1], 10);

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
        if (cells.length === 0) continue;

        // 1. 大标题 (Row 0)
        if (rIdx === 0) {
          for (const cell of cells) {
            const runs = Array.from(cell.getElementsByTagNameNS(W_NS, 'r'));
            for (const r of runs) {
              const txt = (r.textContent || '').trim();
              if (!txt) continue;
              const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
              const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val');
              const b = rPr?.getElementsByTagNameNS(W_NS, 'b')[0];
              assert.strictEqual(sz, expectedTokens.SECTION_HEADER.sz, `Sec ${sectionNum} title sz must be ${expectedTokens.SECTION_HEADER.sz}, got ${sz}`);
              assert(b, `Sec ${sectionNum} title must be bold!`);
              totalVerifiedRuns++;
            }
          }
          continue;
        }

        // 2. 多列表格 (cells.length > 1)
        if (cells.length > 1) {
          // Column 0: 标签与序号
          const labelCell = cells[0];
          const labelRuns = Array.from(labelCell.getElementsByTagNameNS(W_NS, 'r'));
          for (const r of labelRuns) {
            const txt = (r.textContent || '').trim();
            if (!txt && !r.getElementsByTagNameNS(W_NS, 'tab').length) continue;
            const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
            const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val');
            const isSeq = r.getElementsByTagNameNS(W_NS, 'tab').length > 0 || /^(\d+(?:\.\d+)+)\s*$/.test(txt);
            if (isSeq) {
              assert(sz === expectedTokens.LABEL_SEQ.sz || sz === expectedTokens.LABEL_SEQ_TIER_B.sz,
                `Sec ${sectionNum} seq run sz must be ${expectedTokens.LABEL_SEQ.sz} or ${expectedTokens.LABEL_SEQ_TIER_B.sz}, got ${sz}`);
            } else {
              assert.strictEqual(sz, expectedTokens.LABEL_BOLD.sz,
                `Sec ${sectionNum} label run sz must be ${expectedTokens.LABEL_BOLD.sz}, got ${sz}`);
            }
            totalVerifiedRuns++;
          }

          // Column 1+: 值格
          for (let cIdx = 1; cIdx < cells.length; cIdx++) {
            const valRuns = Array.from(cells[cIdx].getElementsByTagNameNS(W_NS, 'r'));
            for (const r of valRuns) {
              const txt = (r.textContent || '').trim();
              if (!txt && !r.getElementsByTagNameNS(W_NS, 'drawing').length && !r.getElementsByTagNameNS(W_NS, 'br').length) continue;
              const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
              const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val');
              assert.strictEqual(sz, expectedTokens.TABLE_VALUE.sz,
                `Sec ${sectionNum} val run sz must be ${expectedTokens.TABLE_VALUE.sz}, got ${sz}`);
              totalVerifiedRuns++;
            }
          }
        } else {
          // 单列表格行 (Section 2, 13, 14, 15 等)
          const valRuns = Array.from(cells[0].getElementsByTagNameNS(W_NS, 'r'));
          for (const r of valRuns) {
            const txt = (r.textContent || '').trim();
            if (!txt && !r.getElementsByTagNameNS(W_NS, 'drawing').length && !r.getElementsByTagNameNS(W_NS, 'br').length) continue;
            const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
            const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val');
            // 单列行值格或说明行必须为 TABLE_VALUE.sz (CN 24 / EN 19)
            assert.strictEqual(sz, expectedTokens.TABLE_VALUE.sz,
              `Sec ${sectionNum} single-col run sz must be ${expectedTokens.TABLE_VALUE.sz}, got ${sz}`);
            totalVerifiedRuns++;
          }
        }
      }
    }

    console.log(`✓ ${path.basename(tplPath)} verified: ${totalVerifiedRuns} runs conforming 100% to Design Tokens.`);
  }

  console.log('ALL UNIFIED SECTION TYPOGRAPHY TESTS PASSED!');
}

testUnifiedSectionTypography().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
