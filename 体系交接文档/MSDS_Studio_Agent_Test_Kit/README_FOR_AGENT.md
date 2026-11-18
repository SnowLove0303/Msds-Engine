# 🧪 MSDS-Studio 外部测试 Agent 生产任务与质量契约白皮书

> **任务代号**：MSDS-Studio Overwrite Stability & Accuracy Test (PA-3655 Benchmark)  
> **面向对象**：外部测试 Agent（Codex、Claude Code、Cursor、Gemini 或其他独立测试沙箱）  
> **核心使命**：基于提供的纯净输入材料与治理规范，以黑盒方式独立执行 MSDS 覆写生产，输出工业级高精度的 8 格式标准交付物矩阵（4 DOCX + 4 PDF），并回传给宿主审计系统进行 173 项双极双层法医主审计。

---

## 一、 输入资产清单 (Input Assets)

测试套件已在当前目录下为您准备就绪以下纯净受控资产（**物理只读，严禁篡改**）：

| 资产路径 | 资产角色 | 规范要求与说明 |
| :--- | :--- | :--- |
| `source/PA-3655 msds_CN 冠志.docx` | **基准真实源文件** | 包含 16 章节原始化学事实（水性丙烯酸乳液），作为全篇事实提取与翻译的唯一法定事实源。 |
| `templates/正式模板_MSDS_CN_冠志(1).docx` | **官方中文正式底模** | 包含 16 章节标准表格网格、边框拓扑及中文表头样式。 |
| `templates/正式模板_MSDS_EN_冠志(1).docx` | **官方英文正式底模** | 包含 16 章节英文标准表格网格、边框拓扑及英文表头样式。 |
| `presets/company_presets.json` | **企业双主体预设** | 包含广州冠志与英德国彩的中英双语企业名称、简称、注册地址、电话及传真元数据。 |
| `skill/SKILL.md` | **便携版生产治理规范** | 详述 12 阶标准作业规程 SOP、几何排版硬锁公理及 Recipe A~H 手术配方。 |

---

## 二、 目标交付物矩阵 (Deliverable Matrix: 4 DOCX + 4 PDF)

测试 Agent **SHALL** 在 `./output/PA-3655/` 目录下精确产出以下 **8 份标准交付物**（文件命名与扩展名必须完全一致）：

```text
output/PA-3655/
├── PA-3655 msds_CN 冠志.docx       # 广州冠志 中文版 Word
├── PA-3655 msds_CN 冠志.pdf        # 广州冠志 中文版 高清矢量 PDF
├── PA-3655 msds_CN 国彩.docx       # 英德国彩 中文版 Word
├── PA-3655 msds_CN 国彩.pdf        # 英德国彩 中文版 高清矢量 PDF
├── PA-3655 msds_EN Guanzhi.docx    # 广州冠志 英文版 Word
├── PA-3655 msds_EN Guanzhi.pdf     # 广州冠志 英文版 高清矢量 PDF
├── PA-3655 msds_EN Guocai.docx     # 英德国彩 英文版 Word
└── PA-3655 msds_EN Guocai.pdf      # 英德国彩 英文版 高清矢量 PDF
```

---

## 三、 六大不可逾越的工业级法定排版与事实硬指标 (Six Supreme Invariants)

在产出这 8 份文件时，您的生成结果必须 100% 满足以下刚性检验，任何一项违背将在宿主终审中触发一票否决：

### 1. Section 2 零外生虚增公理 (`INV-ZERO-EXOGENOUS`)
- **红线规定**：检查源文件 `PA-3655 msds_CN 冠志.docx`，若属于非危险化学品或原文未提及象形图/信号词，产出物**绝对严禁**凭空添加 `GHS象形图：无` 与 `信号词：无`（英文版亦严禁添加 `GHS pictograms: None` 与 `Signal word: None`）；
- “没有”就是“没有”，不展示任何象形图与信号词标签行才是唯一合规表现。

### 2. Section 2 阶梯排版几何公理 (`INV-S2-TYPOGRAPHY-HIERARCHY`)
- **中文版**：分类标题首行缩进 480 twips (24pt)，正文危害说明顶格 840 twips (42pt)；
- **英文版**：分类标题首行缩进 317 twips，正文说明缩进 677 twips；
- 分类标题（如“易燃液体 类别3”）绝对保持普通字重（**严禁加粗**），正文首字严格垂直左对齐。

### 3. 单制表符与自适应悬挂标尺公理 (`INV-SEQ-TAB-ALIGN` & `INV-LABEL-CONTINUATION-ALIGN`)
- 序号与标签之间使用**单个 `<w:tab/>` 节点**，严禁在序号后添加空格；
- 依据章节内最大序号数字位数（$D_{max}$）动态自适应标尺：$D_{max} \le 3$ 为 420 dxa，$D_{max} \ge 4$ 升级为 560 dxa；
- 折行第二行首字在 420/560 dxa 垂线垂直对齐（实测偏差 $\le 1\text{px}$）；
- 未编号标签注入同基线 `w:left="420"`（无 hanging），首字与带序号标签 100% 齐平，消除锯齿。

### 4. 多列顶格与单列通栏大纲树状层级二分公理 (`INV-VALUE-INDENT-DICHOTOMY`)
- 多列表格（`cells.length > 1`）：填写值单元格清除 `w:ind`，注入 `jc="left"`，紧贴 108 dxa 单元格左边距顶格对齐，杜绝二次缩进；
- 单列通栏表格（`cells.length === 1`，如 Section 2）：保留大纲树状层级缩进。

### 5. 底模历史示范数据 100% 前置清零机制 (`Pre-write Value Clearing Invariant`)
- 英文官方底模内存在历史残留数据（如二乙二醇单丁醚等示范数据）；
- 写入前必须先将待编辑章节的所有值格彻底清空，确保处于 100% 纯净空白插槽状态，再由 Agent 写入真实数据，清零率必须达到 100%。

### 6. 专业化学双语翻译与中文残留归零公理 (`LLM Contextual Translation Invariant`)
- 充分发挥大模型语义理解优势，对源文档内容进行逐句专业英译，行文地道，化学品名称与毒理学术语符合 GHS/OECD 国际标准；
- **英文交付物中中文字符数严格为 0**（`zero Chinese characters`）；
- 温度单位规范化为西文 `°C`（如 `100 °C`）。

---

## 四、 推荐执行工序 (Recommended Execution Pipeline)

建议按照以下线性工序完成生产：

```text
[Step 1] 解析 source/PA-3655 msds_CN 冠志.docx，提取 16 章节完整化学事实 (Context 1)
   ↓
[Step 2] 进行专业化学语义英译，组装中英双语事实数据集 (Context 2)
   ↓
[Step 3] 加载 templates/ 正式底模，执行前置值格 100% 清零
   ↓
[Step 4] 按章节逐一写入事实值与微观富文本（化学式下标），装配排版几何硬锁（单Tab、420标尺、顶格）
   ↓
[Step 5] 读取 presets/company_presets.json，分别派生冠志与国彩版本，更新页眉（型号）与页脚（企业信息与日期）
   ↓
[Step 6] 批量持久化保存 4 份标准 Word 文档 (.docx) 至 output/PA-3655/
   ↓
[Step 7] 批量转换为 4 份原生高清矢量 PDF (.pdf) 至 output/PA-3655/
   ↓
[Step 8] 自检 8 份文件完整性与质量，向用户呈报完成
```

---

## 五、 交付回传与对抗式法医终审说明 (Submission & Audit Protocol)

完成生产后，请将 `./output/PA-3655/` 目录下的 8 份文件打包或回传给用户。

宿主环境已配备 **集中式双极双层法医主审计中枢**（包含 173 项排版几何与化学事实保真硬断言）及 **中英逐行双重显示对照审计**：
- 终审将以客观机检执行结果作为充要凭证；
- 真实进程退出码必须为 `0`（`AUDIT_PASSED`，0 Violations, 0 Alarms, 0 Warnings）；
- 期待您的精彩表现！
