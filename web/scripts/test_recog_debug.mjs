import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';

const src = "F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\TDS MSDS 重写版\\04-1 水性环氧树脂 EP\\EP-1501\\EP-1501 msds_CN 冠志.docx";

async function test() {
  const c1 = await recognizeSourceDocx(src, "EP-1501 msds_CN 冠志.docx");
  console.log("c1.ghs:", JSON.stringify(c1.ghs, null, 2));
}

test();
