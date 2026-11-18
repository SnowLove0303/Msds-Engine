# BL-8129A 生产工具链根因诊断：MSDS-Studio MCP 技能与工作流调用链排查报告

**分析对象**: **Codex Agent + MSDS-Studio MCP 技能工具链 (v6.0-ENTERPRISE)**  
**产品案例**: BL-8129A (水性封闭异氰酸酯固化剂 / Waterborne Blocked Isocyanate Curing Agent)  
**报告编号**: `DIAGNOSTIC-BL8129A-20261109-MCP-WORKFLOW-ROOT-CAUSE`  
**报告性质**: **技能定义、工作流调用链、底层代码与底模架构独立排查诊断报告** (独立于交付物事实审计)  
**执行角色**: MSDS Deliverables Adversarial Auditor (系统架构与工作流专审)  
**诊断基准时间**: 2026-11-09T14:59:00+08:00  

---

## 1. 架构排查背景与问题定调

在针对 Codex 依照 `msds-studio` MCP 技能生成的 `BL-8129A` 交付物进行物理审计时，捕获到了一系列灾难级缺陷（页眉通篇印着 `PEA-4139`、Section 11 毒性表格汉字单字垂直撕裂、英文全篇 38 处标签全角冒号泛滥、Section 8 双重大开天窗）。

**核心定调**：  
这些缺陷**绝对不是 Codex 模型本身的推演能力不足，而是由 MSDS-Studio MCP 技能在“底模健康度”、“会话生命周期管理”、“表格几何感知”与“标点清洗过滤器”等关键工作流节点上的系统性设计缺陷直接诱发的！**

```mermaid
flowchart TD
    subgraph RootCauseMap["MSDS-Studio MCP 工作流调用链崩溃全景"]
        A["官方静态底模<br>(web/public/templates/)"] -->|底模原本写死历史残留| B["Header 表格自带 PEA-4139 病毒"]
        C["Codex 启动工作流<br>createWorkSession()"] -->|加载带毒模板进内存| D["创建 Session 会话"]
        D -->|调用 writeCell / applyPreset| E["只操作正文 document.xml 表格"]
        E -->|缺陷1: Session 生命周期从未调用 updateHeaderFooterData| F["saveSession() 导出交付物"]
        B -->|未被任何代码清洗覆盖| F
        F -->|导出结果| G["🚨 致命事故 1: 交付物页眉通篇印着 PEA-4139"]
        
        H["Table 10 (Section 11) 底模预设<br>Row 3~6 属于急毒复合网格 (C0=11.1, C1=经口/吸入)"] -->|缺陷2: MCP 仅暴露粗糙 writeCell(row,col)| I["Codex 产生几何盲区: 误把 Row 4~6 当顶层顺序行"]
        I -->|把皮肤/粘膜/致敏写进 1.2cm 极窄 C1 格| J["🚨 致命事故 2: PDF 汉字发生单字垂直拉扯撕裂"]

        K["Codex 英文大模型语义英译"] -->|直接输出带有中文全角冒号的文本| L["缺陷3: MCP 缺乏西文标点清洗过滤器"]
        L -->|全角冒号原样透传写入| M["🚨 致命事故 3: 英文版 38 处全角冒号泛滥"]

        N["缺陷4: 剪枝原语设计名存实亡"] -->|源文件无值时仅置空未删tr| O["🚨 致命事故 4: Section 8 双重大开天窗"]
    end
```

---

## 2. 🔍 工作流调用链五大核心病灶逐项深层尸检

### 2.1 病灶一：【底模源头带毒 + Session 生命周期遗漏页眉注入】 $\rightarrow$ 造成 `PEA-4139` 串型事故
- **涉事源码与资产**:
  * 底模物理路径: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_CN_冠志(1).docx`
  * 引擎核心源码: `web\src\template-editor.js`
- **深层故障机理**:
  1. **底模硬编码未清洗**: 我们物理解包官方模板的 `word/header1.xml`，发现其 Header 表格第 1 行直接硬编码了 `<w:t>PEA-4139</w:t>`！
  2. **会话生命周期代码断裂**:
     在 `template-editor.js` 的 556 行代码中，顶部虽然执行了 `import { updateHeaderFooterData } from './docx-engine.js';`，但在 Codex 操作的完整工作流生命周期（`createWorkSession` $\rightarrow$ `applyCompanyPreset` $\rightarrow$ `writeCellValueToSession` $\rightarrow$ `saveSession`）中，**没有任何一行代码调用了 `updateHeaderFooterData`**！
  3. **调用链真空**:
     Codex 作为工具调用方，严格按照 `SKILL.md` 指南操纵单元格。由于 MCP 工具从未提供“修改页眉型号”的原语，也未在导出时挂载钩子，导致底模原本的 `PEA-4139` 像病毒一样被原封不动打包流出。

---

### 2.2 病灶二：【底模复合网格拓扑未透明化 + 缺少业务级装配原语】 $\rightarrow$ 造成 Section 11 汉字垂直撕裂
- **涉事源码与资产**:
  * 官方模板: Table 10（Section 11 毒性资料）
  * 技能定义: `SKILL.md` (Recipe G)
  * MCP 工具: `msds_execute_editor_ops` 中的 `writeCell`
- **深层故障机理**:
  1. **底模的复合行设计**:
     官方底模的 Table 10 并不是一个平铺的一行一个端点的表格，而是一个包含“复合子项”的特殊拓扑结构：
     * `Row 3 (急毒-经口)`: C0=“11.1 急性毒性：”，C1=“经口：”，C2/C3=数据；
     * `Row 4 (急毒-吸入)`: C0=“11.1 急性毒性：”，C1=“吸入：”，C2/C3=数据；
     * `Row 5 (急毒-经皮)`: C0=“11.1 急性毒性：”，C1=“经皮：”，C2/C3=数据；
     * `Row 6 (急毒-评估)`: C0=“11.1 急性毒性：”，C1=“说明：”，C2/C3=数据；
     * `Row 7`: 才是 11.2 主要皮肤刺激性；
     * `Row 8`: 才是 11.3 主要眼睛刺激性；
     * `Row 9`: 才是 11.4 致敏性。
  2. **MCP 工具只提供低级 `writeCell`，导致 Agent 产生几何盲区**:
     MCP 技能没有提供“结构化毒理段落生成器”，只提供了原始的 `writeCell(sectionNumber, rowIndex, cellIndex, text)`。
  3. **Codex 错位硬塞现场**:
     源文档中，急毒只有一项经口 LD50，紧接着就是皮肤刺激和粘膜刺激。Codex 拿到源数据后，误以为底模是从 Row 3 开始顺序向下平铺的，于是：
     - 把急毒经口写在 Row 3；
     - **把“11.2 主要皮肤刺激性：”强行写入了 Row 4 的 C1 单元格**（该单元格在母版中列宽极窄，仅有 1.2 cm，原本只用来容纳“吸入：”两个字）；
     - **把“11.3 主要粘膜刺激性：”强行写入了 Row 5 的 C1 单元格**；
     - **把“11.4 致敏性：”强行写入了 Row 6 的 C1 单元格**；
     - 然后删除了 Row 7~17。
  4. **排版渲染灾难**:
     C0 留着底模原本预设的 4 行重复的“11.1 急性毒性：”，而 C1 被硬塞入十几个汉字的长标签。在不足 1.5 cm 的列宽下，LibreOffice 只能强制按单字折行，在 PDF 中撕裂成惨不忍睹的纵向瀑布！

---

### 2.3 病灶三：【MCP 写入管道完全缺失西文标点清洗层】 $\rightarrow$ 造成英文版 38 处全角冒号泛滥
- **涉事源码与资产**:
  * 编辑器核心: `template-editor.js` 中的 `writeCellValueToSession`
- **深层故障机理**:
  1. Codex 在生成英文文本时，由于提示词或源文档语料的影响，输出了带有全角冒号的键名（如 `"1.1  Product name："`、`"4.1  General measures："`）；
  2. **MCP 工具毫无防御性拦截机制**:
     在 `writeCellValueToSession` 将文本节点插入 OpenXML 的 `w:t` 标签时，**代码中连一行正则替换清洗代码都没有**！
  3. 含有 `\uFF1A` 的中文字符直接进入英文 DOCX，最终导致英文交付物通篇充斥着巨大的全角占位符号，外文规范完全崩溃。

---

### 2.4 病灶四：【剪枝契约名存实亡，缺乏后置自动清扫器】 $\rightarrow$ 造成 Section 8 双重大开天窗
- **涉事源码与资产**:
  * 技能定义: `SKILL.md` (Recipe A)
  * 编辑器核心: `template-editor.js`
- **深层故障机理**:
  1. 源文档没有手部防护通用描述，且职业接触限值按规范需映射到 8.2 工程控制；
  2. 当前工作流的剪枝机制依赖 Codex 主动识别并调用 `deleteRow`。当 Codex 漏调时，它的默认动作是“将单元格置空（写入 `""`）”；
  3. **会话生命周期缺少安全兜底**:
     在 `saveSession` 触发时，底层引擎没有挂载“残存空行物理清除契约（Auto Pruning Sweeper）”，导致 `手部防护：` 和 `8.2  工程控制：` 两个标签单元格作为空壳死行被遗留在交付物中，大开天窗。

---

### 2.5 病灶五：【企业法定白名单未编译进 MCP 参数守卫】 $\rightarrow$ 造成 Section 1 违背 INV-S1-01
- **涉事源码与资产**:
  * 规则库: `legal-invariants-oracle.json`
  * MCP 工具: `mcp-server.js`
- **深层故障机理**:
  企业最高法定白名单 `INV-S1-01` 严正规定：“1.1 产品名称右侧值格必须法定留空，型号并入第二行中文名称”。由于该业务规范没有作为 JSON Schema 或前置校验器编译进 MCP 工具链中，Codex 只能凭借大语言模型的通用常识，把产品型号填入 1.1，从而违背了企业法定规范。

---

## 3. 🛠️ 针对 MSDS-Studio MCP 工具链的系统级重构指引 (Remediation Blueprint)

为确保后续调用 Codex 或其他 Agent 时不再重复出现类似事故，研发团队必须对 `msds-studio` 工具链实施以下四项硬核重构：

### 3.1 改造一：底模物理病毒清洗与会话生命周期强制挂钩
1. **底模脱毒**：立即打开 `web/public/templates/` 下的所有 DOCX 底模，将 Header 中的 `PEA-4139` 物理替换为标准变量或完全清空；
2. **生命周期绑定**：在 `template-editor.js` 的 `saveSession` 导出时，强制调用 `updateHeaderFooterData`：
   ```javascript
   // template-editor.js: saveSession 强制覆盖 Header
   export async function saveSession(session, outputPath, meta = {}) {
     if (meta.modelCode) {
       updateHeaderFooterData(session.engine, {
         model: meta.modelCode,
         company: meta.companyName,
         revisionDate: meta.revisionDate || new Date().toISOString().slice(0, 10),
         language: session.templateKey.startsWith('EN') ? 'EN' : 'CN'
       });
     }
     const buf = await session.engine.exportArrayBuffer();
     fs.writeFileSync(outputPath, Buffer.from(buf));
   }
   ```

### 3.2 改造二：废止低级 writeCell 盲写，升级 Section 11 业务级装配原语
在 MCP 服务中新增高阶原语 `msds_render_toxicity_section`，彻底屏蔽底模脆弱的单元格拓扑：
```javascript
// MCP 新增高级原语: 自动重构标准的 2 列表格，彻底根除列宽挤压与汉字撕裂
export function renderToxicitySection(session, toxicityEndpoints) {
  const table = session.engine.records.find(r => r.sectionNumber === 11);
  // 1. 清空原 Table 10 从 Row 3 开始的所有预设行与复合网格
  // 2. 动态自适应构建标准 2 列表格（左侧 11.x 标签，右侧对应评估文本）
}
```

### 3.3 改造三：在 MCP 写入层前置“中西文标点自愈过滤器”
在 `writeCellValueToSession` 中拦截所有 EN 写入操作：
```javascript
// template-editor.js: 自动清洗中英文标点
export function writeCellValueToSession(session, { sectionNumber, rowIndex, cellIndex, text }) {
  let cleanText = text;
  if (session.templateKey.startsWith('EN')) {
    cleanText = cleanText
      .replace(/：/g, ': ')
      .replace(/，/g, ', ')
      .replace(/（/g, ' (')
      .replace(/）/g, ') ')
      .replace(/。/g, '. ');
  }
  writeCellValue(session.engine, sectionNumber, rowIndex, cellIndex, cleanText);
}
```

### 3.4 改造四：在 saveSession 时无条件触发“原子级后置剪枝清扫器”
在保存文件前，自动扫描 Table 8、Table 14 等所有表格，凡是值格为空或开天窗的行，自动调用 `deleteRow` 物理整行抹杀，彻底根除假剪枝与版面开天窗！
