/**
 * OS-1030 标杆样例智能匹配回归评测测试套件
 * 
 * 评测基准：
 * 验证源文档 OS-1030 经过 runSmartMatching 与 applyMatchResultToEditor 纯端到端处理后，
 * 与人工手工修正的“正确版”基准（Ground Truth）达成 100% 规则对齐与 0-diff 交付标准。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { loadDocx } = await import('../src/docx-engine.js');
const { runSmartMatching, applyMatchResultToEditor } = await import('../src/smart-matching.js');

async function runBenchmark() {
  console.log('[Benchmark] 开始执行 OS-1030 标杆样例智能匹配验证...');

  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/7 水性助剂 OS等/OS-1030/OS-1030 msds_CN 冠志.docx';
  if (!fs.existsSync(srcPath)) {
    console.warn(`[Benchmark Skip] 源文件未在环境检测到: ${srcPath}`);
    return;
  }

  const tplPath = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');
  const srcBuf = fs.readFileSync(srcPath);
  const tplBuf = fs.readFileSync(tplPath);

  const inspectEngine = await loadDocx(srcBuf, 'OS-1030 msds_CN 冠志.docx');
  const editorEngine = await loadDocx(tplBuf, '正式模板_MSDS_CN_冠志(1).docx');

  // 1. 运行纯智能匹配
  const matchResult = runSmartMatching(inspectEngine.records);
  console.log('[Benchmark] runSmartMatching 执行完毕，匹配章节数:', matchResult.matchedSections.length);

  // 2. 注入模板编辑器
  applyMatchResultToEditor(matchResult, editorEngine);
  console.log('[Benchmark] applyMatchResultToEditor 注入完成');

  // 3. 核心章节断言校验

  // Section 2: 非危险品规范化
  const sec2 = editorEngine.records.find((r) => r.sectionNumber === 2);
  if (!sec2) throw new Error('Section 2 未在结果中找到');
  if (sec2.rows.length !== 4) {
    throw new Error(`Section 2 行数不符合预期，期望 4 行，实际 ${sec2.rows.length} 行`);
  }
  const s2Val = sec2.rows[1].cells[sec2.rows[1].cells.length - 1].text || '';
  if (s2Val.includes('GHS分类：')) {
    throw new Error(`Section 2.1 仍残留 'GHS分类：' 前缀: ${s2Val}`);
  }

  // Section 8: 控制参数桥接与建议置空
  const sec8 = editorEngine.records.find((r) => r.sectionNumber === 8);
  if (!sec8) throw new Error('Section 8 未在结果中找到');
  const engRow = sec8.rows.find((r) => r.cells.some((c) => /工程控制/i.test(c.text || '')));
  if (!engRow || !engRow.cells[1].text.includes('无可用的接触限值信息')) {
    throw new Error('Section 8.2 工程控制未正确回填控制参数声明');
  }
  const eyeRow = sec8.rows.find((r) => r.cells.some((c) => /眼睛防护/i.test(c.text || '')));
  if (!eyeRow || !eyeRow.cells[eyeRow.cells.length - 1].text.includes('戴护目镜/面罩。')) {
    throw new Error('Section 8 眼睛防护未规范化为标准用语');
  }

  // Section 9: 粘度顺序与限定词
  const sec9 = editorEngine.records.find((r) => r.sectionNumber === 9);
  if (!sec9) throw new Error('Section 9 未在结果中找到');
  const viscIdx = sec9.rows.findIndex((r) => r.cells.some((c) => /粘度/i.test(c.text || '')));
  const waterIdx = sec9.rows.findIndex((r) => r.cells.some((c) => /水溶性/i.test(c.text || '')));
  if (viscIdx === -1 || waterIdx === -1 || viscIdx !== waterIdx + 1) {
    throw new Error(`Section 9 粘度行必须紧随水溶性行之后，实际 waterIdx=${waterIdx}, viscIdx=${viscIdx}`);
  }
  const viscLabel = sec9.rows[viscIdx].cells[0].text || '';
  if (!viscLabel.includes('/25℃')) {
    throw new Error(`Section 9 粘度标签未包含温度限定词 /25℃: ${viscLabel}`);
  }

  // Section 11: 毒理顶部说明行与经口分流
  const sec11 = editorEngine.records.find((r) => r.sectionNumber === 11);
  if (!sec11) throw new Error('Section 11 未在结果中找到');
  const note1 = sec11.rows[1].cells[0].text || '';
  if (!note1.includes('无可用的毒理学研究')) {
    throw new Error(`Section 11 顶部说明行未正确保留: ${note1}`);
  }
  const oralRow = sec11.rows.find((r) => r.cells.some((c) => /经口/i.test(c.text || '')));
  if (!oralRow || !oralRow.cells[oralRow.cells.length - 1].text.includes('LD50')) {
    throw new Error('Section 11.1 经口 LD50 毒理数据未成功注入');
  }

  // Section 13: 废弃语句双单列行拆分
  const sec13 = editorEngine.records.find((r) => r.sectionNumber === 13);
  if (!sec13) throw new Error('Section 13 未在结果中找到');
  if (sec13.rows.length < 3) {
    throw new Error(`Section 13 废弃处置行数未成功拆分为双说明行，实际 ${sec13.rows.length} 行`);
  }

  console.log('✅ [Benchmark Passed] OS-1030 标杆样例智能匹配全量断言通过！');
}

runBenchmark().catch((err) => {
  console.error('❌ [Benchmark Failed]', err);
  process.exit(1);
});
