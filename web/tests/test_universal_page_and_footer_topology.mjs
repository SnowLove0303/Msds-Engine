import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import JSZip from 'jszip';
import { recognizeTemplateTopology } from '../src/template-topology-recognizer.js';
import { loadDocx, updateHeaderFooterData } from '../src/docx-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function getRepoPath(relPath) {
  return path.resolve(REPO_ROOT, relPath);
}

async function runTests() {
  console.log('=== STARTING UNIVERSAL PAGE & FOOTER TOPOLOGY TEST SUITE ===');

  const templates = [
    { name: 'CN Embedded Template', path: '覆写模块/内嵌模板/正式模板_MSDS_CN_冠志(1).docx', lang: 'CN' },
    { name: 'EN Embedded Template', path: '覆写模块/内嵌模板/正式模板_MSDS_EN_冠志(1).docx', lang: 'EN' },
    { name: 'Custom MCP CN Template', path: 'web/public/templates/custom/custom_mcp_template_v1_正式模板_MSDS_CN_冠志(1).docx', lang: 'CN' }
  ];

  // 1. 测试各模板的拓扑识别
  for (const tpl of templates) {
    console.log(`\n--- [TEST 1] Testing Topology Recognition on: ${tpl.name} ---`);
    const fullTplPath = getRepoPath(tpl.path);
    const topo = await recognizeTemplateTopology(fullTplPath);

    // 断言页面尺寸
    if (!topo.pageFormat) throw new Error(`${tpl.name}: Missing pageFormat!`);
    const sz = topo.pageFormat.pageSize;
    if (sz.widthDxa !== 11906 || sz.heightDxa !== 16838 || sz.orientation !== 'portrait') {
      throw new Error(`${tpl.name}: Unexpected pageSize ${JSON.stringify(sz)}`);
    }
    console.log(`  ✓ Page Size Verified: A4 portrait (${sz.widthMm}mm x ${sz.heightMm}mm)`);

    // 断言页边距
    const mar = topo.pageFormat.margins;
    if (mar.topDxa !== 2503 || mar.bottomDxa !== 1418 || mar.leftDxa !== 1077 || mar.rightDxa !== 1077) {
      throw new Error(`${tpl.name}: Unexpected margins ${JSON.stringify(mar)}`);
    }
    console.log(`  ✓ Page Margins Verified: top=${mar.topMm}mm, bottom=${mar.bottomMm}mm, left=${mar.leftMm}mm, right=${mar.rightMm}mm`);

    // 断言页脚插槽识别
    if (!topo.footerTopology || !topo.footerTopology.found) {
      throw new Error(`${tpl.name}: footerTopology not found!`);
    }
    const slots = topo.footerTopology.slots;
    if (!slots.revisionDate?.found) throw new Error(`${tpl.name}: revisionDate slot not found!`);
    if (!slots.entityModel?.found) throw new Error(`${tpl.name}: entityModel slot not found!`);
    if (!slots.pageNumber?.found) throw new Error(`${tpl.name}: pageNumber slot not found!`);

    console.log(`  ✓ Footer Slots Verified:`);
    console.log(`    - Revision Date Slot: container=${slots.revisionDate.container}, r=${slots.revisionDate.rowIndex}, c=${slots.revisionDate.cellIndex}, align=${slots.revisionDate.alignment}, sz=${slots.revisionDate.style.fontSizePt}pt, color=${slots.revisionDate.style.color}`);
    console.log(`    - Entity/Model Slot: container=${slots.entityModel.container}, r=${slots.entityModel.rowIndex}, c=${slots.entityModel.cellIndex}, align=${slots.entityModel.alignment}`);
    console.log(`    - Page Number Slot: container=${slots.pageNumber.container}, r=${slots.pageNumber.rowIndex}, c=${slots.pageNumber.cellIndex}`);
  }

  // 2. 测试中文文档页脚覆写与瑕疵清洗 (测试自定义企业 + 残留 P 与窄空格清洗)
  console.log('\n--- [TEST 2] Testing CN Deliverable Footer Cleaning & Custom Preset Injection ---');
  const cnBuf = fs.readFileSync(getRepoPath('覆写模块/内嵌模板/正式模板_MSDS_CN_冠志(1).docx'));
  const cnEngine = await loadDocx(cnBuf);

  updateHeaderFooterData(cnEngine, {
    model: 'UNIVERSAL-X100',
    company: '华夏合成新材料股份有限公司',
    revisionDate: 'P修订日期：2026年11月16日  ', // 带残留 P 与窄空格
    language: 'CN'
  });

  const exportedCnBytes = await cnEngine.exportArrayBuffer();
  const exportedCnZip = await JSZip.loadAsync(exportedCnBytes);
  const exportedCnFooter = await exportedCnZip.file('word/footer1.xml').async('text');

  if (exportedCnFooter.includes('P修订日期')) {
    throw new Error('FATAL: CN Exported footer still contains "P修订日期" artifact!');
  }
  if (exportedCnFooter.includes('\u2005')) {
    throw new Error('FATAL: CN Exported footer still contains non-breaking thin space "\\u2005"!');
  }
  if (!exportedCnFooter.includes('华夏合成新材料股份有限公司 UNIVERSAL-X100-MSDS')) {
    throw new Error('FATAL: CN Exported footer does not contain custom preset company and model!');
  }
  if (!exportedCnFooter.includes('修订日期：2026年11月16日')) {
    throw new Error('FATAL: CN Exported footer does not contain cleaned standard revision date!');
  }
  console.log('  ✓ CN Exported Footer Verified:');
  console.log('    - Zero "P" artifact verified');
  console.log('    - Zero thin space artifact verified');
  console.log('    - Custom entity "华夏合成新材料股份有限公司" injected cleanly');
  console.log('    - "修订日期：2026年11月16日" verified');

  // 3. 测试英文文档页脚覆写与格式转换 (测试自定义英文企业 + 日期转标准英文)
  console.log('\n--- [TEST 3] Testing EN Deliverable Footer Cleaning & Custom Preset Injection ---');
  const enBuf = fs.readFileSync(getRepoPath('覆写模块/内嵌模板/正式模板_MSDS_EN_冠志(1).docx'));
  const enEngine = await loadDocx(enBuf);

  updateHeaderFooterData(enEngine, {
    model: 'GLOBAL-ECO-200',
    company: 'Apex Polymer International Corp.',
    revisionDate: '2026年11月16日', // 中文日期格式输入
    language: 'EN'
  });

  const exportedEnBytes = await enEngine.exportArrayBuffer();
  const exportedEnZip = await JSZip.loadAsync(exportedEnBytes);
  const exportedEnFooter = await exportedEnZip.file('word/footer1.xml').async('text');

  if (exportedEnFooter.includes('P修订日期') || exportedEnFooter.includes('修订日期')) {
    throw new Error('FATAL: EN Exported footer contains Chinese "修订日期" artifact!');
  }
  if (!exportedEnFooter.includes('Apex Polymer International Corp. GLOBAL-ECO-200-MSDS')) {
    throw new Error('FATAL: EN Exported footer does not contain custom preset company and model!');
  }
  if (!exportedEnFooter.includes('Revision Date: 2026-11-16')) {
    throw new Error('FATAL: EN Exported footer does not contain standardized "Revision Date: 2026-11-16"!');
  }
  console.log('  ✓ EN Exported Footer Verified:');
  console.log('    - Zero Chinese artifacts in EN footer');
  console.log('    - Custom entity "Apex Polymer International Corp." injected cleanly');
  console.log('    - Standardized "Revision Date: 2026-11-16" verified');

  console.log('\n=============================================================');
  console.log('=== ALL 3 TEST SUITES PASSED 100% WITH ZERO DEFECTS! ===');
  console.log('=============================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
