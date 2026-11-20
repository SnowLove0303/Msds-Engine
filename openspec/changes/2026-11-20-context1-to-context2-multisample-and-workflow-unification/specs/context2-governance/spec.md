# Specification: Context 1 -> Context 2 多样本治理与统一工作流契约

## REQ-01: 多样本 Context 1 -> Context 2 全链路实测检验
- **SHALL**: 系统 MUST 提供自动化多样本检验能力，覆盖不少于 8 个跨品类（水溶性丙烯酸、水性聚氨酯、无水环氧、水性助剂、丙烯酸分散体等）与跨版式（危险品/非危品、单栏/多栏、Paradigm 1/Paradigm 2）的真实 MSDS 源文档。
- **WHEN**: 运行多样本测试套件时，
- **THEN**: 每个样本 MUST 依次通过 `Context 1` 识别与 `Context 2` 治理，输出逐章节结构化校验结果，并统计缺失节数、分类异常数与事实继承率。

## REQ-02: 机械辅助分类逻辑补强与工作流纠偏
- **SHALL**: `buildStructuredContext2` MUST 对 `Context 1` 全 16 章节的每一行执行确定性机械重分类，纠正 `Context 1` 中将带点号序号（`4.1.`）、无冒号组分题头、通栏复合行、底部附注误归为 `说明行` 或 `未命名` 的错误。
- **WHEN**: 处理包含嵌套标签、多段通栏（Section 2/11）、表格表头与组分网格（Section 3/8）、运输条款（Section 14）及法规清单（Section 15）的 `Context 1` 数据时，
- **THEN**: 每行产出 MUST 显式携带 `role`（`SECTION_HEADER` / `SEQ_LABEL` / `SUB_LABEL` / `EXPLANATION` / `TABLE_HEADER` / `COMPONENT_ROW` / `FULL_WIDTH_STRUCTURED` / `MIGRATED_TO_S2`）、`boldLabel`、`boldValue` 与 `indentDxa`（420/560 dxa 自适应）。

## REQ-03: “内容来源于源文件 + 源文件内容继承”与规范化加工边界
- **SHALL**: Context 2 MUST 100% 继承 Context 1 中的源文件化学事实（CAS、含量、理化参数与条件、毒理数值、运输限制），严禁凭空捏造或无故截断；同时 MUST 依据已确认的全局与局部规范执行规范化加工：
  1. **Section 1.1 CN 版产品中文名称标准写法**：当 `中文名称` 缺失或未携带产品型号时，依据 `<中文品名> <modelCode>` 规范补齐（如 `水溶性羟基丙烯酸树脂 PA-4902`），`产品名称` 保留纯净型号；
  2. **Section 2/3 合规迁移与防外生虚增**：非危品严禁虚增无关象形图/信号词，并将 Section 3 底部的聚合物分类与成盐附注完整迁移至 Section 2；
  3. **Section 4~16 完整英文专业映射**：Context 2 英文分支不得残留未翻译的中文常规陈述。
- **WHEN**: 任意合规的 `Context 1` 输入进入 `Context 2` 治理器时，
- **THEN**: 产出物在保留 100% 源化学事实的同时，完全符合上述规范写法与双语镜像标准。

## REQ-04: 统一调用链与 Agent 提速降耗
- **SHALL**: 所有识别与治理操作 MUST 收敛至 `web/scripts/msds_mcp_gateway.mjs` 单一标准入口，支持一步输出或无缝衔接 `Context 1 -> Context 2` 标准 Markdown 与 JSON 资产。
- **WHEN**: Agent 依据 `msds-studio` 工作流执行任务时，
- **THEN**: Agent MUST NOT 需要读取 `web/src/*.js` 源码或自写临时转换脚本，直接通过统一网关命令即可在秒级获得带有结构标注与自检结果的 `Context 2` 资产。
