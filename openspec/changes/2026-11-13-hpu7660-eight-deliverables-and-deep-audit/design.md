# Design: HPU-7660 工业级生产流水线与两阶双轨审计架构

## 1. 架构总览 (Architecture Overview)

```mermaid
flowchart TD
    subgraph S0["Phase 0: 感知与门禁 1 (Completed)"]
        SrcDocx["HPU-7660 源 DOCX"] --> TplDisc["模板拓扑感知与意图确认"]
        TplDisc --> Gate1["【门禁 1：需求全量对账备忘录】(已确认)"]
    end

    subgraph S1["Phase 1 & 2: 事实抽取与治理"]
        Gate1 --> RecEng["recognition-engine.js (Context 1)"]
        RecEng --> GovEng["context-governor.js (Context 2 中英双轨)"]
        GovEng --> TransDict["CHEMICAL_TRANSLATION_DICT (补充 DMEA & 理化词条)"]
    end

    subgraph S2["Phase 3: 规格立法与门禁 2 (Current)"]
        GovEng --> OpenSpec["OpenSpec 立法资产 (proposal/specs/design/tasks)"]
        OpenSpec --> DualList["【双清单自证】拟变范围 + 保持现状"]
        DualList --> Gate2["🚨【门禁 2：施工授权拦截】"]
    end

    subgraph S3["Phase 4 ~ 9: 受控装配与交付物生成"]
        Gate2 -->|用户授权| ClearVal["Phase 4: clearTemplateValues (前置清零)"]
        ClearVal --> WriteOps["Phase 5: writeDeliverableViaEditor (原子装配)"]
        WriteOps --> TypoProj["Phase 6: applyGlobalTypographyProjection (排版几何硬锁)"]
        TypoProj --> DualEntity["Phase 7: applyCompanyPreset (冠志/国彩双主体)"]
        DualEntity --> ExportDocx["Phase 8: 导出 4 DOCX"]
        ExportDocx --> ConvPdf["Phase 9: convertBatchDocxToPdf (转换 4 PDF)"]
    end

    subgraph S4["Phase 10 & 11: 两阶双轨审计与物理核销"]
        ConvPdf --> Step1Audit["第一阶: 机械确定性审计 (159探针+双极双层+排版几何)"]
        Step1Audit -->|Exit Code 0| Step2Audit["第二阶: 智能体语义规范审计 (对抗式反向证伪)"]
        Step2Audit --> Ledger["Phase 11: 1:1 双向物理核销清算表与 CHANGELOG"]
    end
```

## 2. 核心模块因果拓扑与状态机转移 (Causal Topology & State Machine)

1. **Context 1 $\rightarrow$ Context 2 状态流转**：
   - 输入源文件经 `recognizeSourceDocx` 提取出品名 `羟基聚氨酯分散体`、3 项化学组分及理化特性；
   - GHS 非危属性由 `sec2Text` 与 `isHazardous: false` 显式判定，进入 `INV-ZERO-EXOGENOUS` 状态机分支；
   - 英文分支由 `CHEMICAL_TRANSLATION_DICT` 注入国际通用 IUPAC/CAS 命名，禁止任何未翻译中文残留。

2. **编辑器装配与排版几何硬锁**：
   - `createWorkSession` 动态挂载官方基准底模，执行 `clearTemplateValues` 抹除所有旧数据残留；
   - `universal-editor-primitives.js` 强制投影底层几何硬锁：
     - 单 `<w:tab/>` 0 空格连接；
     - 420 dxa (Tier A) / 560 dxa (Tier B) 动态阶梯；
     - 多列单元格清除 `w:ind` 顶格对齐；
     - 3+ 列数据表格 Column 0 纯文本顶格解耦。

3. **两阶双轨审计把控机制**：
   - 机械第一阶：`runMasterMsdsAudit`（159 探针）+ `runBipolarBilayerAudit` + `test_editor_indent_and_alignment_invariants.mjs`，任何告警视为失败（`--max-warnings=0` 语义）；
   - 语义第二阶：16-Section 中英文逐句逐槽位 1:1 双向物理对账，出具核销清算凭据。
