# Design: 因果拓扑与系统级防复发架构

## 1. 因果拓扑与单一事实源收敛

```text
Source DOCX (可能存在 8.1控制参数->8.2暴露控制 / GHS象形图：有值 / 标签带/℃)
   │
   ▼
[Root Source 1: context-governor.js]
   ├─ S2 守恒：仅当标签无对应源值时裁剪；保留带值 `GHS象形图：`，禁止删标留值
   ├─ S8 归一化（唯一权威）：无论源顺序与是否有 OEL 表，拆分为两棵子树：
   │     Group 8.1 = 暴露控制 (Exposure controls) + PPE 子项
   │     Group 8.2 = 控制参数 (Control parameters) + 2006/121/EC 或 OEL 多列表
   ├─ 翻译单位透传：通用正则检测源标签 `/℃` 等单位后缀，英文标签未含时自动保留 `/°C`
   └─ 统一调用 healEnSpacing（含 SI 单位 `g/cm3` 间距与 `(e. g.,` 修复）
   │
   ▼
[Root Source 2: translation-memory.json & msds-db.js & docx-engine.js]
   ├─ 清理 translation-memory.json 中反向条目 ("8.1控制参数" / "8.2暴露控制")
   ├─ msds-db.js 处置文本统一规范为 `(e.g.,` 且写入前经 healEnSpacing
   └─ docx-engine.js S9.19/S9.20 标签归一化保留源标签 `/°C` 单位后缀
   │
   ▼
[Root Source 3: topology-matcher.js]
   └─ 移除“仅 hasOelAnchor 时才设 8.1/8.2”的局部偏置，全场景无条件遵循 Group 8.1 -> Group 8.2
   │
   ▼
[Hard Gate: staged-mechanical-audit.js + 变异测试]
   ├─ Phase 2/3 & Phase 5 DOCX 机械检出 S8 顺序、S2 重复/丢标、/°C 丢失、间距异常
   └─ 必须先在旧版 PA-4000 上红灯复现全部已知问题，方可放行新版 PA-4000 产出
```

## 2. 双清单（Dual-List）施工边界声明

### 拟变范围清单（Planned Changes）
1. `web/src/translation-memory.json` `[Root Source]`: 清除反向污染条目 `"8.1控制参数"`、`"8.2暴露控制"`。
2. `web/src/context-governor.js` `[Root Source / State Transition]`:
   - 修复 S2 `!isHazardous` 裁剪逻辑，保留有源值的 `GHS象形图：`；
   - 建立 S8 唯一规范排序与子项归组（`8.1 暴露控制` 在前、`8.2 控制参数` 在后）；
   - 通用源标签 `/℃` → `/°C` 单位透传，以及 `healEnSpacing` 通用 SI 单位间距增强。
3. `web/src/topology-matcher.js` `[State Transition]`: 取消 S8 序号分配对 `hasOelAnchor` 的条件依赖，确保无 OEL 多列表时同样严格输出 `8.1 暴露控制` → `8.2 控制参数`。
4. `web/src/docx-engine.js` `[State Transition]`: S9.19 / S9.20 英文标签保留 `/°C`（仅当源标签含温度单位时）。
5. `web/src/msds-db.js` `[Root Source]`: 修复 S13 英文处置描述中的 `(e. g.,` → `(e.g.,`。
6. `web/src/staged-mechanical-audit.js` & `tests/` `[Verifier / Hard Gate]`: 新增 S8 顺序、S2 重复/丢标、`/°C` 守恒、SI 单位与 `(e. g.,` 间距校验，并增加黄金不变量与反例变异测试。
7. `PA-4000` 产出物（仅此 1 个型号的 4 DOCX + 4 PDF，不含其余 13 个型号）。

### 保持现状承诺清单（Leave-As-Is）
- **绝对不触碰**：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\` 下的任何源文件；
- **本轮不触碰**：除 `PA-4000` 外的其余 13 个 PA/RA 型号（`PA-4006` ~ `PA-4835`）暂不重跑覆盖；
- **职责边界保持**：TDS 锁定模板中的 `Limited Company` 保持现状不修改；主 Agent 不再执行 TDS 审计，仅将当前 `PA-4000` TDS 观察项打回给 `tds-specialist` Subagent。
