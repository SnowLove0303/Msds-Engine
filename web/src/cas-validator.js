/**
 * MSDS Studio 工业级 CAS 注册号国际数学标准校验与化学实体对账中枢
 * (Universal Chemical Abstracts Service Verification & Coherence Engine)
 * 
 * 核心功能：
 * 1. 符合 IUPAC / CAS 国际注册规范的标准格式与加权模 10 校验和算法验证；
 * 2. 化工行业商业秘密（保密、Trade secret、Proprietary）合法豁免断言；
 * 3. 常见溶剂、助剂、树脂双向化学实体字典与张冠李戴防欺诈核对；
 * 4. Section 2 标签有害成分与 Section 3 组分 CAS 跨章节穿透核验。
 */

// 商业机密与法定豁免合法模式
const EXEMPT_CAS_PATTERN = /^(?:商业秘密|商业机密|保密|Trade\s*secret|Proprietary|无|None|Not\s*applicable|[—\-\/])$/i;

// 标准 CAS 格式：2 至 7 位数字 + 短横杠 + 2 位数字 + 短横杠 + 1 位校验码
const CAS_FORMAT_REGEX = /^(\d{2,7})-(\d{2})-(\d)$/;

/**
 * 校验单项 CAS 编号格式与国际数学加权模 10 校验和
 * 
 * @param {string} rawCas
 * @returns {{ valid: boolean, isExempt: boolean, cas: string, calculatedCheckDigit?: number, declaredCheckDigit?: number, reason?: string }}
 */
export function validateCasChecksum(rawCas) {
  if (!rawCas || typeof rawCas !== 'string') {
    return { valid: false, isExempt: false, cas: String(rawCas || ''), reason: 'CAS 编号为空或非法类型' };
  }

  const trimmed = rawCas.trim();
  if (EXEMPT_CAS_PATTERN.test(trimmed)) {
    return { valid: true, isExempt: true, cas: trimmed, reason: '合法商业机密或免填项' };
  }

  const match = trimmed.match(CAS_FORMAT_REGEX);
  if (!match) {
    return {
      valid: false,
      isExempt: false,
      cas: trimmed,
      reason: `CAS 格式非法，不符合标准 2-7位数字-2位数字-1位校验码规范 (实测: "${trimmed}")`
    };
  }

  const part1 = match[1];
  const part2 = match[2];
  const declaredCheckDigit = parseInt(match[3], 10);

  // 拼接校验码前全部数字: [d_N, ..., d_2, d_1]
  const digitsBeforeCheck = (part1 + part2).split('').map(d => parseInt(d, 10));
  
  // 国际 CAS 加权模 10 算法：从倒数第一位向左，权重依次为 1, 2, 3, ...
  let weightedSum = 0;
  const len = digitsBeforeCheck.length;
  for (let i = 0; i < len; i++) {
    const digit = digitsBeforeCheck[len - 1 - i]; // 从右向左
    const weight = i + 1;
    weightedSum += digit * weight;
  }

  const calculatedCheckDigit = weightedSum % 10;
  const isValid = calculatedCheckDigit === declaredCheckDigit;

  return {
    valid: isValid,
    isExempt: false,
    cas: trimmed,
    calculatedCheckDigit,
    declaredCheckDigit,
    reason: isValid ? '校验和正确' : `加权校验和不匹配 (计算值: ${calculatedCheckDigit}, 声明值: ${declaredCheckDigit})`
  };
}

/**
 * 核心高频工业化学品与 CAS 权威映射库 (用于防张冠李戴与实体一致性核对)
 */
export const COMMON_CHEMICAL_CAS_MAP = Object.freeze({
  '107-98-2': {
    standardNameCn: '1-甲氧基-2-丙醇',
    standardNameEn: '1-Methoxy-2-propanol',
    aliasesCn: ['1-甲氧基-2-丙醇', '丙二醇甲醚', '丙二醇-1-甲醚', '1-甲氧基丙醇-2', 'PGME'],
    aliasesEn: ['1-methoxy-2-propanol', 'propylene glycol monomethyl ether', '1-methoxypropan-2-ol', 'pgme']
  },
  '7732-18-5': {
    standardNameCn: '水',
    standardNameEn: 'Water',
    aliasesCn: ['水', '纯水', '去离子水', '蒸馏水'],
    aliasesEn: ['water', 'deionized water', 'aqua', 'purified water']
  },
  '67-63-0': {
    standardNameCn: '异丙醇',
    standardNameEn: 'Isopropanol',
    aliasesCn: ['异丙醇', '2-丙醇', '二甲基甲醇', 'IPA'],
    aliasesEn: ['isopropanol', 'isopropyl alcohol', '2-propanol', 'ipa']
  },
  '111-76-2': {
    standardNameCn: '乙二醇单丁醚',
    standardNameEn: '2-Butoxyethanol',
    aliasesCn: ['乙二醇单丁醚', '丁基溶纤剂', '防白水', 'BCS'],
    aliasesEn: ['2-butoxyethanol', 'ethylene glycol monobutyl ether', 'butyl cellosolve']
  },
  '112-34-5': {
    standardNameCn: '二乙二醇单丁醚',
    standardNameEn: '2-(2-Butoxyethoxy)ethanol',
    aliasesCn: ['二乙二醇单丁醚', '二甘醇单丁醚', '大防白水', 'BDG'],
    aliasesEn: ['2-(2-butoxyethoxy)ethanol', 'diethylene glycol monobutyl ether', 'butyl diglycol']
  },
  '34590-94-8': {
    standardNameCn: '二丙二醇甲醚',
    standardNameEn: 'Dipropylene glycol monomethyl ether',
    aliasesCn: ['二丙二醇甲醚', '二丙二醇单甲醚', 'DPM'],
    aliasesEn: ['dipropylene glycol monomethyl ether', 'dpm']
  },
  '121-44-8': {
    standardNameCn: '三乙胺',
    standardNameEn: 'Triethylamine',
    aliasesCn: ['三乙胺', 'N,N-二乙基乙胺', 'TEA'],
    aliasesEn: ['triethylamine', 'tea']
  },
  '108-01-0': {
    standardNameCn: '2-二甲氨基乙醇',
    standardNameEn: '2-Dimethylaminoethanol',
    aliasesCn: ['2-二甲氨基乙醇', '二甲基乙醇胺', 'DMEA'],
    aliasesEn: ['2-dimethylaminoethanol', 'dimethylethanolamine', 'dmea']
  },
  '28182-81-2': {
    standardNameCn: '六亚甲基二异氰酸酯低聚物',
    standardNameEn: 'Hexamethylene diisocyanate oligomers',
    aliasesCn: ['六亚甲基二异氰酸酯低聚物', 'HDI三聚体', '聚异氰酸酯', 'HDI缩二脲', '水性固化剂'],
    aliasesEn: ['hexamethylene diisocyanate oligomers', 'hdi trimer', 'polyisocyanate', 'aliphatic polyisocyanate']
  },
  '822-06-0': {
    standardNameCn: '六亚甲基二异氰酸酯',
    standardNameEn: 'Hexamethylene diisocyanate',
    aliasesCn: ['六亚甲基二异氰酸酯', '1,6-己二异氰酸酯', 'HDI单体', 'HDI'],
    aliasesEn: ['hexamethylene diisocyanate', '1,6-hexamethylene diisocyanate', 'hdi']
  }
});

/**
 * 核查化学品名称与 CAS 编号的语义一致性 (防张冠李戴与最长别名精准消歧)
 * 
 * @param {string} chemName 化学品中文或英文名称
 * @param {string} casString CAS 注册号
 * @returns {{ coherent: boolean, reason: string }}
 */
export function verifyChemicalCasCoherence(chemName, casString) {
  if (!chemName || !casString) return { coherent: true, reason: '缺失名称或 CAS，跳过语义比对' };
  
  const valRes = validateCasChecksum(casString);
  if (valRes.isExempt) return { coherent: true, reason: '商业机密或豁免项，语义合规' };
  if (!valRes.valid) return { coherent: false, reason: `CAS 自身校验不通过: ${valRes.reason}` };

  const cas = valRes.cas;
  const nameClean = String(chemName).trim().toLowerCase();

  // 在全部收录的化学品字典中寻找最长/最精准匹配实体 (Longest Specific Entity Resolution)
  let bestCandidate = null;
  let maxScore = 0;

  for (const [candidateCas, candidateEntry] of Object.entries(COMMON_CHEMICAL_CAS_MAP)) {
    const allAliases = [...candidateEntry.aliasesCn, ...candidateEntry.aliasesEn];
    for (const rawAlias of allAliases) {
      const alias = rawAlias.toLowerCase();
      let score = 0;
      if (nameClean === alias) {
        score = 10000 + alias.length;
      } else if (nameClean.includes(alias)) {
        score = 1000 + alias.length;
      } else if (alias.includes(nameClean) && nameClean.length >= 3) {
        score = 100 + nameClean.length;
      }

      if (score > maxScore) {
        maxScore = score;
        bestCandidate = {
          cas: candidateCas,
          entry: candidateEntry,
          matchedAlias: rawAlias,
          score
        };
      }
    }
  }

  // 若找到了明确收录的候选化学品
  if (bestCandidate) {
    if (bestCandidate.cas === cas) {
      return {
        coherent: true,
        reason: `化学名称 "${chemName}" 与 CAS ${cas} 实体完全一致 (${bestCandidate.entry.standardNameCn} / ${bestCandidate.entry.standardNameEn})`
      };
    } else {
      // 当前填报的 CAS 与最佳匹配实体的 CAS 不一致 -> 重大实体错位 (张冠李戴)
      const currentEntry = COMMON_CHEMICAL_CAS_MAP[cas];
      const currentDesc = currentEntry ? `${currentEntry.standardNameCn} (${cas})` : cas;
      return {
        coherent: false,
        reason: `重大实体错位警报：名称 "${chemName}" (匹配别名 "${bestCandidate.matchedAlias}") 实际对应 CAS ${bestCandidate.cas} (${bestCandidate.entry.standardNameCn})，但当前填报了 CAS ${cas} (${currentDesc})！`
      };
    }
  }

  // 若名称未命中任何已收录词条，但 CAS 本身属于已收录化学品
  if (COMMON_CHEMICAL_CAS_MAP[cas]) {
    return {
      coherent: true,
      reason: `CAS ${cas} 格式与校验和合法，对应标准化学品 ${COMMON_CHEMICAL_CAS_MAP[cas].standardNameCn}`
    };
  }

  return { coherent: true, isUnregistered: true, reason: '定制树脂或未收录特殊化学品，格式与校验和合法' };
}

/**
 * Section 3 组分列表全量 CAS 格式与校验和法医级审计
 * 
 * @param {Array<{ name: string, cas: string, conc?: string }>} components
 * @returns {{ allValid: boolean, passCount: number, failCount: number, details: Array<any> }}
 */
export function auditSection3CasList(components = []) {
  const details = [];
  let allValid = true;
  let passCount = 0;
  let failCount = 0;

  for (const comp of components) {
    const cas = comp.cas || '';
    const name = comp.name || '';
    const res = validateCasChecksum(cas);
    const coh = verifyChemicalCasCoherence(name, cas);

    const isPass = res.valid && coh.coherent;
    if (!isPass) {
      allValid = false;
      failCount++;
    } else {
      passCount++;
    }

    details.push({
      name,
      cas,
      valid: res.valid,
      isExempt: res.isExempt,
      calculatedCheckDigit: res.calculatedCheckDigit,
      declaredCheckDigit: res.declaredCheckDigit,
      coherent: coh.coherent,
      message: !res.valid ? res.reason : (!coh.coherent ? coh.reason : '通过')
    });
  }

  return { allValid, passCount, failCount, details };
}

/**
 * Section 2.2 标签有害成分穿透 Section 3 组分核对 (支持中英跨语言与 CAS 实体对账)
 * 
 * @param {string} section2Text
 * @param {Array<{ name: string, cas: string }>} section3Components
 * @returns {{ coherent: boolean, matchedSubstance?: string, matchedCas?: string, reason: string }}
 */
export function auditSection2HazardousCasCoherence(section2Text = '', section3Components = []) {
  const text = String(section2Text || '');

  // 提取必须列在标签上的有害成分 (如 "必须列在标签上的有害成分：丙二醇甲醚" / "Hazardous components which must be listed on the label: 1-Methoxy-2-propanol")
  const mCn = text.match(/(?:必须列在标签上的有害成[份分]|需要注意的物质)[：:\s]+([^\r\n；;。]+)/i);
  const mEn = text.match(/(?:Hazardous components which must be listed on the label|Substances of concern)[：:\s]+([^\r\n;.]+)/i);

  const rawSubstance = (mCn ? mCn[1] : (mEn ? mEn[1] : '')).trim();
  if (!rawSubstance || /^(?:无|None|Not applicable|—)$/i.test(rawSubstance)) {
    return { coherent: true, reason: 'Section 2 未载明特定标签有害成分或声明为无' };
  }

  // 1. 在 Section 3 直接按名称精确匹配
  const sClean = rawSubstance.toLowerCase();
  let matchedComp = section3Components.find(c => {
    const cName = (c.name || '').toLowerCase();
    return cName === sClean;
  });

  // 2. 若未直接命中，通过化学品实体消歧匹配 (利用 verifyChemicalCasCoherence)
  if (!matchedComp) {
    let substanceCas = null;
    for (const testCas of Object.keys(COMMON_CHEMICAL_CAS_MAP)) {
      const coh = verifyChemicalCasCoherence(rawSubstance, testCas);
      if (coh.coherent && !coh.isUnregistered) {
        substanceCas = testCas;
        break;
      }
    }

    if (substanceCas) {
      matchedComp = section3Components.find(c => {
        if (c.cas === substanceCas) return true;
        const coh = verifyChemicalCasCoherence(c.name, substanceCas);
        return coh.coherent && !coh.isUnregistered;
      });
    } else {
      // 若 rawSubstance 不在已知字典中（例如特殊未收录品），尝试宽松名称匹配（两边长度均 >= 3）
      matchedComp = section3Components.find(c => {
        const cName = (c.name || '').toLowerCase();
        return (cName.length >= 3 && sClean.length >= 3) && (cName.includes(sClean) || sClean.includes(cName));
      });
    }
  }

  if (!matchedComp) {
    return {
      coherent: false,
      matchedSubstance: rawSubstance,
      reason: `Section 2 声明的标签有害成分 "${rawSubstance}" 未在 Section 3 组分表中列出！`
    };
  }

  // 校验 Section 3 该成分的 CAS
  const casRes = validateCasChecksum(matchedComp.cas);
  if (!casRes.valid) {
    return {
      coherent: false,
      matchedSubstance: rawSubstance,
      matchedCas: matchedComp.cas,
      reason: `Section 2 标签有害成分 "${rawSubstance}" 在 Section 3 中的 CAS "${matchedComp.cas}" 校验失败: ${casRes.reason}`
    };
  }

  return {
    coherent: true,
    matchedSubstance: rawSubstance,
    matchedCas: matchedComp.cas,
    reason: `Section 2 标签有害成分 "${rawSubstance}" 在 Section 3 成功穿透对齐 (CAS: ${matchedComp.cas})`
  };
}
