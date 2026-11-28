# Design: PR-3 Context 2 通用分类与可插拔 Rule Pack

## 1. 规则包定义 (`rule-pack-registry.js`)
- `PURE_SOURCE_PRESERVATION`：
  - `s2InjectParents: false`
  - `s2InjectPSubLabels: false`
  - `s2RenumberFrom21: false`
  - `s2PruneEmptyNonHaz: false`
  - `s2UseLegacyRegex: false`（使用 `classifyLineByGenericFeatures` 通用特征分类）
  - `s8CanonicalOrder: false`
  - `require16Sections: false`
- `CN_GB_MSDS_DEFAULT`：保留既有国标/企业规范行为，确保现有 16 章节标品 100% 向后兼容。

## 2. 通用特征行分类 (`classifyLineByGenericFeatures`)
- 支持 `roleOverrides[line]` 显式覆盖（Agent 语义大脑标注）；
- 否则依据通用句法与编号特征判定：
  - `^\d+\.\d+(?:\.\d+)*\b` 或 `^(?:[一二三四五六七八九十]+、|\([0-9]+\))` -> `PARENT_HEADER`（`indentDxa: 0`, `boldLabel: true`）
  - `^[^：:\n]{1,40}[：:]` -> `SUB_LABEL_KV`（`indentDxa: 480`, `boldLabel: true`）
  - 其余 -> `VALUE_LINE`（`indentDxa: 480`, `boldLabel: false`）
