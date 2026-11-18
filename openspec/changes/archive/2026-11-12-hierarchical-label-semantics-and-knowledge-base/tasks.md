# Tasks: Hierarchical Label Semantics and Project Knowledge Base (hierarchical-label-semantics-and-knowledge-base)

- [x] 1. 创建项目开发知识库目录并编写《MSDS 表格结构与语义层级定义规范手册》 (`docs/knowledge-base/MSDS_TABLE_SEMANTICS_AND_LABEL_TAXONOMY.md`) <!-- id: 1 -->
  - 在 `docs/knowledge-base/` 下系统沉淀 7 大语义分类角色定位与 6 大词法边界法则；
  - 验证命令: `node -e "const fs = require('fs'); if (!fs.existsSync('docs/knowledge-base/MSDS_TABLE_SEMANTICS_AND_LABEL_TAXONOMY.md')) process.exit(1); console.log('Task 1 KB established');"`

- [x] 2. 升级 `recognition-engine.js` 实现 `父级标签` 与 `子标签` 精细化分类状态机 <!-- id: 2 -->
  - 更新 `SEMANTIC_TYPES` 词汇表，新增 `PARENT_LABEL` 与 `CHILD_LABEL`；
  - 增强 `classifyRowSemanticType`，精准区分统领性分类题头（如 Section 8 `手部防护：`）与细分参数字段（如 `手套材料：`、`供应商名称：`）；
  - 验证命令: `node --input-type=module -e "import { SEMANTIC_TYPES } from 'file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/recognition-engine.js'; console.log('Task 2 types ready');"`

- [x] 3. 运行统一原生 CLI 重新生成 PA-3612 Context 1 并同步产物 <!-- id: 3 -->
  - 执行 `node web/scripts/run_source_recognition.mjs --source="..." --output="..."`；
  - 同步更新 `output/PA-3612/PA-3612_context1_recognition.md` 与 brain 对应产物；
  - 验证命令: `node "web/scripts/run_source_recognition.mjs" --source="web/scratch/pa_doc_converted/PA-3612 msds_CN 冠志.docx" --output="output/PA-3612"`

- [x] 4. 对照最新定义出具 PA-3612 全景重新审计报告与 1:1 双向核销矩阵 <!-- id: 4 -->
  - 逐章节、逐行核验属性分类，确认不再存在模糊笼统的 `标签`；
  - 验证 Section 8 `手部防护：` 为 `父级标签`，各具体字段为 `子标签`；
  - 严格通过 OpenSpec 合流归档。
