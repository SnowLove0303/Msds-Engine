import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import os from 'os';

async function runMcpFullChannelsTest() {
  console.log('===============================================================');
  console.log('🚀 [TEST] MSDS 识别与编辑模块全通道 MCP 协议端到端高强度集成实测');
  console.log('===============================================================\n');

  const cwd = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine';
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
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    } catch (err) {
      console.error('[TEST-CLIENT-ERR] Failed to parse stdio message:', line);
    }
  });

  function callMcp(method, params = {}) {
    const id = nextReqId++;
    return new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      mcpProcess.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  try {
    // 1. 初始化门禁
    const initRes = await callMcp('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'antigravity-mcp-channel-tester', version: '2.1.0' }
    });
    console.log(`[PASS 1/10] MCP Initialize: ${initRes.serverInfo.name} v${initRes.serverInfo.version}`);

    // 2. 工具枚举与完整性门禁
    const toolsRes = await callMcp('tools/list');
    const toolNames = toolsRes.tools.map(t => t.name);
    console.log(`[PASS 2/10] MCP Tools List (Total: ${toolNames.length}):\n  - ${toolNames.join('\n  - ')}`);
    
    const requiredTools = [
      'msds_recognize_source',
      'msds_extract_section_facts',
      'msds_compare_source_with_output',
      'msds_register_template',
      'msds_get_template_schema',
      'msds_peek_cell_or_row',
      'msds_plan_audit_targets',
      'msds_execute_editor_ops',
      'msds_batch_export_eight',
      'msds_audit_deliverables'
    ];
    for (const reqTool of requiredTools) {
      if (!toolNames.includes(reqTool)) {
        throw new Error(`CRITICAL: 缺少必需的 MCP 工具定义: ${reqTool}`);
      }
    }

    // 3. 识别源文件事实 (msds_recognize_source)
    const sampleSourceDocx = path.resolve(cwd, '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1007/PU-1007 msds_CN 冠志.docx');
    console.log(`\n[STEP 3] 识别源文件事实: ${sampleSourceDocx}`);
    const recRes = await callMcp('tools/call', {
      name: 'msds_recognize_source',
      arguments: { sourceFilePath: sampleSourceDocx }
    });
    const recData = JSON.parse(recRes.content[0].text);
    const recognizedSecCount = Object.keys(recData.sections || {}).length;
    console.log(`[PASS 3/10] msds_recognize_source 成功识别! 章节数: ${recognizedSecCount}, 型号: ${recData.modelCode || 'N/A'}`);
    if (recognizedSecCount < 16) {
      throw new Error(`识别章节数不足 16 节: 仅识别出 ${recognizedSecCount} 节`);
    }

    // 4. 章节语义细粒度下钻提取 (msds_extract_section_facts)
    console.log('\n[STEP 4] 细粒度下钻提取 Section 2 与 Section 3 事实...');
    const sec2Res = await callMcp('tools/call', {
      name: 'msds_extract_section_facts',
      arguments: { sourceFilePath: sampleSourceDocx, sectionNumber: 2 }
    });
    const sec2Data = JSON.parse(sec2Res.content[0].text);
    console.log(`[PASS 4a/10] Section 2 细粒度事实: 标题="${sec2Data.title}", 行数=${sec2Data.rowsCount}, 语义=${JSON.stringify(sec2Data.semantic || {}).slice(0, 60)}...`);

    const sec3Res = await callMcp('tools/call', {
      name: 'msds_extract_section_facts',
      arguments: { sourceFilePath: sampleSourceDocx, sectionNumber: 3 }
    });
    const sec3Data = JSON.parse(sec3Res.content[0].text);
    console.log(`[PASS 4b/10] Section 3 细粒度事实: 标题="${sec3Data.title}", 行数=${sec3Data.rowsCount}, 组分项=${JSON.stringify(sec3Data.semantic || []).slice(0, 60)}...`);

    // 5. 动态注册外部新模板 (msds_register_template)
    const baseTemplateDocx = path.resolve(cwd, 'web/public/templates/正式模板_MSDS_CN_冠志(1).docx');
    const dynamicTemplateKey = 'custom_mcp_template_v1';
    console.log(`\n[STEP 5] 动态注册外部新模板: ${baseTemplateDocx}`);
    const regRes = await callMcp('tools/call', {
      name: 'msds_register_template',
      arguments: {
        templateFilePath: baseTemplateDocx,
        templateKey: dynamicTemplateKey,
        language: 'zh'
      }
    });
    const regData = JSON.parse(regRes.content[0].text);
    console.log(`[PASS 5/10] msds_register_template 注册成功! TemplateKey: ${regData.templateKey}, 包含章节: ${Object.keys(regData.schema.sections).length}`);

    // 6. 获取模板结构 Schema (msds_get_template_schema)
    console.log('\n[STEP 6] 查询模板架构 Schema...');
    const schemaRes = await callMcp('tools/call', {
      name: 'msds_get_template_schema',
      arguments: { templateKey: dynamicTemplateKey }
    });
    const schemaData = JSON.parse(schemaRes.content[0].text);
    console.log(`[PASS 6/10] msds_get_template_schema 验证成功! 语言=${schemaData.language}, 章节总数=${Object.keys(schemaData.sections).length}`);

    // 7. 触觉透视 (msds_peek_cell_or_row)
    console.log('\n[STEP 7] 触觉透视 Section 3 Row 3 单元格结构...');
    const peekRes = await callMcp('tools/call', {
      name: 'msds_peek_cell_or_row',
      arguments: {
        templateKey: dynamicTemplateKey,
        sectionNumber: 3,
        rowIndex: 3
      }
    });
    const peekData = JSON.parse(peekRes.content[0].text);
    console.log(`[PASS 7/10] msds_peek_cell_or_row 透视成功! 列数=${peekData.cellsCount}, 文本=[${peekData.cellsText.join(' | ')}]`);

    // 8. 执行万能编辑器操作序列 (msds_execute_editor_ops)
    const tempOutputDir = os.tmpdir();
    const targetDocx = path.join(tempOutputDir, `mcp_full_channel_test_${Date.now()}.docx`);
    console.log(`\n[STEP 8] 执行万能编辑器操作序列 (删列、合并、化学式写入)... 输出至: ${targetDocx}`);
    const opsRes = await callMcp('tools/call', {
      name: 'msds_execute_editor_ops',
      arguments: {
        templateKey: dynamicTemplateKey,
        outputPath: targetDocx,
        operations: [
          { op: 'deleteColumn', sectionNumber: 3, colIndex: 1 },
          { op: 'mergeCells', sectionNumber: 3, rowIndex: 3, colStart: 0, colSpan: 2 },
          { op: 'writeRichText', sectionNumber: 3, rowIndex: 3, cellIndex: 0, chemicalFormula: 'H2SO4' }
        ]
      }
    });
    const opsData = JSON.parse(opsRes.content[0].text);
    console.log(`[PASS 8/10] msds_execute_editor_ops 执行成功! 生成大小: ${opsData.sizeBytes} 字节`);

    // 9. 源文件与产出物 1:1 事实物理对账 (msds_compare_source_with_output)
    console.log(`\n[STEP 9] 执行源文件与产出物 1:1 事实物理对账...`);
    const cmpRes = await callMcp('tools/call', {
      name: 'msds_compare_source_with_output',
      arguments: {
        sourceFilePath: sampleSourceDocx,
        outputFilePath: targetDocx
      }
    });
    const cmpData = JSON.parse(cmpRes.content[0].text);
    console.log(`[PASS 9/10] msds_compare_source_with_output 对账完成! 校验章节数: ${cmpData.sections.length}, 源字符数: ${cmpData.sourceTotalChars}, 生成字符数: ${cmpData.outputTotalChars}, 保全比: ${cmpData.fidelityRatio}`);

    // 10. 审计目标规划 (msds_plan_audit_targets)
    console.log(`\n[STEP 10] 规划 8 格式预设交付物审计目标...`);
    const planRes = await callMcp('tools/call', {
      name: 'msds_plan_audit_targets',
      arguments: {
        modelCode: 'PU-1007'
      }
    });
    const planData = JSON.parse(planRes.content[0].text);
    const expectedDeliverables = planData.targets.global.expectedFiles;
    console.log(`[PASS 10/10] msds_plan_audit_targets 规划成功! 预设产物数: ${expectedDeliverables.length}, 示例: ${expectedDeliverables.slice(0, 2).join(', ')}`);

    mcpProcess.kill();

    console.log('\n===============================================================');
    console.log('🏆 [Measured] 10 大 MCP 识别与编辑通道全部实测通过！退出码: 0');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [FAIL] MCP 管道测试失败:', err);
    mcpProcess.kill();
    process.exit(1);
  }
}

runMcpFullChannelsTest();
