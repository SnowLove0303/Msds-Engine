/**
 * 冠志官方 MSDS & TDS 中英文保真映射翻译集 (Bilingual Mapping Translation Set)
 * 语料源自: E:\冠志\TDS MSDS (2)\TDS MSDS (112 对 MSDS + 11 对 TDS 官方双语真理对)
 * 
 * 核心不变量与翻译铁律:
 * 1. 严禁中英文内容不对应: 禁止私自改动、更换表述、自作聪明升级表述(严禁擅自添加测试动物物种、观察周期等未测细节)。
 * 2. 精简专业: 严格采纳冠志官方国际化工合规术语。
 */

const BILINGUAL_DICTIONARY = require('./translation-map.json');

/**
 * 核心翻译与对齐检索函数
 * @param {string} sectionKey 章节键名，例如 'section_1_categories', 'section_9_values', 'section_11_toxicology', 'tds_mappings'
 * @param {string} cnText 中文原文字符串
 * @returns {string} 精准对齐的英文译文；若未收录且禁止自由发挥，返回空或原词
 */
function translateStandardTerm(sectionKey, cnText) {
  if (!cnText || typeof cnText !== 'string') return '';
  const cleanCn = cnText.trim().replace(/[：:;,，。]+$/, '');
  
  const dict = BILINGUAL_DICTIONARY[sectionKey];
  if (dict && dict[cleanCn]) {
    return dict[cleanCn];
  }
  
  // 全局定性词与通用标量查找
  if (BILINGUAL_DICTIONARY.section_9_values && BILINGUAL_DICTIONARY.section_9_values[cleanCn]) {
    return BILINGUAL_DICTIONARY.section_9_values[cleanCn];
  }
  if (BILINGUAL_DICTIONARY.section_11_toxicology && BILINGUAL_DICTIONARY.section_11_toxicology[cleanCn]) {
    return BILINGUAL_DICTIONARY.section_11_toxicology[cleanCn];
  }
  
  return null;
}

module.exports = {
  BILINGUAL_DICTIONARY,
  translateStandardTerm
};
