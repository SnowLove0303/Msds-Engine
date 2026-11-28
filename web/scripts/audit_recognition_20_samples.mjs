import fs from 'fs';
import path from 'path';
import { recognizeSourceDocx, STRUCTURE_TYPES } from '../src/msds-source-semantic-adapter.js';

const SAMPLES = [
  // 1. 单组份水性 PU
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1007/PU-1007 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1034/PU-1034 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1036/PU-1036 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-1102/PU-1102 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-202B/PU-202B msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-202C/PU-202C msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2060/PU-2060 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx',
  '算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-303A/PU-303A msds_CN 冠志.docx',

  // 2. 复配树脂 RU&RA
  '算法训练材料/源文件材料/8 复配树脂、涂料、涂饰剂 RU&RA/RU-10171S25/RU-10171S25 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/8 复配树脂、涂料、涂饰剂 RU&RA/RU-10172/RU-10172 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/8 复配树脂、涂料、涂饰剂 RU&RA/RU-10172S20/RU-10172S20 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/8 复配树脂、涂料、涂饰剂 RU&RA/RU-10172S25/RU-10172S25 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/8 复配树脂、涂料、涂饰剂 RU&RA/RU-10174S20/RU-10174S20 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/8 复配树脂、涂料、涂饰剂 RU&RA/RU-13000/RU-13000 msds_CN 冠志.docx',

  // 3. 水性交联剂 OS
  '算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8950/OS-8950 msds_CN 冠志.docx',
  '算法训练材料/源文件材料/水性噁唑啉交联剂/OS-8970/OS-8970 msds_CN 冠志.docx',

  // 4. 水性羟基丙烯酸分散体 HPUA
  '算法训练材料/源文件材料/水性羟基丙烯酸改性聚氨酯分散体 HPUA/HPUA-7613/HPUA-7613 msds_CN 冠志.docx',

  // 5. 非水性无溶剂产品 EP
  '算法训练材料/源文件材料/非水性无溶剂产品/EP-8801/EP-8801 msds_CN Guanzhi.docx'
];

async function runPanoramic20SamplesAudit() {
  console.log('========================================================================');
  console.log('       20 样本 16 章节全量结构、内容与字体深度穿透核验检测');
  console.log('========================================================================\n');

  const engineRoot = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine';
  const results = [];
  let totalFailures = 0;

  for (let i = 0; i < SAMPLES.length; i++) {
    const relPath = SAMPLES[i];
    const fullPath = path.join(engineRoot, relPath);
    const fileName = path.basename(relPath);

    console.log(`[样本 ${i + 1}/20] 正在识别与穿透审计: ${fileName}`);

    if (!fs.existsSync(fullPath)) {
      console.error(`  ❌ 文件不存在: ${fullPath}`);
      totalFailures++;
      continue;
    }

    const t0 = Date.now();
    let facts;
    try {
      facts = await recognizeSourceDocx(fullPath, fileName);
    } catch (err) {
      console.error(`  ❌ 识别引擎抛出异常: ${err.message}`);
      totalFailures++;
      continue;
    }
    const elapsed = Date.now() - t0;

    // 1. 结构核验：16 个章节是否全部识别
    const presentSections = Object.keys(facts.sections).map(Number).sort((a, b) => a - b);
    const missingSections = [];
    for (let s = 1; s <= 16; s++) {
      if (!facts.sections[s] || facts.sections[s].rowsCount === 0) {
        missingSections.push(s);
      }
    }

    // 2. 结构形态汇总
    let twoColCount = 0;
    let explCount = 0;
    let fullWidthCount = 0;
    let multiColCount = 0;

    for (const sec of Object.values(facts.sections)) {
      twoColCount += sec.structureSummary?.twoColumnCount || 0;
      explCount += sec.structureSummary?.explanationRowCount || 0;
      fullWidthCount += sec.structureSummary?.fullWidthCount || 0;
      multiColCount += sec.structureSummary?.multiColumnCount || 0;
    }

    // 3. 内容核验
    const modelOk = Boolean(facts.modelCode);
    const ghsStatus = facts.ghs.isHazardous ? `危品 (${facts.ghs.categories.length} 类, ${facts.ghs.hazardStatements.length} H, 信号词: ${facts.ghs.signalWord || '无'})` : '非危品';
    const compCount = facts.components.length;
    const s9Count = facts.physicalProperties.length;
    const s11Paradigm = facts.toxicology.paradigm;
    const isNonDang = facts.transport.isNonDangerousGoods;

    // 4. 字体与排版样式捕获统计
    let boldRunsCount = 0;
    let fontsFound = new Set();
    let fontSizesFound = new Set();
    let alignmentsFound = new Set();

    for (const sec of Object.values(facts.sections)) {
      for (const row of sec.rows || []) {
        for (const cell of row.cells || []) {
          if (cell.typography?.isBold) boldRunsCount++;
          if (cell.typography?.fontFamily) fontsFound.add(cell.typography.fontFamily);
          if (cell.typography?.fontSizePt) fontSizesFound.add(cell.typography.fontSizePt);
          if (cell.typography?.alignment) alignmentsFound.add(cell.typography.alignment);
        }
      }
    }

    const sampleSummary = {
      index: i + 1,
      fileName,
      modelCode: facts.modelCode,
      elapsedMs: elapsed,
      presentSectionsCount: presentSections.length,
      missingSections,
      structures: {
        twoCol: twoColCount,
        expl: explCount,
        fullWidth: fullWidthCount,
        multiCol: multiColCount
      },
      content: {
        modelOk,
        ghsStatus,
        componentCount: compCount,
        s9PropertiesCount: s9Count,
        s11Paradigm,
        isNonDangerousGoods: isNonDang
      },
      typography: {
        boldCells: boldRunsCount,
        fonts: Array.from(fontsFound).slice(0, 3),
        fontSizes: Array.from(fontSizesFound).slice(0, 3),
        alignments: Array.from(alignmentsFound)
      }
    };

    results.push(sampleSummary);

    // 打印单个样本摘要
    const secStatus = missingSections.length === 0 ? '✅ 16/16 全覆盖' : `⚠️ 缺失 Section [${missingSections.join(', ')}]`;
    console.log(`  └─ 章节: ${secStatus} | 结构: [2列: ${twoColCount}, 通栏: ${fullWidthCount}, 说明行: ${explCount}, 3列+: ${multiColCount}]`);
    console.log(`  └─ 内容: 型号=${facts.modelCode || '未识别'}, GHS=${ghsStatus}, 组分=${compCount}个, S9理化=${s9Count}项`);
    console.log(`  └─ 样式: 粗体格=${boldRunsCount}, 字体=[${Array.from(fontsFound).join(', ')}], 对齐=[${Array.from(alignmentsFound).join(', ')}] (耗时: ${elapsed}ms)\n`);
  }

  console.log('========================================================================');
  console.log('                     20 样本全景审计统计大盘汇总');
  console.log('========================================================================');
  console.table(results.map(r => ({
    '序号': r.index,
    '文件型号': r.modelCode || 'MISSING',
    '16章节覆盖': `${r.presentSectionsCount}/16`,
    '两列数': r.structures.twoCol,
    '通栏数': r.structures.fullWidth,
    '三列+数': r.structures.multiCol,
    '组分数': r.content.componentCount,
    'S9参数数': r.content.s9PropertiesCount,
    '粗体格数': r.typography.boldCells
  })));

  const all16Present = results.every(r => r.presentSectionsCount === 16);
  const allModelsFound = results.every(r => Boolean(r.modelCode));
  const hasFullWidth = results.some(r => r.structures.fullWidth > 0);
  const hasMultiCol = results.some(r => r.structures.multiCol > 0);
  const hasBoldExtracted = results.every(r => r.typography.boldCells > 0);

  console.log('\n--- 核心质量门禁指标判断 ---');
  console.log(`1. 16 章节全量识别率: ${results.filter(r => r.presentSectionsCount === 16).length}/20 (${all16Present ? 'PASS' : 'WARN'})`);
  console.log(`2. 产品型号抽取成功率: ${results.filter(r => Boolean(r.modelCode)).length}/20 (${allModelsFound ? 'PASS' : 'FAIL'})`);
  console.log(`3. 通栏 (FULL_WIDTH) 结构形态捕获: ${hasFullWidth ? 'PASS' : 'FAIL'}`);
  console.log(`4. 三列及以上 (MULTI_COLUMN) 结构形态捕获: ${hasMultiCol ? 'PASS' : 'FAIL'}`);
  console.log(`5. 字体样式 (加粗/字号/字体) 提取能力: ${hasBoldExtracted ? 'PASS' : 'FAIL'}`);

  if (!allModelsFound || totalFailures > 0) {
    console.error('\n❌ 存在识别未通过项，需针对性优化！');
    process.exit(1);
  } else {
    console.log('\n🎉 20 样本大规模识别穿透核验检测圆满完成！');
    process.exit(0);
  }
}

runPanoramic20SamplesAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
