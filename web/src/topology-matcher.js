// @ANTIGRAVITY_INVARIANT_LOCK_START: Topology Matcher Ops Compiler
/**
 * MSDS-Studio 拓扑匹配编译器 (topology-matcher.js)
 *
 * 核心定位：
 * 1. 纯结构对齐与编辑器原语编译器（Topology Matcher & Ops Compiler）；
 * 2. 将已通过校验的 Context 2 标准化结构与目标模板拓扑 Schema 精准匹配；
 * 3. 严禁修改或捏造任何化学事实与翻译文本；遇未知/不兼容模板直接报错阻断。
 */

// @FIX_TAG(2026-11-23/topology-matcher/FIX-ANCHOR-SYNONYM): 补齐 S15 法规导语中英同义归一化，确保 EN S15 位置与 CN 1:1 一致
function normAnchor(text) {
  return String(text || '')
    .replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '')
    .replace(/阀值/g, '阈值')
    .replace(/其它/g, '其他')
    .replace(/[：:\s\-_–—()（）/]/g, '')
    .toLowerCase()
    .replace(/complywith/g, 'complieswith')
    .replace(/regulatoryrequirements?/g, 'regulations')
    .replace(/workplacecomponentcontrolparameters|controlparametersforworkplacecomponents/g, 'workplaceoeltitle');
}

function extractSeq(text) {
  const m = String(text || '').trim().match(/^(\d+\.\d+)/);
  return m ? m[1] : null;
}

function getItemTexts(item, lang) {
  const isEn = lang === 'en';
  if (item.role === 'FULL_WIDTH_STRUCTURED') {
    const joined = (item.lines || [])
      .map(l => (isEn ? l.textEn : (l.textCn || `${l.labelCn || ''}${l.valueCn ? ` ${l.valueCn}` : ''}`)))
      .filter(Boolean)
      .join('\n');
    return { text: joined, label: '', value: joined };
  }
  if (item.role === 'EXPLANATION' || item.role === 'REGULATION_ITEM') {
    const t = isEn ? (item.textEn || item.valueEn || '') : (item.valueCn || item.textCn || '');
    return { text: t, label: '', value: t };
  }
  const label = isEn ? (item.labelEn || '') : (item.labelCn || '');
  const value = isEn ? (item.valueEn || '') : (item.valueCn || '');
  return { text: `${label} ${value}`.trim(), label, value };
}

/**
 * 可选内容映射与基准数据库补齐统一入口 (默认关闭，仅在用户显式开启 enableContentMapping 时调用)
 */
export function applyOptionalContentMappingAndDbFill(context2, options = {}) {
  const cloned = JSON.parse(JSON.stringify(context2));
  const mapRules = options.contentMappingRules || {};
  const dbFill = options.dbBenchmarkFill || {};
  for (let s = 1; s <= 16; s++) {
    const sec = cloned.sections?.[s] || cloned.sections?.[String(s)];
    if (!sec?.items) continue;
    for (const item of sec.items) {
      if (item.valueCn && mapRules[item.valueCn]) item.valueCn = mapRules[item.valueCn];
      if (item.valueEn && mapRules[item.valueEn]) item.valueEn = mapRules[item.valueEn];
      if (item.textCn && mapRules[item.textCn]) item.textCn = mapRules[item.textCn];
      if (item.textEn && mapRules[item.textEn]) item.textEn = mapRules[item.textEn];
    }
    if (dbFill[s] && Array.isArray(dbFill[s])) {
      sec.items.push(...dbFill[s]);
    }
  }
  return cloned;
}

/**
 * 将 Context 2 与目标模板 Schema 编译为确定性编辑器操作序列 (operations[])
 * 默认 mode = PURE_TOPOLOGY_SOURCE_INHERITED (不做内容替换、不做数据库补齐)
 */
export function compileTopologyOps(context2, templateSchema, options = {}) {
  if (!context2?.validation?.isValid) {
    const v = context2?.validation || {};
    throw new Error(
      `[TOPOLOGY_COMPILE_BLOCKED] Context 2 未通过前置校验 (untranslated=${v.untranslatedCount ?? '?'}, numericMismatch=${v.numericMismatchCount ?? '?'})，严禁进入拓扑编译！`
    );
  }
  if (!templateSchema?.sections || typeof templateSchema.sections !== 'object') {
    throw new Error('[TOPOLOGY_MISMATCH] 目标模板 Schema 缺失 sections 拓扑定义！');
  }

  const enableContentMapping = Boolean(options.enableContentMapping);
  const workingCtx2 = enableContentMapping ? applyOptionalContentMappingAndDbFill(context2, options) : context2;

  for (let s = 1; s <= 16; s++) {
    const secTpl = templateSchema.sections[s] || templateSchema.sections[String(s)];
    if (!secTpl || !Array.isArray(secTpl.rows) || secTpl.rows.length === 0) {
      throw new Error(`[TOPOLOGY_MISMATCH] 目标模板缺失第 ${s} 节物理表格骨架，无法安全匹配！`);
    }
  }

  const lang = options.language || (templateSchema.language === 'en' ? 'en' : 'zh');
  const operations = [];
  const sectionPlans = [];
  const stats = { totalOps: 0, sectionsMatched: 16, inserts: 0, deletes: 0, merges: 0, writes: 0 };

  // 强制全模板前置值格清零，彻底消除底模历史脏数据残留 (INV-PRE-WRITE-CLEAR)
  operations.push({ op: 'clearTemplate' });

  if (options.presetKey) {
    operations.push({ op: 'applyPreset', presetKey: options.presetKey });
  }

  const PRESET_LOCKED_ANCHORS = new Set([
    '供应商信息', '供应商名称', '供应商地址', '联系电话', '传真', '应急电话', '应急咨询电话',
    'supplierinformation', 'suppliername', 'supplieraddress', 'tel', 'fax', 'emergencytelephone', 'emergencyphone', 'companyname',
    ...(Array.isArray(options.presetProtectedAnchors) ? options.presetProtectedAnchors : [])
  ]);

  const pushOp = (opObj) => {
    operations.push(opObj);
    if (opObj.op === 'insertRowAfter' || opObj.op === 'insertRow') stats.inserts++;
    else if (opObj.op === 'deleteRow') stats.deletes++;
    else if (opObj.op === 'mergeCells' || opObj.op === 'morphToFullWidth') stats.merges++;
    else if (opObj.op === 'writeCell' || opObj.op === 'writeFullWidth') stats.writes++;
  };

  for (let s = 1; s <= 16; s++) {
    const c2Sec = workingCtx2.sections?.[s] || workingCtx2.sections?.[String(s)] || { items: [] };
    const tplSec = templateSchema.sections[s] || templateSchema.sections[String(s)];
    const tplRows = tplSec.rows || [];
    const c2Items = (c2Sec.items || []).filter(i => i.role !== 'SECTION_HEADER' && i.role !== 'MIGRATED_TO_S2');

    let secInserts = 0;
    let secDeletes = 0;
    let secMerges = 0;
    let secWrites = 0;

    pushOp({ op: 'clearSectionValues', sectionNumber: s });

    // 1. Section 2: 唯一通栏大纲结构
    if (s === 2) {
      const fwItem = c2Items.find(i => i.role === 'FULL_WIDTH_STRUCTURED');
      let content = fwItem ? getItemTexts(fwItem, lang).text : c2Items.map(i => getItemTexts(i, lang).text).filter(Boolean).join('\n');
      if (lang === 'zh') {
        content = content.replace(/^(?:GHS-?象形图\s+)?必须列在标签上的有害成[份分][：:\s]*(.+)$/gm, '必须列在标签上的有害成分：$1');
      } else {
        content = content.replace(/^(?:GHS\s*Pictograms\s*\/\s*)?Hazardous components to be listed on the label[：:\s]+(.+)$/gmi, 'Hazardous components to be listed on the label: $1');
      }
      if (tplRows.length >= 2) {
        pushOp({ op: 'writeFullWidth', sectionNumber: s, content, options: { isSection2: true } });
        secMerges++;
        secWrites++;
        for (let r = tplRows.length - 1; r >= 2; r--) {
          pushOp({ op: 'deleteRow', sectionNumber: s, rowIndex: r });
          secDeletes++;
        }
      } else {
        throw new Error('[TOPOLOGY_MISMATCH] 模板 Section 2 行数不足 2 行，无法挂载通栏内容！');
      }
      sectionPlans.push({ sectionNumber: s, tplRows: tplRows.length, c2Items: c2Items.length, inserts: secInserts, deletes: secDeletes, merges: secMerges, writes: secWrites, strategy: 'FULL_WIDTH_S2' });
      continue;
    }

    // 2. 分离多列数据网格 (3_COL_TABLE / MULTI_COL_TABLE) 与常规 KV/说明行
    const gridHeaders = c2Items.filter(i => i.role === 'TABLE_HEADER');
    // 排除仅有标题而无 CAS/浓度的数据行 (例如 3.2成分 属于题头分类)
    const gridData = c2Items.filter(i => 
      (i.role === 'COMPONENT_ROW' || i.role === 'OEL_ROW') && 
      Boolean(i.cellsCn?.[1] || i.cellsCn?.[2] || i.cellsEn?.[1] || i.cellsEn?.[2])
    );
    // 查找位于数据表格之前的子题头行 (如 3.2成分 / 3.2 Ingredients)
    const preGridHeaderItem = c2Items.find(i => 
      (i.role === 'COMPONENT_ROW' || i.role === 'SUB_LABEL') && 
      /^(?:3\.2\s*)?(?:成分|组分|Ingredients)/i.test(i.cellsCn?.[0] || i.cellsEn?.[0] || i.labelCn || i.labelEn || '') &&
      !gridData.includes(i)
    );
    const regularItems = c2Items.filter(i => 
      !['TABLE_HEADER', 'COMPONENT_ROW', 'OEL_ROW'].includes(i.role) && i !== preGridHeaderItem
    );

    const tplMultiRows = tplRows.filter(r => r.rowIndex >= 1 && r.cellsCount >= 3);
    const tplRegularRows = tplRows.filter(r => r.rowIndex >= 1 && r.cellsCount < 3);

    // 处理 S3 / S8 多列表格区域
    const deletedRowSet = new Set();
    const usedTplRows = new Set();
    if (tplMultiRows.length > 0 || gridData.length > 0) {
      const tplGridHdr = tplMultiRows.find(r => /化学品|Chemical|CAS|物质|Substance|Basis|TWA|STEL|OEL|限值/i.test((r.cells || []).map(c => c.text).join(' ')));
      const tplGridData = tplMultiRows.filter(r => !tplGridHdr || r.rowIndex > tplGridHdr.rowIndex);

      // 若模板在表头前有预设题头行 (如 Row 2: 成分)，将其与 C2 题头精准匹配
      const tplPreHdr = tplMultiRows.find(r => tplGridHdr && r.rowIndex < tplGridHdr.rowIndex);
      if (tplPreHdr && preGridHeaderItem) {
        usedTplRows.add(tplPreHdr.rowIndex);
        // 保留模板底模规范加粗题头（3.2成分 / 3.2 Ingredients），绝不强写标签格破坏样式与触发保护
      } else if (tplPreHdr && !preGridHeaderItem) {
        deletedRowSet.add(tplPreHdr.rowIndex);
      }

      if (gridData.length === 0 && tplMultiRows.length > 0) {
        // 模板有多列表（如 S8 OEL），但源文件无 OEL 数据 -> 剪枝多余多列行
        for (const r of tplMultiRows) deletedRowSet.add(r.rowIndex);
      } else if (gridData.length > 0) {
        if (tplMultiRows.length === 0) {
          throw new Error(`[TOPOLOGY_MISMATCH] 第 ${s} 节需要 ${gridData[0]?.cellsCn?.length || 3} 列数据网格，但模板缺少多列表格槽位！`);
        }
        const commonCount = Math.min(gridData.length, tplGridData.length);
        for (let i = 0; i < commonCount; i++) {
          const rowIdx = tplGridData[i].rowIndex;
          const cells = lang === 'en' ? gridData[i].cellsEn : gridData[i].cellsCn;
          (cells || []).forEach((txt, ci) => {
            if (ci < tplGridData[i].cellsCount) {
              pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: rowIdx, cellIndex: ci, text: txt || '' });
              secWrites++;
            }
          });
        }
        // 多余的模板组分/OEL 行加入剪枝集合
        for (let i = commonCount; i < tplGridData.length; i++) {
          deletedRowSet.add(tplGridData[i].rowIndex);
        }
        // 缺少槽位时克隆插入（优先克隆首条数据行以继承内框虚线样式）
        const anchorRow = tplGridData.length > 0 ? tplGridData[tplGridData.length - 1] : tplGridHdr;
        const cloneSourceIdx = tplGridData.length > 0 ? tplGridData[0].rowIndex : anchorRow.rowIndex;
        for (let i = commonCount; i < gridData.length; i++) {
          const insertAt = anchorRow.rowIndex + (i - commonCount);
          pushOp({ op: 'insertRowAfter', sectionNumber: s, rowIndex: insertAt, cloneFromRowIndex: cloneSourceIdx });
          secInserts++;
          const cells = lang === 'en' ? gridData[i].cellsEn : gridData[i].cellsCn;
          (cells || []).forEach((txt, ci) => {
            if (ci < anchorRow.cellsCount) {
              pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: insertAt + 1, cellIndex: ci, text: txt || '' });
              secWrites++;
            }
          });
        }
      }
    }

    // 3. 匹配常规 KV / 通栏说明行
    for (const r of deletedRowSet) {
      usedTplRows.add(r);
    }
    const unmatchedRegular = [];

    // Section 13 专有拓扑聚合：根据标准 disposition: same_cell 规范，废弃法规说明行统一聚合至首行单列槽位，确保双列处理方法行保持在 Section 13 末行 (INV-S13-TOPOLOGY)
    let effectiveRegularItems = regularItems;
    if (s === 13) {
      const explanations = regularItems.filter(i => i.role === 'EXPLANATION');
      const methods = regularItems.filter(i => i.role !== 'EXPLANATION');
      if (explanations.length > 1) {
        const mergedExplanation = {
          role: 'EXPLANATION',
          labelCn: '—',
          labelEn: '—',
          textCn: explanations.map(e => e.textCn || e.valueCn || '').filter(Boolean).join('\n'),
          textEn: explanations.map(e => e.textEn || e.valueEn || '').filter(Boolean).join('\n'),
          valueCn: explanations.map(e => e.valueCn || e.textCn || '').filter(Boolean).join('\n'),
          valueEn: explanations.map(e => e.valueEn || e.textEn || '').filter(Boolean).join('\n'),
          placement: { gridType: '1_COL_MERGED' }
        };
        effectiveRegularItems = [mergedExplanation, ...methods];
      }
    }

    // @FIX_TAG(2026-11-23/topology-matcher/FIX-S3-SEQ32): 中文模板 S3 R2 "3.2成分" 的 3.2 位于隐式编号中，deleteRow 重建后会丢失；强制显式写入 "3.2\t成分" 确保与 EN "3.2\tIngredients" 1:1 对称
    if (s === 3 && lang === 'zh' && tplRows[2] && /^(?:3\.2\s*)?成分$/.test((tplRows[2].cells?.[0]?.text || '').trim())) {
      pushOp({ op: 'writeCell', sectionNumber: 3, rowIndex: 2, cellIndex: 0, text: '3.2\t成分', bold: true });
      secWrites++;
    }

    // @FIX_TAG(2026-11-23/topology-matcher/FIX-BILINGUAL-CANONICAL-ORDER): S6 与 S9 模板在中英文间存在固有行序差异，按 Context 2(中文基准)顺序依次覆写双语槽位，确保 CN/EN 逐行 1:1 对齐
    if (s === 6 || s === 9) {
      effectiveRegularItems.forEach((item, idx) => {
        const { label, value, text } = getItemTexts(item, lang);
        const cleanLabelNoSeq = item.seq ? label.replace(/^\d+\.\d+[\s\t]*/, '') : label;
        const seqPrefixLabel = item.seq ? `${item.seq}\t${cleanLabelNoSeq}` : label;
        if (idx < tplRegularRows.length) {
          const targetRow = tplRegularRows[idx];
          usedTplRows.add(targetRow.rowIndex);
          if (item.placement?.gridType === '1_COL_MERGED' || item.role === 'EXPLANATION' || targetRow.cellsCount === 1) {
            const mergedContent = ((item.role === 'SUB_LABEL' || item.role === 'SEQ_LABEL') && item.seq && !(item.valueCn || item.valueEn))
              ? seqPrefixLabel
              : text;
            pushOp({
              op: 'morphToFullWidth',
              sectionNumber: s,
              rowIndex: targetRow.rowIndex,
              content: mergedContent,
              options: {
                bold: Boolean((item.boldLabel && !(item.valueCn || item.valueEn)) || item.role === 'SEQ_LABEL'),
                boldSubheaders: Boolean(item.boldLabel && (item.valueCn || item.valueEn) && item.role !== 'SEQ_LABEL'),
                indentDxa: item.indentDxa || 0
              }
            });
            secMerges++;
            secWrites++;
          } else {
            if (seqPrefixLabel) {
              pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: targetRow.rowIndex, cellIndex: 0, text: seqPrefixLabel, bold: true });
              secWrites++;
            }
            pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: targetRow.rowIndex, cellIndex: 1, text: value });
            secWrites++;
          }
        } else {
          unmatchedRegular.push(item);
        }
      });
    } else {
    for (const item of effectiveRegularItems) {
      if (item.role === 'FULL_WIDTH_STRUCTURED') {
        const targetRow = tplRegularRows.find(r => !usedTplRows.has(r.rowIndex));
        const content = getItemTexts(item, lang).text;
        if (targetRow) {
          usedTplRows.add(targetRow.rowIndex);
          pushOp({ op: 'morphToFullWidth', sectionNumber: s, rowIndex: targetRow.rowIndex, content });
          secMerges++;
          secWrites++;
        } else {
          unmatchedRegular.push(item);
        }
        continue;
      }

      const itemAnchor = normAnchor(item.cleanKey || item.labelCn);
      const itemAnchorEn = normAnchor(item.labelEn);
      let matched = null;

      // 语义锚点优先匹配，禁止仅凭序号盲目覆盖不同语义的模板行
      if (itemAnchor) {
        matched = tplRegularRows.find(r => !usedTplRows.has(r.rowIndex) && normAnchor(r.cells?.[0]?.text) === itemAnchor);
      }
      if (!matched && itemAnchorEn) {
        matched = tplRegularRows.find(r => !usedTplRows.has(r.rowIndex) && normAnchor(r.cells?.[0]?.text) === itemAnchorEn);
      }
      if (!matched && (item.role === 'EXPLANATION' || item.role === 'REGULATION_ITEM')) {
        matched = tplRegularRows.find(r => !usedTplRows.has(r.rowIndex) && (r.cellsCount === 1 || !r.cells?.[0]?.text));
      }

      if (matched) {
        usedTplRows.add(matched.rowIndex);
        const tplRowAnchor = normAnchor(matched.cells?.[0]?.text);
        const isPresetProtected = Boolean(options.presetKey) && (
          PRESET_LOCKED_ANCHORS.has(itemAnchor) ||
          PRESET_LOCKED_ANCHORS.has(itemAnchorEn) ||
          PRESET_LOCKED_ANCHORS.has(tplRowAnchor)
        );
        if (!isPresetProtected) {
          const { label, value, text } = getItemTexts(item, lang);
          // @FIX_TAG(2026-11-23/topology-matcher/FIX-SEQ-SYNC): 若 Context 2 携带序号(如 S7 7.1/7.2, S8 8.1/8.2)，统一规范为 "X.Y\tLabel" 格式；含序号的 1_COL_MERGED 标题行(SEQ_LABEL/SUB_LABEL)同步写入 seqPrefixLabel，确保 CN/EN 序号 1:1 对称且不丢失
          const cleanLabelNoSeq = item.seq ? label.replace(/^\d+\.\d+[\s\t]*/, '') : label;
          const seqPrefixLabel = item.seq ? `${item.seq}\t${cleanLabelNoSeq}` : label;
          if (item.placement?.gridType === '1_COL_MERGED' || item.role === 'EXPLANATION' || matched.cellsCount === 1) {
            const mergedContent = ((item.role === 'SUB_LABEL' || item.role === 'SEQ_LABEL') && item.seq && !(item.valueCn || item.valueEn))
              ? seqPrefixLabel
              : text;
            pushOp({
              op: 'morphToFullWidth',
              sectionNumber: s,
              rowIndex: matched.rowIndex,
              content: mergedContent,
              options: {
                bold: Boolean(item.boldLabel && !(item.valueCn || item.valueEn)),
                boldSubheaders: Boolean(item.boldLabel && (item.valueCn || item.valueEn)),
                indentDxa: item.indentDxa || 0
              }
            });
            secMerges++;
            secWrites++;
          } else {
            if (matched.cellsCount >= 2) {
              if (item.seq && seqPrefixLabel && (extractSeq(matched.cells?.[0]?.text) !== item.seq || !String(matched.cells?.[0]?.text || '').includes('\t'))) {
                pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: matched.rowIndex, cellIndex: 0, text: seqPrefixLabel, bold: true });
                secWrites++;
              }
              let outVal = value;
              if (lang === 'zh' && s === 5 && outVal && !/[。.!?]$/.test(outVal)) outVal = `${outVal}。`;
              pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: matched.rowIndex, cellIndex: 1, text: outVal });
              secWrites++;
            }
          }
        }
      } else {
        unmatchedRegular.push(item);
      }
    }
    }

    // 未匹配的模板常规行加入倒序删除集合，交由编辑器 pruneSafely 执行安全剪枝
    for (const r of tplRegularRows) {
      if (!usedTplRows.has(r.rowIndex)) {
        deletedRowSet.add(r.rowIndex);
      }
    }

    // 先在剪枝前从有效双列模板行克隆追加未匹配的新 Context 2 行（避免全删后无双列模板可克隆或误克隆单列行）
    const twoColTplRow = tplRegularRows.find(r => r.cellsCount === 2 && extractSeq(r.cells?.[0]?.text))
      || tplRegularRows.find(r => r.cellsCount === 2)
      || tplRegularRows[0];
    let appendCursor = Math.max(0, tplRows.length - 1);
    for (const item of unmatchedRegular) {
      const cloneBase = twoColTplRow ? twoColTplRow.rowIndex : Math.max(1, appendCursor);
      pushOp({ op: 'insertRowAfter', sectionNumber: s, rowIndex: appendCursor, cloneFromRowIndex: cloneBase });
      secInserts++;
      appendCursor++;
      const { label, value, text } = getItemTexts(item, lang);
      if (item.placement?.gridType === '1_COL_MERGED' || item.role === 'FULL_WIDTH_STRUCTURED') {
        // @FIX_TAG(2026-11-23/topology-matcher/FIX-UNMATCHED-SEQ): 未匹配追加的 1_COL_MERGED 带序号标题行(如 S8 8.1/8.2 控制参数)同样强制规范 "X.Y\tLabel" 与加粗，确保 CN/EN 1:1 对称
        const rawSeqSource = label || text;
        const cleanSeqSource = item.seq ? String(rawSeqSource || '').replace(/^\d+\.\d+[\s\t]*/, '') : rawSeqSource;
        const seqPrefixContent = item.seq ? `${item.seq}\t${cleanSeqSource}` : text;
        const mergedContent = ((item.role === 'SUB_LABEL' || item.role === 'SEQ_LABEL') && item.seq)
          ? seqPrefixContent
          : text;
        pushOp({
          op: 'morphToFullWidth',
          sectionNumber: s,
          rowIndex: appendCursor,
          content: mergedContent,
          options: {
            bold: Boolean((item.boldLabel && !(item.valueCn || item.valueEn)) || item.role === 'SEQ_LABEL'),
            boldSubheaders: Boolean(item.boldLabel && (item.valueCn || item.valueEn) && item.role !== 'SEQ_LABEL'),
            indentDxa: item.indentDxa || 0
          }
        });
        secMerges++;
        secWrites++;
      } else {
        const seqNormLabel = String(label || '').replace(/^(\d+\.\d+)\s*(.+)$/, '$1\t$2');
        const formattedLabel = item.seq && !/^\d+\.\d+/.test(seqNormLabel) ? `${item.seq}\t${seqNormLabel}` : seqNormLabel;
        if (formattedLabel) {
          pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: appendCursor, cellIndex: 0, text: formattedLabel, bold: true });
          secWrites++;
        }
        pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: appendCursor, cellIndex: 1, text: value });
        secWrites++;
      }
    }

    // 倒序交由编辑器执行安全剪枝 (保护父级分类题头；rowsToDelete 索引均在原模板范围内，不影响末尾新追加行)
    const rowsToDelete = Array.from(deletedRowSet).sort((a, b) => b - a);
    if (rowsToDelete.length > 0) {
      pushOp({ op: 'pruneSafely', sectionNumber: s, rowIndices: rowsToDelete });
      secDeletes += rowsToDelete.length;
    }

    if (s === 9) {
      pushOp({ op: 'formatLaserTabs', sectionNumber: 9 });
    }
    if (s === 3) {
      pushOp({ op: 'formatSection3Grid', sectionNumber: 3 });
    }
    pushOp({ op: 'applyAdaptiveRuler', sectionNumber: s });
    if (s !== 3) {
      pushOp({ op: 'enforceFlushLeftValues', sectionNumber: s });
    }

    sectionPlans.push({
      sectionNumber: s,
      tplRows: tplRows.length,
      c2Items: c2Items.length,
      inserts: secInserts,
      deletes: secDeletes,
      merges: secMerges,
      writes: secWrites,
      strategy: gridData.length > 0 ? 'MULTI_GRID+KV' : 'KV_ANCHOR+PRUNE'
    });
  }

  // 终态 Preset 独占覆写保障 + 拓扑驱动的编辑器全局几何硬锁
  if (options.presetKey) {
    operations.push({ op: 'applyPreset', presetKey: options.presetKey });
  }
  operations.push({
    op: 'applyTopologyLock',
    typographyProfile: templateSchema.typographyProfile || null
  });

  stats.totalOps = operations.length;
  return {
    modelCode: workingCtx2.modelCode,
    templateKey: templateSchema.templateKey,
    language: lang,
    mode: enableContentMapping ? 'TOPOLOGY_PLUS_MAPPING' : 'PURE_TOPOLOGY_SOURCE_INHERITED',
    generatedAt: new Date().toISOString(),
    stats,
    sectionPlans,
    operations
  };
}

/**
 * 将《拓扑对齐编译计划》序列化为精简 Markdown 审阅视图
 */
export function formatTopologyPlanMarkdown(compiled) {
  const s = compiled.stats || {};
  const lines = [
    `# ${compiled.modelCode} 拓扑对齐编译计划 (${compiled.templateKey} / ${compiled.language})`,
    '',
    `> **总原语指令数**：${s.totalOps} 条（写入 ${s.writes} | 增行 ${s.inserts} | 剪枝删行 ${s.deletes} | 合并/通栏 ${s.merges}）`,
    '',
    '| 节 | 模板原行数 | C2 条目数 | 增行 | 删行(剪枝) | 合并/通栏 | 写入次数 | 匹配策略 |',
    '| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |'
  ];
  for (const p of compiled.sectionPlans || []) {
    lines.push(`| S${p.sectionNumber} | ${p.tplRows} | ${p.c2Items} | ${p.inserts} | ${p.deletes} | ${p.merges} | ${p.writes} | \`${p.strategy}\` |`);
  }
  return lines.join('\n');
}
// @ANTIGRAVITY_INVARIANT_LOCK_END