import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';

async function testMcpTopologicalPrimitives() {
  console.log('========================================================================');
  console.log('  MCP 原生拓扑原语四层工具链与变异反欺诈单元测试 (REQ-01, REQ-04)  ');
  console.log('========================================================================\n');

  const mcpProcess = spawn('node', ['web/src/mcp-server.js'], {
    cwd: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine',
    stdio: ['pipe', 'pipe', 'inherit']
  });

  const rl = readline.createInterface({ input: mcpProcess.stdout });
  let nextReqId = 1;
  const pendingRequests = new Map();

  rl.on('line', (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve, reject } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    } catch (err) {
      console.error('Failed to parse line:', line);
    }
  });

  function send(method, params = {}) {
    const id = nextReqId++;
    return new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      mcpProcess.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  // 1. 初始化连接
  const initRes = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-topology-agent', version: '1.0.0' }
  });
  console.log('✅ [INIT] MCP 服务连接成功:', initRes.serverInfo.name, initRes.serverInfo.version);

  const tmpDir = path.join(os.tmpdir(), `mcp_topo_test_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // [TEST 1: 内省层] msds_get_section_topology
  console.log('\n[TEST 1] 内省层原语: msds_get_section_topology');
  const s1TopoRes = await send('tools/call', {
    name: 'msds_get_section_topology',
    arguments: {
      templateKey: 'CN_Guanzhi',
      sectionNumber: 1
    }
  });
  const s1Topo = JSON.parse(s1TopoRes.content[0].text);
  console.log(`  ↳ Section 1 拓扑: 行数=${s1Topo.rowCount}, 列数=${s1Topo.columnCount}, 布局=${s1Topo.layout}`);
  assert.ok(s1Topo.rowCount > 0, 'Section 1 行数必须 > 0');
  assert.strictEqual(s1Topo.columnCount, 2, 'Section 1 列数应为 2');
  console.log('  ✅ [PASS] 拓扑内省成功提取表格骨架');

  // [TEST 2: 变形层] msds_morph_section_topology
  console.log('\n[TEST 2] 变形层原语: msds_morph_section_topology (reshapeRows & morphToFullWidth)');
  const morphOutDocx = path.join(tmpDir, 'test_morphed.docx');
  const morphRes = await send('tools/call', {
    name: 'msds_morph_section_topology',
    arguments: {
      templateKey: 'CN_Guanzhi',
      outputPath: morphOutDocx,
      sectionNumber: 11,
      action: 'reshapeRows',
      params: { targetRowCount: 19 }
    }
  });
  const morphData = JSON.parse(morphRes.content[0].text);
  console.log(`  ↳ S11 行数重构至 19 行: success=${morphData.success}, 新行数=${morphData.topologyAfter.rowCount}`);
  assert.strictEqual(morphData.topologyAfter.rowCount, 19, 'S11 行数必须重构为 19 行');
  assert.ok(fs.existsSync(morphOutDocx), '形变产出文件必须物理存在');
  console.log('  ✅ [PASS] 拓扑变形原语成功重构网格');

  // [TEST 3: 排版层] msds_apply_typography_ruler
  console.log('\n[TEST 3] 排版标尺层原语: msds_apply_typography_ruler');
  const rulerOutDocx = path.join(tmpDir, 'test_ruler.docx');
  const rulerRes = await send('tools/call', {
    name: 'msds_apply_typography_ruler',
    arguments: {
      docxPath: morphOutDocx,
      outputPath: rulerOutDocx,
      sectionNumber: 9,
      rule: 'laserTabsSection9'
    }
  });
  const rulerData = JSON.parse(rulerRes.content[0].text);
  console.log(`  ↳ Section 9 激光标尺应用: success=${rulerData.success}, rule=${rulerData.appliedRule}`);
  assert.ok(rulerData.success, '激光标尺应用必须成功');
  console.log('  ✅ [PASS] 排版标尺硬锁成功投影');

  // [TEST 4: 事务安全与合规审计] msds_validate_topology_invariants
  console.log('\n[TEST 4] 事务审计层原语: msds_validate_topology_invariants');
  const valRes = await send('tools/call', {
    name: 'msds_validate_topology_invariants',
    arguments: {
      docxPath: rulerOutDocx,
      sectionNumber: 9
    }
  });
  const valData = JSON.parse(valRes.content[0].text);
  console.log(`  ↳ 物理不变量审计: passed=${valData.passed}, errors=${valData.errors?.length || 0}`);
  assert.ok(valData.passed, '合法形变后不变量必须全绿通过');
  console.log('  ✅ [PASS] 拓扑物理不变量验证通过');

  // [TEST 5: 万能操作批处理通道扩充] msds_execute_editor_ops
  console.log('\n[TEST 5] 万能编辑器操作批处理扩充 (增行/通栏/标尺组合)');
  const batchOutDocx = path.join(tmpDir, 'test_batch_ops.docx');
  const batchRes = await send('tools/call', {
    name: 'msds_execute_editor_ops',
    arguments: {
      templateKey: 'CN_Guanzhi',
      outputPath: batchOutDocx,
      operations: [
        { op: 'morphToFullWidth', sectionNumber: 2, rowIndex: 0, content: '根据GHS不属于危险物' },
        { op: 'insertRowAfter', sectionNumber: 3, rowIndex: 2 },
        { op: 'applyAdaptiveRuler', sectionNumber: 8 },
        { op: 'enforceFlushLeftValues', sectionNumber: 8 },
        { op: 'validateInvariants', sectionNumber: 8 }
      ]
    }
  });
  const batchData = JSON.parse(batchRes.content[0].text);
  console.log(`  ↳ 批处理操作执行: success=${batchData.success}, applied=${batchData.operationsApplied}`);
  assert.strictEqual(batchData.operationsApplied, 5, '必须成功应用 5 项组合操作');
  console.log('  ✅ [PASS] 拓扑原子操作批处理通道验证通过');

  // [TEST 6: 变异反欺诈与错误熔断断言]
  console.log('\n[TEST 6] 变异反欺诈门禁: 传入非法动作拒绝验证');
  let mutationCaught = false;
  try {
    await send('tools/call', {
      name: 'msds_morph_section_topology',
      arguments: {
        templateKey: 'CN_Guanzhi',
        outputPath: path.join(tmpDir, 'invalid.docx'),
        sectionNumber: 2,
        action: 'illegal_unknown_action'
      }
    });
  } catch (err) {
    mutationCaught = true;
    console.log(`  ↳ 成功拦截变异非法操作: ${err.message}`);
  }
  assert.ok(mutationCaught, '变异非法操作必须被严格拦截并熔断');
  console.log('  ✅ [PASS] 变异反欺诈熔断验证通过');

  // 清理
  mcpProcess.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  console.log('\n========================================================================');
  console.log('🏆 [ALL TESTS PASSED] 拓扑编辑器 Agent 原生 MCP 四层原语测试全部满分通过！');
  console.log('========================================================================\n');
  process.exit(0);
}

testMcpTopologicalPrimitives().catch(err => {
  console.error('测试异常中断:', err);
  process.exit(1);
});
