import { CHEMICAL_TRANSLATION_DICT } from '../src/context-governor.js';

const extendedDict = {
  ...CHEMICAL_TRANSLATION_DICT,
  '根据GHS不属于危险物': 'Not classified as a hazardous chemical according to GHS.',
  '根据GHS不属于危险化学品': 'Not classified as a hazardous chemical according to GHS.',
  '眼睛、皮肤接触；使用肥皂、清水等清洗即可。如有不适感，就医。': 'Eye and skin contact: Wash thoroughly with soap and water. If feeling unwell, seek medical attention.',
  '眼睛、皮肤接触; 使用肥皂、清水等清洗即可。如有不适感, 就医。': 'Eye and skin contact: Wash thoroughly with soap and water. If feeling unwell, seek medical attention.',
  '请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产品包装完整。每次取用之后立即密封，打开包装后尽快使用完毕。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact. Reseal container immediately after use; consume promptly once opened.',
  '请置于避光、阴凉干燥处存放，存储温度应保持在5-35°C，避免霜冻，保持产品包装完整。每次取用之后立即密封，打开包装后尽快使用完毕。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact. Reseal container immediately after use; consume promptly once opened.',
  '请置于避光、阴凉干燥处存放, 存储温度应保持在5-35°C, 避免霜冻, 保持产品包装完整。每次取用之后立即密封, 打开包装后尽快使用完毕。': 'Store in a dark, cool, dry place. Maintain storage temperature between 5-35 °C, avoid freezing, and keep container intact. Reseal container immediately after use; consume promptly once opened.',
  '使用后的空桶未经无害化处理前，不得存储食物及其他物品，以免对人体、环境造成危害；包装物的回收、利用、处置应符合国家及当地相关法律、法规规定，因包装物处置不当造成的危害及损失，由处置方承担。': 'Empty drums must not be used to store food or other items before proper decontamination, to prevent hazard to humans and environment; recycling, utilization, and disposal of packaging must comply with national and local regulations; liability for improper disposal rests with the disposer.',
  '使用后的空桶未经无害化处理前, 不得存储食物及其他物品, 以免对人体、环境造成危害; 包装物的回收、利用、处置应符合国家及当地相关法律、法规规定, 因包装物处置不当造成的危害及损失, 由处置方承担。': 'Empty drums must not be used to store food or other items before proper decontamination, to prevent hazard to humans and environment; recycling, utilization, and disposal of packaging must comply with national and local regulations; liability for improper disposal rests with the disposer.'
};

function testTranslatePrecaution(p) {
  if (!p) return '';
  const trimmed = p.trim();
  if (extendedDict[trimmed]) return extendedDict[trimmed];
  const noEnd = trimmed.replace(/[。.]\s*$/, '');
  if (extendedDict[noEnd]) return extendedDict[noEnd];
  if (extendedDict[noEnd + '。']) return extendedDict[noEnd + '。'];
  return trimmed;
}

const testItems = [
  '根据GHS不属于危险物',
  '没有明显的已知作用或严重危险。',
  '操作时穿戴必要的防护用品（手套、防护镜、工作服等）。',
  '操作后彻底清洗身体接触部位。',
  '作业场所不得进食，饮水或吸烟。',
  '在室外或通风良好处操作。',
  '吸入：一旦吸入，如有不适，就医。',
  '眼睛、皮肤接触；使用肥皂、清水等清洗即可。如有不适感，就医。',
  '食入：立即漱口，禁止催吐，立即就医诊治。',
  '泄露：收集泄漏物。',
  '灭火：火灾时，使用干粉、泡沫、二氧化碳灭火。',
  '请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产品包装完整。每次取用之后立即密封，打开包装后尽快使用完毕。',
  '使用后的空桶未经无害化处理前，不得存储食物及其他物品，以免对人体、环境造成危害；包装物的回收、利用、处置应符合国家及当地相关法律、法规规定，因包装物处置不当造成的危害及损失，由处置方承担。',
  '物理化学危险：对水体、土壤可造成一定的污染。',
  '健康危害：无',
  '环境危害：无危险物质释放，防止进入下水道，以防聚合物沉积阻塞下水道。'
];

console.log('=== TESTING EXTENDED DICT TRANSLATIONS ===');
let failCount = 0;
for (const item of testItems) {
  const trans = testTranslatePrecaution(item);
  const ch = trans.match(/[\u4e00-\u9fa5]/g) || [];
  if (ch.length > 0) {
    console.log(`[FAIL] ${ch.length} chars remain in: "${item}" -> "${trans}"`);
    failCount++;
  } else {
    console.log(`[PASS] "${item}" -> "${trans}"`);
  }
}
console.log(`\nFailures: ${failCount}`);
