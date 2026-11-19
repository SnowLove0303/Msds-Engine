# Specification: Section 15 法规信息治理与排版规范

> **规范层级**：RFC 2119 标准法定契约  
> **生效作用域**：全局 MSDS 生产管线、智能匹配引擎、底层排版原语

---

## 1. 中文版 Section 15 结构规范 (Chinese Section 15 Specification)

### 1.1 子标题行保全 (Subheading Preservation)
- **C-S15-01**: 中文版 Section 15 第 1 行 (Row 1, 0-indexed) **SHALL** 固定包含法定子标题文本 `"物质或混合物的相关安全、健康和环保法律法规"`。
- **C-S15-02**: 智能匹配引擎与流水线构建器 **SHALL NOT** 将源文档的散文法规清单（如 `遵循法规：- ...`）写入 Row 1 单元格。

### 1.2 结构化法规列表 (Structured Regulation Rows)
- **C-S15-03**: 中文版 Section 15 第 2 行 **SHALL** 为 `"其它的规定："`。
- **C-S15-04**: 中文版 Section 15 第 3 行 **SHALL** 为 `"符合下列法规要求："`。
- **C-S15-05**: 法规条目 **SHALL** 仅分布在第 3 行之后的独立行中（非危品为第 4~7 行，危化品为第 4~8 行）。
- **C-S15-06**: 中文版 Section 15 中，任何法规名称（如《危险化学品安全管理条例》、GB/T 16483、GB 13690、GB 30000.2-29）在整个表格内出现的频次 **SHALL** 恰好等于 1。

---

## 2. 英文版 Section 15 标点与排版规范 (English Section 15 Specification)

### 2.1 结构性标签与冒号排版 (Label Typography & Punctuation)
- **E-S15-01**: 英文版 Section 15 第 2 行 **SHALL** 精准呈现为 `"Other provisions:"`。
- **E-S15-02**: 英文版 Section 15 第 3 行 **SHALL** 精准呈现为 `"Complies with the following regulations:"`。
- **E-S15-03**: 英文版交付物全文中，任何以半角冒号 `:` 结尾的标签行 **SHALL NOT** 紧随半角句号或全角句号（即严格杜绝 `: .` 或 `:.`）。

### 2.2 英文法规条目翻译 (English Regulation Content)
- **E-S15-04**: 第 4~7 行法规条目 **SHALL** 采用标准官方西文译名呈现，严禁任何中文乱码或拼音残留。

---

## 3. 双语同构与网格裁剪规范 (Bilingual Homomorphism Specification)

### 3.1 8 行与 9 行自适应收敛 (Adaptive Row Convergence)
- **B-S15-01**: 当产品为非危险化学品且源文档未明文引用 GB 15258 时，中文版与英文版 Section 15 表格行数 **SHALL** 均严格等于 8 行。
- **B-S15-02**: 当产品为危险化学品或源文档明文引用 GB 15258 时，中文版与英文版 Section 15 表格行数 **SHALL** 均严格等于 9 行。
- **B-S15-03**: 在任何交付物生成场景下，中文版与英文版的 Section 15 表格总行数 **SHALL** 保持 1:1 绝对相等 (`cnRows.length === enRows.length`)。
