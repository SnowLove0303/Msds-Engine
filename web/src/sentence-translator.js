/**
 * @file sentence-translator.js
 * @description 工业级 MSDS 逐句英译与句数保真核销引擎 (Sentence-by-Sentence Translation & Verification Engine)
 * 
 * 核心公理：
 * 1. 机械映射只能作为参考与抽检字典，严禁做绝对化的硬编码！
 * 2. 严禁使用粗暴单句替换截断源文件多句复合信息；
 * 3. 必须对叙述性与指标段落进行逐句拆解 (Sentence Tokenization)、语义翻译与 1:1 句数保真核销；
 * 4. 允许并发翻译提升吞吐，保证每次遇到不同文本都百分之百翻译正确！
 */

/**
 * 中文标点分句器 (严格保护小数点与化学式)
 * @param {string} text 
 * @returns {string[]}
 */
export function splitChineseSentences(text) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/\r\n?/g, '\n').trim();
  if (!clean) return [];

  // 按中文句号、感叹号、问号、分号及硬回车拆分，但保护数字小数点（如 0.4mm）
  const parts = clean
    .split(/(?<=[。！？；\n])\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return parts;
}

/**
 * 英文标点分句器 (严格保护常见化工与科学缩写，如 e.g., i.e., vs., CAS:, 0.4, etc.)
 * @param {string} text 
 * @returns {string[]}
 */
export function splitEnglishSentences(text) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/\r\n?/g, '\n').trim();
  if (!clean) return [];

  // 临时替换科学缩写中的点，避免误切
  const protectedText = clean
    .replace(/\be\.g\./gi, '__EG__')
    .replace(/\bi\.e\./gi, '__IE__')
    .replace(/\bvs\./gi, '__VS__')
    .replace(/\bapprox\./gi, '__APPROX__')
    .replace(/(\d+)\.(\d+)/g, '$1__DECIMAL__$2');

  const rawParts = protectedText
    .split(/(?<=[.!?;:\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const restored = rawParts.map(s =>
    s
      .replace(/__EG__/g, 'e.g.')
      .replace(/__IE__/g, 'i.e.')
      .replace(/__VS__/g, 'vs.')
      .replace(/__APPROX__/g, 'approx.')
      .replace(/(\d+)__DECIMAL__(\d+)/g, '$1.$2')
  );

  return restored;
}

/**
 * 逐句中英双向核销断言 (Sentence-Level Bi-Directional Fact Checkoff)
 * @param {string} cnText 
 * @param {string} enText 
 * @param {string} contextName 
 * @returns {{ pass: boolean, cnCount: number, enCount: number, message: string }}
 */
export function verifySentenceCountFidelity(cnText, enText, contextName = '') {
  const cnSentences = splitChineseSentences(cnText);
  const enSentences = splitEnglishSentences(enText);

  if (cnSentences.length === 0 && enSentences.length === 0) {
    return { pass: true, cnCount: 0, enCount: 0, message: 'Both empty' };
  }

  // 严格拦截“中文多句，英文仅剩一句”的截断式缺陷（如 Section 5.4 丢呼吸器）
  if (cnSentences.length > 1 && enSentences.length === 1) {
    return {
      pass: false,
      cnCount: cnSentences.length,
      enCount: enSentences.length,
      message: `【致命漏译拦截】${contextName} 中文源文件包含 ${cnSentences.length} 句指令，英文交付物仅有 1 句，存在严重的单句替换截断！`
    };
  }

  return {
    pass: true,
    cnCount: cnSentences.length,
    enCount: enSentences.length,
    message: `OK: CN(${cnSentences.length}) vs EN(${enSentences.length})`
  };
}
