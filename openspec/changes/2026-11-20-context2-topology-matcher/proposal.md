# Proposal: Context 2 至编辑器拓扑匹配编译器 (`topology-matcher.js`)

## 背景与目标
在 Context 2 已实现“先中文标准化表格治理 + 后 Agent 逐句英译 + TM 沉淀 + 零中文/数字守恒校验”的基础上，解决 Context 2 进入编辑器（`msds_execute_editor_ops`）的最后半程问题：
- 消除 Agent 手工窥探模板行号并拼装上百条低层编辑指令的 Token 冗余与行号偏移风险；
- 让匹配引擎回归**纯粹的拓扑结构匹配与原语编译器**角色：零内容捏造、遇未知模板硬阻断、输出精简《拓扑对齐编译计划》并可直接驱动 `msds_execute_editor_ops`。

## 需求 1:1 映射
- **REQ-01**：新增 `web/src/topology-matcher.js`（`compileTopologyOps`, `formatTopologyPlanMarkdown`），自动将 Context 2（CN/EN）与 `inspectTemplateSchema` 模板拓扑对齐，编译出完整确定性 `operations[]`（含前置清零、锚点匹配、多行伸缩、通栏合并、倒序安全删行、激光标尺与左对齐）。
- **REQ-02**：严格隔离内容与结构，写入 100% 溯源 Context 2；Context 2 未过校验或模板拓扑缺失/不兼容时直接抛错退出（退出码 ≠ 0）。
- **REQ-03**：注册 MCP 工具 `msds_compile_topology_ops`（支持 `--tool=msds_compile_topology_ops` 网关调用），并在七流程/测试套件中实测验证与重打 `.zip` 包。
