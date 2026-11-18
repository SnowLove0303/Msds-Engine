import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  registerCustomTemplate,
  inspectTemplateSchema,
  createWorkSession,
  deleteColumnFromSession,
  mergeCellsInSession,
  insertRowIntoSession,
  writeRichTextToSession,
  writeCellValueToSession,
  peekCellInSession,
  peekRowInSession,
  createCheckpoint,
  rollbackSession,
  saveSession
} from '../src/template-editor.js';

async function testUniversalEditor() {
  console.log('=== 万能自适应几何编辑器端到端实测 ===\n');

  const tmpDir = path.join(os.tmpdir(), `universal_editor_test_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // 1. 测试新模板动态上传与注册
  console.log('--- 测试 1: 动态注册外部新模板 ---');
  const sampleTemplate = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const regRes = await registerCustomTemplate(sampleTemplate, {
    key: 'custom_test_tpl',
    name: '第三方测试客户母版_CN.docx',
    company: 'TestCompany',
    language: 'zh'
  });

  if (!regRes.success || !regRes.schema.sections[1]) {
    throw new Error('registerCustomTemplate failed');
  }
  console.log('✅ 新模板动态注册成功: templateKey =', regRes.templateKey);
  console.log('✅ 模板网格拓扑反射成功: Section 1 列数 =', regRes.schema.sections[1].columnCount, '宽度 =', regRes.schema.sections[1].gridWidthsTwips);

  // 2. 创建独立编辑工作会话
  console.log('\n--- 测试 2: 创建独立工作会话 ---');
  const session = await createWorkSession('custom_test_tpl', tmpDir);
  console.log('✅ 工作会话创建成功: sessionId =', session.sessionId);

  // 3. 触觉透视：查看操作前的状态 (Section 3 Row 3 真实三列成分行)
  console.log('\n--- 测试 3: 触觉感知透视 (Peek) ---');
  const s3PrePeek = peekRowInSession(session, { sectionNumber: 3, rowIndex: 3 });
  console.log('✅ Peek Row (Section 3 Row 3): 列数 =', s3PrePeek.cellsCount, '文本 =', s3PrePeek.cellsText);

  // 4. 事务检查点 (Checkpoint)
  console.log('\n--- 测试 4: 创建事务检查点 (Checkpoint) ---');
  await createCheckpoint(session, 'cp_init');
  console.log('✅ 事务检查点创建成功: cp_init');

  // 5. 核心测试：全表格删列 (deleteColumn)，攻克三列结构删除中间列痛点！
  console.log('\n--- 测试 5: 全表格删列 (deleteColumn) ---');
  // 在 Section 3 执行 deleteColumn(colIndex = 1)，剔除中间的 CAS编号/标签列
  const delColRes = deleteColumnFromSession(session, { sectionNumber: 3, colIndex: 1 });
  console.log('✅ deleteColumn 执行结果:', delColRes);
  const s3PostPeek = peekRowInSession(session, { sectionNumber: 3, rowIndex: 3 });
  console.log('✅ 删列后 Section 3 Row 3: 列数从 3 变为 =', s3PostPeek.cellsCount, '文本 =', s3PostPeek.cellsText);
  if (s3PostPeek.cellsCount !== 2) {
    throw new Error(`Expected 2 cells after deleteColumn, got ${s3PostPeek.cellsCount}`);
  }

  // 6. 测试单元格横向合并 (mergeCells) 转化为单格通栏
  console.log('\n--- 测试 6: 单元格横向合并 (mergeCells) ---');
  const mergeRes = mergeCellsInSession(session, {
    sectionNumber: 3,
    rowIndex: 3,
    colStart: 0,
    colSpan: 2
  });
  console.log('✅ mergeCells 执行结果:', mergeRes);
  const cellPeek = peekCellInSession(session, { sectionNumber: 3, rowIndex: 3, cellIndex: 0 });
  console.log('✅ 合并后第 0 格 gridSpan =', cellPeek.gridSpan);
  if (cellPeek.gridSpan !== 2) {
    throw new Error(`Expected gridSpan=2, got ${cellPeek.gridSpan}`);
  }

  // 7. 测试样式继承克隆增行 (insertRow)
  console.log('\n--- 测试 7: 样式继承克隆插入新行 (insertRow) ---');
  const insertRes = insertRowIntoSession(session, {
    sectionNumber: 3,
    targetRowIndex: 4,
    cloneFromRowIndex: 3
  });
  console.log('✅ insertRow 执行结果:', insertRes);
  const s3NewRowPeek = peekRowInSession(session, { sectionNumber: 3, rowIndex: 4 });
  console.log('✅ 新增行状态 (Section 3 Row 4): 列数 =', s3NewRowPeek.cellsCount);

  // 8. 测试微观 Run 级富文本与化学式下标写入 (writeRichText)
  console.log('\n--- 测试 8: 微观 Run 级富文本与化学式下标写入 ---');
  // 8.1 写入化学式 H2SO4 (自动转下标)
  writeRichTextToSession(session, {
    sectionNumber: 3,
    rowIndex: 4,
    cellIndex: 0,
    chemicalFormula: 'H2SO4'
  });
  const chemPeek = peekCellInSession(session, { sectionNumber: 3, rowIndex: 4, cellIndex: 0 });
  console.log('✅ 化学式写入结果文本:', chemPeek.text);
  if (!chemPeek.text.includes('H2SO4')) {
    throw new Error('Chemical formula text mismatch');
  }

  // 8.2 写入混合加粗富文本
  writeRichTextToSession(session, {
    sectionNumber: 3,
    rowIndex: 3,
    cellIndex: 0,
    runs: [
      { text: '【成分通栏警示】 ', bold: true, fontSizePt: 12, fontFamily: '宋体' },
      { text: '含活性稀释剂与阻燃助剂。', bold: false, fontSizePt: 12, fontFamily: '宋体' }
    ]
  });
  const richPeek = peekCellInSession(session, { sectionNumber: 3, rowIndex: 3, cellIndex: 0 });
  console.log('✅ 混合加粗富文本写入结果:', richPeek.text);

  // 9. 测试事务回滚 (Rollback)
  console.log('\n--- 测试 9: 事务回滚 (Rollback) ---');
  await rollbackSession(session, 'cp_init');
  const rollbackPeek = peekRowInSession(session, { sectionNumber: 3, rowIndex: 3 });
  console.log('✅ 回滚后 Section 3 Row 3 列数恢复为 =', rollbackPeek.cellsCount, '(应与预处理前一致 3 列)');
  if (rollbackPeek.cellsCount !== s3PrePeek.cellsCount) {
    throw new Error('Rollback failed to restore original column count');
  }

  // 10. 重新执行删列并保存导出
  console.log('\n--- 测试 10: 重新执行删列并持久化导出 DOCX ---');
  deleteColumnFromSession(session, { sectionNumber: 3, colIndex: 1 });
  writeCellValueToSession(session, {
    sectionNumber: 3,
    rowIndex: 4,
    cellIndex: 0,
    text: '聚氨酯主剂 (已剔除中间标签列)'
  });
  writeCellValueToSession(session, {
    sectionNumber: 3,
    rowIndex: 4,
    cellIndex: 1,
    text: '60.0% ~ 70.0%'
  });

  const outDocx = path.join(tmpDir, 'universal_editor_output.docx');
  const saveRes = await saveSession(session, outDocx);
  console.log('✅ 文档安全保存成功:', saveRes.outputPath, '大小:', saveRes.sizeBytes, 'bytes');

  if (!fs.existsSync(outDocx) || saveRes.sizeBytes === 0) {
    throw new Error('Saved docx does not exist or empty');
  }

  console.log('\n🎉 万能自适应几何编辑器全部 10 项严苛测试 100% 满分通过 (Exit Code 0)！');
  process.exit(0);
}

testUniversalEditor().catch(err => {
  console.error('❌ Universal Editor Test FAILED:', err);
  process.exit(1);
});
