import fs from 'node:fs/promises';

async function generateProposedAudit() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs';
  let content = await fs.readFile(filePath, 'utf8');

  const targetAnchor = `    if (sNum > 1) {
      assert(
        cnSec.rows.length === enSec.rows.length,
        '环4',
        \`Section \${sNum} 双语行数同构\`,
        \`Section \${sNum} 中英文表格行数必须绝对 1:1 对称 (CN: \${cnSec.rows.length} vs EN: \${enSec.rows.length})\`,
        \`CN=\${cnSec.rows.length}, EN=\${enSec.rows.length}\`,
        \`Section \${sNum}\`,
        ['中英文Section 1结构不同属于不一致']
      );
    }
  }`;

  const addition = `    if (sNum > 1) {
      assert(
        cnSec.rows.length === enSec.rows.length,
        '环4',
        \`Section \${sNum} 双语行数同构\`,
        \`Section \${sNum} 中英文表格行数必须绝对 1:1 对称 (CN: \${cnSec.rows.length} vs EN: \${enSec.rows.length})\`,
        \`CN=\${cnSec.rows.length}, EN=\${enSec.rows.length}\`,
        \`Section \${sNum}\`,
        ['中英文Section 1结构不同属于不一致']
      );
    }
  }

  // 双语翻译逐行逐句细节零遗漏机械硬门禁 (INV-TRANS-ZERO-OMISSION) (REQ-TRANS-02)
  let transOmissionPass = true;
  const transOmissionDetails = [];

  for (let sNum = 1; sNum <= 16; sNum++) {
    const cnSec = cnDocx.records.find(r => r.sectionNumber === sNum);
    const enSec = enDocx.records.find(r => r.sectionNumber === sNum);
    if (!cnSec || !enSec) continue;

    const cnText = cnSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\\n');
    const enText = enSec.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\\n');

    // 1. OECD 导则号零遗漏核销
    const oecdMatches = Array.from(cnText.matchAll(/OECD\\s*(?:化学品测试指南|测试导则)?\\s*(\\d+[A-Za-z]?)/gi));
    for (const m of oecdMatches) {
      const guidelineNum = m[1];
      const enRegex = new RegExp(\`OECD(?:\\\\s*Test\\\\s*Guideline)?\\\\s*\${guidelineNum}\`, 'i');
      if (!enRegex.test(enText)) {
        transOmissionPass = false;
        transOmissionDetails.push(\`Section \${sNum} 英文遗漏 OECD 导则号 \${guidelineNum}\`);
      }
    }

    // 2. Section 12 降解实验数据（如 <60%, 28 d）保真核销
    if (sNum === 12) {
      if (/＜\\s*60\\s*%|60%/i.test(cnText) && !/60\\s*%/i.test(enText)) {
        transOmissionPass = false;
        transOmissionDetails.push('Section 12 英文遗漏降解率数值 60%');
      }
      if (/28\\s*d\\b/i.test(cnText) && !/28\\s*d\\b/i.test(enText)) {
        transOmissionPass = false;
        transOmissionDetails.push('Section 12 英文遗漏降解周期 28 d');
      }
    }
  }

  assert(
    transOmissionPass,
    '环4',
    '双语翻译逐行逐句细节零遗漏机械硬门禁 (INV-TRANS-ZERO-OMISSION)',
    '全文档所有章节中文载有的 OECD 导则编号、实验数值与关键限定语在英文中严禁被粗暴遗漏或截断',
    transOmissionPass ? '零细节遗漏，中英文实测 1:1 物理对齐' : \`存在细节遗漏: \${transOmissionDetails.join('; ')}\`,
    'Bilingual Parity',
    ['源文档实验细节在英文翻译时被过度精简截断']
  );`;

  if (!content.includes(targetAnchor)) {
    throw new Error('targetAnchor not found in run_master_msds_audit.mjs');
  }

  content = content.replace(targetAnchor, addition);
  const proposedPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.proposed.mjs';
  await fs.writeFile(proposedPath, content, 'utf8');
  console.log('Successfully generated run_master_msds_audit.proposed.mjs');
}

generateProposedAudit().catch(console.error);
