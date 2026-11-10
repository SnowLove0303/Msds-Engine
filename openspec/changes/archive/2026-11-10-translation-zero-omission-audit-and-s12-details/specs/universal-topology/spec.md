# Spec: 双语翻译逐行逐句细节零遗漏与 Section 12.2 降解实验保真规范

## ADDED Requirements

### Requirement: REQ-TRANS-01: Section 12.2 持久性和降解性英文翻译细节 100% 物理保真
The system SHALL preserve all numerical values, test durations, method guidelines, and qualitative statements in Section 12.2 English translation.

#### Scenario: Translating detailed biodegradability test data in Section 12.2
- **WHEN** Chinese Section 12.2 contains biodegradability test percentage (e.g. `＜60%`), duration (`28d`), qualitative statement (`该产品不易生物降解`), method guideline (`OECD化学品测试指南301D`), and similar product reference
- **THEN** English output SHALL translate all details without omissions: `Biodegradability: < 60 %, 28 d, the product is not readily biodegradable. Method: OECD Test Guideline 301D. Studies on a similar product.`

### Requirement: REQ-TRANS-02: 执行层双语翻译细节零遗漏逐行逐句机械硬阻断门禁
The system SHALL verify that all numeric values and guideline references in Chinese cells are present in the corresponding English cells.

#### Scenario: Running Master MSDS Audit with translation zero-omission check
- **WHEN** Master MSDS Audit executes Ring 4 bilingual parity inspection
- **THEN** It SHALL assert that Section 12.2 retains `< 60 %` and `301D`, and that all OECD guidelines and core metrics across sections match between Chinese and English
- **THEN** Any omission SHALL trigger audit rejection with non-zero exit code
