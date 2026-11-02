# Proposal: 跨语言事实保全、反硬编码与全景敌手强审计系统性根治

## 一、 背景与动因
在完成 PU-608 中文母版真实数据对齐后，本系统执行敌手强审计（Adversarial Red-Team Audit），在英文交付物流水线中捕获了 6 大隐蔽缺陷：
1. Section 14.4 最高温度由 35℃ 被擅自放宽硬编码为 40℃；
2. Section 6.1 错位使用了 Section 5.4 的消防标签；
3. Section 12.3 擅自注入了源文件不存在的“对鱼类无害”定性声明；
4. Section 9 外观（半透明乳液）、饱和蒸气压（130hPa）、粉尘爆炸（不适用）发生失真或蒸发；
5. Section 4 眼睛冲洗时间（20分钟）被缩水为 10 分钟，误服昏迷指示被截断；
6. Section 8 英文版未与中文版同步剪枝，残留不一致的 8.2 工程控制行。

依据 **Ps-openspec** 架构法则与反硬编码公理，必须系统性清除英文流水线中的底模常数硬编码，将英文版全面重构为**基于中文母版事实动态驱动**，并在 `audit_bipolar_bilayer.mjs` 中下沉跨语言基准事实强断言。

## 二、 1:1 需求物理对账矩阵 (RTM 映射)
- **REQ-01**: 根除 Section 14.4 温度篡改，英文版与源事实严格一致为 `+35℃`；
- **REQ-02**: 根除 Section 6.1 错位消防标签，恢复泄漏应急法定标签；
- **REQ-03**: 根除 Section 12.3 伪造无害声明，忠实翻译为 `No data available.`；
- **REQ-04**: 恢复 Section 9 外观（`Translucent emulsion`）、蒸气压（`Approx. 130 hPa at 50℃`）及粉尘爆炸（`Not applicable`）；
- **REQ-05**: 补齐 Section 4.2 昏迷禁口喂食指示，恢复 Section 4.3 眼睛冲洗 `at least 20 minutes` 与头部倾斜安全指示；
- **REQ-06**: 根除 Section 8 中英文结构不对称，无 OEL 时中英文严格同构收敛；
- **REQ-07**: 遵循 Ps-openspec 硬编码禁令：建立通用动态英译映射，全面清除底模常数硬编码；
- **REQ-08**: 升级 `audit_bipolar_bilayer.mjs`：植入跨语言基准事实强断言，对上述 6 类缺陷建立红灯阻断门禁；
- **REQ-09**: 重新受控生成 PU-608 全套 8 交付物并通过敌手强审计全绿 (Exit Code 0 [Measured])。
