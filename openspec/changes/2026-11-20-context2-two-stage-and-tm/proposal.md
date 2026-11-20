# Proposal: Context 2 先中后英双阶流程与映射数据库（翻译记忆库）沉淀

## 目标
将 Context 2 治理明确拆分为**先中文治理、后英文逐句翻译**两步闭环，并引入持久化映射数据库（`web/src/translation-memory.json`），让 Agent 只需翻译新句子，已译句子自动沉淀并永久复用，同时增加数字/CAS 守恒机械校验。

## 需求 1:1 映射
- **REQ-01**：Context 2 首轮完成中文结构/内容处理并自动导出 `<MODEL>_untranslated.json`（仅含未命中项，键已归一化预填）。
- **REQ-02**：Agent 回填 `--translations` 且通过校验后，自动将有效译文沉淀写入 `web/src/translation-memory.json`，后续运行自动加载复用。
- **REQ-03**：增加数字/CAS 守恒与零中文残留门禁，确保翻译不丢数值、不留中文。
