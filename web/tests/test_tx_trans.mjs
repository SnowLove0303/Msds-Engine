import fs from 'fs';

const rawSegments = [
  'N,N－二甲基乙酰胺(DMAC)',
  'The following is toxicological data for N,N－二甲基乙酰胺:',
  '半数致死浓度(LC50)/1h/Rat 雌性: 8.81mg/l(此值仅用于有可吸入的颗粒形成的情况. ).',
  '半数致死浓度(LC50)/4h/Rat 雌性: 2.2mg/l.',
  '半数致死剂量(LD50)/Guinea pig: ＜940mg/kg.',
  'Species: 兔子',
  'Classification: 刺激皮肤.',
  'Result: 轻度的皮肤刺激',
  'Species: 兔子',
  'Classification: 刺激眼睛.',
  'Result: 轻度的眼睛刺激',
  'Classification: 不是皮肤过敏物质.',
  'Result: 未引起实验室动物过敏.',
  'Species: 人类',
  'Classification: 不是皮肤过敏物质.',
  'Result: 对志愿者做的皮肤接触试验证明没有过敏特性.',
  'Animal testing showed no reproductive toxicity. . 动物实验表明在低于那些引起母体中毒的量时,对胚胎有影响. 降低了胚胎胎儿的成活力,胎儿发育缓慢(变异),胎儿畸形.',
  '病理变化: 胃,睾丸,肝,肾,红血球异常减少.',
  '病理变化: 肾、肝影响,视网膜损伤.'
];

function testTranslate(t) {
  t = t.replace(/N,N[－-]二甲基乙酰胺(?:\s*[（(]DMAC[）)])?/gi, 'N,N-Dimethylacetamide (DMAC)');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*1\s*h\s*[/／]\s*(?:大鼠|Rat)(?:\s*雌性)?\s*[:：]\s*/gi, 'LC50 / Inhalation / 1h / Rat (female): ');
  t = t.replace(/半数致死浓度\s*[（(]\s*LC50\s*[）)]\s*[/／]\s*4\s*h\s*[/／]\s*(?:大鼠|Rat)(?:\s*雌性)?\s*[:：]\s*/gi, 'LC50 / Inhalation / 4h / Rat (female): ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*(?:豚鼠|Guinea\s*pig)\s*[:：]\s*/gi, 'LD50 / Dermal / Guinea pig: ');
  t = t.replace(/半数致死剂量\s*[（(]\s*LD50\s*[）)]\s*[/／]\s*(?:家兔|兔|Rabbit)\s*[:：]\s*/gi, 'LD50 / Dermal / Rabbit: ');
  t = t.replace(/[（(]?此值仅用于有可吸入的颗粒形成的情况[.。]?[）)]?/g, '(applicable only where respirable aerosols are formed)');
  t = t.replace(/＜/g, '< ');
  t = t.replace(/＞/g, '> ');

  t = t.replace(/(?:物种|Species)\s*[:：]\s*(?:兔子?|家兔)/gi, 'Species: Rabbit');
  t = t.replace(/(?:物种|Species)\s*[:：]\s*小鼠/gi, 'Species: Mouse');
  t = t.replace(/(?:物种|Species)\s*[:：]\s*大鼠/gi, 'Species: Rat');
  t = t.replace(/(?:物种|Species)\s*[:：]\s*人类/gi, 'Species: Human');
  t = t.replace(/(?:物种|Species)\s*[:：]\s*豚鼠/gi, 'Species: Guinea pig');
  t = t.replace(/(?:分类|Classification)\s*[:：]\s*刺激皮肤[.。]?/gi, 'Classification: Irritating to skin.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*(?:轻度的皮肤刺激|轻度皮肤刺激)[.。]?/gi, 'Result: Mild skin irritation.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*造成皮肤刺激[.。]?/gi, 'Result: Causes skin irritation.');
  t = t.replace(/(?:分类|Classification)\s*[:：]\s*刺激眼睛[.。]?/gi, 'Classification: Irritating to eyes.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*(?:轻度的眼睛刺激|轻度眼睛刺激)[.。]?/gi, 'Result: Mild eye irritation.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*严重的眼睛刺激[.。]?/gi, 'Result: Causes serious eye irritation.');
  t = t.replace(/(?:分类|Classification)\s*[:：]\s*不是皮肤过敏物质[.。]?/gi, 'Classification: Not a skin sensitizer.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*未引起实验室动物过敏[.。]?/gi, 'Result: Did not cause sensitization in laboratory animals.');
  t = t.replace(/(?:结果|Result)\s*[:：]\s*对志愿者做的皮肤接触试验证明没有过敏特性[.。]?/gi, 'Result: Patch test on human volunteers demonstrated no sensitizing properties.');

  // 生殖毒性
  t = t.replace(/动物试验(?:表明|显示)?无生殖毒性[.。]?/g, 'Animal testing showed no reproductive toxicity. ');
  t = t.replace(/动物实验表明在低于那些引起母体中毒的量时[，, ]*对胚胎有影响[.。]?/g, 'Animal experiments showed effects on the embryo at levels below those causing maternal toxicity. ');
  t = t.replace(/降低了胚胎胎儿的成活力[，, ]*胎儿发育缓慢[（(]变异[）)][，, ]*胎儿畸形[.。]?/g, 'Reduced embryo-fetal viability, slow fetal development (variations), fetal malformations.');

  // 病理变化
  t = t.replace(/病理变化\s*[:：]\s*胃[，, ]*睾丸[，, ]*肝[，, ]*肾[，, ]*红血球异常减少[.。]?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red blood cells.\n');
  t = t.replace(/病理变化\s*[:：]\s*肾[、，, ]*肝影响[，, ]*视网膜损伤[.。]?/g, 'Pathological changes: kidney and liver effects, retinal damage.');

  return t;
}

for (const seg of rawSegments) {
  const trans = testTranslate(seg);
  const hasCn = /[\u4e00-\u9fa5]/.test(trans);
  console.log(`[${hasCn ? 'STILL_CN' : 'TRANSLATED'}] ${seg} --> ${trans}`);
}
