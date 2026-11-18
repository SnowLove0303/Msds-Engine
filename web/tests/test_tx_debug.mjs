import fs from 'fs';
import { translateToxicologyValueToEnglish } from '../src/pipeline-engine.js';

const testCases = [
  { val: '半数致死浓度(LC50)/1h/Rat 雌性: 8.81mg/l(此值仅用于有可吸入的颗粒形成的情况. ).半数致死浓度(LC50)/4h/Rat 雌性: 2.2mg/l.', ep: 'inhalation' },
  { val: '半数致死剂量(LD50)/Guinea pig: ＜940mg/kg.', ep: 'dermal' },
  { val: 'Species: 兔子Classification: 刺激皮肤.Result: 轻度的皮肤刺激', ep: 'skin_irritation' },
  { val: 'Species: 兔子Classification: 刺激眼睛.Result: 轻度的眼睛刺激', ep: 'eye_irritation' }
];

for (const tc of testCases) {
  const res = translateToxicologyValueToEnglish(tc.val, tc.ep);
  console.log(`Input: ${tc.val}`);
  console.log(`Output: ${res}`);
  console.log(`Has CN: ${/[\u4e00-\u9fa5]/.test(res)}`);
  console.log('---');
}
