/**
 * MSDS-Studio 拓扑匹配编译器 (topology-matcher.js)
 *
 * 核心定位：
 * 1. 纯结构对齐与编辑器原语编译器（Topology Matcher & Ops Compiler）；
 * 2. 将已通过校验的 Context 2 标准化结构与目标模板拓扑 Schema 精准匹配；
 * 3. 严禁修改或捏造任何化学事实与翻译文本；遇未知/不兼容模板直接报错阻断。
 */

function normAnchor(text) {
  return String(text || '')
    .replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '')
    .replace(/[：:\s\-_()（）/]/g, '')
    .toLowerCase();
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
 * 将 Context 2 与目标模板 Schema 编译为确定性编辑器操作序列 (operations[])
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

  if (options.presetKey) {
    operations.push({ op: 'applyPreset', presetKey: options.presetKey });
  }

  const pushOp = (opObj) => {
    operations.push(opObj);
    if (opObj.op === 'insertRowAfter' || opObj.op === 'insertRow') stats.inserts++;
    else if (opObj.op === 'deleteRow') stats.deletes++;
    else if (opObj.op === 'mergeCells' || opObj.op === 'morphToFullWidth') stats.merges++;
    else if (opObj.op === 'writeCell' || opObj.op === 'writeFullWidth') stats.writes++;
  };

  for (let s = 1; s <= 16; s++) {
    const c2Sec = context2.sections?.[s] || context2.sections?.[String(s)] || { items: [] };
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
      const content = fwItem ? getItemTexts(fwItem, lang).text : c2Items.map(i => getItemTexts(i, lang).text).filter(Boolean).join('\n');
      if (tplRows.length >= 2) {
        pushOp({ op: 'morphToFullWidth', sectionNumber: s, rowIndex: 1, content });
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
    const gridData = c2Items.filter(i => i.role === 'COMPONENT_ROW' || i.role === 'OEL_ROW');
    const regularItems = c2Items.filter(i => !['TABLE_HEADER', 'COMPONENT_ROW', 'OEL_ROW'].includes(i.role));

    const tplMultiRows = tplRows.filter(r => r.rowIndex >= 1 && r.cellsCount >= 3);
    const tplRegularRows = tplRows.filter(r => r.rowIndex >= 1 && r.cellsCount < 3);

    // 处理 S3 / S8 多列表格区域
    const deletedRowSet = new Set();
    if (tplMultiRows.length > 0 || gridData.length > 0) {
      const tplGridHdr = tplMultiRows.find(r => /化学品|Chemical|CAS|物质|TWA|STEL|OEL|限值/i.test((r.cells || []).map(c => c.text).join(' ')));
      const tplGridData = tplMultiRows.filter(r => !tplGridHdr || r.rowIndex > tplGridHdr.rowIndex);

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
        // 缺少槽位时克隆插入（按后插入行号递进）
        const anchorRow = tplGridData.length > 0 ? tplGridData[tplGridData.length - 1] : tplGridHdr;
        for (let i = commonCount; i < gridData.length; i++) {
          const insertAt = anchorRow.rowIndex + (i - commonCount);
          pushOp({ op: 'insertRowAfter', sectionNumber: s, rowIndex: insertAt, cloneFromRowIndex: anchorRow.rowIndex });
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
    const usedTplRows = new Set([...deletedRowSet]);
    const unmatchedRegular = [];

    for (const item of regularItems) {
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

      const itemSeq = item.seq || extractSeq(item.labelCn);
      const itemAnchor = normAnchor(item.cleanKey || item.labelCn);
      const itemAnchorEn = normAnchor(item.labelEn);
      let matched = null;

      if (itemSeq) {
        matched = tplRegularRows.find(r => !usedTplRows.has(r.rowIndex) && extractSeq(r.cells?.[0]?.text) === itemSeq);
      }
      if (!matched && itemAnchor) {
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
        const { value, text } = getItemTexts(item, lang);
        if (item.placement?.gridType === '1_COL_MERGED') {
          pushOp({ op: 'morphToFullWidth', sectionNumber: s, rowIndex: matched.rowIndex, content: text });
          secMerges++;
          secWrites++;
        } else {
          if (matched.cellsCount >= 2) {
            pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: matched.rowIndex, cellIndex: 1, text: value });
            secWrites++;
          }
        }
      } else {
        unmatchedRegular.push(item);
      }
    }

    // 未匹配的模板常规行加入倒序删除集合
    for (const r of tplRegularRows) {
      if (!usedTplRows.has(r.rowIndex)) {
        deletedRowSet.add(r.rowIndex);
      }
    }

    // 倒序删除多余/未匹配模板行 (防行号偏移)
    const rowsToDelete = Array.from(deletedRowSet).sort((a, b) => b - a);
    for (const rIdx of rowsToDelete) {
      pushOp({ op: 'deleteRow', sectionNumber: s, rowIndex: rIdx });
      secDeletes++;
    }

    // 追加未匹配到的新 Context 2 行
    const survivingCount = tplRows.length - rowsToDelete.length + secInserts;
    let appendCursor = Math.max(0, survivingCount - 1);
    for (const item of unmatchedRegular) {
      const cloneBase = Math.max(1, appendCursor);
      pushOp({ op: 'insertRowAfter', sectionNumber: s, rowIndex: appendCursor, cloneFromRowIndex: cloneBase });
      secInserts++;
      appendCursor++;
      const { value, text } = getItemTexts(item, lang);
      if (item.placement?.gridType === '1_COL_MERGED' || item.role === 'FULL_WIDTH_STRUCTURED') {
        pushOp({ op: 'morphToFullWidth', sectionNumber: s, rowIndex: appendCursor, content: text });
        secMerges++;
        secWrites++;
      } else {
        pushOp({ op: 'writeCell', sectionNumber: s, rowIndex: appendCursor, cellIndex: 1, text: value });
        secWrites++;
      }
    }

    if (s === 9) {
      pushOp({ op: 'formatLaserTabs', sectionNumber: 9 });
      pushOp({ op: 'applyAdaptiveRuler', sectionNumber: 9 });
    }
    pushOp({ op: 'enforceFlushLeftValues', sectionNumber: s });

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

  stats.totalOps = operations.length;
  return {
    modelCode: context2.modelCode,
    templateKey: templateSchema.templateKey,
    language: lang,
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
