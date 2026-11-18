const s2ParasEn = [
  '2.1 Classification of the substance or mixture:',
  'Acute toxicity, Inhalation (Category 4), H332',
  'Skin sensitization (Category 1B), H317',
  'Chronic aquatic toxicity (Category 3), H412',
  'Specific target organ toxicity - single exposure (Category 3), H335',
  '2.2 GHS Label Elements:',
  'GHS pictograms:',
  'Hazardous components which must be listed on the label: Hydrophilic aliphatic polyisocyanate based on HDI',
  'Signal word: Warning',
  'Hazard statements:',
  'H332 Harmful if inhaled.',
  'H317 May cause an allergic skin reaction.',
  'H335 May cause respiratory irritation.',
  'H412 Harmful to aquatic life with long lasting effects.',
  'Precautionary statements:',
  'Prevention:',
  'P261 Avoid breathing dust/fume/gas/mist/vapours/spray.',
  'P280 Wear protective gloves/clothing/eye protection/face protection.',
  'P273 Avoid release to the environment.',
  'Response:',
  'P302+P352 IF ON SKIN: Wash with plenty of water and soap.',
  'P304+P312 IF INHALED: Call a POISON CENTER/doctor if you feel unwell.',
  'P312 Call a POISON CENTER/doctor if you feel unwell.',
  'Storage:',
  'P403+P233 Store in a well-ventilated place. Keep container tightly closed.',
  'Disposal:',
  'P501 Dispose of contents/container in accordance with local regulations.',
  '2.3 Other hazards: No applicable information.'
];

function testFormatEn(pText) {
  const trimmed = pText.trim();
  
  // 1. Indent determination
  let indent = 'NONE';
  const isHeader = /^(?:(?:2\.\d+\s*)?(?:Classification of the substance or mixture|GHS Label Elements|Label elements|Other\s*Hazards?)|2\.\d+)/i.test(trimmed);
  
  if (!isHeader) {
    if (/^(?:Please note the following substance|N,N-Dimethylethanolamine|GHS classification|Flammable|Acute toxicity|Skin|Serious eye|Eye irritation|Reproductive|Specific target|Sensitisation|Sensitization|Aquatic|Hazardous to the aquatic)/i.test(trimmed) || /(?:Category|\(H\d+[A-Za-z]?\))/i.test(trimmed)) {
      indent = 'left="480"';
    } else if (/^(?:Prevention|Response|Storage|Disposal)[：:]/i.test(trimmed)) {
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
    } else {
      runSpecs = [{ text: label + colon, bold: true }];
      if (val) {
        runSpecs.push({ text: ' ' + val.trim(), bold: false });
      }
    }
  } else if (/^(?:Prevention|Response|Storage|Disposal)[：:]/i.test(trimmed) ||
             /^(?:Precautionary statements)[:：]?$/i.test(trimmed)) {
    runSpecs = [{ text: pText, bold: true }];
  } else {
    runSpecs = [{ text: pText, bold: false }];
  }

  return { indent, runs: runSpecs.map(r => (r.bold ? `[B]${r.text}[/B]` : r.text)).join('') };
}

for (const p of s2ParasEn) {
  const res = testFormatEn(p);
  console.log(`[INDENT: ${res.indent.padEnd(14)}] ${res.runs}`);
}
