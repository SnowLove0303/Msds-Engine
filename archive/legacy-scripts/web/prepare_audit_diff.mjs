import fs from 'fs';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs';
let content = fs.readFileSync(filePath, 'utf8');

const oldBlockRegex = /\/\/ 检查 Table 8 值格粗细隔离[\s\S]*?assert\(\s*allBoldCount === 0[\s\S]*?'Table 8 Cell 1'\s*\);\s*\}/;

const newBlock = `// 检查 Table 8 值格字阶与字体全局统一性规范 (INV-FONT-UNIFORMITY)
    // 中文版：Table 8 右侧内容单元格必须与全篇各章节值格保持高度一致，统一为小四号 12pt (sz="24") 宋体
    // 英文版：Table 8 右侧内容单元格必须与全篇各章节值格保持高度一致，统一为五号 9.5pt (sz="19") Arial
    const tablesCn = Array.from(domCn.getElementsByTagName('w:tbl'));
    const t8Cn = tablesCn[7];
    if (t8Cn) {
      const rows = Array.from(t8Cn.getElementsByTagName('w:tr'));
      let nonSz24Count = 0;
      for (let i = 2; i < rows.length; i++) {
        const c1 = rows[i].getElementsByTagName('w:tc')[1];
        if (c1) {
          const serializer = new XmlSerializer();
          const c1Xml = serializer.serializeToString(c1);
          const hasText = (c1.textContent || '').trim().length > 0;
          if (hasText && !/<w:sz\\s+w:val="24"/.test(c1Xml)) {
            nonSz24Count++;
          }
        }
      }
      assert(
        nonSz24Count === 0,
        '环3',
        'Section 8 中文值格字阶全局统一性规范',
        'Table 8 右侧内容单元格必须与全篇其他章节值格保持高度一致，统一为小四号 12pt (sz="24") 宋体，严禁孤立降级为 sz=21',
        \`异常字号值格数: \${nonSz24Count}\`,
        'Table 8 Cell 1 CN'
      );
    }

    const tablesEn = Array.from(domEn.getElementsByTagName('w:tbl'));
    const t8En = tablesEn[7];
    if (t8En) {
      const rows = Array.from(t8En.getElementsByTagName('w:tr'));
      let nonSz19Count = 0;
      for (let i = 2; i < rows.length; i++) {
        const c1 = rows[i].getElementsByTagName('w:tc')[1];
        if (c1) {
          const serializer = new XmlSerializer();
          const c1Xml = serializer.serializeToString(c1);
          const hasText = (c1.textContent || '').trim().length > 0;
          if (hasText && !/<w:sz\\s+w:val="19"/.test(c1Xml)) {
            nonSz19Count++;
          }
        }
      }
      assert(
        nonSz19Count === 0,
        '环3',
        'Section 8 英文值格字阶全局统一性规范',
        'Table 8 右侧内容单元格必须与全篇其他章节值格保持高度一致，统一为五号 9.5pt (sz="19") Arial，严禁异常放大为 sz=21',
        \`异常字号值格数: \${nonSz19Count}\`,
        'Table 8 Cell 1 EN'
      );
    }`;

if (!oldBlockRegex.test(content)) {
  console.error('Failed to locate oldBlockRegex in run_master_msds_audit.mjs!');
  process.exit(1);
}

content = content.replace(oldBlockRegex, newBlock);
fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_audit.mjs', content, 'utf8');
console.log('Successfully prepared proposed_audit.mjs, length:', content.length);
