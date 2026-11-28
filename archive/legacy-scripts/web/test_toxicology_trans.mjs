import fs from 'fs';

// Let's import translateToxicologyValueToEnglish or test it
const content = fs.readFileSync('src/pipeline-engine.js', 'utf8');
let translateToxicologyValueToEnglish;
const fnCode = content.slice(content.indexOf('function translateToxicologyValueToEnglish(cnText) {'), content.indexOf('export function translateSection12PreambleToEnglish'));
eval('translateToxicologyValueToEnglish = ' + fnCode);


const tests = [
  '半数致死剂量（LD50）/大鼠：3,000－6,000mg/kg',
  '半数致死浓度（LC50）/1h/大鼠 雌性：8.81mg/l（此值仅用于有可吸入的颗粒形成的情况。）\n半数致死浓度（LC50）/4h/大鼠 雌性：2.2mg/l',
  '半数致死剂量（LD50）/豚鼠：＜940mg/kg',
  '物种：兔子\n分类：刺激皮肤\n结果：轻度的皮肤刺激',
  '物种：兔子\n分类：刺激眼睛\n结果：轻度的眼睛刺激',
  '物种：豚鼠\n分类：不是皮肤过敏物质\n结果：未引起实验室动物过敏\n物种：人类\n分类：不是皮肤过敏物质\n结果：对志愿者做的皮肤接触试验证明没有过敏特性',
  '在细菌细胞培养中没有引起基因损害。在哺乳类细胞培养中没有引起基因损害。有证据认为此物质不会在动物中引起基因损伤。',
  '在动物试验中未见致癌影响。',
  '动物试验表明无生殖毒性。动物实验表明在低于那些引起母体中毒的量时，对胚胎有影响。降低了胚胎胎儿的成活力，胎儿发育缓慢（变异），胎儿畸形。',
  '无数据资料。',
  '饮酒精饮料会加剧毒性影响。\n重复剂量中毒：经口；病理变化：胃，睾丸，肝，肾，红血球异常减少。\n重复剂量中毒：吸入；病理变化：肾、肝影响，视网膜损伤。'
];

tests.forEach((t, i) => {
  console.log(`\n--- Test ${i+1} ---`);
  console.log('CN:', t.replace(/\n/g, ' \\n '));
  console.log('EN:', translateToxicologyValueToEnglish(t).replace(/\n/g, ' \\n '));
});
