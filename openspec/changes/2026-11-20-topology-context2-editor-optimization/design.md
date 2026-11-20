# Design: 拓扑驱动 + Context 2 + 编辑器全链路优化架构设计

## 1. 拓扑结构驱动编辑器几何硬锁的数据流

```text
Template (.docx)
  │
  ▼ inspectTemplateSchema()
TopologySchema {
  sections: { 1..16 },
  typographyProfile: {
    isEnglish,
    fontFamily: "宋体" | "Arial",
    seqFontFamily: "Times New Roman" | "Arial",
    labelFontSize: "24" | "19",
    seqFontSize: "21" | "19",
    valueFontSize: "24" | "19",
    tabStops: { tierA: 420, tierB: 560 }
  }
}
  │
  ├──► compileTopologyOps(context2, schema, { presetKey })
  │       • Preset 占位槽位保护锁（S1.3 等全拓扑槽位不被源文覆盖）
  │       • 输出 pruneSafely / writeCell / applyTopologyLock 指令
  │
  └──► Editor (template-editor.js)
          • pruneRowsSafely(): 父级分类题头（Hand protection: / 8.1 / 1.3）存在子行时豁免删除
          • applyTopologyTypographyLock(session, typographyProfile):
              1. 依据 typographyProfile 统一全局字号与字体
              2. 强制保留/重塑结构性子题头加粗
              3. 编号标签统一单 <w:tab/> + Tier A(420)/Tier B(560) 标尺对齐
              4. 英文全角冒号转半角兜底防护
```

## 2. 关键故障根因与精准打击映射
1. **国彩版串流广州冠志 (`#109`)**：`applyPreset` 在开头执行，随后 `writeCell` 又把源文件中的冠志 `1.3 供应商信息` 覆盖写入。修复：在 `compileTopologyOps` 中建立 `presetProtectedAnchors`，且在 `operations` 末尾再执行一次 Preset 全拓扑占位锁定，确保 100% 物理隔离。
2. **S8 `Hand protection:` 消失 (`#112`)**：Context 2 或匹配器把它当成无值行加入了 `deletedRowSet`。修复：1）匹配引擎对父级题头行保留槽位；2）编辑器 `pruneRowsSafely` 兜底检查父级分类题头下方是否存在存活子行，存在则拒绝删除。
3. **PDF 坐标偏移 88.08pt (`#128`) & `SEQ_NO_TAB` (104条)**：中文 1.2/10.x/14.x 与英文 29 处编号标签使用的是空格而非 `<w:tab/>`。修复：编辑器依据 `typographyProfile` 将所有编号标签（`^(\d+\.\d+|\d+\.)\s+`）归一化为 `编号 + <w:tab/> + 标签正文`，并注入 `420 dxa`（Tier A）或 `560 dxa`（Tier B，第 11 节四位数）悬挂缩进与制表位，从而同步彻底解决 PDF `80.28pt` 黄金锚点对齐！
