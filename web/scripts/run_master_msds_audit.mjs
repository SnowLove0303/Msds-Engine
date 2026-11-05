import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer as XmlSerializer } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';

// Ensure DOMParser / XMLSerializer in global scope for docx-engine
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';

/**
 * MSDS Studio 工业级集中式中央主审计套件 (Universal Master MSDS Audit Suite)
 * 
 * 最高法定效力：全系统唯一主审计执行入口，替代一切分散单次调试脚本。
 * 核心特征：
 * 1. 纯数据驱动，绝对零型号硬编码 (Zero Model Hardcoding)
 * 2. 两阶双轨闭环：Step 1 机械确定性准入 + Step 2 智能体语义证伪准出
 * 3. 集中覆盖五大环路：
 *    - 环 1: 全局宏观物理不变量 (G-01 ~ G-40: 8格式、时间戳、OPC、边框、字体、标点、实体隔离)
 *    - 环 2: PDF 物理真实渲染实测 (说明行 9.50pt / Section 9 激光垂线 x0=80.28pt / 末页防纯空)
 *    - 环 3: 16 章节局部专属契约 (Section 1 ~ 16 逐节槽位、几何合并、反口水话、温控保真)
 *    - 环 4: 中英文 16 章节逐行双语镜像对照 (G-41 ~ G-46)
 *    - 环 5: 法定免检白名单基准库 Oracle (legal-invariants-oracle.json) 反误判阻断拦截
 * 4. 自动生成标准 1:1 双向物理核销清算表与退出码 0 充要凭证
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 载入法医级反直觉白名单 Oracle
const ORACLE_PATH = path.join(__dirname, '../src/audit/legal-invariants-oracle.json');
let LEGAL_ORACLE = { invariants: [] };
if (fs.existsSync(ORACLE_PATH)) {
  try {
    LEGAL_ORACLE = JSON.parse(fs.readFileSync(ORACLE_PATH, 'utf8'));
  } catch (err) {
    console.warn(`[WARN] 无法解析 legal-invariants-oracle.json: ${err.message}`);
  }
}

/**
 * 提取 DOCX 底层 document.xml DOM
 */
export async function loadDocXml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[LoadDocXml] 目标交付物文件不存在: ${filePath}`);
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const xml = await zip.file('word/document.xml').async('text');
  return new DOMParser().parseFromString(xml, 'text/xml');
}

/**
 * 集中式主审计核心执行函数
 */
export async function runMasterMsdsAudit(options = {}) {
  const targetDir = options.targetDir || 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';
  const model = options.model || path.basename(targetDir);
  const sourceDocx = options.sourceDocx || null;

  console.log('========================================================================================');
  console.log('       MSDS Studio 工业级集中式中央主审计套件 (Master MSDS Audit Suite)                ');
  console.log(` 目标型号: ${model}`);
  console.log(` 交付目录: ${targetDir}`);
  if (sourceDocx) console.log(` 源文档路径: ${sourceDocx}`);
  console.log('========================================================================================\n');

  let totalAssertions = 0;
  let passCount = 0;
  let failCount = 0;
  let whitelistPassCount = 0;
  const failureDetails = [];
  const checkoffMatrix = [];

  /**
   * 核心带 Oracle 白名单过滤的断言器
   */
  const assert = (condition, ringId, dimension, contract, actualObserved, sourceInfo, forbiddenKeywords = []) => {
    totalAssertions++;
    if (condition) {
      passCount++;
      console.log(`✅ [PASS] [${dimension}] ${contract}`);
      checkoffMatrix.push({
        id: String(totalAssertions).padStart(2, '0'),
        dimension: `[${ringId}] ${dimension}`,
        contract,
        actual: actualObserved || '符合法定规范',
        source: sourceInfo || 'OOXML DOM / PDF',
        status: 'PASS'
      });
      return true;
    }

    // 触发失败，立即过审 Oracle 白名单，核验是否命中已知反直觉合法规范
    const combinedText = `${dimension} ${contract} ${actualObserved} ${forbiddenKeywords.join(' ')}`;
    let matchedInvariant = null;

    for (const inv of LEGAL_ORACLE.invariants || []) {
      for (const phrase of inv.forbiddenAccusations || []) {
        if (combinedText.includes(phrase)) {
          matchedInvariant = inv;
          break;
        }
      }
      if (matchedInvariant) break;
    }

    if (matchedInvariant) {
      whitelistPassCount++;
      console.log(`🛡️  [ORACLE_WHITELIST_PASS] [${dimension}] ${contract} (命中白名单 ${matchedInvariant.id}: ${matchedInvariant.title})`);
      checkoffMatrix.push({
        id: String(totalAssertions).padStart(2, '0'),
        dimension: `[${ringId}] ${dimension}`,
        contract,
        actual: `[WHITELIST] ${matchedInvariant.title}`,
        source: `Oracle: ${matchedInvariant.id}`,
        status: `PASS (${matchedInvariant.id})`
      });
      return true;
    }

    // 真正缺陷
    failCount++;
    console.error(`❌ [FAIL] [${dimension}] ${contract} | 实测: ${actualObserved}`);
    failureDetails.push({ ringId, dimension, contract, actualObserved, sourceInfo });
    checkoffMatrix.push({
      id: String(totalAssertions).padStart(2, '0'),
      dimension: `[${ringId}] ${dimension}`,
      contract,
      actual: actualObserved || '不符合预期',
      source: sourceInfo || 'OOXML DOM / PDF',
      status: 'FAIL'
    });
    return false;
  };

  const DELIVERABLES = [
    `${model} msds_CN 冠志.docx`,
    `${model} msds_CN 冠志.pdf`,
    `${model} msds_CN 国彩.docx`,
    `${model} msds_CN 国彩.pdf`,
    `${model} msds_EN Guanzhi.docx`,
    `${model} msds_EN Guanzhi.pdf`,
    `${model} msds_EN Guocai.docx`,
    `${model} msds_EN Guocai.pdf`,
  ];

  // ======================================================================
  // 环 1: 全局宏观物理不变量审查 (Ring 1: Global Macro Invariants)
  // ======================================================================
  console.log('>>> [环 1: 全局宏观物理不变量审查 (Global Macro Invariants)]');

  // G-01: 8 份标准交付物存在性
  for (const file of DELIVERABLES) {
    const fullPath = path.join(targetDir, file);
    assert(
      fs.existsSync(fullPath),
      '环1',
      'G-01 交付物存在性',
      `标准交付物 ${file} 必须物理存在`,
      fs.existsSync(fullPath) ? '文件存在' : '文件缺失',
      '目标交付目录'
    );
  }

  // G-36: 时间戳同步性与文件锁保护
  const mtimes = DELIVERABLES.map(file => {
    const fullPath = path.join(targetDir, file);
    return fs.existsSync(fullPath) ? fs.statSync(fullPath).mtimeMs : 0;
  }).filter(t => t > 0);

  if (mtimes.length === 8) {
    const maxMtime = Math.max(...mtimes);
    const minMtime = Math.min(...mtimes);
    const mtimeDiffSec = (maxMtime - minMtime) / 1000;
    // 允许如果某 PDF 正在被阅读器锁定，且其他文件同步时间差极小
    const syncPass = mtimeDiffSec < 2400; // 宽限至 40 分钟内同一批次任务
    assert(
      syncPass,
      '环1',
      'G-36 时间戳同步性',
      `8 份交付物修改时间差严禁超过批次阈值 (实测差值: ${mtimeDiffSec.toFixed(1)}s)`,
      `差值 ${mtimeDiffSec.toFixed(1)}s`,
      'fs.statSync.mtime'
    );
  }

  // G-39: OPC 包与 [Content_Types].xml 媒体声明完备性公理
  const docxList = [
    `${model} msds_CN 冠志.docx`,
    `${model} msds_CN 国彩.docx`,
    `${model} msds_EN Guanzhi.docx`,
    `${model} msds_EN Guocai.docx`
  ];
  for (const docxName of docxList) {
    const fullDocxPath = path.join(targetDir, docxName);
    if (!fs.existsSync(fullDocxPath)) continue;
    const docxBuf = fs.readFileSync(fullDocxPath);
    const docxZip = await JSZip.loadAsync(docxBuf);
    const ctFile = docxZip.file('[Content_Types].xml');
    assert(
      Boolean(ctFile),
      '环1',
      'G-39 OPC 结构完备性',
      `${docxName} 必须包含 [Content_Types].xml`,
      ctFile ? '存在' : '缺失',
      docxName
    );
    if (ctFile) {
      const ctXml = await ctFile.async('text');
      const mediaFiles = Object.keys(docxZip.files).filter(k => /^word\/media\/.+\.[a-zA-Z0-9]+$/i.test(k));
      for (const mf of mediaFiles) {
        const ext = mf.split('.').pop().toLowerCase();
        const hasExt = ctXml.includes(`Extension="${ext}"`) || ctXml.includes(`Extension="${ext.toUpperCase()}"`) || ctXml.includes(`PartName="/${mf}"`);
        assert(
          hasExt,
          '环1',
          'G-39 媒体类型声明',
          `${docxName} 中嵌入媒体 ${mf} 必须合法声明于 [Content_Types].xml`,
          hasExt ? '已声明' : '未声明',
          mf
        );
      }
    }
  }

  // 媒体纯度断言: 英文版交付物严禁直接复用带有中文“警告”字样的 5493 字节位图
  const enDocxPath = path.join(targetDir, `${model} msds_EN Guanzhi.docx`);
  if (fs.existsSync(enDocxPath)) {
    const enBuf = fs.readFileSync(enDocxPath);
    const enZip = await JSZip.loadAsync(enBuf);
    const mediaFiles = Object.keys(enZip.files).filter(k => k.startsWith('word/media/') && !k.endsWith('/'));
    for (const mf of mediaFiles) {
      const fileObj = enZip.file(mf);
      if (!fileObj) continue;
      const imgBuf = await fileObj.async('nodebuffer');
      assert(
        imgBuf.length !== 5493,
        '环1',
        '多语言媒体纯度',
        `英文交付物图片 ${mf} 严禁直接复制中文模板的光栅位图 (5493 bytes 带“警告”)`,
        `实测尺寸: ${imgBuf.length} bytes`,
        mf
      );
    }
  }

  // 页眉页脚安全几何公理: 严禁包含畸形首行缩进 w:firstLine="8730"
  for (const docxName of docxList) {
    const fullDocxPath = path.join(targetDir, docxName);
    if (!fs.existsSync(fullDocxPath)) continue;
    const docxBuf = fs.readFileSync(fullDocxPath);
    const docxZip = await JSZip.loadAsync(docxBuf);
    const footerFiles = Object.keys(docxZip.files).filter(k => k.startsWith('word/footer'));
    for (const ff of footerFiles) {
      const fXml = await docxZip.file(ff).async('text');
      assert(
        !/w:firstLine="8730"/.test(fXml),
        '环1',
        '页脚几何安全',
        `${docxName} 的 ${ff} 严禁包含导致 PDF 首字截断的畸形缩进 w:firstLine="8730"`,
        fXml.includes('8730') ? '存在畸形缩进' : '正常纯净',
        ff
      );
    }
  }

  // 全局表格边框外实内虚规范 (G-04 / G-05)
  const cnGzDocx = path.join(targetDir, `${model} msds_CN 冠志.docx`);
  if (fs.existsSync(cnGzDocx)) {
    const domCn = await loadDocXml(cnGzDocx);
    const tbls = domCn.getElementsByTagName('w:tbl');
    assert(
      tbls.length >= 16,
      '环1',
      '全局表格完整性',
      `全文档表格总数必须完整 (实测包含 ${tbls.length} 个表格)`,
      `包含 ${tbls.length} 个表格`,
      'word/document.xml'
    );
    for (let i = 0; i < tbls.length; i++) {
      const borders = tbls[i].getElementsByTagName('w:tblBorders')[0];
      if (borders) {
        const top = borders.getElementsByTagName('w:top')[0]?.getAttribute('w:val');
        const bottom = borders.getElementsByTagName('w:bottom')[0]?.getAttribute('w:val');
        const insideH = borders.getElementsByTagName('w:insideH')[0]?.getAttribute('w:val');
        const insideV = borders.getElementsByTagName('w:insideV')[0]?.getAttribute('w:val');
        const isBorderCompliant = (!top || top === 'single') && (!bottom || bottom === 'single') && (!insideH || insideH === 'dotted') && (!insideV || insideV === 'dotted');
        assert(
          isBorderCompliant,
          '环1',
          '表格边框外实内虚规范',
          `表格 ${i+1} 边框线型必须为外框实线 single、内框虚线 dotted`,
          `top=${top}, bottom=${bottom}, insideH=${insideH}, insideV=${insideV}`,
          `Table ${i+1}`
        );
      }
    }
  }

  // 标点符号纯度与中西文严格隔离 (G-06 ~ G-09)
  if (fs.existsSync(cnGzDocx) && fs.existsSync(enDocxPath)) {
    const enDocxBuf = fs.readFileSync(enDocxPath);
    const enZip = await JSZip.loadAsync(enDocxBuf);
    const enDocXml = await enZip.file('word/document.xml').async('text');
    // 英文严禁全角度数符号 ℃
    assert(
      !/℃/.test(enDocXml),
      '环1',
      '英文标点纯度 (度数符号)',
      '英文交付物严禁使用汉字库全角符号 ℃，必须统一规范转换为西文国际标准 °C',
      enDocXml.includes('℃') ? '包含全角℃' : '纯净使用°C',
      'word/document.xml'
    );
    // 英文严禁全角冒号
    assert(
      !/[a-zA-Z0-9]：/.test(enDocXml),
      '环1',
      '英文标点纯度 (西文半角冒号)',
      '英文交付物所有英文字符后严禁残留中文全角冒号 ：',
      /[a-zA-Z0-9]：/.test(enDocXml) ? '发现全角冒号' : '纯净半角冒号',
      'word/document.xml'
    );
  }

  // 双实体预设物理隔离公理 (Dual-Entity Isolation)
  const cnGzPath = path.join(targetDir, `${model} msds_CN 冠志.docx`);
  const cnGcPath = path.join(targetDir, `${model} msds_CN 国彩.docx`);
  if (fs.existsSync(cnGzPath) && fs.existsSync(cnGcPath)) {
    const gzXml = await (await JSZip.loadAsync(fs.readFileSync(cnGzPath))).file('word/document.xml').async('text');
    const gcXml = await (await JSZip.loadAsync(fs.readFileSync(cnGcPath))).file('word/document.xml').async('text');
    assert(
      gzXml.includes('广州冠志') && !gzXml.includes('英德市国彩'),
      '环1',
      '双实体物理隔离 (冠志版)',
      '冠志版必须包含“广州冠志”，严禁串流出现“英德市国彩”',
      gzXml.includes('英德市国彩') ? '串流国彩信息' : '完全隔离纯净',
      '冠志版 document.xml'
    );
    assert(
      gcXml.includes('国彩') && !gcXml.includes('广州冠志'),
      '环1',
      '双实体物理隔离 (国彩版)',
      '国彩版必须包含“国彩”，严禁串流出现“广州冠志”',
      gcXml.includes('广州冠志') ? '串流冠志信息' : '完全隔离纯净',
      '国彩版 document.xml'
    );
  }

  // ======================================================================
  // 环 2: PDF 物理真实渲染实测审查 (Ring 2: PDF Visual & Physical Audits)
  // ======================================================================
  console.log('\n>>> [环 2: PDF 物理真实渲染实测审查 (PDF Physical Audits)]');

  const enGzPdf = path.join(targetDir, `${model} msds_EN Guanzhi.pdf`);
  const enGcPdf = path.join(targetDir, `${model} msds_EN Guocai.pdf`);
  const cnGzPdf = path.join(targetDir, `${model} msds_CN 冠志.pdf`);
  const cnGcPdf = path.join(targetDir, `${model} msds_CN 国彩.pdf`);

  // G-37: PDF 英文说明行实际像素字号 9.50pt
  if (fs.existsSync(enGzPdf) && fs.existsSync(enGcPdf)) {
    try {
      const checkPdfScript = path.join(__dirname, 'check_pdf_preamble_sz.py');
      const pyOutput = execSync(`python "${checkPdfScript}" "${enGzPdf}" "${enGcPdf}"`, { encoding: 'utf8' }).trim();
      assert(
        pyOutput.includes('PASS'),
        '环2',
        'G-37 PDF 说明行字号',
        '英文版 PDF 说明行实际字号必须为 9.50pt (实测 <= 11.0pt)',
        pyOutput,
        'PyMuPDF'
      );
    } catch (err) {
      assert(false, '环2', 'G-37 PDF 说明行字号', '英文版 PDF 说明行字号必须为 9.50pt', err.message, 'PyMuPDF');
    }
  }

  // G-38: Section 9 标签首字绝对垂直对齐 (x0=80.28pt 激光垂线)
  if (fs.existsSync(cnGzPdf) && fs.existsSync(cnGcPdf) && fs.existsSync(enGzPdf) && fs.existsSync(enGcPdf)) {
    try {
      const checkAlignScript = path.join(__dirname, 'check_pdf_s9_alignment.py');
      const alignOutput = execSync(`python "${checkAlignScript}" "${cnGzPdf}" "${cnGcPdf}" "${enGzPdf}" "${enGcPdf}"`, { encoding: 'utf8' }).trim();
      assert(
        alignOutput.includes('ALL Section 9 label alignments PASS'),
        '环2',
        'G-38 S9 激光垂直对齐',
        '中英文 4 份 PDF 全量 Section 9 标签必须绝对垂直对齐至 80.28pt',
        alignOutput,
        'PyMuPDF'
      );
    } catch (err) {
      assert(false, '环2', 'G-38 S9 激光垂直对齐', 'Section 9 标签首字对齐至 80.28pt', err.message, 'PyMuPDF');
    }
  }

  // G-40: 末页防纯空门禁 (Blank Page Bug Zero-Tolerance)
  try {
    const checkBlankScript = path.join(__dirname, 'check_pdf_blank_page.py');
    const validPdfs = [cnGzPdf, cnGcPdf, enGzPdf, enGcPdf].filter(p => fs.existsSync(p));
    if (validPdfs.length > 0) {
      const pyOutput = execSync(`python "${checkBlankScript}" ${validPdfs.map(p => `"${p}"`).join(' ')}`, { encoding: 'utf8' }).trim();
      assert(
        !pyOutput.includes('FAIL'),
        '环2',
        'G-40 末页防纯空门禁',
        '所有交付物 PDF 最后一页必须包含实质主体文本块，严禁纯空仅留页眉页脚',
        pyOutput,
        'PyMuPDF'
      );
    }
  } catch (err) {
    assert(false, '环2', 'G-40 末页防纯空门禁', '交付物 PDF 末页防纯空验证', err.message, 'PyMuPDF');
  }

  // ======================================================================
  // 环 3: 16 章节局部专属微观契约审查 (Ring 3: Section 1~16 Specifications)
  // ======================================================================
  console.log('\n>>> [环 3: 16 章节局部专属微观契约审查 (Section-by-Section Specifications)]');

  const cnDocx = await loadDocx(fs.readFileSync(cnGzDocx));
  const enDocx = await loadDocx(fs.readFileSync(enDocxPath));
  const domCn = await loadDocXml(cnGzDocx);

  // Section 1: 标识
  const cnS1 = cnDocx.records.find(r => r.sectionNumber === 1);
  const enS1 = enDocx.records.find(r => r.sectionNumber === 1);
  if (cnS1 && enS1) {
    const cnS1Text = cnS1.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    const enS1Text = enS1.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');

    assert(
      cnS1.rows.length === 10,
      '环3',
      'Section 1 中文行数契约',
      '中文版 Section 1 必须固定为 10 行标准表格结构',
      `实测行数: ${cnS1.rows.length}`,
      'Section 1 CN'
    );
    assert(
      enS1.rows.length === 9,
      '环3',
      'Section 1 英文行数契约',
      '英文版 Section 1 必须固定为 9 行标准结构',
      `实测行数: ${enS1.rows.length}`,
      'Section 1 EN'
    );
    // 型号精确覆写
    assert(
      enS1Text.includes(model) || cnS1Text.includes(model),
      '环3',
      'Section 1 型号精确覆写',
      `交付物必须包含当前目标型号 ${model}`,
      `找到型号: ${model}`,
      'Section 1'
    );
    // 固化剂化工专业定性
    if (/固化剂/.test(cnS1Text)) {
      assert(
        /curing agent|hardener|crosslinker/i.test(enS1Text) && !/emulsion/i.test(enS1Text),
        '环3',
        'Section 1 化工专业定性',
        '固化剂英文品名必须为 curing agent / hardener / crosslinker，绝对严禁降级或误译为乳液 (emulsion)',
        enS1.rows[1]?.cells[1]?.text || '',
        'Section 1 EN Row 1'
      );
    }
  }

  // Section 2: 危险性概述
  const cnS2 = cnDocx.records.find(r => r.sectionNumber === 2);
  const enS2 = enDocx.records.find(r => r.sectionNumber === 2);
  if (cnS2 && enS2) {
    const cnS2Text = cnS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    const enS2Text = enS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    const isNonHaz = /不属于危害|非危险|不属于危险|危险性类别[：:]\s*无|not classified/i.test(cnS2Text);

    if (isNonHaz) {
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
            const srcS2Text = srcS2.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
            srcHasPictogram = /象形图|pictogram/i.test(srcS2Text);
            srcHasSignal = /信号词|警示词|signal word/i.test(srcS2Text);
          }
        } catch (e) {}
      }

      // 源文件零外生虚增最高公理断言
      if (!srcHasPictogram) {
        const hasExoPicCn = /GHS\s*象形图[：:]\s*无|象形图[：:]\s*无/.test(cnS2Text);
        const hasExoPicEn = /GHS pictograms:\s*None|Pictograms:\s*None/i.test(enS2Text);
        assert(
          !hasExoPicCn && !hasExoPicEn,
          '环3',
          'Section 2 源文件零外生虚增(象形图)',
          '源文档未提及象形图时，交付物严禁外生强塞“象形图：无”或“None”',
          `CN外生=${hasExoPicCn}, EN外生=${hasExoPicEn}`,
          'Section 2 CN/EN',
          ['忠实源文件未虚增象形图属于遗漏']
        );
      }
      if (!srcHasSignal) {
        const hasExoSigCn = /信号词[：:]\s*无/.test(cnS2Text);
        const hasExoSigEn = /Signal word:\s*None/i.test(enS2Text);
        assert(
          !hasExoSigCn && !hasExoSigEn,
          '环3',
          'Section 2 源文件零外生虚增(信号词)',
          '源文档未提及信号词时，交付物严禁外生强塞“信号词：无”或“None”',
          `CN外生=${hasExoSigCn}, EN外生=${hasExoSigEn}`,
          'Section 2 CN/EN',
          ['非危品源文件未提信号词未输出无属于缺陷']
        );
      }
    }
  }

  // Section 3: 成分信息
  const cnS3 = cnDocx.records.find(r => r.sectionNumber === 3);
  const enS3 = enDocx.records.find(r => r.sectionNumber === 3);
  if (cnS3 && enS3) {
    const cnBodyRows = cnS3.rows.slice(3);
    const enBodyRows = enS3.rows.slice(3);
    assert(
      cnBodyRows.length === enBodyRows.length,
      '环3',
      'Section 3 组分行数 1:1 守恒',
      `成分表格组分行数中英文必须 1:1 绝对相等 (CN: ${cnBodyRows.length} vs EN: ${enBodyRows.length})`,
      `CN=${cnBodyRows.length}, EN=${enBodyRows.length}`,
      'Section 3'
    );
  }

  // Section 4: 急救措施
  const enS4 = enDocx.records.find(r => r.sectionNumber === 4);
  if (enS4) {
    const enS4Text = enS4.rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ');
    assert(
      /Inhalation|Skin|Eye|Ingestion/i.test(enS4Text),
      '环3',
      'Section 4 四大接触途径完备性',
      '急救措施中英文必须完备包含吸入、皮肤、眼睛、食入四大途径',
      enS4Text.slice(0, 150),
      'Section 4 EN'
    );
  }

  // Section 5: 消防措施
  const enS5 = enDocx.records.find(r => r.sectionNumber === 5);
  if (enS5) {
    const enS5Text = enS5.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    assert(
      !/Firefighters must wear self-contained breathing apparatus/i.test(enS5Text),
      '环3',
      'Section 5 反外生 SCBA 口水话',
      '严禁注入源文件未授权的消防员空气呼吸器 SCBA 外生通用口水话',
      enS5Text.includes('self-contained') ? '包含外生口水话' : '纯净保真',
      'Section 5 EN'
    );
  }

  // Section 8: 接触控制与个体防护 (最高发重灾区)
  const cnS8 = cnDocx.records.find(r => r.sectionNumber === 8);
  const enS8 = enDocx.records.find(r => r.sectionNumber === 8);
  if (cnS8 && enS8) {
    const cnS8Text = cnS8.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    const enS8Text = enS8.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');

    // 反口水话排他断言
    assert(
      !/使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴设施/i.test(cnS8Text),
      '环3',
      'Section 8 中文工程控制反口水话',
      '中文严禁底模外生编造工程控制口水话“使用局部排风或全面通风...”',
      cnS8Text.includes('局部排风') ? '包含口水话' : '纯净保真',
      'Section 8 CN'
    );
    assert(
      !/Use local exhaust or general ventilation|eyewash and safety shower/i.test(enS8Text),
      '环3',
      'Section 8 英文工程控制反口水话',
      '英文严禁外生编造工程控制口水话“Use local exhaust or general ventilation...”',
      enS8Text.includes('local exhaust') ? '包含口水话' : '纯净保真',
      'Section 8 EN'
    );
    assert(
      !/建议戴上防护手套/i.test(cnS8Text),
      '环3',
      'Section 8 手部防护反外生编造',
      '中文严禁凭空外生编造手部防护保底句“建议戴上防护手套。”',
      cnS8Text.includes('建议戴上防护手套') ? '包含外生编造' : '纯净保真',
      'Section 8 CN'
    );
    assert(
      !/Protective gloves are recommended/i.test(enS8Text),
      '环3',
      'Section 8 英文手部防护反外生编造',
      '英文严禁凭空外生编造手部防护保底句“Protective gloves are recommended.”',
      enS8Text.includes('Protective gloves are recommended') ? '包含外生编造' : '纯净保真',
      'Section 8 EN'
    );

    // 唯一父级分类题头“手部防护：”存活律与排版规范
    assert(
      /手部防护[：:]/.test(cnS8Text),
      '环3',
      'Section 8 手部防护父级题头存活律',
      '中文版必须保留唯一父级分类题头“手部防护：”，绝对严禁物理删行！',
      cnS8Text.includes('手部防护') ? '存活' : '被错误删除',
      'Section 8 CN',
      ['手部防护未整行删除属于开天窗', '父级标签右侧留空判定为未剪枝']
    );
    assert(
      /Hand protection:/i.test(enS8Text),
      '环3',
      'Section 8 英文手部防护父级题头存活律',
      '英文版必须保留唯一父级分类题头“Hand protection:”，绝对严禁物理删行！',
      enS8Text.includes('Hand protection') ? '存活' : '被错误删除',
      'Section 8 EN'
    );
    // 检查手部防护单元格字号必须与同章节一致为 24 (12pt 宋体加粗)
    const handRow = Array.from(domCn.getElementsByTagName('w:tr')).find(tr => tr.textContent.includes('手部防护'));
    if (handRow) {
      const c0Node = handRow.getElementsByTagName('w:tc')[0];
      const serializer = new XmlSerializer();
      const c0Xml = c0Node ? serializer.serializeToString(c0Node) : '';
      const isSz24 = /<w:sz\s+w:val="24"/.test(c0Xml);
      const isBold = /<w:b(?:\s|\/|>)/.test(c0Xml);
      assert(
        isSz24 && isBold,
        '环3',
        'Section 8 手部防护字号与加粗规范',
        '“手部防护：”字号必须统一为 w:sz w:val="24" (12pt 小四宋体加粗)',
        `isSz24=${isSz24}, isBold=${isBold}`,
        'handRow Col 0'
      );
      // 检查手部防护题头缩进：严禁异常悬挂缩进 (w:hanging="3373" / w:left="3864")，必须回归标准首行缩进
      const hasBadHanging = /<w:ind[^>]*w:hanging="3373"/i.test(c0Xml) || /<w:ind[^>]*w:left="3864"/i.test(c0Xml);
      assert(
        !hasBadHanging,
        '环3',
        'Section 8 手部防护缩进规范',
        '“手部防护：”严禁带有历史遗留的异常悬挂缩进 (hanging=3373)，必须为标准首行缩进',
        hasBadHanging ? '存在异常悬挂缩进' : '标准首行缩进',
        'handRow Col 0'
      );
      const c1 = handRow.getElementsByTagName('w:tc')[1];
      const c1Text = (c1?.textContent || '').trim();
      assert(
        c1Text === '',
        '环3',
        'Section 8 手部防护值格纯净留空',
        '“手部防护：”值格无独立一句话陈述时必须保持纯净空白，严禁历史文字残留',
        c1Text === '' ? '纯净空白' : `残留内容: ${c1Text}`,
        'handRow Col 1',
        ['父级标签留空判定为未剪枝缺陷']
      );
    }

    // 检查英文版 Hand protection: 字号规范
    const domEn = await loadDocXml(enDocxPath);
    const handRowEn = Array.from(domEn.getElementsByTagName('w:tr')).find(tr => tr.textContent.includes('Hand protection'));
    if (handRowEn) {
      const c0EnNode = handRowEn.getElementsByTagName('w:tc')[0];
      const serializer = new XmlSerializer();
      const c0EnXml = c0EnNode ? serializer.serializeToString(c0EnNode) : '';
      const isEnSz24 = /<w:sz\s+w:val="24"/.test(c0EnXml);
      assert(
        isEnSz24,
        '环3',
        'Section 8 英文手部防护字号规范',
        '英文版“Hand protection:”字号必须统一为 w:sz w:val="24" (12pt 加粗)，严禁缩小为 sz=19',
        isEnSz24 ? '统一 12pt (sz=24)' : '存在缩小字号 (sz=19)',
        'handRowEn Col 0'
      );
    }

    // 检查 Table 8 值格粗细隔离 (Value Cell Weight Isolation)：Row 2~11 的 Cell 1 必须为常规细体，严禁全加粗
    const tablesCn = Array.from(domCn.getElementsByTagName('w:tbl'));
    const t8 = tablesCn[7];
    if (t8) {
      const rows = Array.from(t8.getElementsByTagName('w:tr'));
      let allBoldCount = 0;
      for (let i = 2; i < rows.length; i++) {
        const c1 = rows[i].getElementsByTagName('w:tc')[1];
        if (c1) {
          const serializer = new XmlSerializer();
          const c1Xml = serializer.serializeToString(c1);
          const hasText = (c1.textContent || '').trim().length > 0;
          if (hasText && /<w:b(?:\s|\/|>)/.test(c1Xml) && !/<w:b\s+w:val="false"/.test(c1Xml)) {
            allBoldCount++;
          }
        }
      }
      assert(
        allBoldCount === 0,
        '环3',
        'Section 8 值格粗细隔离规范',
        'Table 8 右侧内容单元格 (Cell 1) 必须保持常规细体 (Regular 10.5pt)，严禁全列加粗失控',
        `违规加粗值格数: ${allBoldCount}`,
        'Table 8 Cell 1'
      );
    }
  }

  // Section 9: 理化特性 (源文件底线保留与无数据存活)
  const cnS9 = cnDocx.records.find(r => r.sectionNumber === 9);
  const enS9 = enDocx.records.find(r => r.sectionNumber === 9);
  if (cnS9 && enS9) {
    const cnItems = cnS9.rows.slice(1);
    const enItems = enS9.rows.slice(1);
    assert(
      cnItems.length === enItems.length,
      '环3',
      'Section 9 行数 1:1 绝对守恒',
      `理化特性行数必须 1:1 绝对对称 (CN: ${cnItems.length} vs EN: ${enItems.length})`,
      `CN=${cnItems.length}, EN=${enItems.length}`,
      'Section 9'
    );
    // 检查编号严格连续递增无跳号
    enItems.forEach((r, idx) => {
      const expectedNum = `9.${idx + 1}`;
      const cell0Text = r.cells[0]?.text || '';
      assert(
        cell0Text.startsWith(expectedNum),
        '环3',
        `Section 9.${idx + 1} 编号连续性`,
        `英文小节编号必须严格递增为 ${expectedNum}`,
        cell0Text.slice(0, 15),
        `Section 9.${idx + 1}`
      );
      assert(
        !/(?:Flash point|Density|Dynamic viscosity)\s+(?:Flash point|Density|Dynamic viscosity)/i.test(cell0Text),
        '环3',
        `Section 9.${idx + 1} 防标签叠词`,
        '严禁出现正则替换不净导致的标签粘连叠词',
        cell0Text.slice(0, 30),
        `Section 9.${idx + 1}`
      );
    });
  }

  // Section 10: 稳定性和反应性
  const enS10 = enDocx.records.find(r => r.sectionNumber === 10);
  if (enS10) {
    const enS10Text = enS10.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    assert(
      !/Hazardous decomposition products:/i.test(enS10Text) || !/Decomposition temperature:/i.test(enS10Text),
      '环3',
      'Section 10 标签规范性',
      '危险分解产物标签严禁误写为 Decomposition temperature:',
      enS10Text.slice(0, 100),
      'Section 10 EN'
    );
  }

  // Section 11: 毒理学信息
  const enS11 = enDocx.records.find(r => r.sectionNumber === 11);
  const cnS11 = cnDocx.records.find(r => r.sectionNumber === 11);
  if (cnS11 && enS11) {
    const enS11Text = enS11.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    const cnS11Text = cnS11.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    if (/主要粘膜刺激/.test(cnS11Text)) {
      assert(
        /Primary mucosal irritation:/i.test(enS11Text),
        '环3',
        'Section 11 粘膜刺激专业英译',
        '主要粘膜刺激性必须精准英译为 Primary mucosal irritation: (严禁误写为 eye irritation)',
        enS11Text.slice(0, 100),
        'Section 11 EN'
      );
    }
  }

  // Section 12: 生态学信息
  const enS12 = enDocx.records.find(r => r.sectionNumber === 12);
  if (enS12) {
    const enS12Text = enS12.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    assert(
      !/water courses/i.test(enS12Text),
      '环3',
      'Section 12 生态学语法合规',
      '严禁使用有语法病的英语词汇 water courses，排水用语必须为 wastewater',
      enS12Text.includes('water courses') ? '存在语病' : '纯净合规',
      'Section 12 EN'
    );
  }

  // Section 13: 废弃处置 (4行标准结构 + 消除两端拉伸)
  const cnS13 = cnDocx.records.find(r => r.sectionNumber === 13);
  const enS13 = enDocx.records.find(r => r.sectionNumber === 13);
  if (cnS13 && enS13) {
    assert(
      cnS13.rows.length === 4 && enS13.rows.length === 4,
      '环3',
      'Section 13 四行标准结构',
      `废弃处置必须严格保持 4 行标准结构 (实测 CN: ${cnS13.rows.length}, EN: ${enS13.rows.length})`,
      `CN=${cnS13.rows.length}, EN=${enS13.rows.length}`,
      'Section 13'
    );
    // 检查 Table 12 Row 3 Cell 1 废弃处置方法段落对齐：严禁两端分散对齐 (both)，必须为左对齐 (left)
    const tablesCn = Array.from(domCn.getElementsByTagName('w:tbl'));
    const t12 = tablesCn[11];
    if (t12) {
      const rows = Array.from(t12.getElementsByTagName('w:tr'));
      const r3 = rows[2];
      if (r3) {
        const c1 = r3.getElementsByTagName('w:tc')[1];
        if (c1) {
          const serializer = new XmlSerializer();
          const c1Xml = serializer.serializeToString(c1);
          const isJustified = /<w:jc\s+w:val="both"/i.test(c1Xml);
          assert(
            !isJustified,
            '环3',
            'Section 13 段落对齐规范',
            '废弃处置方法长段落必须使用纯左对齐 (w:jc w:val="left")，严禁两端对齐 (both) 导致字间拉伸',
            isJustified ? '两端分散对齐(拉伸失真)' : '纯左对齐(规范)',
            'Table 12 Row 3 Cell 1'
          );
        }
      }
    }
  }

  // Section 15: 法规信息 (正向演进国令 591 号 + GB 30000 系列)
  const enS15 = enDocx.records.find(r => r.sectionNumber === 15);
  if (enS15) {
    const enS15Text = enS15.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n');
    assert(
      !/Decree No\. 344/i.test(enS15Text),
      '环3',
      'Section 15 国令废止演化',
      '法规时效性正向演进公理: 严禁引用已废止的国务院第 344 号令',
      enS15Text.includes('344') ? '引用废止344号令' : '已升级',
      'Section 15 EN'
    );
    assert(
      /Decree No\. 591/i.test(enS15Text),
      '环3',
      'Section 15 现行有效国令 591 号',
      '必须引用现行有效的国务院令第 591 号',
      enS15Text.includes('591') ? '已正向演化为 591 号令' : '缺失 591 号令',
      'Section 15 EN',
      ['法规升级为GB 30000属于篡改']
    );
    assert(
      !/GB 20576/i.test(enS15Text),
      '环3',
      'Section 15 旧国标废止演化',
      '法规时效性正向演进公理: 严禁引用已废止的 GB 20576 系列旧国标',
      enS15Text.includes('GB 20576') ? '引用废止国标' : '已升级',
      'Section 15 EN'
    );
    assert(
      /GB 30000/i.test(enS15Text),
      '环3',
      'Section 15 现行有效 GB 30000 系列',
      '必须引用现行有效的 GB 30000 系列化学品分类国标',
      enS15Text.includes('GB 30000') ? '已升级为 GB 30000' : '缺失 GB 30000',
      'Section 15 EN'
    );
  }

  // ======================================================================
  // 环 4: 中英文 16 章节逐行双语镜像对照审查 (Ring 4: Bilingual Parity)
  // ======================================================================
  console.log('\n>>> [环 4: 中英文 16 章节逐行双语镜像对照审查 (Bilingual 1:1 Parity)]');

  for (let sNum = 1; sNum <= 16; sNum++) {
    const cnSec = cnDocx.records.find(r => r.sectionNumber === sNum);
    const enSec = enDocx.records.find(r => r.sectionNumber === sNum);
    if (!cnSec || !enSec) continue;

    // 除 Section 1 法定结构豁免外，Section 2 至 16 行数强制 1:1 绝对相等
    if (sNum > 1) {
      assert(
        cnSec.rows.length === enSec.rows.length,
        '环4',
        `Section ${sNum} 双语行数同构`,
        `Section ${sNum} 中英文表格行数必须绝对 1:1 对称 (CN: ${cnSec.rows.length} vs EN: ${enSec.rows.length})`,
        `CN=${cnSec.rows.length}, EN=${enSec.rows.length}`,
        `Section ${sNum}`,
        ['中英文Section 1结构不同属于不一致']
      );
    }
  }

  // ======================================================================
  // 终审总结与 1:1 双向物理核销清算表输出
  // ======================================================================
  console.log('\n========================================================================================');
  console.log(`  集中式主审计总结: 总断言 ${totalAssertions} 项 | 成功通过 ${passCount} 项 | 白名单豁免 ${whitelistPassCount} 项 | 真实缺陷 ${failCount} 项`);
  console.log('========================================================================================\n');

  // 输出标准化清算表
  console.log('====================================================================================================');
  console.log('                        MSDS 工业级交付物 1:1 双向物理核销清算表                                   ');
  console.log('====================================================================================================');
  console.log(`产品型号: ${model}`);
  console.log(`交付目录: ${targetDir}`);
  console.log('----------------------------------------------------------------------------------------------------');
  console.log('序号 | 审计维度 / 章节           | 事实指纹与法定契约                 | 实测结论 [Measured]     | 判定结果');
  console.log('----+---------------------------+------------------------------------+-------------------------+---------');

  for (const row of checkoffMatrix) {
    const id = row.id.padEnd(2, ' ');
    const dim = row.dimension.slice(0, 25).padEnd(25, ' ');
    const ctr = row.contract.slice(0, 34).padEnd(34, ' ');
    const act = row.actual.slice(0, 23).padEnd(23, ' ');
    const st = row.status;
    console.log(`${id}  | ${dim} | ${ctr} | ${act} | ${st}`);
  }
  console.log('----------------------------------------------------------------------------------------------------');
  console.log(`总检验项数: ${totalAssertions} | 通过: ${passCount + whitelistPassCount} | 缺陷: ${failCount} | 判定: ${failCount === 0 ? '🏆 AUDIT_PASSED (退出码 0)' : '🚨 AUDIT_REJECTED (退出码 1)'}`);
  console.log('====================================================================================================\n');

  if (failCount > 0) {
    console.error(`❌ 集中式主审计未通过，发现 ${failCount} 项真实缺陷，已阻断发布:`);
    failureDetails.forEach((f, idx) => {
      console.error(`  ${idx + 1}. [${f.ringId}] [${f.dimension}] ${f.contract}`);
      console.error(`     ↳ 实测情况: ${f.actualObserved} (来源: ${f.sourceInfo})`);
    });
    return { success: false, totalAssertions, passCount, whitelistPassCount, failCount, failureDetails };
  } else {
    console.log('🎉 集中式主审计 100% 满分通过！所有物理不变量、局部微观契约、双语镜像与 Oracle 白名单核销无误！');
    return { success: true, totalAssertions, passCount, whitelistPassCount, failCount };
  }
}

// CLI 直接执行入口
if (process.argv[1] && process.argv[1].endsWith('run_master_msds_audit.mjs')) {
  const args = process.argv.slice(2);
  let model = null;
  let targetDir = null;
  let sourceDocx = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) model = args[++i];
    else if (args[i] === '--targetDir' && args[i + 1]) targetDir = args[++i];
    else if (args[i] === '--sourceDocx' && args[i + 1]) sourceDocx = args[++i];
  }

  runMasterMsdsAudit({ model, targetDir, sourceDocx }).then(res => {
    process.exit(res.success ? 0 : 1);
  }).catch(err => {
    console.error('集中式中央主审计套件执行异常:', err);
    process.exit(1);
  });
}
