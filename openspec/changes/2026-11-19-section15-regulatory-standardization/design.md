# Design: Section 15 法规信息全面规范化技术架构与因果拓扑

> **设计宗旨**：深入代码物理底层，根治 Section 15 标题行覆写与标点断裂，构建双语 1:1 对称的法规信息标准呈现拓扑。

---

## 1. 架构因果拓扑与根因深度剖析

```mermaid
flowchart TD
    subgraph RawBug["现状缺陷根因链路"]
        SrcDoc["源文件: 遵循法规散文文本"] -->|smart-matching| ExtractSafety["提取 safety_regulations 散文块"]
        ExtractSafety -->|Bug 1: writeCellValue(r1, val)| OverwriteR1["【中文 Row 1 覆写】官方子标题被冲掉"]
        OverwriteR1 --> RepeatRegs["【法规清单重复】Row 1 散文与 Row 4~7 重复"]
        
        EnTpl["英文模板: Other provisions:"] -->|universal-editor-primitives| LabelBuild["labelText 拼接 ': ' (带尾空格)"]
        LabelBuild -->|Bug 2: !/[.!?:]$/.test('...: ')| PunctFail["正则未匹配冒号 (末尾为空格)"]
        PunctFail --> AppendDot["强行追加 '.' 产生 ': .'"]
    end

    subgraph TargetArchitecture["规范化治理目标链路"]
        SrcDoc2["源文件法规事实"] --> R1Guard["Row 1 恒久子标题锁:\n物质或混合物的相关安全、健康和环保法律法规"]
        SrcDoc2 --> RegListEngine["Row 4~7 纯净结构化法规注入引擎"]
        R1Guard --> CleanCN["中文 Section 15 零重复高保真拓扑"]
        RegListEngine --> CleanCN
        
        EnLabel["英文标签处理"] --> SpaceGuard["无后置值时 trim 消除尾部空格"]
        EnLabel --> RegexGuard["标点判定基于 tc.trim(), 豁免冒号结尾"]
        SpaceGuard --> CleanEN["英文 Section 15 纯净西文标点 (无 ': .')"]
        RegexGuard --> CleanEN
    end
```

---

## 2. 核心技术实现方案

### 2.1 中文 Section 15 标题保护与法规单次呈现 (`RTM-S15-01`, `RTM-S15-02`)
1. **`smart-matching.js` 守卫**：
   在 `s === 15` 时，严禁将 `safetyItem.value` 写入 `tRecord.rows[1]`。
   Row 1 必须固定保留为：
   `"物质或混合物的相关安全、健康和环保法律法规"`。
2. **`pipeline-engine.js` 基准构建保护**：
   在 `buildBaseChineseEngine` 中，确保 Row 1 为法定子标题，Row 2 为 `"其它的规定："`，Row 3 为 `"符合下列法规要求："`，Row 4~7 写入 4 部规范法规（591号令、GB/T 16483、GB 13690、GB 30000.2-29）。若源文件包含年份信息，则完整体现。

### 2.2 英文 Section 15 西文标点与排版净化 (`RTM-S15-03`)
1. **`universal-editor-primitives.js` 标签生成净化**：
   - 当 `s15Match` 匹配到纯标签行且 `!valText` 时，`labelText` 强制经 `trim()` 产出为 `'Other provisions:'` 与 `'Complies with the following regulations:'`，杜绝悬挂空格；
   - 在标点检查 `!/[.!?:]$/.test(...)` 时，强制针对 `tc.trim()` 进行判定；
   - 增加对冒号结尾字符串及 Section 15 结构性标题的显式豁免，确保西文句子补点规则绝不污染标签。
2. **后置管道兜底过滤**：
   在 `pipeline-engine.js` 的 `enforceStructuralTypographyInvariants` 最终阶段，执行全局正则替换 `.replace(/[:：]\s*\./g, ':')`，形成双重防线。

### 2.3 双语 1:1 同构与非危产品 GB 15258 裁剪 (`RTM-S15-04`)
1. **8 行网格对称**：
   对于非危品且源文未列 GB 15258 的物料（如 PA-3654），中英文版第 8 行（GB 15258）均执行安全裁剪，严格保持 8 行标准网格；
2. **双语行列断言**：
   在双语对账断言中，核验 `s15Cn.rows.length === s15En.rows.length`，确保物理行数 1:1 守恒。

---

## 3. 风险与防御对策

| 风险点 | 潜在影响 | 防御机制 |
| :--- | :--- | :--- |
| **空格清洗破坏其他章节** | 若全局盲目修改 `tc.trim()` 可能影响含缩进的单元格 | 严格将豁免与判断收敛于标签行逻辑与以冒号结尾的西文字符串 |
| **危化品 GB 15258 误删** | 危化品需要标签规定法规 | 严格判定 `facts.isHazardous` 与源文件法规文本，仅在非危且源文无提及的情况下裁剪 |
| **回退与断言回归** | 既有 PA-3654 的 8 项交付物质量受损 | 重建 PA-3654 全部 8 项交付物，运行全要素双极双层审计套件确保退出码 0 |
