# Design: EP-1501 标准七流程八格式生产方案

## 1. 架构流向与流水线设计
根据 MSDS-Studio 标准七流程（SOP）：
```text
[Step 1] 源事实指纹冻结 (EP-1501 16 章节化学事实)
   ↓
[Step 2] 提取原始事实资产 Context 1
   ↓
[Step 3] 运行独立反向机械审计器 (audit_context1_mechanical.mjs)
   ↓
[Step 4] 数据清洗与地道双语英译，组装 Context 2 (零中文字符残留)
   ↓
[Step 5] 官方标准底模加载，历史示范值 100% 前置清零，编辑器原语受控写入，排版几何硬锁
   ↓
[Step 6] 严格法定工序导出：先做 2 份中文 Word → 再做 2 份英文 Word → 调用原生 Windows COM 批量导出 4 份矢量 PDF
   ↓
[Step 7] 两阶双轨全景主审计终审 (run_master_msds_audit & audit_bipolar_bilayer)，退出码 0 验证
```

## 2. 法定双清单自证 (Dual Invariant Manifest)

### 拟变范围清单 (Intended Mutation Scope)
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_CN 冠志.docx`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_CN 冠志.pdf`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_CN 国彩.docx`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_CN 国彩.pdf`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_EN Guanzhi.docx`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_EN Guanzhi.pdf`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_EN Guocai.docx`
- [New Artifact] `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\EP-1501 msds_EN Guocai.pdf`

### 保持现状承诺清单 (Preserved Scope & Invariant Locks)
- **系统核心底层保护**：`web/src/*` 核心代码库绝对 100% 保持现状，严禁触碰或改写系统底层！
- **官方底模绝对只读**：`web/public/templates/*` 母版文件物理只读，仅作 fresh clone。
- **现有交付目录隔离**：其它已生成的型号目录绝对保持现状，严禁跨型号污染。
