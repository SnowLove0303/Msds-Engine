# Design: PR-4 参数化机械审计与词库外置

## 1. 参数化审计 (`staged-mechanical-audit.js`)
- `resolveExpectedSectionNumbers(templateProfile, fallbackObj = null)`：若传入 `templateProfile.sections`，提取其 `sectionNumber` 列表；否则回退为 `1..16`。
- `auditPhase1Context1({ sourcePath, context1, templateProfile })` 与 `auditPhase2Context2({ context2, templateProfile })` 均使用该函数决定待检章节集合。

## 2. 词库外置 (`base-translation-dict.json`)
- 新增 `web/src/base-translation-dict.json` 存放基准化工双语词典；
- `web/src/context-governor.js` 提供 `loadBaseTranslationDict()` 并导出 `CHEMICAL_TRANSLATION_DICT = Object.freeze(loadBaseTranslationDict())`。
