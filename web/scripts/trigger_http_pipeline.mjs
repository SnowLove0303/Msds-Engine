import fs from 'fs';

async function main() {
  const payload = {
    model: 'PU-218A',
    cnGroundTruthPath: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx',
    targetDir: 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A'
  };

  console.log('Sending request to MSDS API: POST http://127.0.0.1:5174/api/msds/pipeline/generate-eight');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const start = Date.now();
  const resp = await fetch('http://127.0.0.1:5174/api/msds/pipeline/generate-eight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const resJson = await resp.json();
  const duration = (Date.now() - start) / 1000;
  console.log(`Pipeline completed in ${duration.toFixed(2)}s`);
  console.log('Response:', JSON.stringify(resJson, null, 2));
}

main().catch(console.error);
