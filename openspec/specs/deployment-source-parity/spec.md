# deployment-source-parity Specification

## Purpose
约束 MSDS-Engine 的 Docker 交付链路：容器镜像必须由与发行包一致的源码构建，重建结果必须可被客观验证，且本地数据与产出在同步过程中不被覆盖，同时始终保留可执行的回滚路径。

## Requirements

### Requirement: Build Source Parity

Docker 交付的构建源码目录 SHALL 与当前发行包保持一致，使镜像内源码与发行包源码在归一化（忽略行尾差异）后逐文件哈希相等。

#### Scenario: Source files match the release package

- **WHEN** 同步完成后对容器内与发行包的同名源文件计算归一化 MD5
- **THEN** `web/src/version.js`、`web/src/main.js`、`web/src/smart-matching.js`、`web/src/styles.css`、`web/src/docx-engine.js`、`web/src/msds-api-controller.js`、`web/src/render-utils.js`、`web/src/msds-db.js`、`web/src/pdf-converter.js`、`web/src/annotation-engine.js`、`web/src/msds-handoff.js`、`web/src/api-server.mjs` MUST 逐项相等

#### Scenario: New source files are present

- **WHEN** 发行包引入了新的源码文件
- **THEN** 该文件 MUST 出现在构建目录的对应位置，且其引用方可以解析到它

### Requirement: Local Data and Artifact Preservation

同步过程 SHALL 不覆盖容器的活挂载数据与既有产出，包括 `web/data/`（SQLite 仓储与记录文档）、`output/`、`.git` 历史与未跟踪的工作脚本。

#### Scenario: Live database is untouched

- **WHEN** 同步前后读取 `web/data/msds_repo.db`
- **THEN** 其哈希 MUST 保持不变

#### Scenario: Existing outputs survive the sync

- **WHEN** 同步完成后列出 `output/` 目录
- **THEN** 变更前已存在的全部产出文件 MUST 仍然存在

#### Scenario: Untracked work scripts survive the sync

- **WHEN** 同步完成后检查未跟踪脚本
- **THEN** `web/check_2341_output.mjs`、`web/compare_truth.mjs`、`web/deep_compare_live.mjs` 与 `scratch/` 下的既有文件 MUST 仍然存在

#### Scenario: Protected directories are archived before any purge

- **WHEN** 执行任何带 purge 语义的目录镜像操作
- **THEN** 所有待保护目录 MUST 先被完整复制到归档位置并记录哈希，而不得仅依赖排除参数

### Requirement: Verifiable Rebuild

重建后的容器 SHALL 能证明其运行的是新源码，而非旧镜像中的构建产物。

#### Scenario: Rebuilt bundle differs from the previous image

- **WHEN** 新镜像构建完成并启动容器后列出 `web/dist/assets`
- **THEN** 产物文件名 MUST 与旧镜像中的 `index-Cz2FSeUJ.js`、`index-BPcagjCr.css` 不同

#### Scenario: Rebuilt bundle matches the package build

- **WHEN** 容器由发行包源码重建
- **THEN** `web/dist/assets` 的产物 MUST 与发行包内预构建产物的文件名与字节大小一致

#### Scenario: Version endpoint responds

- **WHEN** 容器健康检查访问 `http://127.0.0.1:5173/api/version`
- **THEN** 接口 MUST 返回 `status: ok` 且版本号为 `1.5.0`

### Requirement: Rollback Availability

同步 SHALL 保留可执行的回滚手段，使交付可在一个操作内退回变更前状态。

#### Scenario: Previous image is retrievable

- **WHEN** 变更完成后查询本地镜像列表
- **THEN** 变更前的镜像 MUST 以 `rollback-oct11` tag 可寻址

#### Scenario: Previous source is archived

- **WHEN** 需要回退源码时检查归档目录
- **THEN** `_rollback/pre-v1.5.0-20261017/` MUST 包含变更前的 `web/src`、`web/package-lock.json` 与更新前顶层清单

### Requirement: Incident Disclosure

若同步过程中发生保留项被破坏的事件，变更记录 SHALL 如实登记事件范围、恢复结果与不可恢复项，不得静默处理。

#### Scenario: Damage scope is enumerated

- **WHEN** 事故发生后整理变更记录
- **THEN** 记录 MUST 逐项列出被破坏文件、恢复来源与验证结果

#### Scenario: Unrecoverable items are declared

- **WHEN** 存在无法恢复的文件
- **THEN** 记录 MUST 明确列出其路径、原大小与可行的再生成方式
