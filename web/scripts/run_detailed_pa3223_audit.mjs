import fs from 'node:fs';
import JSZip from 'jszip';

async function extractXml(path) {
  const zip = await JSZip.loadAsync(fs.readFileSync(path));
  return await zip.file('word/document.xml').async('text');
}

async function runDetailedAudit() {
  const targetDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223';
  const goldenPath = targetDir + '/PA-3223 msds_CN 冠志 手做改版材料.docx';
  const outputCnGz = targetDir + '/PA-3223 msds_CN 冠志.docx';
  const outputCnGc = targetDir + '/PA-3223 msds_CN 国彩.docx';
  const outputEnGz = targetDir + '/PA-3223 msds_EN Guanzhi.docx';
  const outputEnGc = targetDir + '/PA-3223 msds_EN Guocai.docx';

  const goldenXml = await extractXml(goldenPath);
  const outCnGzXml = await extractXml(outputCnGz);
  const outEnGzXml = await extractXml(outputEnGz);

  console.log('========================================================================');
  console.log('              PA-3223 对比手做改版材料深度穿透审计报告                  ');
  console.log('========================================================================\n');

  console.log('【1. 核心业务事实与规程穿透审计 (对比 手做改版材料)】');
  const checkPhrases = [
    '中和物', '成盐', '二甲基乙醇胺', 'DMEA',
    '避免吸入蒸气', '穿戴适当的个人防护装备',
    '大量清水冲洗', '不可催吐',
    '存放在阴凉、干燥、通风良好', '保持容器密封',
    '防止流入下水道', '高粘度聚合物乳液可能导致物理堵塞',
    '未进行整体毒理学试验', '以下数据为主要组分'
  ];

  let missingCount = 0;
  for (const phrase of checkPhrases) {
    const inGolden = goldenXml.includes(phrase);
    const inOutCn = outCnGzXml.includes(phrase);
    if (!inOutCn) missingCount++;
    console.log(`- 事实词句 [${phrase}]: 手做定稿=${inGolden ? '存在' : '无'}, 算法产出CN=${inOutCn ? '✅穿透保留' : '❌丢失!'}`);
  }
  console.log(`事实穿透率判定: 检查项 ${checkPhrases.length} | 丢失项 ${missingCount} | 穿透率 ${((checkPhrases.length - missingCount)/checkPhrases.length*100).toFixed(1)}%\n`);

  console.log('【2. Section 2 拓扑审计 (通栏单格与防黑盒截断)】');
  const s2Match = outCnGzXml.match(/<w:tbl[\s\S]*?危险性概述[\s\S]*?<\/w:tbl>/);
  if (s2Match) {
    const rows = s2Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    console.log(`Section 2 实际产出行数: ${rows.length}`);
    rows.forEach((r, idx) => {
      const isGridSpan = r.includes('gridSpan');
      const cells = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const text = r.replace(/<[^>]+>/g, '').trim().slice(0, 50).replace(/\s+/g, ' ');
      console.log(`  Row ${idx} (单元格数: ${cells.length}, 通栏gridSpan=${isGridSpan}): ${text}...`);
    });
  }

  console.log('\n【3. Section 3 拓扑审计 (纯净 3 列居中保护)】');
  const s3Match = outCnGzXml.match(/<w:tbl[\s\S]*?成分[\s\S]*?<\/w:tbl>/);
  if (s3Match) {
    const rows = s3Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    console.log(`Section 3 实际产出行数: ${rows.length}`);
    rows.forEach((r, idx) => {
      const cells = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const text = r.replace(/<[^>]+>/g, '').trim().slice(0, 50).replace(/\s+/g, ' ');
      console.log(`  Row ${idx} (单元格数: ${cells.length}): ${text}...`);
    });
  }

  console.log('\n【4. Section 11 三级责任隔离审计】');
  const s11Match = outCnGzXml.match(/<w:tbl[\s\S]*?毒理学信息[\s\S]*?<\/w:tbl>/);
  if (s11Match) {
    const rows = s11Match[0].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    console.log(`Section 11 实际产出行数: ${rows.length}`);
    rows.slice(0, 4).forEach((r, idx) => {
      const text = r.replace(/<[^>]+>/g, '').trim().slice(0, 60).replace(/\s+/g, ' ');
      console.log(`  Row ${idx}: ${text}...`);
    });
  }

  console.log('\n【5. 英文版零中文字符审计】');
  const cnInEn = (outEnGzXml.replace(/<[^>]+>/g, '').match(/[\u4e00-\u9fa5]/g) || []);
  console.log(`英文版中文字符数: ${cnInEn.length} -> ${cnInEn.length === 0 ? '✅ 100% 纯英文通过' : '❌ 发现残留: ' + cnInEn.slice(0, 10).join('')}`);

  console.log('\n【6. 底层 OOXML 纯左对齐与几何机检】');
  const nonLeftParas = (outCnGzXml.match(/<w:pPr>[\s\S]*?<w:jc w:val="(?!left")[^"]+"[\s\S]*?<\/w:pPr>/g) || []);
  console.log(`全篇数据值非左对齐段落数: ${nonLeftParas.length} (要求: 恒为 0)`);
}

runDetailedAudit();
