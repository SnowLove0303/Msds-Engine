import fs from 'fs';

async function run() {
  console.log('Invoking POST /api/msds/pipeline/generate-eight for PU-608...');
  const res = await fetch('http://127.0.0.1:5174/api/msds/pipeline/generate-eight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'PU-608',
      cnGroundTruthPath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-608/PU-608 msds_CN 冠志 手动导出.docx',
      targetDir: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-608'
    })
  });
  
  const json = await res.json();
  console.log('Pipeline Response:', JSON.stringify(json, null, 2));
}

run().catch(console.error);
