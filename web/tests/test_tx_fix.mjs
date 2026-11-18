const samples = [
  'N,N－二甲基乙酰胺(DMAC)',
  'The following is toxicological data for N,N－二甲基乙酰胺:',
  '半数致死浓度(LC50)/1h/Rat 雌性: 8.81mg/l(此值仅用于有可吸入的颗粒形成的情况. )',
  '半数致死浓度(LC50)/4h/Rat 雌性: 2.2mg/l',
  '半数致死剂量(LD50)/Guinea pig: ＜940mg/kg',
  'Species: 兔子\nClassification: 刺激皮肤.\nResult: 轻度的皮肤刺激',
  'Species: 兔子\nClassification: 刺激眼睛.\nResult: 轻度的眼睛刺激',
  'Classification: 不是皮肤过敏物质.\nResult: 未引起实验室动物过敏.',
  'Species: 人类\nClassification: 不是皮肤过敏物质.'
];

function testTranslate(t) {
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*1\s*h\s*[/／]\s*(?:大鼠|Rat)(?:\s*雌性)?\s*[:：]\s*/gi, 'LC50 / Inhalation / 1h / Rat (female): ');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*4\s*h\s*[/／]\s*(?:大鼠|Rat)(?:\s*雌性)?\s*[:：]\s*/gi, 'LC50 / Inhalation / 4h / Rat (female): ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*(?:豚鼠|Guinea\s*pig)\s*[:：]\s*/gi, 'LD50 / Dermal / Guinea pig: ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*(?:家兔|兔|Rabbit)\s*[:：]\s*/gi, 'LD50 / Dermal / Rabbit: ');
  t = t.replace(/[（(]?此值仅用于有可吸入的颗粒形成的情况[.。]?[）)]?/g, '(applicable only where respirable aerosols are formed)');
  t = t.replace(/N,N[－-]二甲基乙酰胺(?:\s*[（(]DMAC[）)])?/g, 'N,N-Dimethylacetamide (DMAC)');
  t = t.replace(/(?:物种|Species)\s*[:：]\s*(?:兔子?|家兔)/gi, 'Species: Rabbit');
  t = t.replace(/(?:物种|Species)\s*[:：]\s*人类/gi, 'Species: Human');
  t = t.replace(/(?:分类|Classification)\s*[:：]\s*刺激皮肤[.。]?/gi, 'Classification: Irritating to skin.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*(?:轻度的皮肤刺激|轻度皮肤刺激)[.。]?/gi, 'Result: Mild skin irritation.');
  t = t.replace(/(?:分类|Classification)\s*[:：]\s*刺激眼睛[.。]?/gi, 'Classification: Irritating to eyes.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*(?:轻度的眼睛刺激|轻度眼睛刺激)[.。]?/gi, 'Result: Mild eye irritation.');
  t = t.replace(/(?:分类|Classification)\s*[:：]\s*不是皮肤过敏物质[.。]?/gi, 'Classification: Not a skin sensitizer.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*未引起实验室动物过敏[.。]?/gi, 'Result: Did not cause sensitization in laboratory animals.');
  t = t.replace(/＜/g, '< ');
  return t;
}

for (const s of samples) {
  const trans = testTranslate(s);
  const hasCn = /[\u4e00-\u9fa5]/.test(trans);
  console.log(`${hasCn ? '❌' : '✅'} "${s.replace(/\n/g, ' ')}" -> "${trans.replace(/\n/g, ' ')}"`);
}
