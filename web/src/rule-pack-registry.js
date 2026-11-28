/**
 * MSDS-Studio 可插拔规范规则包注册表 (rule-pack-registry.js)
 *
 * 核心定位:
 * 1. 将“通用结构特征识别”与“特定标准/客户改写规则（如 S2 自动补全 2.1/2.2、2.0 重排、S8 强制重排）”彻底解耦；
 * 2. 支持 PURE_SOURCE_PRESERVATION（通用保真模式）与 CN_GB_MSDS_DEFAULT（既有国标企业规范）按需切换。
 */

export const RULE_PACKS = Object.freeze({
  PURE_SOURCE_PRESERVATION: Object.freeze({
    name: 'PURE_SOURCE_PRESERVATION',
    s2InjectParents: false,
    s2InjectPSubLabels: false,
    s2RenumberFrom21: false,
    s2PruneEmptyNonHaz: false,
    s2UseLegacyRegex: false,
    s8CanonicalOrder: false,
    require16Sections: false
  }),
  CN_GB_MSDS_DEFAULT: Object.freeze({
    name: 'CN_GB_MSDS_DEFAULT',
    s2InjectParents: true,
    s2InjectPSubLabels: true,
    s2RenumberFrom21: true,
    s2PruneEmptyNonHaz: true,
    s2UseLegacyRegex: true,
    s8CanonicalOrder: true,
    require16Sections: true
  })
});

export function resolveRulePack(rulePackInput) {
  if (!rulePackInput) return RULE_PACKS.CN_GB_MSDS_DEFAULT;
  if (typeof rulePackInput === 'string') {
    return RULE_PACKS[rulePackInput] || RULE_PACKS.CN_GB_MSDS_DEFAULT;
  }
  if (typeof rulePackInput === 'object') {
    const base = RULE_PACKS[rulePackInput.extends || 'PURE_SOURCE_PRESERVATION'] || RULE_PACKS.PURE_SOURCE_PRESERVATION;
    return { ...base, ...rulePackInput };
  }
  return RULE_PACKS.CN_GB_MSDS_DEFAULT;
}

/**
 * 基于通用句法与结构特征对大纲行进行角色分类（不依赖特定行业/产品词表硬编码）
 */
export function classifyLineByGenericFeatures(line, { override = null } = {}) {
  if (override && typeof override === 'object' && override.subRole) {
    return {
      subRole: override.subRole,
      boldLabel: override.boldLabel ?? (override.subRole !== 'VALUE_LINE'),
      boldValue: Boolean(override.boldValue),
      indentDxa: override.indentDxa ?? (override.subRole === 'PARENT_HEADER' ? 0 : 480)
    };
  }

  const l = String(line || '').trim();
  // 1. 多级编号标题 (如 2.1 xxx, 2.2.1 xxx, (1) xxx, 一、xxx) -> PARENT_HEADER
  if (/^(?:\d+\.\d+(?:\.\d+)*\b|[一二三四五六七八九十]+、|\(\d+\)\s*\S)/.test(l)) {
    return { subRole: 'PARENT_HEADER', boldLabel: true, boldValue: false, indentDxa: 0 };
  }
  // 2. 带有明确冒号分隔的短标签键值对 (如 "Signal word: Warning" / "信号词：警告") -> SUB_LABEL_KV
  if (/^[^：:\n]{1,48}[：:]/.test(l)) {
    return { subRole: 'SUB_LABEL_KV', boldLabel: true, boldValue: false, indentDxa: 480 };
  }
  // 3. 普通说明/数值行 -> VALUE_LINE
  return { subRole: 'VALUE_LINE', boldLabel: false, boldValue: false, indentDxa: 480 };
}
