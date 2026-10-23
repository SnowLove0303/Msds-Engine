# Design

## Architecture & Implementation Strategy

### 1. Section 9 格式对齐设计
- **位置**：`web/src/smart-matching.js` 与 `web/src/docx-engine.js`；
- **机制**：
  - 在更新 9.22 固体含量标签文本时，不仅设置文本内容，还显式调用 `applyStandardHangingIndent(cell0, '457', '457', '459')`；
  - 构造标准的 run 节点结构：
    ```xml
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:b/>
        <w:sz w:val="21"/>
      </w:rPr>
      <w:t>9.22 </w:t>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="黑体" w:hAnsi="黑体" w:eastAsia="黑体"/>
        <w:b/>
        <w:sz w:val="24"/>
      </w:rPr>
      <w:t>固体含量（150℃，30min）：</w:t>
    </w:r>
    ```
  - 在完成 Section 9 所有条目覆写后，对中英文底模均执行一次 `harmonizeTableLabels(editorEngine)`，确保所有行的段落属性与制表位 100% 齐平。

### 2. Section 11 结构与对齐设计
- **位置**：`web/src/smart-matching.js` 与 `web/src/docx-engine.js`；
- **机制**：
  - 针对 11.7 生殖毒性：遍历并移除多余的中间单元格，合并或直接更新为仅包含 2 个单元格的行结构；
  - 针对 11.9 附加信息：在匹配结果映射阶段，将 `additional_info`、`repeated_dose_oral`、`repeated_dose_inhalation` 合并为一个富文本值；
  - 针对空格补白：在 `replaceSequence` 中，判断当前章节主编号为 11 时，将 `padLen` 设定为 6，确保 `11.9`（4 字符）与 `11.10`（5 字符）均能获得正确的 2 个或 1 个对齐空格。

### 3. Section 12 说明行保护设计
- **位置**：`web/src/smart-matching.js` 与 `web/src/pipeline-engine.js`；
- **机制**：
  - 在 `applyMatchResultToEditor` 中，若 `hasRealEndpoints12 === true`，仅删除带有“参考数据”或旧组分特征的单格行（Row 2），严禁删除 Row 1 说明行（`无可用的生态毒理学研究`）；
  - 在 `pipeline-engine.js` 的 `buildBaseEnglishEngine` 中，删除无条件硬编码的两次 `deleteRow(engine, s12, 1)`，改为精准删除旧参考数据行，保留英文说明行。

### 4. 页脚修订日期自适应提取设计
- **位置**：`web/src/docx-engine.js` 与 `web/src/msds-api-controller.js`；
- **机制**：
  - `extractAdaptiveRevisionDate`：先通过正则 `s.replace(/<[^>]+>/g, '')` 剥离 XML 标签获取纯文本，再使用多模式日期正则提取（支持 `YYYY-MM-DD`、`YYYY/MM/DD`、`YYYY年M月D日`），并通过 `normalizeDateString` 统一标准化为 `YYYY/MM/DD`；
  - `msds-api-controller.js`：将 `body.revisionDate || '2026/10/10'` 改为 `body.revisionDate || null`，未指定时强制触发源文件自适应提取，提取失败则抛出明确错误而非静默注入虚假日期。
