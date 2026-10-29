# Proposal: 英文版全章节说明行 9.5pt 正文字号统一规范与下沉 (除 Section 2 外)

## 1. 背景与痛点穿透 (Background & 5-Whys)
- **用户痛点**：用户在复查英文版交付物时敏锐发现：
  * *“No toxicological studies were available for this product. The following is toxicological data for N,N-Dimethylacetamid 为什么看起来比其他值字体要大一些，是不是我没把说明行归类为值属性的原因？”*
- **5-Whys 根因**：
  1. **层级割裂**：此前将前言行独立视为“通栏说明语”，在 `formatSection11PreambleRow` 中硬编码了中文正文字号五号 12pt（`<w:sz w:val="24"/>`）；
  2. **中英文字号断层**：中文版普通值也是 12pt（五号），中文字号均一；但在英文版中，普通表格值是 9.5pt（`sz="19"`），前言行使用 12pt（`sz="24"`）产生了整整 2.5pt（大出 26.3%）的突兀断层；
  3. **架构归位缺失**：未将英文说明行纳入“英文表格值属性（Value 语义）”进行统一渲染；
  4. **全章节一致性要求**：用户明确定夺：采用方案 A，后续所有 Section 涉及到说明行的均采用 9.5pt（除了 Section 2 保持豁免）。

## 2. 1:1 需求物理对账矩阵 (RTM)
- **REQ-S11-01**: 英文版 Section 11 Row 1（产品免责说明行）与 Row 2（前言行）字号下沉为 9.5pt（`sz="19"` 与 `szCs="19"`）；
- **REQ-GEN-02**: 除 Section 2 外，英文版所有章节说明行（如 Section 12、13 等）字号统一收敛为 9.5pt（`sz="19"`）；
- **REQ-S2-EXEMPT**: 英文版 Section 2 危险性分类与标签要素保持现状绝对豁免，不降级；
- **REQ-CN-PRESERVE**: 中文版全章节说明行保持五号字 12pt（`sz="24"`）现状不变；
- **REQ-AUDIT-UPDATE**: 机械审计套件新增英文版说明行 9.5pt 物理硬断言。
