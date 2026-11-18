# Design: Agent MSDS-Studio 7 阶标准受控生产工作流架构设计

## 一、 系统架构与状态机流转拓扑

全系统生命周期严格遵循 7 阶单向不可逆状态机流转：

```mermaid
flowchart TD
    subgraph S1["阶段 1: 物理源文件锁定 (Source Discovery)"]
        A["输入路径: sourceFilePath"] --> B["存在性与有效性校验"]
        B --> C["提取目标型号 modelCode"]
    end

    subgraph S2["阶段 2: 零损耗识别与 Context1 (Recognition)"]
        C --> D["调用 msds_recognize_source"]
        D --> E["生成原始结构化事实 Context1 (未经修饰)"]
    end

    subgraph S3["阶段 3: 事实标准化治理 (Context1 -> Context2)"]
        E --> F["GHS 事实保真清洗 (防象形图/信号词虚增)"]
        F --> G["标点/西文空格/单位符号标准化 (°C, mm, min)"]
        G --> H["化学专业语义深度英译 (OECD导则号, 测试终点)"]
        H --> I["生成交付物唯一法定数据源 Context2"]
    end

    subgraph S4["阶段 4: 强制调用编辑器万能原语受控写入"]
        I --> J["加载官方母版: template-editor.js"]
        J --> K["前置值格清零: clearSectionValues / clearTemplate"]
        K --> L["万能几何原语装配: 删行/删列/增行/横向合并/写值 (格式服从原文)"]
        L --> M["全域排版拓扑投影: applyGlobalTypographyProjection (tokens/420/560dxa)"]
    end

    subgraph S5["阶段 5: 严格法定生产工序"]
        M --> N1["工序 1: 中文 Word (冠志版 + 国彩版)"]
        N1 --> N2["工序 2: 英文 Word (Guanzhi版 + Guocai版)"]
        N2 --> N3["工序 3: Word/WPS 原生转换 4 份高清 PDF"]
    end

    subgraph S6["阶段 6: 两阶双轨全景深度审计"]
        N3 --> O1["第一阶: 159 项机械主审计 + 双极双层审计 (退出码 0 门禁)"]
        O1 -- "退出码 0" --> O2["第二阶: Agent 认知介入 16 章节逐行逐句双语保真审验证伪"]
        O1 -- "非 0 报错" --> ERR["熔断拦截并打回排查"]
    end

    subgraph S7["阶段 7: 自动镜像分发与正式交付"]
        O2 --> P["自动同步全量 8 份交付物至 E:\\冠志\\...\\待处理文件\\<modelCode>"]
        P --> Q["出具 1:1 双向物理核销交付报告与 Git 存证"]
    end
```

---

## 二、 关键模块与接口职责分工

1. **识别感知模块 (`recognition-engine.js` / `msds_recognize_source`)**：
   - 提取源文档 16 章节全部原始物理事实，生成原始 `Context1`。
2. **上下文治理器 (`context-governor.js` 或流水线内治理函数)**：
   - 将 `Context1` 转化为 `Context2`，落实 GHS 防虚增、西文符号纠正与 OECD 深度英译。
3. **编辑器核心与万能原语 (`template-editor.js` / `universal-editor-primitives.js` / `docx-engine.js`)**：
   - 提供 `clearTemplateValues`、`deleteRow`、`deleteColumn`、`mergeCells`、`insertRow`、`writeCellValue`、`applyGlobalTypographyProjection` 等标准能力。
   - 杜绝一切绕开编辑器的裸 XML 拼接与单型号 ad-hoc 脚本。
4. **统一生产调度总控 (`production-orchestrator.js` / CLI `produce_standard_deliverables.mjs`)**：
   - 顺序编排阶段 1 至阶段 7，包含原生 PDF 转换、目录镜像同步与双重审计串联。
5. **官方 MCP 协议服务端 (`mcp-server.js`) 与网关 (`msds_mcp_gateway.mjs`)**：
   - 将 `msds_batch_export_eight` 与 `msds_audit_deliverables` 对齐绑定至总控，作为 Agent 唯一标准操作通路。
6. **全局技能宪法 (`skills/msds-studio/SKILL.md`)**：
   - 永久固化 7 阶 SOP，作为所有跨线程 Agent 必须严格遵循的最高作业指南。
