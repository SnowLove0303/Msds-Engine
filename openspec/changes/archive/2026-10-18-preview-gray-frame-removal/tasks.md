# Tasks

## 1. 根因取证与复核 (Root Cause Verification)

- [x] 1.1 容器内运行真实 DOM 取证脚本：确认 `docx-preview` 注入了 `<style>.docx-preview-wrapper { background: gray; padding: 30px; ... }</style>`，且包装层为 `.docx-preview-wrapper`、持有者为 `.docx-preview-wrapper-holder`
- [x] 1.2 确认 `styles.css` 既有规则 `.docx-preview .docx-wrapper` 与 `section.docx` 因类名脱节无法匹配真实结构（覆盖 100% 失效）
- [x] 1.3 确认 `web/src/main.js` 中 `applyDocxFitToWidth` 因选择器不匹配而静默退出，自适应缩放从未生效
- [x] 1.4 复核存活 DOM 中**页面节的准确类名**（已在容器内运行确认为 `<section class="docx-preview">`，即 CSS 中的 `section.docx-preview`），并把结论写回 `design.md` 的 Context 复核项；验证：记录中给出实际渲染的类名与复核命令输出

## 2. 样式修复与强力覆盖 (Style Overrides)

- [x] 2.1 在 `web/src/styles.css` 中新增以真实类名为目标的覆盖规则：`.docx-preview-wrapper`、`.docx-preview-wrapper-holder`、`section.docx-preview` 强制 `background: #ffffff !important` 与 `padding: 12px 0 !important`，并**同时保留** `.docx-wrapper` / `section.docx` 变体；验证：包装层不再出现 30px 深灰带
- [x] 2.2 统一页面节样式：`section.docx-preview` 与 `section.docx` 共享 `box-shadow: 0 4px 18px rgba(0,0,0,0.12) !important` 与 `margin: 0 auto 14px !important`，替换库注入的 50% 黑重投影；验证：页面轮廓为轻微投影
- [x] 2.3 依 `design.md` D4 处置永不可能匹配的死规则（推荐重构到真实类名），并在 `design.md` 记录最终取舍；验证：样式表中预览包装层相关规则只剩一套权威选择器命名

## 3. 逻辑修复与缩放自适应 (Zoom Logic Fix)

- [x] 3.1 修复 `web/src/main.js:3771` 的 `applyDocxFitToWidth` 选择器：`'.docx-wrapper, .docx-preview-wrapper'` 与 `'section.docx, section.docx-preview'`；验证：函数不再因取不到元素而提前返回
- [x] 3.2 验证窗口缩放与自适应模式下页面顺畅缩放并居中；验证：三视图各切换自适应宽 / 100% / ＋ / － / 展宽一轮，页面随容器变化

## 4. 计算样式验收与自动化 (Computed-Style Acceptance)

- [x] 4.1 把 `web/tests/scratch_docx_dom.mjs` 由临时取证脚本**改造为运行时计算样式断言测试**：断言包装层 `backgroundColor === 'rgb(255, 255, 255)'`、上下内边距不再等于 `30px`、页面节投影不含 `rgba(0, 0, 0, 0.5)`；验证：测试通过
- [x] 4.2 **负向验证**：临时移除 2.1 的白底覆盖规则后，4.1 的断言必须失败；验证：记录失败输出，随后恢复规则
- [x] 4.3 更新 `web/tests/test_preview_background_contract.mjs`，补充对 `.docx-preview-wrapper` 白底规则的静态断言，作为**补充**防回归判据（不作为唯一判据）；验证：测试通过
- [x] 4.4 在 Docker 容器内运行上述测试，确认全部通过；验证：容器内执行输出 100% 通过

## 5. 重建服务与人工核验 (Rebuild & Human Verification)

- [x] 5.1 重新构建并启动容器（`docker compose build && docker compose up -d`，如遇注册表 IPv6 元数据超时改用经典构建器）；验证：构建成功、容器 healthy
- [x] 5.2 探针检测 `http://127.0.0.1:5173/` 返回 200，且线上 CSS 已为新 hash；验证：HTTP 200 与 hash 变化记录
- [x] 5.3 交付三视图（识别页 / 匹配页 / 模板编辑器）的改动前后对照材料与复现步骤，交由用户手动核验灰框是否消失（依「人工验收归口」，已由用户核验通过：“粗边已消失”）

## 6. 收尾 (Wrap-up)

- [x] 6.1 归档本 change 并同步主规格；验证：`openspec archive preview-gray-frame-removal -y` 成功，`openspec/specs/ui-layout-and-column-width-optimization/spec.md` 出现新要求且 `openspec validate` 通过
