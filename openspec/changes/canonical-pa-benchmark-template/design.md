# Design: 典型水性丙烯酸乳液 (PA) 官方基准模板与受控流水线拓扑

## 一、 系统架构与数据流图

```mermaid
flowchart TD
    A["源文件感知: PA-4780 原始材料"] --> B["成分解析: 2-丁氧基乙醇 (8-15%) + 水 + 聚合物"]
    B --> C["Section 2 危害推导: GHS07 象形图 + H412/H315/H319 + P273/P501"]
    B --> D["Section 11 毒理推导: 大鼠经口/经皮 LD50 + 刺激性 + AMES"]
    C --> E["MSDS-Engine 模板注册与几何装配 (template-editor.js)"]
    D --> E
    E --> F["双语同构派生 (pipeline-engine.js)"]
    F --> G["多实体派生 (冠志 + 国彩)"]
    G --> H["标准 8 交付物受控生产 (4 DOCX + 4 PDF)"]
    H --> I["双极双层全景机械深度审计 (audit_bipolar_bilayer.mjs)"]
    I --> J{"AST 机器硬断言 (Exit Code 0)"}
    J -->|Pass| K["VS Code 原生 Diff 终审与 CHANGELOG 知识沉淀"]
    J -->|Fail| L["原子回滚熔断并报警"]
```

## 二、 关键技术细节与权衡

1. **Section 2 GHS 象形图高保真渲染**：
   - 提取 `PA-4780 msds_CN 冠志.docx` 中的真实 GHS 象形图图片；
   - 在 DOCX 生成时通过 `writeRichTextToCell` 或直接通过媒体引用无损注入单元格，确保在 PDF 导出中无偏移。
2. **Section 11 毒理学槽位双向映射**：
   - 中文版采用标准 16 行槽位或成分毒理列表；
   - 英文版同步英译：`Acute toxicity: Oral LD50 (rat) > 2,000 mg/kg`, `Skin irritation: Causes skin irritation`, `Eye irritation: Causes serious eye irritation`, `Mutagenicity: Ames test negative`。
3. **双极双层审计 AST 扩展 (`audit_bipolar_bilayer.mjs`)**：
   - 增加对 PA 型号包含 2-丁氧基乙醇时的特异性断言：
     - 断言包含 H412；
     - 断言包含 P273 与 P501；
     - 断言 Section 11 包含经口急性毒性数值。
