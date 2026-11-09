# Design: 通用性 MCP 工作流五大关键拼图架构设计

## 1. 架构总览与五大拼图流转拓扑

```mermaid
graph TD
    classDef agentStyle fill:#f9f,stroke:#333,stroke-width:2px;
    classDef sopStyle fill:#ffd,stroke:#333,stroke-width:2px;
    classDef mcpStyle fill:#bbf,stroke:#333,stroke-width:2px;
    classDef engineStyle fill:#dfd,stroke:#333,stroke-width:2px;

    Agent["🤖 Agent (Host / msds-studio Skill)"]:::agentStyle

    subgraph SOP_Layer ["📖 拼图一 & 二: SOP 标准化规程与配方库"]
        DecisionTree["🌳 几何形态判定决策树\n(2列 / 3列非标 / 通栏 / 激光垂线)"]:::sopStyle
        RecipeLib["📚 SOP 经典手术配方库\n- Recipe A: 三列转两列消除\n- Recipe B: 动态组分增减行\n- Recipe C: 化学式富文本渲染"]:::sopStyle
    end

    subgraph MCP_Protocol ["📡 拼图三 & 四: MCP 协议防护与诊断通道"]
        TransactionGuard["🛡️ 拼图三: 事务守护与自动回滚\n(内置 Checkpoint / Rollback)"]:::mcpStyle
        GapAnalyzer["🔎 拼图四: 正向行动诊断分析器\n(msds_compare_source_with_output)"]:::mcpStyle
    end

    subgraph Core_Engine ["⚙️ MSDS-Engine 核心底座"]
        DocxCore["DocxEngine (tblGrid 自愈 / 9795 dxa 守恒)"]:::engineStyle
        TemplateEditorCore["TemplateEditor (DOM Grid State Machine)"]:::engineStyle
    end

    subgraph Supreme_Law ["⚖️ 拼图五: 最高法定宪章立法"]
        Constitution["PROJECT_CONSTITUTION.md & AGENTS.md\n- 四大核心维护支柱\n- 严禁单一目的私改通用工具\n- 严禁 if(model) 特判分支"]:::sopStyle
    end

    Agent --> DecisionTree
    DecisionTree --> RecipeLib
    RecipeLib --> TransactionGuard
    TransactionGuard --> TemplateEditorCore
    TemplateEditorCore --> DocxCore
    DocxCore --> GapAnalyzer
    GapAnalyzer -.->|反馈 Gaps| Agent
    Constitution -.->|最高约束| Agent
    Constitution -.->|最高约束| Core_Engine
```

---

## 2. 核心模块增强细节

### 2.1 `msds_execute_editor_ops` 事务自愈实现
```javascript
// 在 mcp-server.js 中
const session = await createWorkSession(args.templateKey);
const initialCheckpoint = createCheckpoint(session);

try {
  for (const op of args.operations || []) {
    // 依次执行原子操作...
  }
  const saveRes = await saveSession(session, args.outputPath);
  return { success: true, outputPath: saveRes.outputPath, ... };
} catch (err) {
  // 发生异常立即自动回滚，恢复原始状态
  await rollbackSession(session, initialCheckpoint);
  // 清理临时可能的破损文件
  if (fs.existsSync(args.outputPath)) {
    try { fs.unlinkSync(args.outputPath); } catch (_) {}
  }
  throw new Error(`[Transaction Aborted & Rolled Back] 操作执行失败已安全自愈回退: ${err.message}`);
}
```

### 2.2 `msds_compare_source_with_output` 行动诊断器增强
除逐节比对字符保全比外，增加如下语义与关键行侦测：
- **Section 2 漏识/漏填漏项检查**：检查源文件是否有 GHS 象形图、警告词、防范说明，而产出文件是否为空；
- **Section 3 组分对账**：检查源文件组分数与产出文件行数是否匹配；
- **输出 `actionableGaps`**：结构化透传给调用方 Agent，指导其按图索骥补填。
