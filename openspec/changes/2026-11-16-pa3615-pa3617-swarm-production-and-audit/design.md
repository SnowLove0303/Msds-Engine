# Design: PA-3615 与 PA-3617 Swarm 双智能体协作与遥测架构

## 1. 架构总览与角色分工

```text
┌──────────────────────────────────────────────────────────────┐
│                    User Instruction (Gate 1 Approved)         │
└──────────────────────────────┬───────────────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │   Coordinator (主协调中枢)   │
                │  - 全流程高精度计时与遥测   │
                │  - 看板状态调度与指令分发   │
                └──────┬──────────────┬───────┘
                       │              │
           调度生产    │              │ 调度审计 (就绪后)
           (Message #) │              │ (Message #)
                       ▼              ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │  msdsproducer (生产) │  │  msdsauditor (审计)  │
        │ - run_universal_    │  │ - 排版几何套件审查   │
        │   msds_pipeline.mjs │  │ - 双极双层165项审计  │
        │ - 4 DOCX + 4 PDF     │  │ - 中央主审计170项    │
        │ - 零临时生产脚本     │  │ - 1:1 双向物理核销   │
        └──────────────────────┘  └──────────────────────┘
```

## 2. 状态机流转与因果时序

1. **State 0: Idle & Standby**
   - 协调器完成 Spec-Kit 立案与 Gate 1 获批；
2. **State 1: Production Dispatch & Timing Start**
   - 记录 $T_{0}$，在 Swarm 看板 `@msdsproducer`，指示执行 `PA-3615` 与 `PA-3617` 的流水线生产；
   - 运行统一入口 `run_universal_msds_pipeline.mjs`；
3. **State 2: Deliverables Ready & Timing Milestone 1**
   - 记录 $T_{prod}$，生产智能体在看板报告成果落地与基础自检；
4. **State 3: Audit Dispatch & Adversarial Verification**
   - 记录 $T_{audit\_start}$，在看板 `@msdsauditor` 指示介入审计；
   - 审计智能体对两款型号执行三大审计套件，审查中英细节与排版几何；
5. **State 4: Final Sign-off & Reporting**
   - 记录 $T_{end}$，计算总耗时与分段耗时；出具双型号 1:1 物理核销清算表。

## 3. 风险防线与边界控制
- **零临时脚本防线**: 严禁编写 `produce_pa3615.mjs` 或 `produce_pa3617.mjs`，所有生产必须经过 `run_universal_msds_pipeline.mjs`；
- **裁执隔离防线**: 审计智能体独立核验，严禁消极放行或形式主义打勾。
