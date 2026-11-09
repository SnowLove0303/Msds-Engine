# Specification: 系统核心目录绝对只读与 MCP 唯一执行通道规范
(`system-directory-read-only-and-mcp-exclusive-gateway.md`)

## 1. 系统核心目录绝对只读与权限隔离规范 (System Directory Read-Only Specification)

### 1.1 默认绝对只读公理
- **SYS-01 (SHALL NOT mutate system directories without explicit permission)**:
  - 在执行任何 MSDS/TDS 文档覆写、生产或派发任务时，负责执行的 Agent（无论是主协调 Agent 还是派发的子 Agent 如 `msds-overwrite-producer`）**SHALL NOT** 在未经人类用户明文批复授权的情况下，向以下系统核心目录及其子目录创建、修改、重命名或删除任何文件：
    1. `web/src/`（核心排版、通用编辑、流水线、识别与匹配引擎源码）
    2. `web/templates/`（官方正式 Word/PDF 模板资产）
    3. `web/scripts/`（中央主审计套件、通用校验工具等核心平台脚本）
  - 任何试图绕过用户授权直接通过 `write_file`、`edit_file` 或命令行脚本篡改上述目录的行为，**SHALL** 被直接判定为严重违背工程纪律，系统 **SHALL** 触发 `SYSTEM_DIRECTORY_WRITE_FORBIDDEN` 熔断拦截。

### 1.2 业务可写作用域严格封闭公理
- **SYS-02 (SHALL confine writes to designated deliverable zones)**:
  - 生产 Agent 的文件写入与编辑操作 **SHALL** 严格且唯一封闭在以下合法区域：
    1. 目标产品交付物目录（如 `算法训练材料/TDS MSDS 重写版/<品类>/<型号>/` 以及用户指定目录 `待处理文件/<型号>/`）；
    2. 临时认知审计报告与会话草稿目录（如 `产出物审计报告/`、`brain/`、`scratch/`）。
  - 生产 Agent **SHALL NOT** 在系统根目录或 `web/` 根目录下遗留任何带有特定型号名称的一次性临时拼装脚本（如 `build_<model>.mjs`、`patch_<model>.mjs`）。

### 1.3 底座通用缺陷申报与停机闭环公理
- **SYS-03 (SHALL halt and escalate on engine deficiency)**:
  - 当生产 Agent 发现交付物出现内容或版式不符合源文档，且判定根因属于系统通用引擎能力缺失（例如：出现未支持的新大类英译、特殊标签空格模式或新法规要求）时：
    1. 生产 Agent **SHALL NOT** 自行在系统目录打局部特判硬编码（例如严禁编写 `if (model === 'xxx')`）；
    2. 生产 Agent **SHALL** 立即执行安全停机（Safe Halt），并向用户出具结构化的《系统底座通用缺陷申报与升级建议书》（包含源文档事实依据、当前底座缺失点、推荐的通用规则方案及受影响范围）；
    3. 只有在人类用户审阅并明文下达“批准底座升级/修改”指令后，方可由系统治理角色受控启动标准 OpenSpec 立法流程修改系统代码。

---

## 2. MCP 唯一受控执行通道规范 (Exclusive MCP Gateway Specification)

### 2.1 唯一执行通道公理
- **MCP-01 (SHALL use MCP as the sole execution gateway)**:
  - 所有负责生产覆写的 Agent **SHALL** 将 `msds-engine-mcp` 官方工具链作为文档识别、几何手术、受控导出与质量审计的**唯一合法通道**。
  - 严禁任何 Agent 绕开 MCP 协议，通过私自编写 python-docx、原生 DOM/XML 编辑或调用任意非受管脚本直接修改交付物。

### 2.2 标准 MCP 生产四步执行序列
- **MCP-02 (SHALL execute standard four-phase MCP sequence)**:
  - 生产执行流程 **SHALL** 严格按照以下标准化原子序列推进：
    1. **第 1 步：事实识别与感知**：
       调用 `msds_recognize_source` 提取源文件全部 16 章节化学事实、GHS 分类、CAS 组分及理化数据树；
    2. **第 2 步：几何形态透视与前置清零**：
       调用 `msds_get_template_schema` 透视目标母版结构；调用 `msds_execute_editor_ops` 下发 `{ op: 'clearTemplate' }` 或 `{ op: 'clearSectionValues' }` 完成底模值格前置强制清零；
    3. **第 3 步：万能原语受控手术编辑**：
       调用 `msds_execute_editor_ops` 下发结构化编辑指令（`applyPreset`、`writeCellValue`、`insertRow`、`deleteRow`、`deleteColumn`、`writeRichText`、`formatLaserTabs`），严格遵守表格边框外实内虚与标签加粗规范；
    4. **第 4 步：受控派生与集中审计闭环**：
       调用 `msds_batch_export_eight` 触发无头标准化转换，导出 8 份标准交付物（4 DOCX + 4 PDF）；调用 `msds_audit_deliverables` 运行中央主审计套件，断言全绿通过且退出码为 0。

### 2.3 MCP 协议同构执行保障
- **MCP-03 (SHALL provide isomorphic CLI runner when dynamic MCP injection is unavailable)**:
  - 当宿主环境会话未能动态热挂载 MCP 工具时，系统 **SHALL** 提供标准 CLI 驱动器（如 `web/scripts/msds_mcp_gateway.mjs`），以纯净的 JSON-RPC 输入输出完全同构执行 MCP 工具，确保执行逻辑与 MCP 协议 100% 一致，严禁私自绕道。

---

## 3. Agent 角色沙箱与 SOP 规程立法 (Role Sandboxing & Governance)

### 3.1 角色定义严格锁死
- **ROL-01 (SHALL define explicit boundaries in agent metadata)**:
  - 在 `msds-overwrite-producer` 与 `msds-studio-producer` 的 `agent.md` 系统指令中，**SHALL** 明确写入“系统目录只读封印公理”与“MCP 唯一通道公理”，并从其可用工具与行为边界中彻底剥离修改系统核心代码的权限。

### 3.2 逆向审计与违规熔断
- **ROL-02 (SHALL verify compliance in deliverable audit)**:
  - 任何交付物在呈报终审前，审计 Agent **SHALL** 验证在生产生命周期内是否有系统目录文件被污染。若发现系统代码被未经授权改动，直接判定整体验收 `FAIL` 并触发回滚。
