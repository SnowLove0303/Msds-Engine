import { spawn } from 'child_process';
import readline from 'readline';

async function testMcpUniversalEditor() {
  console.log('=== MCP 服务端万能编辑器工具链端到端实测 ===\n');

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

  // 1. 初始化
  const initRes = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-agent', version: '2.0.0' }
  });
  console.log('✅ MCP Initialize PASS: Server =', initRes.serverInfo.name, initRes.serverInfo.version);

  // 2. 工具列表查询
  const toolsRes = await send('tools/list');
  const toolNames = toolsRes.tools.map(t => t.name);
  console.log('✅ Tools List PASS: Total tools =', toolNames.length, 'Tools =', toolNames.join(', '));
  if (!toolNames.includes('msds_register_template') || !toolNames.includes('msds_peek_cell_or_row')) {
    throw new Error('Missing new MCP tools');
  }

  // 3. 动态注册新模板
  const sampleTpl = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
  const regRes = await send('tools/call', {
    name: 'msds_register_template',
    arguments: {
      templateFilePath: sampleTpl,
      templateKey: 'mcp_registered_test_tpl',
      language: 'zh'
    }
  });
  const regData = JSON.parse(regRes.content[0].text);
  console.log('✅ msds_register_template PASS: Key =', regData.templateKey, 'Sections =', Object.keys(regData.schema.sections).length);

  // 4. 触觉透视查询 (Peek)
  const peekRes = await send('tools/call', {
    name: 'msds_peek_cell_or_row',
    arguments: {
      templateKey: 'mcp_registered_test_tpl',
      sectionNumber: 3,
      rowIndex: 3
    }
  });
  const peekData = JSON.parse(peekRes.content[0].text);
  console.log('✅ msds_peek_cell_or_row PASS: Row 3 cells count =', peekData.cellsCount, 'Text =', peekData.cellsText);

  // 5. 执行万能编辑器操作序列 (包括删列、合并、写入富文本)
  const outDocx = 'C:/Users/ADMINI~1/AppData/Local/Temp/mcp_universal_editor_test.docx';
  const opsRes = await send('tools/call', {
    name: 'msds_execute_editor_ops',
    arguments: {
      templateKey: 'mcp_registered_test_tpl',
      outputPath: outDocx,
      operations: [
        { op: 'deleteColumn', sectionNumber: 3, colIndex: 1 },
        { op: 'mergeCells', sectionNumber: 3, rowIndex: 3, colStart: 0, colSpan: 2 },
        { op: 'writeRichText', sectionNumber: 3, rowIndex: 3, cellIndex: 0, chemicalFormula: 'H2SO4' }
      ]
    }
  });
  const opsData = JSON.parse(opsRes.content[0].text);
  console.log('✅ msds_execute_editor_ops PASS: Output =', opsData.outputPath, 'Size =', opsData.sizeBytes);

  mcpProcess.kill();
  console.log('\n🎉 原生 MCP 服务端万能编辑器工具链 100% 满分实测通过 (Exit Code 0)！');
  process.exit(0);
}

testMcpUniversalEditor().catch(err => {
  console.error('❌ MCP Universal Editor Test FAILED:', err);
  process.exit(1);
});
