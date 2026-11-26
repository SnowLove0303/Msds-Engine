# 🧪 MSDS-Studio 唯一体系交接资料包与新 Agent 标准化操作入口 (v11.0-UNIFIED)

> **定位**：本目录（`体系交接文档/MSDS_Studio_Agent_Test_Kit`）为 **MSDS-Engine 持续维护体系 Graph 核心节点**，也是新 Agent 接手时唯一允许调用的**标准化覆写产出与三任务审计操作入口**。
> **核心技能规范**：完整 SOP 与不变量见本包内 [skill/SKILL.md](./skill/SKILL.md)（与全局 `~/.gemini/config/skills/msds-studio/SKILL.md` 100% 同步）。

---

## 🚨【最高法定红线：唯一标准入口、两段式门禁与三权分立铁律】

1. **唯一合法生产入口与两段式 Agent 校对门禁**：所有正式 8 格式（4 DOCX + 4 PDF）MSDS 产出**必须且只能**通过 [run_standard_production.mjs](./run_standard_production.mjs)（底层调度 `web/src/production-orchestrator.js` 7 阶流水线）执行，且必须经过 **`--prepareOnly` → Agent 逐行校对翻译 → `--approveContext2 --translations=...`** 两段式门禁；未传 `--approveContext2` 时流水线直接硬阻断（`[CONTEXT2_AGENT_APPROVAL_REQUIRED]`）。
2. **覆写产出 Agent 绝对禁改源码与审计**：执行覆写产出的 Agent **严禁修改任何 `web/src/*`、`web/scripts/*` 源码及任何审计脚本/规则**，严禁私写分步脚本或调用 LibreOffice 转 PDF。**过程中只要出现报错或审计失败，必须立即停机向主协调汇报错误所在，由用户最终判断裁决**。
3. **审计 Agent 严禁改码、严禁抽检、单型号独立交付 4 份 `.md`**：负责审计的 Agent **严禁修改源码或产出物**，**严禁采用任何形式的抽检**（必须 100% 全量核验双主体 CN/EN DOCX+PDF），每个型号必须独立输出全套 **4 份 `.md` 报告**（`<MODEL>_context3.md`、`<MODEL>_content_audit_report.md`、`<MODEL>_topology_audit_report.md`、`<MODEL>_final_audit_report.md`）并呈报用户最终裁决。
4. **系统修改与 Graph 同步归口**：仅在用户明确裁决指令下，由主协调修改核心源码与规范，并同步更新本资料包（`run_standard_production.mjs`、`presets/company_presets.json`、`skill/SKILL.md`、`README_FOR_AGENT.md`）后重新分发任务。

---

## 一、 资料包资产清单

| 资产路径 | 角色说明 |
| :--- | :--- |
| `skill/SKILL.md` | **完整工业级生产与审计总纲**（与全局 `SKILL.md` 100% 同步） |
| `run_standard_production.mjs` | **唯一受控两段式覆写生产 Runner**（支持 `--prepareOnly` / `--approveContext2` / `--translations`） |
| `run_three_task_audit_prep.mjs` | **Agent 审计任务 1 前置采集器**（生成单文件合并版 `<MODEL>_context3.md`） |
| `presets/company_presets.json` | **企业多主体外置预设真源**（广州冠志黄埔区 / 英德国彩，同步驱动渲染与动态主体隔离审计） |
| `templates/` & `source/` | **官方中英文正式底模与示例源文件** |

---

## 二、 标准执行三步走（两段式产出 → 全量三任务审计 → 验收同步 Notion）

### 第一步：两段式 Agent-in-the-Loop 标准化覆写产出（严禁跳过校对直通）
```powershell
# 1. 阶段 A：运行 Context 1 -> Context 2 并导出校对包（不写入编辑器）
node run_standard_production.mjs --source="<SOURCE_DOCX>" --model=<MODEL> --targetDir="./output/<MODEL>" --prepareOnly

# 2. Agent 逐行校对 <MODEL>_context2_review.md 的中英文翻译，修正/补全 <MODEL>_context2_translations.json
#    重点核查：产品名称/分类、高分子组分、4.4(soap and plenty of water)、6.1(ventilation and/or exhaust ventilation)、11.7(delayed toxicity)

# 3. 阶段 B：Agent 显式批准 Context 2 后，放行写入编辑器、导出 4 DOCX + 4 PDF 与机械审计（含全 16 节全角色 XML、CAS 守恒与动态主体隔离）
node run_standard_production.mjs --source="<SOURCE_DOCX>" --model=<MODEL> --targetDir="./output/<MODEL>" --approveContext2 --translations="./output/<MODEL>/<MODEL>_context2_translations.json"
# 如需直接分流至 Word/PDF 目录，可附加：--wordDir="<WORD_DIR>" --pdfDir="<PDF_DIR>" --skipUserSync
```

### 第二步：强制 Agent 三任务全量审计（严禁抽检，一型号 4 份 `.md`）
1. **任务 1（三层对照内容审计）**：**不使用识别模块**直接读取原生源 `.docx` XML 段落（第一层） + 识别模块 Context 1（第二层） + 运行 `run_three_task_audit_prep.mjs` 获取产出物 Context 3（第三层），写入 `<MODEL>_context3.md`。依据**“内容来源于源文件、继承源文件内容”**并结合**局部限制白名单**（含模板标题固定继承、S1/S2/S8/S11 硬规），逐章核查双主体缺漏、非法新增与逐行英译一致性，输出 `<MODEL>_content_audit_report.md`。
2. **任务 2（7 维度拓扑结构审计）**：对全部 8 份交付物（4 DOCX + 4 PDF，100% 全量覆盖）实测 7 大维度（模板自发现画像 `TemplateProfile` 与示范清零、动态企业预设双主体零串号、全 16 表统一众数宽 `9781 dxa`、S3 `3.2` 父标签左对齐与数据行居中零缩进、S8 `8.1->8.2` 与 `8.2` 两列、S11 2 列网格及 `11.6` 空行分隔、`GLOBAL_ROLE_STYLE_TOKENS` 全 16 节全角色字号/字重/字体、化学式上下标、EN 页脚单行与 WPS COM PDF 渲染），输出 `<MODEL>_topology_audit_report.md`。
3. **任务 3（综合终审裁决）**：必须综合 **任务 1（内容 `.md`）+ 任务 2（拓扑 `.md`）+ 全局/局部规范** 作出最终放行/阻断裁决（不盲从单一内容审计结论），输出 `<MODEL>_final_audit_report.md`。

### 第三步：用户验收上传后联动整理专员
- 用户确认“**已验收 / 已上传**”后，立即交接 **`MSDS/TDS 整理专员`** 核查磁盘交付并同步更新 **Notion 总表**（`是否验收 = 是`、`是否上传 = 是`、`全景评级`）。

---

## 三、 必须死守的局部硬性规范与底层不变量 (`@ANTIGRAVITY_INVARIANT_LOCK`)

1. **Section 大标题继承模板（拓扑层规定 > 源文件层规定）**：模板第 0 行识别到章节标题时固定使用模板标题，不受“内容来源于源文件”监管。
2. **Section 1 中英文规则**：
   - 中文版：`1.1 产品名称：` 填纯型号，`中文名称：` 必须硬性拼接产品型号（如 `羟基聚氨酯分散体 HPU-7651`）；
   - 英文版：取消 `Product Chinese name`，将完整英文品名与型号合并写入 `1.1 Product name:`。
3. **Section 2 非危源文继承**：非危品忠实保留源文 `2.2` 的 `GHS-象形图` 及其值（如 `根据GHS不属于危害化学品`），严格按 4 级缩进，剔除冗余重复非危声明。
4. **Section 3 & Section 8 居中与父标签规范**：`3.2 成分` / `3.2 Ingredients` 父标签必须左对齐（`jc="left"`）；仅表头与具体成分/OEL 数据行居中且清除 `w:ind`。
5. **Section 8 顺序与 `8.2` 两列结构**：锁定 `8.1 暴露控制 -> 8.2 控制参数`；无 OEL 多列表时将 `8.2` 下说明行合并为右侧值形成 2 列键值结构；`8.1` 子标签对齐基线。
6. **Section 11 双范式与父子级括号规范**：删除 `11.1 毒理学效应` 干扰行；多子项父概念（`急性毒性`、`生殖毒性`、`STOT 评估`）统一转为 `父（子）：`；整体概念 `亚急性，亚慢性和延迟毒性` 不加冒号；重建标准 2 列网格并保留 `11.6` 多研究间空行分隔（CN/EN 同构）。
7. **模板自发现与单拓扑双语投影**：由 `detectTemplateProfile` 自动探测众数表宽、两栏网格与角色字阶；CN 与 EN 共用同一结构拓扑（IR），仅做内容与参数投影。
8. **PDF 官方通道唯一性**：严禁 LibreOffice 裸转，必须通过 `web/src/pdf-converter.js`（`Windows COM / WPS/Word`）生成高清矢量 PDF。
