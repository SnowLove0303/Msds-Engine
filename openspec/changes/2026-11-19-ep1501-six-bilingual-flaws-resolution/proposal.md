# Proposal: EP-1501 六大双语细节瑕疵治理与全景对齐 (Bilingual Flaws Resolution)

## 1. 意图与背景 (Intent & Context)
用户在审核 EP-1501 交付物后，指出了 6 处具体的双语一致性与文本瑕疵：
1. **Section 2.4 P273**：中文“禁止排入环境”，英文“Avoid release to the environment”，应统一措辞为 GHS 标准“避免释放到环境中。”；
2. **Section 4.2 误服**：英文要求立即就医（`immediately`），中文仅写“须就医”，中文遗漏“立即”；
3. **Section 8.2 工程控制**：中文法规编号结尾是 `2006/121/EG`，英文是 `2006/121/EC`，编号不一致，统一为 `2006/121/EC`；
4. **Section 13 废弃处置**：中文额外增加“严格按照国家和地方危废与环保管理法规执行”，英文无对应内容，英文补齐对应译文；
5. **Section 14.4 运输注意事项**：英文将温度要求重复写了两遍，英文需要删除重复句；
6. **Section 15 法规信息**：两个版本均重复写了“其他规定”和“符合下列法规要求”，中英文均需去重为单次标签。

## 2. 1:1 需求物理对账 (Spec-Kit RTM)

| 需求条目 ID | 需求内容 | 对应产出物与规范定义 |
| :---: | :--- | :--- |
| **REQ-EP1501-01** | Section 2.4 P273 中英文统一步调 | 中文修改为 `P273 避免释放到环境中。`，与英文 `P273 Avoid release to the environment.` 严谨对齐 |
| **REQ-EP1501-02** | Section 4.2 误服中文补全“立即就医” | 中文修改为 `4.2 误服：禁止催吐，须立即就医。` |
| **REQ-EP1501-03** | Section 8.2 法规编号统一步调 | 中文更新为 `根据EC指令2006/121/EC，无可用的接触限值信息。` |
| **REQ-EP1501-04** | Section 13 英文版补全危废环保法规对应句 | 英文 Row 1 补充 `Strictly comply with national and local hazardous waste and environmental protection regulations.` |
| **REQ-EP1501-05** | Section 14.4 英文版删除重复温控句 | 英文 14.4 消除重复，保留单次标准温度说明 |
| **REQ-EP1501-06** | Section 15 法规信息消除双语标签重复 | 中文去重为单次 `其它的规定：`、`符合下列法规要求：`；英文去重为单次 `Other provisions:`、`Complies with the following regulations:` |
| **REQ-EP1501-07** | 8 格式标准交付物重新受控生成与双套件机械终审 | 重新生成 4 DOCX + 4 PDF，并通过两阶双轨机械审计（双极双层 0 违章，Master MSDS 167 项退出码 0） |

## 3. 约束与不动项承诺 (Invariants)
- **底层封印**：`web/src/*` 源码保持 100% 只读，零篡改；
- **全流程在流水线闭环**：所有 6 处双语微调在 `generate_ep1501_standard_deliverables.mjs` 中执行，确保受控可复现。
