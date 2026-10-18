# Tasks

## 1. 忽略规则与根目录发布文档就绪

- [x] 1.1 创建根目录 `.gitignore`，精准过滤 `web/node_modules/`、`web/dist/`、`*.log`、`__pycache__/` 及 `rollback/*.zip` 等无关体积
- [x] 1.2 创建/优化项目根目录 `README.md`，明确项目命名为 `MSDS-Engine`，发布版本标为 `V1.0`，并包含系统架构、运行与 API 说明

## 2. 本地 Git 仓库初始化与基线提交

- [x] 2.1 执行 `git init -b main`，初始化本地 Git 仓库
- [x] 2.2 执行 `git add .`（依据 `.gitignore` 过滤无关文件），核验暂存区文件清单纯净无污染
- [x] 2.3 执行初始基线提交，提交信息为 `feat(release): MSDS-Engine V1.0 initial release`

## 3. GitHub 远程仓库绑定与推送发布

- [x] 3.1 关联 GitHub 远程仓库 `https://github.com/SnowLove0303/Msds-Engine.git` 为 `origin`
- [x] 3.2 创建发布标签 `V1.0`（带版本注解信息）
- [x] 3.3 推送本地 `main` 分支至远程 GitHub 仓库，并推送 `V1.0` 标签
- [x] 3.4 远程验证：通过 GitHub CLI / API 校验远程仓库提交历史与 `V1.0` Tag 发布状态
