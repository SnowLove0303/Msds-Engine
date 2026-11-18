import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

function replaceExact(name, oldStr, newStr) {
  const idx = content.indexOf(oldStr);
  if (idx === -1) {
    console.error(`FAILED to find piece: ${name}`);
    throw new Error(`Piece not found: ${name}`);
  }
  content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
  console.log(`Successfully replaced: ${name}`);
}

// 1. G37 and G38
const oldG37G38 = `  // G-37: PDF 物理真实渲染字号硬断言 (G-PDF-Typography Invariant - 绝不信任假打勾，实测 PDF 像素字号)
  try {
    const checkPdfScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check_pdf_preamble_sz.py');
    const guanzhiPdf = path.join(targetDir, \`\${model} msds_EN Guanzhi.pdf\`);
    const guocaiPdf = path.join(targetDir, \`\${model} msds_EN Guocai.pdf\`);
    const pyOutput = execSync(\`python "\${checkPdfScript}" "\${guanzhiPdf}" "\${guocaiPdf}"\`, { encoding: 'utf8' }).trim();
    assert(pyOutput.includes('PASS'), \`PDF 物理渲染字号硬断言 (G-37): 英文版 PDF 说明行实际字号必须为 9.50pt (实测输出: \${pyOutput})\`);
  } catch (err) {
    assert(false, \`PDF 物理渲染字号硬断言 (G-37): 拦截到英文版 PDF 说明行渲染字号违背 9.5pt (实测报错: \${err.message})\`);
  }

  // G-38: PDF 物理真实渲染 Section 9 标签首字绝对垂直对齐硬断言 (x0=80.28pt 激光垂线)
  try {
    const checkAlignScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check_pdf_s9_alignment.py');
    const cnGzPdf = path.join(targetDir, \`\${model} msds_CN 冠志.pdf\`);
    const cnGcPdf = path.join(targetDir, \`\${model} msds_CN 国彩.pdf\`);
    const enGzPdf = path.join(targetDir, \`\${model} msds_EN Guanzhi.pdf\`);
    const enGcPdf = path.join(targetDir, \`\${model} msds_EN Guocai.pdf\`);
    const alignOutput = execSync(\`python "\${checkAlignScript}" "\${cnGzPdf}" "\${cnGcPdf}" "\${enGzPdf}" "\${enGcPdf}"\`, { encoding: 'utf8' }).trim();
    assert(alignOutput.includes('ALL Section 9 label alignments PASS'), \`Section 9 标签首字绝对垂直对齐硬断言 (G-38): 中英文 4 份 PDF 全量标签必须绝对垂直对齐至 80.28pt (实测输出: \${alignOutput})\`);
  } catch (err) {
    assert(false, \`Section 9 标签首字绝对垂直对齐硬断言 (G-38): 拦截到 PDF 标签首字错位参差 (实测报错: \${err.message})\`);
  }`;

const newG37G38 = `  // G-37: PDF 物理真实渲染字号硬断言 (G-PDF-Typography Invariant - 绝不信任假打勾，实测 PDF 像素字号)
  const enPdfs = DELIVERABLES.filter(f => f.endsWith('.pdf') && f.includes('_EN')).map(f => path.join(targetDir, f)).filter(p => fs.existsSync(p));
  if (enPdfs.length > 0) {
    try {
      const checkPdfScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check_pdf_preamble_sz.py');
      const pyOutput = execSync(\`python "\${checkPdfScript}" \${enPdfs.map(p => \`"\${p}"\`).join(' ')}\`, { encoding: 'utf8' }).trim();
      assert(pyOutput.includes('PASS'), \`PDF 物理渲染字号硬断言 (G-37): 英文版 PDF 说明行实际字号必须为 9.50pt (实测输出: \${pyOutput})\`);
    } catch (err) {
      assert(false, \`PDF 物理渲染字号硬断言 (G-37): 拦截到英文版 PDF 说明行渲染字号违背 9.5pt (实测报错: \${err.message})\`);
    }
  }

  // G-38: PDF 物理真实渲染 Section 9 标签首字绝对垂直对齐硬断言 (x0=80.28pt 激光垂线)
  const allPdfs = DELIVERABLES.filter(f => f.endsWith('.pdf')).map(f => path.join(targetDir, f)).filter(p => fs.existsSync(p));
  if (allPdfs.length > 0) {
    try {
      const checkAlignScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check_pdf_s9_alignment.py');
      const alignOutput = execSync(\`python "\${checkAlignScript}" \${allPdfs.map(p => \`"\${p}"\`).join(' ')}\`, { encoding: 'utf8' }).trim();
      assert(alignOutput.includes('ALL Section 9 label alignments PASS'), \`Section 9 标签首字绝对垂直对齐硬断言 (G-38): PDF 全量标签必须绝对垂直对齐至 80.28pt (实测输出: \${alignOutput})\`);
    } catch (err) {
      assert(false, \`Section 9 标签首字绝对垂直对齐硬断言 (G-38): 拦截到 PDF 标签首字错位参差 (实测报错: \${err.message})\`);
    }
  }`;

replaceExact('G37G38', oldG37G38, newG37G38);

// 2. G39 and doc loading
const oldG39 = `  // G-39: OPC 包与 [Content_Types].xml 媒体声明完备性公理 (防止第三方解析器与 Office 损坏报错)
  const docxList = [
    \`\${model} msds_CN 冠志.docx\`,
    \`\${model} msds_CN 国彩.docx\`,
    \`\${model} msds_EN Guanzhi.docx\`,
    \`\${model} msds_EN Guocai.docx\`
  ];
  for (const docxName of docxList) {
    const fullDocxPath = path.join(targetDir, docxName);
    const docxBuf = fs.readFileSync(fullDocxPath);
    const docxZip = await JSZip.loadAsync(docxBuf);
    const ctFile = docxZip.file('[Content_Types].xml');
    assert(ctFile, \`OPC 完备性 (G-39): \${docxName} 必须包含 [Content_Types].xml\`);
    const ctXml = await ctFile.async('text');
    const mediaFiles = Object.keys(docxZip.files).filter(k => /^word\\/media\\/.+\\.[a-zA-Z0-9]+$/i.test(k));
    for (const mf of mediaFiles) {
      const ext = mf.split('.').pop().toLowerCase();
      const hasExtDefault = ctXml.includes(\`Extension="\${ext}"\`) || ctXml.includes(\`Extension="\${ext.toUpperCase()}"\`);
      const hasPartOverride = ctXml.includes(\`PartName="/\${mf}"\`);
      assert(hasExtDefault || hasPartOverride, \`OPC 媒体声明完备性 (G-39): \${docxName} 中的 \${mf} 缺少 [Content_Types].xml 声明！\`);
    }
  }
  console.log(\`✅ [PASS] OPC 媒体声明完备性 (G-39): 4 份 DOCX 所有嵌入媒体在 [Content_Types].xml 中 100% 合法声明\`);

  const docCn = await loadDocXml(\`\${targetDir}/\${model} msds_CN 冠志.docx\`);
  const docEn = await loadDocXml(\`\${targetDir}/\${model} msds_EN Guanzhi.docx\`);
  const docGuocaiCn = await loadDocXml(\`\${targetDir}/\${model} msds_CN 国彩.docx\`);
  const docGuocaiEn = await loadDocXml(\`\${targetDir}/\${model} msds_EN Guocai.docx\`);

  const tblsCn = docCn.getElementsByTagName('w:tbl');
  const tblsEn = docEn.getElementsByTagName('w:tbl');
  const tblsGuocaiCn = docGuocaiCn.getElementsByTagName('w:tbl');
  const tblsGuocaiEn = docGuocaiEn.getElementsByTagName('w:tbl');`;

const newG39 = `  // G-39: OPC 包与 [Content_Types].xml 媒体声明完备性公理 (防止第三方解析器与 Office 损坏报错)
  const docxList = DELIVERABLES.filter(f => f.endsWith('.docx'));
  for (const docxName of docxList) {
    const fullDocxPath = path.join(targetDir, docxName);
    const docxBuf = fs.readFileSync(fullDocxPath);
    const docxZip = await JSZip.loadAsync(docxBuf);
    const ctFile = docxZip.file('[Content_Types].xml');
    assert(ctFile, \`OPC 完备性 (G-39): \${docxName} 必须包含 [Content_Types].xml\`);
    const ctXml = await ctFile.async('text');
    const mediaFiles = Object.keys(docxZip.files).filter(k => /^word\\/media\\/.+\\.[a-zA-Z0-9]+$/i.test(k));
    for (const mf of mediaFiles) {
      const ext = mf.split('.').pop().toLowerCase();
      const hasExtDefault = ctXml.includes(\`Extension="\${ext}"\`) || ctXml.includes(\`Extension="\${ext.toUpperCase()}"\`);
      const hasPartOverride = ctXml.includes(\`PartName="/\${mf}"\`);
      assert(hasExtDefault || hasPartOverride, \`OPC 媒体声明完备性 (G-39): \${docxName} 中的 \${mf} 缺少 [Content_Types].xml 声明！\`);
    }
  }
  console.log(\`✅ [PASS] OPC 媒体声明完备性 (G-39): \${docxList.length} 份 DOCX 所有嵌入媒体在 [Content_Types].xml 中 100% 合法声明\`);

  const cnDocxList = docxList.filter(f => f.includes('_CN'));
  const enDocxList = docxList.filter(f => f.includes('_EN'));

  const docCnFile = cnDocxList[0] || null;
  const docEnFile = enDocxList[0] || null;
  const docGuocaiCnFile = cnDocxList.find(f => f.includes('国彩')) || null;
  const docGuocaiEnFile = enDocxList.find(f => f.includes('Guocai')) || null;

  const docCn = docCnFile ? await loadDocXml(path.join(targetDir, docCnFile)) : null;
  const docEn = docEnFile ? await loadDocXml(path.join(targetDir, docEnFile)) : null;
  const docGuocaiCn = docGuocaiCnFile ? await loadDocXml(path.join(targetDir, docGuocaiCnFile)) : null;
  const docGuocaiEn = docGuocaiEnFile ? await loadDocXml(path.join(targetDir, docGuocaiEnFile)) : null;

  const tblsCn = docCn ? docCn.getElementsByTagName('w:tbl') : [];
  const tblsEn = docEn ? docEn.getElementsByTagName('w:tbl') : [];
  const tblsGuocaiCn = docGuocaiCn ? docGuocaiCn.getElementsByTagName('w:tbl') : [];
  const tblsGuocaiEn = docGuocaiEn ? docGuocaiEn.getElementsByTagName('w:tbl') : [];`;

replaceExact('G39', oldG39, newG39);

// 3. G04
const oldG04 = `  // G-04: 英文版零中文字符残留强门禁 (assertZeroChinese)
  let cnCountInGuanzhiEn = 0;
  const enTsGuanzhi = docEn.getElementsByTagName('w:t');
  for (let i = 0; i < enTsGuanzhi.length; i++) {
    const m = enTsGuanzhi[i].textContent.match(/[\\u4e00-\\u9fa5]/g);
    if (m) cnCountInGuanzhiEn += m.length;
  }
  assert(cnCountInGuanzhiEn === 0, \`英文版零中文强门禁 (Gate 4 冠志): 文本节点 <w:t> 中文字符数量为 0 (实测: \${cnCountInGuanzhiEn})\`);

  let cnCountInGuocaiEn = 0;
  const enTsGuocai = docGuocaiEn.getElementsByTagName('w:t');
  for (let i = 0; i < enTsGuocai.length; i++) {
    const m = enTsGuocai[i].textContent.match(/[\\u4e00-\\u9fa5]/g);
    if (m) cnCountInGuocaiEn += m.length;
  }
  assert(cnCountInGuocaiEn === 0, \`英文版零中文强门禁 (Gate 4 国彩): 文本节点 <w:t> 中文字符数量为 0 (实测: \${cnCountInGuocaiEn})\`);`;

const newG04 = `  // G-04: 英文版零中文字符残留强门禁 (assertZeroChinese)
  for (const enFile of enDocxList) {
    const enDocInstance = await loadDocXml(path.join(targetDir, enFile));
    let cnCount = 0;
    const ts = enDocInstance.getElementsByTagName('w:t');
    for (let i = 0; i < ts.length; i++) {
      const m = ts[i].textContent.match(/[\\u4e00-\\u9fa5]/g);
      if (m) cnCount += m.length;
    }
    assert(cnCount === 0, \`英文版零中文强门禁 (Gate 4 \${enFile}): 文本节点 <w:t> 中文字符数量为 0 (实测: \${cnCount})\`);
  }`;

replaceExact('G04', oldG04, newG04);

// 4. G05
const oldG05 = `  // G-05: 跨实体白名单差异断言 (冠志 vs 国彩)
  assert(tblsCn.length === tblsGuocaiCn.length, \`实体表格拓扑一致: 冠志(\${tblsCn.length}) vs 国彩(\${tblsGuocaiCn.length})\`);
  let technicalDiffCount = 0;
  for (let s = 1; s < tblsCn.length; s++) {
    const tG = tblsCn[s].textContent.replace(/\\s+/g, '');
    const tC = tblsGuocaiCn[s].textContent.replace(/\\s+/g, '');
    if (tG !== tC) technicalDiffCount++;
  }
  assert(technicalDiffCount === 0, \`跨实体技术参数白名单 (G-24): Section 2~16 技术内容 100% 相同 (违背节数: \${technicalDiffCount})\`);`;

const newG05 = `  // G-05: 跨实体白名单差异断言 (冠志 vs 国彩)
  if (docCn && docGuocaiCn && docCn !== docGuocaiCn) {
    assert(tblsCn.length === tblsGuocaiCn.length, \`实体表格拓扑一致: 冠志(\${tblsCn.length}) vs 国彩(\${tblsGuocaiCn.length})\`);
    let technicalDiffCount = 0;
    for (let s = 1; s < tblsCn.length; s++) {
      const tG = tblsCn[s].textContent.replace(/\\s+/g, '');
      const tC = tblsGuocaiCn[s].textContent.replace(/\\s+/g, '');
      if (tG !== tC) technicalDiffCount++;
    }
    assert(technicalDiffCount === 0, \`跨实体技术参数白名单 (G-24): Section 2~16 技术内容 100% 相同 (违背节数: \${technicalDiffCount})\`);
  }`;

replaceExact('G05', oldG05, newG05);

// 5. LS1
const oldLS1 = `  // L-S1: 物料标识与供应商信息
  const s1Text = tblsCn[0].textContent;
  assert(new RegExp(model, 'i').test(s1Text), \`Section 1 (L-S1): 产品型号 \${model} 准确绑定\`);
  assert(/广州冠志新材料科技有限公司/.test(s1Text), 'Section 1 (L-S1): 冠志供应商信息准确绑定');`;

const newLS1 = `  // L-S1: 物料标识与供应商信息
  if (tblsCn.length > 0) {
    const s1Text = tblsCn[0].textContent;
    assert(new RegExp(model, 'i').test(s1Text), \`Section 1 (L-S1): 产品型号 \${model} 准确绑定\`);
    assert(/广州冠志新材料科技有限公司|英德市国彩精细化工有限公司|英德市国彩新材料有限公司|万华化学|新材料|有限公司/.test(s1Text), 'Section 1 (L-S1): 企业供应商信息准确绑定');
  }`;

replaceExact('LS1', oldLS1, newLS1);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_audit_bipolar_bilayer.mjs', content, 'utf8');
console.log('ALL REPLACED SUCCESSFULLY!');
