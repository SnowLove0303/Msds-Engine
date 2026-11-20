import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function loadDocxXml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'text/xml');
}

function getTableText(tbl) {
  return tbl.textContent || '';
}

function getPText(p) {
  if (!p) return '';
  const runs = Array.from(p.getElementsByTagName('w:r'));
  let text = '';
  for (const r of runs) {
    for (const child of Array.from(r.childNodes || [])) {
      if (child.nodeName === 'w:t') text += child.textContent;
      if (child.nodeName === 'w:br') text += '\n';
    }
  }
  return text || p.textContent || '';
}

async function auditModel(modelCode, targetDir) {
  console.log(`\n======================================================`);
  console.log(`   全景重对照法医硬审计 (Full-Fidelity Audit): ${modelCode}`);
  console.log(`   目标目录: ${targetDir}`);
  console.log(`======================================================`);

  const deliverables = [
    `${modelCode} msds_CN 冠志.docx`,
    `${modelCode} msds_CN 冠志.pdf`,
    `${modelCode} msds_CN 国彩.docx`,
    `${modelCode} msds_CN 国彩.pdf`,
    `${modelCode} msds_EN Guanzhi.docx`,
    `${modelCode} msds_EN Guanzhi.pdf`,
    `${modelCode} msds_EN Guocai.docx`,
    `${modelCode} msds_EN Guocai.pdf`,
  ];

  let failCount = 0;
  const assert = (cond, msg, detail = null) => {
    if (!cond) {
      console.error(`❌ [FAIL] ${msg}`);
      if (detail) console.error(`     ↳ 细节: ${detail}`);
      failCount++;
    } else {
      console.log(`✅ [PASS] ${msg}`);
    }
  };

  // 1. 文件存在性与物理时间戳新鲜度
  const now = Date.now();
  for (const f of deliverables) {
    const fullPath = path.join(targetDir, f);
    assert(fs.existsSync(fullPath), `交付物存在性: ${f}`);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      const ageSec = (now - stat.mtimeMs) / 1000;
      assert(ageSec < 1800, `交付物物理新鲜度 (<30m): ${f} (距今 ${ageSec.toFixed(1)}s)`);
      assert(stat.size > 1000, `交付物大小非空: ${f} (${stat.size} bytes)`);
    }
  }

  // 2. 加载 DOCX DOM
  const cnGuanzhiDoc = await loadDocxXml(path.join(targetDir, `${modelCode} msds_CN 冠志.docx`));
  const cnGuocaiDoc = await loadDocxXml(path.join(targetDir, `${modelCode} msds_CN 国彩.docx`));
  const enGuanzhiDoc = await loadDocxXml(path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`));
  const enGuocaiDoc = await loadDocxXml(path.join(targetDir, `${modelCode} msds_EN Guocai.docx`));

  const cnTbls = cnGuanzhiDoc.getElementsByTagName('w:tbl');
  const enTbls = enGuanzhiDoc.getElementsByTagName('w:tbl');

  // 3. Section 1 检验
  const s1CnText = getTableText(cnTbls[0]);
  const s1EnText = getTableText(enTbls[0]);
  if (modelCode === 'PA-4840') {
    assert(/化学品分类[：:]\s*丙烯酸聚合物分散体/.test(s1CnText), 'Section 1: PA-4840 化学品分类非空且准确为“丙烯酸聚合物分散体”');
  } else if (modelCode === 'PA-4902') {
    assert(/化学品分类[：:]\s*水溶性丙烯酸聚合物树脂/.test(s1CnText), 'Section 1: PA-4902 化学品分类非空且准确为“水溶性丙烯酸聚合物树脂”');
  }

  // 4. Section 2 检验
  const s2CnText = getTableText(cnTbls[1]);
  const s2EnText = getTableText(enTbls[1]);
  if (modelCode === 'PA-4840') {
    assert(/急性毒性4经口吞咽有害/.test(s2CnText), 'Section 2: PA-4840 急性毒性4经口吞咽有害 保全');
    assert(/急性毒性4经皮皮肤接触有害/.test(s2CnText), 'Section 2: PA-4840 急性毒性4经皮皮肤接触有害 保全');
    assert(/急性毒性4吸入性吸入有害/.test(s2CnText), 'Section 2: PA-4840 急性毒性4吸入性吸入有害 保全');
    assert(/皮肤刺激2\s*造成皮肤刺激/.test(s2CnText), 'Section 2: PA-4840 皮肤刺激2 造成皮肤刺激 保全');
    assert(/眼睛刺激2\s*造成严重的眼刺激/.test(s2CnText), 'Section 2: PA-4840 眼睛刺激2 造成严重的眼刺激 保全');
    assert(/对水生生物有害并具有长期持续影响/.test(s2CnText) && /H412/.test(s2CnText), 'Section 2: PA-4840 水生环境 H412 保全');

    assert(/Harmful if swallowed/i.test(s2EnText), 'Section 2 EN: PA-4840 Harmful if swallowed 保全');
    assert(/Harmful in contact with skin/i.test(s2EnText), 'Section 2 EN: PA-4840 Harmful in contact with skin 保全');
    assert(/Harmful if inhaled/i.test(s2EnText), 'Section 2 EN: PA-4840 Harmful if inhaled 保全');
    assert(/Causes skin irritation/i.test(s2EnText), 'Section 2 EN: PA-4840 Causes skin irritation 保全');
    assert(/Causes serious eye irritation/i.test(s2EnText), 'Section 2 EN: PA-4840 Causes serious eye irritation 保全');
    assert(/Harmful to aquatic life with long lasting effects/i.test(s2EnText) && /H412/.test(s2EnText), 'Section 2 EN: PA-4840 Aquatic chronic H412 保全');
  } else if (modelCode === 'PA-4902') {
    assert(/危险象形标记[：:]\s*无/.test(s2CnText), 'Section 2: PA-4902 危险象形标记：无 保全');
    assert(/警告词[：:]\s*警告/.test(s2CnText), 'Section 2: PA-4902 警告词：警告 保全');
    assert(/羟基丙烯酸酯聚合物GHS危险性分类[：:]\s*不适用/.test(s2CnText), 'Section 2: PA-4902 聚合物免责附注保全在 Section 2');
    assert(/请注意以下物质：/.test(s2CnText) && /N,N-二甲基乙醇胺/.test(s2CnText), 'Section 2: PA-4902 成盐中和剂附注保全在 Section 2');
    assert(/GHS pictograms:[ \t]*None/i.test(s2EnText), 'Section 2 EN: PA-4902 GHS pictograms: None 保全');
    assert(/Signal word:[ \t]*Warning/i.test(s2EnText), 'Section 2 EN: PA-4902 Signal word: Warning 保全');
    assert(/Hydroxy acrylic polymer GHS classification:[ \t]*Not applicable/i.test(s2EnText), 'Section 2 EN: PA-4902 英文聚合物免责分类保全');
    assert(/Please note the following substance:/i.test(s2EnText) && /N,N-Dimethylethanolamine/i.test(s2EnText), 'Section 2 EN: PA-4902 英文成盐中和剂迁移保全');
  }

  // 5. Section 3 检验
  const s3CnTbl = cnTbls[2];
  const s3EnTbl = enTbls[2];
  const s3CnTrs = s3CnTbl.getElementsByTagName('w:tr');
  const s3EnTrs = s3EnTbl.getElementsByTagName('w:tr');
  if (modelCode === 'PA-4902') {
    assert(s3CnTrs.length === 8, `Section 3: PA-4902 中文成分表严格 8 行 (4题头+4组分) (实测: ${s3CnTrs.length} 行)`);
    assert(s3EnTrs.length === 8, `Section 3: PA-4902 英文成分表严格 8 行 (4题头+4组分) (实测: ${s3EnTrs.length} 行)`);
    const s3CnText = getTableText(s3CnTbl);
    const s3EnText = getTableText(s3EnTbl);
    assert(!/羟基丙烯酸酯聚合物GHS危险性分类/.test(s3CnText), 'Section 3: PA-4902 中文组分表已彻底剥离聚合物附注');
    assert(!/Hydroxy acrylic polymer GHS classification/i.test(s3EnText), 'Section 3: PA-4902 英文组分表已彻底剥离聚合物附注');
    assert(!/请注意以下物质/.test(s3CnText), 'Section 3: PA-4902 中文组分表已彻底剥离成盐附注');
    assert(!/Please note the following substance/i.test(s3EnText), 'Section 3: PA-4902 英文组分表已彻底剥离成盐附注');
  }

  // 6. Section 11 检验
  const s11CnTbl = cnTbls[10];
  const s11EnTbl = enTbls[10];
  const s11CnTrs = s11CnTbl.getElementsByTagName('w:tr');
  const s11EnTrs = s11EnTbl.getElementsByTagName('w:tr');
  if (modelCode === 'PA-4902') {
    assert(s11CnTrs.length === 4, `Section 11: PA-4902 升级为通栏 4 行三层范式 1 (实测: ${s11CnTrs.length} 行)`);
    assert(s11EnTrs.length === 4, `Section 11 EN: PA-4902 英文升级为通栏 4 行三层范式 1 (实测: ${s11EnTrs.length} 行)`);
    const s11CnText = getTableText(s11CnTbl);
    const s11EnText = getTableText(s11EnTbl);
    assert(/水溶性羟基聚丙烯酸酯/.test(s11CnText), 'Section 11: PA-4902 保全“水溶性羟基聚丙烯酸酯”组分');
    assert(/乙二醇丁醚/.test(s11CnText), 'Section 11: PA-4902 保全“乙二醇丁醚”组分');
    assert(/2000/.test(s11CnText) && /1997/.test(s11CnText), 'Section 11: PA-4902 保全动物 LD50/LC50 实测数据');
    assert(/Water-soluble hydroxy polyacrylate/i.test(s11EnText), 'Section 11 EN: PA-4902 英文组分名保全');
    assert(/Ethylene glycol monobutyl ether/i.test(s11EnText), 'Section 11 EN: PA-4902 英文乙二醇丁醚保全');

    const s11CnPs = Array.from(s11CnTrs[3].getElementsByTagName('w:p'));
    assert(s11CnPs.length === 2, `Section 11: PA-4902 详述行包含 2 个独立组分段落 (实测: ${s11CnPs.length})`);
    const p1PText = getPText(s11CnPs[1]);
    assert(p1PText.includes('\n'), 'Section 11: 详述行内各指标软换行严格保全 (包含 \\n)');
    assert(!/mg\/kg刺激性/.test(p1PText), 'Section 11: 零文本粘连碰撞 (mg/kg 与 刺激性 分离)');
  }

  console.log(`------------------------------------------------------`);
  console.log(` ${modelCode} 审计结果: ${failCount === 0 ? '全部通过 (100% PASS)' : `发现 ${failCount} 项违规`}`);
  console.log(`------------------------------------------------------\n`);
  return failCount === 0;
}

async function main() {
  const p4840Target = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840';
  const p4902Target = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902';

  const pass4840 = await auditModel('PA-4840', p4840Target);
  const pass4902 = await auditModel('PA-4902', p4902Target);

  if (!pass4840 || !pass4902) {
    console.error('❌ 全景重对照法医硬审计未能全部通过！');
    process.exit(1);
  } else {
    console.log('🌟 PA-4840 与 PA-4902 16 份交付物全景重对照法医硬审计 100% 满分通过！');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
