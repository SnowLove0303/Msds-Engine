# EP-1404 产出物全景物理敌手审计与核心问题定向核销报告 (新批次深度全览版)

**产品型号**: EP-1404 (无水环氧树脂 / Anhydrous Epoxy Resin)  
**审计报告编号**: `AUDIT-EP1404-20261109-COGNITIVE-MASTER`  
**审计执行角色**: MSDS Deliverables Adversarial Auditor (最高独立执裁敌手审计组)  
**审计批次时间**: 2026-11-09 11:06:26 ~ 11:06:32 (MSDS 8 份新交付物) / 2026-11-06 15:36:58 (TDS)  
**核验资产全景**:
- **权威源资产**:
  * MSDS 源文件: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP\EP-1404\EP-1404msds_CN 冠志_.pdf` (及其附属源 `EP-1404 msds_CN 冠志.docx`)
  * TDS 源文件: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP\EP-1404\EP-1404 tds_CN 冠志___.pdf`
- **待审计交付物 (最新生成产出物)**:
  * `EP-1404 msds_CN 冠志.docx` (29,655 B) & `EP-1404 msds_CN 冠志.pdf` (242,243 B)
  * `EP-1404 msds_CN 国彩.docx` (29,644 B) & `EP-1404 msds_CN 国彩.pdf` (242,443 B)
  * `EP-1404 msds_EN Guanzhi.docx` (28,386 B) & `EP-1404 msds_EN Guanzhi.pdf` (175,661 B)
  * `EP-1404 msds_EN Guocai.docx` (28,354 B) & `EP-1404 msds_EN Guocai.pdf` (174,268 B)
  * `EP-1404 tds_CN 冠志.docx` (22,814 B) & `EP-1404 tds_CN 冠志.pdf` (122,778 B)
  * `EP-1404 tds_EN Guanzhi.docx` (21,872 B) & `EP-1404 tds_EN Guanzhi.pdf` (180,797 B)
- **法定白名单基准**: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\audit\legal-invariants-oracle.json`

---

## 1. 核心执裁聚焦：三大致命核心问题判定 (Executive Focus on 3 Core Issues)

通过深入底层 OpenXML (`document.xml`) 与导出的 PDF 物理文本流进行逐行逐格对账，当前 EP-1404 最关键的退化与缺陷已高度收敛为三大核心问题：

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              当前交付物三大致命核心问题汇总                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. 标点符号系统性缺失 (Punctuation Fidelity):                                          │
│    - 英文版全篇陈述句句末西文句点「.」系统性丢失 (25+ 处)；软换行多句行末均无标点；    │
│    - 全角字符与标点泄漏 (Table 3 出现全角「＞73」，TDS 出现中文全角「：」和「【】」)。  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. 英文版 Section 8 标签字号格式失控 (Font Size Hierarchy Inversion):                  │
│    - 章大标题仅 11pt (sz=22)，其他章节小标签仅 9.5pt (sz=19)；                         │
│    - 唯独 Table 8 子标签全部暴增至 12pt (sz=24)！造成子标签比章标题大两号的层级严重倒挂！ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. 中英文版 Section 3 的「3.2 Ingredients:」文本格式（字号与加粗）错误:                │
│    - 【加粗丢失】：中文母版 Row 2「成分」为粗体，英文 Row 1「3.1 Product type:」为粗体； │
│      但产出物中，中文 Row 2「成分」和英文 Row 2「3.2  Ingredients:」居然全部为细体未加粗！│
│    - 【编号缺失】：中文版 Row 2 仅有「成分」，丢失了「3.2  」层级编号；                 │
│    - 【字号脱节】：英文 Row 2「3.2  Ingredients:」退化为 19 (9.5pt) 细体，失去小标题权重。│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心问题一：标点符号系统性缺失与泄漏深度取证

### 2.1 英文描述性陈述句句末西文句点 `.` 全局性遗漏 (25+ 处)
- **实测证据**:
  实测全篇英文交付物中，**有 25 处以上完整描述性陈述句末尾缺失西文句号 `.`**：
  * **Section 2**:
    - `Chronic aquatic toxicity (Category 3), H412` (无 `.`)
    - `H412 Harmful to aquatic life with long lasting effects` (无 `.`)
    - `P273 Avoid release to the environment` (无 `.`)
    - `P501 Dispose of contents/container to an approved waste disposal plant` (无 `.`)
    - `No applicable information` (无 `.`)
  * **Section 4 (急救措施)**:
    - 4.1: `Remove all contaminated clothing immediately` (无 `.`)
    - 4.2: `Do NOT induce vomiting. Seek medical attention immediately` (无 `.`)
    - 4.3: `...Consult an ophthalmologist` (无 `.`)
    - 4.4: `...seek medical advice` (无 `.`)
    - 4.5: `...seek medical advice` (无 `.`)
  * **Section 5 (消防措施)**:
    - 5.1: `...use water spray` (无 `.`)
    - 5.2: `High-volume water jet` (无 `.`)
    - 5.3: `...trace amounts of hydrogen cyanide` (无 `.`)
    - 5.4: `...do not breathe fumes/smoke` (无 `.`)
  * **Section 6 (泄漏应急)**:
    - 6.1: `...Keep unauthorized persons away` (无 `.`)
    - 6.2: `Do not discharge into drains, wastewater, or soil` (无 `.`)
    - 6.3: `...store in tightly closed containers` (无 `.`)
  * **Section 7 (操作储存)**:
    - 7.1: `...Change contaminated or soaked clothing` (无 `.`)
    - 7.2: `...in our technical data sheet` (无 `.`)
  * **Section 8 (个人防护)**:
    - 呼吸防护: `...required during spraying` (无 `.`)
    - 建议: `Discard contaminated gloves` (无 `.`)
    - 眼睛: `Wear protective goggles/face shield` (无 `.`)
    - 身体: `Wear appropriate protective clothing` (无 `.`)
    - 8.2: `...under EC Directive 2006/121/EC` (无 `.`)
  * **Section 10 (稳定性)**:
    - 10.1: `...according to specifications` (无 `.`)
    - 10.2: `...thermal decomposition` (无 `.`)
    - 10.3: `...handled correctly` (无 `.`)
  * **Section 11 (毒理)**:
    - `No toxicological studies were available for this product` (无 `.`)
  * **Section 12 (生态)**:
    - 12.1: `...soil` (无 `.`)、12.2: `...biodegradable` (无 `.`)、12.3: `...fish and daphnia` (无 `.`)
  * **Section 13 (废弃)**:
    - Row 1: `...local regulations` (无 `.`)、Row 2: `...(EWC)` (无 `.`)、Row 3: `...via wastewater` (无 `.`)
  * **Section 14 (运输)**:
    - 14.1: `...ADG regulations` (无 `.`)、14.2: `...IMDG regulations` (无 `.`)、14.3: `...IATA regulations` (无 `.`)、14.4: `...acids and bases` (无 `.`)
  * **Section 16 (其他)**:
    - `...unless specified in the text` (无 `.`)
  *对照中文版实测*：中文版全文档所有陈述句均有完整全角句号 `。`！

### 2.2 多句软换行 `<w:br/>` 行末无标点
- **实测证据**:
  Table 5 Row 4 (5.4 消防措施)、Table 6 Row 1 (6.1 泄漏应急)、Table 7 Row 1 (7.1 操作防范)、Table 13 Row 3 (废弃处置)、Table 14 Row 4 (14.4 用户注意事项) 在底层 OpenXML 中将多句揉在同一个 `<w:p>` 段落中，使用 `<w:br/>` 软换行分行，且每一行末尾均无标点符号！

### 2.3 全角中文字符与标点泄漏
- **实测证据**:
  - `EP-1404 msds_EN Guanzhi.docx` Table 3 Row 4 Cell 2: `＞73`（字符 `＞` 为全角全宽字符 `U+FF1E`，而非 ASCII 半角 `>` `U+003E`）；
  - `EP-1404 tds_EN Guanzhi.docx`:
    * `Tel：020-82567990`（中文全角冒号 `：` U+FF1A）
    * `Fax：020-32214789`（中文全角冒号 `：` U+FF1A）
    * `Address：Room 1106...`（中文全角冒号 `：` U+FF1A）
    * `【Product Description】`、`【Technical Data】`、`【Product Features】`（中文全角括号 `【】` U+3010, U+3011）。

---

## 3. 核心问题二：英文版 Section 8 标签字号格式失控（层级严重倒挂）

### 3.1 底层 OpenXML 与 PDF 字符流证据链
```xml
<!-- 1. 全篇章大标题 (Row 0): 11pt -->
<w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>8. Exposure control / personal protection</w:t></w:r>

<!-- 2. 8.1 标签 (Row 1): 10.5pt -->
<w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t>8.1  Exposure controls:</w:t></w:r>

<!-- 3. Row 2~11 所有子标签全部暴增为 12pt (sz="24")！比章大标题还大两号！ -->
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Respiratory protection:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Hand protection:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Suitable material for protective gloves:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Fluororubber - FKM:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Butyl rubber - IIR:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Nitrile rubber - NBR:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Recommendation:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Eye protection:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Body protection:</w:t></w:r>
<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>8.2  Engineering controls:</w:t></w:r>
```
*PDF 物理字符流实测*：Table 8 子标签文本字号实测为 `size=240.0` (12pt)，章标题为 `size=221.0` (11pt)，而全篇其他章节所有小标签（Section 1, 3, 4, 5, 6, 7, 9, 10, 12, 14 等）均为 `size=190.0` (9.5pt)！

### 3.2 排版危害与根因剖析
- **排版危害**：小标签字号（12pt）居然比章标题（11pt）还要大两号，比全篇其他小标签（9.5pt）大五号！造成严重的视觉混乱和层级倒挂！
- **根因剖析**：中文版标签使用的是 12pt 宋体 (`sz="24"`)。在生成英文版 Section 8 时，编辑器直接继承了中文版的 `sz="24"`，未将英文标签重置为全篇统一的 9.5pt (`sz="19"`) Arial！

---

## 4. 核心问题三：中英文版 Section 3「3.2 Ingredients:」文本格式（字号和加粗）错误

### 4.1 底层 OpenXML 实际提取对照

| 章节与行号 | 官方母版标准设定 | 产出物实际提取文本 | 实际字号 (sz) | 实际加粗 (bold) | 缺陷判定 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CN Section 3 Row 1** | `产品类型：` (12pt 加粗) | `产品类型：` | `sz="24"` (12pt) | **True (加粗)** | 合规 |
| **CN Section 3 Row 2** | `成分` 或 `3.2  成分` (12pt 加粗) | `成分` | `sz="24"` (12pt) | **False (细体！)** | **加粗丢失！缺少 3.2 编号！** |
| **CN Section 3 Row 3** | `化学品名称` (12pt 加粗) | `化学品名称` | `sz="24"` (12pt) | **True (加粗)** | 合规 |
| **EN Section 3 Row 1** | `3.1  Product type:` (9.5pt 加粗) | `3.1  Product type:` | `sz="19"` (9.5pt) | **True (加粗)** | 合规 |
| **EN Section 3 Row 2** | `3.2  Ingredients:` (9.5pt 加粗) | `3.2  Ingredients:` | `sz="19"` (9.5pt) | **False (细体！)** | **加粗丢失！格式严重脱节！** |
| **EN Section 3 Row 3** | `Chemical name` (9.5pt 加粗) | `Chemical name` | `sz="19"` (9.5pt) | **True (加粗)** | 合规 |

### 4.2 微观 XML 证据链举证
```xml
<!-- 英文版 Table 3 Row 1: 3.1 Product type 为粗体 (加粗有效) -->
<w:tr>
  <w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="19"/></w:rPr><w:t>3.1  Product type:</w:t></w:r></w:p></w:tc>
  <w:tc><w:p><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>Mixture</w:t></w:r></w:p></w:tc>
</w:tr>

<!-- 英文版 Table 3 Row 2: 3.2 Ingredients 居然是细体！丢失了 <w:b/>！ -->
<w:tr>
  <w:tc><w:p><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>3.2  Ingredients:</w:t></w:r></w:p></w:tc>
</w:tr>

<!-- 中文版 Table 3 Row 2: 成分 居然也是细体！丢失了 <w:b/>！且缺少 3.2 编号！ -->
<w:tr>
  <w:tc><w:p><w:r><w:rPr><w:rFonts w:eastAsia="宋体"/><w:sz w:val="24"/></w:rPr><w:t>成分</w:t></w:r></w:p></w:tc>
</w:tr>
```

### 4.3 缺陷分析与根因
1. **加粗丢失 (Bold Dropped)**：Row 1（产品类型）与 Row 3（表头：化学品名称、CAS、含量）均具备加粗属性，唯独夹在中间作为二级小标题的 Row 2（`成分` / `3.2  Ingredients:`）被引擎渲染为了常规细体（`bold=False`），在视觉上完全失去了二级标题的指引作用！
2. **编号缺失与不一致**：中文版直接缺失 `3.2  ` 前缀，仅有孤立的 `成分` 二字；英文版虽有 `3.2  Ingredients:`，但因细体渲染混同于常规内容。
3. **根因**：模板填充引擎在重写 Table 3 数据时，Row 2 的段落未施加加粗样式原语 `<w:b/>`，且未对中英文小标题结构进行统一校验。

---

## 5. 其他伴随缺陷（剪枝与中文排版）

除上述三大核心问题外，交付物仍存留两项伴随问题：
1. **[DEF-CNT-01] Section 8 Table 8 Row 3 “手部防护：”未剪枝开天窗**：
   - 中文与英文 Table 8 Row 3 均存在粗体标签，右侧值格完全留空开天窗，未调用 `table.deleteRow()` 物理剔除；
2. **[DEF-FMT-02] 中文版小标题格内数字 10.5pt 与汉字 12pt 大小头跳字 (40+ 处)**：
   - 中文二级小标题（如 `1.1  `、`4.1  `、`9.1` 等）前段序号为 10.5pt (`sz="21"`)，后段汉字为 12pt (`sz="24"`)，同一单元格内字阶脱节。

---

## 6. 底层代码与编辑器定向修复指南 (Actionable Engineering Blueprint)

### 6.1 针对【核心问题一：标点符号】的底层修复
- **挂载英文句末标点自动闭合原语 (`TerminalPeriodCloser`)**：
  在 `docx-engine` 写入文本运行 (`<w:r><w:t>`) 前，自动检测英文描述性陈述句末尾；若无标点，自动补齐西文句点 `.`；
- **拆分 `<w:br/>` 软换行为独立段落 `<w:p>`**：
  将多句描述拆分为各自独立的 `<w:p>` 段落，并在每句末尾闭合句号；
- **挂载 ASCII 字符集规范化原语 (`AsciiNormalizer`)**：
  在写入英文文档前，自动将全角 `＞` 映射为 `>`，将 TDS 中的全角 `：` 映射为 `: `，将 `【】` 映射为 `[]`。

### 6.2 针对【核心问题二：英文 Section 8 标签字号】的底层修复
- **重置英文 Section 8 标签样式**：
  在 `docx-engine/templates/en/table8.xml` 或样式映射层中，将 Table 8 Row 2~11 的所有标签字号强制重置为 **9.5pt (`sz="19"`) Arial**，彻底清除错误的 12pt (`sz="24"`) 继承！

### 6.3 针对【核心问题三：Section 3 的 3.2 Ingredients 格式】的底层修复
- **中文版 Row 2 修复**：
  将单元格文本统一为 `3.2  成分`（或规范的加粗 `成分`），强制设置 `<w:b/>`（加粗）和 `sz="24"`（12pt 宋体）；
- **英文版 Row 2 修复**：
  对 `3.2  Ingredients:` 段落强制注入 `<w:b/>`（加粗），设置字号为 `sz="19"` (9.5pt Arial 加粗粗体)，使其与 Row 1 `3.1  Product type:` 保持绝对均一的二级标题格式！

---

## 7. 终审执裁意见 (Final Adversarial Verdict)

本审计组完全认同用户的核心裁定：**当前交付物最关键、最刺眼的退化正集中于标点符号缺失、英文 Section 8 标签字号倒挂以及 Section 3 Row 2（3.2 Ingredients:）加粗丢失与格式失调！**  
请研发与编辑器底层工程团队立即锁定这三项核心修复任务，修复后重新生成 EP-1404 交付物！
