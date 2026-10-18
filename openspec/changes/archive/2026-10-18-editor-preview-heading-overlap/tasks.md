# Tasks

## 1. 复现与取证

- [x] 1.1 记录缺陷复现条件：把模板编辑器右侧预览面板宽度收紧到标题行控件无法单行容纳，观察第二行被预览容器覆盖；验证：产出改动前对照截图并标注面板宽度
- [x] 1.2 固化根因证据：`web/src/styles.css:3088-3096` 的 `height/min-height: 38px` 与 `web/src/main.js:2373` 内联 `flex-wrap: wrap`；验证：取证记录列出选择器、行号与其余三个作用域的高度审计结果

## 2. 修复

- [x] 2.1 将 `[data-toolbar-scope="editor-preview-heading"]` 改为自适应高度（`height: auto; min-height: 38px`）并补 `flex-shrink: 0`；验证：窄宽度下该行增高，全部控件完整可见且可点击
- [x] 2.2 确认单行宽度下视觉不回归（高度仍为 38px、控件排布与改动前一致）；验证：宽宽度截图与改动前逐项对照一致
- [x] 2.3 确认预览容器顺延排布、不再与标题行重叠；验证：标题行底边不超出预览容器顶边
- [x] 2.4 登记其余三个固定高度作用域的审计结论（`editor-file-ribbon` / `editor-section-heading` / `editor-table-heading`，均未启用换行，不修改）；验证：记录中列出三者名称与判断依据

## 3. 回归守卫与验收

- [x] 3.1 新增静态布局契约断言：遍历 `web/src/styles.css` 中全部 `data-toolbar-scope` 作用域，禁止「固定高度 + `flex-wrap: wrap` 且高度非自适应」组合；验证：测试通过，且人为把该作用域改回固定高度时该测试失败（负向验证有效）
- [x] 3.2 运行受影响的既有前端测试套件，确认无副作用；验证：相关套件全部通过
- [x] 3.3 人工在浏览器以窄/宽两种宽度核验（项目 UI 真实核验原则）；验证：两种宽度下控件均完整可见且无覆盖（用户已核验确认验收通过）

## 4. 收尾

- [x] 4.1 归档本 change 并同步主规格；验证：`openspec archive` 成功，`openspec/specs/ui-layout-and-column-width-optimization/spec.md` 新增该要求且 `openspec validate` 通过

