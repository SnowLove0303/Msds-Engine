# Design: Section 9 源实证门控算法与工程基础设施加固

## 1. 架构总览

本设计针对 MSDS-Engine 当前暴露的业务规约冲突与工程缺陷，在保证底层 OOXML 零破坏和两遍处理架构的前提下，重构 Section 9 剪枝算法，并完成容器、依赖与 API 控制器的加固。

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        源文档输入 (Source DOCX)                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 第一遍：AST 解构与事实提取
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Section 9 事实提取层 (Fact Extraction)                    │
│   - 识别源文档理化特性全量条目                                           │
│   - 构建 source_mentioned_manifest: Set<slot_id>                      │
│   - 区分实质数值 vs 明确陈述未测 (无数据资料/未测定/-)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 核心裁决门控 (Source-Grounded Filter)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Section 9 插槽判定状态机 (Decision State)                │
│                                                                        │
│  [情况 A] 源文档有明确数值 ─────────────► [MATCHED] 原位写入具体数值   │
│  [情况 B] 源文档明确写明“未测/无数据” ─► [MATCHED] 保留行，填“无数据资料。” │
│  [情况 C] 模板有但源文档完全未提及 ────► [PRUNED] 标记为安全物理删行   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 第二遍：受控原位注入与重排
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                模板安全写入与几何重排 (Atomic In-Place)                │
│   - 写入保留行 12pt 非加粗宋体/Times                                   │
│   - 自底向上安全物理删除 [PRUNED] 孤儿行                                │
│   - 连续递增重编号 renumberRecord (9.1, 9.2...)                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Section 9 源实证门控核心算法设计 (Source-Grounded Filter)

### 2.1 状态转移矩阵

对于 Section 9 中模板预设的每一个标准插槽 `slot`（外观、气味、pH、沸点、闪点、粘度等）：

| 源文档存在性状态 (`in_source`) | 源事实取值特征 (`source_value`) | 处置决策 (`action`) | 模板最终呈现形态 |
| :---: | :--- | :---: | :--- |
| **`TRUE` (明确提及)** | 具有实质数值/限定词（如 `7.0~8.5 (1%水溶液)`） | **`KEEP (MATCHED)`** | 写入真实数值；测定条件受控追加至标签 |
| **`TRUE` (明确提及)** | 明确为缺失陈述（`无数据资料` / `未测定` / `—`） | **`KEEP (MATCHED)`** | **保留该行**，数值单元格规范填充 `无数据资料。` |
| **`FALSE` (完全未提及)** | 源文档中压根未出现该属性关键词与上下文 | **`PRUNE (DELETE)`** | **物理整行删除**，不留空白标签与空值格 |

### 2.2 伪代码实现契约
```javascript
function evaluateSection9Slots(sourceSection9Facts, templateSection9Rows) {
  const recognizedSlots = new Map();
  // 1. 构建源事实索引
  for (const fact of sourceSection9Facts) {
    const slotId = resolveSlotId(fact.label, SECTION_9_ALIASES);
    if (slotId) {
      recognizedSlots.set(slotId, fact.value);
    }
  }

  // 2. 遍历模板行，按源实证决定去留
  const rowActions = [];
  for (let rowIndex = 0; rowIndex < templateSection9Rows.length; rowIndex++) {
    const rowSlotId = templateSection9Rows[rowIndex].slotId;
    if (recognizedSlots.has(rowSlotId)) {
      const rawVal = recognizedSlots.get(rowSlotId);
      const isExplicitMissing = isMissingValuePattern(rawVal);
      rowActions.push({
        rowIndex,
        action: 'KEEP',
        value: isExplicitMissing ? '无数据资料。' : cleanPhysicalValue(rawVal),
        condition: extractTestCondition(rawVal)
      });
    } else {
      // 模板有但源文件完全未提及 -> 物理剪枝
      rowActions.push({
        rowIndex,
        action: 'PRUNE'
      });
    }
  }
  return rowActions;
}
```

---

## 3. 工程基础设施加固设计 (Infrastructure Hardening)

### 3.1 Dockerfile 多阶段构建与 Node.js 22 运行时
- **基础镜像升级**：从 `node:20-alpine` 升级为 `node:22-alpine`，确保 V8 引擎内置支持 `node:sqlite`（`DatabaseSync`）。
- **依赖安装修复**：将 `jsdom` 归入生产依赖，确保 `--omit=dev` 模式下后端 XML 解析和 API 控制器正常启动：
```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
COPY web/package*.json ./web/
RUN cd web && npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 5173 5174
CMD ["npm", "run", "start"]
```

### 3.2 数据持久化卷 (`docker-compose.yml`)
在服务节点配置宿主机卷挂载：
```yaml
services:
  msds-engine:
    build: .
    ports:
      - "5173:5173"
      - "5174:5174"
    volumes:
      - ./web/data:/app/web/data
```

### 3.3 Agent API 控制器契约补齐 (`msds-api-controller.js`)
在 `POST /api/msds/import` 控制器中，补充完整的 `data` 节点：
```javascript
return res.json({
  success: true,
  sessionId,
  fileName,
  templateVariant,
  message: 'MSDS 源文档导入并抽取成功',
  data: {
    sectionCount: sourceEngine.sections.length,
    sections: sourceEngine.sections.map(s => ({
      sectionIndex: s.sectionIndex,
      title: s.title,
      rowCount: s.rows?.length || 0
    })),
    fileName,
    templateVariant
  }
});
```

---

## 4. 回归与质量防护矩阵

1. **Section 9 双向断言测试**：
   - 输入样本 A（源仅包含 12 项理化特性，其中 3 项写“无数据资料”）：断言生成结果严格保留 12 行，删除 12 项未提及行；断言重编号为 9.1~9.12；
   - 输入样本 B（源包含 24 项全量特性）：断言全量保留 24 行。
2. **Docker 构建与冒烟测试**：
   - 验证 `docker build` 成功并启动无报错；
   - 验证 `node tests/test_agent_api.mjs` 导入断言 100% 通过。
