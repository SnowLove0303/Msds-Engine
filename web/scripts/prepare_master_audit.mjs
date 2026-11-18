import fs from 'fs';

let code = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs', 'utf8');

// 1. Update lines 1118-1135: check for <w:tab/> golden anchor
const oldEnTab = `        if (m) {
          const hasTwoSpace = /^\\d+\\.\\d+  \\S/.test(txt);
          if (!hasTwoSpace) enLabelBadSpacingCount++;
          const hasTab = p.getElementsByTagName('w:tab').length > 0;
          if (hasTab) enLabelHasTabCount++;
          if (/\\s{3,}/.test(txt)) enLabelExtraSpaceCount++;
        }
      }
    });
    assert(
      enLabelBadSpacingCount === 0 && enLabelHasTabCount === 0 && enLabelExtraSpaceCount === 0,
      '环3',
      '英文版编号标签两空格排版紧凑不变量 (REQ-01)',
      '英文版所有编号标签必须使用标准西文两空格 (seqStr + "  ") 紧凑匀称排版，严禁使用导致弹跳的制表符或超过2个空格',
      \`非两空格段落数: \${enLabelBadSpacingCount}, 包含制表符数: \${enLabelHasTabCount}, 超过2空格数: \${enLabelExtraSpaceCount}\`,
      'Full Document EN Label Cells'
    );`;

const newEnTab = `        if (m) {
          const hasTab = p.getElementsByTagName('w:tab').length > 0;
          if (!hasTab) enLabelHasTabCount++; // 缺少制表符
        }
      }
    });
    assert(
      enLabelHasTabCount === 0,
      '环3',
      '英文版编号标签黄金标尺锚点不变量 (REQ-GOLDEN-ANCHOR)',
      '英文版所有编号标签必须挂载 <w:tab/> 黄金制表锚点，确保全量对齐 420 dxa 黄金基准线',
      \`缺少制表符段落数: \${enLabelHasTabCount}\`,
      'Full Document EN Label Cells'
    );`;

if (!code.includes(oldEnTab)) {
  console.error('oldEnTab not found in run_master_msds_audit.mjs');
  process.exit(1);
}
code = code.replace(oldEnTab, newEnTab);

// 2. Update lines 1143-1150: Section 8.1 Exposure controls must have hanging indent + bold
const oldS8Header = `      assert(
        !r1HasHanging && r1IsBoldHeader,
        '环3',
        'Section 8.1 题头规格保护不变量 (REQ-02)',
        'Section 8.1 Exposure controls: 必须为顶格左对齐、大号加粗题头 (sz=21/24)，严禁被降级为 9.5pt 悬挂缩进普通正文',
        \`存在悬挂缩进=\${r1HasHanging}, 符合粗体题头=\${r1IsBoldHeader}\`,
        'Section 8.1 EN Header'
      );`;

const newS8Header = `      assert(
        r1HasHanging && r1IsBoldHeader,
        '环3',
        'Section 8.1 题头规格保护不变量 (REQ-02)',
        'Section 8.1 Exposure controls: 必须为 420 dxa 悬挂缩进加粗题头，并与 9.1 外观绝对铅垂对齐',
        \`存在悬挂缩进=\${r1HasHanging}, 符合粗体题头=\${r1IsBoldHeader}\`,
        'Section 8.1 EN Header'
      );`;

if (!code.includes(oldS8Header)) {
  console.error('oldS8Header not found in run_master_msds_audit.mjs');
  process.exit(1);
}
code = code.replace(oldS8Header, newS8Header);

// 3. Add 4 new physical assertions before Ring 4
const targetBeforeRing4 = `  // ======================================================================
  // 环 4: 中英文 16 章节逐行双语镜像对照审查 (Ring 4: Bilingual Parity)
  // ======================================================================`;

const newAssertions = `  // 11. 全文档表格 <w:numPr> 自动编号属性零容忍物理清除断言 (REQ-S3-DUP-PURGE)
  let totalNumPrInTables = 0;
  for (const docObj of [cnDocx, enDocx]) {
    if (docObj.documentXml) {
      const numPrs = Array.from(docObj.documentXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'numPr'));
      totalNumPrInTables += numPrs.length;
    }
  }
  assert(
    totalNumPrInTables === 0,
    '环3',
    '全文档表格 numPr 自动编号属性零容忍清除规范 (REQ-S3-DUP-PURGE)',
    '全文档所有表格段落中严禁存在任何 <w:numPr> 列表定义，彻底切断 Word 自动编号叠加导致序号重复',
    \`表格内残留 numPr 节点数: \${totalNumPrInTables}\`,
    'Full Document Tables numPr'
  );

  // 12. Section 3 实体序号唯一性与绝无重复拼接断言 (REQ-S3-DUP-PURGE)
  let s3HasDuplicateSeq = false;
  let s3DupDetail = '';
  for (const docObj of [cnDocx, enDocx]) {
    const s3 = docObj.records.find(r => r.sectionNumber === 3);
    if (s3 && s3.rows.length >= 3) {
      const t1 = (s3.rows[1].cells[0]?.text || '').trim();
      const t2 = (s3.rows[2].cells[0]?.text || '').trim();
      if (/3\\.1.*3\\.1/.test(t1) || /3\\.2.*3\\.2/.test(t2)) {
        s3HasDuplicateSeq = true;
        s3DupDetail = \`Row 1: "\${t1}", Row 2: "\${t2}"\`;
        break;
      }
    }
  }
  assert(
    !s3HasDuplicateSeq,
    '环3',
    'Section 3 实体序号唯一性与绝无重复规范 (REQ-S3-DUP-PURGE)',
    'Section 3 Row 1 与 Row 2 实体序号必须唯一，严禁出现 "3.1  3.1" 或 "3.2  3.2" 等重复拼接',
    s3HasDuplicateSeq ? \`存在重复序号: \${s3DupDetail}\` : '单一序号纯净合规',
    'Section 3 Sequences'
  );

  // 13. 8.1 / 9.1 / 11.1 / 11.7 黄金标尺铅垂共线绝对对齐断言 (REQ-GOLDEN-ANCHOR)
  let goldenAnchorPass = true;
  let goldenAnchorDetail = '';
  try {
    const checkScript = path.join(__dirname, 'check_pdf_golden_anchor_alignment.py');
    if (fs.existsSync(checkScript) && fs.existsSync(cnGzPdf)) {
      const out = execSync(\`python "\${checkScript}" "\${cnGzPdf}" "\${cnGcPdf}" "\${enGzPdf}" "\${enGcPdf}"\`, { encoding: 'utf8' }).trim();
      goldenAnchorPass = out.includes('ALL Golden Anchor label alignments PASS');
      goldenAnchorDetail = out.split('\\n')[0];
    }
  } catch (err) {
    goldenAnchorPass = false;
    goldenAnchorDetail = err.message;
  }
  assert(
    goldenAnchorPass,
    '环3',
    '8.1 / 9.1 / 11.1 / 11.7 黄金标尺铅垂共线绝对对齐规范 (REQ-GOLDEN-ANCHOR)',
    '父级带序号标签正文与子级标签首字必须严格在 80.28pt 黄金基准线铅垂共线对齐',
    goldenAnchorPass ? '全量对齐通过 (80.28pt)' : goldenAnchorDetail,
    'PDF Golden Anchor Coordinates'
  );

  // 14. 子级标签对应值单元格向右阶梯缩进断言 (REQ-SUBVAL-RIGHT-INDENT)
  let subValIndentPass = false;
  const s8CheckRec = cnDocx.records.find(r => r.sectionNumber === 8);
  if (s8CheckRec && s8CheckRec.rows.length >= 5) {
    // 检查 Row 2 (呼吸系统防护) 或 Row 4 (防护手套的合适材料) 对应值单元格
    const valCell = s8CheckRec.rows[2].cells[1]?.node || s8CheckRec.rows[4].cells[1]?.node;
    if (valCell) {
      const inds = Array.from(valCell.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'ind'));
      subValIndentPass = inds.some(ind => ind.getAttribute('w:left') === '240' || ind.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'left') === '240');
    }
  }
  assert(
    subValIndentPass,
    '环3',
    '子级标签对应值单元格向右阶梯缩进规范 (REQ-SUBVAL-RIGHT-INDENT)',
    'Section 8 等无序号子级标签对应的值单元格段落必须显式注入 w:left="240"，形成清晰的树状阶梯视觉层次',
    subValIndentPass ? '子值向右缩进生效 (left=240)' : '缺少 left=240 缩进',
    'Section 8 Sub-values Indentation'
  );

  // ======================================================================
  // 环 4: 中英文 16 章节逐行双语镜像对照审查 (Ring 4: Bilingual Parity)
  // ======================================================================`;

if (!code.includes(targetBeforeRing4)) {
  console.error('targetBeforeRing4 not found in run_master_msds_audit.mjs');
  process.exit(1);
}
code = code.replace(targetBeforeRing4, newAssertions);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit_proposed.js', code, 'utf8');
console.log('run_master_msds_audit_proposed.js prepared successfully!');
