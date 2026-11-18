import fs from 'fs';

const p = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/run_master_msds_audit.mjs';
let content = fs.readFileSync(p, 'utf8');

const s2Search = `    if (isNonHaz) {
      assert(
        !/H412|H315|Category|H332|H317/i.test(enS2Text),
        '环3',
        'Section 2 非危品纯度',
        '中文为非危险品时，英文版严禁残留旧模板危化品分类与 H 声明',
        enS2Text.slice(0, 150),
        'Section 2 EN'
      );
      // INV-ZERO-EXOGENOUS: 探查源文件是否载明象形图与信号词
      let srcHasPictogram = false;
      let srcHasSignal = false;
      const effectiveSourcePath = sourceDocx || (fs.readdirSync(targetDir).find(f => /源文件留存|源文件|raw|source/i.test(f) && f.endsWith('.docx')) ? path.join(targetDir, fs.readdirSync(targetDir).find(f => /源文件留存|源文件|raw|source/i.test(f) && f.endsWith('.docx'))) : null);
      if (effectiveSourcePath && fs.existsSync(effectiveSourcePath)) {
        try {
          const srcDocx = await loadDocx(fs.readFileSync(effectiveSourcePath));
          const srcS2 = srcDocx.records.find(r => r.sectionNumber === 2);
          if (srcS2) {
            const srcS2Text = srcS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\\n');
            srcHasPictogram = /象形图|pictogram/i.test(srcS2Text);
            srcHasSignal = /信号词|警示词|signal word/i.test(srcS2Text);
          }
        } catch (e) {}
      }

      // 源文件零外生虚增最高公理断言
      if (!srcHasPictogram) {
        const hasExoPicCn = /GHS\\s*象形图[：:]\\s*无|象形图[：:]\\s*无/.test(cnS2Text);
        const hasExoPicEn = /GHS pictograms:\\s*None|Pictograms:\\s*None/i.test(enS2Text);
        assert(
          !hasExoPicCn && !hasExoPicEn,
          '环3',
          'Section 2 源文件零外生虚增(象形图)',
          '源文档未提及象形图时，交付物严禁外生强塞“象形图：无”或“None”',
          \`CN外生=\${hasExoPicCn}, EN外生=\${hasExoPicEn}\`,
          'Section 2 CN/EN',
          ['忠实源文件未虚增象形图属于遗漏']
        );
      }
      if (!srcHasSignal) {
        const hasExoSigCn = /信号词[：:]\\s*无/.test(cnS2Text);
        const hasExoSigEn = /Signal word:\\s*None/i.test(enS2Text);
        assert(
          !hasExoSigCn && !hasExoSigEn,
          '环3',
          'Section 2 源文件零外生虚增(信号词)',
          '源文档未提及信号词时，交付物严禁外生强塞“信号词：无”或“None”',
          \`CN外生=\${hasExoSigCn}, EN外生=\${hasExoSigEn}\`,
          'Section 2 CN/EN',
          ['非危品源文件未提信号词未输出无属于缺陷']
        );
      }`;

const s2Replacement = `    // INV-ZERO-EXOGENOUS: 探查源文件是否载明象形图与信号词 (全域通用门禁，危品与非危品统一适用)
    let srcHasPictogram = false;
    let srcHasSignal = false;
    const effectiveSourcePath = sourceDocx || (fs.readdirSync(targetDir).find(f => /源文件留存|源文件|raw|source/i.test(f) && f.endsWith('.docx')) ? path.join(targetDir, fs.readdirSync(targetDir).find(f => /源文件留存|源文件|raw|source/i.test(f) && f.endsWith('.docx'))) : null);
    if (effectiveSourcePath && fs.existsSync(effectiveSourcePath)) {
      try {
        const srcDocx = await loadDocx(fs.readFileSync(effectiveSourcePath));
        const srcS2 = srcDocx.records.find(r => r.sectionNumber === 2);
        if (srcS2) {
          const srcS2Text = srcS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\\n');
          srcHasPictogram = /象形图|pictogram/i.test(srcS2Text);
          srcHasSignal = /信号词|警示词|signal word/i.test(srcS2Text);
        }
      } catch (e) {}
    }

    // 源文件零外生虚增信号词最高公理硬断言 (危品与非危品全域覆盖)
    if (!srcHasSignal) {
      const hasExoSigCn = /信号词[：:]/.test(cnS2Text);
      const hasExoSigEn = /Signal word[：:]/i.test(enS2Text);
      assert(
        !hasExoSigCn && !hasExoSigEn,
        '环3',
        'Section 2 源文件零外生虚增(信号词)',
        '源文档未提及信号词时，交付物严禁外生强塞任何信号词条目（含“信号词：无”或“Signal word: None”）',
        \`CN包含信号词=\${hasExoSigCn}, EN包含信号词=\${hasExoSigEn}\`,
        'Section 2 CN/EN'
      );
    }

    if (isNonHaz) {
      assert(
        !/H412|H315|Category|H332|H317/i.test(enS2Text),
        '环3',
        'Section 2 非危品纯度',
        '中文为非危险品时，英文版严禁残留旧模板危化品分类与 H 声明',
        enS2Text.slice(0, 150),
        'Section 2 EN'
      );

      // 非危品象形图零外生虚增断言
      if (!srcHasPictogram) {
        const hasExoPicCn = /GHS\\s*象形图[：:]\\s*无|象形图[：:]\\s*无/.test(cnS2Text);
        const hasExoPicEn = /GHS pictograms:\\s*None|Pictograms:\\s*None/i.test(enS2Text);
        assert(
          !hasExoPicCn && !hasExoPicEn,
          '环3',
          'Section 2 源文件零外生虚增(象形图)',
          '源文档未提及象形图时，交付物严禁外生强塞“象形图：无”或“None”',
          \`CN外生=\${hasExoPicCn}, EN外生=\${hasExoPicEn}\`,
          'Section 2 CN/EN',
          ['忠实源文件未虚增象形图属于遗漏']
        );
      }`;

const s8Target = `      assert(
        allBoldCount === 0,
        '环3',
        'Section 8 值格粗细隔离规范',
        'Table 8 右侧内容单元格 (Cell 1) 必须保持常规细体 (Regular 10.5pt)，严禁全列加粗失控',
        \`违规加粗值格数: \${allBoldCount}\`,
        'Table 8 Cell 1'
      );
    }
  }`;

const s8Replacement = `      assert(
        allBoldCount === 0,
        '环3',
        'Section 8 值格粗细隔离规范',
        'Table 8 右侧内容单元格 (Cell 1) 必须保持常规细体 (Regular 10.5pt)，严禁全列加粗失控',
        \`违规加粗值格数: \${allBoldCount}\`,
        'Table 8 Cell 1'
      );
    }

    // 检查 Table 8 值文本排版格式与符号规范 (INV-TYPOGRAPHY-S8)
    const hasBadGteSymbolCn = /[≧≦]/.test(cnS8Text);
    const hasBadGteSymbolEn = /[≧≦]/.test(enS8Text);
    assert(
      !hasBadGteSymbolCn && !hasBadGteSymbolEn,
      '环3',
      'Section 8 符号标准规范(≥严禁≧)',
      'Section 8 计量与比较符号必须使用标准西文 ≥/≤，严禁使用非标全角 ≧/≦',
      \`CN非标=\${hasBadGteSymbolCn}, EN非标=\${hasBadGteSymbolEn}\`,
      'Section 8 CN/EN'
    );

    // 检查手套值格数字与单位空格隔离 (如 0.4 mm、480 min)
    const hasClumpedUnitCn = /(\\d+(?:\\.\\d+)?)(mm|min)\\b/.test(cnS8Text);
    assert(
      !hasClumpedUnitCn,
      '环3',
      'Section 8 值文本计量单位空格隔离规范',
      '手套规格等物理参数必须在数值与计量单位间保留标准西文空格（如 0.4 mm、480 min），严禁黏连',
      hasClumpedUnitCn ? '存在未隔离单位' : '标准空格隔离',
      'Section 8 CN'
    );

    // 检查手套规格末尾不得带多余西文句点 (如 480 min.)
    const hasTrailingDotCn = /(?:mm|min)\\./.test(cnS8Text);
    assert(
      !hasTrailingDotCn,
      '环3',
      'Section 8 中文手套规格无末尾句点规范',
      '中文手套规格参数末尾严禁携带多余西文句点 (如 min.)，保持纯净排版',
      hasTrailingDotCn ? '存在末尾句点' : '纯净无句点',
      'Section 8 CN'
    );
  }`;

const isCRLF = content.includes('\r\n');
const norm = s => isCRLF ? s.replace(/\r?\n/g, '\r\n') : s.replace(/\r\n/g, '\n');

console.log('s2 match:', content.includes(norm(s2Search)));
console.log('s8 match:', content.includes(norm(s8Target)));

if (content.includes(norm(s2Search)) && content.includes(norm(s8Target))) {
  let newContent = content
    .replace(norm(s2Search), norm(s2Replacement))
    .replace(norm(s8Target), norm(s8Replacement));
  fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/proposed_audit.mjs', newContent, 'utf8');
  console.log('Proposed audit file written!');
} else {
  console.error('Target not found!');
}
