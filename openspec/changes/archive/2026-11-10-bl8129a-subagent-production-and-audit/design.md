# 技术架构方案：BL-8129A 生产与独立审计 (Design Document)

## 一、 系统架构与状态机

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户
    participant Parent as 主协调智能体 (Parent Agent)
    participant SubAgent as 专属生产 SubAgent (Studio Producer)
    participant Engine as MSDS-Engine 受控流水线
    participant Audit as 集中式中央主审计套件 (171项)
    participant UserDir as 用户作业目录 (E:盘)

    User->>Parent: 下达任务 ("源文件留存.docx 让SubAgent产出8格式，你做审计")
    Note over Parent: Step 0: Gate 1 获批通过
    Parent->>SubAgent: 派发生产任务 (四位一体交接胶囊: 源文件路径, 型号 BL-8129A)
    Note over SubAgent: 施工平面与验证平面物理隔离
    SubAgent->>Engine: 启动流水线编译 4 DOCX + 4 PDF
    Engine-->>SubAgent: 8 份标准交付物就绪
    SubAgent-->>Parent: 回传生产完成胶囊 (8 份文件路径、耗时)
    Note over Parent: 裁执物理隔离：主智能体以敌手身份独立接管审计
    Parent->>Audit: 运行 node run_master_msds_audit.mjs (171 项全环核验)
    Audit-->>Parent: 171/171 项全绿通过 (退出码 0)
    Parent->>UserDir: 双向物理覆盖同步 8 份文件
    Parent->>User: 呈报 1:1 双向物理核销清算表与终审结果
```

## 二、 关键技术选型与物理隔离实现

1. **生产 SubAgent 配置**：
   - 使用现有预定义的 `msds-overwrite-producer`（或基于 `self` 派发）；
   - 生产任务严格封闭在生成与格式转换范围内；
   - 严禁生产 SubAgent 自主判定审计通过。
2. **主智能体独立执裁**：
   - 机械确定性审计：运行集中式中央主审计套件 `run_master_msds_audit.mjs`；
   - 涵盖刚刚下沉的 `INV-TRANS-ZERO-OMISSION` 机械门禁，严格核销全篇 16 章节双语参数；
   - 真实进程退出码 0 作为解锁交付的充要条件。
