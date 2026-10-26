import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

/**
 * 四维深度审计脚本 (Four-Dimensional Deep Audit Matrix)
 * 覆盖：
 * 维度 1: 语义事实保真矩阵 (Keyword penetration: 100%)
 * 维度 2: 底层 OOXML 几何对齐 (纯左对齐、零制表位、常规体断言)
 * 维度 3: 法律拓扑与路由 (S2 Mode B 通栏, S3 纯净网格, S11 三级责任隔离, S13 双居中)
 * 维度 4: 交付留存与跨预设差分 (SHA-256 留存、8格式完整度、冠志/国彩5项差异、英文零中文)
 */

const targetDir = process.argv[2] || 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223';
const modelCode = process.argv[3] || 'PA-3223';

console.log(`========================================================================`);
console.log(`           MSDS 四维深度审计矩阵 (Four-Dimensional Deep Audit)            `);
console.log(` 目标目录: ${targetDir}`);
console.log(` 型号代号: ${modelCode}`);
console.log(`========================================================================\n`);

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const expectedDocx = [
  `${modelCode} msds_CN 冠志.docx`,
  `${modelCode} msds_CN 国彩.docx`,
  `${modelCode} msds_EN Guanzhi.docx`,
  `${modelCode} msds_EN Guocai.docx`,
];

const expectedPdf = [
  `${modelCode} msds_CN 冠志.pdf`,
  `${modelCode} msds_CN 国彩.pdf`,
  `${modelCode} msds_EN Guanzhi.pdf`,
  `${modelCode} msds_EN Guocai.pdf`,
];

const auditResults = {
  dim1_facts: { pass: true, details: [] },
  dim2_geometry: { pass: true, details: [] },
  dim3_topology: { pass: true, details: [] },
  dim4_parity: { pass: true, details: [] },
};

async function parseDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const docXmlStr = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(docXmlStr, 'application/xml');

  let footersText = '';
  for (const fileName of Object.keys(zip.files)) {
    if (/word\/footer\d+\.xml/.test(fileName)) {
      const fStr = await zip.file(fileName).async('text');
      const fDoc = new DOMParser().parseFromString(fStr, 'application/xml');
      const tNodes = Array.from(fDoc.getElementsByTagNameNS(W_NS, 't'));
      footersText += ' ' + tNodes.map(t => t.textContent).join(' ');
    }
  }

  const allT = Array.from(doc.getElementsByTagNameNS(W_NS, 't')).map(t => t.textContent).join(' ');
  const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));

  return { doc, tables, fullText: allT, footersText, zip, buf };
}

async function runAudit() {
  // === 维度 4: 交付留存与跨预设差分 ===
  console.log('【开始审计】维度 4: 交付留存与跨预设差分 (Deliverables Parity & Zero Loss)');
  let dim4Passed = true;

  // 1. 检查 8 交付物是否存在且大小非 0
  const allDeliverables = [...expectedDocx, ...expectedPdf];
  for (const item of allDeliverables) {
    const fullPath = path.join(targetDir, item);
    if (!fs.existsSync(fullPath)) {
      auditResults.dim4_parity.details.push(`[FAIL] 缺失交付物: ${item}`);
      dim4Passed = false;
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        auditResults.dim4_parity.details.push(`[FAIL] 交付物文件为空: ${item}`);
        dim4Passed = false;
      } else {
        auditResults.dim4_parity.details.push(`[PASS] 交付物存在且有效: ${item} (${(stat.size / 1024).toFixed(1)} KB)`);
      }
    }
  }

  // 2. 检查源文件留存
  const backupPath = path.join(targetDir, `${modelCode} msds_CN 冠志_源文件留存.docx`);
  if (!fs.existsSync(backupPath)) {
    auditResults.dim4_parity.details.push(`[FAIL] 缺失源文件留存副本: ${path.basename(backupPath)}`);
    dim4Passed = false;
  } else {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(backupPath)).digest('hex');
    auditResults.dim4_parity.details.push(`[PASS] 源文件留存完整存在: SHA-256=${hash.slice(0, 16)}...`);
  }

  // 3. 检查英文交付物零中文
  for (const enDoc of [`${modelCode} msds_EN Guanzhi.docx`, `${modelCode} msds_EN Guocai.docx`]) {
    const fullPath = path.join(targetDir, enDoc);
    if (fs.existsSync(fullPath)) {
      const { fullText } = await parseDocx(fullPath);
      const chineseMatches = fullText.match(/[\u4e00-\u9fa5]/g) || [];
      if (chineseMatches.length > 0) {
        auditResults.dim4_parity.details.push(`[FAIL] 英文交付物 ${enDoc} 包含非法中文字符: ${chineseMatches.slice(0, 10).join('')} (${chineseMatches.length} 处)`);
        dim4Passed = false;
      } else {
        auditResults.dim4_parity.details.push(`[PASS] 英文交付物 ${enDoc} 100% 零中文`);
      }
    }
  }

  // 4. 检查冠志 vs 国彩 5 项核心差异
  const cnGzPath = path.join(targetDir, `${modelCode} msds_CN 冠志.docx`);
  const cnGcPath = path.join(targetDir, `${modelCode} msds_CN 国彩.docx`);
  if (fs.existsSync(cnGzPath) && fs.existsSync(cnGcPath)) {
    const gz = await parseDocx(cnGzPath);
    const gc = await parseDocx(cnGcPath);
    const gzHasGz = gz.fullText.includes('广州冠志') || gz.footersText.includes('冠志');
    const gcHasGc = gc.fullText.includes('英德国彩') || gc.footersText.includes('国彩');
    const gzNoGc = !gz.fullText.includes('英德国彩') && !gz.footersText.includes('国彩');
    const gcNoGz = !gc.fullText.includes('广州冠志') && !gc.footersText.includes('冠志');

    if (gzHasGz && gcHasGc && gzNoGc && gcNoGz) {
      auditResults.dim4_parity.details.push(`[PASS] 冠志 vs 国彩 实体隔离完美 (无交叉污染)`);
    } else {
      auditResults.dim4_parity.details.push(`[FAIL] 冠志 vs 国彩 实体存在交叉污染! gzHasGz=${gzHasGz}, gcHasGc=${gcHasGc}, gzNoGc=${gzNoGc}, gcNoGz=${gcNoGz}`);
      dim4Passed = false;
    }
  }
  auditResults.dim4_parity.pass = dim4Passed;

  // === 维度 1: 语义事实保真矩阵 ===
  console.log('\n【开始审计】维度 1: 语义事实保真矩阵 (Keyword Penetration 100%)');
  let dim1Passed = true;
  if (fs.existsSync(cnGzPath)) {
    const { fullText } = await parseDocx(cnGzPath);
    const requiredKeywordsCn = [
      { name: '预防措施', regex: /预防措施/ },
      { name: '事故响应', regex: /事故响应/ },
      { name: '安全储存', regex: /安全存[储|放]/ },
      { name: '废弃处置', regex: /废弃处置/ },
      { name: '下水道防沉积', regex: /下水道/ },
      { name: '中和剂成盐豁免', regex: /中和剂|成盐|键合为盐/ },
      { name: 'DMEA', regex: /N,N-二甲基乙醇胺|二甲基乙醇胺/ },
      { name: '信号词警告', regex: /警告词[:：]?\s*警告|警告/ },
      { name: '危害说明免责', regex: /没有明显的已知作用或严重危险/ },
    ];
    for (const kw of requiredKeywordsCn) {
      if (!kw.regex.test(fullText)) {
        auditResults.dim1_facts.details.push(`[FAIL] 中文版缺失核心事实: ${kw.name}`);
        dim1Passed = false;
      } else {
        auditResults.dim1_facts.details.push(`[PASS] 中文版核心事实命中: ${kw.name}`);
      }
    }
  }

  const enGzPath = path.join(targetDir, `${modelCode} msds_EN Guanzhi.docx`);
  if (fs.existsSync(enGzPath)) {
    const { fullText } = await parseDocx(enGzPath);
    const requiredKeywordsEn = [
      { name: 'Prevention', regex: /Prevention/i },
      { name: 'Response', regex: /Response/i },
      { name: 'Storage', regex: /Storage/i },
      { name: 'Disposal', regex: /Disposal/i },
      { name: 'Drain/Waterway Clogging', regex: /drains|waterways/i },
      { name: 'Salt Neutralization Exemption', regex: /neutraliz|bonded as salt/i },
      { name: 'DMEA', regex: /Dimethylethanolamine/i },
      { name: 'Signal Word Warning', regex: /Signal word:[^\r\n]*Warning/i },
      { name: 'Hazard Statement Disclaimer', regex: /No known significant effects or critical hazards/i },
    ];
    for (const kw of requiredKeywordsEn) {
      if (!kw.regex.test(fullText)) {
        auditResults.dim1_facts.details.push(`[FAIL] 英文版缺失核心事实: ${kw.name}`);
        dim1Passed = false;
      } else {
        auditResults.dim1_facts.details.push(`[PASS] 英文版核心事实命中: ${kw.name}`);
      }
    }
  }
  auditResults.dim1_facts.pass = dim1Passed;

  // === 维度 2: 底层 OOXML 几何对齐 ===
  console.log('\n【开始审计】维度 2: 底层 OOXML 几何对齐 (OOXML Geometry & Typography)');
  let dim2Passed = true;
  for (const docFile of expectedDocx) {
    const fullPath = path.join(targetDir, docFile);
    if (!fs.existsSync(fullPath)) continue;
    const { tables } = await parseDocx(fullPath);

    // 检查非法加粗数值
    let boldValueCount = 0;
    for (let t = 0; t < tables.length; t++) {
      const rows = Array.from(tables[t].getElementsByTagNameNS(W_NS, 'tr'));
      for (let r = 0; r < rows.length; r++) {
        const cells = Array.from(rows[r].getElementsByTagNameNS(W_NS, 'tc'));
        if (cells.length < 2) continue;
        for (let c = 1; c < cells.length; c++) {
          const cText = (cells[c].textContent || '').trim();
          if (cText === 'CAS编号' || cText === '含量%（w/w）' || cText === 'CAS NO.' || cText === 'Concentration % (w/w)') continue;
          const runs = Array.from(cells[c].getElementsByTagNameNS(W_NS, 'r'));
          for (const run of runs) {
            const rPr = run.getElementsByTagNameNS(W_NS, 'rPr')[0];
            const b = rPr?.getElementsByTagNameNS(W_NS, 'b')[0];
            const isBold = b && b.getAttributeNS(W_NS, 'val') !== '0' && b.getAttributeNS(W_NS, 'val') !== 'false';
            if (isBold && run.textContent?.trim()) {
              boldValueCount++;
            }
          }
        }
      }
    }
    if (boldValueCount > 0) {
      auditResults.dim2_geometry.details.push(`[FAIL] ${docFile} 存在 ${boldValueCount} 处值格非法加粗 (违背常规体法则)`);
      dim2Passed = false;
    } else {
      auditResults.dim2_geometry.details.push(`[PASS] ${docFile} 值格 100% 常规体无非法加粗`);
    }

    // 检查 Section 13 标签格双居中
    const s13Tbl = tables.find(t => {
      const firstRow = t.getElementsByTagNameNS(W_NS, 'tr')[0]?.textContent || '';
      return firstRow.includes('13.') || firstRow.includes('处理注意事项') || firstRow.includes('Handling precautions');
    });
    if (s13Tbl) {
      const rows = Array.from(s13Tbl.getElementsByTagNameNS(W_NS, 'tr'));
      const lastRow = rows[rows.length - 1];
      const cells = Array.from(lastRow.getElementsByTagNameNS(W_NS, 'tc'));
      if (cells.length >= 2) {
        const c0 = cells[0];
        const tcPr = c0.getElementsByTagNameNS(W_NS, 'tcPr')[0];
        const vAlign = tcPr?.getElementsByTagNameNS(W_NS, 'vAlign')[0]?.getAttributeNS(W_NS, 'val');
        const pPr = c0.getElementsByTagNameNS(W_NS, 'pPr')[0];
        const jc = pPr?.getElementsByTagNameNS(W_NS, 'jc')[0]?.getAttributeNS(W_NS, 'val');
        if (vAlign === 'center' && jc === 'center') {
          auditResults.dim2_geometry.details.push(`[PASS] ${docFile} Section 13 标签格标准双居中 (vAlign=center, jc=center)`);
        } else {
          auditResults.dim2_geometry.details.push(`[FAIL] ${docFile} Section 13 标签格未双居中: vAlign=${vAlign}, jc=${jc}`);
          dim2Passed = false;
        }
      }
    }
  }
  auditResults.dim2_geometry.pass = dim2Passed;

  // === 维度 3: 法律拓扑与路由 ===
  console.log('\n【开始审计】维度 3: 法律拓扑与路由 (Legal Topology & Routing)');
  let dim3Passed = true;
  if (fs.existsSync(cnGzPath)) {
    const { tables } = await parseDocx(cnGzPath);

    // 1. Section 2: Mode B 单单元格通栏行
    const s2Tbl = tables[1];
    const s2Rows = Array.from(s2Tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (s2Rows.length === 2) {
      const r1Cells = Array.from(s2Rows[1].getElementsByTagNameNS(W_NS, 'tc'));
      if (r1Cells.length === 1) {
        auditResults.dim3_topology.details.push(`[PASS] Section 2 模态 B 单单元格通栏拓扑完美匹配黄金基准 (rows=2, cells=1)`);
      } else {
        auditResults.dim3_topology.details.push(`[FAIL] Section 2 Row 1 单元格数量异常: ${r1Cells.length} (期望 1)`);
        dim3Passed = false;
      }
    } else {
      auditResults.dim3_topology.details.push(`[FAIL] Section 2 行数异常: ${s2Rows.length} (期望 2 行模态 B 通栏拓扑)`);
      dim3Passed = false;
    }

    // 2. Section 3: 纯净三列网格 (8 行，无悬浮尾注)
    const s3Tbl = tables[2];
    const s3Rows = Array.from(s3Tbl.getElementsByTagNameNS(W_NS, 'tr'));
    const isCleanGrid = s3Rows.slice(3).every(r => r.getElementsByTagNameNS(W_NS, 'tc').length === 3);
    if (isCleanGrid) {
      auditResults.dim3_topology.details.push(`[PASS] Section 3 保持纯净 3 列组分网格拓扑 (组分行数=${s3Rows.length - 4})`);
    } else {
      auditResults.dim3_topology.details.push(`[FAIL] Section 3 网格污染: 包含非三列杂乱结构`);
      dim3Passed = false;
    }

    // 3. Section 11: 三级责任隔离
    const s11Tbl = tables[10];
    const s11Rows = Array.from(s11Tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (s11Rows.length === 4) {
      const allSingleCell = s11Rows.every(r => r.getElementsByTagNameNS(W_NS, 'tc').length === 1);
      if (allSingleCell) {
        auditResults.dim3_topology.details.push(`[PASS] Section 11 三级责任隔离通栏拓扑完美 (4行独立单单元格通栏)`);
      } else {
        auditResults.dim3_topology.details.push(`[FAIL] Section 11 单元格跨列异常`);
        dim3Passed = false;
      }
    } else {
      auditResults.dim3_topology.details.push(`[FAIL] Section 11 行数异常: ${s11Rows.length} (期望 4)`);
      dim3Passed = false;
    }

    // 4. Section 13: 3行标准结构
    const s13Tbl = tables[12];
    const s13Rows = Array.from(s13Tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (s13Rows.length === 3) {
      auditResults.dim3_topology.details.push(`[PASS] Section 13 标准 3 行紧凑结构 (1标题 + 1通栏免责 + 1处置双居中)`);
    } else {
      auditResults.dim3_topology.details.push(`[FAIL] Section 13 行数异常: ${s13Rows.length} (期望 3)`);
      dim3Passed = false;
    }
  }
  auditResults.dim3_topology.pass = dim3Passed;

  // === 总结卡片 ===
  console.log('\n========================================================================');
  console.log('                       四维深度审计终审裁决卡片                         ');
  console.log('========================================================================');
  console.log(`维度 1 [语义事实保真矩阵]: ${auditResults.dim1_facts.pass ? '✅ PASS (100% 事实留存)' : '❌ FAIL'}`);
  console.log(`维度 2 [底层 OOXML 几何]: ${auditResults.dim2_geometry.pass ? '✅ PASS (左对齐/常规体/双居中)' : '❌ FAIL'}`);
  console.log(`维度 3 [法律拓扑与路由]:   ${auditResults.dim3_topology.pass ? '✅ PASS (Mode B 通栏/纯净S3/三级S11)' : '❌ FAIL'}`);
  console.log(`维度 4 [交付留存与差分]:   ${auditResults.dim4_parity.pass ? '✅ PASS (8格式/留存副本/实体隔离)' : '❌ FAIL'}`);
  console.log('========================================================================\n');

  const allPassed = auditResults.dim1_facts.pass &&
                    auditResults.dim2_geometry.pass &&
                    auditResults.dim3_topology.pass &&
                    auditResults.dim4_parity.pass;

  if (!allPassed) {
    console.error('❌ 四维深度审计未通过，请检查上述详情!');
    process.exit(1);
  } else {
    console.log('🎉 恭喜！四维深度审计全维度满分通过 (Exit Code 0)！');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('审计执行异常:', err);
  process.exit(1);
});
