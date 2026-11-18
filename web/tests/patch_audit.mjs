import fs from 'node:fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_bipolar_bilayer.mjs';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'export async function runBipolarBilayerAudit(customTargetDir = null, customModelCode = null) {',
  'export async function runBipolarBilayerAudit(customTargetDir = null, customModelCode = null, options = {}) {'
);

const oldDeliverablesBlock = `  const DELIVERABLES = [
    \`\${model} msds_CN 冠志.docx\`,
    \`\${model} msds_CN 冠志.pdf\`,
    \`\${model} msds_CN 国彩.docx\`,
    \`\${model} msds_CN 国彩.pdf\`,
    \`\${model} msds_EN Guanzhi.docx\`,
    \`\${model} msds_EN Guanzhi.pdf\`,
    \`\${model} msds_EN Guocai.docx\`,
    \`\${model} msds_EN Guocai.pdf\`,
  ];

  // ----------------------------------------------------------------------
  // 第一层：全局通用规范层 (Global Layer Audit)
  // ----------------------------------------------------------------------
  console.log('>>> [层 1: 全局通用规范层审查]');

  // G-01: 交付目录绝对纯净与 8 格式精准交付断言 (Canonical 8-Deliverables Purity Gate)
  const dirFiles = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
  const msdsFiles = dirFiles.filter(f => /msds_/i.test(f));
  assert(msdsFiles.length === 8, \`交付目录纯净门禁 (G-01 Purity): 目录内 MSDS 正式交付物总数严格等于 8 (实测: \${msdsFiles.length} 个)\`);
  if (msdsFiles.length !== 8) {
    console.error(\`     ↳ 目录实际 MSDS 文件列表: \\n        - \${msdsFiles.join('\\n        - ')}\`);
  }`;

const newDeliverablesBlock = `  const DELIVERABLES = options.expectedDeliverables || [
    \`\${model} msds_CN 冠志.docx\`,
    \`\${model} msds_CN 冠志.pdf\`,
    \`\${model} msds_CN 国彩.docx\`,
    \`\${model} msds_CN 国彩.pdf\`,
    \`\${model} msds_EN Guanzhi.docx\`,
    \`\${model} msds_EN Guanzhi.pdf\`,
    \`\${model} msds_EN Guocai.docx\`,
    \`\${model} msds_EN Guocai.pdf\`,
  ];

  // ----------------------------------------------------------------------
  // 第一层：全局通用规范层 (Global Layer Audit)
  // ----------------------------------------------------------------------
  console.log('>>> [层 1: 全局通用规范层审查]');

  // G-01: 交付目录绝对纯净与自适应精准交付断言 (Adaptive Deliverables Purity Gate)
  const dirFiles = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
  const msdsFiles = dirFiles.filter(f => /msds_/i.test(f));
  assert(msdsFiles.length === DELIVERABLES.length, \`交付目录纯净门禁 (G-01 Purity): 目录内 MSDS 正式交付物总数严格等于 \${DELIVERABLES.length} (实测: \${msdsFiles.length} 个)\`);
  if (msdsFiles.length !== DELIVERABLES.length) {
    console.error(\`     ↳ 目录实际 MSDS 文件列表: \\n        - \${msdsFiles.join('\\n        - ')}\`);
  }`;

if (!content.includes(oldDeliverablesBlock)) {
  throw new Error('oldDeliverablesBlock not found in audit_bipolar_bilayer.mjs');
}

content = content.replace(oldDeliverablesBlock, newDeliverablesBlock);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_audit_bipolar_bilayer.mjs', content, 'utf8');
console.log('Successfully generated proposed_audit_bipolar_bilayer.mjs!');
