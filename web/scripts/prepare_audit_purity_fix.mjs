import fs from 'fs';

const auditPath = 'scripts/audit_bipolar_bilayer.mjs';
let code = fs.readFileSync(auditPath, 'utf8');

const isCrlf = code.includes('\r\n');
const normalizedCode = code.replace(/\r\n/g, '\n');

const targetOld = `  const dirFiles = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
  assert(dirFiles.length === 8, \`交付目录纯净门禁 (G-01 Purity): 目录内物理文件总数严格等于 8 (实测: \${dirFiles.length} 个)\`);
  if (dirFiles.length !== 8) {
    console.error(\`     ↳ 目录实际文件列表: \\n        - \${dirFiles.join('\\n        - ')}\`);
  }`;

const targetNew = `  const dirFiles = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
  const msdsDeliverables = dirFiles.filter(f => /msds_/i.test(f));
  const tdsDeliverables = dirFiles.filter(f => /tds_/i.test(f));
  const junkFiles = dirFiles.filter(f => !/msds_|tds_/i.test(f));

  assert(msdsDeliverables.length === 8, \`交付目录 MSDS 完备门禁 (G-01 Purity): 目录内 MSDS 正式交付物严格等于 8 (实测: \${msdsDeliverables.length} 个)\`);
  if (tdsDeliverables.length > 0) {
    assert(tdsDeliverables.length === 8, \`交付目录 TDS 完备门禁 (G-01 Purity): 目录内 TDS 正式交付物严格等于 8 (实测: \${tdsDeliverables.length} 个)\`);
  }
  assert(junkFiles.length === 0, \`交付目录零临时碎片门禁 (G-01 Purity): 严禁任何非标准交付物碎片 (实测杂件: \${junkFiles.length} 个)\`);
  if (junkFiles.length > 0) {
    console.error(\`     ↳ 目录杂件列表: \\n        - \${junkFiles.join('\\n        - ')}\`);
  }`;

if (!normalizedCode.includes(targetOld)) {
  throw new Error('未找到 targetOld 块');
}

let replaced = normalizedCode.replace(targetOld, targetNew);
if (isCrlf) replaced = replaced.replace(/\n/g, '\r\n');

fs.writeFileSync('scripts/audit_bipolar_bilayer.mjs.proposed', replaced);
console.log('Successfully prepared audit_bipolar_bilayer.mjs.proposed!');

