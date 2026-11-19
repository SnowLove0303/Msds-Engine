import fs from 'fs';
import { recognizeSourceDocx } from '../src/recognition-engine.js';

// 读取当前 context-governor.js
let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js', 'utf8');

// 注入 UN_PROPER_SHIPPING_NAMES 与 更新 TRANSPORT_TRANSLATION_MAP
const oldTrans = `// 运输标准术语英译
export const TRANSPORT_TRANSLATION_MAP = Object.freeze({
  '非危险品陆运输方式，符合ADG准则。': 'Not classified as dangerous goods for land transport.',
  '非危险品陆运输方式, 符合ADG准则。': 'Not classified as dangerous goods for land transport.',
  '非危险品陆运输方式。': 'Not classified as dangerous goods for land transport.',
  '非危险品运输方式，符合IATA准则。': 'Not classified as dangerous goods for air transport (IATA).',
  '非危险品运输方式, 符合IATA准则。': 'Not classified as dangerous goods for air transport (IATA).',
  '非危险品空运方式。': 'Not classified as dangerous goods for air transport.',
  '非危险品海运方式。': 'Not classified as dangerous goods for sea transport (IMDG).',
  '非危险货物。': 'Not classified as dangerous goods.',
  '非危险品。': 'Not classified as dangerous goods.'
})`;

const newTrans = `// 联合国危险货物正式运输名称中英标准目录
export const UN_PROPER_SHIPPING_NAMES = Object.freeze({
  '1866': { cn: '树脂溶液，易燃', en: 'RESIN SOLUTION, flammable' },
  '1993': { cn: '易燃液体，未另作规定的', en: 'FLAMMABLE LIQUID, N.O.S.' },
  '1263': { cn: '油漆或油漆相关材料', en: 'PAINT or PAINT RELATED MATERIAL' },
  '1139': { cn: '保护层防护液', en: 'COATING SOLUTION' }
});

// 运输标准术语英译
export const TRANSPORT_TRANSLATION_MAP = Object.freeze({
  '非危险品陆运输方式，符合ADG准则。': 'Not classified as dangerous goods for land transport, in accordance with the ADG Code.',
  '非危险品陆运输方式, 符合ADG准则。': 'Not classified as dangerous goods for land transport, in accordance with the ADG Code.',
  '非危险品陆运输方式。': 'Not classified as dangerous goods for land transport.',
  '非危险品运输方式，符合IATA准则。': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
  '非危险品运输方式, 符合IATA准则。': 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
  '非危险品空运方式。': 'Not classified as dangerous goods for air transport.',
  '非危险品海运方式。': 'Not classified as dangerous goods for sea transport (IMDG).',
  '非危险品海运方式，符合IMDG准则。': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
  '非危险品海运方式, 符合IMDG准则。': 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
  '非危险货物。': 'Not classified as dangerous goods.',
  '非危险品。': 'Not classified as dangerous goods.'
});`;

code = code.replace(oldTrans, newTrans);

// 更新 translateChemicalTerm 中的 ADG / IMDG / IATA / 化工分类
const oldTermMatch = `  if (/非危险品.*ADG/i.test(trimmed)) return 'Not classified as dangerous goods for land transport.'
  if (/非危险品.*IATA/i.test(trimmed)) return 'Not classified as dangerous goods for air transport (IATA).'
  if (/非危险品.*IMDG/i.test(trimmed)) return 'Not classified as dangerous goods for sea transport (IMDG).'
  if (/非危险(品|货物)/i.test(trimmed)) return 'Not classified as dangerous goods.'`;

const newTermMatch = `  if (/非危险品.*ADG/i.test(trimmed)) return 'Not classified as dangerous goods for land transport, in accordance with the ADG Code.'
  if (/非危险品.*IATA/i.test(trimmed)) return 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.'
  if (/非危险品.*IMDG/i.test(trimmed)) return 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.'
  if (/非危险(品|货物)/i.test(trimmed)) return 'Not classified as dangerous goods.'
  if (/丙烯酸.*多元醇/i.test(trimmed)) return 'Acrylic polyol'
  if (/多元醇/i.test(trimmed)) return 'Polyol'
  if (/树脂溶液/i.test(trimmed)) return 'Resin solution'
  if (/溶剂型.*丙烯酸/i.test(trimmed)) return 'Solvent-based acrylic resin'`;

code = code.replace(oldTermMatch, newTermMatch);

// 更新 governContext
const oldCnBlock = `  // 3. 构建中文分支 (context2.cn)
  const cn = {
    modelCode,
    productName: raw.productName || modelCode,
    revisionDate: raw.revisionDate || new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      // 非危险品绝对严禁生成象形图与信号词
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: isNonHazardous ? null : raw.ghs?.signalWord,
      categories: isNonHazardous ? [] : (raw.ghs?.categories || []),
      hazardStatements: isNonHazardous ? [] : (raw.ghs?.hazardStatements || []),
      precautionaryStatements: isNonHazardous ? {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      } : (raw.ghs?.precautionaryStatements || { prevention: [], response: [], storage: [], disposal: [] })
    },
    // 组分列表: 严格拆解为独立组分对象数组，杜绝字符串拼贴
    components: (raw.components || []).map(comp => ({
      name: (comp.name || '').trim(),
      cas: (comp.cas || '').trim(),
      conc: (comp.conc || '').trim()
    })),
    // 理化指标治理
    physicalProperties: (raw.physicalProperties || []).map(prop => ({
      label: sanitizeDegreeAndPunctuation(prop.label || ''),
      value: sanitizeDegreeAndPunctuation(prop.value || ''),
      sectionNumber: prop.sectionNumber || 9,
      rowIndex: prop.rowIndex
    })),
    // 毒理学测试端点
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    // 生态学
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    // 废弃处置
    disposal: {
      wasteMethod: raw.disposal?.wasteMethod || '按照当地、区域、国家和国际法规处置。',
      containerMethod: raw.disposal?.containerMethod || '彻底清空容器后回收或作为受控废弃物处置。',
      rawText: raw.disposal?.rawText || null
    },
    // 运输信息
    transport: {
      unNumber: isNonHazardous ? '无' : (raw.transport?.unNumber || '无'),
      shippingName: isNonHazardous ? '非危险货物' : (raw.transport?.shippingNameCn || '非危险货物'),
      hazardClass: isNonHazardous ? '无' : (raw.transport?.hazardClass || '无'),
      packingGroup: isNonHazardous ? '无' : (raw.transport?.packingGroup || '无'),
      road: '非危险品陆运输方式。',
      sea: '非危险品海运方式。',
      air: '非危险品运输方式。',
      precautions: '非危险货物。',
      roadStatement: '非危险品陆运输方式。',
      seaStatement: '非危险品海运方式。',
      airStatement: '非危险品运输方式。',
      generalStatement: '非危险货物。'
    },
    sections: raw.sections || {}
  }`;

const newCnBlock = `  // 运输分类独立判定 (非危化品或未归入危运)
  const isTransportNonDangerous = Boolean(raw.transport?.isNonDangerousGoods) ||
    !raw.transport?.unNumber ||
    raw.transport?.unNumber === '无' ||
    /非危险/i.test(raw.transport?.shippingNameCn || '') ||
    /非危险/i.test(raw.transport?.generalStatement || '');

  let rawRoad = raw.transport?.roadStatement || raw.transport?.road || '非危险品陆运输方式。';
  let rawSea = raw.transport?.seaStatement || raw.transport?.sea || '非危险品海运方式。';
  let rawAir = raw.transport?.airStatement || raw.transport?.air || '非危险品运输方式。';

  if (Array.isArray(raw.transport?.transportModes)) {
    for (const tm of raw.transport.transportModes) {
      if (/公路|陆运|铁路|road|rail/i.test(tm.mode || '')) {
        rawRoad = tm.description || rawRoad;
      } else if (/海/i.test(tm.mode || '')) {
        rawSea = tm.description || rawSea;
      } else if (/空/i.test(tm.mode || '')) {
        rawAir = tm.description || rawAir;
      }
    }
  } else if (raw.transport?.transportModes && typeof raw.transport.transportModes === 'object') {
    rawRoad = raw.transport.transportModes.road || rawRoad;
    rawSea = raw.transport.transportModes.sea || rawSea;
    rawAir = raw.transport.transportModes.air || rawAir;
  }

  const cleanUn = String(raw.transport?.unNumber || '').replace(/\\D/g, '');
  const unProper = UN_PROPER_SHIPPING_NAMES[cleanUn];

  // 3. 构建中文分支 (context2.cn)
  const cn = {
    modelCode,
    productName: raw.productName || modelCode,
    chemicalClassification: raw.chemicalClassification || null,
    contactPhone: raw.contactPhone || null,
    emergencyPhone: raw.emergencyPhone || null,
    revisionDate: raw.revisionDate || new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      // 非危险品绝对严禁生成象形图与信号词
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: isNonHazardous ? null : raw.ghs?.signalWord,
      categories: isNonHazardous ? [] : (raw.ghs?.categories || []),
      hazardStatements: isNonHazardous ? [] : (raw.ghs?.hazardStatements || []),
      precautionaryStatements: isNonHazardous ? {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      } : (raw.ghs?.precautionaryStatements || { prevention: [], response: [], storage: [], disposal: [] })
    },
    // 组分列表: 严格拆解为独立组分对象数组，杜绝字符串拼贴
    components: (raw.components || []).map(comp => ({
      name: (comp.name || '').trim(),
      cas: (comp.cas || '').trim(),
      conc: (comp.conc || '').trim()
    })),
    // 理化指标治理
    physicalProperties: (raw.physicalProperties || []).map(prop => ({
      label: sanitizeDegreeAndPunctuation(prop.label || ''),
      value: sanitizeDegreeAndPunctuation(prop.value || ''),
      sectionNumber: prop.sectionNumber || 9,
      rowIndex: prop.rowIndex
    })),
    // 毒理学测试端点
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    // 生态学
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    // 废弃处置
    disposal: {
      wasteMethod: raw.disposal?.wasteMethod || '按照当地、区域、国家和国际法规处置。',
      containerMethod: raw.disposal?.containerMethod || '彻底清空容器后回收或作为受控废弃物处置。',
      rawText: raw.disposal?.rawText || null
    },
    // 运输信息
    transport: {
      unNumber: isTransportNonDangerous ? '无' : (raw.transport?.unNumber || '无'),
      shippingName: isTransportNonDangerous ? '非危险货物' : (raw.transport?.shippingNameCn || unProper?.cn || '非危险货物'),
      hazardClass: isTransportNonDangerous ? '无' : (raw.transport?.hazardClass || '无'),
      packingGroup: isTransportNonDangerous ? '无' : (raw.transport?.packingGroup || '无'),
      road: rawRoad,
      sea: rawSea,
      air: rawAir,
      precautions: raw.transport?.precautions || raw.transport?.specialPrecautions?.primaryCn || (isTransportNonDangerous ? '非危险货物。' : '参见第6-8节。'),
      roadStatement: rawRoad,
      seaStatement: rawSea,
      airStatement: rawAir,
      generalStatement: raw.transport?.generalStatement || (isTransportNonDangerous ? '非危险货物。' : '危险货物。')
    },
    sections: raw.sections || {}
  }`;

code = code.replace(oldCnBlock, newCnBlock);

// 更新 en 分支
const oldEnBlock = `  const en = {
    modelCode,
    productName: enProductName,
    productNameEn: enProductName,
    revisionDate: cn.revisionDate,
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: isNonHazardous ? null : 'Warning',
      categories: isNonHazardous ? [] : [],
      hazardStatements: isNonHazardous ? [] : [],
      precautionaryStatements: isNonHazardous ? {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      } : { prevention: [], response: [], storage: [], disposal: [] }
    },
    components: enComponents,
    physicalProperties: enPhysicalProperties,
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    disposal: {
      wasteMethod: 'Dispose of contents in accordance with local, regional, national, and international regulations.',
      containerMethod: 'Dispose of container after completely emptying, or recycle in accordance with local regulations.',
      rawText: raw.disposal?.rawText || null
    },
    transport: {
      unNumber: isNonHazardous ? 'Not applicable' : (raw.transport?.unNumber || 'Not applicable'),
      shippingName: isNonHazardous ? 'Not classified as dangerous goods' : 'Dangerous goods',
      hazardClass: isNonHazardous ? 'Not applicable' : 'Not applicable',
      packingGroup: isNonHazardous ? 'Not applicable' : 'Not applicable',
      road: 'Not classified as dangerous goods for land transport.',
      sea: 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
      air: 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
      precautions: 'Not regulated as dangerous goods.',
      roadStatement: 'Not classified as dangerous goods for land transport.',
      seaStatement: 'Not classified as dangerous goods for sea transport, in accordance with IMDG regulations.',
      airStatement: 'Not classified as dangerous goods for air transport, in accordance with IATA regulations.',
      generalStatement: 'Not classified as dangerous goods.'
    },
    sections: raw.sections || {}
  }`;

const newEnBlock = `  const enShippingName = isTransportNonDangerous
    ? 'Not classified as dangerous goods'
    : (raw.transport?.shippingNameEn && raw.transport.shippingNameEn !== 'CHEMICALS'
        ? raw.transport.shippingNameEn
        : (unProper?.en || (raw.transport?.shippingNameCn ? translateChemicalTerm(raw.transport.shippingNameCn) : 'Dangerous goods')));

  const en = {
    modelCode,
    productName: enProductName,
    productNameEn: enProductName,
    chemicalClassification: raw.chemicalClassification ? translateChemicalTerm(raw.chemicalClassification) : null,
    contactPhone: raw.contactPhone || null,
    emergencyPhone: raw.emergencyPhone || null,
    revisionDate: cn.revisionDate,
    isHazardous: !isNonHazardous,
    ghs: {
      isHazardous: !isNonHazardous,
      hasPictograms: isNonHazardous ? false : Boolean(raw.ghs?.hasPictograms),
      pictogramCount: isNonHazardous ? 0 : (raw.ghs?.pictogramCount || 0),
      signalWord: isNonHazardous ? null : (raw.ghs?.signalWord === '危险' ? 'Danger' : (raw.ghs?.signalWord === '警告' ? 'Warning' : (raw.ghs?.signalWord || 'Warning'))),
      categories: isNonHazardous ? [] : (raw.ghs?.categories || []),
      hazardStatements: isNonHazardous ? [] : (raw.ghs?.hazardStatements || []),
      precautionaryStatements: isNonHazardous ? {
        prevention: [],
        response: [],
        storage: [],
        disposal: []
      } : (raw.ghs?.precautionaryStatements || { prevention: [], response: [], storage: [], disposal: [] })
    },
    components: enComponents,
    physicalProperties: enPhysicalProperties,
    toxicology: JSON.parse(JSON.stringify(raw.toxicology || {})),
    ecology: JSON.parse(JSON.stringify(raw.ecology || {})),
    disposal: {
      wasteMethod: 'Dispose of contents in accordance with local, regional, national, and international regulations.',
      containerMethod: 'Dispose of container after completely emptying, or recycle in accordance with local regulations.',
      rawText: raw.disposal?.rawText || null
    },
    transport: {
      unNumber: isTransportNonDangerous ? 'Not applicable' : (raw.transport?.unNumber || 'Not applicable'),
      shippingName: enShippingName,
      hazardClass: isTransportNonDangerous ? 'Not applicable' : (raw.transport?.hazardClass || 'Not applicable'),
      packingGroup: isTransportNonDangerous ? 'Not applicable' : (raw.transport?.packingGroup || 'Not applicable'),
      road: translateChemicalTerm(rawRoad),
      sea: translateChemicalTerm(rawSea),
      air: translateChemicalTerm(rawAir),
      precautions: isTransportNonDangerous ? 'Not regulated as dangerous goods.' : (raw.transport?.specialPrecautions?.primaryEn || 'See sections 6-8.'),
      roadStatement: translateChemicalTerm(rawRoad),
      seaStatement: translateChemicalTerm(rawSea),
      airStatement: translateChemicalTerm(rawAir),
      generalStatement: isTransportNonDangerous ? 'Not classified as dangerous goods.' : 'Dangerous goods.'
    },
    sections: raw.sections || {}
  }`;

code = code.replace(oldEnBlock, newEnBlock);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/context-governor.js.proposed', code, 'utf8');
console.log('Successfully generated context-governor.js.proposed!');
