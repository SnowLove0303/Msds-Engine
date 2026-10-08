const SECTION_ALIAS_GROUPS = {
  1: [
    ['product_model', '产品名称', 'product name', 'model'],
    ['chinese_name', '中文名称', 'chemical name', 'product chinese name'],
    ['chemical_category', '化学品分类', '化学品类别', 'chemical category'],
    ['recommended_use', '产品使用建议和使用限制', '产品用途', 'recommended use', 'product use suggestions and restrictions'],
    ['supplier_name', '供应商名称', 'name of supplier', 'supplier name'],
    ['supplier_address', '供应商地址', 'supplier address'],
    ['telephone', '电话', 'tel', 'telephone'],
    ['fax', '传真', 'fax'],
  ],
  2: [
    ['ghs_classes', '物质或混合物分类', 'ghs分类', 'ghs危险性类别', 'ghs hazard classification'],
    ['label_elements', '标签要素', 'ghs标签要素', 'ghs label elements'],
    ['pictograms', 'ghs象形图', '象形图', 'ghs pictograms'],
    ['signal_word', '信号词', '警告词', 'signal word'],
    ['hazard_statements', '危险性说明', '危险说明', 'hazard statements'],
    ['precautionary_statements', '防范说明', '防范措施', 'precautionary statements'],
    ['physical_chemical_hazards', '物理和化学危险', '物理和化学危害', 'physical and chemical hazards'],
    ['health_hazards', '健康危害', 'health hazards'],
    ['environmental_hazards', '环境危害', 'environmental hazards'],
    ['other_hazards', '其他危害', '其它危害', 'other hazards'],
  ],
  3: [
    ['product_type', '产品类型', 'product type'],
    ['composition', '成分', '化学品名称', 'composition', 'chemical name'],
    ['cas_number', 'cas编号', 'cas号', 'cas number'],
    ['concentration', '含量', '含量%（w/w）', 'concentration', 'content'],
  ],
  4: [
    ['general_first_aid', '一般措施', '急救一般措施', 'general measures'],
    ['ingestion', '误服', '食入', '吞咽', 'ingestion'],
    ['eye_contact', '接触眼睛', '眼睛接触', 'eye contact'],
    ['skin_contact', '接触皮肤', '皮肤接触', 'skin contact'],
    ['inhalation', '吸入', 'inhalation'],
  ],
  5: [
    ['suitable_extinguishing_media', '合适的灭火剂', '适合的灭火剂', 'suitable extinguishing media'],
    ['unsuitable_extinguishing_media', '不合适的灭火剂', '不适合的灭火剂', 'unsuitable extinguishing media'],
    ['special_hazards', '物质或混合物的特殊危害', '特殊危害', 'special hazards'],
    ['firefighter_protection', '消防预防措施和保护设备', '消防人员防护', 'firefighter protection'],
  ],
  6: [
    ['personal_precautions', '个人预防措施、应急程序', '个人防护措施', 'personal precautions'],
    ['environmental_precautions', '环境保护措施', 'environmental precautions'],
    ['cleanup_methods', '污染物收集和清除的方法', '清理方法', 'methods for cleaning up'],
  ],
  7: [
    ['safe_handling', '安全操作防范', '安全操作', 'precautions for safe handling'],
    ['safe_storage', '安全储存条件', '安全储存', 'conditions for safe storage'],
  ],
  8: [
    ['exposure_parameters', '控制参数', '暴露限值', 'control parameters'],
    ['respiratory_protection', '呼吸系统防护', '呼吸防护', 'respiratory protection'],
    ['hand_protection', '手部防护', '手部保护', 'hand protection'],
    ['glove_material', '防护手套的合适材料', '合适的手套材料', 'suitable glove materials'],
    ['fkm_glove', '氟化橡胶fkm', 'fkm'],
    ['iir_glove', '丁基橡胶iir', 'iir'],
    ['nbr_glove', '丁腈橡胶nbr', 'nbr'],
    ['recommendation', '建议', 'recommendation'],
    ['eye_protection', '眼睛防护', '眼面部防护', 'eye protection'],
    ['body_protection', '身体防护', 'skin and body protection'],
    ['engineering_controls', '工程控制', 'engineering controls'],
  ],
  9: [
    ['appearance', '外观', 'appearance'], ['odor_threshold', '嗅觉阈值', '嗅觉阀值', '气味阈值', 'odor threshold'],
    ['ph', 'ph值', 'ph'], ['ionicity', '离子性', 'ionicity'], ['initial_boiling_point', '初沸点', 'initial boiling point'],
    ['flash_point', '闪点', 'flash point'], ['evaporation_rate', '蒸发速率', 'evaporation rate'],
    ['flammability', '可燃性（固态、气态）', '可燃性', 'flammability'], ['combustion_value', '燃烧值', 'combustion value'],
    ['relative_vapor_density', '相对蒸气密度', 'relative vapor density'], ['density', '密度', 'density'],
    ['water_solubility', '水溶性', 'water solubility'], ['surface_tension', '表面张力', 'surface tension'],
    ['octanol_water_partition', '辛醇/水分配系数的对数值', '辛醇/水分配系数对数值', 'octanol/water partition coefficient'],
    ['auto_ignition_temperature', '自燃温度', 'auto-ignition temperature'], ['ignition_temperature', '引燃温度', 'ignition temperature'],
    ['decomposition_temperature', '分解温度', 'decomposition temperature'], ['viscosity', '动力粘度', '动力黏度', 'viscosity'],
    ['solids_content', '固体含量', '固含量', 'solids content'], ['other_information', '其他信息', '其它信息', 'other information'],
  ],
  10: [
    ['chemical_stability', '化学稳定性', 'chemical stability'], ['hazardous_decomposition_products', '危险分解产物', 'hazardous decomposition products'],
    ['hazardous_reactions', '可能的危害反应', '危险反应', 'hazardous reactions'], ['conditions_to_avoid', '应避免的条件', '避免条件', 'conditions to avoid'],
    ['incompatible_materials', '禁配物', 'incompatible materials'],
  ],
  11: [
    ['acute_toxicity', '急性毒性', 'acute toxicity'], ['skin_irritation', '主要皮肤刺激性', '皮肤刺激性', 'skin irritation'],
    ['eye_irritation', '主要眼睛刺激性', '主要粘膜刺激性', '主要黏膜刺激性', 'eye irritation', 'mucous membrane irritation'],
    ['sensitization', '致敏性', '皮肤致敏性', 'sensitization'], ['mutagenicity', '致突变性', 'mutagenicity'],
    ['carcinogenicity', '致癌性', 'carcinogenicity'], ['reproductive_toxicity', '生殖毒性', 'reproductive toxicity'],
    ['stot', '特异性靶器官系统毒性（一次接触/反复接触）', '特异性靶器官毒性', 'stot'],
    ['aspiration_hazard', '吸入危险', '吸入危害', 'aspiration hazard'], ['additional_toxicology', '附加信息', 'additional information'],
  ],
  12: [
    ['ecotoxicity', '生态毒性', 'ecotoxicity'], ['persistence_degradability', '持久性和降解性', '持久性与降解性', 'persistence and degradability'],
    ['other_adverse_effects', '其他', '其他不利的影响', '其他不利影响', 'other adverse effects'],
  ],
  13: [
    ['disposal_method', '处理方法', '废弃处置', 'disposal methods'], ['waste_disposal', '废弃物处理', 'waste disposal'],
  ],
  14: [
    ['road_rail_transport', '公路和铁路运输', '公路/铁路运输', 'road/rail transport'], ['sea_transport', '海上运输', '海运', 'sea transport'],
    ['air_transport', '空运', '航空运输', 'air transport'], ['special_precautions', '用户特殊注意事项', '特殊防范措施', 'special precautions'],
  ],
  15: [
    ['regulatory_provisions', '其他的规定', '其它的规定', 'other provisions'], ['regulations', '法规要求', '符合下列法规要求', 'regulations'],
  ],
  16: [['disclaimer', '其他信息', '免责声明', 'disclaimer', 'other information']],
};

const LABEL_TO_SLOT = new Map();
for (const [sectionText, groups] of Object.entries(SECTION_ALIAS_GROUPS)) {
  for (const [slot, ...aliases] of groups) {
    for (const alias of aliases) LABEL_TO_SLOT.set(`${sectionText}:${normalizeSlotLabel(alias)}`, slot);
  }
}

const MISSING_VALUE = /^(?:无数据(?:资料)?|暂无数据|no data available|not available)$/i;

export function normalizeSlotLabel(value) {
  return String(value || '')
    .replace(/^\s*(?:v\s*)?\d+(?:[.．、]\d+)*(?:[.．、])?\s*/i, '')
    .replace(/[\s\u3000\t\r\n:：、，,。；;（）()\[\]【】—–\-_/\\]/g, '')
    .toLowerCase();
}

export function canonicalSlotId(sectionNumber, label) {
  const source = Number(sectionNumber) === 9 ? String(label || '').replace(/[（(].*$/, '') : label;
  const key = normalizeSlotLabel(source);
  return LABEL_TO_SLOT.get(`${Number(sectionNumber)}:${key}`) || `s${Number(sectionNumber)}:${key}`;
}

function plainParagraphText(paragraph) {
  return (paragraph?.runs || []).map((run) => run.text || '').join('').trim();
}

function paragraphRoleText(paragraph) {
  const bold = (paragraph?.runs || []).filter((run) => run.bold).map((run) => run.text || '').join('').trim();
  const regular = (paragraph?.runs || []).filter((run) => !run.bold).map((run) => run.text || '').join('').trim();
  return { bold, regular, full: plainParagraphText(paragraph) };
}

function splitInlineLabel(text) {
  const match = String(text || '').match(/^\s*([^：:\n\t]{1,100}?)[：:]\s*([\s\S]+?)\s*$/);
  if (!match) return null;
  return { label: match[1].trim(), value: match[2].trim() };
}

function classifyNote(section, text) {
  const value = String(text || '').trim();
  if (!value) return null;
  if (section === 8 && /(?:接触限值|职业接触限值|exposure limit)/i.test(value)) return 's8_control_parameters';
  if (section === 11 && /无可用的毒理学研究/.test(value)) return 's11_availability';
  if (section === 11 && /(?:类似产品.{0,24}(?:毒理|风险评估|参考数据)|毒理学参考数据|毒理学风险评估)/.test(value)) return 's11_reference';
  if (section === 12 && /无可用的生态毒理学研究/.test(value)) return 's12_availability';
  if (section === 12 && /(?:类似产品.{0,24}(?:生态|毒理|参考数据)|生态毒理学参考数据)/.test(value)) return 's12_reference';
  if (section === 16) return 's16_disclaimer';
  if (section === 15 && /(?:GB\/T|\bGB\s*\d|国务院令|法规)/i.test(value)) return 's15_regulation';
  if (section === 13 && /(?:废弃|回收|处置|排放)/.test(value)) return 's13_disposal_note';
  return null;
}

function splitParagraphFacts(section, row, cell, cellIndex, recordId) {
  const facts = [];
  let pendingLabel = '';
  for (let paragraphIndex = 0; paragraphIndex < (cell.paragraphs || []).length; paragraphIndex += 1) {
    const { bold, regular, full } = paragraphRoleText(cell.paragraphs[paragraphIndex]);
    if (regular && !/[0-9A-Za-z\u4e00-\u9fff<>≤≥≦≧]/.test(regular)) continue;
    const label = normalizeSlotLabel(bold) ? bold : '';
    if (label && regular) {
      const cleanLabel = label.replace(/^\s*(?:v\s*)?\d+(?:[.．、]\d+)*(?:[.．、])?\s*/i, '').trim();
      if (cleanLabel) facts.push({ section, rowIndex: row.index, cellIndex, paragraphIndex, label: cleanLabel, value: regular, sourceText: full, recordId, kind: 'field', extraction: 'bold_and_regular_runs' });
      pendingLabel = '';
      continue;
    }
    if (label) {
      const cleanLabel = label.replace(/^\s*(?:v\s*)?\d+(?:[.．、]\d+)*(?:[.．、])?\s*/i, '').trim();
      if (cleanLabel) pendingLabel = cleanLabel;
      continue;
    }
    if (!full) continue;
    if (pendingLabel && regular) {
      facts.push({ section, rowIndex: row.index, cellIndex, paragraphIndex, label: pendingLabel, value: regular, sourceText: full, recordId, kind: 'field', extraction: 'adjacent_paragraphs' });
      pendingLabel = '';
      continue;
    }
    const inline = splitInlineLabel(full);
    if (inline) {
      facts.push({ section, rowIndex: row.index, cellIndex, paragraphIndex, label: inline.label, value: inline.value, sourceText: full, recordId, kind: 'field', extraction: 'inline_label' });
    } else if (regular) {
      facts.push({ section, rowIndex: row.index, cellIndex, paragraphIndex, label: '', value: regular, sourceText: full, recordId, kind: 'note', noteKey: classifyNote(section, regular), extraction: 'unlabelled_paragraph' });
    }
  }
  return facts;
}

function dedupeFacts(facts) {
  const seen = new Set();
  return facts.filter((fact) => {
    const semanticLabel = fact.kind === 'note' ? (fact.noteKey || 'note') : canonicalSlotId(fact.section, fact.label);
    const valueSignature = fact.kind === 'component'
      ? `${fact.value?.name || ''}|${fact.value?.cas || ''}|${fact.value?.concentration || ''}|${fact.itemIndex}`
      : String(fact.value || '');
    const key = [fact.section, fact.rowIndex, semanticLabel, valueSignature].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractComponentFacts(record) {
  const headerIndex = record.rows.findIndex((row) => row.cells.some((cell) => /化学品名称|chemical name/i.test(cell.text))
    && row.cells.some((cell) => /cas(?:编号|号| number)/i.test(cell.text))
    && row.cells.some((cell) => /含量|concentration|%/i.test(cell.text)));
  if (headerIndex < 0) return { facts: [], issues: [{ section: 3, rowIndex: null, issue: 'component_header_unresolved', sourceText: 'Section 3 component columns could not be identified.' }] };
  const header = record.rows[headerIndex];
  const columnKeys = header.cells.map((cell) => {
    const key = normalizeSlotLabel(cell.text);
    if (/化学品名称|chemicalname|成分名称/.test(key)) return 'name';
    if (/cas编号|cas号|casnumber/.test(key)) return 'cas';
    if (/含量|concentration|ww/.test(key)) return 'concentration';
    return null;
  });
  const indexes = Object.fromEntries(['name', 'cas', 'concentration'].map((key) => [key, columnKeys.indexOf(key)]));
  const facts = [];
  const issues = [];
  for (const row of record.rows.slice(headerIndex + 1)) {
    const nonEmpty = row.cells.some((cell) => cell.text?.trim());
    if (!nonEmpty || row.index === headerIndex + 1 && row.cells.every((cell) => /^(?:成分|composition)$/i.test(normalizeSlotLabel(cell.text)))) continue;
    const lines = row.cells.map((cell) => String(cell.text || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean));
    const lengths = ['name', 'cas', 'concentration'].map((key) => lines[indexes[key]]?.length || 0);
    const count = Math.max(...lengths);
    if (new Set(lengths.filter(Boolean)).size > 1) {
      issues.push({ section: 3, rowIndex: row.index, issue: 'component_cell_line_count_mismatch', sourceText: row.cells.map((cell) => cell.text).join(' | ') });
      continue;
    }
    for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
      facts.push({
        section: 3,
        rowIndex: row.index,
        itemIndex,
        label: 'composition_component',
        slotId: 'composition_component',
        value: {
          name: lines[indexes.name]?.[itemIndex] || '',
          cas: lines[indexes.cas]?.[itemIndex] || '',
          concentration: lines[indexes.concentration]?.[itemIndex] || '',
        },
        sourceText: row.cells.map((cell) => cell.text).join(' | '),
        recordId: record.id,
        kind: 'component',
        extraction: 'registered_three_column_component_grid',
      });
    }
  }
  return { facts, issues };
}

function sourceFactsForRecord(record) {
  const facts = [];
  const issues = [];
  if (record.sectionNumber === 3) {
    const components = extractComponentFacts(record);
    facts.push(...components.facts);
    issues.push(...components.issues);
  }
  for (const row of record.rows.slice(1)) {
    if (record.sectionNumber === 3 && row.index >= 3) continue;
    let rowFacts = [];
    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex += 1) {
      rowFacts.push(...splitParagraphFacts(record.sectionNumber, row, row.cells[cellIndex], cellIndex, record.id));
    }
    const priorFieldFacts = record.fieldCandidates?.filter((candidate) => candidate.source?.label_cell?.row === row.index)
      .map((candidate) => ({
        section: record.sectionNumber,
        rowIndex: row.index,
        cellIndex: candidate.source.label_cell.column,
        label: candidate.label,
        value: candidate.value,
        sourceText: `${candidate.label}：${candidate.value}`,
        recordId: record.id,
        kind: 'field',
        extraction: candidate.method,
      })) || [];
    rowFacts = dedupeFacts([...rowFacts, ...priorFieldFacts]);
    const fieldFacts = rowFacts.filter((fact) => fact.kind === 'field' && fact.value);
    if (fieldFacts.length) {
      const filtered = fieldFacts.filter((fact) => !(record.sectionNumber === 11
        && canonicalSlotId(11, fact.label) === 'acute_toxicity'
        && /^(?:经口|食入|吞咽|吸入|经皮|皮肤)\s*[：:]/.test(String(fact.value || '').trim())));
      facts.push(...filtered);
      continue;
    }
    const nonEmptyCells = row.cells.filter((cell) => cell.text?.trim());
    const structuralOnly = nonEmptyCells.length > 0 && nonEmptyCells.every((cell) => {
      const labels = extractCellLabel(cell);
      return labels.length > 0 && !(cell.valueText || '').trim();
    });
    if (structuralOnly) continue;
    const rowText = row.cells.map((cell) => cell.text || '').filter(Boolean).join('\n').trim();
    if (!rowText) continue;
    const firstCellEmpty = !row.cells[0]?.text?.trim();
    const noteText = rowFacts.filter((fact) => fact.kind === 'note').map((fact) => fact.value).filter(Boolean).join('\n') || rowText;
    if (firstCellEmpty && facts.length) {
      const previous = [...facts].reverse().find((fact) => fact.section === record.sectionNumber && fact.rowIndex === row.index - 1 && fact.kind === 'field');
      if (previous) {
        previous.value = `${previous.value}\n${noteText}`;
        previous.mergedContinuationRows = [...(previous.mergedContinuationRows || []), row.index];
        continue;
      }
    }
    facts.push({ section: record.sectionNumber, rowIndex: row.index, cellIndex: 0, label: '', value: noteText, sourceText: rowText, recordId: record.id, kind: 'note', noteKey: classifyNote(record.sectionNumber, noteText), extraction: 'unlabelled_row' });
  }
  return { facts: dedupeFacts(facts), issues };
}

export function extractSourceFacts(engine) {
  const facts = [];
  const issues = [];
  for (const record of engine?.records || []) {
    if (record.kind !== 'table' || !Number(record.sectionNumber) || record.sectionNumber < 1 || record.sectionNumber > 16) continue;
    const extracted = sourceFactsForRecord(record);
    facts.push(...extracted.facts);
    issues.push(...extracted.issues);
  }
  facts.forEach((fact, index) => {
    fact.factId = `FACT-${String(index + 1).padStart(4, '0')}`;
    fact.sourceLocator = `${fact.recordId}.row[${fact.rowIndex}]${fact.cellIndex == null ? '' : `.cell[${fact.cellIndex}]`}`;
  });
  return { facts, issues, coverage: engine?.coverage || {}, warnings: engine?.warnings || [] };
}

function extractCellLabel(cell, rowCellCount = 2) {
  if (cell?.labelText?.trim()) return cell.labelText.split('\n').map((item) => item.trim()).filter(Boolean);
  const inline = splitInlineLabel(cell?.text || '');
  if (inline) return [inline.label];
  const text = String(cell?.text || '').trim();
  if (rowCellCount === 1 || cell?.kind === 'note') return [];
  if (/^[^\n：:]{1,100}[：:]$/.test(text)) return [text];
  return [];
}

function targetNoteKey(section, rowText) {
  return classifyNote(section, rowText);
}

export function collectTemplateSlots(engine) {
  const slots = [];
  for (const record of engine?.records || []) {
    if (record.kind !== 'table' || !record.sectionNumber) continue;
    const componentHeaderIndex = record.sectionNumber === 3
      ? record.rows.findIndex((row) => row.cells.some((cell) => /化学品名称|chemical name/i.test(cell.text))
        && row.cells.some((cell) => /cas(?:编号|号| number)/i.test(cell.text)))
      : -1;
    for (const row of record.rows.slice(1)) {
      const rowText = row.cells.map((cell) => cell.text || '').filter(Boolean).join('\n');
      const detectedNoteKey = targetNoteKey(record.sectionNumber, rowText);
      const fixedNoteSlot = ['s11_availability', 's11_reference', 's12_availability', 's12_reference'].includes(detectedNoteKey);
      const labels = fixedNoteSlot ? [] : row.cells.flatMap((cell) => extractCellLabel(cell, row.cells.length));
      const noteKey = labels.length ? null : detectedNoteKey;
      const labelKeys = [...new Set(labels.map((label) => canonicalSlotId(record.sectionNumber, label)))];
      const valueIndexes = row.cells.map((cell, index) => (cell.valueNodes?.length || cell.editable || cell.kind === 'note') ? index : -1).filter((index) => index >= 0);
      const valueCellIndex = valueIndexes.length ? valueIndexes[valueIndexes.length - 1] : (row.cells.length > 1 ? row.cells.length - 1 : 0);
      slots.push({
        slotId: `${record.id}:row[${row.index}]:cell[${valueCellIndex}]`,
        section: record.sectionNumber,
        recordId: record.id,
        rowIndex: row.index,
        valueCellIndex,
        labels,
        labelKeys,
        noteKey,
        rowText,
        cell: row.cells[valueCellIndex] || null,
        row,
        componentRow: record.sectionNumber === 3 && row.cells.length >= 3 && componentHeaderIndex >= 0 && row.index > componentHeaderIndex
          && row.cells.some((cell) => cell.valueNodes?.length || cell.editable),
      });
    }
  }
  return slots;
}

function sourceSlotId(fact) {
  if (fact.kind === 'component') return 'composition_component';
  if (fact.section === 1 && canonicalSlotId(1, fact.label) === 'product_model') return 'product_model';
  if (fact.kind === 'note') return fact.noteKey || null;
  return canonicalSlotId(fact.section, fact.label);
}

function isSourceCompanyField(section, slotId) {
  return section === 1 && ['supplier_name', 'supplier_address', 'telephone', 'fax'].includes(slotId);
}

function isPureMissingValue(value) {
  return MISSING_VALUE.test(String(value || '').trim());
}

function mayMergeIntoNoteSlot(noteKey) {
  return ['s11_availability', 's11_reference', 's12_availability', 's12_reference', 's13_disposal_note'].includes(noteKey);
}

export function buildMappingPlan(sourceEngine, targetEngine) {
  const extracted = extractSourceFacts(sourceEngine);
  const slots = collectTemplateSlots(targetEngine);
  const mappings = [];
  const claimed = new Map();

  for (const fact of extracted.facts) {
    const targetKey = sourceSlotId(fact);
    if (!targetKey) {
      mappings.push({ factId: fact.factId, status: 'unresolved', disposition: null, reason: 'No registered semantic slot for this source note.', fact, targets: [] });
      continue;
    }
    if (targetKey === 'product_model') {
      mappings.push({ factId: fact.factId, status: 'proposed', disposition: 'product_identity', targetSlotId: 'metadata.productModel', fact, targets: [] });
      continue;
    }
    if (isSourceCompanyField(fact.section, targetKey)) {
      mappings.push({ factId: fact.factId, status: 'proposed', disposition: 'company_overlay', targetSlotId: `company.${targetKey}`, fact, targets: [] });
      continue;
    }
    if (fact.section === 3 && fact.kind === 'component') {
      const componentTargets = slots.filter((slot) => slot.section === 3 && slot.componentRow);
      const target = componentTargets[fact.value?.itemIndex ?? fact.itemIndex ?? 0];
      if (!target) {
        mappings.push({ factId: fact.factId, status: 'unresolved', disposition: null, reason: 'Component row capacity is insufficient; a source-backed styled row must be added.', fact, targets: [] });
      } else {
        mappings.push({ factId: fact.factId, status: 'proposed', disposition: 'mapped', targetSlotId: target.slotId, target, fact, targets: [target] });
      }
      continue;
    }
    let candidates = slots.filter((slot) => slot.section === fact.section && slot.labelKeys.includes(targetKey));
    if (fact.kind === 'note') {
      candidates = slots.filter((slot) => slot.section === fact.section && slot.noteKey === fact.noteKey);
      if (fact.noteKey === 's8_control_parameters') {
        candidates = slots.filter((slot) => slot.section === 8 && slot.labelKeys.includes('engineering_controls'));
      }
      if (fact.noteKey === 's15_regulation') {
        const signature = normalizeSlotLabel(fact.value);
        candidates = candidates.filter((slot) => normalizeSlotLabel(slot.rowText) === signature);
      }
    }
    if (candidates.length === 1) {
      const target = candidates[0];
      const prior = claimed.get(target.slotId);
      const mergeNotes = Boolean(prior && fact.kind === 'note' && mayMergeIntoNoteSlot(fact.noteKey));
      const priorMapping = prior ? mappings.find((item) => item.factId === prior) : null;
      const duplicateNote = Boolean(priorMapping && fact.kind === 'note'
        && String(fact.value || '').trim() === String(priorMapping.fact?.value || '').trim());
      const status = prior && !mergeNotes && !duplicateNote ? 'conflict' : 'proposed';
      if (!prior) claimed.set(target.slotId, fact.factId);
      mappings.push({
        factId: fact.factId,
        status,
        disposition: duplicateNote ? 'duplicate' : mergeNotes ? 'merged' : isPureMissingValue(fact.value) ? 'explicit_missing' : 'mapped',
        targetSlotId: target.slotId,
        target,
        fact,
        targets: candidates,
        mergeWith: mergeNotes ? prior : null,
        reason: prior && !mergeNotes && !duplicateNote ? `Target already claimed by ${prior}.` : null,
      });
    } else {
      mappings.push({
        factId: fact.factId,
        status: candidates.length > 1 ? 'ambiguous' : 'unresolved',
        disposition: null,
        reason: candidates.length ? 'More than one template slot has this semantic label.' : 'No unique template slot has this semantic label.',
        fact,
        targets: candidates,
      });
    }
  }
  return {
    version: '1.0',
    sourceName: sourceEngine?.sourceName || '',
    targetTemplate: targetEngine?.sourceName || '',
    sourceCoverage: extracted.coverage,
    sourceWarnings: extracted.warnings,
    facts: extracted.facts,
    mappingIssues: extracted.issues,
    mappings,
    targetSlots: slots,
    status: 'needs-review',
  };
}

export function reviewMappingPlan(plan, decisions = {}) {
  const reviewed = {
    ...plan,
    mappings: (plan?.mappings || []).map((mapping) => {
      const decision = decisions[mapping.factId];
      if (!decision) return mapping;
      if (!['mapped', 'merged', 'omitted', 'source_only', 'not_applicable', 'duplicate'].includes(decision.disposition)) return mapping;
      return { ...mapping, ...decision, status: 'reviewed' };
    }),
  };
  const blocking = reviewed.mappings.filter((mapping) => ['unresolved', 'ambiguous', 'conflict'].includes(mapping.status)
    || (mapping.status !== 'reviewed' && mapping.disposition !== 'company_overlay' && mapping.disposition !== 'product_identity'));
  reviewed.status = blocking.length ? 'needs-review' : 'reviewed';
  return reviewed;
}
