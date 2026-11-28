import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { executeEightDeliverablesPipeline } from './src/pipeline-engine.js';

async function rebuild() {
  console.log('🚀 Rebuilding EP-1702 deliverables into fresh target dir...');
  const res = await executeEightDeliverablesPipeline({
    modelCode: 'EP-1702',
    cnGroundTruthPath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx',
    targetDir: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/自适应值换行规范产出'
  });
  console.log('Result:', JSON.stringify(res, null, 2));
}
rebuild();
