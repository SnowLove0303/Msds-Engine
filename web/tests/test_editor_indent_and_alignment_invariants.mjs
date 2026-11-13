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

const TPL_CN = 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const TPL_EN = 'web/public/templates/正式模板_MSDS_EN_冠志(1).docx';
const HPU_CN = '算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651/HPU-7651 msds_CN 冠志.docx';
const HPU_EN = '算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651/HPU-7651 msds_EN Guanzhi.docx';

const TEST_FILES = [
  { path: TPL_CN, needProjection: true },
  { path: TPL_EN, needProjection: true },
  { path: HPU_CN, needProjection: false },
  { path: HPU_EN, needProjection: false },
];

/**
 * Suite 1: REQ-SEQ-LABEL-SPACING-02 (序号与标签间隔机制)
 */
async function runSpacingSuite() {
  console.log('--- Running Suite: spacing (REQ-SEQ-LABEL-SPACING-02) ---');

  for (const item of TEST_FILES) {
    const isEn = item.path.includes('_EN_');
    const buf = fs.readFileSync(item.path);
    const engine = await loadDocx(buf);

    if (item.needProjection) {
      applyGlobalTypographyProjection(engine, isEn);
    }

    const doc = engine.documentXml;
    const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));

    let checkedNumberedParagraphs = 0;
    let tierACount = 0;
    let tierBCount = 0;

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const tbl = tables[tIdx];
      const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      if (rows.length === 0) continue;

      // 计算该章节的实际最大序号位数
      let expectedMaxDigits = 0;
      for (const r of rows) {
        const c0 = r.getElementsByTagNameNS(W_NS, 'tc')[0];
        if (!c0) continue;
        const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const text = (p.textContent || '').trim();
          const m = text.match(/^(\d+(?:\.\d+)+)/);
          if (m) {
            const digits = m[1].replace(/\D/g, '');
            if (digits.length > expectedMaxDigits) expectedMaxDigits = digits.length;
          }
        }
      }

      const expectedIndent = (expectedMaxDigits >= 4) ? '560' : '420';

      for (let rIdx = 1; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
        if (cells.length <= 1) continue;

        const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
        const isHeaderRow = /化学品名称.*CAS编号|Chemical\s*name.*CAS|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type|Component.*CAS/i.test(rowText);
        if (isHeaderRow) continue;

        const c0Text = (cells[0]?.textContent || '').trim();
        const c0HasSeq = /^(\d+(?:\.\d+)+)/.test(c0Text);
        if (cells.length >= 3 && !c0HasSeq) continue;

        const c0 = cells[0];
        const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const pText = (p.textContent || '').trim();
          const mSeq = pText.match(/^(\d+(?:\.\d+)+)\s*(.*)$/);
          if (!mSeq) continue;

          checkedNumberedParagraphs++;
          if (expectedIndent === '560') tierBCount++; else tierACount++;

          // 1. 验证制表符纯净度：段落 Run 节点内仅且只能包含 1 个 <w:tab/> 字符节点
          const runTabs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'))
            .flatMap(r => Array.from(r.getElementsByTagNameNS(W_NS, 'tab')));
          assert.strictEqual(
            runTabs.length,
            1,
            `Paragraph "${pText.slice(0, 20)}" must have exactly 1 <w:tab/> in text runs, found ${runTabs.length}`
          );

          // 2. 验证序号文本节点后无多余空格
          const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
          const r1 = runs[0];
          assert(r1, `Numbered paragraph must have at least 1 run`);
          const tNodes = Array.from(r1.getElementsByTagNameNS(W_NS, 't'));
          assert(tNodes.length > 0, `Sequence run must contain text node`);
          const seqText = tNodes[0].textContent;
          assert.strictEqual(
            seqText,
            mSeq[1],
            `Sequence run text "${seqText}" must exactly equal "${mSeq[1]}" with no trailing spaces`
          );

          // 3. 验证悬挂缩进几何标尺与显式制表位
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          assert(pPr, `Paragraph must have pPr`);
          const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
          assert(ind, `Numbered paragraph must have ind element`);
          assert.strictEqual(
            ind.getAttribute('w:left'),
            expectedIndent,
            `w:left must be ${expectedIndent}, got ${ind.getAttribute('w:left')}`
          );
          assert.strictEqual(
            ind.getAttribute('w:hanging'),
            expectedIndent,
            `w:hanging must be ${expectedIndent}, got ${ind.getAttribute('w:hanging')}`
          );

          const pPrTabs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs'));
          if (pPrTabs.length > 0) {
            const tabDef = pPrTabs[0].getElementsByTagNameNS(W_NS, 'tab')[0];
            if (tabDef && tabDef.getAttribute('w:pos')) {
              assert.strictEqual(
                tabDef.getAttribute('w:pos'),
                expectedIndent,
                `tab pos must be ${expectedIndent}, got ${tabDef.getAttribute('w:pos')}`
              );
            }
          }
        }
      }
    }

    console.log(`✓ ${path.basename(item.path)}: verified ${checkedNumberedParagraphs} numbered paragraphs (Tier A: ${tierACount}, Tier B: ${tierBCount}).`);
  }
  console.log('✓ Suite spacing passed with 0 errors.\n');
}

/**
 * Suite 2: REQ-LABEL-CONTINUATION-ALIGN-03 (标签对齐与多行折行机制)
 */
async function runLabelAlignmentSuite() {
  console.log('--- Running Suite: label-alignment (REQ-LABEL-CONTINUATION-ALIGN-03) ---');

  for (const item of TEST_FILES) {
    const isEn = item.path.includes('_EN_');
    const buf = fs.readFileSync(item.path);
    const engine = await loadDocx(buf);

    if (item.needProjection) {
      applyGlobalTypographyProjection(engine, isEn);
    }

    const doc = engine.documentXml;
    const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));

    let checkedLabels = 0;
    let unnumberedCount = 0;

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const tbl = tables[tIdx];
      const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      if (rows.length === 0) continue;

      let expectedMaxDigits = 0;
      for (const r of rows) {
        const c0 = r.getElementsByTagNameNS(W_NS, 'tc')[0];
        if (!c0) continue;
        const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const text = (p.textContent || '').trim();
          const m = text.match(/^(\d+(?:\.\d+)+)/);
          if (m) {
            const digits = m[1].replace(/\D/g, '');
            if (digits.length > expectedMaxDigits) expectedMaxDigits = digits.length;
          }
        }
      }
      const expectedIndent = (expectedMaxDigits >= 4) ? '560' : '420';

      for (let rIdx = 1; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
        if (cells.length <= 1) continue;

        const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
        const isHeaderRow = /化学品名称.*CAS编号|Chemical\s*name.*CAS|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type|Component.*CAS/i.test(rowText);
        if (isHeaderRow) continue;

        const c0Text = (cells[0]?.textContent || '').trim();
        const c0HasSeq = /^(\d+(?:\.\d+)+)/.test(c0Text);
        if (cells.length >= 3 && !c0HasSeq) continue;

        const c0 = cells[0];
        const ps = Array.from(c0.getElementsByTagNameNS(W_NS, 'p'));
        for (const p of ps) {
          const pText = (p.textContent || '').trim();
          if (!pText) continue;

          checkedLabels++;
          const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
          assert(pPr, `pPr must exist`);

          // 1. 物理级杜绝 w:numPr、w:firstLine、w:firstLineChars、w:hangingChars
          const numPrs = Array.from(p.getElementsByTagNameNS(W_NS, 'numPr'))
            .concat(Array.from(pPr.getElementsByTagNameNS(W_NS, 'numPr')));
          assert.strictEqual(numPrs.length, 0, `numPr must be completely eliminated`);

          const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
          assert(ind, `ind element must exist on label paragraph`);
          assert(!ind.getAttribute('w:firstLine'), `w:firstLine must not exist`);
          assert(!ind.getAttribute('w:firstLineChars'), `w:firstLineChars must not exist`);
          assert(!ind.getAttribute('w:hangingChars'), `w:hangingChars must not exist`);

          const leftChars = ind.getAttribute('w:leftChars');
          assert(!leftChars || leftChars === '0', `w:leftChars must be null or "0"`);

          const mSeq = pText.match(/^(\d+(?:\.\d+)+)\s*(.*)$/);
          if (mSeq) {
            // 2. 带序号标签：悬挂缩进锁死，折行在 expectedIndent 垂线绝对对齐
            assert.strictEqual(ind.getAttribute('w:left'), expectedIndent);
            assert.strictEqual(ind.getAttribute('w:hanging'), expectedIndent);
          } else {
            // 3. 未编号标签：左缩进对齐 expectedIndent，且无 hanging，首字基线与带序号标签 100% 对齐
            unnumberedCount++;
            assert.strictEqual(ind.getAttribute('w:left'), expectedIndent);
            assert(!ind.getAttribute('w:hanging'), `Unnumbered label must not have w:hanging`);
          }
        }
      }
    }

    console.log(`✓ ${path.basename(item.path)}: verified ${checkedLabels} label paragraphs (including ${unnumberedCount} unnumbered labels).`);
  }
  console.log('✓ Suite label-alignment passed with 0 errors.\n');
}

/**
 * Suite 3: REQ-VALUE-INDENT-ALIGN-04 (多列顶格与通栏层级缩进二分机制)
 */
async function runValueAlignmentSuite() {
  console.log('--- Running Suite: value-alignment (REQ-VALUE-INDENT-ALIGN-04) ---');

  for (const item of TEST_FILES) {
    const isEn = item.path.includes('_EN_');
    const buf = fs.readFileSync(item.path);
    const engine = await loadDocx(buf);

    if (item.needProjection) {
      applyGlobalTypographyProjection(engine, isEn);
    }

    const doc = engine.documentXml;
    const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));

    let multiColumnValueParagraphsChecked = 0;

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const tbl = tables[tIdx];
      const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
      if (rows.length === 0) continue;

      for (let rIdx = 1; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const cells = Array.from(row.getElementsByTagNameNS(W_NS, 'tc'));
        if (cells.length <= 1) continue;

        const rowText = cells.map(c => (c.textContent || '').trim()).join(' ');
        const isHeaderRow = /化学品名称.*CAS编号|Chemical\s*name.*CAS|物质.*依据.*类型|Components.*Basis.*Type|Substance.*Basis.*Type|Component.*CAS/i.test(rowText);
        if (isHeaderRow) continue;

        const c0Text = (cells[0]?.textContent || '').trim();
        const c0HasSeq = /^(\d+(?:\.\d+)+)/.test(c0Text);
        if (cells.length >= 3 && !c0HasSeq) continue;

        // 验证多列表格第 1 列及后续填写值单元格
        for (let cIdx = 1; cIdx < cells.length; cIdx++) {
          const cell = cells[cIdx];
          const ps = Array.from(cell.getElementsByTagNameNS(W_NS, 'p'));
          for (const p of ps) {
            const pText = (p.textContent || '').trim();
            if (!pText) continue;

            multiColumnValueParagraphsChecked++;
            const pPr = p.getElementsByTagNameNS(W_NS, 'pPr')[0];
            if (pPr) {
              const ind = pPr.getElementsByTagNameNS(W_NS, 'ind')[0];
              // 多列值单元格必须纯净顶格：无 w:ind 或 w:left 为 "0"
              if (ind) {
                const left = ind.getAttribute('w:left');
                assert(!left || left === '0', `Multi-column value paragraph must not have left indent > 0, got ${left}`);
              }

              const numPrs = Array.from(pPr.getElementsByTagNameNS(W_NS, 'numPr'));
              assert.strictEqual(numPrs.length, 0, `Multi-column value must not have numPr`);

              const jc = pPr.getElementsByTagNameNS(W_NS, 'jc')[0];
              if (jc) {
                assert.strictEqual(jc.getAttribute('w:val'), 'left', `Multi-column value jc must be left`);
              }
            }
          }
        }
      }
    }

    console.log(`✓ ${path.basename(item.path)}: verified ${multiColumnValueParagraphsChecked} multi-column value paragraphs flush-left.`);
  }

  console.log('✓ Suite value-alignment passed with 0 errors.\n');
}

async function main() {
  const args = process.argv.slice(2);
  const suiteArg = args.find(a => a.startsWith('--suite='));
  const suite = suiteArg ? suiteArg.split('=')[1] : null;

  if (suite === 'spacing') {
    await runSpacingSuite();
  } else if (suite === 'label-alignment') {
    await runLabelAlignmentSuite();
  } else if (suite === 'value-alignment') {
    await runValueAlignmentSuite();
  } else {
    // 默认全跑
    await runSpacingSuite();
    await runLabelAlignmentSuite();
    await runValueAlignmentSuite();
    console.log('ALL INDENT AND ALIGNMENT INVARIANT SUITES PASSED (Exit code 0)!');
  }
}

main().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
