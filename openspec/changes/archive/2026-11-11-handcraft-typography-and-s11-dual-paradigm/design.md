# Design: Handcrafted Typography Fidelity & Section 11 Dual-Paradigm Architecture (Micro-Calibrated)

## 1. Section 2 Exact 35-Paragraph Typography Layout

Comparing with `PA-3223 msds_CN 冠志 手做改版材料.docx`:

| P# | Gold Exact Text | Indent `<w:ind>` | Alignment `<w:jc>` | Bolding (`<w:b>`) |
|:---|:---|:---|:---|:---|
| 0 | `2.危险性概述` (Table Header) | - | - | Bold |
| 1 | `GHS危险性类别: 无` | - | `val="left"` | Label Bold, Value Regular |
| 2 | `羟基丙烯酸酯聚合物GHS危险性分类：不适用；` | - | `val="left"` | Entire line Bold |
| 3 | `标签要素：` | - | - | Label Bold |
| 4 | `请注意以下物质：` | `firstLine="480"` | - | Regular |
| 5 | `N,N-二甲基乙醇胺，中和剂，已键合为盐，质量浓度小于2.0%，特定阈值浓度≥5%` | `firstLine="480"` | - | Regular |
| 6 | `GHS分类：` | `firstLine="480"` | - | Regular |
| 7~12 | `易燃液体3 H226；` ... `特异性靶器官系统毒性（一次接触）3 H335` | `firstLine="480"` | - | Regular |
| 13 | `象形图：无` (No space after colon) | - | - | Label Bold, Value Regular |
| 14 | `警告词：警告` (No space after colon) | - | - | Label Bold, Value Regular |
| 15 | `危害性说明:没有明显的已知作用或严重危险。` | - | - | Label Bold, Value Regular |
| 16 | `防范说明:` | - | - | Bold |
| 17 | `预防措施：` | `firstLine="482"` | - | Bold |
| 18~20 | `        操作时穿戴...` (8 leading spaces) | - | - | Regular |
| 21 | `在室外或通风良好处操作。` | `firstLine="960"` | - | Regular |
| 22 | `事故响应：` | `firstLine="482"` | - | Bold |
| 23~27 | `        吸入：...` (8 leading spaces) | - | - | Regular |
| 28 | `安全存储：` | `firstLine="482"` | - | Bold |
| 29 | `    请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产` (4 leading spaces) | `left="1199" hanging="720"` | - | Regular |
| 30 | `装完整。每次取用之后立即密封，打开包装后尽快使用完毕。` | `left="1198" hanging="240"` | - | Regular |
| 31 | `废弃处置：` | `firstLine="482"` | - | Bold |
| 32 | `    使用后的空桶未经无害化处理前，不得存储食物及其他物品...` (4 leading spaces) | `left="959" hanging="480"` | - | Regular |
| 33 | `物理化学危险：对水体、土壤可造成一定的污染。` (No space after colon) | - | - | Label Bold, Value Regular |
| 34 | `健康危害：无` (No space after colon) | - | - | Label Bold, Value Regular |
| 35 | `环境危害：无危险物质释放，防止进入下水道，以防聚合物沉积阻塞下水道。` | - | `val="left"` | Label Bold, Value Regular |

---

## 2. Section 11 Exact Micro-Geometry

Comparing with `PA-3223 msds_CN 冠志 手做改版材料.docx`:

- **Row 0**: `11.毒性资料`
- **Row 1**: `该产品无可用的毒理学研究。` -> `<w:jc w:val="left"/>`, `<w:sz w:val="24"/>` (12pt), Bold.
- **Row 2**: `下面是这些成分的毒理学数据。` -> `<w:jc w:val="left"/>`, `<w:ind w:left="34"/>`, `<w:sz w:val="24"/>` (12pt), Bold.
- **Row 3**: Single Full-Width Cell (`gridSpan="3"`), containing 4 paragraphs:
  * P0: `羟基聚丙烯酸酯分散体：毒性：无资料；` -> `<w:jc w:val="left"/>`, `<w:ind w:left="34"/>`, `<w:sz w:val="24"/>` (12pt), Bold.
  * P1: `刺激性：无资料` -> `<w:jc w:val="left"/>`, `<w:ind w:left="34"/>`, `<w:sz w:val="24"/>` (12pt), Bold.
  * P2: `丙二醇丁醚：毒性：经皮（鼠）LD50：＞2000 mg/kg      吸入（鼠）LD50：＞199` -> `<w:jc w:val="left"/>`, `<w:ind w:left="34"/>`, `<w:sz w:val="24"/>` (12pt), Bold.
  * P3: `二乙二醇丁醚：毒性：经皮（鼠）LD50：＞2000 mg/kg      经口（鼠）LD50：=45` -> `<w:jc w:val="left"/>`, `<w:ind w:left="34"/>`, `<w:sz w:val="24"/>` (12pt), Bold.
