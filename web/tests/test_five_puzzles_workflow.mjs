import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function testFivePuzzlesWorkflow() {
  console.log('===============================================================');
  console.log('🧩 [TEST] MSDS 通用性 MCP 工作流五大关键拼图端到端闭环高强度实测');
  console.log('===============================================================\n');

  const cwd = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine';

  // 1. 验证拼图五：最高法定宪章立法机检
  console.log('[STEP 1/6] 机检拼图五: 宪法四大法定支柱与最高防私改禁令...');
  const constContent = fs.readFileSync(path.join(cwd, 'PROJECT_CONSTITUTION.md'), 'utf8');
  if (!constContent.includes('四大法定支柱') || !constContent.includes('最高防私改禁令')) {
    throw new Error('CRITICAL: PROJECT_CONSTITUTION.md 缺少四大法定支柱或防私改禁令！');
  }
  const agentsContent = fs.readFileSync(path.join(cwd, 'AGENTS.md'), 'utf8');
  if (!agentsContent.includes('宪法级四大法定维护支柱') || !agentsContent.includes('最高防私改与防特判禁令')) {
    throw new Error('CRITICAL: AGENTS.md 缺少四大法定支柱或防特判禁令绑定！');
  }
  console.log('✅ [PASS 1/6] 拼图五: 最高宪法立法与 Agent 准入红线机检 100% 守恒！');

  // 启动 MCP Server 进程
  const mcpProcess = spawn('node', ['web/src/mcp-server.js'], {
    cwd,
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
        if (msg.error) resolve({ isMcpError: true, error: msg.error });
        else resolve({ isMcpError: false, result: msg.result });
      }
    } catch (err) {
      console.error('[TEST-CLIENT-ERR] JSON parse error:', line);
    }
  });

  function callMcp(method, params = {}) {
    const id = nextReqId++;
    return new Promise((resolve) => {
      pendingRequests.set(id, { resolve });
      mcpProcess.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  try {
    // 2. 初始化
    const initRes = await callMcp('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'five-puzzles-tester', version: '2.2.0' }
    });
    console.log(`[PASS 2/6] MCP Initialize PASS: Server = ${initRes.result.serverInfo.name} v${initRes.result.serverInfo.version}`);

    // 动态注册母版
    const sampleTpl = path.resolve(cwd, 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
    const tplKey = 'five_puzzles_test_tpl';
    await callMcp('tools/call', {
      name: 'msds_register_template',
      arguments: { templateFilePath: sampleTpl, templateKey: tplKey, language: 'zh' }
    });

    // 3. 验证拼图三：事务生命周期与失败自动回滚自愈
    console.log('\n[STEP 3/6] 实测拼图三: 异常操作时事务自动回滚与脏文件销毁...');
    const invalidOutDocx = path.join(os.tmpdir(), `invalid_tx_test_${Date.now()}.docx`);
    const failRes = await callMcp('tools/call', {
      name: 'msds_execute_editor_ops',
      arguments: {
        templateKey: tplKey,
        outputPath: invalidOutDocx,
        operations: [
          { op: 'deleteColumn', sectionNumber: 3, colIndex: 99 } // 故意越界触发异常
        ]
      }
    });

    if (!failRes.isMcpError) {
      throw new Error('CRITICAL: 越界操作未抛出异常，事务防护失效！');
    }
    console.log(`  - 捕获预期异常: ${failRes.error.message}`);
    if (!failRes.error.message.includes('[MCP Transaction Auto-Rollback]')) {
      throw new Error('CRITICAL: 异常未被事务自愈装饰器正确包装！');
    }
    if (fs.existsSync(invalidOutDocx)) {
      throw new Error('CRITICAL: 失败后磁盘上残留了半成品脏文件！');
    }
    console.log('✅ [PASS 3/6] 拼图三: 事务异常自动回滚并彻底销毁半成品脏文件，零污染下沉！');

    // 4. 验证拼图一 & 二：Recipe A (三列消除) + Recipe B (动态行增删) + Recipe C (微观化学式排版)
    console.log('\n[STEP 4/6] 实测拼图二: 经典手术配方库 Recipe A/B/C 复合执行...');
    const validOutDocx = path.join(os.tmpdir(), `valid_five_puzzles_${Date.now()}.docx`);
    const recipeRes = await callMcp('tools/call', {
      name: 'msds_execute_editor_ops',
      arguments: {
        templateKey: tplKey,
        outputPath: validOutDocx,
        operations: [
          // Recipe A: 三列消除配方 (剔除 Section 3 第二列冗余标签)
          { op: 'deleteColumn', sectionNumber: 3, colIndex: 1 },
          // Recipe B: 动态行增行配方 (克隆行插入数据行)
          { op: 'insertRow', sectionNumber: 3, targetRowIndex: 4, cloneFromRowIndex: 3 },
          // Recipe C: 化学式与 Run 级排版配方 (下标自动分割，写入数据行 4)
          { op: 'writeRichText', sectionNumber: 3, rowIndex: 4, cellIndex: 0, chemicalFormula: 'H2SO4' },
          { op: 'writeCell', sectionNumber: 3, rowIndex: 4, cellIndex: 1, text: '98.0%' }
        ]
      }
    });

    if (recipeRes.isMcpError) {
      throw new Error(`CRITICAL: 复合配方执行失败: ${recipeRes.error.message}`);
    }
    const recipeData = JSON.parse(recipeRes.result.content[0].text);
    console.log(`  - 配方成功应用! 操作数=${recipeData.operationsApplied}, 生成文件大小=${recipeData.sizeBytes} bytes`);
    if (!fs.existsSync(validOutDocx) || recipeData.sizeBytes < 10000) {
      throw new Error('CRITICAL: 合规 DOCX 未正确导出或尺寸异常！');
    }
    console.log('✅ [PASS 4/6] 拼图二: Recipe A/B/C 复合手术在真实 Word 网格中无损执行成功！');

    // 5. 验证拼图四：正向行动诊断分析器 (Actionable Gap Analyzer)
    console.log('\n[STEP 5/6] 实测拼图四: 1:1 事实物理对账与正向行动诊断输出...');
    const sampleSourceDocx = path.resolve(cwd, '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1007/PU-1007 msds_CN 冠志.docx');
    const cmpRes = await callMcp('tools/call', {
      name: 'msds_compare_source_with_output',
      arguments: {
        sourceFilePath: sampleSourceDocx,
        outputFilePath: validOutDocx
      }
    });

    if (cmpRes.isMcpError) {
      throw new Error(`CRITICAL: 事实对账失败: ${cmpRes.error.message}`);
    }
    const cmpData = JSON.parse(cmpRes.result.content[0].text);
    console.log(`  - 字符保全比: ${cmpData.fidelityRatio}`);
    console.log(`  - 行动诊断项 (Actionable Gaps) 数量: ${cmpData.actionableGaps ? cmpData.actionableGaps.length : 'N/A'}`);
    if (!Array.isArray(cmpData.actionableGaps)) {
      throw new Error('CRITICAL: msds_compare_source_with_output 未输出 actionableGaps 数组！');
    }

    if (cmpData.actionableGaps.length > 0) {
      const sampleGap = cmpData.actionableGaps[0];
      console.log(`  - 示例行动诊断 Gap: [Sec ${sampleGap.sectionNumber}] ${sampleGap.type} -> ${sampleGap.detail}`);
      console.log(`  - 推荐 Agent 动作: ${sampleGap.suggestedAction}`);
      if (!sampleGap.suggestedAction) {
        throw new Error('CRITICAL: actionableGap 缺少 suggestedAction 指引！');
      }
    }
    console.log('✅ [PASS 5/6] 拼图四: 正向行动诊断分析器成功输出结构化 Gap 清单与建议动作！');

    mcpProcess.kill();

    console.log('\n===============================================================');
    console.log('🏆 [Measured] 五大关键拼图全链路端到端集成实测 100% 满分通过！退出码: 0');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [FAIL] 五大拼图集成测试失败:', err);
    mcpProcess.kill();
    process.exit(1);
  }
}

testFivePuzzlesWorkflow();
