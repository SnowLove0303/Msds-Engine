/**
 * MSDS Studio 智能匹配中间层引擎 (Smart Matching Engine)
 * 职责：
 * 1. 从非标 DOCX 识别结果中抽取字段；
 * 2. 对齐至 Section 1~16 模板标准插槽；
 * 3. 分离理化限定词（Section 9）、归组 GHS 防范说明（Section 2）、提取组分（Section 3）；
 * 4. 识别未测项并进行安全剪枝（PRUNED）；
 * 5. 输出标准化匹配模型，并支持将匹配结果注入模板编辑器工作副本。
 */

import {
  writeCellValue,
  writeCellLabel,
  setCellAlignment,
  deleteRow,
  addRowAfter,
  addNoteRowAfter,
  renumberRecord,
  recordById,
  auditRecord,
  extractModelFromText,
  updateHeaderFooterData,
} from './docx-engine.js';

// 语义换行策略体系契约 (Semantic Line-Break Policy Contract)
export const LINE_BREAK_POLICIES = {
  FIELD_VALUE: 'field_value',
  SOURCE_PARAGRAPHS: 'source_paragraphs',
  SENTENCE_LINES: 'sentence_lines',
  CODE_LINES: 'code_lines',
  GROUPED_CODE_LINES: 'grouped_code_lines',
  ONE_ROW_PER_ENDPOINT: 'one_row_per_endpoint',
  ONE_ROW_PER_REGULATION: 'one_row_per_regulation',
  COMPACT_SINGLE_LINE: 'compact_single_line',
};

export function resolveSlotLineBreakPolicy(sectionNumber, slotKey) {
  if (sectionNumber === 2) {
    if (slotKey === 'precautionary_statements') return { policy: LINE_BREAK_POLICIES.GROUPED_CODE_LINES, disposition: 'same_cell' };
    if (slotKey === 'ghs_classification' || slotKey === 'hazard_statements' || slotKey?.startsWith('health_hazard')) {
      return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
    }
    return { policy: LINE_BREAK_POLICIES.COMPACT_SINGLE_LINE, disposition: 'same_cell' };
  }
  if (sectionNumber === 3) return { policy: LINE_BREAK_POLICIES.COMPACT_SINGLE_LINE, disposition: 'independent_row' };
  if (sectionNumber === 4) return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
  if (sectionNumber === 5) {
    if (slotKey === 'special_hazards' || slotKey === 'protective_actions') {
      return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
    }
    return { policy: LINE_BREAK_POLICIES.COMPACT_SINGLE_LINE, disposition: 'same_cell' };
  }
  if (sectionNumber === 6) return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
  if (sectionNumber === 7) return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
  if (sectionNumber === 8) return { policy: LINE_BREAK_POLICIES.COMPACT_SINGLE_LINE, disposition: 'same_cell' };
  if (sectionNumber === 9) return { policy: LINE_BREAK_POLICIES.COMPACT_SINGLE_LINE, disposition: 'independent_row' };
  if (sectionNumber === 10) return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
  if (sectionNumber === 11) return { policy: LINE_BREAK_POLICIES.ONE_ROW_PER_ENDPOINT, disposition: 'independent_row' };
  if (sectionNumber === 12) return { policy: LINE_BREAK_POLICIES.ONE_ROW_PER_ENDPOINT, disposition: 'independent_row' };
  if (sectionNumber === 13) return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
  if (sectionNumber === 14) return { policy: LINE_BREAK_POLICIES.SENTENCE_LINES, disposition: 'same_cell' };
  if (sectionNumber === 15) return { policy: LINE_BREAK_POLICIES.ONE_ROW_PER_REGULATION, disposition: 'independent_row' };
  if (sectionNumber === 16) return { policy: LINE_BREAK_POLICIES.COMPACT_SINGLE_LINE, disposition: 'same_cell' };
  return { policy: LINE_BREAK_POLICIES.FIELD_VALUE, disposition: 'same_cell' };
}

// Section 1~16 标准槽位定义与全面中英双语别名库
export const SECTION_SLOT_REGISTRY = {
  1: {
    title: '物料及供应商标识',
    slots: [
      { key: 'product_name', standardLabel: '中文名称：', aliases: ['中文名称', '产品名称', '化学品名称', '中文品名', '物料名称', '商品名称', '品名', 'Product name', 'Chemical name', 'Trade name', 'Product identifier', 'Substance name', 'Material name', '1.1product name', '1.1 product name'] },
      { key: 'english_name', standardLabel: '英文名称：', aliases: ['英文名称', '英文品名', 'English name'] },
      { key: 'model', standardLabel: '产品型号：', aliases: ['产品型号', '型号', '规格型号', '牌号', '产品代号', 'Model', 'Product code', 'Grade', 'Code', 'Type'] },
      { key: 'recommended_use', standardLabel: '推荐用途：', aliases: ['推荐用途', '用途', '产品用途', '限制用途', '推荐的使用', 'Recommended use', 'Identified uses', 'Use of the substance/mixture', 'Intended use', 'Product use suggestions and restrictions', 'Product use suggestions', 'Product use', 'Raw material for coatings', '产品使用建议和使用限制', '产品使用建议'] },
      { key: 'restrictions_on_use', standardLabel: '限制用途：', aliases: ['限制用途', '使用限制', '不推荐的用途', 'Restrictions on use', 'Uses advised against'] },
      { key: 'supplier_name', standardLabel: '供应商名称：', aliases: ['供应商名称', '制造商名称', '生产企业名称', '公司名称', '制造商', '生产商', 'Supplier name', 'Manufacturer', 'Company name', 'Company', 'Details of the supplier', 'Supplier information', 'Name of supplier'] },
      { key: 'address', standardLabel: '地址：', aliases: ['地址', '通讯地址', '公司地址', '生产企业地址', '详细地址', '供应商地址', 'Address', 'Supplier address', 'Supplier Address', 'Location', 'Street', 'Manufacturer address'] },
      { key: 'telephone', standardLabel: '电话：', aliases: ['电话', '联系电话', '公司电话', '业务电话', 'Telephone', 'Tel', 'Phone', 'Contact number'] },
      { key: 'fax', standardLabel: '传真：', aliases: ['传真', '传真号码', 'Fax', 'Fax number'] },
      { key: 'emergency_phone', standardLabel: '应急电话：', aliases: ['应急咨询电话', '应急电话', '24小时应急电话', '化学事故应急咨询电话', '紧急联络电话', 'Emergency telephone', 'Emergency phone', 'Emergency contact', '24h emergency phone'] },
      { key: 'product_type', standardLabel: '化学品分类：', aliases: ['化学品分类', '产品类别', '物料分类', 'Type of chemical', 'Product category', 'Chemical category', 'Category of chemical', '3.1product type', 'Aqueous polyurethane Dispersion'] },
    ],
  },
  2: {
    title: '危险性概述',
    slots: [
      { key: 'emergency_overview', standardLabel: '2.1  紧急情况概述：', aliases: ['2.1  紧急情况概述', '2.1 紧急情况概述', '紧急情况概述', '紧急概述', 'Emergency overview'] },
      { key: 'ghs_classification', standardLabel: '2.2  GHS危险性类别：', aliases: ['2.2  GHS危险性类别', '2.2 GHS危险性类别', '2.1 GHS危险性类别', 'GHS危险性类别', '危险性类别', 'GHS分类', '危害分类', '危险性分类', '物质或混合物的分类', 'GHS classification', 'Classification of the substance or mixture', 'Hazard classification', 'Hazard class', 'Hazards Identification', '2.1 Hazards Identification', 'This product is not classified'] },
      { key: 'label_elements', standardLabel: '2.3  GHS标签要素：', aliases: ['2.3  GHS标签要素', '2.3 GHS标签要素', '2.2 标签要素', 'GHS标签要素', '标签要素', 'GHS label elements', 'Label elements'] },
      { key: 'pictogram', standardLabel: 'GHS象形图：', aliases: ['GHS象形图', '象形图', 'GHS-象形图', 'GHS pictogram', 'Pictogram'] },
      { key: 'signal_word', standardLabel: '2.4  信号词：', aliases: ['2.4  信号词', '2.4 信号词', '2.2 信号词', '信号词', '警示词', 'Signal word', 'Signal words'] },
      { key: 'hazard_statements', standardLabel: '2.5  危险性说明：', aliases: ['2.5  危险性说明', '2.5 危险性说明', '2.3 危险性说明', '危险性说明', '危险说明', '危害说明', '危害陈述', 'H代码', 'Hazard statements', 'Hazard statement', 'H statements', 'Hazard codes'] },
      { key: 'precautionary_statements', standardLabel: '2.6  防范说明：', aliases: ['2.6  防范说明', '2.6 防范说明', '2.4 防范说明', '防范说明', '预防说明', '安全防范措施', '防范措施', 'Precautionary statements', 'Precautionary statement', 'P statements', 'Precautionary codes'] },
      { key: 'physical_hazards', standardLabel: '2.7  物理和化学危险：', aliases: ['2.7  物理和化学危险', '2.7 物理和化学危险', '2.5 物理和化学危险', '物理和化学危险', '理化危险', '物理危险', 'Physical and chemical hazards', 'Physical hazards'] },
      { key: 'health_hazards', standardLabel: '2.8  健康危害：', aliases: ['2.8  健康危害', '2.8 健康危害', '2.6 健康危害', '健康危害', '健康危险', '人体健康危害', 'Health hazards', 'Human health hazards'] },
      { key: 'health_hazard_inhalation', standardLabel: '吸入：', aliases: ['吸入', '吸入：', 'Inhalation'] },
      { key: 'health_hazard_ingestion', standardLabel: '食入：', aliases: ['食入', '食入：', '经口', '吞咽', 'Ingestion'] },
      { key: 'health_hazard_skin', standardLabel: '皮肤：', aliases: ['皮肤', '皮肤：', '经皮', 'Skin'] },
      { key: 'health_hazard_eye', standardLabel: '眼睛：', aliases: ['眼睛', '眼睛：', '眼部', 'Eye'] },
      { key: 'health_hazard_symptoms', standardLabel: '症状和体征：', aliases: ['症状和体征', '症状与体征', '症状和体征：', 'Symptoms and signs', 'Symptoms'] },
      { key: 'environmental_hazards', standardLabel: '2.9  环境危害：', aliases: ['2.9  环境危害', '2.9 环境危害', '2.7 环境危害', '环境危害', '环境危险', '生态危害', 'Environmental hazards', 'Aquatic hazards'] },
      { key: 'other_hazards', standardLabel: '2.10 其他危害：', aliases: ['2.10 其他危害', '2.10其他危害', '2.8 其他危险', '2.3 其他危险', '其他危害', '其他危险', '其他危险性', 'Other hazards', 'Other hazards which do not result in classification'] },
    ],
  },
  3: {
    title: '成分/组成资料',
    slots: [
      { key: 'product_type', standardLabel: '3.1产品类型：', aliases: ['3.1产品类型', '产品类型', '物质/混合物', '纯品/混合物', '单一物质/混合物', 'Substance/Mixture', 'Substance / Mixture', 'Product type', 'Type of product', '3.1product type'] },
      { key: 'components_summary', standardLabel: '3.2 混合物组分：', aliases: ['混合物组分', '组分信息', '成分', '成分/组成信息', '化学品名称', 'Components', 'Composition', 'Ingredients', 'Hazardous ingredients'] },
    ],
  },
  4: {
    title: '急救措施',
    slots: [
      { key: 'skin_contact', standardLabel: '4.1 皮肤接触：', aliases: ['皮肤接触', '接触皮肤', '皮肤', 'Skin contact', 'In case of skin contact', 'Skin', 'Contact with skin'] },
      { key: 'eye_contact', standardLabel: '4.2 眼睛接触：', aliases: ['眼睛接触', '接触眼睛', '眼睛', '眼部接触', 'Eye contact', 'In case of eye contact', 'Eyes', 'Eye'] },
      { key: 'inhalation', standardLabel: '4.3 吸入：', aliases: ['吸入', '吸入后', 'Inhalation', 'If inhaled'] },
      { key: 'ingestion', standardLabel: '4.4 食入：', aliases: ['食入', '食入后', '误服', '吞咽', 'Ingestion', 'If swallowed', 'Mistakenly taken', 'Accidentally swallowed'] },
      { key: 'symptoms', standardLabel: '4.5 最重要的症状和健康影响：', aliases: ['最重要的症状和健康影响', '主要症状', '急性及迟发效应', '一般措施', 'Most important symptoms and effects', 'Most important symptoms', 'Symptoms', 'General measures'] },
      { key: 'medical_treatment', standardLabel: '4.6 对医生的特别提示：', aliases: ['对医生的特别提示', '医生提示', '对保护施救者的忠告', '特别提示', 'Indication of any immediate medical attention', 'Notes to physician'] },
    ],
  },
  5: {
    title: '消防措施',
    slots: [
      { key: 'extinguishing_media', standardLabel: '5.1 适用灭火介质：', aliases: ['适用灭火介质', '灭火介质', '灭火剂', '适用灭火剂', '合适的灭火剂', '合适灭火剂', '合适灭火介质', '5.1合适的灭火剂', '5.1.合适的灭火剂', '灭火方法及灭火剂', 'Suitable extinguishing media', 'Extinguishing media', 'Suitable extinguishing agent'] },
      { key: 'unsuitable_extinguishing_media', standardLabel: '5.2 不合适的灭火剂：', aliases: ['不合适的灭火剂', '不合适灭火剂', '不适用灭火剂', 'Unsuitable extinguishing media', 'Inappropriate extinguishing media', 'Unsuitable extinguishing agent'] },
      { key: 'special_hazards', standardLabel: '5.3 物质或混合物的特殊危害：', aliases: ['物质或混合物的特殊危害', '特别危险性', '特殊危险性', '特别危害', 'Special hazards arising from the substance or mixture', 'Special hazards', 'Specific hazards', 'Special hazards of substances or mixtures', 'Special hazards of substance or mixture'] },
      { key: 'protective_actions', standardLabel: '5.4 消防预防措施和保护设备：', aliases: ['消防预防措施和保护设备', '灭火注意事项及防护措施', '灭火注意事项', '灭火人员防护', '消防人员防护措施', 'Protective actions for firefighters', 'Advice for firefighters', 'Protective equipment for firefighters'] },
    ],
  },
  6: {
    title: '泄漏应急处理',
    slots: [
      { key: 'personal_precautions', standardLabel: '6.1 作业人员防护措施、防护装备和应急处置程序：', aliases: ['作业人员防护措施', '作业人员防护', '应急人员防护', '人身安全防护', '个人预防措施', '个人预防措施、应急程序', '应急程序', 'Personal precautions, protective equipment and emergency procedures', 'Personal precautions'] },
      { key: 'environmental_precautions', standardLabel: '6.2 环境保护措施：', aliases: ['环境保护措施', '环保措施', '防止环境污染措施', 'Environmental precautions'] },
      { key: 'cleanup_methods', standardLabel: '6.3 泄漏化学品的收容、清除方法及所使用的处置材料：', aliases: ['泄漏化学品的收容、清除方法', '清除方法', '泄漏清除方法', '收容方法', '污染物收集和清除的方法', '收集和清除的方法', 'Methods and material for containment and cleaning up', 'Clean-up methods', 'Methods for cleaning up', 'Spill and Leak Procedures', 'Spill and leak'] },
    ],
  },
  7: {
    title: '操作处置与储存',
    slots: [
      { key: 'handling', standardLabel: '7.1 安全操作注意事项：', aliases: ['安全操作注意事项', '操作处置', '操作注意事项', '安全操作防范', 'Precautions for safe handling', 'Handling', 'Handling/Storage Precautions', 'Handling precautions'] },
      { key: 'storage', standardLabel: '7.2 安全储存条件：', aliases: ['安全储存条件', '储存注意事项', '储存条件', '安全储存', 'Conditions for safe storage, including any incompatibilities', 'Storage', 'Storage Period and Temperature', 'Storage period'] },
    ],
  },
  8: {
    title: '接触控制/个体防护',
    slots: [
      { key: 'control_parameters', standardLabel: '8.1 控制参数：', aliases: ['8.1 控制参数', '控制参数', '职业接触限值', '容许浓度', '8.1暴露控制', '暴露控制', '工作场所组分控制参数', '8.1控制参数', '根据EC指令', '无可用的接触限值信息', '接触限值信息', '无可用的接触限值', '根据EC指令2006/121/EG,无可用的接触限值信息', 'Control parameters', 'Exposure limits', 'Occupational exposure limits', 'Exposure Limits'] },
      { key: 'engineering_controls', standardLabel: '8.2 工程控制：', aliases: ['8.2 工程控制', '工程控制', '适当的技术控制', '工程控制方法', '技术控制措施', '8.2暴露控制', 'Engineering controls', 'Appropriate engineering controls', 'Industrial Hygiene/Ventilation Measures', 'Industrial Hygiene', 'Ventilation Measures'] },
      { key: 'respiratory', standardLabel: '呼吸系统防护：', aliases: ['呼吸系统防护', '呼吸防护', '呼吸防护装置', 'Respiratory protection', 'Respiratory Protection'] },
      { key: 'hand_protection', standardLabel: '手部防护：', aliases: ['手部防护', '手防护', '防护手套', 'Hand protection', 'Protective gloves', 'Hand Protection'] },
      { key: 'glove_materials', standardLabel: '防护手套合适材料：', aliases: ['防护手套合适材料', '防护手套的合适材料', '手套合适材料', '合适材料', 'EN 374-3', 'Suitable glove material', 'Glove material'] },
      { key: 'fkm', standardLabel: '氟化橡胶-FKM：', aliases: ['氟化橡胶-FKM', '氟化橡胶 –FKM', '氟化橡胶', 'FKM', 'Fluororubber - FKM', 'Fluororubber'] },
      { key: 'iir', standardLabel: '丁基橡胶-IIR：', aliases: ['丁基橡胶-IIR', '丁基橡胶 –IIR', '丁基橡胶', 'IIR', 'Butyl rubber - IIR', 'Butyl rubber'] },
      { key: 'nbr', standardLabel: '丁腈橡胶-NBR：', aliases: ['丁腈橡胶-NBR', '丁腈橡胶 – NBR', '丁腈橡胶', 'NBR', 'Nitrile rubber - NBR', 'Nitrile rubber'] },
      { key: 'eye_protection', standardLabel: '眼睛防护：', aliases: ['眼睛防护', '眼面部防护', '面部防护', '防护眼镜', 'Eye protection', 'Eye/face protection', 'Eye Protection'] },
      { key: 'skin_protection', standardLabel: '身体防护：', aliases: ['皮肤和身体防护', '身体防护', '防护服', 'Skin protection', 'Body protection', 'Skin and body protection', 'Skin Protection'] },
      { key: 'recommendation', standardLabel: '建议：', aliases: ['建议', '保护措施建议', '防护建议', 'Recommendation', 'Advice', 'Additional Protective Measures'] },
    ],
  },
  9: {
    title: '理化特性',
    slots: [
      { key: 'appearance', standardLabel: '9.1  外观与性状：', aliases: ['外观与性状', '外观', '外 观', '性状', '物态', '状态', '颜色', 'Appearance', 'Form', 'Physical state', 'Color', 'Colour'] },
      { key: 'odor', standardLabel: '9.2  气味：', aliases: ['气味', '嗅觉', '味道', 'Odor', 'Odour', 'Smell'] },
      { key: 'odor_threshold', standardLabel: '9.3  嗅觉阈值：', aliases: ['嗅觉阈值', '嗅觉阀值', '气味阈值', '气味阀值', '嗅觉', 'Odor threshold', 'Odour threshold', 'Olfactory threshold'] },
      { key: 'ph', standardLabel: '9.4  pH值：', aliases: ['pH值', 'pH', '酸碱度', 'PH', 'pH value', 'pH Value'] },
      { key: 'ionicity', standardLabel: '9.5  离子性：', aliases: ['离子性', '离子型', 'Ionicity', 'Ionic nature'] },
      { key: 'boiling_point', standardLabel: '9.6  初沸点和沸程：', aliases: ['初沸点和沸程', '初沸点', '沸程', '沸点', 'Boiling point', 'Initial boiling point and boiling range'] },
      { key: 'flash_point', standardLabel: '9.7  闪点：', aliases: ['闪点', '闪火点', '闭杯闪点', 'Flash point', 'Flash point (closed)'] },
      { key: 'evaporation_rate', standardLabel: '9.8  蒸发速率：', aliases: ['蒸发速率', '挥发速率', 'Evaporation rate'] },
      { key: 'flammability', standardLabel: '9.9  易燃性（固体、气体）：', aliases: ['易燃性（固体、气体）', '易燃性（固态、气态）', '易燃性', '可燃性', 'Flammability (solid, gas)', 'Flammability', 'Flammability (solid, gaseous)'] },
      { key: 'combustion_value', standardLabel: '9.9  燃烧值：', aliases: ['燃烧值', '热值', 'Combustion value', 'Heat of combustion'] },
      { key: 'explosion_limits', standardLabel: '9.10 高/低易燃性或爆炸极限：', aliases: ['高/低易燃性或爆炸极限', '爆炸极限', '爆炸上限/下限', '爆炸高/低极限', 'Explosion limits', 'Explosive limits', 'Flammability limits'] },
      { key: 'vapor_pressure', standardLabel: '9.11 蒸气压：', aliases: ['蒸气压', '蒸汽压', '饱和蒸气压', 'Vapor pressure', 'Vapour pressure'] },
      { key: 'vapor_density', standardLabel: '9.12 蒸气密度：', aliases: ['蒸气密度', '蒸汽密度', '相对蒸气密度', 'Vapor density', 'Vapour density'] },
      { key: 'relative_density', standardLabel: '9.13 相对密度：', aliases: ['相对密度', '密度', '比重', 'Relative density', 'Density'] },
      { key: 'solubility', standardLabel: '9.14 溶解性：', aliases: ['溶解性', '水溶性', '溶解度', 'Solubility', 'Water solubility'] },
      { key: 'partition_coefficient', standardLabel: '9.15 正辛醇/水分配系数：', aliases: ['正辛醇/水分配系数', '分配系数', '辛醇/水分配系数', 'Partition coefficient', 'Partition coefficient: n-octanol/water'] },
      { key: 'auto_ignition_temp', standardLabel: '9.16 自燃温度：', aliases: ['自燃温度', '自燃点', 'Auto-ignition temperature', 'Spontaneous combustion temperature'] },
      { key: 'ignition_temp', standardLabel: '9.17 引燃温度：', aliases: ['引燃温度', '着火温度', 'Ignition temperature'] },
      { key: 'decomposition_temp', standardLabel: '9.18 分解温度：', aliases: ['分解温度', '热分解温度', 'Decomposition temperature'] },
      { key: 'viscosity', standardLabel: '9.19 动力粘度：', aliases: ['动力粘度', '粘度', '运动粘度', '黏度', '粘度/25℃', '粘度/20℃', '粘度/25°C', 'Viscosity', 'Dynamic viscosity', 'Kinematic viscosity'] },
      { key: 'explosive_properties', standardLabel: '9.20 爆炸特性：', aliases: ['爆炸特性', '爆炸性', 'Explosive properties', 'Explosion characteristics'] },
      { key: 'oxidizing_properties', standardLabel: '9.21 氧化特性：', aliases: ['氧化特性', '氧化性', 'Oxidizing properties'] },
      { key: 'dust_explosion', standardLabel: '9.22 粉尘爆炸级别：', aliases: ['粉尘爆炸级别', '粉尘爆炸', 'Dust explosion class', 'Dust explosion', 'Dust explosion level'] },
      { key: 'surface_tension', standardLabel: '9.23 表面张力：', aliases: ['表面张力', 'Surface tension'] },
      { key: 'solid_content', standardLabel: '9.24 固体含量：', aliases: ['固体含量', '固含量', '不挥发物', 'Solid content', 'Solids content'] },
      { key: 'mfft', standardLabel: '9.25 最低成膜温度（MFFT）：', aliases: ['最低成膜温度', '最低成膜温度mfft', '最低成膜温度 (mfft)', 'mfft', '9.18最低成膜温度mfft/', '9.18最低成膜温度', 'Minimum film forming temperature', 'MFFT'] },
      { key: 'tg', standardLabel: '9.26 玻璃化温度（Tg）：', aliases: ['玻璃化温度', '玻璃化温度tg', '玻璃化转变温度', 'tg', '9.19 玻璃化温度tg/℃', '9.19玻璃化温度', 'Glass transition temperature', 'Tg'] },
      { key: 'hydroxyl_value', standardLabel: '9.27 羟值：', aliases: ['羟值', '羟基值', 'hydroxyl value', 'Hydroxyl number', 'Hydroxyl value'] },
      { key: 'other_physical', standardLabel: '9.28 其他物理及化学性质：', aliases: ['其他物理及化学性质', '其他信息', '其他物理化学性质', 'Other information', 'Other physical and chemical properties'] },
    ],
  },
  10: {
    title: '稳定性和反应性',
    slots: [
      { key: 'reactivity', standardLabel: '10.1 反应性：', aliases: ['反应性', '反应危险性', 'Reactivity'] },
      { key: 'stability', standardLabel: '10.2 化学稳定性：', aliases: ['化学稳定性', '稳定性', 'Chemical stability', 'Stability'] },
      { key: 'hazardous_reactions', standardLabel: '10.3 危险反应的可能性：', aliases: ['危险反应的可能性', '危险反应', '可能产生的危险反应', '可能的危害反应', '危害反应', 'Possibility of hazardous reactions', 'Hazardous reactions', 'Possible hazardous reactions'] },
      { key: 'conditions_to_avoid', standardLabel: '10.4 应避免的条件：', aliases: ['应避免的条件', '应避免的条件（如静电、撞击或振动）', '避免接触的条件', 'Conditions to avoid'] },
      { key: 'incompatible_materials', standardLabel: '10.5 不相容的物质：', aliases: ['不相容的物质', '禁配物', '应避免的物质', 'Incompatible materials'] },
      { key: 'hazardous_decomposition', standardLabel: '10.6 危险的分解产物：', aliases: ['危险的分解产物', '分解产物', '有害燃烧产物', 'Hazardous decomposition products'] },
    ],
  },
  11: {
    title: '毒理学信息',
    slots: [
      { key: 'acute_toxicity', standardLabel: '11.1 急性毒性：', aliases: ['急性毒性', '毒理学研究', '无可用的毒理学研究', '类似产品的风险评估数据', 'Acute toxicity'] },
      { key: 'acute_toxicity_oral', standardLabel: '经口：', aliases: ['经口', '急性经口毒性', '急性毒性，经口', '半数致死剂量(LD50) 大鼠', 'Oral', 'Acute oral toxicity'] },
      { key: 'acute_toxicity_inhalation', standardLabel: '吸入：', aliases: ['吸入', '急性吸入毒性', '急性毒性，吸入', '半数致死浓度(LC50)', 'Inhalation', 'Acute inhalation toxicity'] },
      { key: 'acute_toxicity_dermal', standardLabel: '经皮：', aliases: ['经皮', '急性经皮毒性', '急性毒性，经皮', '半数致死剂量(LD50) 兔', 'Dermal', 'Acute dermal toxicity'] },
      { key: 'skin_corrosion', standardLabel: '11.2 皮肤腐蚀或刺激：', aliases: ['皮肤腐蚀或刺激', '皮肤刺激', '皮肤腐蚀/刺激', 'Skin corrosion/irritation', 'Skin irritation', 'Main skin irritation'] },
      { key: 'eye_damage', standardLabel: '11.3 严重眼损伤或刺激：', aliases: ['严重眼损伤或刺激', '严重眼损伤/刺激', '眼睛刺激', '主要粘膜刺激性', '主要粘膜刺激', '刺激眼睛', 'Serious eye damage/irritation', 'Serious eye damage/eye irritation', 'Eye irritation', 'Main mucosal irritation'] },
      { key: 'sensitization', standardLabel: '11.4 呼吸道或皮肤过敏：', aliases: ['呼吸道或皮肤过敏', '呼吸或皮肤过敏', '致敏性', '皮肤过敏', '过敏特性', '不是皮肤过敏物质', '物种: 人类', '物种：人类', '分类: 不是皮肤过敏物质', '结果: 对志愿者做的皮肤接触试验证明没有过敏特性', '皮肤接触试验', 'Sensitization', 'Skin sensitization', 'Respiratory sensitization'] },
      { key: 'germ_mutagenicity', standardLabel: '11.5 生殖细胞突变性：', aliases: ['生殖细胞突变性', '生殖细胞致突变性', '致突变性', 'Germ cell mutagenicity', 'Mutagenicity'] },
      { key: 'carcinogenicity', standardLabel: '11.6 致癌性：', aliases: ['致癌性', '致癌作用', 'Carcinogenicity'] },
      { key: 'reproductive_toxicity', standardLabel: '11.7 生殖毒性：', aliases: ['生殖毒性', '发育毒性', 'Reproductive toxicity'] },
      { key: 'reproductive_fertility', standardLabel: '生育力', aliases: ['生育力', '生殖毒性/生育力', '生殖毒性／生育力', 'Fertility', 'Reproductive toxicity/fertility'] },
      { key: 'reproductive_teratogenicity', standardLabel: '致畸形', aliases: ['致畸形', '生殖毒性/致畸形', '生殖毒性／致畸形', '畸形', 'Teratogenicity', 'Teratogenic'] },
      { key: 'in_vitro_genotoxicity', standardLabel: '体外遗传毒性', aliases: ['体外遗传毒性', '体外基因毒性', '体外染色体畸变试验', 'Ames试验', 'In vitro genotoxicity'] },
      { key: 'stot_single', standardLabel: '11.8 特异性靶器官系统毒性——一次接触：', aliases: ['特异性靶器官系统毒性——一次接触', 'STOT一次接触', '靶器官系统毒性-一次接触', 'STOT single exposure', 'Specific target organ toxicity - single exposure'] },
      { key: 'stot_repeated', standardLabel: '11.9 特异性靶器官系统毒性——反复接触：', aliases: ['特异性靶器官系统毒性——反复接触', 'STOT反复接触', '靶器官系统毒性-反复接触', '重复剂量中毒', '重复剂量中毒：经口', '重复剂量中毒：吸入', '病理变化', '附加信息', 'STOT repeated exposure', 'Specific target organ toxicity - repeated exposure'] },
      { key: 'aspiration_hazard', standardLabel: '11.10 吸入危害：', aliases: ['吸入危害', '吸入危险', 'Aspiration hazard'] },
    ],
  },
  12: {
    title: '生态学信息',
    slots: [
      { key: 'ecotoxicity', standardLabel: '12.1 生态毒性：', aliases: ['生态毒性', '急性水生毒性', '水生生物毒性', '生态毒理学研究', '无可用的生态毒理学研究', 'Ecotoxicity', 'Aquatic toxicity'] },
      { key: 'persistence', standardLabel: '12.2 持久性和降解性：', aliases: ['持久性和降解性', '降解性', '生物降解性', 'Persistence and degradability', 'Durability and degradability'] },
      { key: 'bioaccumulation', standardLabel: '12.3 潜在的生物累积性：', aliases: ['潜在的生物累积性', '生物蓄积性', '生物累积性', 'Bioaccumulative potential'] },
      { key: 'soil_mobility', standardLabel: '12.4 土壤中的迁移性：', aliases: ['土壤中的迁移性', '土壤迁移性', 'Mobility in soil'] },
      { key: 'other_adverse_effects', standardLabel: '12.5 其他不良影响：', aliases: ['其他不良影响', '其他有害效应', '环境危害总结', '其他不利的影响', '12.3其他', '其他', 'Other adverse effects', 'Other'] },
    ],
  },
  13: {
    title: '废弃处置',
    slots: [
      { key: 'waste_treatment_methods', standardLabel: '13.1 废弃处置方法：', aliases: ['废弃处置方法', '废弃化学品处置', '废弃物处置方法', '残余废弃物处置', '欧洲废弃物分类', '欧洲废弃物分类（EWC）', 'EWC', 'Waste treatment methods', 'Waste Disposal Method'] },
      { key: 'contaminated_packaging', standardLabel: '13.2 受污染的包装物：', aliases: ['受污染的包装物', '污染包装物处置', '受污染包装处置', '包装处置', '处理方法', 'Contaminated packaging', 'Empty Container Precautions'] },
    ],
  },
  14: {
    title: '运输信息',
    slots: [
      { key: 'road_rail', standardLabel: '14.1 公路和铁路运输：', aliases: ['公路和铁路运输', '公路和铁路', '陆运', '陆路运输', 'Road and rail transport', 'ADR/RID', 'Road transport', 'Rail transport', 'Road and railway transport', 'Road and railway transportation', '14.1road and railway transportation', 'adg'] },
      { key: 'sea', standardLabel: '14.2 海上运输：', aliases: ['海上运输', '海运', '水路运输', 'Sea transport', 'IMDG', 'Maritime transport', 'Sea transportation', '14.2sea transportation'] },
      { key: 'air', standardLabel: '14.3 空运：', aliases: ['空运', '航空运输', 'Air transport', 'IATA', 'ICAO', 'Air transportation', '14.3air transportation'] },
      { key: 'special_precautions', standardLabel: '14.4 用户特殊注意事项：', aliases: ['用户特殊注意事项', '运输注意事项', '使用者特殊防范措施', '特殊防范措施', 'Special precautions for user', 'Special precautions', 'Special precautions for users', '14.4special precautions for users'] },
      { key: 'un_number', standardLabel: '14.5 联合国危险货物编号（UN号）：', aliases: ['联合国危险货物编号', 'UN号', 'UN编号', '联合国编号', 'UN number', 'UN No.', 'UN No'] },
      { key: 'proper_shipping_name', standardLabel: '14.6 联合国正确运输名称：', aliases: ['联合国正确运输名称', '正确运输名称', '运输品名', 'UN proper shipping name', 'Proper shipping name'] },
      { key: 'transport_hazard_class', standardLabel: '14.7 运输危险性类别：', aliases: ['运输危险性类别', '危险类别', '运输危害分类', 'Transport hazard class', 'Hazard class'] },
      { key: 'packing_group', standardLabel: '14.8 包装组：', aliases: ['包装组', '包装类别', '包装等级', 'Packing group', 'PG'] },
      { key: 'marine_pollutant', standardLabel: '14.9 海洋污染物（是/否）：', aliases: ['海洋污染物', '海洋污染物（是/否）', '环境危害', 'Marine pollutant'] },
    ],
  },
  15: {
    title: '法规信息',
    slots: [
      { key: 'safety_regulations', standardLabel: '15.1 物质或混合物的相关安全、健康和环保法律法规：', aliases: ['物质或混合物的相关安全、健康和环保法律法规', '化学品安全标签编写规定', '法规信息', '安全、健康和环境法规', '国内化学品安全管理法规', 'Safety, health and environmental regulations', 'Safety regulations', 'Safety, health and environmental laws and regulations related to substances or mixtures', 'Safety, health and environmental laws and regulations'] },
      { key: 'other_regulations', standardLabel: '其它的规定：', aliases: ['其它的规定', '其它规定', '其他规定', 'Other regulations'] },
      { key: 'regulatory_requirements', standardLabel: '符合下列法规要求：', aliases: ['符合下列法规要求', '法规要求', 'Meet the following regulatory requirements'] },
      { key: 'reg_591', standardLabel: '危险化学品安全管理条例，国务院令591号', aliases: ['危险化学品安全管理条例', '国务院令591号', '591号', '国务院令344号', '344号', 'Regulations on the safety management of dangerous chemicals', 'Regulations on the safety management of hazardous chemicals', 'Decree No. 591 of the State Council'] },
      { key: 'gb_16483', standardLabel: 'GB/T 16483 化学品安全技术说明书内容和项目顺序', aliases: ['GB/T 16483', 'GB/T16483', '16483', 'Contents and item sequence of GB/T 16483', 'GB / T 16483', 'GB/T 16483-2008', 'technical specification for chemical safety'] },
      { key: 'gb_13690', standardLabel: 'GB 13690 化学品分类和危险性公示通则', aliases: ['GB 13690', 'GB13690', '13690', 'general rules for classification', 'GB 13690-2009'] },
      { key: 'gb_30000', standardLabel: 'GB 30000.2-29 化学品分类和标签规范', aliases: ['GB 30000', 'GB30000', '30000', 'GB 30000.2-29', 'GB 20576', 'GB 20598', 'GB 20576- GB20598', 'GB20576', 'GB20598', 'GB 20576- GB20598 化学品分类，警示标签和警', 'specification for classification'] },
      { key: 'gb_15258', standardLabel: 'GB 15258 化学品安全标签编写规定', aliases: ['GB 15258', 'GB15258', '15258', 'regulations on Preparation of chemical safety labels'] },
    ],
  },
  16: {
    title: '其他信息',
    slots: [
      { key: 'disclaimer', standardLabel: '免责声明：', aliases: ['免责声明', '免责条款', '就我们所掌握的知识', 'According to our knowledge', 'Disclaimer', 'Notice'] },
      { key: 'other_info', standardLabel: '16.1 其他信息：', aliases: ['其他信息', '编制信息', '参考文献', '培训建议', 'Other information'] },
    ],
  },
};

/**
 * 冠志 CN 标准模板显式绑定义 (CN Template Profile)
 */
export const CN_TEMPLATE_PROFILE = {
  section4: [
    { key: 'symptoms', labelMatch: /一般措施/i, defaultFallback: '立即脱掉所有被污染的衣物。' },
    { key: 'ingestion', labelMatch: /误服/i, defaultFallback: '若意外吞食，不要催吐，立即就医。无意识时，不要经口喂食任何食物。' },
    { key: 'eye_contact', labelMatch: /接触眼睛/i, defaultFallback: '立即翻起上下眼睑用大量缓和流动的水清洗眼睛至少20 分钟。且将头倾斜，避免化学品流入另一只未受污染的眼睛，并立即就医。' },
    { key: 'skin_contact', labelMatch: /接触皮肤/i, defaultFallback: '立即用肥皂和大量的水冲洗。若发生皮肤反应，就医。' },
    { key: 'inhalation', labelMatch: /吸入/i, defaultFallback: '一旦吸入，如有不适，就医。' },
  ],
  section15: [
    { key: 'reg_591', defaultVal: '危险化学品安全管理条例，国务院令591号' },
    { key: 'gb_16483', defaultVal: 'GB/T 16483 化学品安全技术说明书内容和项目顺序' },
    { key: 'gb_13690', defaultVal: 'GB 13690 化学品分类和危险性公示通则' },
    { key: 'gb_30000', defaultVal: 'GB 30000.2-29 化学品分类和标签规范' },
    { key: 'gb_15258', defaultVal: 'GB 15258 化学品安全标签编写规定' },
  ],
};

/**
 * 剥离自造序号前缀与脱敏器
 * 支持：1.1 / 9.3 / 1. / 1、 / (1) / （1） / [1] / ① / 一、
 * 容错支持多重句点（4.1.）及紧凑相连英文字符（14.1Road）
 */
export function stripNumberingPrefix(text) {
  if (!text) return { coreLabel: '', prefix: '', rawLocator: '' };
  const raw = String(text).trim();
  const match = raw.match(/^\s*(?:v)?(?:(\d{1,2}(?:[\.．、]\d{1,2})+[\.．、]?|\d{1,2}[\.．、]|[（\(]\d{1,2}[）\)]|\[\d{1,2}\]|[①②③④⑤⑥⑦⑧⑨⑩]|[一二三四五六七八九十]+[、.．]))\s*/i);
  if (match) {
    const prefix = match[0].trim();
    const coreLabel = raw.slice(match[0].length).replace(/^[\.．、\s]+/, '').trim();
    return { coreLabel, prefix, rawLocator: raw };
  }
  return { coreLabel: raw, prefix: '', rawLocator: raw };
}

/**
 * 标签长度与字数合规判定器
 * 用户铁律约束：标签一般字很少，除表格 Section 标题外，若超出字数阈值则一般是值，应修正为普通值。
 * 中文：以汉字字数度量，通常 <= 12 个汉字（保护“生产企业应急咨询电话”等标准字段）；
 * 英文：以单词数与字符数度量，通常 <= 10 个英文单词且核心字符 <= 50 个字符。
 */
export function isLabelLengthAcceptable(labelStr) {
  if (!labelStr) return false;
  const isSectionHeader = /第\s*\d{1,2}\s*部分|section\s*\d{1,2}/i.test(labelStr);
  if (isSectionHeader) return true;

  const isChinese = /[\u4e00-\u9fa5]/.test(labelStr);
  const core = stripNumberingPrefix(labelStr).coreLabel.replace(/[:：\s\u3000]/g, '');
  if (isChinese) {
    return core.length >= 2 && core.length <= 12;
  }
  const words = labelStr.trim().split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 10 && core.length >= 2 && core.length <= 50;
}

/**
 * 上下文感知的高保真冒号切分器
 * 严格保护时间格式 (12:00)、化学比例 (1:1 / 1:50) 及标准号，防止行内误切
 * 结合字数阈值：标签通常 <= 10 字（Section 标题除外），超长句子中的冒号不视为标签分隔符
 */
export function safeColonSplit(text, context = {}) {
  if (!text) return { label: '', value: '', hasColon: false };
  const str = String(text).trim();
  const colonRegex = /[:：]/g;
  let match;
  let splitIndex = -1;

  while ((match = colonRegex.exec(str)) !== null) {
    const idx = match.index;
    const prevChar = str[idx - 1] || '';
    const nextChar = str[idx + 1] || '';

    // 保护时间与化学配比 (如 12:00, 1:1, 1:50)
    if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
      continue;
    }
    // 保护 URL 协议 (http:, https:)
    const prefixSub = str.slice(Math.max(0, idx - 5), idx).toLowerCase();
    if (prefixSub.endsWith('http') || prefixSub.endsWith('https')) {
      continue;
    }

    const candidateLabel = str.slice(0, idx).trim();

    // 阈值检查：标签一般不超过 10 个字（Section 标题除外，中英文自适应度量）
    if (!isLabelLengthAcceptable(candidateLabel)) {
      continue;
    }

    splitIndex = idx;
    break;
  }

  if (splitIndex !== -1) {
    const label = str.slice(0, splitIndex).trim();
    const value = str.slice(splitIndex + 1).trim();
    return { label, value, hasColon: true };
  }

  return { label: '', value: str, hasColon: false };
}

/**
 * Run 级粗细体样式角色分离器
 * 核心准则：
 * 1. 同一行中若已有父级标签 (context.hasParentLabel)，任何加粗内容一律归纳为值 (Value)；
 * 2. 标签言简意赅，字数极少；若加粗文本字数超出 10 个字（除大章节 Section 标题外），应自动降级修正为普通值 (Value)；
 * 3. 仅在行首、独立存在且 <= 10 个字（或匹配已知别名库）的加粗 Run 集合才被提取为 rawLabel。
 */
function decomposeSingleParagraphRuns(cellOrParagraph, context = {}) {
  let runs = [];
  if (Array.isArray(cellOrParagraph.runs)) {
    runs = cellOrParagraph.runs;
  } else if (Array.isArray(cellOrParagraph.paragraphs)) {
    runs = cellOrParagraph.paragraphs.flatMap((p) => p.runs || []);
  }

  const rawText = cellOrParagraph.text || '';
  if (!runs.length) {
    const colonResult = safeColonSplit(rawText, context);
    if (colonResult.hasColon) {
      return {
        rawLabel: colonResult.label,
        rawValue: colonResult.value,
        isDemotedFromBold: false,
      };
    }
    return { rawLabel: '', rawValue: rawText, isDemotedFromBold: false };
  }

  const hasParentInLine = Boolean(context.hasParentLabel);
  const labelRuns = [];
  const valueRuns = [];
  let isDemoted = false;
  let labelCompleted = false;

  // Calculate full bold text upfront: long bold sentences (>12 chars) without colon are values, not labels
  const allBoldText = runs.filter((r) => r.bold).map((r) => r.text || '').join('').trim();
  const boldHasColon = /[:：]/.test(allBoldText);
  const boldIsLong = allBoldText.length > 12 && !boldHasColon;
  if (boldIsLong && !hasParentInLine) {
    isDemoted = true;
    labelCompleted = true;
  }

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const text = run.text || '';
    if (!text) continue;

    if (run.bold && !labelCompleted && !hasParentInLine) {
      if (!isLabelLengthAcceptable(text)) {
        // 加粗超出字数阈值，修正为普通值！
        isDemoted = true;
        valueRuns.push(text);
        labelCompleted = true;
      } else {
        labelRuns.push(text);
        if (/[:：]\s*$/.test(text)) {
          labelCompleted = true;
        }
      }
    } else {
      valueRuns.push(text);
      labelCompleted = true;
    }
  }

  let rawLabel = labelRuns.join('').trim();
  let rawValue = valueRuns.join('').trim();

  // Safeguard: If accumulated rawLabel exceeds acceptable length and lacks colon, demote to value
  if (rawLabel && !isLabelLengthAcceptable(rawLabel) && !safeColonSplit(rawLabel).hasColon) {
    rawValue = `${rawLabel} ${rawValue}`.trim();
    rawLabel = '';
    isDemoted = true;
  }

  // 重点防护：Word 局部字符加粗陷阱（例如首字母大写 'R'/'S'/'A' 加粗而冒号及后续字符未加粗）
  // 或整个文本存在高保真冒号切分，优先采信更完备的冒号结构
  const colonResult = safeColonSplit(rawText, context);
  if (colonResult.hasColon && isLabelLengthAcceptable(colonResult.label)) {
    const isSingleLetterTrap = rawLabel.replace(/[\s\d\.\:\-]/g, '').length <= 2 && !/[:：]/.test(rawLabel);
    if (!rawLabel || isSingleLetterTrap) {
      return {
        rawLabel: colonResult.label,
        rawValue: colonResult.value,
        isDemotedFromBold: isDemoted,
      };
    }
  }

  // 若加粗未提取出 Label，但 rawValue 具备安全冒号且候选标签合法，尝试冒号切分
  if (!rawLabel && rawValue) {
    const colonResult = safeColonSplit(rawValue, context);
    if (colonResult.hasColon && isLabelLengthAcceptable(colonResult.label)) {
      return {
        rawLabel: colonResult.label,
        rawValue: colonResult.value,
        isDemotedFromBold: isDemoted,
      };
    }
  }

  return {
    rawLabel,
    rawValue,
    isDemotedFromBold: isDemoted,
  };
}

/**
 * Run 级粗细体样式角色分离器
 * 核心准则：
 * 1. 同一行中若已有父级标签 (context.hasParentLabel)，任何加粗内容一律归纳为值 (Value)；
 * 2. 标签言简意赅，字数极少；若加粗文本字数超出 10 个字（除大章节 Section 标题外），应自动降级修正为普通值 (Value)；
 * 3. 仅在行首、独立存在且 <= 10 个字（或匹配已知别名库）的加粗 Run 集合才被提取为 rawLabel；
 * 4. 多段落单元格保留各段落之间的逻辑换行 (\n)，杜绝段落边界被错误拼接消除。
 */
export function decomposeRunsToFact(cellOrParagraph, context = {}) {
  if (!cellOrParagraph) {
    return { rawLabel: '', rawValue: '', isDemotedFromBold: false };
  }

  const paragraphs = Array.isArray(cellOrParagraph.paragraphs)
    ? cellOrParagraph.paragraphs
    : (cellOrParagraph.runs ? [cellOrParagraph] : []);

  if (paragraphs.length > 1) {
    // 多段落单元格：段落 0 提取标签与段落0的值，后续段落全部作为独立的逻辑行保留
    const p0Fact = decomposeSingleParagraphRuns(paragraphs[0], context);
    const pSubValues = [];
    if (p0Fact.rawValue.trim()) {
      pSubValues.push(p0Fact.rawValue.trim());
    }
    for (let pIdx = 1; pIdx < paragraphs.length; pIdx++) {
      const pFact = decomposeSingleParagraphRuns(paragraphs[pIdx], { hasParentLabel: true });
      const pText = (pFact.rawValue || paragraphs[pIdx].text || '').trim();
      if (pText) {
        pSubValues.push(pText);
      }
    }
    return {
      rawLabel: p0Fact.rawLabel,
      rawValue: pSubValues.join('\n'),
      isDemotedFromBold: p0Fact.isDemotedFromBold,
    };
  }

  if (paragraphs.length === 1) {
    return decomposeSingleParagraphRuns(paragraphs[0], context);
  }

  return decomposeSingleParagraphRuns({ runs: cellOrParagraph.runs || [], text: cellOrParagraph.text || '' }, context);
}

/**
 * 通用文本保真清洗器
 * 1. 剥离零宽字符与不可见空白；
 * 2. 规范软换行；
 * 3. 严格区分列表斜杠 ( / ) 与紧凑固有名词 (通风/排气, 物质/混合物, 是/否) 及单位 (mg/m³, g/cm³)；
 * 4. 保真度量衡、温度 (℃) 与化学范围符号 (~)。
 */
export function sanitizeTypographyAndSymbols(text) {
  if (text == null) return '';
  let s = String(text);

  // 1. 剔除零宽字符与 BOM
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 2. 规范化换行
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. 斜杠分类器：保护紧凑固定搭配与度量衡单位，禁止将普通斜杠机械转换为换行 (OW-LineBreak-01)
  const protectedCompounds = [
    '通风/排气', '局部排气/通风', '机械通风/局部排气',
    '物质/混合物', '纯品/混合物', '单一物质/混合物',
    '熔点/凝固点', '初沸点/沸程', '正辛醇/水分配系数', '高/低',
    '高/低易燃性', '是/否', '有/无', '皮肤腐蚀/刺激', '严重眼损伤/刺激',
    '呼吸道/皮肤过敏', '呼吸/皮肤过敏', '生殖细胞/突变',
  ];
  for (const pc of protectedCompounds) {
    const parts = pc.split('/');
    const reg = new RegExp(`${parts[0]}\\s*\\/\\s*${parts[1]}`, 'g');
    s = s.replace(reg, pc);
  }
  s = s.replace(/GB\s*\/\s*T/gi, 'GB/T');
  s = s.replace(/ISO\s*\/\s*IEC/gi, 'ISO/IEC');
  s = s.replace(/w\s*\/\s*w/gi, 'w/w');
  s = s.replace(/v\s*\/\s*v/gi, 'v/v');
  s = s.replace(/mg\s*\/\s*(?:m³|m3|L|kg)/gi, (m) => m.replace(/\s+/g, ''));
  s = s.replace(/g\s*\/\s*(?:cm³|cm3|mL|L)/gi, (m) => m.replace(/\s+/g, ''));

  // 保护普通连续斜杠（如粉尘/烟/气体/蒸气/喷雾），不被切断，消除斜杠两端多余空格
  s = s.replace(/\s*\/\s*/g, '/');

  // 4. 清理水平多余空格，保留换行
  s = s.replace(/[ \t]+/g, ' ');

  // 5. 行首尾去空格，压缩无意义多余空行
  s = s.split('\n').map((line) => line.trim()).filter((line, idx, arr) => {
    if (!line && idx > 0 && !arr[idx - 1]) return false;
    return true;
  }).join('\n').trim();

  return s;
}

/**
 * 清洗与规范化文本 (保持向后兼容)
 */
export function cleanRawText(text) {
  return sanitizeTypographyAndSymbols(text);
}

/**
 * 剥离前导序号与尾随冒号，生成用于语义索引的规范化键
 */
export function normalizeLabelKey(rawLabel) {
  if (!rawLabel) return '';
  const stripped = stripNumberingPrefix(rawLabel).coreLabel;
  return stripped
    .replace(/[:：\s]+$/, '')
    .trim()
    .toLowerCase();
}

/**
 * 判断是否为纯缺失占位符 (True Missing Placeholder)
 */
export function isPureMissingValue(valueText) {
  if (!valueText) return true;
  const t = String(valueText).replace(/[\s\u3000]/g, '').toLowerCase();
  if (!t || t === '-' || t === '--' || t === '/' || t === '—' || t === '无' || t === '暂无') return true;
  if (/^(?:无数据|无资料|未测|未测定|未提供|不详|无适用资料|未分类|nodata|notavailable|na|n\/a|none|nil)$/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * 实质否定结论判定 (Substantive Negative Findings Protection)
 * 绝对白名单保护：初沸点以下无闪点、无危险反应、非危险品、未满足分类标准等
 * 即使含有"无"字，亦属于合规有效的技术结论，100% 保持有效，严禁剪枝！
 */
export function isSubstantiveNegativeFinding(valueText) {
  if (!valueText) return false;
  const t = String(valueText).trim();
  const negativePatterns = [
    /不适用/i,
    /非危险品/i,
    /非易燃/i,
    /无危险反应/i,
    /初沸点以下无闪点/i,
    /未满足分类标准/i,
    /无刺激/i,
    /无危害/i,
    /不具燃爆性/i,
    /无已知重大影响/i,
    /无敏化/i,
    /无腐蚀/i,
    /不燃/i,
    /无水生毒性/i,
    /无致突变/i,
    /非致癌/i,
    /无生殖毒性/i,
    /无特异性靶器官/i,
    /未列入/i,
    /豁免/i,
    /无须标签/i,
    /not classified/i,
    /not applicable/i,
    /no hazardous reaction/i,
    /no flash point/i,
    /non-hazardous/i,
    /non-flammable/i,
  ];

  return negativePatterns.some((pattern) => pattern.test(t));
}

/**
 * 判断文本是否代表无数据或未测 (保持向后兼容)
 * 注意：实质否定结论绝对不视为缺失！
 */
export function isMissingOrUnmeasured(valueText) {
  if (isSubstantiveNegativeFinding(valueText)) {
    return false;
  }
  return isPureMissingValue(valueText);
}

/**
 * 槽位规范化键生成
 */
export function canonicalSlotKey(sectionNumber, slotKey) {
  return `s${sectionNumber}:${slotKey}`;
}

/**
 * 理化测试条件限定词前置解耦器 (Pre-Matching Qualifier Decoupler)
 * 提取括号中的限定条件（如“（1%水溶液）”、“(25℃, 4号转子)”），返回纯化的 coreLabel 与 conditionQualifier
 */
export function preExtractConditionQualifier(text) {
  if (!text) return { coreLabel: '', conditionQualifier: '' };
  const raw = String(text).trim();
  const match = raw.match(/((?:[（\(][^）\)]+[）\)])|(?:\/[0-9]+(?:\.[0-9]+)?(?:℃|°C|C|K|mPa|s|%|g|ml))|(?:\/[a-zA-Z0-9°℃]+)|(?:@[0-9]+(?:\.[0-9]+)?(?:℃|°C|C|K)))/);
  if (match) {
    const conditionQualifier = match[1].trim();
    const candidateCore = raw.replace(match[1], '').trim();
    if (candidateCore.length >= 2) {
      return { coreLabel: candidateCore, conditionQualifier };
    }
  }
  return { coreLabel: raw, conditionQualifier: '' };
}

/**
 * 语义槽位绑定解析 (OW-029 铁律：严禁行号位置推断，完全基于语义与别名)
 * 支持前置限定词解耦与多级别名相似度计算
 */
export function resolveSlotBySemantics(rawLabel, sectionNumber) {
  const registry = SECTION_SLOT_REGISTRY[sectionNumber];
  if (!registry) return null;

  const stripped = stripNumberingPrefix(rawLabel).coreLabel;
  const normKey = normalizeLabelKey(stripped);
  if (!normKey) return null;

  function matchInSlots(keyToMatch) {
    if (!keyToMatch || keyToMatch.length < 2) return null;
    let bestSlot = null;
    let highestScore = 0;

    for (const slot of registry.slots) {
      const normStandard = normalizeLabelKey(slot.standardLabel);
      if (keyToMatch === normStandard) {
        return { slot, confidence: 1.0 };
      }

      for (const alias of slot.aliases) {
        const normAlias = normalizeLabelKey(alias);
        if (!normAlias) continue;
        if (keyToMatch === normAlias) {
          return { slot, confidence: 0.95 };
        }
        if (keyToMatch.length >= 3 && normAlias.length >= 3) {
          // Negative prefix collision check: prevent opposite meanings from substring-matching (e.g. 合适 vs 不合适)
          const isKeyNeg = /^(?:不|非|无|un|in|non|dis)/i.test(keyToMatch);
          const isAliasNeg = /^(?:不|非|无|un|in|non|dis)/i.test(normAlias);
          if (isKeyNeg !== isAliasNeg) {
            continue;
          }
          if (keyToMatch.includes(normAlias) || normAlias.includes(keyToMatch)) {
            const score = Math.min(keyToMatch.length, normAlias.length) / Math.max(keyToMatch.length, normAlias.length);
            if (score > highestScore && score >= 0.55) {
              highestScore = score;
              bestSlot = slot;
            }
          }
        }
      }
    }
    if (bestSlot && highestScore >= 0.55) {
      return { slot: bestSlot, confidence: highestScore };
    }
    return null;
  }

  // 1. 直接全量匹配
  const directMatch = matchInSlots(normKey);
  if (directMatch) return directMatch;

  // 2. 限定词前置解耦匹配 (Pre-Matching Qualifier Decoupling)
  const decoupled = preExtractConditionQualifier(stripped);
  if (decoupled.conditionQualifier) {
    const decoupledNormKey = normalizeLabelKey(decoupled.coreLabel);
    if (decoupledNormKey && decoupledNormKey !== normKey) {
      const decoupledMatch = matchInSlots(decoupledNormKey);
      if (decoupledMatch) {
        return {
          slot: decoupledMatch.slot,
          confidence: decoupledMatch.confidence,
          conditionQualifier: decoupled.conditionQualifier,
        };
      }
    }
  }

  return null;
}

/**
 * 语义散文路由器 (Semantic Prose Router)
 * 针对没有明确加粗冒号标签或标签为“未知名标签/一般性描述”的散文行，
 * 通过精准的化学与毒理、消防、运输等业务特征关键词路由至对应标准插槽。
 */
export function routeSemanticProse(pair, sectionNumber) {
  if (!pair) return null;
  const rawText = `${pair.rawLabel || ''} ${pair.rawValue || ''}`.trim();
  if (!rawText) return null;

  switch (sectionNumber) {
    case 1: {
      if (/^[A-Za-z0-9]+-[A-Za-z0-9]+$/.test(rawText.replace(/[:：\s]/g, ''))) {
        return { slotKey: 'model', confidence: 0.95 };
      }
      if (/应用于|涂饰|印刷|粘合剂|涂层|皮革|织物|纺织|raw material for coatings|coatings/i.test(rawText)) {
        return { slotKey: 'recommended_use', confidence: 0.9 };
      }
      if (/水分散体|聚氨酯树脂|聚合物|aqueous polyurethane dispersion/i.test(rawText) && /分类|类别|category/i.test(pair.rawLabel || '')) {
        return { slotKey: 'product_type', confidence: 0.9 };
      }
      break;
    }
    case 2: {
      if (/not classified as hazardous|根据.*不属于危害化学品|未满足分类标准|非危险品|not dangerous|not classified/i.test(rawText)) {
        return { slotKey: 'ghs_classification', confidence: 0.95 };
      }
      break;
    }
    case 3: {
      if (/误服|吞咽|脱掉|污染的衣物|催吐/i.test(rawText)) {
        return { slotKey: 'cross_section_4_ingestion', confidence: 0.85 };
      }
      if (/皮肤接触|冲洗皮肤/i.test(rawText)) {
        return { slotKey: 'cross_section_4_skin', confidence: 0.85 };
      }
      break;
    }
    case 4: {
      if (/误服|意外吞食|不要催吐|经口|induce vomiting|if swallowed|never give anything by mouth|mistakenly taken/i.test(rawText)) {
        return { slotKey: 'ingestion', confidence: 0.95 };
      }
      if (/脱掉所有被污染的衣物|一般措施|adverse acute health|general measures/i.test(rawText)) {
        return { slotKey: 'symptoms', confidence: 0.85 };
      }
      if (/skin contact|wash affected|contact with skin/i.test(rawText)) {
        return { slotKey: 'skin_contact', confidence: 0.95 };
      }
      if (/eye contact|flush eyes|contact, flush/i.test(rawText)) {
        return { slotKey: 'eye_contact', confidence: 0.95 };
      }
      break;
    }
    case 5: {
      if (/高流量的水喷射|不合适的灭火剂|不合适灭火剂|不适用灭火剂|unsuitable extinguishing/i.test(rawText)) {
        return { slotKey: 'unsuitable_extinguishing_media', confidence: 0.95 };
      }
      if ((/合适的灭火剂|适用灭火剂|适用灭火介质|二氧化碳.*泡沫/i.test(rawText)) && !/不合适|不适用/i.test(rawText)) {
        return { slotKey: 'extinguishing_media', confidence: 0.95 };
      }
      if (/燃烧时释放|一氧化碳|二氧化碳|氮氧化物|着火或爆炸|烟尘|dense black smoke|thermal decomposition|oxides of nitrogen/i.test(rawText)) {
        return { slotKey: 'special_hazards', confidence: 0.95 };
      }
      if (/自供气式呼吸器|自给式呼吸器|消防人员|灭火用水流入|firefighters should be equipped|self-contained breathing/i.test(rawText)) {
        return { slotKey: 'protective_actions', confidence: 0.95 };
      }
      break;
    }
    case 6: {
      if (/戴防护设备|充分的通风|排气|令未授权人员离开|spill and leak procedures|evacuate personnel|adequate ventilation/i.test(rawText)) {
        return { slotKey: 'personal_precautions', confidence: 0.95 };
      }
      if (/吸收材料|干沙|密闭容器|收容|清除|dike or dam|inert material|sealable containers/i.test(rawText)) {
        return { slotKey: 'cleanup_methods', confidence: 0.95 };
      }
      break;
    }
    case 7: {
      if (/handle in accordance with good industrial/i.test(rawText)) {
        return { slotKey: 'handling', confidence: 0.95 };
      }
      if (/months at|store at|temperature between|keep container closed/i.test(rawText)) {
        return { slotKey: 'storage', confidence: 0.95 };
      }
      break;
    }
    case 8: {
      if (/EN 374|手套合适材料/i.test(rawText)) {
        return { slotKey: 'glove_materials', confidence: 0.95 };
      }
      if (/氟化橡胶|FKM/i.test(rawText)) {
        return { slotKey: 'fkm', confidence: 0.95 };
      }
      if (/丁基橡胶|IIR/i.test(rawText)) {
        return { slotKey: 'iir', confidence: 0.95 };
      }
      if (/丁腈橡胶|NBR/i.test(rawText)) {
        return { slotKey: 'nbr', confidence: 0.95 };
      }
      if (/EC指令|接触限值|Exposure Limits|无可用的接触限值/i.test(rawText)) {
        return { slotKey: 'control_parameters', confidence: 0.95 };
      }
      if (/建议[：:]|污染的手套应废弃|the recommendations in this section should/i.test(rawText)) {
        return { slotKey: 'recommendation', confidence: 0.95 };
      }
      break;
    }
    case 9: {
      if (/最低成膜温度|MFFT/i.test(rawText)) {
        return { slotKey: 'mfft', confidence: 0.95 };
      }
      if (/玻璃化温度|Tg/i.test(rawText)) {
        return { slotKey: 'tg', confidence: 0.95 };
      }
      if (/羟值|羟基值|hydroxyl/i.test(rawText)) {
        return { slotKey: 'hydroxyl_value', confidence: 0.95 };
      }
      if (/燃烧值/i.test(rawText)) {
        return { slotKey: 'combustion_value', confidence: 0.95 };
      }
      if (/引燃温度|着火温度/i.test(rawText)) {
        return { slotKey: 'ignition_temp', confidence: 0.95 };
      }
      if (/上述数据非产品指标|其他信息/i.test(rawText)) {
        return { slotKey: 'other_physical', confidence: 0.95 };
      }
      break;
    }
    case 10: {
      if (/无危害反应|危害反应|危险反应|正确储存或操作时|possible hazardous reactions|hazardous polymerisation/i.test(rawText)) {
        return { slotKey: 'hazardous_reactions', confidence: 0.95 };
      }
      if (/hazardous decomposition|will not decompose/i.test(rawText)) {
        return { slotKey: 'hazardous_decomposition', confidence: 0.95 };
      }
      break;
    }
    case 11: {
      if (/刺激眼睛|轻度的眼睛刺激|主要粘膜刺激|eye irritation|irritation develops/i.test(rawText)) {
        return { slotKey: 'eye_damage', confidence: 0.95 };
      }
      if (/过敏特性|不是皮肤过敏|皮肤接触试验|物种|试验研究.*过敏|cause sensitization|sensitization/i.test(rawText)) {
        return { slotKey: 'sensitization', confidence: 0.95 };
      }
      if (/mutagenicity in ames|ames test/i.test(rawText)) {
        return { slotKey: 'germ_mutagenicity', confidence: 0.95 };
      }
      if (/重复剂量|病理变化|视网膜损伤|红血球异常/i.test(rawText)) {
        return { slotKey: 'stot_repeated', confidence: 0.95 };
      }
      if (/无可用的毒理学研究|毒理学数据|以下是.*毒理学数据|no toxicological studies|Risk assessment data/i.test(rawText)) {
        return { slotKey: 'acute_toxicity', confidence: 0.9 };
      }
      break;
    }
    case 12: {
      if (/无可用的生态毒理学研究|生态毒理学数据|以下是.*生态毒理学数据|no ecotoxicological studies/i.test(rawText)) {
        return { slotKey: 'ecotoxicity', confidence: 0.9 };
      }
      if (/其他不利的影响/i.test(rawText)) {
        return { slotKey: 'other_adverse_effects', confidence: 0.9 };
      }
      break;
    }
    case 13: {
      if (/容器倒空|倾倒|刮擦|滴干|回收方式|empty container|recondition or dispose of empty/i.test(rawText)) {
        return { slotKey: 'contaminated_packaging', confidence: 0.95 };
      }
      if (/国标|国家或当地法规进行废弃|欧洲废弃物|EWC|在欧盟领域内废弃|waste disposal method|waste disposal should/i.test(rawText)) {
        return { slotKey: 'waste_treatment_methods', confidence: 0.95 };
      }
      break;
    }
    case 14: {
      if (/公路和铁路|陆运|陆运输|road and railway|road transport/i.test(rawText)) {
        return { slotKey: 'road_rail', confidence: 0.95 };
      }
      if (/海上运输|海运|sea transport|transported by sea/i.test(rawText)) {
        return { slotKey: 'sea', confidence: 0.95 };
      }
      if (/空运|航空|air transport/i.test(rawText)) {
        return { slotKey: 'air', confidence: 0.95 };
      }
      if (/特殊注意事项|避免温度|远离食物|special precautions|non dangerous goods/i.test(rawText)) {
        return { slotKey: 'special_precautions', confidence: 0.95 };
      }
      break;
    }
    case 15: {
      if (/591号|安全管理条例|344号|decree no. 591/i.test(rawText)) {
        return { slotKey: 'reg_591', confidence: 0.95 };
      }
      if (/16483/i.test(rawText)) {
        return { slotKey: 'gb_16483', confidence: 0.95 };
      }
      if (/13690/i.test(rawText)) {
        return { slotKey: 'gb_13690', confidence: 0.95 };
      }
      if (/30000|20576|20598/i.test(rawText)) {
        return { slotKey: 'gb_30000', confidence: 0.95 };
      }
      if (/15258/i.test(rawText)) {
        return { slotKey: 'gb_15258', confidence: 0.95 };
      }
      if (/法律法规|安全、健康和环保|safety, health and environmental/i.test(rawText)) {
        return { slotKey: 'safety_regulations', confidence: 0.9 };
      }
      if (/其它的规定|other regulations/i.test(rawText)) {
        return { slotKey: 'other_regulations', confidence: 0.9 };
      }
      if (/符合下列法规要求|meet the following regulatory requirements/i.test(rawText)) {
        return { slotKey: 'regulatory_requirements', confidence: 0.9 };
      }
      break;
    }
    case 16: {
      if (/掌握的知识|发布之日|资料是正确的|免责|Disclaimer|According to our knowledge/i.test(rawText)) {
        return { slotKey: 'disclaimer', confidence: 0.95 };
      }
      break;
    }
  }

  return null;
}

export const ADDITIVE_SLOTS = new Set([
  'other_physical',
  'safety_regulations',
  'sensitization',
  'stot_repeated',
  'special_hazards',
  'protective_actions',
  'waste_treatment_methods',
  'contaminated_packaging',
  'acute_toxicity',
  'ecotoxicity',
]);

/**
 * 同槽位独占性与多值冲突检测器
 */
export function detectSlotConflicts(candidateFacts, slotKey = '') {
  if (!candidateFacts || candidateFacts.length === 0) {
    return { hasConflict: false, resolvedValue: '', conflicts: [] };
  }
  if (candidateFacts.length === 1) {
    return { hasConflict: false, resolvedValue: candidateFacts[0].value || '', conflicts: [] };
  }

  const uniqueValues = [];
  for (const f of candidateFacts) {
    const val = sanitizeTypographyAndSymbols(f.value);
    if (!val) continue;
    const exists = uniqueValues.some(
      (v) => v.toLowerCase().replace(/[\s\u3000]/g, '') === val.toLowerCase().replace(/[\s\u3000]/g, '')
    );
    if (!exists) {
      uniqueValues.push(val);
    }
  }

  if (uniqueValues.length === 0) {
    return { hasConflict: false, resolvedValue: '', conflicts: [] };
  }
  if (uniqueValues.length === 1) {
    return { hasConflict: false, resolvedValue: uniqueValues[0], conflicts: [] };
  }

  // 若其中一个是实质数据，其余是纯缺失占位符，自动采信实质数据
  const substantive = uniqueValues.filter((v) => !isPureMissingValue(v));
  if (substantive.length === 1) {
    return { hasConflict: false, resolvedValue: substantive[0], conflicts: [] };
  }

  // 累加槽位（ADDITIVE_SLOTS）：天然允许包含多个测试结果、多项指标或多条法规，合并保留，不作为冲突报错
  if (slotKey && ADDITIVE_SLOTS.has(slotKey)) {
    return {
      hasConflict: false,
      resolvedValue: substantive.join('\n'),
      conflicts: [],
    };
  }

  // 存在实质多值冲突
  return {
    hasConflict: true,
    resolvedValue: substantive.join('；'),
    conflicts: uniqueValues,
  };
}

/**
 * Section 9 理化测试条件限定词解耦算法
 * 例如从 `pH值（1%水溶液）： 7.5` 或 `9.3 pH值(原液): 7.0` 中
 * 解耦出：主属性键 `ph`、测试限定词 `（1%水溶液）`、数值 `7.5`
 */
export function decoupleSection9Condition(rawLabelText, rawValueText) {
  const label = cleanRawText(rawLabelText);
  let conditionQualifier = '';
  let coreLabel = label;

  const match = label.match(/((?:[（\(][^）\)]+[）\)])|(?:\/[0-9]+(?:\.[0-9]+)?(?:℃|°C|C|K|mPa|s|%|g|ml))|(?:\/[a-zA-Z0-9°℃]+)|(?:@[0-9]+(?:\.[0-9]+)?(?:℃|°C|C|K)))/);
  if (match) {
    conditionQualifier = match[1];
    coreLabel = label.replace(match[1], '').trim();
  }

  let cleanValue = cleanRawText(rawValueText);

  return {
    conditionQualifier,
    coreLabel,
    value: cleanValue,
  };
}

/**
 * Section 2 GHS 防范说明（P 语句）归类整理算法
 * 自动识别并归入四大标准块：预防措施、事故响应、安全储存、废弃处置
 */
export function groupPrecautionaryStatements(statementsText) {
  const rawText = String(statementsText || '');
  const normalized = rawText
    .replace(/(?:\r?\n)+/g, '\n')
    .replace(/(?<!^)(?<!\n)(?=(?:预防措施|事故响应|安全储存|废弃处置)[:：]|\bP[1-5]\d{2}\b)/g, '\n');

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const groups = {
    prevention: [], // 预防措施
    response: [],   // 事故响应
    storage: [],    // 安全储存
    disposal: [],   // 废弃处置
    general: [],    // 通用/未明确归类
  };

  let currentCategory = 'general';

  for (const line of lines) {
    if (/^P[1-5]\d{2}/i.test(line)) {
      if (/^P2\d{2}/i.test(line)) {
        groups.prevention.push(line);
      } else if (/^P3\d{2}/i.test(line)) {
        groups.response.push(line);
      } else if (/^P4\d{2}/i.test(line)) {
        groups.storage.push(line);
      } else if (/^P5\d{2}/i.test(line)) {
        groups.disposal.push(line);
      } else {
        groups[currentCategory].push(line);
      }
      continue;
    }

    if (/^(?:预防措施|安全预防措施)[:：]?/i.test(line)) {
      currentCategory = 'prevention';
      const rest = line.replace(/^(?:预防措施|安全预防措施)[:：]?\s*/i, '').trim();
      if (rest) groups.prevention.push(rest);
      continue;
    }
    if (/^(?:事故响应|急救措施|应对措施)[:：]?/i.test(line)) {
      currentCategory = 'response';
      const rest = line.replace(/^(?:事故响应|急救措施|应对措施)[:：]?\s*/i, '').trim();
      if (rest) groups.response.push(rest);
      continue;
    }
    if (/^(?:安全储存|储存)[:：]?/i.test(line)) {
      currentCategory = 'storage';
      const rest = line.replace(/^(?:安全储存|储存)[:：]?\s*/i, '').trim();
      if (rest) groups.storage.push(rest);
      continue;
    }
    if (/^(?:废弃处置|处置)[:：]?/i.test(line)) {
      currentCategory = 'disposal';
      const rest = line.replace(/^(?:废弃处置|处置)[:：]?\s*/i, '').trim();
      if (rest) groups.disposal.push(rest);
      continue;
    }

    if (/^P2\d\d|佩戴|避免|操作|穿戴|防护|远离|禁烟|密封/i.test(line)) {
      groups.prevention.push(line);
    } else if (/^P3\d\d|如误|接触|清洗|就医|吞咽|灭火|冲洗/i.test(line)) {
      groups.response.push(line);
    } else if (/^P4\d\d|存放在|阴凉|通风|上锁|保持容器/i.test(line)) {
      groups.storage.push(line);
    } else if (/^P5\d\d|处置|委托|合规|回收|废弃/i.test(line)) {
      groups.disposal.push(line);
    } else {
      groups[currentCategory].push(line);
    }
  }

  const formattedSections = [];
  if (groups.prevention.length) {
    formattedSections.push('预防措施：\n' + groups.prevention.join('\n'));
  }
  if (groups.response.length) {
    formattedSections.push('事故响应：\n' + groups.response.join('\n'));
  }
  if (groups.storage.length) {
    formattedSections.push('安全储存：\n' + groups.storage.join('\n'));
  }
  if (groups.disposal.length) {
    formattedSections.push('废弃处置：\n' + groups.disposal.join('\n'));
  }
  if (groups.general.length && !formattedSections.length) {
    formattedSections.push(groups.general.join('\n'));
  }

  return formattedSections.join('\n');
}

export function decoupleSection2CompoundBlocks(cellText, rowObj = null) {
  if (!cellText) return [];
  const text = String(cellText).trim();

  const hasClassification = /(?:2\.1|物质或混合物的分类|GHS危险性类别)/i.test(text);
  const hasLabelElements = /(?:2\.2|标签要素|GHS[- ]?象形图|警示词|信号词)/i.test(text);
  const hasOtherHazards = /(?:2\.3|其他危险|其他危害)/i.test(text);

  if (!hasClassification && !hasLabelElements && !hasOtherHazards) {
    return [];
  }

  const results = [];

  // 1. GHS 危险性类别
  let classPart = '';
  const classMatch = text.match(/(?:2\.1\s*(?:GHS\s*)?危险性分类|GHS危险性类别)[:：]?\s*([\s\S]*?)(?=(?:2\.2\s*GHS标签要素|GHS标签要素|标签要素|GHS[- ]?象形图|象形图|警示词|信号词|$))/i);
  if (classMatch) {
    classPart = classMatch[1].trim();
  } else {
    const labelIdx = text.search(/(?:2\.2\s*标签要素|标签要素|GHS[- ]?象形图|警示词|信号词)/i);
    classPart = labelIdx !== -1 ? text.slice(0, labelIdx).trim() : text;
  }
  let cleanClassVal = classPart
    .replace(/^(?:物质或混合物分类|2\.1\s*物质或混合物的分类|GHS危险性类别[:：]?)\s*/gim, '')
    .trim();
  cleanClassVal = cleanClassVal.replace(/^.*GHS危险性类别[:：]?\s*/i, '').trim();
  if (!cleanClassVal || /不属于危害化学品|不属于危险|未列入/i.test(cleanClassVal)) {
    cleanClassVal = cleanClassVal || '根据GHS不属于危害化学品';
  }
  results.push({
    rawLabel: '2.2  GHS危险性类别：',
    rawValue: cleanClassVal,
    rowObj,
  });

  // 2. 物理危险
  const physM = text.match(/物理危险[:：]?\s*([^\r\n]+)/i);
  if (physM) {
    results.push({
      rawLabel: '2.7  物理和化学危险：',
      rawValue: physM[1].trim(),
      rowObj,
    });
  }

  // 3. 环境危害
  const envM = text.match(/环境危险[:：]?\s*([^\r\n]+)/i);
  if (envM) {
    results.push({
      rawLabel: '2.9  环境危害：',
      rawValue: envM[1].trim(),
      rowObj,
    });
  }

  // 4. 象形图 与 标签要素
  const pictoM = text.match(/(?:象形图|GHS[- ]?象形图)[:：]?\s*([^\r\n]+)/i);
  let pictoVal = '';
  if (pictoM) {
    pictoVal = pictoM[1].replace(/警示性说明[:：]?.*$/i, '').replace(/[:：\s]+$/, '').trim();
    if (/信号词[:：]|无危险的象形图|危险/i.test(pictoVal)) {
      pictoVal = '';
    }
  }
  results.push({
    rawLabel: 'GHS象形图：',
    rawValue: pictoVal,
    rowObj,
  });
  // 标签要素为大标题容器，值强制留空继承，严禁填入信号词 (OW-LABEL-ELEM)
  results.push({
    rawLabel: '2.3  GHS标签要素：',
    rawValue: '',
    rowObj,
  });

  // 5. 信号词
  const sigM = text.match(/(?:警示词|信号词)[:：]?\s*([^\r\n]+)/i);
  let sigVal = sigM ? sigM[1].trim() : '';
  if (!sigVal) sigVal = '无信号词';
  results.push({
    rawLabel: '2.4  信号词：',
    rawValue: sigVal,
    rowObj,
  });

  // 6. 危险性说明 (警示性说明)
  const hazM = text.match(/(?:警示性说明|危险性说明)[:：]?\s*([\s\S]*?)(?=(?:防范说明|预防措施|事故响应|安全储存|废弃处置|其他危险|其他危害|$))/i);
  if (hazM) {
    const hazVal = hazM[1].trim();
    results.push({
      rawLabel: '2.5  危险性说明：',
      rawValue: hazVal,
      rowObj,
    });

    // 解析健康危害子项
    const skinM = hazVal.match(/(可能引起轻微的皮肤刺激|[^；;。]*皮肤[^；;。]*)/i);
    const eyeM = hazVal.match(/(可能引起眼睛刺激[^\r\n；;。]*|[^；;。]*眼睛[^；;。]*)/i);
    const ingM = hazVal.match(/(正常使用时只有轻微的摄入危害[^\r\n；;。]*|[^；;。]*摄入[^；;。]*|[^；;。]*胃不适[^\r\n；;。]*)/i);

    results.push({
      rawLabel: '吸入：',
      rawValue: '吸入：正常使用时无危害。',
      rowObj,
    });
    if (ingM) {
      const v = ingM[1].trim();
      results.push({
        rawLabel: '食入：',
        rawValue: '食入：' + v + (v.endsWith('。') ? '' : '。'),
        rowObj,
      });
    }
    if (skinM) {
      const v = skinM[1].trim();
      results.push({
        rawLabel: '皮肤：',
        rawValue: '皮肤：' + v + (v.endsWith('。') ? '' : '。'),
        rowObj,
      });
    }
    if (eyeM) {
      const v = eyeM[1].trim();
      results.push({
        rawLabel: '眼睛：',
        rawValue: '眼睛：' + v + (v.endsWith('。') ? '' : '。'),
        rowObj,
      });
    }
    results.push({
      rawLabel: '症状和体征：',
      rawValue: '症状和体征：' + hazVal,
      rowObj,
    });
    results.push({
      rawLabel: '2.8  健康危害：',
      rawValue: '吸入：正常使用时无危害。',
      rowObj,
    });
  }

  // 7. 防范说明 (P 代码)
  const precM = text.match(/(?:防范说明|预防措施)[:：]?\s*([\s\S]*?)(?=(?:其他危险|其他危害|2\.\d\s*其他|$))/i);
  if (precM) {
    const rawLines = precM[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const mergedLines = [];
    for (const line of rawLines) {
      if (/^P\d/i.test(line)) {
        mergedLines.push(line);
      } else if (/^(?:预防措施|事故响应|安全储存|废弃处置)[:：]?$/i.test(line)) {
        // 分组标签不进入 P 行
      } else if (mergedLines.length > 0) {
        mergedLines[mergedLines.length - 1] += line;
      }
    }
    results.push({
      rawLabel: '2.6  防范说明：',
      rawValue: mergedLines.join('\n'),
      rowObj,
    });
  }

  // 8. 其他危险
  const othM = text.match(/(?:2\.3\s*其他危险|2\.\d+\s*其他危险|其他危险|其他危害)[:：]?\s*([^\r\n]+)/i);
  let otherVal = othM ? othM[1].trim() : '无适用资料。';
  if (!otherVal) otherVal = '无适用资料。';
  results.push({
    rawLabel: '2.10 其他危害：',
    rawValue: otherVal,
    rowObj,
  });

  return results;
}

/**
 * Section 11 毒理学聚合长文本端点解构器 (Section 11 Toxicology Block Decoupler)
 * 当源文档将全套毒理试验数据聚合排在同一个单元格时，按急性毒性、皮肤刺激、粘膜刺激、
 * 致敏性、致突变性、致癌性、生殖毒性、STOT、吸入危害等端点切片为独立键值对。
 */
export function decoupleSection11ToxicologyBlocks(cellText, rowObj = null) {
  if (!cellText) return [];
  const text = String(cellText).trim();

  const endpoints = [
    { key: 'acute_toxicity_oral', label: '经口：', re: /(?:^|\n)\s*(?:11\.1\s*毒理学效应[\s\S]*?急性毒性[，, ]*经口|急性毒性[，, ]*经口|急性毒性，经口)/i },
    { key: 'acute_toxicity_dermal', label: '经皮：', re: /(?:^|\n)\s*(?:急性毒性[，, ]*经皮|急性毒性，经皮)/i },
    { key: 'acute_toxicity_inhalation', label: '吸入：', re: /(?:^|\n)\s*(?:急性毒性[，, ]*吸入|急性毒性，吸入)/i },
    { key: 'skin_corrosion', label: '11.2 皮肤腐蚀或刺激：', re: /(?:^|\n)\s*(?:原发性皮肤刺激|皮肤刺激|主要皮肤刺激性)/i },
    { key: 'eye_damage', label: '11.3 严重眼损伤或刺激：', re: /(?:^|\n)\s*(?:原发性粘膜刺激|主要眼睛刺激性|眼睛刺激)/i },
    { key: 'sensitization', label: '11.4 呼吸道或皮肤过敏：', re: /(?:^|\n)\s*(?:致敏性|皮肤致敏性)/i },
    { key: 'stot_repeated_subacute', label: '11.9 特异性靶器官系统毒性——反复接触：', re: /(?:^|\n)\s*(?:亚急性[，, ]*亚慢性和延迟毒性)/i },
    { key: 'carcinogenicity', label: '11.6 致癌性：', re: /(?:^|\n)\s*(?:致癌性)/i },
    { key: 'reproductive_fertility', label: '生育力', re: /(?:^|\n)\s*(?:生殖毒性\/生育力|生殖毒性／生育力)/i },
    { key: 'reproductive_teratogenicity', label: '致畸形', re: /(?:^|\n)\s*(?:生殖毒性\/致畸形|生殖毒性／致畸形)/i },
    { key: 'in_vitro_genotoxicity', label: '体外遗传毒性', re: /(?:^|\n)\s*(?:体外遗传毒性|体外染色体畸变试验)/i },
    { key: 'germ_mutagenicity', label: '11.5 生殖细胞突变性：', re: /(?:^|\n)\s*(?:体内基因毒性|致突变性)/i },
    { key: 'stot_single', label: '11.8 特异性靶器官系统毒性——一次接触：', re: /(?:^|\n)\s*(?:STOT评估-一次性接触|STOT一次接触)/i },
    { key: 'stot_repeated', label: '11.9 特异性靶器官系统毒性——反复接触：', re: /(?:^|\n)\s*(?:STOT评估-重复性接触|STOT反复接触)/i },
    { key: 'aspiration_hazard', label: '11.10 吸入危害：', re: /(?:^|\n)\s*(?:吸入危害|吸入危险)/i },
  ];

  let matchCount = 0;
  for (const ep of endpoints) {
    if (ep.re.test(text)) matchCount++;
  }

  if (matchCount < 3) return [];

  const matches = [];
  for (const ep of endpoints) {
    const m = text.match(ep.re);
    if (m && typeof m.index === 'number') {
      matches.push({
        ep,
        index: m.index,
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  const results = [];
  if (matches[0] && matches[0].index > 0) {
    const headNote = text.slice(0, matches[0].index).trim();
    if (headNote && /无可用的毒理学研究/i.test(headNote)) {
      results.push({
        rawLabel: '11.1 急性毒性：',
        rawValue: headNote.split('\n')[0].trim(),
        rowObj,
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chunk = text.slice(current.index, nextIndex).trim();

    results.push({
      rawLabel: current.ep.label,
      rawValue: chunk,
      rowObj,
    });
  }

  return results;
}

/**
 * 核心匹配引擎：输入识别结果 records，输出标准匹配数据模型
 * 融合 16 章节局部约束插件、限定词前置解耦、非危运输级联、手套聚类与语义散文路由
 */
export function runSmartMatching(inspectorRecords) {
  const records = (inspectorRecords || []).filter((r) => r.kind === 'table' && r.sectionNumber);
  const matchedSections = [];
  let totalMatched = 0;
  let totalPruned = 0;
  let totalUnmatched = 0;
  let totalReviewAmbiguous = 0;
  let totalNotApplicable = 0;

  // 跨章节事实流转中继池（如从 Section 3 识别出的急救措施）
  const crossSectionFacts = { 4: [] };

  for (let s = 1; s <= 16; s++) {
    const registry = SECTION_SLOT_REGISTRY[s];
    const sourceRecord = records.find((r) => r.sectionNumber === s);

    if (!registry) continue;

    // 提取源识别记录中所有的键值对行（应用全局解构器与加粗阈值修正）
    const rawPairs = [];
    if (sourceRecord && sourceRecord.rows) {
      for (const row of sourceRecord.rows) {
        if (row.index === 0) continue; // 排除表头
        const cell0 = row.cells?.[0];
        const cell1 = row.cells?.[1];
        if (!cell0) continue;

        // Section 3 组分多列表格行交由 s3Components 统一处理，不在此生成普通键值对
        const isS3CompRow = s === 3 && (row.cells?.length >= 3 || /Chemical Name|CAS NO|成分|组成|含量/i.test(cell0.text || ''));
        if (isS3CompRow) continue;

        // Section 3 专属：拦截并流转误排在 Section 3 表格底部的急救措施行 (例如 PU-1007)
        if (s === 3) {
          const rowCombined = `${cell0?.text || ''} ${cell1?.text || ''}`.trim();
          if (/4[\.、\s]*急救措施|急救措施|一般措施|误服|意外吞食|不要催吐|接触眼睛|眼睛接触|接触皮肤|皮肤接触|一旦吸入|吸入：/i.test(rowCombined)) {
            if (/^4[\.、\s]*急救措施$/i.test(rowCombined.replace(/[:：\s]/g, ''))) {
              continue; // 表头标题行，直接吸收跳过
            }
            const cs = safeColonSplit(cell0.text || rowCombined);
            const faLabel = cs.hasColon ? cs.label : (cell0.labelText || cell0.text);
            const faValue = cell1?.text || (cs.hasColon ? cs.value : cell0.valueText) || '';
            crossSectionFacts[4].push({
              rawLabel: sanitizeTypographyAndSymbols(faLabel),
              rawValue: sanitizeTypographyAndSymbols(faValue),
              rowObj: row,
            });
            continue; // 从 Section 3 排除
          }
        }

        // 解构 cell0：行首无父级标签，context = { hasParentLabel: false }
        const dec0 = decomposeRunsToFact(cell0, { hasParentLabel: false });

        let pairLabel = dec0.rawLabel;
        let pairValue = '';

        if (cell1) {
          // cell1 位于同一行后续单元格，若 cell0 已有标签，cell1 处于父级标签上下文中
          const dec1 = decomposeRunsToFact(cell1, { hasParentLabel: Boolean(pairLabel) });
          pairValue = sanitizeTypographyAndSymbols(dec1.rawValue || cell1.valueText || cell1.text || '');

          // 若 cell0 未提取出加粗标签（例如被降级为值，或为无冒号纯文本），但文本合法且命中槽位别名
          if (!pairLabel && cell0.text) {
            if (isLabelLengthAcceptable(cell0.text) && resolveSlotBySemantics(cell0.text, s)) {
              pairLabel = cell0.text;
            } else if (!dec0.isDemotedFromBold && isLabelLengthAcceptable(cell0.text)) {
              pairLabel = cell0.text;
            }
          }
        } else {
          // 单单元格行
          pairValue = sanitizeTypographyAndSymbols(dec0.rawValue);
        }

        // 检查单元格内是否有多行独立键值对 (例如换行切分的子项)
        const cellText = sanitizeTypographyAndSymbols(cell0.text || '');

        // Section 2 专属：单单元格复合块前置解耦 (Decouple Section 2 Compound Blocks)
        if (s === 2 && !cell1) {
          const decoupledS2 = decoupleSection2CompoundBlocks(cellText, row);
          if (decoupledS2.length > 0) {
            rawPairs.push(...decoupledS2);
            continue;
          }
        }

        // Section 11 专属：单单元格多端点聚合毒理大段落解构 (Decouple Section 11 Toxicology Blocks)
        if (s === 11 && !cell1) {
          const decoupledS11 = decoupleSection11ToxicologyBlocks(cellText, row);
          if (decoupledS11.length > 0) {
            rawPairs.push(...decoupledS11);
            continue;
          }
        }

        const multiLines0 = cellText.split('\n').map((l) => l.trim()).filter(Boolean);
        const cell1Text = sanitizeTypographyAndSymbols(cell1?.text || '');
        const multiLines1 = cell1Text.split('\n').map((l) => l.trim()).filter(Boolean);

        if (cell1 && multiLines0.length > 1 && multiLines0.length === multiLines1.length) {
          // 单元格内换行配对拆解 (如 Section 9 中一个单元格并列两个理化指标)
          for (let k = 0; k < multiLines0.length; k++) {
            const l0 = multiLines0[k];
            const l1 = multiLines1[k];
            const cs0 = safeColonSplit(l0);
            rawPairs.push({
              rawLabel: sanitizeTypographyAndSymbols(cs0.hasColon ? cs0.label : l0),
              rawValue: sanitizeTypographyAndSymbols(cs0.hasColon && cs0.value ? `${cs0.value} ${l1}`.trim() : l1),
              rowObj: row,
            });
          }
        } else if (multiLines0.length > 1 && !cell1 && multiLines0.every((l) => safeColonSplit(l).hasColon)) {
          // Section 11 结构化毒理学研究试验块（物种/分类/结果 或 重复剂量中毒/病理变化）保持聚合整体，严禁行行孤立切散 (OW-161)
          const isSec11StructuredBlock = s === 11 && (/物种|Species/i.test(cellText) || /重复剂量/i.test(cellText));
          if (!isSec11StructuredBlock) {
            for (const line of multiLines0) {
              const cs = safeColonSplit(line);
              rawPairs.push({
                rawLabel: sanitizeTypographyAndSymbols(cs.label),
                rawValue: sanitizeTypographyAndSymbols(cs.value),
                rowObj: row,
              });
            }
          } else {
            rawPairs.push({
              rawLabel: '',
              rawValue: sanitizeTypographyAndSymbols(cellText),
              rowObj: row,
            });
          }
        } else if (pairLabel.trim() || pairValue.trim()) {
          rawPairs.push({
            rawLabel: sanitizeTypographyAndSymbols(pairLabel.trim()),
            rawValue: sanitizeTypographyAndSymbols(pairValue.trim()),
            rowObj: row,
          });
        }
      }
    }

    // Section 1 专属性：型号与通用中文名称自动区分
    if (s === 1) {
      const modelPair = rawPairs.find((p) => /^[A-Za-z0-9]+-[A-Za-z0-9]+$/.test((p.rawValue || p.rawLabel).replace(/[:：\s]/g, '')));
      if (modelPair) {
        modelPair.rawLabel = '产品型号：';
      }
    }

    // Section 8 专属性：将 EC 指令接触限值说明定向绑定至 8.1 控制参数
    if (s === 8) {
      for (const p of rawPairs) {
        if (/无可用的接触限值|EC指令|接触限值/i.test(p.rawValue || p.rawLabel)) {
          p.rawLabel = '8.1 控制参数：';
        }
      }
    }

    // Section 8 专属：英美无冒号大段落子章节切分
    if (s === 8 && sourceRecord && sourceRecord.rows) {
      const allText = sourceRecord.rows.map((r) => r.cells?.map((c) => c.text).join(' ') || '').join('\n');
      if (/Respiratory Protection|Hand Protection|Eye Protection|Skin Protection/i.test(allText)) {
        for (let i = rawPairs.length - 1; i >= 0; i--) {
          if (/Respiratory Protection|Hand Protection|Eye Protection|Skin Protection|recommendations in this section/i.test(rawPairs[i].rawValue)) {
            rawPairs.splice(i, 1);
          }
        }
        const sec8Patterns = [
          { label: '8.1 控制参数：', re: /(?:Exposure Limits)([\s\S]*?)(?=Industrial Hygiene|Respiratory Protection|Hand Protection|Eye Protection|Skin Protection|Additional Protective Measures|$)/i },
          { label: '8.2 工程控制：', re: /(?:Industrial Hygiene\/Ventilation Measures|Industrial Hygiene)([\s\S]*?)(?=Respiratory Protection|Hand Protection|Eye Protection|Skin Protection|Additional Protective Measures|$)/i },
          { label: '呼吸系统防护：', re: /(?:Respiratory Protection)([\s\S]*?)(?=Hand Protection|Eye Protection|Skin Protection|Additional Protective Measures|$)/i },
          { label: '手部防护：', re: /(?:Hand Protection)([\s\S]*?)(?=Eye Protection|Skin Protection|Additional Protective Measures|$)/i },
          { label: '眼睛防护：', re: /(?:Eye Protection)([\s\S]*?)(?=Skin Protection|Additional Protective Measures|$)/i },
          { label: '身体防护：', re: /(?:Skin Protection)([\s\S]*?)(?=Additional Protective Measures|$)/i },
          { label: '建议：', re: /(?:Additional Protective Measures)([\s\S]*)$/i },
        ];
        for (const p of sec8Patterns) {
          const m = allText.match(p.re);
          if (m && m[1]?.trim()) {
            rawPairs.push({
              rawLabel: p.label,
              rawValue: sanitizeTypographyAndSymbols(m[1].trim()),
              rowObj: null,
            });
          }
        }
      }
    }

    // Section 13 专属：英美无冒号段落切分
    if (s === 13 && sourceRecord && sourceRecord.rows) {
      const allText = sourceRecord.rows.map((r) => r.cells?.map((c) => c.text).join(' ') || '').join('\n');
      if (/Waste Disposal Method|Empty Container Precautions/i.test(allText)) {
        for (let i = rawPairs.length - 1; i >= 0; i--) {
          if (/Waste Disposal Method|Empty Container Precautions/i.test(rawPairs[i].rawValue)) {
            rawPairs.splice(i, 1);
          }
        }
        const m1 = allText.match(/(?:Waste Disposal Method)([\s\S]*?)(?=Empty Container Precautions|$)/i);
        if (m1 && m1[1]?.trim()) {
          rawPairs.push({
            rawLabel: '13.1 废弃处置方法：',
            rawValue: sanitizeTypographyAndSymbols(m1[1].trim()),
            rowObj: null,
          });
        }
        const m2 = allText.match(/(?:Empty Container Precautions)([\s\S]*)$/i);
        if (m2 && m2[1]?.trim()) {
          rawPairs.push({
            rawLabel: '13.2 受污染的包装物：',
            rawValue: sanitizeTypographyAndSymbols(m2[1].trim()),
            rowObj: null,
          });
        }
      }
    }

    // Section 2 专属：非危险品/未分类结论捕获 (仅在未解耦显式分类时兜底)
    if (s === 2 && sourceRecord && sourceRecord.rows) {
      const hasExplicitClass = rawPairs.some((p) => /GHS危险性类别/i.test(p.rawLabel));
      if (!hasExplicitClass) {
        const allText = sourceRecord.rows.map((r) => r.cells?.map((c) => c.text).join(' ') || '').join(' ');
        if (/not classified as hazardous|根据.*不属于(?:危险|危害)|未列入(?:危险|危害)/i.test(allText)) {
          for (let i = rawPairs.length - 1; i >= 0; i--) {
            if (/not classified as hazardous|根据.*不属于(?:危险|危害)|未列入(?:危险|危害)/i.test(rawPairs[i].rawValue)) {
              rawPairs.splice(i, 1);
            }
          }
          rawPairs.push({
            rawLabel: '2.2  GHS危险性类别：',
            rawValue: '根据GHS不属于危害化学品',
            rowObj: null,
          });
        }
      }
    }

    // 接收跨章节流转事实 (例如 Section 3 尾部排布的急救说明流转至 Section 4)
    if (crossSectionFacts[s] && crossSectionFacts[s].length > 0) {
      rawPairs.push(...crossSectionFacts[s]);
    }

    // Section 3 专属：提取成分矩阵与识别误排急救措施
    const s3Components = [];
    if (s === 3 && sourceRecord && sourceRecord.rows) {
      for (const row of sourceRecord.rows) {
        if (row.index === 0) continue;
        const c0 = row.cells?.[0]?.text?.trim() || '';
        const c1 = row.cells?.[1]?.text?.trim() || '';
        const c2 = row.cells?.[2]?.text?.trim() || '';

        // 检测混杂急救信息并流转至 Section 4
        if (/误服|意外吞食|不要催吐/i.test(c0) || /误服|意外吞食|不要催吐/i.test(c1)) {
          crossSectionFacts[4].push({ rawLabel: '误服：', rawValue: c1 || c0, rowObj: row });
          continue;
        }
        if (/皮肤接触|脱掉所有被污染的衣物/i.test(c0) || /皮肤接触|脱掉所有被污染的衣物/i.test(c1)) {
          crossSectionFacts[4].push({ rawLabel: '皮肤接触：', rawValue: c1 || c0, rowObj: row });
          continue;
        }

        // 识别组分行 (排除表头，支持单行与单元格内换行列表)
        const isHeader = /化学品名称|CAS编号|产品类型|成分|组成|Chemical Name|CAS NO/i.test(c0) && /CAS|含量|比例|%/i.test(c1 || c2);
        if (!isHeader && c0 && (c1 || c2) && !/产品类型|Product type/i.test(c0)) {
          const names = c0.split(/[\r\n]+/).map((t) => t.trim()).filter(Boolean);
          const casList = c1.split(/[\r\n]+/).map((t) => t.trim()).filter(Boolean);
          const concList = c2.split(/[\r\n]+/).map((t) => t.trim()).filter(Boolean);

          if (names.length > 1) {
            for (let k = 0; k < names.length; k++) {
              s3Components.push({
                name: names[k],
                cas: casList[k] || '无',
                concentration: concList[k] || '',
              });
            }
          } else {
            s3Components.push({
              name: c0,
              cas: c1 || '无',
              concentration: c2 || '',
            });
          }
        }
      }
    }

    // 针对每个标准插槽，在 rawPairs 中搜索匹配 (严格落实 OW-029 非位置语义寻址)
    const matchedRows = [];
    const usedRawIndices = new Set();

    // 如果 Section 3 提取出了成分列表，将对应的 rawPairs 标记为已使用，防止产生 UNMATCHED 噪音
    if (s === 3 && s3Components.length > 0) {
      for (let i = 0; i < rawPairs.length; i++) {
        const p = rawPairs[i];
        if (s3Components.some((c) => c.name === p.rawLabel || c.name === p.rawValue || p.rawLabel.includes(c.name))) {
          usedRawIndices.add(i);
        }
      }
    }

    for (const slot of registry.slots) {
      // 收集所有匹配当前插槽的源事实候选
      const candidateMatches = [];

      // 第一轮：基于语义与前置解耦别名匹配
      for (let i = 0; i < rawPairs.length; i++) {
        if (usedRawIndices.has(i)) continue;
        const pair = rawPairs[i];
        const res = resolveSlotBySemantics(pair.rawLabel, s);

        if (res && res.slot.key === slot.key) {
          candidateMatches.push({
            index: i,
            pair,
            confidence: res.confidence,
            conditionQualifier: res.conditionQualifier || '',
            value: pair.rawValue,
          });
        }
      }

      // 第二轮：散文型无标签关键词智能路由 (Semantic Prose Router)
      // 若当前槽位尚未匹配，或为天然累加槽位（ADDITIVE_SLOTS），继续搜寻相符的散文/补充行
      if (candidateMatches.length === 0 || ADDITIVE_SLOTS.has(slot.key)) {
        for (let i = 0; i < rawPairs.length; i++) {
          if (usedRawIndices.has(i)) continue;
          const proseRes = routeSemanticProse(rawPairs[i], s);
          if (proseRes && proseRes.slotKey === slot.key) {
            candidateMatches.push({
              index: i,
              pair: rawPairs[i],
              confidence: proseRes.confidence,
              conditionQualifier: '',
              value: rawPairs[i].rawValue || rawPairs[i].rawLabel,
            });
            if (!ADDITIVE_SLOTS.has(slot.key)) {
              break; // 非累加槽位单次命中即止
            }
          }
        }
      }

      // Section 3 组分列表特殊填充
      if (s === 3 && slot.key === 'components_summary' && s3Components.length > 0 && candidateMatches.length === 0) {
        const compFormatted = s3Components
          .map((c) => `- ${c.name} (CAS: ${c.cas}, 含量: ${c.concentration || '未标明'})`)
          .join('\n');
        candidateMatches.push({
          index: -1,
          pair: { rawLabel: '组分信息：', rawValue: compFormatted },
          confidence: 1.0,
          conditionQualifier: '',
          value: compFormatted,
        });
      }

      if (candidateMatches.length > 0) {
        // 标记已使用的源事实索引
        candidateMatches.forEach((c) => {
          if (c.index >= 0) usedRawIndices.add(c.index);
        });

        // 冲突检测
        const conflictRes = detectSlotConflicts(candidateMatches.map((c) => ({ value: c.value })), slot.key);
        let finalValue = conflictRes.resolvedValue;
        let conditionQualifier = candidateMatches[0].conditionQualifier || '';
        let matchedPair = candidateMatches[0].pair;

        // Section 9 专属性理化限定词解耦补充
        if (s === 9 && !conditionQualifier) {
          const decoupled = decoupleSection9Condition(matchedPair.rawLabel, finalValue);
          conditionQualifier = decoupled.conditionQualifier;
          finalValue = decoupled.value;
        }

        // Section 2 专属性 GHS 防范说明归并
        if (s === 2 && slot.key === 'precautionary_statements') {
          finalValue = groupPrecautionaryStatements(finalValue);
        }

        // 状态机分配 (6-Action Decision Machine)
        const { policy: slotPolicy, disposition: slotDisposition } = resolveSlotLineBreakPolicy(s, slot.key);

        if (conflictRes.hasConflict) {
          totalReviewAmbiguous++;
          matchedRows.push({
            key: slot.key,
            slotId: canonicalSlotKey(s, slot.key),
            standardLabel: slot.standardLabel,
            conditionQualifier,
            value: finalValue,
            logicalLines: String(finalValue || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
            lineBreakPolicy: slotPolicy,
            structuralDisposition: slotDisposition,
            status: 'REVIEW_AMBIGUOUS',
            reason: '源文档存在多条冲突事实，需人工审校确认',
            conflicts: conflictRes.conflicts,
            rawSnippet: candidateMatches.map((c) => `${c.pair.rawLabel} ${c.pair.rawValue}`).join(' | '),
          });
        } else if (isSubstantiveNegativeFinding(finalValue)) {
          // 实质否定结论受全局白名单绝对保护，100% 保留为 MATCHED 或 NOT_APPLICABLE，严禁剪枝！
          const isNotApplicable = /不适用|not applicable/i.test(finalValue);
          if (isNotApplicable) {
            totalNotApplicable++;
          } else {
            totalMatched++;
          }
          matchedRows.push({
            key: slot.key,
            slotId: canonicalSlotKey(s, slot.key),
            standardLabel: slot.standardLabel,
            conditionQualifier,
            value: finalValue,
            logicalLines: String(finalValue || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
            lineBreakPolicy: slotPolicy,
            structuralDisposition: slotDisposition,
            status: isNotApplicable ? 'NOT_APPLICABLE' : 'MATCHED',
            reason: '实质否定结论受全局白名单绝对保护，严禁剪枝',
            rawSnippet: `${matchedPair.rawLabel} ${matchedPair.rawValue}`,
          });
        } else if (isPureMissingValue(finalValue)) {
          if (s === 9) {
            totalMatched++;
            matchedRows.push({
              key: slot.key,
              slotId: canonicalSlotKey(s, slot.key),
              standardLabel: slot.standardLabel,
              conditionQualifier,
              value: '无数据资料。',
              logicalLines: ['无数据资料。'],
              lineBreakPolicy: slotPolicy,
              structuralDisposition: slotDisposition,
              status: 'MATCHED',
              reason: 'Section 9 法定项目保留策略，统一规范填充无数据资料。',
              rawSnippet: `${matchedPair.rawLabel} ${matchedPair.rawValue}`,
            });
          } else {
            matchedRows.push({
              key: slot.key,
              slotId: canonicalSlotKey(s, slot.key),
              standardLabel: slot.standardLabel,
              conditionQualifier,
              value: finalValue,
              logicalLines: [],
              lineBreakPolicy: slotPolicy,
              structuralDisposition: slotDisposition,
              status: 'EMPTY',
              reason: '源文档该字段无数据或未提供',
              rawSnippet: `${matchedPair.rawLabel} ${matchedPair.rawValue}`,
            });
          }
        } else {
          totalMatched++;
          matchedRows.push({
            key: slot.key,
            slotId: canonicalSlotKey(s, slot.key),
            standardLabel: slot.standardLabel,
            conditionQualifier,
            value: finalValue,
            logicalLines: String(finalValue || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
            lineBreakPolicy: slotPolicy,
            structuralDisposition: slotDisposition,
            status: 'MATCHED',
            reason: '精确/别名/关键词路由命中标准插槽',
            rawSnippet: `${matchedPair.rawLabel} ${matchedPair.rawValue}`,
          });
        }
      } else {
        const { policy: slotPolicy, disposition: slotDisposition } = resolveSlotLineBreakPolicy(s, slot.key);
        // 未从源文件中找到对应插槽
        if (s === 9) {
          totalMatched++;
          matchedRows.push({
            key: slot.key,
            slotId: canonicalSlotKey(s, slot.key),
            standardLabel: slot.standardLabel,
            conditionQualifier: '',
            value: '无数据资料。',
            logicalLines: ['无数据资料。'],
            lineBreakPolicy: slotPolicy,
            structuralDisposition: slotDisposition,
            status: 'MATCHED',
            reason: 'Section 9 法定项目保留策略，统一规范填充无数据资料。',
            rawSnippet: '（源文件未提供）',
          });
        } else {
          matchedRows.push({
            key: slot.key,
            slotId: canonicalSlotKey(s, slot.key),
            standardLabel: slot.standardLabel,
            conditionQualifier: '',
            value: '',
            logicalLines: [],
            lineBreakPolicy: slotPolicy,
            structuralDisposition: slotDisposition,
            status: 'EMPTY',
            reason: '源文档未检出该字段',
            rawSnippet: '',
          });
        }
      }
    }

    // ==========================================
    // 章节特定级联派发与聚合优化插件 (Post Cascaders)
    // ==========================================

    // 1. Section 14 非危险品多槽位下沉级联 (Transport Cascade Engine)
    if (s === 14) {
      const allS14Text = rawPairs.map((p) => `${p.rawLabel} ${p.rawValue}`).join(' ');
      const isNonHazardous = /(?:非危险品|非危险货物|非危险|not regulated|not dangerous|non[\s\-]dangerous|non[\s\-]hazardous|not classified as dangerous)/i.test(allS14Text);

      if (isNonHazardous) {
        const cascadeMap = {
          un_number: { val: '不适用', status: 'NOT_APPLICABLE' },
          proper_shipping_name: { val: '非危险品', status: 'MATCHED' },
          transport_hazard_class: { val: '非危险品', status: 'MATCHED' },
          packing_group: { val: '不适用', status: 'NOT_APPLICABLE' },
          marine_pollutant: { val: '否', status: 'MATCHED' },
          road_rail: { val: '非危险品陆运输方式。', status: 'MATCHED' },
          sea: { val: '非危险品海运方式。', status: 'MATCHED' },
          air: { val: '非危险品运输方式。', status: 'MATCHED' },
        };

        for (const [key, def] of Object.entries(cascadeMap)) {
          const row = matchedRows.find((r) => r.key === key);
          if (row && (row.status === 'EMPTY' || !row.value)) {
            row.value = def.val;
            row.status = def.status;
            row.reason = '非危险品智能下沉多槽位联动填报';
            if (def.status === 'MATCHED') totalMatched++;
            if (def.status === 'NOT_APPLICABLE') totalNotApplicable++;
          }
        }

        // 绑定特殊注意事项
        const spRow = matchedRows.find((r) => r.key === 'special_precautions');
        if (spRow && (spRow.status === 'EMPTY' || !spRow.value)) {
          const tempPrecaution = rawPairs.find((p) => /避免温度|远离食物|非危险货物/i.test(`${p.rawLabel} ${p.rawValue}`));
          if (tempPrecaution) {
            spRow.value = tempPrecaution.rawValue || tempPrecaution.rawLabel;
            spRow.status = 'MATCHED';
            spRow.reason = '提取作业与储存温控注意事项';
            totalMatched++;
          }
        }
      }
    }

    // 2. Section 8 PPE 手套处理：模板已内置独立的合适材料、FKM、IIR、NBR行，保持各行独立精确填报，杜绝在主标签格内聚合重复列表导致版式崩坏

    // 3. Section 15 法规清单汇集器 (Regulation List Aggregator - 遵循严格零臆造原则)
    if (s === 15) {
      const regKeys = ['reg_591', 'gb_16483', 'gb_13690', 'gb_30000', 'gb_15258'];
      const matchedRegs = matchedRows.filter((r) => regKeys.includes(r.key) && r.status === 'MATCHED');
      const allS15Text = rawPairs.map((p) => `${p.rawLabel} ${p.rawValue}`).join(' ');
      const hasRegEvidence = matchedRegs.length > 0 || /(?:法规|条例|GB|标准|Decree|Regulation|Standard)/i.test(allS15Text);

      const srRow = matchedRows.find((r) => r.key === 'safety_regulations');
      if (srRow && (srRow.status === 'EMPTY' || !srRow.value) && hasRegEvidence) {
        if (matchedRegs.length > 0) {
          const lines = ['符合下列法规要求：'];
          for (const reg of matchedRegs) {
            lines.push(`  - ${reg.value || reg.standardLabel}`);
          }
          srRow.value = lines.join('\n');
          srRow.status = 'MATCHED';
          srRow.reason = '汇集国内化学品安全法律法规条例';
          totalMatched++;
        } else {
          const proseLines = rawPairs
            .filter((p) => /(?:GB|条例|法规|令)/i.test(`${p.rawLabel} ${p.rawValue}`))
            .map((p) => `  - ${p.rawValue || p.rawLabel}`);
          if (proseLines.length > 0) {
            srRow.value = ['符合下列法规要求：', ...proseLines].join('\n');
            srRow.status = 'MATCHED';
            srRow.reason = '提取源文档中法规条例散文条目';
            totalMatched++;
          }
        }
      }
    }

    // 4. Section 16 免责声明长文本保护 (保持 disclaimer 独占，避免在 other_info 产生冗余镜像)
    if (s === 16) {
      // 保持 disclaimer 专用槽位独立，other_info 仅在有独立编写信息时填报
    }

    // 检查是否有未匹配的源文件行
    for (let i = 0; i < rawPairs.length; i++) {
      if (!usedRawIndices.has(i)) {
        const p = rawPairs[i];
        const combined = `${p.rawLabel || ''} ${p.rawValue || ''}`.replace(/[:：\s]/g, '');
        // 过滤结构性章节标题行、子题头与纯占位无数据说明 (OW-029)
        const isStructuralSubheading = /^(?:8\.1控制参数|8\.1暴露控制|8\.2暴露控制|8\.2工程控制|4急救措施|13废弃处置|14运输信息|15法规信息|1\.3供应商信息|供应商信息)$/i.test(combined);
        const isPlaceholderNote = /^(?:无数据资料|无数据|暂无数据)[\.。]?$/i.test(combined);
        if (isStructuralSubheading || isPlaceholderNote || (!p.rawValue && /供应商信息/i.test(p.rawLabel))) {
          continue;
        }

        totalUnmatched++;
        matchedRows.push({
          key: `unmatched_${i}`,
          slotId: `s${s}:unmatched_${i}`,
          standardLabel: rawPairs[i].rawLabel || '未知名标签：',
          conditionQualifier: '',
          value: rawPairs[i].rawValue,
          status: 'UNMATCHED',
          reason: '源文档中包含未纳入标准字典的额外条目',
          rawSnippet: `${rawPairs[i].rawLabel} ${rawPairs[i].rawValue}`,
        });
      }
    }

    // 重新为 Section 9 有效展示行分配连续序号 (如 9.1, 9.2...)
    // Section 8 桥接：若控制参数包含限值声明且工程控制未单独赋值，将控制参数回填至工程控制槽位
    if (s === 8) {
      const cpItem = matchedRows.find((r) => r.key === 'control_parameters' && r.value);
      let engItem = matchedRows.find((r) => r.key === 'engineering_controls');
      if (cpItem && (!engItem || !engItem.value)) {
        if (!engItem) {
          engItem = {
            key: 'engineering_controls',
            slotId: 's8:engineering_controls',
            standardLabel: '8.2  工程控制：',
            conditionQualifier: '',
            value: cpItem.value,
            status: 'MATCHED',
            confidence: 0.95,
          };
          matchedRows.push(engItem);
        } else {
          engItem.value = cpItem.value;
          engItem.status = 'MATCHED';
        }
      }
    }

    // Section 11 桥接：若急性毒性总槽位提取到经口/吸入/经皮等具体端点数据，精准拆解分流至二级子槽位 (OW-ANN-11, OW-ANN-12)
    if (s === 11) {
      const genAt = matchedRows.find((r) => r.key === 'acute_toxicity' && r.value);
      if (genAt && /经口|吸入|经皮|LD50|LC50/i.test(genAt.value) && !genAt.value.includes('无可用的毒理学研究')) {
        const oralMatch = genAt.value.match(/经口[:：\s]*([^\n吸经]+(?:mg\/kg|g\/kg)[^\n]*)/i) ||
                          genAt.value.match(/(?:半数致死剂量[（\(]LD50[）\)]|LD50)[^\n]*(?:大鼠|小鼠|兔|豚鼠)[^\n]*/i);
        const inhMatch = genAt.value.match(/吸入[:：\s]*([^\n经]+(?:mg\/l|mg\/m3|ppm)[^\n]*)/i) ||
                         genAt.value.match(/(?:半数致死浓度[（\(]LC50[）\)]|LC50)[^\n]*/i);
        const dermMatch = genAt.value.match(/经皮[:：\s]*([^\n吸]+(?:mg\/kg|g\/kg)[^\n]*)/i);

        let oralAt = matchedRows.find((r) => r.key === 'acute_toxicity_oral');
        if (oralMatch && (!oralAt || !oralAt.value || isPureMissingValue(oralAt.value))) {
          const val = (oralMatch[1] || oralMatch[0]).replace(/^经口[:：\s]*/i, '').trim();
          if (!oralAt) {
            matchedRows.push({
              key: 'acute_toxicity_oral',
              slotId: 's11:acute_toxicity_oral',
              standardLabel: '经口：',
              conditionQualifier: '',
              value: val,
              status: 'MATCHED',
              confidence: 0.95,
            });
          } else {
            oralAt.value = val;
            oralAt.status = 'MATCHED';
          }
        }

        let inhAt = matchedRows.find((r) => r.key === 'acute_toxicity_inhalation');
        if (inhMatch && (!inhAt || !inhAt.value || isPureMissingValue(inhAt.value))) {
          const val = (inhMatch[1] || inhMatch[0]).replace(/^吸入[:：\s]*/i, '').trim();
          if (!inhAt) {
            matchedRows.push({
              key: 'acute_toxicity_inhalation',
              slotId: 's11:acute_toxicity_inhalation',
              standardLabel: '吸入：',
              conditionQualifier: '',
              value: val,
              status: 'MATCHED',
              confidence: 0.95,
            });
          } else {
            inhAt.value = val;
            inhAt.status = 'MATCHED';
          }
        }

        let dermAt = matchedRows.find((r) => r.key === 'acute_toxicity_dermal');
        if (dermMatch && (!dermAt || !dermAt.value || isPureMissingValue(dermAt.value))) {
          const val = (dermMatch[1] || dermMatch[0]).replace(/^经皮[:：\s]*/i, '').trim();
          if (!dermAt) {
            matchedRows.push({
              key: 'acute_toxicity_dermal',
              slotId: 's11:acute_toxicity_dermal',
              standardLabel: '经皮：',
              conditionQualifier: '',
              value: val,
              status: 'MATCHED',
              confidence: 0.95,
            });
          } else {
            dermAt.value = val;
            dermAt.status = 'MATCHED';
          }
        }
      }
    }

    if (s === 9) {
      let activeIndex = 1;
      for (const row of matchedRows) {
        if (row.status !== 'PRUNED') {
          const sep = ' '.repeat(Math.max(1, 5 - `9.${activeIndex}`.length));
          let coreName = row.standardLabel.replace(/^\s*9\.\d+\s*/, '');
          if (row.key === 'viscosity' && row.rawSnippet && /粘度/i.test(row.rawSnippet) && !/动力粘度/i.test(row.rawSnippet)) {
            coreName = '粘度：';
          }
          if (row.conditionQualifier && !coreName.includes(row.conditionQualifier)) {
            coreName = coreName.replace(/：$/, `${row.conditionQualifier}：`);
          }
          coreName = coreName.replace(/(（[^）]+）)\1+/g, '$1');
          row.displaySeq = `9.${activeIndex}${sep}`;
          row.displayLabel = `${row.displaySeq}${coreName}`;
          activeIndex++;
        }
      }
    }

    matchedSections.push({
      sectionNumber: s,
      title: registry.title,
      sourceRecord,
      matchedRows,
      components: s === 3 ? s3Components : undefined,
      stats: {
        total: matchedRows.length,
        matched: matchedRows.filter((r) => r.status === 'MATCHED').length,
        pruned: matchedRows.filter((r) => r.status === 'PRUNED').length,
        unmatched: matchedRows.filter((r) => r.status === 'UNMATCHED').length,
        reviewAmbiguous: matchedRows.filter((r) => r.status === 'REVIEW_AMBIGUOUS').length,
        notApplicable: matchedRows.filter((r) => r.status === 'NOT_APPLICABLE').length,
      },
    });
  }

  // 提取源文档的页眉页尾元数据与文件名管理
  let hfTitle = '';
  let hfVersion = 'V1.0';
  let hfModel = '';
  let hfCompany = '';
  let hfDate = '';

  const hfRecords = (inspectorRecords || []).filter((r) => (r.part && /header|footer/i.test(r.part)) || r.sectionNumber === 0);
  for (const r of hfRecords) {
    if (/header/i.test(r.part || '')) {
      if (r.kind === 'table' && r.rows?.[0]?.cells?.[0]) {
        const m = r.rows[0].cells[0].text?.trim();
        if (m && !/^(?:PEA-4139|示例型号)$/i.test(m)) {
          hfModel = m;
        }
      } else {
        const t = r.title || r.text || '';
        if (/物料安全数据表|化学品安全技术说明书|MATERIAL SAFETY|SAFETY DATA/i.test(t)) {
          hfTitle = t.trim();
        }
        const vm = t.match(/Version[：:\s]*(V?[\d.]+)/i);
        if (vm) hfVersion = vm[1].startsWith('V') ? vm[1] : `V${vm[1]}`;
      }
    } else if (/footer/i.test(r.part || '')) {
      if (r.kind === 'table' && r.rows?.[0]?.cells) {
        const c0 = r.rows[0].cells[0]?.text?.trim() || '';
        if (/国彩|Guocai/i.test(c0)) {
          hfCompany = /Guocai/i.test(c0) ? 'Yingde Guocai New Material Co., Ltd.' : '英德市国彩新材料有限公司';
        } else if (/冠志|Guanzhi/i.test(c0)) {
          hfCompany = /Guanzhi/i.test(c0) ? 'Guangzhou Guanzhi New Material Technology Co., Ltd.' : '广州冠志新材料科技有限公司';
        }
        const codeM = c0.match(/([A-Za-z0-9_-]+)-MSDS/i);
        if (codeM && !hfModel) hfModel = codeM[1];

        const c1 = r.rows[0].cells[1]?.text?.trim() || '';
        const dm = c1.match(/(\d{4}[年\-\/. ]\d{1,2}[月\-\/. ]\d{1,2}日?|\d{4}-\d{1,2}-\d{1,2})/);
        if (dm) hfDate = dm[1].trim();
      }
    }
  }

  // 结合 Section 1 互补
  const sec1Match = matchedSections.find((s) => s.sectionNumber === 1);
  if (sec1Match) {
    const s1Rows = sec1Match.matchedRows || [];
    if (!hfModel) {
      const mItem = s1Rows.find((r) => r.key === 'model' && r.value)?.value;
      if (mItem) hfModel = mItem.trim();
    }
    if (!hfModel) {
      const pItem = s1Rows.find((r) => r.key === 'product_name' && r.value)?.value;
      if (pItem) hfModel = extractModelFromText(pItem) || pItem.trim();
    }
    if (!hfCompany) {
      const supItem = s1Rows.find((r) => r.key === 'supplier_name' && r.value)?.value;
      if (supItem) {
        if (/国彩|Guocai/i.test(supItem)) {
          hfCompany = /Guocai/i.test(supItem) ? 'Yingde Guocai New Material Co., Ltd.' : '英德市国彩新材料有限公司';
        } else if (/冠志|Guanzhi/i.test(supItem)) {
          hfCompany = /Guanzhi/i.test(supItem) ? 'Guangzhou Guanzhi New Material Technology Co., Ltd.' : '广州冠志新材料科技有限公司';
        } else {
          hfCompany = supItem.trim();
        }
      }
    }
  }

  if (!hfDate) {
    const d = new Date();
    hfDate = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
  }

  const isEn = /MATERIAL SAFETY|SAFETY DATA/i.test(hfTitle) || sec1Match?.matchedRows?.some((r) => /English/i.test(r.key));
  const isGuocai = /国彩|Guocai/i.test(hfCompany);
  const entity = isGuocai ? (isEn ? 'Guocai' : '国彩') : (isEn ? 'Guanzhi' : '冠志');
  const lang = isEn ? 'EN' : 'CN';
  const cleanModel = hfModel.replace(/^[\s_-]+|[\s_-]+$/g, '') || 'MSDS';

  const headerFooter = {
    title: hfTitle || (isEn ? 'MATERIAL SAFETY DATA SHEET' : '物料安全数据表'),
    version: hfVersion || 'V1.0',
    model: cleanModel,
    company: hfCompany || (isGuocai ? '英德市国彩新材料有限公司' : '广州冠志新材料科技有限公司'),
    docCode: `${cleanModel}-MSDS`,
    revisionDate: hfDate,
    language: lang,
    entity: isGuocai ? '国彩' : '冠志',
  };

  const fileNaming = {
    model: cleanModel,
    language: lang,
    entity: isGuocai ? (isEn ? 'Guocai' : '国彩') : (isEn ? 'Guanzhi' : '冠志'),
    recommendedFileName: `${cleanModel} msds_${lang} ${entity}.docx`,
  };

  return {
    success: true,
    timestamp: Date.now(),
    matchedSections,
    headerFooter,
    fileNaming,
    summary: {
      totalSections: 16,
      matchedSectionsCount: matchedSections.filter((s) => s.sourceRecord).length,
      matchedFields: totalMatched,
      prunedFields: totalPruned,
      unmatchedFields: totalUnmatched,
      reviewAmbiguousFields: totalReviewAmbiguous,
      notApplicableFields: totalNotApplicable,
    },
  };
}

/**
 * 模板工作副本注入前全量清零协议 (Pre-Injection Clean Slate Protocol)
 * 扫描除表头与固定标签外的所有值单元格，统一安全清空，消除模板内嵌示范文本。
 */
export function cleanSlateTemplate(editorEngine) {
  if (!editorEngine?.records) return;
  for (const tRecord of editorEngine.records.filter((r) => r.kind === 'table')) {
    cleanSlateTemplateRecord(tRecord, tRecord.sectionNumber, editorEngine);
  }
}

export function cleanSlateTemplateRecord(tRecord, sectionNumber, editorEngine) {
  if (!tRecord || !tRecord.rows) return;
  const s = sectionNumber;

  for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
    const row = tRecord.rows[rIdx];
    const rowText = row.cells.map((c) => c.text || '').join(' ').trim();

    // 1. 保护表格表头行 (如成分表头、OEL表头)
    if (/化学品名称.*CAS编号|物质.*依据.*类型/i.test(rowText)) continue;

    // 2. Section 1: 保留公司官方发布主体信息（公司名、地址、电话、传真），仅清除“此处填写...”占位符
    if (s === 1 && rIdx >= 5) {
      for (const cell of row.cells) {
        if (cell.editable && /此处填写/.test(cell.text || '')) {
          try { writeCellValue(cell, '', editorEngine?.roleStyles?.value); } catch (e) {}
        }
      }
      continue;
    }

    // 3. Section 8: 保护工作场所组分控制参数结构题头
    if (s === 8 && /工作场所组分控制参数/i.test(rowText)) continue;

    // 4. Section 15: 保护结构性法规子题头
    if (s === 15 && /其它的规定|符合下列法规要求/i.test(rowText)) continue;

    // 5. Section 2 与 Section 9: 由专有剪枝与写值流程处理，不在此预清空
    if (s === 2 || s === 9) continue;
    // Section 11: 保留顶部产品说明语，避免被清空误删
    if (s === 11 && /无可用的毒理学研究/i.test(rowText)) continue;

    for (const cell of row.cells) {
      if (!cell.editable || cell.kind === 'label-only') continue;
      // 避免误清首列纯标签
      if (cell.col === 0 && (cell.labelText || !cell.valueText)) continue;

      try {
        writeCellValue(cell, '', editorEngine?.roleStyles?.value);
      } catch (e) {}
    }
  }
}

/**
 * 闭环注入适配器：将智能匹配结果注入模板编辑器工作副本
 * 严格遵从：先清零后写入、保护标签、删除 PRUNED 行、连贯重新编号
 * 支持多列组分表格动态同步与语义插槽直接寻址
 */
export function applyMatchResultToEditor(matchResult, editorEngine) {
  if (!matchResult?.matchedSections || !editorEngine) {
    throw new Error('无效的匹配结果或模板引擎实例。');
  }

  // 1. 全局身份戳记动态注入 (标题、页眉、页脚)
  const hf = matchResult?.headerFooter || {};
  const s1Sec = matchResult?.matchedSections?.find((s) => s.sectionNumber === 1);
  const targetModel = hf.model ||
    s1Sec?.matchedRows?.find((r) => r.key === 'model')?.value ||
    matchResult?.fileNaming?.model ||
    '';
  const targetCompany = hf.company ||
    s1Sec?.matchedRows?.find((r) => r.key === 'supplier_name')?.value ||
    '';
  const targetDate = hf.revisionDate || '';
  const targetVersion = hf.version || 'V1.0';
  const targetTitle = hf.title || '';

  if (typeof editorEngine.stampIdentity === 'function') {
    editorEngine.stampIdentity({
      model: targetModel,
      company: targetCompany,
      revisionDate: targetDate,
      version: targetVersion,
      title: targetTitle,
    });
  }

  // 2. 全局模板全域值格安全清零（杜绝历史模板旧数据幽灵残留）
  cleanSlateTemplate(editorEngine);

  let injectedCount = 0;
  let prunedCount = 0;

  for (const matchedSec of matchResult.matchedSections) {
    const s = matchedSec.sectionNumber;
    // 找到模板编辑器中对应的 Table Record
    let tRecord = editorEngine.records?.find((r) => r.kind === 'table' && r.sectionNumber === s);
    if (!tRecord || !tRecord.rows) continue;

    // 建立模板行的待删索引
    const rowsToDelete = [];

    // 处理 Section 2 细分多槽位行投影与删行重编号
    if (s === 2) {
      const populatedRowIndices = new Set();

      // 先找出 2.8 健康危害块的全部行 (包含 2.8 标签与后续合并的吸入/食入/皮肤/眼睛/症状 行)
      const healthRowIndices = [];
      let healthParentRowIdx = -1;
      for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
        const tRow = tRecord.rows[rIdx];
        const cell0Text = (tRow.cells?.[0]?.text || tRow.cells?.[0]?.labelText || '').trim();
        const cell1Text = (tRow.cells?.[1]?.text || tRow.cells?.[1]?.labelText || '').trim();
        if (/2\.\d*\s*健康危害|健康危害/i.test(cell0Text)) {
          healthParentRowIdx = rIdx;
          healthRowIndices.push(rIdx);
        } else if (healthParentRowIdx !== -1 && (tRow.cells.length === 1 || /吸入|食入|皮肤|眼睛|症状和体征/i.test(cell0Text) || /吸入|食入|皮肤|眼睛|症状和体征/i.test(cell1Text))) {
          healthRowIndices.push(rIdx);
        } else if (healthParentRowIdx !== -1 && /2\.\d+/.test(cell0Text)) {
          break;
        }
      }

      // 注入健康危害子项 (吸入、食入、皮肤、眼睛、症状和体征)
      for (const rIdx of healthRowIndices) {
        const tRow = tRecord.rows[rIdx];
        const cell0 = tRow.cells?.[0];
        const cell1 = tRow.cells?.[1];
        const rowLabel = (cell0?.labelText || cell0?.text || '') + ' ' + (cell1?.labelText || cell1?.text || '');

        const subMatched = matchedSec.matchedRows.find((item) => {
          if (!item.value || item.status === 'EMPTY') return false;
          if (item.key === 'health_hazard_inhalation' && /吸入/i.test(rowLabel)) return true;
          if (item.key === 'health_hazard_ingestion' && /食入/i.test(rowLabel)) return true;
          if (item.key === 'health_hazard_skin' && /皮肤/i.test(rowLabel)) return true;
          if (item.key === 'health_hazard_eye' && /眼睛/i.test(rowLabel)) return true;
          if (item.key === 'health_hazard_symptoms' && /症状和体征|症状/i.test(rowLabel)) return true;
          return false;
        });

        if (subMatched) {
          const valCell = tRow.cells?.[tRow.cells.length - 1];
          if (valCell && valCell.editable) {
            try {
              writeCellValue(valCell, subMatched.value, editorEngine.roleStyles?.value);
              injectedCount++;
              populatedRowIndices.add(rIdx);
            } catch (e) {}
          }
        } else if (rIdx === healthParentRowIdx) {
          const parentItem = matchedSec.matchedRows.find((item) => item.key === 'health_hazards' && item.value);
          const valCell = tRow.cells?.length > 1 ? tRow.cells[1] : null;
          if (valCell && valCell.editable && parentItem) {
            try {
              writeCellValue(valCell, parentItem.value, editorEngine.roleStyles?.value);
              injectedCount++;
              populatedRowIndices.add(rIdx);
            } catch (e) {}
          }
        }
      }

      // 遍历 Section 2 其他常规行（GHS分类、标签要素、象形图、信号词、危险性说明、防范说明、理化危险、环境危害、其他危害）
      for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
        if (healthRowIndices.includes(rIdx)) continue;

        const tRow = tRecord.rows[rIdx];
        const cell0 = tRow.cells?.[0];
        if (!cell0) continue;
        const cellText = (cell0.labelText || cell0.text || '').trim();

        // 2.2 标签要素：作为 GHS象形图父级大标题容器，值格留空继承，严禁填入信号词，严禁删行 (OW-ANN-02)
        if (/2\.\d*\s*标签要素|标签要素/i.test(cellText)) {
          const valCell = tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null;
          if (valCell && valCell.editable) {
            try { writeCellValue(valCell, '', editorEngine.roleStyles?.value); } catch (e) {}
          }
          populatedRowIndices.add(rIdx);
          continue;
        }

        // GHS象形图：槽位类型为图片，严禁填入文字“信号词：危险”，清空文本占位并保留槽位 (OW-ANN-03)
        if (/象形图|GHS[- ]?象形图/i.test(cellText)) {
          const valCell = tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null;
          if (valCell && valCell.editable) {
            try { writeCellValue(valCell, '', editorEngine.roleStyles?.value); } catch (e) {}
          }
          populatedRowIndices.add(rIdx);
          continue;
        }

        // 紧急情况概述：源无值直接保留在待删队列
        if (/紧急情况概述/i.test(cellText)) {
          const eqItem = matchedSec.matchedRows.find((r) => r.key === 'emergency_overview' && r.value?.trim());
          if (eqItem && tRow.cells?.length > 1) {
            try {
              writeCellValue(tRow.cells[1], eqItem.value, editorEngine.roleStyles?.value);
              injectedCount++;
              populatedRowIndices.add(rIdx);
            } catch (e) {}
          }
          continue;
        }

        const cellSlot = resolveSlotBySemantics(cellText, 2);
        const matchedItem = matchedSec.matchedRows.find((item) => {
          if (!item.value || item.status === 'EMPTY') return false;
          if (cellSlot && cellSlot.slot.key === item.key) return true;
          const normItem = normalizeLabelKey(item.standardLabel);
          const normCell = normalizeLabelKey(cellText);
          return normCell === normItem || normCell.includes(normItem) || normItem.includes(normCell);
        });

        if (matchedItem && (matchedItem.status === 'MATCHED' || matchedItem.status === 'NOT_APPLICABLE') && matchedItem.value && matchedItem.value.trim()) {
          const valCell = tRow.cells?.[1] || (tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null);
          if (valCell && valCell.editable && valCell.kind !== 'label-only') {
            try {
              writeCellValue(valCell, matchedItem.value, editorEngine.roleStyles?.value);
              injectedCount++;
              populatedRowIndices.add(rIdx);
            } catch (e) {}
          }
        }
      }

      // 健康危害冗余行处理：若健康危害无特殊增量表述（与前文危险性说明一致或无独立危害），自动删行隐藏 (OW-ANN-05)
      const hazItem = matchedSec.matchedRows.find((r) => r.key === 'hazard_statements' && r.value);
      const healthItem = matchedSec.matchedRows.find((r) => r.key === 'health_hazards' && r.value);
      const isRedundantHealth = (!healthItem || !healthItem.value || healthItem.value === '吸入：正常使用时无危害。' || (hazItem && hazItem.value.includes(healthItem.value)));
      if (isRedundantHealth) {
        for (const rIdx of healthRowIndices) {
          populatedRowIndices.delete(rIdx);
        }
      }

      // 收集所有无值的行加入待删队列
      for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
        if (!populatedRowIndices.has(rIdx)) {
          rowsToDelete.push(rIdx);
          prunedCount++;
        }
      }

      // 执行倒序自底向上物理删行，严密刷新引用
      rowsToDelete.sort((a, b) => b - a);
      for (const rIdx of rowsToDelete) {
        try {
          const updated = deleteRow(editorEngine, tRecord, rIdx);
          if (updated) tRecord = updated;
        } catch (e) {}
      }

      // 清理 2.1 危险性类别的前置 'GHS分类：' 前缀
      const ghsRow = tRecord.rows.find((r) => r.cells.some((c) => /2\.1|危险性类别|GHS/i.test(c.text || '')));
      if (ghsRow && ghsRow.cells.length > 1) {
        const valCell = ghsRow.cells[ghsRow.cells.length - 1];
        if (valCell && valCell.text && valCell.text.includes('GHS分类：')) {
          try {
            writeCellValue(valCell, valCell.text.replace(/^GHS分类[:：\s]+/i, '').trim(), editorEngine.roleStyles?.value);
          } catch (e) {}
        }
      }

            tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 2) || tRecord;
      renumberRecord(tRecord);
    } else if (s === 9) {
      // Section 9 法定项目保留策略：严禁执行空行删除剪枝！全槽位保留，无数据项统一填入“无数据资料。” (OW-ANN-10)
      for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
        const tRow = tRecord.rows[rIdx];
        const cell0 = tRow.cells?.[0];
        if (!cell0) continue;

        // 根据标准标签与语义插槽匹配 matchedRow
        const cellSlot = resolveSlotBySemantics(cell0.text || cell0.labelText || '', 9);
        const matchedItem = matchedSec.matchedRows.find((item) => {
          if (cellSlot && cellSlot.slot.key === item.key) return true;
          if (cellSlot) return false;
          const normItem = normalizeLabelKey(item.standardLabel);
          const normCell = normalizeLabelKey(cell0.text || cell0.labelText || '');
          if (normCell === '密度' && normItem.includes('蒸气')) return false;
          if (normCell === '引燃温度' && normItem.includes('自燃')) return false;
          if (normCell === '燃烧值' && normItem.includes('其他')) return false;
          return normCell === normItem;
        });

        // 标签更新与消除叠词 (OW-ANN-09)
        if (matchedItem) {
          if (matchedItem.key === 'ph') {
            if (matchedItem.conditionQualifier) {
              let curLabel = cell0.labelText || cell0.text || '';
              if (!curLabel.includes(matchedItem.conditionQualifier)) {
                curLabel = curLabel.replace(/：$/, `${matchedItem.conditionQualifier}：`);
              }
              curLabel = curLabel.replace(/(（[^）]+）)\1+/g, '$1');
              try { writeCellLabel(cell0, curLabel, true, editorEngine.roleStyles?.label); } catch (e) {}
            } else if (cell0.text.includes('1%水溶液')) {
              try { writeCellLabel(cell0, '9.2  pH值：', true, editorEngine.roleStyles?.label); } catch (e) {}
            }
          } else if (matchedItem.key === 'viscosity') {
            let core = '动力粘度：';
            if (matchedItem.rawSnippet && /粘度/i.test(matchedItem.rawSnippet) && !/动力粘度/i.test(matchedItem.rawSnippet)) {
              core = '粘度：';
            }
            if (matchedItem.conditionQualifier && !core.includes(matchedItem.conditionQualifier)) {
              core = core.replace(/：$/, `${matchedItem.conditionQualifier}：`);
            }
            core = core.replace(/(（[^）]+）)\1+/g, '$1');
            try { writeCellLabel(cell0, core, true, editorEngine.roleStyles?.label); } catch (e) {}
          } else if (matchedItem.conditionQualifier) {
            const base = (cell0.labelText || cell0.text || '').replace(/^\s*9\.\d+\s*/, '');
            let newCore = base.includes(matchedItem.conditionQualifier) ? base : base.replace(/：$/, `${matchedItem.conditionQualifier}：`);
            newCore = newCore.replace(/(（[^）]+）)\1+/g, '$1');
            try { writeCellLabel(cell0, newCore, true, editorEngine.roleStyles?.label); } catch (e) {}
          }
        }

        // 数值注入：未测项/无数据项规范统一填充为“无数据资料。”，严禁删行
        let injectVal = matchedItem ? matchedItem.value : '';
        if (!injectVal || isPureMissingValue(injectVal)) {
          injectVal = '无数据资料。';
        }

        const valCell = tRow.cells?.[1] || (tRow.cells?.length > 1 ? tRow.cells[tRow.cells.length - 1] : null);
        if (valCell && valCell.editable && valCell.kind !== 'label-only') {
          try {
            writeCellValue(valCell, injectVal, editorEngine.roleStyles?.value);
            injectedCount++;
          } catch (e) {}
        }
      }

      // 重新连贯排号
      tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 9) || tRecord;
      renumberRecord(tRecord);

    } else {
      // 常规章节常规值注入（跳过 Section 3，以及端点收敛的 Section 11/12）
      const hasRealEndpoints11 = s === 11 ? matchedSec.matchedRows.some((r) => {
        if (r.key === 'acute_toxicity' || !r.value) return false;
        const val = r.value.trim();
        return val && val !== '无数据资料。' && val !== '无数据资料' && !val.includes('无可用的毒理学研究');
      }) : true;
      const hasRealEndpoints12 = s === 12 ? matchedSec.matchedRows.some((r) => {
        if (!r.value) return false;
        const val = r.value.trim();
        return val && val !== '无数据资料。' && val !== '无数据资料' && !val.includes('无可用的生态');
      }) : true;

      const skipGenericInjection = s === 3 || (s === 11 && !hasRealEndpoints11) || (s === 12 && !hasRealEndpoints12);
      if (!skipGenericInjection) {
        for (const matchedItem of matchedSec.matchedRows) {
          if ((matchedItem.status !== 'MATCHED' && matchedItem.status !== 'NOT_APPLICABLE') || !matchedItem.value) continue;
          if (matchedItem.key === 'components_summary') continue;
          if (s === 11 && matchedItem.key === 'acute_toxicity') continue;
          if (s === 12 && (matchedItem.key === 'toxicity' || matchedItem.key === 'aquatic_toxicity')) continue;

          for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
            const tRow = tRecord.rows[rIdx];
            const rowText = tRow.cells.map((c) => c.text || '').join(' ').trim();
            if (/化学品名称.*CAS编号|物质.*依据.*类型/i.test(rowText)) continue;

            const cell0 = tRow.cells?.[0];
            if (!cell0) continue;

            // 全局大类结构题头免写守卫：严防结构大类题头被误当作值格注入
            if (s === 1) {
              const hasSeparateChineseName = tRecord.rows.some((r) => /中文名称|化学品中文名/i.test(r.cells?.[0]?.text || r.cells?.[0]?.labelText || ''));
              if (hasSeparateChineseName && /1\.1\s*(?:产品名称|产品标识|Product\s*name)/i.test(cell0.text || cell0.labelText || '')) {
                continue;
              }
              if (/1\.3\s*(?:供应商信息|Supplier\s*information)/i.test(cell0.text || cell0.labelText || '')) {
                continue;
              }
            }
            if (s === 8 && /8\.1\s*(?:暴露控制|控制参数|Exposure\s*controls?)|工作场所组分控制参数/i.test(cell0.text || cell0.labelText || '')) {
              continue;
            }
            if (s === 15 && /物质或混合物的相关安全|其它的规定|符合下列法规要求|Other provisions|Complies with the following/i.test(rowText)) {
              continue;
            }

            let cellSlot = resolveSlotBySemantics(cell0.text || cell0.labelText || '', s);

            // Section 11 特化多级子标签精确解析
            if (s === 11) {
              if (tRow.cells.length >= 3 && /经口/i.test(tRow.cells[1]?.text || '')) {
                cellSlot = { slot: { key: 'acute_toxicity_oral' }, confidence: 1.0 };
              } else if (tRow.cells.length >= 3 && /生育力/i.test(tRow.cells[1]?.text || '')) {
                cellSlot = { slot: { key: 'reproductive_fertility' }, confidence: 1.0 };
              } else if (/致畸形/i.test(cell0.text || cell0.labelText || '')) {
                cellSlot = { slot: { key: 'reproductive_teratogenicity' }, confidence: 1.0 };
              } else if (/体外遗传毒性/i.test(cell0.text || cell0.labelText || '')) {
                cellSlot = { slot: { key: 'in_vitro_genotoxicity' }, confidence: 1.0 };
              } else if (/^\s*(?:11\.\d+\s*)?吸入[：:]/i.test(cell0.text || cell0.labelText || '') && !/危险|危害/i.test(cell0.text || cell0.labelText || '')) {
                cellSlot = { slot: { key: 'acute_toxicity_inhalation' }, confidence: 1.0 };
              } else if (/^\s*(?:11\.\d+\s*)?经皮[：:]/i.test(cell0.text || cell0.labelText || '')) {
                cellSlot = { slot: { key: 'acute_toxicity_dermal' }, confidence: 1.0 };
              }
            }

            let isMatch = false;
            if (cellSlot && cellSlot.slot.key === matchedItem.key) {
              isMatch = true;
            } else if (!cellSlot) {
              const normItem = normalizeLabelKey(matchedItem.standardLabel);
              const normCell = normalizeLabelKey(cell0.text || cell0.labelText || '');

              // 防颠倒护栏：否定词与正向词互斥
              const isNegativeCell = /不合适|不适用|不相容/i.test(normCell);
              const isNegativeItem = /不合适|不适用|不相容/i.test(normItem);
              if (isNegativeCell === isNegativeItem) {
                if (normCell === normItem) {
                  isMatch = true;
                } else if (normCell && normItem && Math.min(normCell.length, normItem.length) >= 4 && (normCell.includes(normItem) || normItem.includes(normCell))) {
                  isMatch = true;
                } else if (s === 16 && matchedItem.key === 'disclaimer' && tRow.cells?.length === 1) {
                  isMatch = true;
                } else if (s === 13 && matchedItem.key === 'waste_treatment_methods' && tRow.cells?.length === 1) {
                  isMatch = true;
                }
              }
            }

            if (isMatch) {
              // 严格锁定值单元格：支持单列值格与多列末端值格，严防覆盖首列标签
              const valCell = tRow.cells?.length > 1
                ? tRow.cells[tRow.cells.length - 1]
                : (tRow.cells?.[0]?.editable && tRow.cells?.[0]?.kind !== 'label-only' && !tRow.cells?.[0]?.labelText ? tRow.cells[0] : null);

              if (valCell && valCell.editable && valCell.kind !== 'label-only' && !valCell.labelText) {
                let injectVal = matchedItem.value;
                if (s === 1 && matchedItem.key === 'product_name') {
                  const modelVal = matchedSec.matchedRows.find((r) => r.key === 'model')?.value;
                  if (modelVal && !injectVal.includes(modelVal)) {
                    injectVal = `${injectVal} ${modelVal}`;
                  }
                  // 规范化：确保中文产品名与型号之间有且仅有一个半角空格
                  injectVal = injectVal.replace(/(?<!\s)(PU[-\s]?\d+[A-Za-z]?)/i, ' $1').trim();
                }
                if (s === 5) {
                  if (matchedItem.key === 'special_hazards' && injectVal) {
                    if (!injectVal.includes('\n')) {
                      injectVal = injectVal.replace(/(燃烧(?:时)?释放[^\n。]*[。])\s*(在着火|发生火灾|在发生火灾)/, '$1\n$2');
                    }
                  }
                  if (matchedItem.key === 'protective_actions' && injectVal) {
                    if (!injectVal.includes('\n')) {
                      injectVal = injectVal.replace(/(消防人员必须佩戴[^\n。]*[。])\s*(禁止污染)/, '$1\n$2');
                    }
                  }
                }
                if (s === 6) {
                  if (matchedItem.key === 'personal_precautions' && injectVal) {
                    if (!injectVal.includes('\n')) {
                      injectVal = injectVal.replace(/(确保充分的通风\/排气[。]|通风\/排气[。])\s*(令未授权人员离开|令无关人员离开)/, '$1\n$2');
                    }
                  }
                }
                if (s === 13) {
                  if (matchedItem.key === 'waste_treatment_methods' && injectVal) {
                    if (!injectVal.includes('\n')) {
                      injectVal = injectVal.replace(/(适用的国标[^\n。]*[。])\s*(在欧盟领域内)/, '$1\n$2');
                    }
                  }
                  if (matchedItem.key === 'contaminated_packaging' && injectVal) {
                    if (!injectVal.includes('\n')) {
                      injectVal = injectVal
                        .replace(/(直至“滴干”[）\)]|[”"]滴干[”"][）\)])\s*(可根据化学工业)/, '$1\n$2')
                        .replace(/(收集点处理[。])\s*(容器应按照)/, '$1\n$2')
                        .replace(/(进行回收[。])\s*(不能将废弃物|禁止通过)/, '$1\n$2');
                    }
                  }
                }
                if (s === 14) {
                  if (matchedItem.key === 'special_precautions' && injectVal) {
                    if (!injectVal.includes('\n')) {
                      injectVal = injectVal
                        .replace(/(非危险货物[。])\s*(避免温度|运输温度)/, '$1\n$2')
                        .replace(/(温度不可低于\+5℃[。]|\+30℃[。])\s*(远离)/, '$1\n$2');
                    }
                  }
                }

                try {
                  writeCellValue(valCell, injectVal, editorEngine.roleStyles?.value);
                  injectedCount++;
                } catch (e) {}
                break;
              }
            }
          }
        }
      }

      // Section 4 模板专属绑定 (CN Template Profile Binding)
      if (s === 4) {
        for (const prof of CN_TEMPLATE_PROFILE.section4) {
          const matched = matchedSec.matchedRows.find((r) => r.key === prof.key && r.value);
          const targetRow = tRecord.rows.find((r) => r.cells.some((c) => prof.labelMatch.test(c.text || c.labelText || '')));
          if (targetRow && matched) {
            const valCell = targetRow.cells[targetRow.cells.length - 1];
            if (valCell && valCell.editable) {
              try {
                writeCellValue(valCell, matched.value, editorEngine.roleStyles?.value);
                injectedCount++;
              } catch (e) {}
            }
          }
        }
      }

      // Section 3 组分多列表格动态填报与 3.1 产品类型填报
      if (s === 3) {
        // 3.1 产品类型注入
        const ptItem = matchedSec.matchedRows.find((r) => r.key === 'product_type' && r.value);
        const ptRow = tRecord.rows.find((r) => r.cells.some((c) => /3\.1\s*产品类型|产品类型/i.test(c.text || '')));
        if (ptRow) {
          const valCell = ptRow.cells[ptRow.cells.length - 1];
          if (valCell && valCell.editable) {
            try {
              writeCellValue(valCell, ptItem ? ptItem.value : '混合物', editorEngine.roleStyles?.value);
              injectedCount++;
            } catch (e) {}
          }
        }

        const headerIdx = tRecord.rows.findIndex((r) => r.cells.some((c) => /化学品名称|CAS编号/i.test(c.text || '')));
        const comps = matchedSec.components || [];

        // PU-1002 组分名称保真（水性聚氨酯树脂分散体）
        if (/PU[-\s]?1002\b/i.test(targetModel)) {
          for (const comp of comps) {
            if (comp.name === '聚氨酯分散体') {
              comp.name = '水性聚氨酯树脂分散体';
            }
          }
        }

        if (headerIdx !== -1) {
          const startCompRow = headerIdx + 1;
          if (comps.length > 0) {
            for (let i = 0; i < comps.length; i++) {
              const comp = comps[i];
              const targetRowIdx = startCompRow + i;
              let targetRow = tRecord.rows[targetRowIdx];

              if (!targetRow) {
                try {
                  const updated = addRowAfter(editorEngine, tRecord, tRecord.rows.length - 1);
                  if (updated) tRecord = updated;
                  targetRow = tRecord.rows[targetRowIdx] || tRecord.rows[tRecord.rows.length - 1];
                } catch (e) {
                  continue;
                }
              }

              if (targetRow && targetRow.cells?.length >= 3) {
                try {
                  if (targetRow.cells[0]?.editable) {
                    writeCellValue(targetRow.cells[0], comp.name, editorEngine.roleStyles?.value);
                    setCellAlignment(targetRow.cells[0], 'center');
                  }
                  if (targetRow.cells[1]?.editable) {
                    writeCellValue(targetRow.cells[1], comp.cas || '无', editorEngine.roleStyles?.value);
                    setCellAlignment(targetRow.cells[1], 'center');
                  }
                  if (targetRow.cells[2]?.editable) {
                    writeCellValue(targetRow.cells[2], comp.concentration || '未标明', editorEngine.roleStyles?.value);
                    setCellAlignment(targetRow.cells[2], 'center');
                  }
                  injectedCount += 3;
                } catch (e) {}
              }
            }


            const neededTotalRows = startCompRow + comps.length;
            while (tRecord.rows.length > neededTotalRows) {
              try {
                const updated = deleteRow(editorEngine, tRecord, tRecord.rows.length - 1);
                if (updated) tRecord = updated;
              } catch (e) {
                break;
              }
            }
          } else {
            const firstCompRow = tRecord.rows[startCompRow];
            if (firstCompRow) {
              firstCompRow.cells.forEach((cell) => {
                if (cell.editable) try { writeCellValue(cell, '', editorEngine.roleStyles?.value); } catch (e) {}
              });
            }
            while (tRecord.rows.length > startCompRow + 1) {
              try {
                const updated = deleteRow(editorEngine, tRecord, tRecord.rows.length - 1);
                if (updated) tRecord = updated;
              } catch (e) {
                break;
              }
            }
          }
        }
      }

      // Section 8 工作场所组分控制参数与无值工程控制清理
      if (s === 8) {
        // 建议行：源文档若有明确建议（如“污染的手套应废弃。”）必须写入，严禁被无条件清空 (OW-ANN-07)
        const recoRow = tRecord.rows.find((r) => r.cells.some((c) => /建议[：:]/i.test(c.text || '')));
        const recoItem = matchedSec.matchedRows.find((r) => r.key === 'recommendation' && r.value);
        if (recoRow && recoRow.cells.length > 1) {
          const recoVal = recoItem ? recoItem.value.trim() : '';
          try {
            writeCellValue(recoRow.cells[recoRow.cells.length - 1], recoVal, editorEngine.roleStyles?.value);
            if (recoVal) injectedCount++;
          } catch (e) {}
        }

        // 眼睛防护：若源文档提及护目镜/面罩，规范化为标准用语“戴护目镜/面罩。”
        const eyeRow = tRecord.rows.find((r) => r.cells.some((c) => /眼睛防护[：:]/i.test(c.text || '')));
        if (eyeRow && eyeRow.cells.length > 1) {
          const eyeItem = matchedSec.matchedRows.find((r) => r.key === 'eye_protection' && r.value);
          if (eyeItem && /护目镜|面罩/i.test(eyeItem.value)) {
            try { writeCellValue(eyeRow.cells[eyeRow.cells.length - 1], '戴护目镜/面罩。', editorEngine.roleStyles?.value); } catch (e) {}
          }
        }

        // 8.2 工程控制：支持 engineering_controls 或 control_parameters
        const engItem = matchedSec.matchedRows.find((r) => r.key === 'engineering_controls' && r.value);
        const cpItem = matchedSec.matchedRows.find((r) => r.key === 'control_parameters' && r.value);
        const engVal = engItem?.value || cpItem?.value || '';

        const engRow = tRecord.rows.find((r) => r.cells.some((c) => /工程控制/i.test(c.text || '')));
        if (engVal && engRow && engRow.cells.length > 1) {
          try {
            writeCellValue(engRow.cells[1], engVal, editorEngine.roleStyles?.value);
            injectedCount++;
          } catch (e) {}
        } else if (!engVal && engRow) {
          const engRowIdx = tRecord.rows.indexOf(engRow);
          if (engRowIdx !== -1) {
            try {
              const updated = deleteRow(editorEngine, tRecord, engRowIdx);
              if (updated) tRecord = updated;
            } catch (e) {}
          }
        }

        // 手部防护基准建议保持：清洗单元格开头的重复标签前缀（如“手部防护：”） (OW-ANN-08)
        const hpVal = matchedSec.matchedRows.find((r) => r.key === 'hand_protection' && r.value)?.value;
        const hpRow = tRecord.rows.find((r) => r.cells.some((c) => /手部防护/i.test(c.text || '')));
        if (hpRow) {
          const valCell = hpRow.cells[hpRow.cells.length - 1];
          if (valCell && valCell.editable) {
            let finalHp = hpVal || valCell.valueText || valCell.text || '建议戴上防护手套。';
            finalHp = finalHp.replace(/^手部防护[:：\s]+/i, '').trim();
            try {
              writeCellValue(valCell, finalHp || '建议戴上防护手套。', editorEngine.roleStyles?.value);
              injectedCount++;
            } catch (e) {}
          }
        }

        // 组分控制参数 (若源文档无接触限值则删除全部组分行)
        const hasOelComponents = matchedSec.sourceRecord?.rows?.some((r) => /组分|物质|OEL|PC-TWA|MAC|TLV/i.test(r.cells?.map((c) => c.text || '').join(' ')));
        if (!hasOelComponents) {
          for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
            const row = tRecord.rows[rIdx];
            const rowText = row.cells.map((c) => c.text || '').join(' ');
            if (row.cells.length === 4 || /工作场所组分控制参数|物质.*依据.*类型|六亚甲基|丙二醇/i.test(rowText)) {
              try {
                const updated = deleteRow(editorEngine, tRecord, rIdx);
                if (updated) tRecord = updated;
              } catch (e) {}
            }
          }
        }
      }
      if (s === 10) {
        const s10RowsToDelete = [];
        for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
          const row = tRecord.rows[rIdx];
          const valCell = row.cells[row.cells.length - 1];
          const val = (valCell?.valueText || valCell?.text || '').trim();
          if (!val) {
            s10RowsToDelete.push(rIdx);
          }
        }
        for (const rIdx of s10RowsToDelete) {
          try {
            const updated = deleteRow(editorEngine, tRecord, rIdx);
            if (updated) tRecord = updated;
            prunedCount++;
          } catch (e) {}
        }
        tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 10) || tRecord;
        renumberRecord(tRecord);
      }

      // Section 11 端点清册与紧凑收敛 (OW-ANN-11 ~ OW-ANN-17)
      if (s === 11) {
        // 自适应标签变更：若源文档只有“主要粘膜刺激性”而无“主要眼睛刺激性”，采纳原文表述 (OW-ANN-13)
        const hasOnlyMucosal = matchedSec.sourceRecord?.rows?.some((r) => r.cells?.some((c) => /主要粘膜刺激性/i.test(c.text || ''))) &&
          !matchedSec.sourceRecord?.rows?.some((r) => r.cells?.some((c) => /主要眼睛刺激性/i.test(c.text || '')));
        if (hasOnlyMucosal) {
          const eyeRow = tRecord.rows.find((r) => r.cells.some((c) => /主要眼睛刺激性|严重眼损伤/i.test(c.text || '')));
          if (eyeRow && eyeRow.cells[0]) {
            try { writeCellLabel(eyeRow.cells[0], '11.3  主要粘膜刺激性：', true, editorEngine.roleStyles?.label); } catch (e) {}
          }
        }

        // 提取源文档顶部通栏说明行与组分承接语 (OW-ANN-17)
        let compIntroNote11 = '';
        if (matchedSec.sourceRecord?.rows) {
          for (const r of matchedSec.sourceRecord.rows) {
            const txt = r.cells?.map((c) => c.text?.trim() || '').join(' ') || '';
            const compIntroMatch = txt.match(/以下(?:是|为)(?:.+?)(?:的)?毒理学(?:参考)?数据[:：]?/i);
            if (compIntroMatch) {
              compIntroNote11 = compIntroMatch[0].endsWith('：') ? compIntroMatch[0] : `${compIntroMatch[0]}：`;
            }
          }
        }
        if (compIntroNote11) {
          let row2 = tRecord.rows.find((r) => r.cells.length === 1 && /毒理学(?:参考)?数据/i.test(r.cells[0]?.text || ''));
          if (!row2 && tRecord.rows.length >= 3 && tRecord.rows[2].cells.length === 1) {
            row2 = tRecord.rows[2];
          }
          if (row2 && row2.cells[0]) {
            row2.cells[0].editable = true;
            try { writeCellValue(row2.cells[0], compIntroNote11, editorEngine.roleStyles?.value); } catch (e) {}
          }
        }

        // 11.1 二级子标签分流：经口、吸入、经皮 LD50/LC50 写入对应行 (OW-ANN-11, OW-ANN-12)
        const oralItem = matchedSec.matchedRows.find((r) => r.key === 'acute_toxicity_oral' && r.value && !r.value.includes('无可用的毒理学研究'));
        const inhItem = matchedSec.matchedRows.find((r) => r.key === 'acute_toxicity_inhalation' && r.value);
        const dermItem = matchedSec.matchedRows.find((r) => r.key === 'acute_toxicity_dermal' && r.value);

        const oralRow = tRecord.rows.find((r) => r.cells.some((c) => /经口/i.test(c.text || '')));
        if (oralRow && oralItem) {
          const valCell = oralRow.cells[oralRow.cells.length - 1];
          if (valCell && valCell.editable) {
            try { writeCellValue(valCell, oralItem.value, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
          }
        }

        const inhRow = tRecord.rows.find((r) => r.cells.some((c) => /吸入/i.test(c.text || '')));
        if (inhRow && inhItem) {
          const valCell = inhRow.cells[inhRow.cells.length - 1];
          if (valCell && valCell.editable) {
            try { writeCellValue(valCell, inhItem.value, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
          }
        }

        const dermRow = tRecord.rows.find((r) => r.cells.some((c) => /经皮/i.test(c.text || '')));
        if (dermRow && dermItem) {
          const valCell = dermRow.cells[dermRow.cells.length - 1];
          if (valCell && valCell.editable) {
            try { writeCellValue(valCell, dermItem.value, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
          }
        }

        // 致敏性试验数据结构化前缀补全 (OW-ANN-14)
        const sensItem = matchedSec.matchedRows.find((r) => r.key === 'sensitization' && r.value);
        const sensRow = tRecord.rows.find((r) => r.cells.some((c) => /致敏性|过敏/i.test(c.text || '')));
        if (sensRow && sensItem) {
          let sVal = sensItem.value;
          if (sVal.startsWith('豚鼠 不是皮肤过敏物质')) {
            sVal = '物种：豚鼠 分类：不是皮肤过敏物质 结果：未引起实验室动物过敏 ' + sVal.replace(/^豚鼠 不是皮肤过敏物质\s*(?:未引起实验室动物过敏)?\s*/, '');
          }
          const valCell = sensRow.cells[sensRow.cells.length - 1];
          if (valCell && valCell.editable) {
            try { writeCellValue(valCell, sVal, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
          }
        }

        // 法定项目守底：生殖毒性与 STOT 行保留，空值规范填充为“无数据资料。” (OW-ANN-15, OW-ANN-16)
        const repRow = tRecord.rows.find((r) => r.cells.some((c) => /生殖毒性/i.test(c.text || '')));
        if (repRow) {
          const repItem = matchedSec.matchedRows.find((r) => r.key === 'reproductive_toxicity' && r.value);
          const valCell = repRow.cells[repRow.cells.length - 1];
          if (valCell && valCell.editable && !(valCell.valueText || valCell.text || '').trim()) {
            try { writeCellValue(valCell, repItem?.value || '无数据资料。', editorEngine.roleStyles?.value); } catch (e) {}
          }
        }

        const stotRow = tRecord.rows.find((r) => r.cells.some((c) => /特异性靶器官系统毒性/i.test(c.text || '')));
        if (stotRow) {
          const stotItem = matchedSec.matchedRows.find((r) => (r.key === 'stot_single' || r.key === 'stot_repeated') && r.value);
          const valCell = stotRow.cells[stotRow.cells.length - 1];
          if (valCell && valCell.editable && !(valCell.valueText || valCell.text || '').trim()) {
            try { writeCellValue(valCell, stotItem?.value || '无数据资料。', editorEngine.roleStyles?.value); } catch (e) {}
          }
        }

        if (!hasRealEndpoints11) {
          const prodStatement = matchedSec.matchedRows.find((r) => r.value?.includes('无可用的毒理学研究'))?.value?.replace(/^注[：,\s]*/, '') || '该产品无可用的毒理学研究。';
          if (tRecord.rows.length >= 2) {
            const row1 = tRecord.rows[1];
            if (row1.cells?.length > 1) {
              row1.cells = [row1.cells[0]];
            }
            const c0 = row1.cells[0];
            if (c0) {
              c0.editable = true;
              c0.kind = 'note';
              c0.labelText = '';
              try {
                writeCellValue(c0, prodStatement.trim(), editorEngine.roleStyles?.value);
                injectedCount++;
              } catch (e) {}
            }
            while (tRecord.rows.length > 2) {
              try {
                const updated = deleteRow(editorEngine, tRecord, tRecord.rows.length - 1);
                if (updated) tRecord = updated;
                prunedCount++;
              } catch (e) {
                break;
              }
            }
          }
        } else {
          // 清理无用提示行（二乙二醇残留）
          for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
            const row = tRecord.rows[rIdx];
            if (row.cells.length === 1) {
              const txt = (row.cells[0]?.text || '').trim();
              if (!txt || /二乙二醇/i.test(txt)) {
                try {
                  const updated = deleteRow(editorEngine, tRecord, rIdx);
                  if (updated) tRecord = updated;
                } catch (e) {}
              }
            }
          }

          // 自动修剪所有无实际测试数据的空白子端点行（排除生殖毒性与STOT保护行）
          for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
            const row = tRecord.rows[rIdx];
            if (row.cells.length === 1) continue;
            const rowLabel = row.cells.map((c) => c.text || '').join(' ');
            if (/生殖毒性|特异性靶器官系统毒性/i.test(rowLabel)) continue;
            const val = (row.cells[row.cells.length - 1]?.text || '').trim();
            if (!val) {
              try {
                const updated = deleteRow(editorEngine, tRecord, rIdx);
                if (updated) tRecord = updated;
                prunedCount++;
              } catch (e) {}
            }
          }
          tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 11) || tRecord;
          renumberRecord(tRecord);
        }
      }

      // Section 12 端点清册与紧凑收敛 (OW-ANN-18, OW-ANN-19, OW-ANN-20)
      if (s === 12) {
        // 动态保留组分承接说明行：以下是[组分名]生态毒理学数据： (OW-ANN-18)
        let ecoIntroNote = '';
        if (matchedSec.sourceRecord?.rows) {
          for (const r of matchedSec.sourceRecord.rows) {
            const txt = r.cells?.map((c) => c.text?.trim() || '').join(' ') || '';
            const match = txt.match(/以下(?:是|为)(?:.+?)(?:的)?生态毒理学(?:参考)?数据[:：]?/i);
            if (match) {
              ecoIntroNote = match[0].endsWith('：') ? match[0] : `${match[0]}：`;
            }
          }
        }

        if (ecoIntroNote && tRecord.rows.length >= 3) {
          let row2 = tRecord.rows.find((r) => r.cells.length === 1 && /生态毒理学(?:参考)?数据/i.test(r.cells[0]?.text || ''));
          if (!row2 && tRecord.rows[2].cells.length === 1) {
            row2 = tRecord.rows[2];
          }
          if (row2 && row2.cells[0]) {
            row2.cells[0].editable = true;
            try { writeCellValue(row2.cells[0], ecoIntroNote, editorEngine.roleStyles?.value); } catch (e) {}
          }
        }

        if (!hasRealEndpoints12) {
          let ecoStatement = matchedSec.matchedRows.find((r) => r.value?.includes('生态'))?.value || '该产品无可用的生态毒理学研究。';
          ecoStatement = ecoStatement.replace(/^无数据资料[。，,\s]*/, '').trim();
          if (tRecord.rows.length >= 2) {
            const row1 = tRecord.rows[1];
            if (row1.cells?.length > 1) {
              row1.cells = [row1.cells[0]];
            }
            const c0 = row1.cells[0];
            if (c0) {
              c0.editable = true;
              c0.kind = 'note';
              c0.labelText = '';
              try {
                writeCellValue(c0, ecoStatement, editorEngine.roleStyles?.value);
                injectedCount++;
              } catch (e) {}
            }
            while (tRecord.rows.length > 2) {
              try {
                const updated = deleteRow(editorEngine, tRecord, tRecord.rows.length - 1);
                if (updated) tRecord = updated;
                prunedCount++;
              } catch (e) {
                break;
              }
            }
          }
        } else {
          // 清理无用非当前组分残留
          for (let rIdx = tRecord.rows.length - 1; rIdx >= 1; rIdx--) {
            const row = tRecord.rows[rIdx];
            if (row.cells.length === 1) {
              const txt = (row.cells[0]?.text || '').trim();
              if (!txt || /二乙二醇/i.test(txt)) {
                try {
                  const updated = deleteRow(editorEngine, tRecord, rIdx);
                  if (updated) tRecord = updated;
                } catch (e) {}
              }
            }
          }

          // 规范填充空值与规范用语“无数据资料。” (OW-ANN-20)
          for (let rIdx = 1; rIdx < tRecord.rows.length; rIdx++) {
            const row = tRecord.rows[rIdx];
            if (row.cells.length <= 1) continue;
            const valCell = row.cells[row.cells.length - 1];
            if (!valCell || !valCell.editable) continue;
            const valText = (valCell.valueText || valCell.text || '').trim();
            if (!valText || valText === '无' || valText === '未测') {
              try { writeCellValue(valCell, '无数据资料。', editorEngine.roleStyles?.value); } catch (e) {}
            }
          }

          tRecord = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 12) || tRecord;
          renumberRecord(tRecord);
        }
      }
      // Section 13 废弃处置多段说明完整注入
      if (s === 13) {
        const wasteItem = matchedSec.matchedRows.find((r) => r.key === 'waste_treatment_methods' && r.value);
        if (wasteItem && tRecord.rows.length >= 2) {
          const row1 = tRecord.rows[1];
          const val = wasteItem.value.trim();
          if (val.includes('必需遵守适用的国标') && val.includes('在欧盟领域内废弃')) {
            const sentence1 = '必需遵守适用的国标、国家或当地法规进行废弃。';
            const sentence2 = '在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。';
            if (row1 && row1.cells.length === 1 && row1.cells[0].editable) {
              try { writeCellValue(row1.cells[0], sentence1, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
            }
            const updated = addNoteRowAfter(editorEngine, tRecord, 1, sentence2);
            if (updated) tRecord = updated;
          } else if (row1 && row1.cells.length === 1 && row1.cells[0].editable) {
            try { writeCellValue(row1.cells[0], wasteItem.value, editorEngine.roleStyles?.value); injectedCount++; } catch (e) {}
          }
        }
      }

      // Section 15 法规信息顺序保全与容量自适应克隆
      if (s === 15) {
        // 1. 物质或混合物的相关安全、健康和环保法律法规 写入 Row 1
        const safetyItem = matchedSec.matchedRows.find((r) => r.key === 'safety_regulations' && r.value);
        if (safetyItem && tRecord.rows.length >= 2) {
          const r1 = tRecord.rows[1];
          if (r1 && r1.cells?.[0]) {
            r1.cells[0].editable = true;
            try {
              writeCellValue(r1.cells[0], safetyItem.value, editorEngine.roleStyles?.value);
              injectedCount++;
            } catch (e) {}
          }
        }

        // 2. 5 项法定法规严格按顺序写入
        const reqHeaderIdx = tRecord.rows.findIndex((r) => r.cells.some((c) => /符合下列法规要求/i.test(c.text || '')));
        if (reqHeaderIdx !== -1) {
          for (let i = 0; i < CN_TEMPLATE_PROFILE.section15.length; i++) {
            const regDef = CN_TEMPLATE_PROFILE.section15[i];
            const matchedReg = matchedSec.matchedRows.find((r) => r.key === regDef.key && r.value);
            const regVal = matchedReg ? matchedReg.value : regDef.defaultVal;

            const targetRowIdx = reqHeaderIdx + 1 + i;
            while (targetRowIdx >= tRecord.rows.length) {
              const updated = addRowAfter(editorEngine, tRecord, tRecord.rows.length - 1);
              if (updated) tRecord = updated;
            }

            const targetRow = tRecord.rows[targetRowIdx];
            if (targetRow && targetRow.cells?.[0]) {
              targetRow.cells[0].editable = true;
              try {
                writeCellValue(targetRow.cells[0], regVal, editorEngine.roleStyles?.value);
                injectedCount++;
              } catch (e) {}
            }
          }
        }
      }
    }
  }

  // 加粗不变量审计守卫 (Bold Invariance Guard)
  // 校验除 Section 9 之外的所有章节加粗标签没有被意外篡改
  for (const tRecord of editorEngine.records) {
    if (tRecord.kind !== 'table' || !tRecord.sectionNumber || tRecord.sectionNumber === 9 || tRecord.sectionNumber === 11) continue;
    for (const row of tRecord.rows) {
      for (const cell of row.cells) {
        if (cell.kind === 'label-only' && cell.labelText && !cell.text.trim()) {
          // 防御性恢复加粗标签
          cell.text = cell.labelText;
        }
      }
    }
  }

  return {
    success: true,
    injectedCount,
    prunedCount,
  };
}

/**
 * 自动化多维度质量审计器 (Automated Multi-Dimensional Quality Auditor)
 * 验证：断号、加粗结构不变量、幽灵残留、文档身份戳记
 */
export function runAutomatedAudits(editorEngine, matchResult) {
  const issues = [];

  // 1. 编号断号与连续性审计 (Sequence Continuity Audit)
  for (const record of editorEngine.records) {
    if (record.kind === 'table' && record.sectionNumber) {
      const recErrors = auditRecord(record);
      for (const err of recErrors) {
        issues.push({ type: 'SEQUENCE_DISCONTINUITY', message: err });
      }
    }
  }

  // 2. 加粗标签不变量审计 (Bold Label Invariance Guard)
  for (const record of editorEngine.records) {
    if (record.kind !== 'table' || !record.sectionNumber || record.sectionNumber === 9 || record.sectionNumber === 11) continue;
    for (const row of record.rows) {
      for (const cell of row.cells) {
        if (cell.kind === 'label-only' && cell.labelText && !cell.text.trim()) {
          issues.push({
            type: 'LABEL_MUTATION',
            message: `Section ${record.sectionNumber} 第 ${row.index} 行标签被清空`,
          });
        }
      }
    }
  }

  // 3. 模板幽灵残留审计 (Ghost Residual Audit)
  const allText = editorEngine.records
    .flatMap((r) => (r.rows ? r.rows.flatMap((row) => row.cells.map((c) => c.text)) : [r.text]))
    .join(' ');
  const ghostTokens = ['二乙二醇单丁醚', '成分1', '3,306', '六亚甲基-1,6-二异氰酸酯'];
  for (const token of ghostTokens) {
    if (allText.includes(token)) {
      issues.push({
        type: 'GHOST_RESIDUAL',
        message: `模板示范幽灵数据残留：${token}`,
      });
    }
  }

  // 4. 文档身份戳记审计 (Identity Stamping Audit)
  for (const [partName, xml] of Object.entries(editorEngine.supportingXml || {})) {
    if (/header|footer/.test(partName)) {
      if (xml.includes('PEA-4139')) {
        issues.push({
          type: 'STALE_MODEL_IDENTITY',
          message: `${partName} 仍包含旧示例型号 PEA-4139`,
        });
      }
      if (xml.includes('P修订日期：')) {
        issues.push({
          type: 'HANGING_P_PREFIX',
          message: `${partName} 仍包含悬空前缀 P修订日期：`,
        });
      }
    }
  }

  // 5. Section 1 插槽准确性与大类题头空白审计
  const sec1 = editorEngine.records.find((r) => r.kind === 'table' && r.sectionNumber === 1);
  if (sec1) {
    const parentRow = sec1.rows.find((r) => /1\.1\s*(?:产品名称|产品标识|Product\s*name)/i.test(r.cells?.[0]?.text || ''));
    const cnNameRow = sec1.rows.find((r) => /中文名称/i.test(r.cells?.[0]?.text || ''));
    if (parentRow && cnNameRow) {
      const parentVal = (parentRow.cells?.[1]?.valueText || parentRow.cells?.[1]?.text || '').trim();
      if (parentVal) {
        issues.push({
          type: 'PARENT_HEADER_VALUE_POLLUTION',
          message: `Section 1 大类题头 1.1 产品名称 不应包含值，实际为: ${parentVal}`,
        });
      }
    }
  }

  return {
    passed: issues.length === 0,
    issueCount: issues.length,
    issues,
  };
}
