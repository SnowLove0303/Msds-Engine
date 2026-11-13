# Specification: Context 2 匹配引擎结构拓扑映射与 Agent 规范打磨契约

## ADDED Requirements

### Requirement: Pipeline 职能彻底融入匹配引擎架构契约
The matching engine SHALL absorb all pipeline data transformation capabilities and SHALL eliminate standalone pipeline invocations from the workflow.

#### Scenario: 匹配引擎作为 Context 2 结构初筛唯一引擎
- **WHEN**: Context 1 识别结果就绪并启动 Context 2 生产流程
- **THEN**: 系统 SHALL 直接调用匹配引擎执行数据承接与槽位结构映射
- **AND**: 系统 SHALL NOT 经过任何独立的 pipeline 中间层
- **AND**: 匹配引擎 SHALL 承担原 pipeline 中的字段提取、分段拓扑化与槽位初筛职责。

### Requirement: 模板拓扑学结构性初筛匹配契约
The matching engine SHALL execute structural matching combining source content with template topology to determine the basic structure.

#### Scenario: 依据源内容与模板拓扑输出基本结构
- **WHEN**: 匹配引擎接收合法的 Context 1 事实对象与目标模板标识
- **THEN**: 匹配引擎 SHALL 恪守“内容来源于源文件，结构来源于模板”的全局公理
- **AND**: 匹配引擎 SHALL 将提取的事实映射至模板 16 章节的物理网格（单列通栏、双列键值、多列成分）
- **AND**: 匹配引擎 SHALL 产出合规、规整的 Context 2 初始结构骨架（Basic Structural Blueprint）。

### Requirement: Agent 全局与局部规范二次认知打磨契约
The agent SHALL apply global invariants and 16-section local specifications to refine the basic structural blueprint.

#### Scenario: Agent 执行深度认知治理
- **WHEN**: 匹配引擎产出基本结构骨架
- **THEN**: Agent SHALL 运用大模型专业语义能力执行逐句地道双语英译
- **AND**: Agent SHALL 强制执行非危防虚增规则（未提及象形图/信号词时不产生虚增项）
- **AND**: Agent SHALL 执行度数西文化（统一为 `°C`）与标点纠偏
- **AND**: Agent SHALL 执行 16 章节专属局部规范（阶梯缩进、组分对齐、理化参数排版），形成高精度的最终 Context 2。

### Requirement: 面向通用编辑器的 Context 2 数据资产与准入门禁契约
The finalized Context 2 SHALL serve as a verified, immutable data foundation directly consumable by universal editor primitives.

#### Scenario: Context 2 驱动通用编辑器受控写入
- **WHEN**: Context 2 二次打磨完成
- **THEN**: 数据结构 SHALL 完整包含元数据、16 章节槽位数组与编辑器操作意图
- **AND**: 每一个待写入单元格的数据与富文本标记 SHALL 处于完全就绪状态
- **AND**: 系统 SHALL 对 Context 2 执行准确性校验，只有校验通过后方可向通用编辑器派发写入指令。
