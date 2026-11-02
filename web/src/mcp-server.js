import fs from 'fs';
import path from 'path';
import readline from 'readline';

// 拦截普通日志输出至 stderr，确保 stdout 仅用于纯净的 MCP JSON-RPC 报文交互
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => process.stderr.write(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n');
console.error = (...args) => process.stderr.write(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n');

import { recognizeSourceDocx } from './recognition-engine.js';
import {
  createWorkSession,
  saveSession,
  clearTemplateValues,
  writeCellValueToSession,
  writeRichTextToSession,
  writeFullWidthSection,
  formatSection9LaserTabs,
  registerCustomTemplate,
  inspectTemplateSchema,
  deleteColumnFromSession,
  mergeCellsInSession,
  insertRowIntoSession,
  deleteRowFromSession,
  peekCellInSession,
  peekRowInSession,
  createCheckpoint,
  rollbackSession
} from './template-editor.js';
import { planAuditTargets, verifyAuditContract } from './audit-planner.js';

const TOOLS = [
  {
    name: 'msds_recognize_source',
    description: '解析输入的 MSDS Word (.docx) 源文件，提取 16 章节全部未分类的原始化学事实、GHS分类、CAS组分、理化及毒理数据。',
    inputSchema: {
      type: 'object',
      properties: {
        sourceFilePath: {
          type: 'string',
          description: '待识别解析的 MSDS Word 源文件完整绝对路径。'
        }
      },
      required: ['sourceFilePath']
    }
  },
  {
    name: 'msds_extract_section_facts',
    description: '针对源 DOCX 文件的特定章节（1~16）进行细粒度下钻提取，返回该章节的专属语义事实、结构形态（TWO_COLUMN/FULL_WIDTH/MULTI_COLUMN）与排版样式。',
    inputSchema: {
      type: 'object',
      properties: {
        sourceFilePath: {
          type: 'string',
          description: '源 DOCX 文件绝对路径'
        },
        sectionNumber: {
          type: 'number',
          description: '章节编号 (1~16)'
        }
      },
      required: ['sourceFilePath', 'sectionNumber']
    }
  },
  {
    name: 'msds_compare_source_with_output',
    description: '源文档与产出文档的 1:1 事实物理对账：逐章节校验字符保全度、漏识漏填项与结构形变，输出正向行动诊断报告。',
    inputSchema: {
      type: 'object',
      properties: {
        sourceFilePath: {
          type: 'string',
          description: '原始输入源 DOCX 文件绝对路径'
        },
        outputFilePath: {
          type: 'string',
          description: '编辑生成的产出 DOCX 文件绝对路径'
        }
      },
      required: ['sourceFilePath', 'outputFilePath']
    }
  },
  {
    name: 'msds_register_template',
    description: '动态上传并注册新的自定义 MSDS Word 模板，自动解析其 16 章节分布与网格拓扑 (tblGrid)，构建万能编辑通道。',
    inputSchema: {
      type: 'object',
      properties: {
        templateFilePath: {
          type: 'string',
          description: '待注册的自定义模板 DOCX 完整绝对路径'
        },
        templateKey: {
          type: 'string',
          description: '用户指定的模板唯一标识 key'
        },
        language: {
          type: 'string',
          enum: ['zh', 'en'],
          description: '模板语言类型'
        },
        company: {
          type: 'string',
          description: '所属主体公司 (如 guanzhi, guocai)'
        }
      },
      required: ['templateFilePath', 'templateKey', 'language']
    }
  },
  {
    name: 'msds_get_template_schema',
    description: '获取指定模板的 16 章节拓扑架构 Schema，包含各节的表格行列数、列宽坐标 (tblGrid) 与单元格角色分布。',
    inputSchema: {
      type: 'object',
      properties: {
        templateKey: {
          type: 'string',
          description: '模板标识符 (支持官方母版或已注册的自定义模板)'
        }
      },
      required: ['templateKey']
    }
  },
  {
    name: 'msds_peek_cell_or_row',
    description: '触觉透视指定模板在特定章节和行列的单元格物理属性（文本、粗体、列数、gridSpan跨度等）。',
    inputSchema: {
      type: 'object',
      properties: {
        templateKey: {
          type: 'string',
          description: '模板唯一标识'
        },
        sectionNumber: {
          type: 'number',
          description: '章节编号 (1~16)'
        },
        rowIndex: {
          type: 'number',
          description: '行索引 (从 0 开始)'
        },
        cellIndex: {
          type: 'number',
          description: '可选的单元格列索引 (从 0 开始)。若未提供，返回整行所有列的透视信息'
        }
      },
      required: ['templateKey', 'sectionNumber', 'rowIndex']
    }
  },
  {
    name: 'msds_plan_audit_targets',
    description: '在动工编辑前执行 ADD (Audit-Driven by Design) 规划，依据全局规范（G-01~G-40）与局部专属规范生成不可篡改的终审审计目标清单契约。',
    inputSchema: {
      type: 'object',
      properties: {
        modelCode: {
          type: 'string',
          description: '产品型号编码 (如 PU-218A, PU-202A, PA-3223)'
        },
        sourceFacts: {
          type: 'object',
          description: '由 msds_recognize_source 识别输出的事实对象'
        }
      },
      required: ['modelCode']
    }
  },
  {
    name: 'msds_execute_editor_ops',
    description: '通过万能编辑器操作通道执行一组原子操作：删列 (deleteColumn)、合并格 (mergeCells)、增行 (insertRow)、删行 (deleteRow)、写富文本 (writeRichText)、写值格 (writeCell)、通栏排版与激光垂线对齐，并导出合规 DOCX。自带事务检查点与失败自动回滚自愈。',
    inputSchema: {
      type: 'object',
      properties: {
        templateKey: {
          type: 'string',
          description: '母版标识 (支持内置母版或已注册的 custom key)'
        },
        outputPath: {
          type: 'string',
          description: '产出的目标 DOCX 文件完整绝对路径'
        },
        operations: {
          type: 'array',
          description: '有序原子操作列表',
          items: {
            type: 'object',
            properties: {
              op: {
                type: 'string',
                enum: [
                  'clearTemplate',
                  'writeCell',
                  'writeRichText',
                  'writeFullWidth',
                  'formatLaserTabs',
                  'deleteRow',
                  'deleteColumn',
                  'mergeCells',
                  'insertRow',
                  'checkpoint',
                  'rollback'
                ]
              },
              sectionNumber: { type: 'number' },
              rowIndex: { type: 'number' },
              cellIndex: { type: 'number' },
              colIndex: { type: 'number' },
              colStart: { type: 'number' },
              colSpan: { type: 'number' },
              targetRowIndex: { type: 'number' },
              cloneFromRowIndex: { type: 'number' },
              text: { type: 'string' },
              content: { type: 'string' },
              chemicalFormula: { type: 'string' },
              runs: { type: 'array' },
              checkpointId: { type: 'string' }
            },
            required: ['op']
          }
        }
      },
      required: ['templateKey', 'outputPath', 'operations']
    }
  },
  {
    name: 'msds_batch_export_eight',
    description: '通过 MSDS-Engine 批量受控流水线，驱动生成中英双语（CN/EN）与双主体（冠志/国彩）全量标准 8 格式正式交付物（4 DOCX + 4 高清 PDF）。',
    inputSchema: {
      type: 'object',
      properties: {
        modelCode: {
          type: 'string',
          description: '产品型号编码 (如 PU-218A)'
        },
        sourceFilePath: {
          type: 'string',
          description: '输入源文件绝对路径'
        },
        targetDir: {
          type: 'string',
          description: '正式交付物输出专有目录绝对路径'
        }
      },
      required: ['modelCode', 'sourceFilePath', 'targetDir']
    }
  },
  {
    name: 'msds_audit_deliverables',
    description: '对指定目录内的交付物执行双极双层全景机械深度终审（覆盖纯净度 G-01、物理新鲜度 G-36、字号 G-37、激光对齐 G-38、OPC 完备性 G-39 及 16 章节局部规范）。',
    inputSchema: {
      type: 'object',
      properties: {
        targetDir: {
          type: 'string',
          description: '待审计的交付目录绝对路径'
        },
        modelCode: {
          type: 'string',
          description: '产品型号编码'
        }
      },
      required: ['targetDir', 'modelCode']
    }
  }
];

async function handleToolCall(name, args) {
  if (name === 'msds_recognize_source') {
    const filePath = args.sourceFilePath;
    if (!fs.existsSync(filePath)) throw new Error(`Source file not found: ${filePath}`);
    const buf = fs.readFileSync(filePath);
    return await recognizeSourceDocx(buf, path.basename(filePath));
  }

  if (name === 'msds_extract_section_facts') {
    const filePath = args.sourceFilePath;
    const secNum = Number(args.sectionNumber);
    if (!fs.existsSync(filePath)) throw new Error(`Source file not found: ${filePath}`);
    const buf = fs.readFileSync(filePath);
    const facts = await recognizeSourceDocx(buf, path.basename(filePath));
    const secFacts = facts.sections[secNum];
    if (!secFacts) throw new Error(`Section ${secNum} not found in source facts`);

    // 附带该章节专有的结构化提取语义
    let specificSemantic = null;
    switch (secNum) {
      case 1: specificSemantic = { modelCode: facts.modelCode, productName: facts.productName }; break;
      case 2: specificSemantic = facts.ghs; break;
      case 3: specificSemantic = facts.components; break;
      case 4: specificSemantic = facts.firstAid; break;
      case 5: specificSemantic = facts.fireFighting; break;
      case 6: specificSemantic = facts.accidentalRelease; break;
      case 7: specificSemantic = facts.handlingStorage; break;
      case 8: specificSemantic = facts.exposureControls; break;
      case 9: specificSemantic = facts.physicalProperties; break;
      case 10: specificSemantic = facts.stabilityReactivity; break;
      case 11: specificSemantic = facts.toxicology; break;
      case 12: specificSemantic = facts.ecology; break;
      case 13: specificSemantic = facts.disposal; break;
      case 14: specificSemantic = facts.transport; break;
      case 15: specificSemantic = facts.regulations; break;
      case 16: specificSemantic = facts.otherInfo; break;
    }

    return {
      sectionNumber: secNum,
      title: secFacts.title,
      rowsCount: secFacts.rowsCount,
      structureSummary: secFacts.structureSummary,
      rows: secFacts.rows,
      semantic: specificSemantic
    };
  }

  if (name === 'msds_compare_source_with_output') {
    const srcPath = args.sourceFilePath;
    const outPath = args.outputFilePath;
    if (!fs.existsSync(srcPath)) throw new Error(`Source not found: ${srcPath}`);
    if (!fs.existsSync(outPath)) throw new Error(`Output not found: ${outPath}`);

    const srcFacts = await recognizeSourceDocx(srcPath, path.basename(srcPath));
    const outFacts = await recognizeSourceDocx(outPath, path.basename(outPath));

    let srcChars = 0;
    let outChars = 0;
    const sectionDiffs = [];
    const actionableGaps = [];

    for (let s = 1; s <= 16; s++) {
      const sSec = srcFacts.sections[s];
      const oSec = outFacts.sections[s];
      const sText = (sSec?.rows || []).flatMap(r => r.cells.map(c => c.text)).join('').replace(/\s+/g, '');
      const oText = (oSec?.rows || []).flatMap(r => r.cells.map(c => c.text)).join('').replace(/\s+/g, '');

      srcChars += sText.length;
      outChars += oText.length;

      const isIdentical = sText.length === oText.length;
      sectionDiffs.push({
        sectionNumber: s,
        sourceRows: sSec?.rowsCount || 0,
        outputRows: oSec?.rowsCount || 0,
        sourceCharCount: sText.length,
        outputCharCount: oText.length,
        isIdenticalLength: isIdentical
      });

      // 智能行动差距诊断 (Actionable Gap Analysis)
      if (sText.length > 50 && oText.length < 20) {
        actionableGaps.push({
          sectionNumber: s,
          type: 'MISSING_CONTENT',
          detail: `第 ${s} 节源事实包含 ${sText.length} 字，产出文档仅有 ${oText.length} 字，疑似发生事实丢失`,
          suggestedAction: s === 2 ? '执行 Recipe B/通栏合并 (writeFullWidth) 补齐防范规程' : '使用 writeCell/writeRichText 补填内容'
        });
      } else if (s === 3 && Math.abs((sSec?.rowsCount || 0) - (oSec?.rowsCount || 0)) > 2) {
        actionableGaps.push({
          sectionNumber: 3,
          type: 'COMPONENT_COUNT_MISMATCH',
          detail: `第 3 节组分行数不匹配: 源文件 ${sSec?.rowsCount || 0} 行 vs 产出物 ${oSec?.rowsCount || 0} 行`,
          suggestedAction: '执行 Recipe B (insertRow/deleteRow) 动态平衡组分行数'
        });
      }
    }

    const fidelityRatio = srcChars > 0 ? ((outChars / srcChars) * 100).toFixed(1) + '%' : '100%';
    return {
      sourceFilePath: srcPath,
      outputFilePath: outPath,
      sourceTotalChars: srcChars,
      outputTotalChars: outChars,
      fidelityRatio,
      sections: sectionDiffs,
      actionableGaps
    };
  }

  if (name === 'msds_register_template') {
    return await registerCustomTemplate(args.templateFilePath, {
      key: args.templateKey,
      language: args.language,
      company: args.company
    });
  }

  if (name === 'msds_get_template_schema') {
    return await inspectTemplateSchema(args.templateKey);
  }

  if (name === 'msds_peek_cell_or_row') {
    const session = await createWorkSession(args.templateKey);
    if (args.cellIndex !== undefined) {
      return peekCellInSession(session, {
        sectionNumber: args.sectionNumber,
        rowIndex: args.rowIndex,
        cellIndex: args.cellIndex
      });
    } else {
      return peekRowInSession(session, {
        sectionNumber: args.sectionNumber,
        rowIndex: args.rowIndex
      });
    }
  }

  if (name === 'msds_plan_audit_targets') {
    return planAuditTargets(args.modelCode, args.sourceFacts || {});
  }

  if (name === 'msds_execute_editor_ops') {
    const session = await createWorkSession(args.templateKey);
    const initialCheckpointId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await createCheckpoint(session, initialCheckpointId);

    try {
      for (const op of args.operations || []) {
        if (op.op === 'clearTemplate') {
          clearTemplateValues(session);
        } else if (op.op === 'writeCell') {
          writeCellValueToSession(session, {
            sectionNumber: op.sectionNumber,
            rowIndex: op.rowIndex,
            cellIndex: op.cellIndex,
            text: op.text || ''
          });
        } else if (op.op === 'writeRichText') {
          writeRichTextToSession(session, {
            sectionNumber: op.sectionNumber,
            rowIndex: op.rowIndex,
            cellIndex: op.cellIndex,
            runs: op.runs,
            chemicalFormula: op.chemicalFormula
          });
        } else if (op.op === 'writeFullWidth') {
          writeFullWidthSection(session, {
            sectionNumber: op.sectionNumber,
            content: op.content || op.text || ''
          });
        } else if (op.op === 'formatLaserTabs') {
          formatSection9LaserTabs(session);
        } else if (op.op === 'deleteRow') {
          deleteRowFromSession(session, {
            sectionNumber: op.sectionNumber,
            rowIndex: op.rowIndex
          });
        } else if (op.op === 'deleteColumn') {
          deleteColumnFromSession(session, {
            sectionNumber: op.sectionNumber,
            colIndex: op.colIndex
          });
        } else if (op.op === 'mergeCells') {
          mergeCellsInSession(session, {
            sectionNumber: op.sectionNumber,
            rowIndex: op.rowIndex,
            colStart: op.colStart,
            colSpan: op.colSpan
          });
        } else if (op.op === 'insertRow') {
          insertRowIntoSession(session, {
            sectionNumber: op.sectionNumber,
            targetRowIndex: op.targetRowIndex || op.rowIndex,
            cloneFromRowIndex: op.cloneFromRowIndex
          });
        } else if (op.op === 'checkpoint') {
          await createCheckpoint(session, op.checkpointId || 'default');
        } else if (op.op === 'rollback') {
          await rollbackSession(session, op.checkpointId || 'default');
        }
      }

      const saveRes = await saveSession(session, args.outputPath);
      return {
        success: true,
        outputPath: saveRes.outputPath,
        sizeBytes: saveRes.sizeBytes,
        operationsApplied: args.operations?.length || 0
      };
    } catch (err) {
      // 事务自动回滚，恢复初始干净母版
      await rollbackSession(session, initialCheckpointId);
      // 若生成了中间损坏文件，彻底销毁清理
      if (fs.existsSync(args.outputPath)) {
        try { fs.unlinkSync(args.outputPath); } catch (_) {}
      }
      throw new Error(`[MCP Transaction Auto-Rollback] 操作执行异常已自动回滚并销毁半成品: ${err.message}`);
    }
  }

  if (name === 'msds_batch_export_eight') {
    const { runPipelineEight, executeEightDeliverablesPipeline } = await import('./pipeline-engine.js');
    const runner = runPipelineEight || executeEightDeliverablesPipeline;
    const result = await runner({
      modelCode: args.modelCode,
      cnGroundTruthPath: args.sourceFilePath || args.sourcePath,
      sourcePath: args.sourceFilePath || args.sourcePath,
      targetDir: args.targetDir
    });
    return result;
  }

  if (name === 'msds_audit_deliverables') {
    const contract = planAuditTargets(args.modelCode, {});
    const auditRes = verifyAuditContract(args.targetDir, contract);
    return auditRes;
  }

  throw new Error(`Tool not found: ${name}`);
}

async function startServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  process.stderr.write('[MCP READY] MSDS-Engine MCP Server v2.1.0 running on stdio.\n');

  rl.on('line', async (line) => {
    line = line.trim();
    if (!line) return;

    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;

      if (method === 'initialize') {
        const resp = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false }
            },
            serverInfo: {
              name: 'msds-engine-mcp',
              version: '2.1.0'
            }
          }
        };
        originalStdoutWrite(JSON.stringify(resp) + '\n');
        return;
      }

      if (method === 'notifications/initialized') {
        return;
      }

      if (method === 'tools/list') {
        const resp = {
          jsonrpc: '2.0',
          id,
          result: {
            tools: TOOLS
          }
        };
        originalStdoutWrite(JSON.stringify(resp) + '\n');
        return;
      }

      if (method === 'tools/call') {
        try {
          const res = await handleToolCall(params.name, params.arguments || {});
          const resp = {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(res, null, 2)
                }
              ]
            }
          };
          originalStdoutWrite(JSON.stringify(resp) + '\n');
        } catch (toolErr) {
          const resp = {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: toolErr.message || String(toolErr)
            }
          };
          originalStdoutWrite(JSON.stringify(resp) + '\n');
        }
        return;
      }

      if (id !== undefined) {
        originalStdoutWrite(JSON.stringify({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        }) + '\n');
      }
    } catch (parseErr) {
      process.stderr.write(`[MCP-ERR] Invalid JSON on stdin: ${parseErr.message}\n`);
    }
  });
}

startServer();
