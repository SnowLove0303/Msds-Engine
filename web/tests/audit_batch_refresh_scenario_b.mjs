import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { SCENARIO_B_MODELS } from './batch_refresh_scenario_b.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const TARGET_BASE = path.resolve(REPO_ROOT, '算法训练材料/TDS MSDS 重写版');
const PYTHON_SCRIPT = path.resolve(__dirname, 'verify_pdf_coords.py');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

async function auditDocxFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const parser = new DOMParser();

  const footer1File = zip.file('word/footer1.xml');
  if (!footer1File) {
    return { ok: false, issues: ['缺少核心页脚文件 word/footer1.xml'] };
  }

  const issues = [];
  const fname = path.basename(filePath);
  const isGuocai = /国彩|Guocai/i.test(fname);
  const isEn = /_EN_|EN\b/i.test(fname);

  const xml = await footer1File.async('text');
  const doc = parser.parseFromString(xml, 'application/xml');

  // 1. 检查是否存在 "P修订日期"
  if (/P\s*修订日期/i.test(xml)) {
    issues.push('发现 "P修订日期" 残留于 word/footer1.xml');
  }

  // 2. 检查是否存在 \u2005 窄空格
  if (/\u2005/.test(xml)) {
    issues.push('发现 异形窄空格 (\\u2005) 残留于 word/footer1.xml');
  }

  // 3. 检查国彩主体名称与废弃名称
  if (isGuocai) {
    if (isEn) {
      if (!xml.includes('Yingde Guocai Fine Chemical Co., Ltd.')) {
        issues.push('英文国彩页脚未包含权威名称: Yingde Guocai Fine Chemical Co., Ltd.');
      }
      if (xml.includes('Yingde Guocai New Material Co., Ltd.')) {
        issues.push('英文国彩页脚仍包含废弃旧称: Yingde Guocai New Material Co., Ltd.');
      }
    } else {
      if (!xml.includes('英德市国彩精细化工有限公司')) {
        issues.push('中文国彩页脚未包含权威名称: 英德市国彩精细化工有限公司');
      }
      if (xml.includes('英德市国彩新材料有限公司')) {
        issues.push('中文国彩页脚仍包含废弃旧称: 英德市国彩新材料有限公司');
      }
    }
  }

  // 4. 检查表格内结构与对齐
  const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  if (tbls.length === 0) {
    issues.push('页脚中未找到布局表格');
  } else {
    const tbl = tbls[0];
    const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    if (rows.length >= 1) {
      const cells0 = Array.from(rows[0].getElementsByTagNameNS(W_NS, 'tc'));
      if (cells0.length >= 2) {
        const c1VAlign = cells0[1].getElementsByTagNameNS(W_NS, 'tcPr')?.[0]
          ?.getElementsByTagNameNS(W_NS, 'vAlign')?.[0]?.getAttributeNS(W_NS, 'val');
        if (c1VAlign !== 'center') {
          issues.push(`页脚第 0 行右侧修订日期单元格未设置 w:vAlign="center" (当前: ${c1VAlign})`);
        }
      }
    }

    // 检查第 1 行页码字号是否为 9pt (18 半磅)，绝不允许 12pt (24 半磅)
    if (rows.length >= 2) {
      const cells1 = Array.from(rows[1].getElementsByTagNameNS(W_NS, 'tc'));
      const pageCell = cells1[cells1.length - 1];
      const pageRuns = Array.from(pageCell.getElementsByTagNameNS(W_NS, 'r'));
      for (const r of pageRuns) {
        const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')?.[0];
        const szVal = rPr?.getElementsByTagNameNS(W_NS, 'sz')?.[0]?.getAttributeNS(W_NS, 'val');
        if (szVal === '24') {
          issues.push(`页脚页码单元格检测到 12pt (val="24") 异常放大 Run: "${r.textContent || ''}"`);
        }
      }
    }
  }

  // 全文检查废弃旧称
  const documentXml = await zip.file('word/document.xml')?.async('text') || '';
  if (documentXml.includes('英德市国彩新材料有限公司')) {
    issues.push('正文 word/document.xml 中包含废弃旧称: 英德市国彩新材料有限公司');
  }
  if (documentXml.includes('Yingde Guocai New Material Co., Ltd.')) {
    issues.push('正文 word/document.xml 中包含废弃旧称: Yingde Guocai New Material Co., Ltd.');
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

function auditPdfFile(filePath) {
  try {
    const cmd = `python "${PYTHON_SCRIPT}" "${filePath}"`;
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, output: out.trim() };
  } catch (err) {
    return { ok: false, error: err.stderr || err.stdout || err.message };
  }
}

async function auditModel(modelInfo) {
  const modelDir = path.join(TARGET_BASE, modelInfo.cat, modelInfo.name);
  if (!fs.existsSync(modelDir)) {
    return { model: modelInfo.name, ok: false, error: `目标目录不存在: ${modelDir}` };
  }

  const filesInDir = fs.readdirSync(modelDir);

  // 自适应大小写模糊定位 8 份交付物
  function resolveDeliverable(pattern) {
    return filesInDir.find(f => pattern.test(f) && !f.includes('~$') && !f.includes('源文件留存'));
  }

  const expectedDeliverables = [
    { pattern: /msds.*CN.*冠志.*\.docx$/i, name: 'CN 冠志 DOCX', type: 'docx' },
    { pattern: /msds.*CN.*冠志.*\.pdf$/i, name: 'CN 冠志 PDF', type: 'pdf' },
    { pattern: /msds.*CN.*国彩.*\.docx$/i, name: 'CN 国彩 DOCX', type: 'docx' },
    { pattern: /msds.*CN.*国彩.*\.pdf$/i, name: 'CN 国彩 PDF', type: 'pdf' },
    { pattern: /msds.*EN.*Guanzhi.*\.docx$/i, name: 'EN Guanzhi DOCX', type: 'docx' },
    { pattern: /msds.*EN.*Guanzhi.*\.pdf$/i, name: 'EN Guanzhi PDF', type: 'pdf' },
    { pattern: /msds.*EN.*Guocai.*\.docx$/i, name: 'EN Guocai DOCX', type: 'docx' },
    { pattern: /msds.*EN.*Guocai.*\.pdf$/i, name: 'EN Guocai PDF', type: 'pdf' }
  ];

  const results = [];
  let modelOk = true;

  for (const deliv of expectedDeliverables) {
    const matchedName = resolveDeliverable(deliv.pattern);
    if (!matchedName) {
      results.push({ file: deliv.name, ok: false, error: '文件物理缺失' });
      modelOk = false;
      continue;
    }

    const fullPath = path.join(modelDir, matchedName);
    const stat = fs.statSync(fullPath);
    if (stat.size < 20000) {
      results.push({ file: matchedName, ok: false, error: `文件体积过小 (${stat.size} 字节)` });
      modelOk = false;
      continue;
    }

    if (deliv.type === 'docx') {
      const docxRes = await auditDocxFile(fullPath);
      if (!docxRes.ok) {
        modelOk = false;
        results.push({ file: matchedName, ok: false, issues: docxRes.issues });
      } else {
        results.push({ file: matchedName, ok: true, size: stat.size });
      }
    } else if (deliv.type === 'pdf') {
      const pdfRes = auditPdfFile(fullPath);
      if (!pdfRes.ok) {
        modelOk = false;
        results.push({ file: matchedName, ok: false, error: pdfRes.error });
      } else {
        results.push({ file: matchedName, ok: true, size: stat.size });
      }
    }
  }

  return {
    model: modelInfo.name,
    cat: modelInfo.cat,
    ok: modelOk,
    deliverables: results
  };
}

async function main() {
  console.log(`========================================================================`);
  console.log(`       场景B 22款产品 176份交付物法医全检与物理核销中枢 (Full Audit)       `);
  console.log(`========================================================================\n`);

  const args = process.argv.slice(2);
  let filterModel = null;
  let filterCat = null;
  for (const arg of args) {
    if (arg.startsWith('--model=')) filterModel = arg.split('=', 2)[1];
    if (arg.startsWith('--cat=')) filterCat = arg.split('=', 2)[1];
  }

  let list = SCENARIO_B_MODELS;
  if (filterModel) {
    list = list.filter(m => m.name.toLowerCase() === filterModel.toLowerCase());
  } else if (filterCat) {
    list = list.filter(m => m.cat.includes(filterCat));
  }

  let totalFilesChecked = 0;
  let totalFilesPassed = 0;
  const failures = [];

  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] 法医审计型号 ${m.name}... `);
    const res = await auditModel(m);
    const passed = res.deliverables.filter(d => d.ok).length;
    const total = res.deliverables.length;
    totalFilesChecked += total;
    totalFilesPassed += passed;

    if (res.ok) {
      console.log(`✅ 100% PASS (${passed}/${total} 交付物全绿)`);
    } else {
      console.log(`❌ FAIL (${passed}/${total} 交付物通过)`);
      failures.push(res);
    }
  }

  console.log(`\n========================================================================`);
  console.log(`                     法医全检核销清算总表                              `);
  console.log(`========================================================================`);
  console.log(`受检产品型号数: ${list.length}`);
  console.log(`受检交付物总数: ${totalFilesChecked} (DOCX + PDF)`);
  console.log(`100% 合规通过数: ${totalFilesPassed} / ${totalFilesChecked} (${(totalFilesPassed / totalFilesChecked * 100).toFixed(1)}%)`);
  console.log(`失败型号数: ${failures.length}`);
  console.log(`========================================================================\n`);

  if (failures.length > 0) {
    console.error('❌ 存在未通过法医审计的交付物:');
    for (const f of failures) {
      console.error(`  - 型号: ${f.model} (${f.cat})`);
      for (const d of f.deliverables.filter(x => !x.ok)) {
        console.error(`    • 文件: ${d.file}: ${d.error || JSON.stringify(d.issues)}`);
      }
    }
    process.exit(1);
  } else {
    console.log('🎉 恭喜！受检交付物法医全检全部通过 (ExitCode 0)！');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
}
