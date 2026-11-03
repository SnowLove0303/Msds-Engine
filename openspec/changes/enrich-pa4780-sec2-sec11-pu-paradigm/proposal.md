# Proposal: 基于 2-丁氧基乙醇成分事实深度扩充 PA-4780 Section 2 与 Section 11（对齐 PU 工业级标杆）

## 变更背景与动机
用户在检阅 PA-4780 基准版本后指出：
> “4780 原文写的一般，你能不能根据成分去找相关可以补充的信息，特别是section2和section11，然后具体的写法参考之前的PU”

PA-4780 原始文档中 Section 2 仅有简单的 H412，Section 11 仅有一行“该产品无可用的毒理学研究”。根据 PA-4780 核心成分 2-丁氧基乙醇（乙二醇丁醚，CAS: 111-76-2，含量 8~15%），参考 PU-608 / PU-202A 官方规范体系，对 Section 2 进行四维防范与全套 H/P 展开，并将 Section 11 升级为 11.1~11.10 全端点结构化表格体系（Paradigm 2）。

## 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 需求要点 | 规格落点 | 验收指标 |
| :--- | :--- | :--- | :--- |
| **REQ-01** | 成分事实与毒理参数国际数据库绑定 | `specs/enrich-pa4780-sec2-sec11-pu-paradigm/spec.md` | 2-丁氧基乙醇 (CAS 111-76-2) 真实 LD50/LC50 毒理数据绑定 |
| **REQ-02** | Section 2 对齐 PU 标杆架构扩充 | `pipeline-engine.js` | 2.1 危害类别（经口/皮/吸入+皮眼刺激+水环境）、2.2 标签要素（GHS07+警告+6条H+13条P四维展开） |
| **REQ-03** | Section 11 升级为 PU 标准 11.1~11.10 结构化表格 (Paradigm 2) | `pipeline-engine.js` | 15 行标准端点插槽表格，含急性毒性、皮眼刺激、致敏、致突变、致癌、生殖毒性、STOT与经皮吸收附加信息 |
| **REQ-04** | 跨语言 1:1 同构英译与零中文残留 | `pipeline-engine.js` | 英文版 Section 2 与 Section 11 100% 结构同构且无中文残留 (Gate 4 纯度通过) |
| **REQ-05** | 双极双层强审计与全景验收 | `audit_bipolar_bilayer.mjs` | 纳管 PA-4780 Paradigm 2 结构化表格断言，真实退出码 0 (`Exit Code 0 [Measured]`) |
| **REQ-06** | 受控生产标准 8 交付物 (4 DOCX + 4 PDF) | `generate_pa4780_canonical_deliverables.mjs` | 交付目录仅有 8 份物理文件，时间戳同步 |
