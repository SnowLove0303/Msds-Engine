import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';
import {
  ReviewSession,
  Annotation,
  createAnchor,
  resolveAnchor,
  detectAnchorDrift,
  checkExportGate,
  buildReviewBundle,
  formatNdjson,
  parseNdjson,
  computeRowFingerprint,
  computeCellFingerprint,
  computeContentHash,
  initReviewSession,
  ANNOTATION_SCHEMA_VERSION,
} from '../src/annotation-engine.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=================================================================');
console.log('MSDS STUDIO 逐标签/值/位置批注与 Agent 友好导出自动化测试套件');
console.log('=================================================================\n');

// -------------------------------------------------------------
// 测试 1：6 维稳定锚点体系生成与指纹算法
// -------------------------------------------------------------
console.log('--- 测试 1：6 维稳定锚点体系生成与指纹抗性 ---');

// 1.1 Section 锚点
const secAnchor = createAnchor('section', {
  sectionNumber: 2,
  sectionTitle: '危险性概述',
  recordId: 'rec_s2_01',
});
assert.equal(secAnchor.kind, 'section');
assert.equal(secAnchor.sectionNumber, 2);
assert.equal(secAnchor.recordFingerprint, 'rec_2');

// 1.2 Row 锚点与 rowFingerprint 计算
const rowAnchor = createAnchor('row', {
  sectionNumber: 2,
  slotId: 's2:ghs_classification',
  labelText: '2.1  GHS危险性类别：',
  cellRoles: ['label', 'value'],
  sequence: '2.1',
  rowIndex: 3,
});
assert.equal(rowAnchor.kind, 'row');
assert.ok(rowAnchor.rowFingerprint.startsWith('rfp_2_'), '行指纹必须包含章节前缀');
assert.equal(rowAnchor.labelKey, 'ghs危险性类别');

// 1.3 Cell / Label / Value 锚点
const valAnchor = createAnchor('value', {
  sectionNumber: 1,
  slotId: 's1:product_model',
  labelText: '产品名称：',
  valueText: '聚氨酯分散体 PU-1001',
  rowIndex: 1,
  valueCellIndex: 1,
});
assert.equal(valAnchor.kind, 'value');
assert.equal(valAnchor.valueText, '聚氨酯分散体 PU-1001');
assert.equal(valAnchor.valueHash, computeContentHash('聚氨酯分散体 PU-1001'));

// 1.4 Position 锚点
const posAnchor = createAnchor('position', {
  sectionNumber: 6,
  rowIndex: 2,
  cellIndex: 1,
  pageIndex: 3,
  x: 120,
  y: 340,
  width: 200,
  height: 40,
});
assert.equal(posAnchor.kind, 'position');
assert.equal(posAnchor.visual.pageIndex, 3);
assert.equal(posAnchor.visual.x, 120);

console.log('✓ 测试 1 全部通过！\n');

// -------------------------------------------------------------
// 测试 2：抗剪枝删行、抗序号重排的锚点重新定位
// -------------------------------------------------------------
console.log('--- 测试 2：抗剪枝删行与序号重排重定位验证 ---');

const mockRecords = [
  {
    id: 'rec_s2',
    sectionNumber: 2,
    rows: [
      { index: 0, cells: [{ text: '危险性概述', role: 'table-header' }] },
      { index: 1, cells: [{ labelText: '2.1 GHS危险性类别：', role: 'label' }, { text: '易燃液体 类别2', role: 'value' }] },
      { index: 2, cells: [{ labelText: '2.2 象形图：', role: 'label' }, { text: '火焰', role: 'value' }] },
      { index: 3, cells: [{ labelText: '2.3 信号词：', role: 'label' }, { text: '危险', role: 'value' }] },
      { index: 4, cells: [{ labelText: '2.4 危险说明：', role: 'label' }, { text: '高度易燃液体和蒸气', role: 'value' }] },
    ],
  },
];

// 为原始行 3 (信号词) 创建批注
const targetAnchor = createAnchor('row', {
  sectionNumber: 2,
  slotId: 's2:signal_word',
  labelText: '2.3 信号词：',
  sequence: '2.3',
  rowIndex: 3,
});

const resInitial = resolveAnchor(targetAnchor, mockRecords);
assert(resInitial.resolved, '初始状态必须能精准定位行 3');
assert.equal(resInitial.row.index, 3);

// 模拟物理删行与重编号：删除行 2 (象形图)，原行 3 变为行 2，序号重新编号为 2.2
const prunedRecords = [
  {
    id: 'rec_s2',
    sectionNumber: 2,
    rows: [
      { index: 0, cells: [{ text: '危险性概述', role: 'table-header' }] },
      { index: 1, cells: [{ labelText: '2.1 GHS危险性类别：', role: 'label' }, { text: '易燃液体 类别2', role: 'value' }] },
      // 行 2 (象形图) 被剪枝剔除！
      { index: 2, cells: [{ labelText: '2.2 信号词：', role: 'label' }, { text: '危险', role: 'value' }] },
      { index: 3, cells: [{ labelText: '2.3 危险说明：', role: 'label' }, { text: '高度易燃液体和蒸气', role: 'value' }] },
    ],
  },
];

// 使用原有锚点重新解析
const resAfterPrune = resolveAnchor(targetAnchor, prunedRecords);
assert(resAfterPrune.resolved, '在行 2 被剪枝且序号重排后，既有锚点必须依然能精准重新定位！');
assert.equal(resAfterPrune.row.index, 2, '物理行索引自动更新至新的真实索引 2');
assert.ok(resAfterPrune.row.cells[0].labelText.includes('信号词'), '定位的目标必须严格保持为信号词');

console.log('✓ 测试 2 全部通过！\n');

// -------------------------------------------------------------
// 测试 3：批注状态机、三方证据链与漂移失效检测
// -------------------------------------------------------------
console.log('--- 测试 3：状态机、三方证据链与值漂移检测 ---');

const session = new ReviewSession({
  productModel: 'PU-1001',
  sourceFileName: 'PU-1001_source.docx',
  sourceHash: 'hash_src_123',
  templateName: 'CN 冠志',
  templateHash: 'hash_tpl_456',
});

const ann = new Annotation({
  reviewSessionId: session.reviewSessionId,
  status: 'open',
  severity: 'error',
  category: 'wrong_value',
  title: 'Section 5.1 灭火剂文本未覆盖源事实',
  comment: '检测到当前结果仍保留了模板默认示例',
  expected: '雾状水、抗溶性泡沫、干粉、二氧化碳',
  actual: '水喷雾、泡沫',
  suggestedAction: '从源文件 Section 5.1 重新提取完整灭火剂',
  anchor: createAnchor('value', {
    sectionNumber: 5,
    slotId: 's5:extinguishing_media',
    labelText: '5.1 灭火介质：',
    valueText: '水喷雾、泡沫',
    rowIndex: 1,
  }),
  sourceEvidence: {
    sourceLocator: 'rec_s5.row[1].cell[1]',
    sourceText: '合适的灭火剂：雾状水、抗溶性泡沫、干粉、二氧化碳',
    sourceSection: 5,
  },
  matchEvidence: {
    matchKey: 'suitable_extinguishing_media',
    slotId: 's5:extinguishing_media',
    confidence: 0.9,
  },
  templateEvidence: {
    templateLabel: '5.1 适用的灭火介质：',
    templateValueBefore: '水喷雾/泡沫',
  },
  snapshot: {
    valueHash: computeContentHash('水喷雾、泡沫'),
    sourceHash: 'hash_src_123',
  },
});

session.addAnnotation(ann);
assert.equal(session.annotations.length, 1);
assert.equal(ann.status, 'open');

// 3.1 模拟值在编辑器中被修改：漂移检测应自动将批注标记为 stale
const editorRecords = [
  {
    id: 'rec_s5',
    sectionNumber: 5,
    rows: [
      { index: 0, cells: [{ text: '消防措施' }] },
      { index: 1, cells: [{ labelText: '5.1 适用的灭火介质：' }, { valueText: '修改后的部分灭火剂文本' }] },
    ],
  },
];

const driftRes = detectAnchorDrift(ann, editorRecords);
assert(driftRes.drifted, '检测到值内容改变，必须报告漂移');
assert.equal(ann.status, 'stale', '批注状态必须自动流转为 stale');

// 3.2 标记为已解决
ann.resolve('已通过重新匹配写入完整灭火剂');
assert.equal(ann.status, 'resolved');
assert.ok(ann.resolvedAt, '必须记录 resolvedAt 时间戳');

console.log('✓ 测试 3 全部通过！\n');

// -------------------------------------------------------------
// 测试 4：导出门禁规则 (Gatekeeper) 断言
// -------------------------------------------------------------
console.log('--- 测试 4：导出门禁规则与 Blocker/Error 拦截断言 ---');

const gateSession = new ReviewSession({ productModel: 'PU-1002' });

// 4.1 无批注 -> 准予放行
const g1 = checkExportGate(gateSession);
assert.equal(g1.allowed, true);
assert.equal(g1.status, 'allowed');

// 4.2 增加 Warning / Info -> 准予放行 (带警告)
const warnAnn = new Annotation({ severity: 'warning', status: 'open', title: '轻微文案差异' });
gateSession.addAnnotation(warnAnn);
const g2 = checkExportGate(gateSession);
assert.equal(g2.allowed, true);
assert.equal(g2.status, 'allowed_with_warnings');

// 4.3 增加 Error -> 坚决拦截
const errAnn = new Annotation({ severity: 'error', status: 'open', title: '数值计算错误' });
gateSession.addAnnotation(errAnn);
const g3 = checkExportGate(gateSession);
assert.equal(g3.allowed, false, '存在未处理 Error 时必须坚决阻止导出');
assert.equal(g3.status, 'blocked');

// 4.4 增加 Blocker -> 坚决拦截
const blockAnn = new Annotation({ severity: 'blocker', status: 'open', title: '成分严重缺失' });
gateSession.addAnnotation(blockAnn);
const g4 = checkExportGate(gateSession);
assert.equal(g4.allowed, false, '存在 Blocker 时必须坚决阻止导出');
assert.equal(g4.blockers.length, 1);

// 4.5 全部修复解决 -> 准予放行
errAnn.resolve();
blockAnn.resolve();
warnAnn.resolve();
const g5 = checkExportGate(gateSession);
assert.equal(g5.allowed, true);
assert.equal(g5.status, 'allowed');

console.log('✓ 测试 4 全部通过！\n');

// -------------------------------------------------------------
// 测试 5：Agent 专属审阅包生成与 NDJSON 序列化断言
// -------------------------------------------------------------
console.log('--- 测试 5：Agent 专属审阅包生成与 NDJSON 序列化断言 ---');

const bundleSession = new ReviewSession({
  productModel: 'PU-1003',
  sourceFileName: 'PU-1003_source_CN.docx',
  sourceHash: 'sha_src_999',
  templateName: 'CN 冠志',
  templateHash: 'sha_tpl_888',
});

bundleSession.addAnnotation(new Annotation({
  severity: 'error',
  category: 'wrong_value',
  title: 'Section 1.1 中文名称不规范',
  expected: '芳香族水性聚氨酯接着树脂 PU-1003',
  actual: 'PU-1003',
  suggestedAction: '补充完整品名',
  anchor: createAnchor('value', { sectionNumber: 1, slotId: 's1:chinese_name', valueText: 'PU-1003' }),
}));

bundleSession.addAnnotation(new Annotation({
  severity: 'warning',
  category: 'needs_manual_review',
  title: 'Section 9 黏度测定条件待确认',
  expected: '25℃, 50-200 mPa.s',
  actual: '50-200 mPa.s',
  suggestedAction: '核对原件是否包含 25℃ 测试条件',
  anchor: createAnchor('value', { sectionNumber: 9, slotId: 's9:viscosity', valueText: '50-200 mPa.s' }),
}));

const bundle = buildReviewBundle(bundleSession, { finalDocxName: 'PU-1003_MSDS_CN_冠志.docx' });

assert.equal(bundle.manifest.schemaVersion, ANNOTATION_SCHEMA_VERSION);
assert.equal(bundle.manifest.productModel, 'PU-1003');
assert.equal(bundle.manifest.annotationCount, 2);
assert.equal(bundle.manifest.errorCount, 1);
assert.equal(bundle.manifest.warningCount, 1);
assert(bundle.files['annotations.ndjson'], '必须输出 annotations.ndjson');
assert(bundle.files['manifest.json'], '必须输出 manifest.json');
assert(bundle.files['review-summary.md'], '必须输出 review-summary.md');

// 验证 NDJSON 解析与 Agent 零 DOM 依赖定位能力
const parsedAnns = parseNdjson(bundle.files['annotations.ndjson']);
assert.equal(parsedAnns.length, 2, 'NDJSON 必须包含全部 2 条批注');
for (const p of parsedAnns) {
  assert(p.annotationId, '每条批注必须携带唯一 ID');
  assert(p.anchor.slotId, '每条批注必须携带语义 slotId 定位');
  assert(typeof p.expected === 'string', '每条批注必须包含 expected 期望内容');
  assert(typeof p.actual === 'string', '每条批注必须包含 actual 实际内容');
  assert(p.suggestedAction, '每条批注必须包含 suggestedAction 建议动作');
}

console.log('✓ 测试 5 全部通过！\n');

// -------------------------------------------------------------
// 测试 6：真实 PU-1001 至 PU-1004 端到端集成、DOCX 洁净度与 Roundtrip 断言
// -------------------------------------------------------------
console.log('--- 测试 6：真实 PU-1001 ~ PU-1004 端到端集成与 DOCX 洁净度断言 ---');

const tplBuf = await fs.readFile(new URL('../public/templates/正式模板_MSDS_CN_冠志(1).docx', import.meta.url));

const models = ['PU-1001', 'PU-1002', 'PU-1003', 'PU-1004'];

for (const model of models) {
  const sPath = new URL(`../../scratch/standard-compare/${model}_source_CN.docx`, import.meta.url);
  const sBuf = await fs.readFile(sPath);

  const sDoc = await loadDocx(sBuf, `${model}_source.docx`);
  const tDoc = await loadDocx(tplBuf, `${model}_template.docx`);

  const matchResult = runSmartMatching(sDoc.records);
  applyMatchResultToEditor(matchResult, tDoc);

  // 初始化审阅会话
  const reviewSession = initReviewSession({
    sourceEngine: sDoc,
    matchResult,
    templateEngine: tDoc,
    productModel: model,
    templateName: 'CN 冠志',
  });

  assert(reviewSession.sourceFacts.length > 0, `${model} 必须成功提取源事实列表`);
  assert(reviewSession.matchingSlots.length > 0, `${model} 必须成功提取模板插槽列表`);

  // 为真实产品添加测试批注
  reviewSession.addAnnotation(new Annotation({
    reviewSessionId: reviewSession.reviewSessionId,
    status: 'resolved', // 标记为已解决，确保放行导出
    severity: 'info',
    category: 'wrong_value',
    title: `${model} 审阅记录`,
    comment: '内部合规审计通过',
    anchor: createAnchor('row', { sectionNumber: 1, slotId: 's1:product_model', labelText: '产品名称：' }),
  }));

  const exportGate = checkExportGate(reviewSession);
  assert(exportGate.allowed, `${model} 在无阻断项时必须准予导出`);

  // 导出正式 DOCX 二进制并检验洁净度
  const docxBytes = await tDoc.exportArrayBuffer();
  assert(docxBytes && docxBytes.byteLength > 0, '导出的 DOCX 必须为有效二进制');

  const reloaded = await loadDocx(docxBytes, `${model}_clean_verify.docx`);

  // 严格断言：正式 DOCX 中绝对不包含任何内部批注或审计标记
  for (const rec of reloaded.records) {
    for (const row of rec.rows || []) {
      for (const cell of row.cells || []) {
        const text = cell.text || '';
        assert(!text.includes('内部合规审计通过'), `正式 DOCX 中绝不能包含批注正文内容！`);
        assert(!text.includes('ANN-'), `正式 DOCX 中绝不能包含批注 ID！`);
        assert(!text.includes('msds-review-bundle'), `正式 DOCX 中绝不能包含内部审阅标记！`);
      }
    }
  }

  // 生成真实产品审阅包并验证
  const modelBundle = buildReviewBundle(reviewSession, { finalDocxName: `${model}_MSDS_CN_冠志.docx` });
  assert.equal(modelBundle.manifest.productModel, model);
  assert(modelBundle.files['annotations.ndjson'].length > 0, '审阅包必须包含有效 NDJSON');

  console.log(`✓ ${model} 端到端审阅会话、DOCX 100% 洁净度与审阅包导出校验通过！`);
}

console.log('\n=================================================================');
console.log('🎉 逐标签值位置批注与 Agent 友好导出体系所有测试 100% 全部通过！');
console.log('=================================================================\n');
