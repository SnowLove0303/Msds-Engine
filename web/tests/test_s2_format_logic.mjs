const s2Paras = [
  '2.1 GHS危险性类别：',
  '急性毒性，吸入性，类别 4 (H332)',
  '皮肤致敏，类别 1B (H317)',
  '对水环境有慢性危害，类别 3 (H412)',
  '特异性靶器官有毒（一次性接触），类别 3 (H335)',
  '2.2 GHS标签要素：',
  'GHS象形图：',
  '必须列在标签上的有害成份：基于HDI的亲水脂肪族聚异氰酸酯',
  '信号词：警告',
  '危险性说明：',
  'H332吸入有害。',
  'H317可能造成皮肤过敏反应。',
  'H335可能造成呼吸道刺激。',
  'H412对水生生物有害并具有长期持续影响。',
  '防范说明：',
  '预防措施：',
  'P261避免吸入粉尘/烟气/气体/烟雾/蒸气/喷雾。',
  'P280戴防护手套/穿防护服/戴防护眼镜/戴防护面罩。',
  'P273禁止排入环境。',
  '事故响应：',
  'P302+P352如果皮肤接触:用大量肥皂和水清洗。',
  'P304+P312如吸入:如感觉不适，呼叫中毒控制中心或就医。',
  'P312如感觉不适，呼叫中毒控制中心或就医。',
  '安全储存：',
  'P403+P233 在通风良好处储存。保持容器密闭。',
  '废弃处置：',
  'P501将本品或其容器送至有资质的废物处理厂处置。',
  '2.3 其他危险：无适用资料。'
];

function testFormat(pText, isEnglish = false) {
  const trimmed = pText.trim();
  
  // 1. Indent determination
  let indent = 'NONE';
  const isHeader = /^(?:(?:2\.\d+\s*)?(?:GHS危险性类别|GHS\s*分类|物质或混合物的分类|GHS hazard classification|Classification of the substance or mixture)|2\.\d+)/i.test(trimmed);
  
  if (!isHeader) {
    if (/^(?:请注意以下物质|N,N-二甲基乙醇胺|GHS分类|易燃|急性毒性|皮肤|严重眼睛|生殖毒性|特异性靶器官|对水环境|致敏)/i.test(trimmed) || /(?:类别|\(H\d+[A-Za-z]?\))/i.test(trimmed)) {
      indent = 'firstLine="480" right="480"';
    } else if (/^(?:预防措施|事故响应|安全存储|安全储存|废弃处置)[：:]/i.test(trimmed)) {
      indent = 'left="480"';
    } else if (/^H\d{3}/i.test(trimmed)) {
      indent = 'left="480"';
    } else if (/^P\d{3}/i.test(trimmed)) {
      indent = 'left="960"';
    }
  }

  // 2. Bold determination
  let runSpecs = [];
  const kvMatch = pText.match(/^(\s*(?:(?:2\.\d+\s*)?(?:GHS危险性类别|GHS hazard classification|物质或混合物的分类|Classification of the substance or mixture)|羟基丙烯酸酯聚合物GHS危险性分类|Hydroxy acrylic polymer GHS classification|(?:2\.\d+\s*)?(?:GHS\s*)?标签要素|Label elements|(?:2\.\d+\s*)?GHS Label Elements|象形图|GHS\s*象形图|GHS pictograms|警告词|信号词|Signal word|危险性说明|Hazard statements|防范说明|Precautionary statements|物理化学危险|Physical and chemical hazards|健康危害|Health hazards|环境危害|Environmental hazards|(?:2\.\d+\s*)?(?:其他危害|其他危险)|(?:2\.\d+\s*)?Other\s*Hazards?))([:：]?)\s*(.*)$/i);
  
  if (kvMatch) {
    const label = kvMatch[1];
    const colon = kvMatch[2] || '';
    const val = kvMatch[3];
    if (!val) {
      runSpecs = [{ text: label + colon, bold: true }];
    } else if (label.includes('GHS危险性类别') && !isEnglish) {
      runSpecs = [{ text: label + colon, bold: true }, { text: ' ', bold: false }, { text: val.trim(), bold: false }];
    } else {
      runSpecs = [{ text: label + colon, bold: true }];
      if (val) {
        runSpecs.push({ text: (isEnglish ? ' ' : '') + val.trim(), bold: false });
      }
    }
  } else if (/^(?:预防措施|事故响应|安全存储|安全储存|废弃处置)[：:]/i.test(trimmed) ||
             /^(?:Prevention|Response|Storage|Disposal)[：:]/i.test(trimmed) ||
             /^(?:防范说明)[:：]?$/i.test(trimmed) || /^(?:Precautionary statements)[:：]?$/i.test(trimmed)) {
    runSpecs = [{ text: pText, bold: true }];
  } else {
    runSpecs = [{ text: pText, bold: false }];
  }

  return { indent, runs: runSpecs.map(r => (r.bold ? `[B]${r.text}[/B]` : r.text)).join('') };
}

for (const p of s2Paras) {
  const res = testFormat(p);
  console.log(`[INDENT: ${res.indent.padEnd(26)}] ${res.runs}`);
}
