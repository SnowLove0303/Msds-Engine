# Spec: 场景B - 22款产品全量交付物标准化刷新与全景深度审计

## ADDED Requirements

### Requirement: 22款产品 176份全量交付物批处理覆盖刷新 (REQ-SCENARIO-B-01)
系统 SHALL 针对 11 月 16 日改动的 22 款产品（涵盖 4 个品类），依次基于产品事实源文件与升级后的通用流水线，重新生成并无损覆盖 88 份 DOCX 与 88 份 PDF 交付物。

#### Scenario: 22款产品交付物矩阵生成
- **GIVEN** 22 款产品的源文件材料与已修复的通用母版流水线
- **WHEN** 触发场景 B 批量刷新作业
- **THEN** 系统 SHALL 在各自目标型号目录下生成 4 份 DOCX 与 4 份 PDF（冠志中/英、国彩中/英）
- **AND** 全量 176 份交付物文件物理存在且文件大小均大于 20KB。

### Requirement: 国彩企业主体法定命名全量统一 (REQ-SCENARIO-B-02)
系统 SHALL 在所有国彩版本（中文与英文）产出物的第 1 部分供应商信息及页脚左侧单元格中，强制使用最新法定全称，严禁出现废弃旧称。

#### Scenario: 中文国彩版主体名称验证
- **GIVEN** 任意一款产品的国彩中文版交付物（`*msds_CN 国彩.docx` 与 `*msds_CN 国彩.pdf`）
- **WHEN** 检索企业主体元数据及页脚文本
- **THEN** 供应商全称与页脚左侧企业名称 SHALL 为 `英德市国彩精细化工有限公司`
- **AND** 废弃名称“英德市国彩新材料有限公司”检索出现次数 SHALL 为 0。

#### Scenario: 英文国彩版主体名称验证
- **GIVEN** 任意一款产品的国彩英文版交付物（`*msds_EN Guocai.docx` 与 `*msds_EN Guocai.pdf`）
- **WHEN** 检索企业主体元数据及页脚文本
- **THEN** 供应商全称与页脚左侧企业名称 SHALL 为 `Yingde Guocai Fine Chemical Co., Ltd.`
- **AND** 废弃名称 `Yingde Guocai New Material Co., Ltd.` 检索出现次数 SHALL 为 0。

### Requirement: 页脚修订日期与实体名称 Y 轴水平基准线严密齐平 (REQ-SCENARIO-B-03)
系统 SHALL 确保页脚第 0 行右侧单元格与左侧单元格在垂直对齐特性与段落行距基准上保持一致，消除垂直 Y 轴漂移。

#### Scenario: 页脚垂直对齐与行距控制
- **GIVEN** 生成的 Word 交付物底层的 `word/footer1.xml`
- **WHEN** 检查第 0 行右侧修订日期单元格
- **THEN** 其单元格属性 `w:tcPr` SHALL 包含 `<w:vAlign w:val="center"/>`
- **AND** 其段落属性 `w:pPr` SHALL 包含 `<w:spacing w:line="0" w:lineRule="atLeast"/>`
- **AND** PyMuPDF 实测页脚第 0 行左右文本外接矩形垂直中心坐标差满足：
  $$\Delta Y = |Y_{\text{center, left}} - Y_{\text{center, right}}| \le 1.5\text{ pt}$$

### Requirement: 页脚页码字号物理规格严格恢复标准 9pt (REQ-SCENARIO-B-04)
系统 SHALL 确保生成的页脚页码域（PAGE / NUMPAGES）及其文本 Run 的字号严格锁定为 9pt（Word 底层 18 半磅），杜绝 12pt（24半磅）的突兀放大。

#### Scenario: 页脚页码 Run 属性与外接矩形实测
- **GIVEN** 生成的 Word 交付物底层 `word/footer1.xml` 中的页码段落
- **WHEN** 遍历所有页码文本及域代码的 `<w:rPr>`
- **THEN** `<w:sz>` 与 `<w:szCs>` 属性值 SHALL 严格等于 `18`
- **AND** 0 处存在 `val="24"`（12pt）
- **AND** PyMuPDF 实测页脚页码数字的外接矩形高度满足：
  $$H_{\text{box}} \le 13.5\text{ pt}$$

### Requirement: 页脚残存伪字符与排版瑕疵彻底清零 (REQ-SCENARIO-B-05)
系统 SHALL 彻底清除历史偶发的 `"P修订日期"` 伪字符前缀、异形窄空格（`\u2005`）及日期末尾的尾随空白符。

#### Scenario: 伪字符与异常空格零残留
- **GIVEN** 22 款产品共 176 份终验交付物
- **WHEN** 执行正则表达式全文检索
- **THEN** 匹配正则 `/P\s*修订日期/i` 的命中次数 SHALL 为 0
- **AND** 匹配字符 `\u2005` 的命中次数 SHALL 为 0。

### Requirement: 源文件化学事实 100% 守恒与双轨两阶 165 项对账 (REQ-SCENARIO-B-06)
系统 SHALL 确保 22 款产品在第 1 至第 16 部分的所有化学事实（CAS 号、组分百分比范围、GHS 危险性说明、防范说明、理化特性等）100% 忠实溯源自源文件，并通过双轨两阶 165 项全要素审计。

#### Scenario: 全要素无损对账与双极双层审计
- **GIVEN** 22 款产品的源文件与刷新后的交付物
- **WHEN** 运行双极双层 165 项法医级全要素审计流水线
- **THEN** 所有 22 款产品的审计退出码 SHALL 为 0
- **AND** 核心化学指标无任何缺失、无防御性捏造或越界篡改。
