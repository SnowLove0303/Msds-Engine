# Design

## Context
依据《PU-1001至PU-1004标准答案四方对照与智能匹配优化方向超级详细报告》，智能匹配引擎虽然统计上实现了 16 章节覆盖，但到模板编辑器行与单元格的投影（Projection）存在多处结构失真与端点残留，导致导出的实际 DOCX 与历史标准答案（`D:\应用缓存\Edge下载\PU-1007等\`）存在明显差距。

本设计致力于建立五层闭环处理机制，重构 Section 2/4/5/11/12/15 的行绑定与剪枝逻辑，确保生成结果具备高保真度。

## Goals / Non-Goals

**Goals:**
1. **Section 2 细分多槽位行投影**：消除将多个 GHS 分类和说明挤压进单一单元格的做法，按标准答案 12~15 行体系精准注入 GHS 分类、标签要素、象形图、信号词、危险说明、防范说明、理化危险、健康危害、环境危害与其他危害；
2. **Section 11/12 端点清册与干净剪枝**：源仅有“无可用的毒理/生态学研究”时，物理删除所有未测试端点行（11.1~11.10、12.1~12.3 及其中间子标签），Section 11/12 仅保留 2 行（标题行 + 产品级独立说明行）；
3. **Section 15 法规顺序与容量自适应克隆**：严格按标准答案法定顺序排列，并在模板行数不足时自动克隆新增行，保证 GB 15258 绝不遗漏；
4. **Section 4 显式 Template Profile**：建立 CN 模板显式行索引映射，确保源急救事实 100% 替换模板示例值；
5. **Section 5 语义换行策略**：保留 5.3、5.4 独立句子的换行边界；
6. **Section 1/3 源保真度**：中文名称型号前半角空格规范；PU-1002 组分名保留源文案“水性聚氨酯树脂分散体”；
7. **DOCX 导出重载闭环测试**：构建针对 PU-1001 至 PU-1004 标准答案的端到端 Parity 自动化验证套件。

**Non-Goals:**
- 不修改底层 DOCX XML 几何拓扑定义与核心样式 token。
- 不引入未经验证的第三方重量级依赖，全部复用已有 `docx-engine.js`。

## Decisions

### 1. 建立 CN 模板显式 Profile (`CN_GUANZHI_PROFILE`)
在 `web/src/smart-matching.js` 中定义模板专属行绑定契约：
```javascript
export const CN_TEMPLATE_PROFILE = {
  section4: {
    symptoms: { targetLabelMatch: /一般措施/i, defaultFallbackRow: 1 },
    ingestion: { targetLabelMatch: /误服/i, defaultFallbackRow: 2 },
    eye_contact: { targetLabelMatch: /接触眼睛/i, defaultFallbackRow: 3 },
    skin_contact: { targetLabelMatch: /接触皮肤/i, defaultFallbackRow: 4 },
    inhalation: { targetLabelMatch: /吸入/i, defaultFallbackRow: 5 },
    medical_treatment: { targetLabelMatch: /特别提示/i, defaultFallbackRow: 6 },
  },
  section15: {
    statutoryOrder: [
      'material_regulations_intro',
      'other_provisions',
      'complies_requirements_header',
      'hazchem_regulation_591',
      'gb_t_16483',
      'gb_13690',
      'gb_30000',
      'gb_15258',
    ]
  }
};
```

### 2. Section 2 细分多槽位行投影与删行重构
重构 `applyMatchResultToEditor` 中 `s === 2` 的处理流程：
1. 识别 2.1 分类、2.2 标签要素、象形图、2.3 信号词、2.4 危险说明、2.5 防范说明、2.6 理化危险、2.7 健康危害（吸入/食入/皮肤/眼睛/症状）、2.8 环境危害、2.9 其他危害各个候选事实；
2. 遍历模板行，精准寻址写入各自对应行；
3. 对防范说明中的 P 代码（P201、P202、P260...）保留独立换行；
4. 收集所有未被填充事实的模板行，执行倒序物理删除；
5. 重新连贯排号，形成 12~15 行的标准答案结构。

### 3. Section 11/12 端点清册判定（Endpoint Presence Manifest）
1. 检查 `matchedSec.matchedRows` 中是否存在任何实质性非空端点研究数据（排除“无数据资料”或占位符）；
2. 若源仅声明“该产品无可用的毒理学/生态学研究”，判定为 `hasEndpoints === false`；
3. 将 Section 标题下的第一行设为产品级说明行；
4. 自底向上删除模板中所有 11.1~11.10、12.1~12.3 占位行；
5. 最终 Section 11 和 12 严格收敛为 2 行，彻底清除模板幽灵文本。

### 4. Section 15 自适应容量克隆与保全
1. 收集待写入的所有 5 项法规；
2. 查找模板中的“符合下列法规要求：”起始行；
3. 若模板后续可用数据行少于 5 行，使用 `addRowAfter(editorEngine, tRecord, lastRowIdx)` 动态克隆补充行；
4. 保证全部 5 项法规（危险化学品安全管理条例、GB/T 16483、GB 13690、GB 30000.2-29、GB 15258）按法定顺序 100% 完整填入。

### 5. Section 5 语义换行与 Section 1/3 文本保真
1. 对 5.3 物质或混合物的特殊危害：若包含多个完整陈述句，用 `\n` 分隔（燃烧释放气体一行，烟尘吸入警告一行）；
2. 对 5.4 消防预防措施：消防人员佩戴装备一行，禁止污染灭火水流入环境一行；
3. Section 1 中文名称格式化：若型号未隔开，使用正规化工具追加单一空格，输出 `水性聚氨酯光亮剂树脂 PU-1002`；
4. Section 3 组分名称：优先使用源文档准确提取的名称（如 `水性聚氨酯树脂分散体`），不强制缩写。

### 6. 端到端导出重载闭环测试 (Export & Reload Audit)
编写专项自动化测试脚本 `web/tests/test_pu_series_standard_parity.mjs`：
1. 依次加载 PU-1001 至 PU-1004 真实样本并执行匹配与注入；
2. 执行 `exportDocx(editorEngine)` 生成真实 DOCX 二进制；
3. 立即通过 `loadDocx(exportedBuf)` 重新加载并抽取 16 个 Section 结构；
4. 对照 `D:\应用缓存\Edge下载\PU-1007等` 对应标准答案断言：
   - Section 2 行数及槽位对标；
   - Section 11/12 仅保留 2 行且无幽灵残留；
   - Section 15 包含完整 5 项法规且包含 GB 15258；
   - Section 4/5 准确无模板旧示例残留；
   - Section 1 中文名称含半角空格；
   - Section 3 组分名称保真。

## Risks / Trade-offs

- **[Risk]** Section 15 动态增行可能影响表格整体格式或边界。
  - **Mitigation**: 使用成熟的 `addRowAfter` 工具克隆前一行的边框与列结构，确保样式完全继承。
- **[Risk]** Section 11/12 删行可能在存在真实端点数据的复杂化学品中被误删。
  - **Mitigation**: 严格设立端点数据存在性检查，只有当源文档明确只有产品级“无可用研究”且无任何具体端点数据时才触发紧凑收敛；若有真实 LD50、LC50 等数据，则正常保留端点行。
