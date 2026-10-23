---
name: msds-studio
description: "MSDS Studio 智能化文档处理工作台与 Agent API 调用规范：覆盖源文件结构化识别、智能匹配装配、模板清空防污染控制（清空模板/恢复模板/特殊清空）、专业化英译剪枝、实体多预设派生与标准 8 格式（4 DOCX + 4 PDF）批量导出全流程 SOP。"
---

# MSDS Studio 功能调用与使用规范指南 (MSDS Studio Skill)

本技能为各类 AI Agent 与研发人员提供调用 **MSDS Studio** 核心引擎、执行全自动或半自动人机协同 MSDS 生产的标准契约与作业指南。全面覆盖 Web UI 工作台交互、Headless REST API 管道驱动、模板清空防残留治理、16 章节差异核对审查及标准 8 格式闭环交付。

---

## 🛑 唯一法定作业路径：严禁绕开 MSDS Studio 直改文档 (Exclusive Route Guardrail)

> [!CAUTION]
> **绝对禁令：严禁任何 Agent 绕开 MSDS Studio 引擎直接编写 ad-hoc 脚本（如调用 python-docx、原生 XML 修改或文件写入）直接操作 DOCX/PDF 文件！**  
> 一切 MSDS 的识别、装配、修改、翻译、预设覆盖与 8 格式导出，**必须且仅能通过 MSDS Studio API（如 `POST /api/msds/pipeline/generate-eight`）或官方流水线脚本（`node run_pipeline.mjs`）执行**。脱离 Studio 引擎私自修改的文档无法触发 5 大质量门禁，底层 XML 几何必定损坏，一律视为非法产物并一票否决！

---

## 🧭 一、 系统架构与双模访问体系

MSDS Studio 支持两种对等操作模式，底层共享统一的数据与业务规则引擎：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              MSDS Studio                               │
├──────────────────────────────────┬─────────────────────────────────────┤
│      Web 交互工作台 (Vite)        │       Agent REST API (无头服务)      │
│  - http://127.0.0.1:5173         │  - http://127.0.0.1:5174/api/msds   │
│  - DOCX 结构化识别工作台         │  - (或通过 5173 反代 /api/msds)     │
│  - 智能匹配与无值剪枝工作台      │  - POST /api/msds/import            │
│  - 模板安全编辑器 (清空/重置/改标)│  - POST /api/msds/match             │
│  - 逐项审阅抽屉与批注面板        │  - POST /api/msds/pipeline/*        │
│  - 统一交付物导出中心            │  - GET  /api/msds/pipeline/status   │
├──────────────────────────────────┴─────────────────────────────────────┤
│                               核心引擎层                               │
│  - pipeline-engine.js   : 四阶流水线驱动 (CN装配/EN英译/预设派生/8格式导出)│
│  - smart-matching.js    : 16 章节插槽映射、语义归一与无值物理剪枝      │
│  - docx-engine.js       : 底层 OOXML 解析、写入、清空、重塑与防污染控制  │
│  - annotation-engine.js : 6 维语义锚点与审阅数据流                     │
│  - pdf-converter.js     : 高保真 PDF 渲染转换与交付物校验              │
├────────────────────────────────────────────────────────────────────────┤
│                         官方基准底模 (绝对只读)                        │
│  - 正式模板_MSDS_CN_冠志.docx (SHA-256 锁定)                           │
│  - 正式模板_MSDS_EN_冠志.docx (SHA-256 锁定)                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 二、 核心 REST API 契约全景

统一响应采用 JSON Envelope 规范：`{ "success": true, "sessionId": "...", "data": ... }`。

### 1. 服务端口与探活预检
* **核心 API 端点**：`http://127.0.0.1:5174/api/msds`（独立 Node 守护进程 `web/src/api-server.mjs`）
* **Web 端反代端点**：`http://127.0.0.1:5173/api/msds`（由 Vite 开发服务器代理转发至 5174）
* **服务探活**：`GET /api/msds/health`
  * 响应：`{ "status": "ok", "service": "msds-studio-api" }`
  * **充要条件**：执行任何生产前必须先确认返回 `status === "ok"`。

### 2. 端到端一键生产核心接口 (`generate-eight`)
* **接口**：`POST /api/msds/pipeline/generate-eight`
* **职责**：原子化串联五阶流水线：“Clean Slate 模板前置清空 -> 源文件中文母版装配 -> 英文模板 1:1 同构剪枝与专业英译 -> 广州冠志与英德国彩双实体预设派生 -> 批量生成 4 份 DOCX (内置安全文件锁自愈防崩溃) -> 驱动 PDF 渲染守护服务 -> 触发 5 大硬性门禁全检”。
* **请求体规范 (JSON Payload)**：
  ```json
  {
    "model": "PU-608",
    "cnGroundTruthPath": "D:\\冠志\\TDS MSDS\\1-1 单组份水性聚氨酯树脂 PU\\PU-608\\PU-608 msds_CN 冠志.docx",
    "targetDir": "F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608",
    "revisionDate": "2023/09/27"
  }
  ```
* **参数详解**：
  * `model` (*string, 必填*)：产品标准型号（如 `PU-608`、`BL-8129A`）；
  * `cnGroundTruthPath` (*string, 必填*)：客户或实验室提供的源 DOCX 文件绝对路径；
  * `targetDir` (*string, 必填*)：标准 8 格式最终产出物的落盘目录绝对路径；
  * `revisionDate` (*string, 可选*)：修订日期（格式 `YYYY/MM/DD` 或 `YYYY年MM月DD日`），默认自适应提取源文件真实日期。
* **成功响应 (HTTP 200)**：
  ```json
  {
    "success": true,
    "model": "PU-608",
    "deliveredFiles": [
      "PU-608 msds_CN 冠志.docx",
      "PU-608 msds_CN 冠志.pdf",
      "PU-608 msds_CN 国彩.docx",
      "PU-608 msds_CN 国彩.pdf",
      "PU-608 msds_EN Guanzhi.docx",
      "PU-608 msds_EN Guanzhi.pdf",
      "PU-608 msds_EN Guocai.docx",
      "PU-608 msds_EN Guocai.pdf"
    ],
    "qualityAudit": {
      "allPassed": true,
      "gate1_indent": "PASS",
      "gate2_topology": "PASS",
      "gate3_preambles": "PASS",
      "gate4_zero_chinese": "PASS",
      "gate5_header_footer": "PASS"
    }
  }
  ```

---

## 🔒 三、 核心法定业务规范与装配公理 (Business Invariants)

在调用流水线或审阅文档时，必须严格遵守以下业务不变量：

### 1. Section 11（毒理学资料）法定装配公理
* **说明行动态守恒公理**：源文件 Section 11 若包含特定组分数据引言（如 `以下是...毒理学数据：`），中文版必须 100% 独立成行跨列保留；英文版必须以对应化学品名称专业同构英译（如 `The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):`），严禁物理删除！
* **吸入危险 (Aspiration hazard) 法定保留公理**：源文件明确声明的“吸入危险：无数据资料”，属于受法律保护的法定安全声明，严禁以“无数据资料”为由视为死重删除！若底模缺失该槽位，系统必须自动动态插入 `11.9 吸入危险：`，附加信息顺延为 `11.10`；英文版同步保留 `Aspiration hazard` 并英译为 `No data available.`。
* **法律标签用词优先遵照源文件公理**：当源文件使用“主要皮肤刺激性”时，中文标签优先采用 `11.2 主要皮肤刺激性:`，严禁被旧模板的“原发性皮肤刺激”强行覆写。

### 2. Section 12（生态学资料）动态装配公理
* **说明行与免责行双模态守恒**：源文件包含 2 行说明行（产品免责 + 组分引言）时，中文完整保留 2 行，英文精准同构英译 2 行说明行；
* **物种学名与动态测试周期自适应**：支持任意测试小时数（如 24h, 48h, 72h, 96h）正则提取与学名规范英译（如虹鳟鱼 -> `Rainbow trout (Oncorhynchus mykiss)`）。

### 3. 五大硬性质量门禁标准 (QA Gates Standards)
* **Gate 1**：Section 9 标签格式必须符合 420 dxa 悬挂缩进且零 `<w:tabs>` 制表位；
* **Gate 2**：Section 11 拓扑守恒，11.7 单元格宽度必须为 6262 dxa 且 `gridSpan="3"`，无悬空 `vMerge`；
* **Gate 3**：Section 11 与 Section 12 说明行数量必须与源文件解析数量绝对 1:1 一致；
* **Gate 4**：英文版全文字段 100% 零中文残留（`assertZeroChinese`）；
* **Gate 5**：页眉页脚修订日期与公司信息自适应源文件事实。

---

## 🚀 四、 Agent 规范调用 SOP (标准生产作业流)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. 环境探活预检 ──> GET /api/msds/health (确认 5174 或 5173 守护进程就绪) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 探活绿灯
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. 源文件物理备份 ──> 将源文件无损复制至目标目录，命名为:                 │
│                      ${model} msds_CN 冠志_源文件.docx                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 备份完毕
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. 发起端到端生产 ──> POST /api/msds/pipeline/generate-eight            │
│    (或命令行执行) ──> node web/run_pipeline.mjs --model ...             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 管道执行 (含文件锁防独占自愈保护)
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 4. 触发五大门禁全检 ──> assertDeliverableQuality (断言退出码必须为 0)      │
│    - Gate 1: S9 420dxa 悬挂缩进且零 <w:tabs> 制表位                     │
│    - Gate 2: S11 单元格宽度 6262dxa，gridSpan=3，右边框垂直齐平         │
│    - Gate 3: S11/S12 说明行数量双重守恒 (expectedCount)                 │
│    - Gate 4: 英文交付物全文字段 100% 零中文残留                         │
│    - Gate 5: 页脚修订日期与公司抬头自适应同步源文件                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 门禁全绿
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 5. 校验交付物完整性 ──> 验证 4 DOCX + 4 PDF + 1 源文件留存 (共9项)完备性   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 产出闭环
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 6. 沉淀生产日志 ──> 输出全流程记录报告与 API 调用审计，沉淀避坑经验      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💎 五、 黄金基准实战范例：PU-608 生产调用全过程

### 5.1 任务输入事实
* **型号**：`PU-608`（单组份水性聚氨酯树脂）
* **源文件路径**：`D:\冠志\TDS MSDS\1-1 单组份水性聚氨酯树脂 PU\PU-608\PU-608 msds_CN 冠志.docx`
* **目标交付目录**：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\PU-608`
* **业务特征**：S3 含 NMP 组分，S11 含 NMP 毒理学引言行与吸入危险，S12 含 2 行说明行及虹鳟鱼 96h 生态毒理指标。

### 5.2 步骤 1：源文件无损物理备份
```powershell
Copy-Item "D:\冠志\TDS MSDS\1-1 单组份水性聚氨酯树脂 PU\PU-608\PU-608 msds_CN 冠志.docx" `
          "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\PU-608\PU-608 msds_CN 冠志_源文件.docx"
```

### 5.3 步骤 2：发起 API 生产请求 (Node.js 范式)
```javascript
const resp = await fetch('http://127.0.0.1:5174/api/msds/pipeline/generate-eight', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'PU-608',
    cnGroundTruthPath: 'D:\\冠志\\TDS MSDS\\1-1 单组份水性聚氨酯树脂 PU\\PU-608\\PU-608 msds_CN 冠志.docx',
    targetDir: 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\PU-608',
    revisionDate: '2023/09/27'
  })
});
const result = await resp.json();
console.log('交付结果:', result);
```

### 5.4 步骤 3：质检断言核验
* **S11 动态行数守恒**：Row 3 完整保留 `以下是N－甲基吡咯烷酮毒理学数据：`，英文版同构英译为 `The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):`；
* **S11 吸入危险保留**：`11.9 吸入危险：无数据资料。` 完整保留并英译为 `No data available.`，附加信息顺延为 `11.10`；
* **S12 说明行与生态指标**：2 行说明行动态保留，虹鳟 96h 指标精准英译；
* **交付清单核验**：4 份 DOCX + 4 份 PDF + 1 份源文件留存完备交付。

---

## 🛠️ 六、 常见故障排查指南 (Troubleshooting)

| 故障现象 | 潜在根本原因 | 官方标准化排查与解决办法 |
| :--- | :--- | :--- |
| **API 服务连接被拒绝 (`ECONNREFUSED 5174`)** | 后台 `api-server.mjs` 未启动或异常退出 | 执行命令启动：`node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\api-server.mjs"` 或双击 `启动Agent-API服务.bat` |
| **文件被独占报错 (`EBUSY: resource busy or locked`)** | 目标 DOCX 正被用户的 WPS 或 Word 软件打开占用 | 系统已内置 `safeWriteFileWithLockGuard` 自动重试与降级机制；提示用户保存并关闭外部文档可恢复标准文件就地覆盖 |
| **Section 11 或 12 说明行断言拦截失败** | 源文件说明行被旧正则过滤或模板旧行未清理 | 检查源文件说明行用词（如是否包含“以下是/以下为”），确认 `smart-matching.js` 正则支持并触发 Gate 3 守恒验证 |
| **Section 12 英文断言报包含中文** | 源文件中出现了英译字典未收录的水生生物或专用指标 | 检查 `pipeline-engine.js` 中的 `ECO_SPECIES_DICTIONARY`，添加该物种的学名与规范英文映射（如虹鳟鱼补充） |
| **Web 编辑器导出时名称不变或只出模板** | 前端草稿池未原子同步或文件名未消费（历史缺陷） | 确保已合入 2026-10-23 的 `ensureCurrentDraft(true)` 与 `computeExportTargets` 修复补丁，或直接使用工具栏【导出当前文档】按钮 |

---

## 📐 七、 中英文“序号 + 标签”排版不变量与方案 A 英文工业标准规范 (Typography Invariants)

在 MSDS Studio 中，中英文排版体系与“序号 + 标签”必须严格执行以下法定不变量：

### 7.1 中英文排版规范对照基准
1. **统一悬挂缩进几何（Hanging Indent 几何定理）**：
   - 凡包含二级序号（如 `1.1`、`2.1`、`9.1`、`11.2` 等）的标签单元格，段落属性 `<w:pPr>` 必须且唯一设置：
     `<w:ind w:left="420" w:hanging="420"/>`（左缩进 420 dxa，首行悬挂缩进 420 dxa）；
   - 标签换行时第二行文字与首行文字绝对垂直对齐，绝不回缩到序号下方。
2. **绝对零制表符禁令（No `<w:tabs>` / No `\t`）**：
   - 全文档表格内彻底清除 `<w:tabs>` 与 `<w:tab/>`，禁止任何制表位注入，根除跨 Word/WPS 版本文字排版跳变崩塌。
3. **序号与标签连接符（双半角空格规范）**：
   - 序号与标签正文之间统一采用**两个半角空格（`"  "`）**分隔（如 `1.1  化学品中文名称：`、`1.1  Product identifier:`）；
   - 严禁使用全角空格，严禁单空格或制表符。
4. **标点合规法则**：
   - 中文版标签末尾统一采用**全角中文冒号（`：`）**；
   - 英文版全量清洗为**半角英文冒号（`:`）**，严禁英文版残留任何全角冒号。
5. **英文方案 A 工业合规字体体系 (Arial 9.5pt)**：
   - **大标题 (Row 0)**：Arial 11pt Bold (`w:sz="22"`)；
   - **标签 (Label) / 单列子标题**：Arial 9.5pt Bold (`w:sz="19"`)；
   - **内容值 (Value) / 说明行 / 法规项 / 免责声明**：Arial 9.5pt Regular (`w:sz="19"`)；
   - **页眉页脚**：Arial 9pt Regular (`w:sz="18"`)；
   - **底模伪断行自愈**：单元格内多段人工硬回车拆分的标签，在装配收敛时自动合并为标准单一原生段落。

