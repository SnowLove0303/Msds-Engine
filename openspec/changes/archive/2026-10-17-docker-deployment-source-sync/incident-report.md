# 事故与恢复记录：v1.5.0-Complete 全量对齐过程中的数据覆盖

- 时间：2026-10-17 23:0x–23:3x (Asia/Shanghai)
- 关联 change：`openspec/changes/docker-deployment-source-sync/`
- 影响目录：`F:\docker\projects\Msds-Engine`

## 1. 发生了什么

执行"全量镜像对齐"时，使用 `robocopy <stage> <repo> /MIR /XD <5 个绝对路径> ...`。
预期 `/XD` 会跳过 `.git`、`output`、`web\data`、`scratch`、`_rollback`，使这些目录的内容不被 `/MIR` 的 purge 触碰。

**实际结果：`/XD` 的多个路径只有最后一个（`_rollback`）生效**，其余四个目录的内容被源包对应内容覆盖或清空：

| 目录 | 变更前 | 变更后 | 结果 |
|:--|:--|:--|:--|
| `web\data\msds_repo.db` | `1ee04a91…`（5,058,560 B） | `6a45f4d2…`（包内版本） | 已被覆盖 → 已恢复 |
| `output\` | 13 个文件 | 1 个文件 | 12 个被清空 → 已恢复 10 个 |
| `scratch\` | 39 个文件 | 包内版本覆盖同名文件 | 部分被覆盖 → 已恢复 |

### 失效机制复现

最小复现（`_diag\xdtest`）：

```
robocopy <src> <dst> /MIR /XD "<dst>\a" "<dst>\keep"
→ dst\a\keep.txt   被删除（第一个 /XD 未生效）
→ dst\keep\k.txt   存活  （最后一个 /XD 生效）
```

结论：**不要用多路径 `/XD` 配合 `/MIR` 保护目录内容。** 需要保护时改用显式逐文件复制 + 跳过列表，或先复制目标到归档再执行 purge。

## 2. 恢复结果

### 2.1 数据库（完全恢复）

来源：回滚镜像 `msds-engine-msds-engine:rollback-oct11` 内烘焙的 `/app/web/data/msds_repo.db`。

依据：该镜像构建于 2026-10-11 21:31，而实时库文件最后修改时间为 2026-10-11 02:08（早于构建），因此镜像内副本即为变更前的实时库。

```
docker cp <temp>:/app/web/data/msds_repo.db  →  恢复后 MD5 = 1ee04a91feacf93514bbcede219970ed
变更前记录值                                  =  1ee04a91feacf93514bbcede219970ed   ✅ 完全一致
```

### 2.2 output（10/13 恢复）

| 文件 | 期望大小 | 来源 | 状态 |
|:--|--:|:--|:--|
| `annotations.ndjson` | 21,868 | `_rollback/…/scratch-old/review_bundle_extracted/` | ✅ 字节可验证 |
| `manifest.json` | 737 | 同上 | ✅ |
| `matching-slots.ndjson` | 34,075 | 同上 | ✅ |
| `PEA-4139 msds_CN 冠志.docx` | 36,844 | 同上 | ✅ |
| `review-summary.md` | 11,218 | 同上 | ✅ |
| `section-summary.json` | 2,547 | 同上 | ✅ |
| `source-facts.ndjson` | 38,327 | 同上 | ✅ |
| `direct_zip_extracted_pea.docx` | 36,844 | 由同尺寸 `PEA-4139…docx` 推定重建 | ⚠️ 内容未验证 |
| `review_bundle_pea.docx` | 36,844 | 同上 | ⚠️ 内容未验证 |
| `user_correct_2341.docx` | 33,647 | 未被破坏（与包内同名文件哈希一致） | ✅ |
| `compare_msds.mjs` | 4,149 | 无来源 | ❌ 丢失 |
| `comparison_report.txt` | 40,558 | 无来源 | ❌ 丢失 |
| `comparison_report_utf8.txt` | 32,025 | 无来源 | ❌ 丢失 |

说明：
- `compare_msds.mjs` 丢失的是 4,149 B 的旧修订；包内根级 `compare_msds.mjs` 为 4,240 B 的后续修订，功能上取代之。
- 两份 `comparison_report*` 是同一报告的不同编码版本，可由根级 `compare_msds.mjs` 重新生成（需按其入参准备比对样本）。

### 2.3 scratch（恢复至变更前状态）

`_rollback/…/scratch-old/` 完整回填，同时保留包内新增的 `supervisor-controls-audit-20261017/`。
恢复后 `scratch/` 共 47 个文件，`check_annots.mjs` 与 `review_bundle_extracted/` 均已回归。

### 2.4 未受影响

- `.git`（`/XD` 最后一个路径命中，历史完好，HEAD 仍为 `9784166`）
- `web/src` 对齐成功（7 改 + `pdf-converter.js` 新增，逐文件大小与包内一致）
- `web/data/docs/` 44 个记录文档（镜像内与现状清单完全一致）

## 3. 教训与后续准则

1. 破坏性镜像操作前，**必须**把"要保护的目录"完整复制到归档，而不是依赖排除参数。
2. 多路径 `/XD` + `/MIR` 不可信；改用显式复制清单。
3. 涉及活数据库与真实产出的目录，应在任何 purge 类操作前先做可验证快照（哈希入库）。
