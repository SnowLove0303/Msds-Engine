/**
 * 动态交付矩阵与企业预设解析器 (target-matrix-resolver.js)
 *
 * 贯彻通用性准则（反硬编码、反情景化）：
 * 1. 严禁在代码中写死特定企业名称（如冠志/国彩）或固定 8 格式交付矩阵；
 * 2. 从外部 presets/company_presets.json 动态发现可用企业预设；
 * 3. 支持 --presets / --templates / --languages / --formats / --noPreset 按需派生。
 */

import fs from 'node:fs';
import path from 'node:path';

export function loadPresetsRegistry(presetsPath) {
  if (!presetsPath || !fs.existsSync(presetsPath)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function inferLangFromPresetKey(key, presetObj = {}) {
  if (presetObj.language === 'en' || /^EN_/i.test(key) || /_en$/i.test(key)) return 'en';
  if (presetObj.language === 'zh' || /^CN_/i.test(key) || /_zh$/i.test(key)) return 'zh';
  return 'zh';
}

function normalizePresetKeyForTemplate(key, lang, presetObj = {}) {
  if (presetObj.templateKey) return presetObj.templateKey;
  if (/^(?:CN|EN)_/i.test(key)) return key;
  const base = key.replace(/_(?:zh|en)$/i, '');
  return `${lang === 'en' ? 'EN' : 'CN'}_${base}`;
}

/**
 * 动态解析本次执行的交付目标列表与导出格式
 */
export function resolveDynamicTargets({
  modelCode,
  presetsPath = null,
  presetsRegistry = null,
  presetsArg = null,
  templatesArg = null,
  languagesArg = null,
  formatsArg = 'docx,pdf',
  noPreset = false
} = {}) {
  const registry = presetsRegistry || loadPresetsRegistry(presetsPath);
  const languages = (languagesArg ? String(languagesArg).split(',') : ['zh', 'en'])
    .map(s => s.trim().toLowerCase())
    .filter(s => s === 'zh' || s === 'en');
  const formats = (formatsArg ? String(formatsArg).split(',') : ['docx', 'pdf'])
    .map(s => s.trim().toLowerCase())
    .filter(s => s === 'docx' || s === 'pdf');
  const explicitTemplates = templatesArg
    ? String(templatesArg).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const targets = [];

  if (noPreset) {
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i];
      const tplKey = explicitTemplates[i] || explicitTemplates[0] || (lang === 'en' ? 'EN_Default' : 'CN_Default');
      targets.push({
        templateKey: tplKey,
        presetKey: null,
        language: lang,
        fileName: `${modelCode} msds_${lang === 'en' ? 'EN' : 'CN'}.docx`
      });
    }
    return { targets, languages, formats };
  }

  const allKeys = Object.keys(registry);
  const requestedPresets = presetsArg
    ? String(presetsArg).split(',').map(s => s.trim()).filter(Boolean)
    : allKeys;

  for (const reqKey of requestedPresets) {
    const matchedKey = allKeys.find(k =>
      k === reqKey ||
      k.toLowerCase() === reqKey.toLowerCase() ||
      normalizePresetKeyForTemplate(k, inferLangFromPresetKey(k, registry[k]), registry[k]).toLowerCase() === reqKey.toLowerCase()
    ) || reqKey;

    const presetObj = registry[matchedKey] || {};
    const lang = inferLangFromPresetKey(matchedKey, presetObj);
    if (!languages.includes(lang)) continue;

    const tplKey = explicitTemplates[0] || normalizePresetKeyForTemplate(matchedKey, lang, presetObj);
    const shortName = presetObj.shortName || matchedKey.replace(/_(?:zh|en)$/i, '');
    targets.push({
      templateKey: tplKey,
      presetKey: matchedKey,
      language: lang,
      fileName: `${modelCode} msds_${lang === 'en' ? 'EN' : 'CN'} ${shortName}.docx`
    });
  }

  return { targets, languages, formats };
}
