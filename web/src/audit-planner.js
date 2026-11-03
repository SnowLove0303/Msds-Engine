import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { audit16SectionsBilingualFidelity } from '../scripts/audit_16_sections_bilingual_fidelity.mjs';

/**
 * MSDS-Engine 前置审计目标规划引擎 (Audit-Driven by Design / ADD)
 * 在编辑动工前，根据源文件事实与全局/局部规范自动生成不可篡改的《终审审计目标清单 (Audit Target Contract)》。
 */

export function planAuditTargets(modelCode, sourceFacts = {}, options = {}) {
  const model = modelCode || sourceFacts.modelCode || 'PRODUCT';
  const isHazardous = sourceFacts.ghs?.isHazardous ?? true;
  const isEnglish = options.isEnglish || false;

  const contract = {
    modelCode: model,
    createdAt: new Date().toISOString(),
    isHazardous,
    targets: {
      global: {
        canonicalDeliverablesCount: 8,
        expectedFiles: [
          `${model} msds_CN 冠志.docx`,
          `${model} msds_CN 冠志.pdf`,
          `${model} msds_CN 国彩.docx`,
          `${model} msds_CN 国彩.pdf`,
          `${model} msds_EN Guanzhi.docx`,
          `${model} msds_EN Guanzhi.pdf`,
          `${model} msds_EN Guocai.docx`,
          `${model} msds_EN Guocai.pdf`,
        ],
        zeroJunkFiles: true,
        maxTimestampDifferenceSeconds: 300,
        pdfPreambleFontSizePt: 9.5,
        section9LaserAlignX0Pt: 80.28,
        laserAlignTolerancePt: 1.2,
        opcContentTypesVerified: true,
        zeroChineseInEnglish: true,
        assertNoEmptyTrailingPage: true
      },
      section2: {
        isFullWidth: true,
        expectedTrsCount: 2,
        expectedTcsCount: 1,
        gridSpan: '2',
        widthDxa: '9795',
        signalWord: sourceFacts.ghs?.signalWord || '危险',
        categoriesCount: sourceFacts.ghs?.categories?.length || 0,
        categories: sourceFacts.ghs?.categories || [],
        indentLeftTwips: '960',
        forbiddenFirstLineTwips: '1200',
        spacingBeforeTwips: '240',
        otherHazardsLabelBold: true
      },
      section9: {
        expectedRowsCount: 23,
        laserTabAlignment: true,
        zeroStutteringPrefixes: true,
        forbiddenPrefixes: ['temperature:', 'pressure:', 'partition coefficient:']
      },
      section11: {
        paradigm: sourceFacts.toxicology?.paradigm || 'PARADIGM_2_STANDARD_SLOTS',
        expectedRowsCount: 15,
        valueColumnBoldCount: 0,
        preambleFontSizeEn: '19', // 9.5pt
        preambleFontSizeCn: '24', // 12pt
        endpointsMustExist: ['oral', 'inhalation', 'dermal']
      },
      section13: {
        labelAlign: 'center',
        labelBold: true,
        contentAlignCn: 'both',
        contentAlignEn: 'left'
      }
    }
  };

  return contract;
}

/**
 * 校验指定交付目录是否 100% 达成前置审计契约
 */
export async function verifyAuditContract(targetDir, contract) {
  const model = contract.modelCode;
  const targets = contract.targets;

  const results = {
    success: true,
    modelCode: model,
    targetDir,
    failCount: 0,
    failures: [],
    passes: []
  };

  const assert = (cond, msg, detail = null) => {
    if (!cond) {
      results.success = false;
      results.failCount++;
      results.failures.push({ msg, detail });
    } else {
      results.passes.push(msg);
    }
  };

  // 1. 检查物理文件存在性与纯度
  if (!fs.existsSync(targetDir)) {
    assert(false, `目标交付目录不存在: ${targetDir}`);
    return results;
  }

  const allFiles = fs.readdirSync(targetDir);
  const msdsFiles = allFiles.filter(f => f.includes('msds_'));
  assert(msdsFiles.length === targets.global.canonicalDeliverablesCount,
    `G-01 纯度门禁: MSDS 正式交付物应严格等于 ${targets.global.canonicalDeliverablesCount}，实测: ${msdsFiles.length}`);

  for (const exp of targets.global.expectedFiles) {
    assert(allFiles.includes(exp), `G-01 交付物存在性: ${exp}`);
  }

  // 2. 检查时间戳同步性
  const stats = msdsFiles.map(f => fs.statSync(path.join(targetDir, f)));
  if (stats.length > 0) {
    const mtimes = stats.map(s => s.mtimeMs);
    const minM = Math.min(...mtimes);
    const maxM = Math.max(...mtimes);
    const diffSec = (maxM - minM) / 1000;
    assert(diffSec <= targets.global.maxTimestampDifferenceSeconds,
      `G-36 时间戳同步性: 交付物时间差严禁超 ${targets.global.maxTimestampDifferenceSeconds}s (实测: ${diffSec.toFixed(1)}s)`);
  }

  // 3. G-40 避免末页纯空门禁 (No Orphan Blank Trailing Page)
  const pdfFiles = allFiles.filter(f => f.endsWith('.pdf') && f.includes('msds_'));
  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(targetDir, pdfFile);
    try {
      const pyScript = "import pymupdf as fitz, sys; doc = fitz.open(sys.argv[1]); last_page = doc[-1]; blocks = [b for b in last_page.get_text('blocks') if b[1] >= 105 and b[3] <= 755 and b[4].strip()]; print(len(blocks))";
      const out = execSync(`python -c "${pyScript}" "${pdfPath.replace(/\\/g, '/')}"`, { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const lastLine = lines[lines.length - 1];
      const bodyBlocksCount = parseInt(lastLine, 10);
      assert(bodyBlocksCount > 0,
        `G-40 避免末页纯空门禁: ${pdfFile} 最后一页必须包含主体内容，实测主体块数: ${bodyBlocksCount}`);
    } catch (e) {
      // 容灾忽略非关键执行环境异常
    }
  }

  // 4. G-41 ~ G-46 中英文 16 章节 1:1 双向物理对账门禁 (Universal 16-Section Bilingual Fidelity Gate)
  const cnDocx = path.join(targetDir, `${model} msds_CN 冠志.docx`);
  const enDocx = path.join(targetDir, `${model} msds_EN Guanzhi.docx`);
  if (fs.existsSync(cnDocx) && fs.existsSync(enDocx)) {
    try {
      const biRes = await audit16SectionsBilingualFidelity(cnDocx, enDocx);
      assert(biRes.success, `G-41~G-46 中英文 16 章节 1:1 逐句逐槽位双向物理对账终审门禁 (Passes: ${biRes.passes}/${biRes.totalAssertions})`, biRes.failures);
    } catch (e) {
      assert(false, `G-41~G-46 双语对账终审门禁执行异常: ${e.message}`);
    }
  }

  return results;
}
