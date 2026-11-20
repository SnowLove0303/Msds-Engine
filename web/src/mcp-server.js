import fs from 'fs';
import path from 'path';
import readline from 'readline';

// 拦截普通日志输出至 stderr，确保 stdout 仅用于纯净的 MCP JSON-RPC 报文交互
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => process.stderr.write(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n');
console.error = (...args) => process.stderr.write(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n');

import { recognizeSourceDocx, serializeFactsToMarkdown } from './recognition-engine.js';
import { buildStructuredContext2, serializeContext2ToMarkdown, saveTranslationsToMemory } from './context-governor.js';
import {
  createWorkSession,
  saveSession,
  clearTemplateValues,
  clearSectionValuesInSession,
  restoreSectionInSession,
  applyCompanyPreset,
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
  rollbackSession,
  getSectionTopology,
  reshapeTableRows,
  morphToFullWidth,
  morphToMultiColumn,
  insertRowAfter,
  deleteRow,
  mergeCells,
  applyAdaptiveRuler,
  enforceFlushLeftValues,
  validateTopologicalInvariants
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
                  'clearSectionValues',
                  'restoreSection',
                  'applyPreset',
                  'writeCell',
                  'writeRichText',
                  'writeFullWidth',
                  'formatLaserTabs',
                  'deleteRow',
                  'deleteColumn',
                  'mergeCells',
                  'insertRow',
                  'insertRowAfter',
                  'reshapeRows',
                  'morphToFullWidth',
                  'morphToMultiColumn',
                  'applyAdaptiveRuler',
                  'enforceFlushLeftValues',
                  'validateInvariants',
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
              targetRowCount: { type: 'number' },
              rowIdx: { type: 'number' },
              colWidths: { type: 'array', items: { type: 'number' } },
              fromCol: { type: 'number' },
              toCol: { type: 'number' },
              rule: { type: 'string' },
              text: { type: 'string' },
              content: { type: 'string' },
              chemicalFormula: { type: 'string' },
              runs: { type: 'array' },
              checkpointId: { type: 'string' },
              presetKey: { type: 'string' }
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
    description: '通过 MSDS-Engine 7 阶标准受控生产流水线，驱动生成中英双语（CN/EN）与双主体（冠志/国彩）全量标准 8 格式正式交付物（4 DOCX + 4 高清 PDF），并执行两阶深度审计与用户目录自动同步。',
    inputSchema: {
      type: 'object',
      properties: {
        modelCode: {
          type: 'string',
          description: '产品型号编码 (如 OS-8970, PU-218A)'
        },
        sourceFilePath: {
          type: 'string',
          description: '输入源文件绝对路径'
        },
        targetDir: {
          type: 'string',
          description: '正式交付物输出专有目录绝对路径 (可选)'
        },
        userSyncDir: {
          type: 'string',
          description: '用户工作目录镜像同步路径 (可选)'
        },
        skipAudit: {
          type: 'boolean',
          description: '是否跳过两阶全景深度审计 (默认 false)'
        },
        skipUserSync: {
          type: 'boolean',
          description: '是否跳过用户工作目录同步 (默认 false)'
        },
        facts: {
          type: 'object',
          description: '附加治理事实或覆盖项 (可选)'
        }
      },
      required: ['modelCode', 'sourceFilePath']
    }
  },
  {
    name: 'msds_audit_deliverables',
    description: '对指定目录内的交付物执行 159 项集中式主审计与双极双层全景法医级深度终审（覆盖纯净度 G-01、物理新鲜度 G-36、字号 G-37、激光对齐 G-38、OPC 完备性 G-39 及 16 章节局部规范）。',
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
        },
        sourceFilePath: {
          type: 'string',
          description: '原始输入源文件路径 (用于 1:1 对账)'
        }
      },
      required: ['targetDir', 'modelCode']
    }
  },
  {
    name: 'msds_get_section_topology',
    description: '透视指定 MSDS 模板或 DOCX 文件的特定章节（1~16）的表格骨架拓扑指纹（总行数、列数、布局形态 TWO_COLUMN/FULL_WIDTH/MULTI_COLUMN、单元格跨列属性与文本快照）。',
    inputSchema: {
      type: 'object',
      properties: {
        templateKey: {
          type: 'string',
          description: '模板标识（如 CN_Guanzhi, EN_Guanzhi, CN_Guocai, EN_Guocai）'
        },
        docxPath: {
          type: 'string',
          description: '待透视的目标 DOCX 文件绝对路径（若提供则优先于 templateKey）'
        },
        sectionNumber: {
          type: 'number',
          description: '章节编号 (1~16)'
        }
      },
      required: ['sectionNumber']
    }
  },
  {
    name: 'msds_morph_section_topology',
    description: '对指定 MSDS 模板或 DOCX 文件的特定章节执行外科手术式拓扑形变操作（行数扩缩容 reshapeRows、大通栏单行重构 morphToFullWidth、多列拆分 morphToMultiColumn、插入行 insertRowAfter、删除行 deleteRow、合并单元格 mergeCells），并导出合规 DOCX。自带边框外实内虚保全。',
    inputSchema: {
      type: 'object',
      properties: {
        templateKey: {
          type: 'string',
          description: '母版标识（如 CN_Guanzhi 等）'
        },
        docxPath: {
          type: 'string',
          description: '输入源 DOCX 物理文件路径（若提供则优先于 templateKey）'
        },
        outputPath: {
          type: 'string',
          description: '产出的目标 DOCX 文件完整绝对路径'
        },
        sectionNumber: {
          type: 'number',
          description: '目标章节编号 (1~16)'
        },
        action: {
          type: 'string',
          enum: ['reshapeRows', 'morphToFullWidth', 'morphToMultiColumn', 'insertRowAfter', 'deleteRow', 'mergeCells'],
          description: '拓扑形变动作'
        },
        params: {
          type: 'object',
          description: '动作专属参数',
          properties: {
            targetRowCount: { type: 'number', description: 'reshapeRows 目标行数' },
            rowIdx: { type: 'number', description: '目标行索引（从 0 开始）' },
            content: { type: 'string', description: 'morphToFullWidth 单格内容' },
            colWidths: { type: 'array', items: { type: 'number' }, description: 'morphToMultiColumn 列宽定义' },
            fromCol: { type: 'number', description: 'mergeCells 起始列' },
            toCol: { type: 'number', description: 'mergeCells 终止列' },
            cloneFromRowIdx: { type: 'number', description: 'insertRowAfter 样式克隆源行索引' }
          }
        }
      },
      required: ['outputPath', 'sectionNumber', 'action']
    }
  },
  {
    name: 'msds_apply_typography_ruler',
    description: '对指定模板或 DOCX 文件施加排版几何标尺投影与对齐硬锁（根据章节最大序号位数自适应投影 Tier A 420dxa 或 Tier B 560dxa 标尺、投影 Section 9 80.28pt 黄金基准激光制表位、或多列表格值单元格顶格左对齐）。',
    inputSchema: {
      type: 'object',
      properties: {
        templateKey: { type: 'string' },
        docxPath: { type: 'string' },
        outputPath: { type: 'string', description: '产出的目标 DOCX 文件完整绝对路径' },
        sectionNumber: { type: 'number', description: '章节编号 (1~16)，留空或0表示全篇' },
        rule: {
          type: 'string',
          enum: ['adaptiveRuler', 'laserTabsSection9', 'flushLeftValues', 'allRules'],
          description: '需应用的排版规则'
        }
      },
      required: ['outputPath', 'rule']
    }
  },
  {
    name: 'msds_validate_topology_invariants',
    description: '对目标 DOCX 交付物执行底层 OOXML 拓扑物理不变量深度审计（外框实线 single 内框虚线 dotted、全文档零 <w:numPr> 列表定义残留、页脚零 w:firstLine="8730" 畸变缩进、跨页断行放开等）。',
    inputSchema: {
      type: 'object',
      properties: {
        docxPath: { type: 'string', description: '待审计的 DOCX 交付物绝对路径' },
        templateKey: { type: 'string' },
        sectionNumber: { type: 'number', description: '可选的特定章节编号 (1~16)' }
      }
    }
  },
  {
    name: 'msds_govern_context2',
    description: '工序二统一入口：基于 Context 1 事实（或指定源 DOCX）执行全局/局部规范标注重分类、序号剥离、跨节附注迁移、双语英译及编辑器调度意图生成，产出标准 Context 2 结构化资产。',
    inputSchema: {
      type: 'object',
      properties: {
        context1JsonPath: { type: 'string', description: '可选：Context 1 JSON 文件路径' },
        sourceFilePath: { type: 'string', description: '可选：若未传 context1JsonPath，则自动先识别源 DOCX 生成 Context 1 再治理为 Context 2' },
        translationsJsonPath: { type: 'string', description: '可选：Agent 逐句全量英译回填 JSON 文件路径' },
        translations: { type: 'object', description: '可选：Agent 逐句全量英译映射对象 { cnText: enText }' }
      }
    }
  }
];

async function handleToolCall(name, args) {
  if (name === 'msds_govern_context2') {
    let context1 = null;
    if (args.context1JsonPath && fs.existsSync(args.context1JsonPath)) {
      context1 = JSON.parse(fs.readFileSync(args.context1JsonPath, 'utf8'));
    } else if (args.sourceFilePath && fs.existsSync(args.sourceFilePath)) {
      const buf = fs.readFileSync(args.sourceFilePath);
      context1 = await recognizeSourceDocx(buf, path.basename(args.sourceFilePath));
    } else {
      throw new Error('必须提供有效的 context1JsonPath 或 sourceFilePath');
    }
    let translations = args.translations || null;
    if (!translations && args.translationsJsonPath && fs.existsSync(args.translationsJsonPath)) {
      translations = JSON.parse(fs.readFileSync(args.translationsJsonPath, 'utf8'));
    }
    const ctx2 = buildStructuredContext2(context1, { translations });
    let tmSaved = null;
    if (translations && ctx2.validation?.untranslatedCount === 0 && ctx2.validation?.numericMismatchCount === 0) {
      tmSaved = saveTranslationsToMemory(translations);
    }
    return {
      ...ctx2,
      tmSaved,
      context2Markdown: serializeContext2ToMarkdown(ctx2)
    };
  }

  if (name === 'msds_recognize_source') {
    const filePath = args.sourceFilePath;
    if (!fs.existsSync(filePath)) throw new Error(`Source file not found: ${filePath}`);
    const buf = fs.readFileSync(filePath);
    const facts = await recognizeSourceDocx(buf, path.basename(filePath));
    return {
      ...facts,
      context1Markdown: serializeFactsToMarkdown(facts)
    };
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

      // 智能行动差距与事实真伪诊断 (Actionable Gap & Factual Inconsistency Analysis)
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

      if (s === 11) {
        // 毒理学实测关键数值保全校验
        const srcNumbers = Array.from(sText.matchAll(/\d+(?:[.,]\d+)?(?:mg\/[kl]g?)?/gi)).map(m => m[0]);
        const missingNumbers = srcNumbers.filter(num => !oText.includes(num));
        if (missingNumbers.length > 0) {
          actionableGaps.push({
            sectionNumber: 11,
            type: 'FACTUAL_INCONSISTENCY',
            detail: `第 11 节关键实测数值丢失或被篡改: 缺失 [${missingNumbers.slice(0, 5).join(', ')}]`,
            suggestedAction: '检查 Section 11 排版逻辑，确保真实数值来自 applyMatchResultToEditor 提取的源数据而非写死常量'
          });
        }
        // 关键定性事实校验
        const criticalKeywords = ['造成皮肤刺激', '轻度的皮肤刺激', '严重的眼睛刺激', '轻度的眼睛刺激', '经皮吸收危险', '饮酒精饮料会加剧毒性影响'];
        for (const kw of criticalKeywords) {
          if (sText.includes(kw) && !oText.includes(kw)) {
            actionableGaps.push({
              sectionNumber: 11,
              type: 'FACTUAL_INCONSISTENCY',
              detail: `第 11 节关键定性结论“${kw}”在产出文档中缺失`,
              suggestedAction: '严禁硬编码常量覆盖源文件真实定性结论'
            });
          }
        }
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
        } else if (op.op === 'clearSectionValues') {
          clearSectionValuesInSession(session, { sectionNumber: op.sectionNumber });
        } else if (op.op === 'restoreSection') {
          await restoreSectionInSession(session, { sectionNumber: op.sectionNumber });
        } else if (op.op === 'applyPreset') {
          applyCompanyPreset(session, op.presetKey);
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
        } else if (op.op === 'insertRowAfter') {
          insertRowAfter(session, op.sectionNumber, op.rowIndex !== undefined ? op.rowIndex : (op.rowIdx || 0), op.cloneFromRowIndex);
        } else if (op.op === 'reshapeRows') {
          reshapeTableRows(session, op.sectionNumber, op.targetRowCount || op.rowCount || 2);
        } else if (op.op === 'morphToFullWidth') {
          morphToFullWidth(session, op.sectionNumber, op.rowIndex !== undefined ? op.rowIndex : (op.rowIdx || 0), op.content || op.text || '', op.options || {});
        } else if (op.op === 'morphToMultiColumn') {
          morphToMultiColumn(session, op.sectionNumber, op.rowIndex !== undefined ? op.rowIndex : (op.rowIdx || 0), op.colWidths || null, op.options || {});
        } else if (op.op === 'applyAdaptiveRuler') {
          applyAdaptiveRuler(session, op.sectionNumber);
        } else if (op.op === 'enforceFlushLeftValues') {
          enforceFlushLeftValues(session, op.sectionNumber);
        } else if (op.op === 'validateInvariants') {
          const invRes = validateTopologicalInvariants(session, op.sectionNumber);
          if (!invRes.valid) {
            const errs = (invRes.violations || []).map(v => v.message).join('; ');
            throw new Error(`拓扑不变量校验失败: ${errs}`);
          }
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
    const { produceStandardDeliverables } = await import('./production-orchestrator.js');
    const result = await produceStandardDeliverables({
      modelCode: args.modelCode,
      sourceFilePath: args.sourceFilePath || args.sourcePath || args.cnGroundTruthPath,
      targetDir: args.targetDir,
      userSyncDir: args.userSyncDir,
      facts: args.facts || {},
      skipAudit: Boolean(args.skipAudit),
      skipUserSync: Boolean(args.skipUserSync)
    });
    return result;
  }

  if (name === 'msds_audit_deliverables') {
    const { runMasterMsdsAudit } = await import('../scripts/run_master_msds_audit.mjs');
    const { runBipolarBilayerAudit } = await import('../scripts/audit_bipolar_bilayer.mjs');
    const masterRes = await runMasterMsdsAudit({
      model: args.modelCode,
      targetDir: args.targetDir,
      sourceDocx: args.sourceFilePath || args.sourcePath
    });
    const bilayerRes = await runBipolarBilayerAudit(args.targetDir, args.modelCode);
    return {
      success: masterRes.success && bilayerRes.success,
      masterAudit: masterRes,
      bilayerAudit: bilayerRes
    };
  }

  if (name === 'msds_get_section_topology') {
    const session = await createWorkSession(args.docxPath || args.templateKey || 'CN_Guanzhi');
    return getSectionTopology(session, args.sectionNumber);
  }

  if (name === 'msds_morph_section_topology') {
    const session = await createWorkSession(args.docxPath || args.templateKey || 'CN_Guanzhi');
    const secNum = args.sectionNumber;
    const action = args.action;
    const p = args.params || {};

    let morphRes;
    if (action === 'reshapeRows') {
      morphRes = reshapeTableRows(session, secNum, p.targetRowCount || p.rowCount || 2);
    } else if (action === 'morphToFullWidth') {
      morphRes = morphToFullWidth(session, secNum, p.rowIdx !== undefined ? p.rowIdx : 0, p.content || '', p.options || {});
    } else if (action === 'morphToMultiColumn') {
      morphRes = morphToMultiColumn(session, secNum, p.rowIdx !== undefined ? p.rowIdx : 0, p.colWidths || null, p.options || {});
    } else if (action === 'insertRowAfter') {
      morphRes = insertRowAfter(session, secNum, p.rowIdx !== undefined ? p.rowIdx : 0, p.cloneFromRowIdx);
    } else if (action === 'deleteRow') {
      morphRes = deleteRow(session, secNum, p.rowIdx !== undefined ? p.rowIdx : 0);
    } else if (action === 'mergeCells') {
      morphRes = mergeCells(session, secNum, p.rowIdx !== undefined ? p.rowIdx : 0, p.fromCol || 0, p.toCol || 1);
    } else {
      throw new Error(`未知的拓扑形变动作: ${action}`);
    }

    const saveRes = await saveSession(session, args.outputPath);
    return {
      success: true,
      action,
      sectionNumber: secNum,
      morphResult: morphRes,
      topologyAfter: getSectionTopology(session, secNum),
      outputPath: saveRes.outputPath,
      sizeBytes: saveRes.sizeBytes
    };
  }

  if (name === 'msds_apply_typography_ruler') {
    const session = await createWorkSession(args.docxPath || args.templateKey || 'CN_Guanzhi');
    const secNum = args.sectionNumber || 0;
    const rule = args.rule;

    if (rule === 'adaptiveRuler') {
      if (secNum > 0) applyAdaptiveRuler(session, secNum);
      else {
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(s => applyAdaptiveRuler(session, s));
      }
    } else if (rule === 'laserTabsSection9') {
      formatSection9LaserTabs(session);
      applyAdaptiveRuler(session, 9);
      enforceFlushLeftValues(session, 9);
    } else if (rule === 'flushLeftValues') {
      if (secNum > 0) enforceFlushLeftValues(session, secNum);
      else {
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(s => enforceFlushLeftValues(session, s));
      }
    } else if (rule === 'allRules') {
      formatSection9LaserTabs(session);
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(s => {
        applyAdaptiveRuler(session, s);
        enforceFlushLeftValues(session, s);
      });
    }

    const saveRes = await saveSession(session, args.outputPath);
    return {
      success: true,
      appliedRule: rule,
      sectionNumber: secNum,
      outputPath: saveRes.outputPath,
      sizeBytes: saveRes.sizeBytes
    };
  }

  if (name === 'msds_validate_topology_invariants') {
    const session = await createWorkSession(args.docxPath || args.templateKey || 'CN_Guanzhi');
    const res = validateTopologicalInvariants(session, args.sectionNumber !== undefined ? args.sectionNumber : null);
    return {
      passed: res.valid,
      valid: res.valid,
      violationCount: res.violationCount,
      violations: res.violations,
      errors: res.violations
    };
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
