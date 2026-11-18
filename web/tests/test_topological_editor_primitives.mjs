import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  createWorkSession,
  getSectionTopology,
  peekRow,
  peekCell,
  reshapeTableRows,
  morphToFullWidth,
  morphToMultiColumn,
  insertRowAfter,
  deleteRow,
  mergeCells,
  applyAdaptiveRuler,
  enforceFlushLeftValues,
  validateTopologicalInvariants,
  checkpoint,
  rollback,
  saveSession
} from '../src/template-editor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

async function runTopologicalPrimitivesTest() {
  console.log('=== [TEST] 拓扑级编辑器变异与内省原语单元测试 (v9.0) ===\n');

  const tmpDir = path.join(os.tmpdir(), `topo_primitives_test_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const session = await createWorkSession('CN_Guanzhi', tmpDir);
  console.log('✅ 1. 成功创建工作会话:', session.sessionId);

  // 1. 测试 getSectionTopology
  console.log('\n--- 测试 1: getSectionTopology ---');
  const s1Topo = getSectionTopology(session, 1);
  console.log(`    • Section 1 行数: ${s1Topo.rowCount}, 列数: ${s1Topo.columnCount}`);
  assert.ok(s1Topo.rowCount > 0, 'Section 1 应有行');
  assert.strictEqual(s1Topo.columnCount, 2, 'Section 1 应为标准 2 列');
  assert.strictEqual(s1Topo.rows[0].type, 'FULL_WIDTH', 'Section 1 标题行应为 FULL_WIDTH');

  const s3Topo = getSectionTopology(session, 3);
  console.log(`    • Section 3 行数: ${s3Topo.rowCount}, 列数: ${s3Topo.columnCount}`);
  assert.ok(s3Topo.rowCount >= 3, 'Section 3 应有基础行数');

  // 2. 测试 peekRow 与 peekCell 重载
  console.log('\n--- 测试 2: peekRow & peekCell ---');
  const rowPeek = peekRow(session, 1, 1);
  console.log(`    • peekRow(1, 1) cellCount: ${rowPeek.cellsCount}, text: ${rowPeek.cellsText[0]}`);
  assert.strictEqual(rowPeek.cellsCount, 2);

  const cellPeek = peekCell(session, 1, 1, 0);
  console.log(`    • peekCell(1, 1, 0) text: ${cellPeek.text}, bold: ${cellPeek.bold}`);
  assert.ok(cellPeek.bold, 'Section 1 Row 1 Cell 0 应当加粗');

  // 3. 测试 checkpoint & rollback
  console.log('\n--- 测试 3: checkpoint & rollback ---');
  await checkpoint(session, 'before_reshape');
  console.log('    • 检查点 before_reshape 创建成功');

  // 4. 测试 reshapeTableRows (增行与减行)
  console.log('\n--- 测试 4: reshapeTableRows ---');
  const origS3Rows = s3Topo.rowCount;
  const targetS3Rows = origS3Rows + 3;
  const reshapeRes = reshapeTableRows(session, 3, targetS3Rows);
  console.log(`    • Section 3 扩充至 ${targetS3Rows} 行:`, reshapeRes);
  const postReshapeTopo = getSectionTopology(session, 3);
  assert.strictEqual(postReshapeTopo.rowCount, targetS3Rows, '行数应精确等于 targetRowCount');

  // 回滚验证
  await rollback(session, 'before_reshape');
  const rolledBackTopo = getSectionTopology(session, 3);
  console.log(`    • 回滚后 Section 3 行数恢复至: ${rolledBackTopo.rowCount}`);
  assert.strictEqual(rolledBackTopo.rowCount, origS3Rows, '回滚后行数应完全恢复');

  // 5. 测试 morphToFullWidth
  console.log('\n--- 测试 5: morphToFullWidth ---');
  const morphRes = morphToFullWidth(session, 3, 2, '商业机密已豁免声明');
  console.log(`    • morphToFullWidth(3, 2) 结果:`, morphRes);
  const s3Row2Topo = getSectionTopology(session, 3).rows[2];
  assert.strictEqual(s3Row2Topo.type, 'FULL_WIDTH', '变形后第 2 行应为 FULL_WIDTH');
  assert.strictEqual(s3Row2Topo.cells[0].text, '商业机密已豁免声明');

  // 6. 测试 morphToMultiColumn
  console.log('\n--- 测试 6: morphToMultiColumn ---');
  const multiColRes = morphToMultiColumn(session, 3, 2, [3000, 3000, 3781]);
  console.log(`    • morphToMultiColumn(3, 2) 结果:`, multiColRes);
  const s3Row2MultiTopo = getSectionTopology(session, 3).rows[2];
  assert.strictEqual(s3Row2MultiTopo.cellCount, 3, '重构后应为 3 列');

  // 7. 测试 insertRowAfter & deleteRow
  console.log('\n--- 测试 7: insertRowAfter & deleteRow ---');
  const insRes = insertRowAfter(session, 1, 1);
  console.log(`    • insertRowAfter(1, 1) 结果:`, insRes);
  assert.strictEqual(getSectionTopology(session, 1).rowCount, s1Topo.rowCount + 1);

  const delRes = deleteRow(session, 1, insRes.insertedRowIndex);
  console.log(`    • deleteRow(1, ${insRes.insertedRowIndex}) 结果:`, delRes);
  assert.strictEqual(getSectionTopology(session, 1).rowCount, s1Topo.rowCount);

  // 8. 测试 applyAdaptiveRuler & enforceFlushLeftValues
  console.log('\n--- 测试 8: applyAdaptiveRuler & enforceFlushLeftValues ---');
  const rulerRes = applyAdaptiveRuler(session, 9);
  console.log(`    • applyAdaptiveRuler(9) 结果:`, rulerRes);
  assert.ok(rulerRes.success);

  const flushRes = enforceFlushLeftValues(session, 9);
  console.log(`    • enforceFlushLeftValues(9) 结果:`, flushRes);
  assert.ok(flushRes.success);

  // 9. 测试 validateTopologicalInvariants
  console.log('\n--- 测试 9: validateTopologicalInvariants ---');
  const validRes = validateTopologicalInvariants(session, 9);
  console.log(`    • validateTopologicalInvariants(9): valid = ${validRes.valid}, violations = ${validRes.violationCount}`);
  assert.strictEqual(validRes.valid, true, 'Section 9 拓扑不变量应完全合规');

  // 10. 测试 saveSession
  console.log('\n--- 测试 10: saveSession ---');
  const outDocx = path.join(tmpDir, 'test_output_topo.docx');
  const saveRes = await saveSession(session, outDocx);
  console.log(`    • saveSession 结果:`, saveRes);
  assert.ok(fs.existsSync(outDocx), '保存的文件应当存在');

  console.log('\n🎉 所有 10 项拓扑变异与内省原语单元测试全部通过！');
}

runTopologicalPrimitivesTest().catch(err => {
  console.error('\n❌ 单元测试失败:', err);
  process.exit(1);
});
