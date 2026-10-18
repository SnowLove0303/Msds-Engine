# Design: 编辑器局部同步覆写模式技术架构

## 1. 架构核心与数据模型 (Data Model)

### 1.1 预设对象定义 (`PresetProfile`)
预设对象完全独立于具体 DOCX DOM，以 JSON 格式存储：

```typescript
interface PresetProfile {
  id: string;                    // 唯一标识，如 "guocai_cn_std" 或 "custom_20261009_01"
  name: string;                  // 预设名称，如 "英德国彩主体标准预设"
  targetTemplate: string;        // 目标底模，如 "CN 国彩" | "EN 国彩" | "INHERIT" (跟随当前主编辑器模板)
  isBuiltin?: boolean;           // 是否系统内置预设（不可删除，但可编辑字段值）
  enabledForExport: boolean;     // 导出时是否默认勾选
  
  // 1. 全局标识与页眉页脚覆盖包
  headerFooterOverrides: {
    company?: string;            // 如 "英德市国彩新材料有限公司"
    entity?: '冠志' | '国彩';    // 主体标识
    model?: string;              // 留空则默认继承基准型号
    version?: string;            // 留空则默认继承基准版本
    revisionDate?: string;       // 留空则默认继承基准修订日期
    customFileNamePattern?: string; // 导出文件名模式，如 "{model} msds_CN 国彩.docx"
  };

  // 2. 语义化字段覆写字典
  fieldOverrides: Record<string, string>; // semanticKey -> overrideValue
}
```

### 1.2 语义化字段键规范 (`SemanticFieldKey`)
为了做到“模板变更时预设依然可用”，字段不能依赖 `table_index` 和 `row_index`，而通过规范化的语义键解析器定位：

| 语义键 (Semantic Key) | 中文模板匹配锚点 | 英文模板匹配锚点 | 典型覆写场景 |
| :--- | :--- | :--- | :--- |
| `sec1.product_name` | `1.1  产品名称` / `中文名称` | `1.1  Product name：` | 产品命名微调 |
| `sec1.chemical_category` | `化学品分类：` | `Chemical category：` | 分类覆写 (如 111 -> 222) |
| `sec1.recommended_use` | `1.2  产品使用建议和使用限制：` | `1.2  Product use suggestions...` | 用途微调 |
| `sec1.supplier.name` | `供应商名称：` | `Name of supplier：` | 主体自动切换 |
| `sec1.supplier.address` | `供应商地址：` | `Supplier address:` | 地址自动切换 |
| `sec1.supplier.tel` | `电话：` | `Tel：` | 电话自动切换 |
| `sec1.supplier.fax` | `传真：` | `Fax：` | 传真自动切换 |
| `sec2.ghs_classification` | `2.1  GHS危险性类别：` | `2.1  GHS Hazard Classification：` | 危险性类别 |
| `sec9.ph` | `9.2  pH值：` / `pH值：` | `9.2  pH value：` / `pH value：` | 理化指标微调 |
| `sec9.viscosity` | `9.7  粘度/25℃：` / `粘度` | `9.7  Viscosity at 25°C：` / `Dynamic viscosity` | 理化指标微调 |
| `sec9.solids` | `9.12 固体含量：` / `固体含量` | `9.12 Solids Content：` / `Solid content` | 固体含量微调 |
| `sec10.possible_reactions` | `10.3 可能的危害反应：` | `10.3 Possible hazardous reactions：` | 反应特性覆写 |
| 通用回退规则 | 任意 `Section N` 标签标准归一化匹配 | 任意 `Section N` 标签标准归一化匹配 | 任意特殊定制标签 |

---

## 2. 编辑功能跟随已有编辑器 (Editor In-Place UX)

必须确保**编辑功能本身直接作用于已有编辑器**，而非弹出外部孤立窗口：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 模板编辑器                                                                   │
│ [ 常用模板: CN 冠志 ▼ ]  [ ↺ 恢复整份模板 ]  [ 审计 ]  [ 📦 同步覆写导出 ▼ ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ 同步覆写模式 ──────────────────────────────────────────────────────────┐ │
│ │ 模式: [● 开启覆写模式]   当前编辑图层: [ 基准视图 (冠志) | ▼ 国彩预设 (2处覆写) ]│ │
│ │ [＋新建预设] [⚙ 管理预设库]       预设目标底模: [ CN 国彩 (已自动绑定) ]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ 00 页眉页脚  │ Section 1 · 物料及供应商标识                                   │
│ 01 Section 1 │ ┌──────────────────────────────────────────────────────────┐ │
│ 02 Section 2 │ │ 1.1 产品名称:  [ OS-1338               ] [继承基准]        │ │
│ ...          │ │ 化学品分类:    [ 222                   ] [已覆写] [↺还原]  │ │
│              │ │ 供应商名称:    [ 英德市国彩新材料有限公司 ] [预设主体]      │ │
│              │ └──────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

### 2.1 编辑图层状态机 (`ActiveLayerState`)
在 `state.editor` 中增加：
- `state.editor.presetModeEnabled`: `boolean`（是否开启覆写模式）。
- `state.editor.activePresetId`: `string | null`（当前正在编辑的图层：`null` 表示基准文档；`preset_id` 表示该预设视图）。
- `state.editor.presets`: `PresetProfile[]`（全局预设清单，与 `localStorage` 双向持久同步）。

### 2.2 单元格智能渲染与响应式覆写
当处于预设视图（`activePresetId !== null`）时：
1. **未覆写字段**：单元格显示基准值，文字为浅蓝/灰色水印样式，右侧微标提示 `[继承基准]`。用户直接在该输入框中输入新值时，系统立即将其升级为 `[已覆写]`，并自动记录至当前预设的 `fieldOverrides` 中。
2. **已覆写字段**：边框与背景采用琥珀色/黄色高亮提示，显示覆写后的值，右侧提供 `[↺ 还原为基准]` 按钮。点击还原即从预设中剔除该键，恢复为继承基准值。
3. **支持 Section 00 全局标识覆盖**：在 Section 00 中，主体公司、产品型号、MSDS 编号及导出文件名同样呈现基准值 vs 预设覆写值对比，支持自由覆盖。

### 2.3 模板变更抗毁机制 (Template-Agnostic Resilience)
当用户在顶部下拉切换模板（如由 `CN 冠志` 切换至 `CN 国彩` 或 `外部模板`）：
1. 主编辑器重载目标模板的 OpenXML 结构并填充基准值。
2. 预设库数据**完全不受影响**，继续保留在内存与持久化存储中。
3. 重新渲染视图时，自适应寻址引擎自动在新模板的 DOM 节点中重新解析语义键，覆写高亮与值实时平移应用，**100% 保持稳定可用**！

---

## 3. 同步批量导出流水线 (Synchronized Multi-Export Pipeline)

### 3.1 导出交互抽屉 (Export Dialog)
点击顶部 `[📦 同步覆写导出]`，弹出轻量侧滑/模态框：
- **基准文档**：`[☑] OS-1338 msds_CN 冠志.docx (当前编辑基准)`
- **同步预设**：
  - `[☑] OS-1338 msds_CN 国彩.docx (目标模板: CN 国彩, 覆写: 2项)`
  - `[ ] OS-1338 msds_EN 冠志.docx (目标模板: EN 冠志, 继承基准)`
  - `[ ] 客户专供版 (目标模板: CN 冠志, 覆写: 1项)`
- **操作按钮**：`[一键批量生成并下载]`（单文件直接下载，多文件连续下载或打包为 `OS-1338_MSDS_发布包.zip`）。

### 3.2 导出内核实现 (`exportMultiPresetBundle`)
```javascript
async function exportMultiPresetBundle(baseEngine, selectedPresetIds) {
  const outputs = [];
  
  // 1. 导出基准版本
  const baseBlob = await baseEngine.exportBlob();
  const baseName = buildExportDocxName(baseEngine, { customFileName: state.editor.customFileName });
  outputs.push({ name: baseName, blob: baseBlob });

  // 2. 遍历各勾选预设，生成衍生版本
  for (const presetId of selectedPresetIds) {
    const preset = state.editor.presets.find(p => p.id === presetId);
    if (!preset) continue;

    // 载入预设目标模板 (若 targetTemplate 为 INHERIT 则克隆当前 baseEngine)
    const targetEngine = await resolveTargetTemplateEngine(preset.targetTemplate, baseEngine);
    
    // 将基准文档核心业务数据注入目标模板
    await mergeBaseDataToTargetEngine(baseEngine, targetEngine);
    
    // 应用预设的页眉页脚与字段覆写
    applyPresetOverrides(targetEngine, preset);
    
    const presetBlob = await targetEngine.exportBlob();
    const presetName = resolvePresetExportName(preset, targetEngine, baseName);
    outputs.push({ name: presetName, blob: presetBlob });
  }

  return outputs;
}
```
