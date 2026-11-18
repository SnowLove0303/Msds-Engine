import fs from 'node:fs';

const pePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let peContent = fs.readFileSync(pePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Replace the entire toxicology translation block in pipeline-engine.js
const targetStart = `  t = t.replace(/半数致死浓度\\s*[（(]\\s*LC50\\s*[）)]\\s*[/／]\\s*1\\s*h\\s*[/／]\\s*大鼠(?:\\s*雌性)?\\s*[:：]\\s*/gi, 'LC50 / Inhalation / 1h / Rat: ');`;
const targetEnd = `  t = t.replace(/病理变化\\s*[:：]\\s*肾[、，, ]*肝影响[，, ]*视网膜损伤[.。]?/g, 'Pathological changes: kidney and liver effects, retinal damage.');`;

const startIdx = peContent.indexOf(targetStart);
const endIdx = peContent.indexOf(targetEnd);

if (startIdx === -1 || endIdx === -1) {
  throw new Error(`Target indices not found: start=${startIdx}, end=${endIdx}`);
}

const fullTargetBlock = peContent.substring(startIdx, endIdx + targetEnd.length);

const replacementBlock = `  t = t.replace(/半数致死浓度\\s*[（(]\\s*LC50\\s*[）)]\\s*[/／]\\s*1\\s*h\\s*[/／]\\s*(?:大鼠|Rat)(?:\\s*雌性)?\\s*[:：]\\s*/gi, 'LC50 / Inhalation / 1h / Rat (female): ');
  t = t.replace(/半数致死浓度\\s*[（(]\\s*LC50\\s*[）)]\\s*[/／]\\s*4\\s*h\\s*[/／]\\s*(?:大鼠|Rat)(?:\\s*雌性)?\\s*[:：]\\s*/gi, 'LC50 / Inhalation / 4h / Rat (female): ');
  t = t.replace(/\\s*[（(]\\s*蒸气\\s*[）)]/g, ' (vapour)');
  t = t.replace(/\\s*[（(]\\s*气溶胶\\s*[）)]/g, ' (aerosol)');
  t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*[/／]\\s*(?:豚鼠|Guinea\\s*pig)\\s*[:：]\\s*/gi, 'LD50 / Dermal / Guinea pig: ');
  t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*[/／]\\s*(?:家兔|兔|Rabbit)\\s*[:：]\\s*/gi, 'LD50 / Dermal / Rabbit: ');
  t = t.replace(/[（(]?此值仅用于有可吸入的颗粒形成的情况[.。]?[）)]?/g, '(applicable only where respirable aerosols are formed)');
  t = t.replace(/N,N[－-]二甲基乙酰胺(?:\\s*[（(]DMAC[）)])?/g, 'N,N-Dimethylacetamide (DMAC)');
  t = t.replace(/[（(]\\s*鼠\\s*[）)]\\s*LD50\\s*[:：]\\s*/g, '(Rat) LD50: ');
  t = t.replace(/＞/g, '> ');
  t = t.replace(/＜/g, '< ');

  // 皮肤与眼睛刺激
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*(?:兔子?|家兔)/gi, 'Species: Rabbit');
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*小鼠/gi, 'Species: Mouse');
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*大鼠/gi, 'Species: Rat');
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*人类/gi, 'Species: Human');
  t = t.replace(/(?:分类|Classification)\\s*[:：]\\s*刺激皮肤[.。]?/gi, 'Classification: Irritating to skin.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*(?:轻度的皮肤刺激|轻度皮肤刺激)[.。]?/gi, 'Result: Mild skin irritation.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*造成皮肤刺激[.。]?/gi, 'Result: Causes skin irritation.');
  t = t.replace(/(?:分类|Classification)\\s*[:：]\\s*刺激眼睛[.。]?/gi, 'Classification: Irritating to eyes.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*(?:轻度的眼睛刺激|轻度眼睛刺激)[.。]?/gi, 'Result: Mild eye irritation.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*严重的眼睛刺激[.。]?/gi, 'Result: Causes serious eye irritation.');

  // 致敏性
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*豚鼠/gi, 'Species: Guinea pig');
  t = t.replace(/(?:物种|Species)\\s*[:：]\\s*人类/gi, 'Species: Human');
  t = t.replace(/(?:分类|Classification)\\s*[:：]\\s*不是皮肤过敏物质[.。]?/gi, 'Classification: Not a skin sensitizer.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*未引起实验室动物过敏[.。]?/gi, 'Result: Did not cause sensitization in laboratory animals.');
  t = t.replace(/(?:结果|Result)\\s*[:：]\\s*对志愿者做的皮肤接触试验证明没有过敏特性[.。]?/gi, 'Result: Patch test on human volunteers demonstrated no sensitizing properties.');

  // 致突变性、致癌性
  t = t.replace(/在细菌细胞培养中没有引起基因损害[.。]?/g, 'Did not cause genetic damage in bacterial cell culture. ');
  t = t.replace(/在哺乳类细胞培养中没有引起基因损害[.。]?/g, 'Did not cause genetic damage in mammalian cell culture. ');
  t = t.replace(/有证据认为此物质不会在动物中引起基因损伤[.。]?/g, 'Evidence indicates substance does not cause genetic damage in animals.');
  t = t.replace(/对细菌或哺乳动物细胞培养未见致突变影响[.。]?\\s*动物试验中未见致突变性影响[.。]?/g, 'No mutagenic effects observed in bacterial or mammalian cell cultures. No mutagenic effects observed in animal studies.');
  t = t.replace(/在动物试验中未见致癌影响[.。]?/g, 'No carcinogenic effects observed in animal studies.');

  // 生殖毒性
  t = t.replace(/动物试验(?:表明|显示)?无生殖毒性[.。]?/g, 'Animal testing showed no reproductive toxicity. ');
  t = t.replace(/动物实验表明在低于那些引起母体中毒的量时[，, ]*对胚胎有影响[.。]?/g, 'Animal experiments showed effects on the embryo at levels below those causing maternal toxicity. ');
  t = t.replace(/降低了胚胎胎儿的成活力[，, ]*胎儿发育缓慢[（(]变异[）)][，, ]*胎儿畸形[.。]?/g, 'Reduced embryo-fetal viability, slow fetal development (variations), fetal malformations.');
  t = t.replace(/在动物试验中[，, ]*发现仅在射入高剂量的此物质后才有损坏生育的风险[.。]?/g, 'Animal experiments showed risks of impaired fertility only at high doses. ');
  t = t.replace(/在动物试验显现出致畸效应[.。]?/g, 'Animal experiments showed teratogenic effects. ');
  t = t.replace(/可能对胎儿造成伤害[.。]?/g, 'May damage the unborn child.');

  // STOT 与 附加信息
  t = t.replace(/可能造成呼吸道刺激[.。]?/g, 'May cause respiratory irritation.');
  t = t.replace(/饮酒精饮料会加剧毒性影响[.。]?/g, 'Consumption of alcoholic beverages may aggravate toxic effects.\\n');
  t = t.replace(/N[－-]甲基吡咯烷酮有经皮吸收危险[.。]?/g, 'Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).');
  t = t.replace(/重复剂量中毒\\s*[:：]\\s*经口/g, 'Repeated dose toxicity: Oral;');
  t = t.replace(/病理变化\\s*[:：]\\s*胃[，, ]*睾丸[，, ]*肝[，, ]*肾[，, ]*红血球异常减少[.。]?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red血球异常减少.\\n');
  t = t.replace(/病理变化\\s*[:：]\\s*胃[，, ]*睾丸[，, ]*肝[，, ]*肾[，, ]*红血球异常减少[.。]?/g, 'Pathological changes: stomach, testes, liver, kidneys, abnormal reduction of red blood cells.\\n');
  t = t.replace(/重复剂量中毒\\s*[:：]\\s*吸入/g, 'Repeated dose toxicity: Inhalation;');
  t = t.replace(/病理变化\\s*[:：]\\s*肾[、，, ]*肝影响[，, ]*视网膜损伤[.。]?/g, 'Pathological changes: kidney and liver effects, retinal damage.');`;

peContent = peContent.replace(fullTargetBlock, replacementBlock);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_pipeline_engine.js', peContent, 'utf8');
console.log('proposed_pipeline_engine.js updated with complete replacement!');
