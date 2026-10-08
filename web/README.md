# MSDS Studio

MSDS Studio 是一个在浏览器本地运行的 MSDS 网页工作台，包含两个功能区：

1. **DOCX 识别**：导入 `.docx`，读取 16 个 MSDS Section 的表格、段落、合并单元格、图片和直接格式属性，显示统一结构化表格，同时保留源 DOCX 的版式预览。
2. **模板编辑器**：以内嵌的 CN 冠志 / EN 冠志正式 DOCX 为样式原型，默认编辑非加粗值，保护序号、标签和结构行，支持安全增删行、重编号、审计和导出新 DOCX。

## 启动

在 PowerShell 中执行：

```powershell
cd "F:\Skill\MSDS\web"
npm install
npm run dev
```

随后访问终端输出的本地地址。生产构建：

```powershell
npm run build
npm run preview
```

## 数据与保护边界

- 所有 DOCX 解析、预览、搜索和导出都在浏览器本地完成，不上传服务器。
- 识别工作区只接受 `.docx`；旧版 `.doc` 和 Windows Word/WPS COM 转换不属于网页首版范围。
- `public/templates/` 中的模板是只读资源。编辑器只修改浏览器内存中的工作副本，并以新文件名下载导出结果，不覆盖用户源文件或内嵌模板。
- 浏览器预览使用原始 DOCX 字节渲染；不同浏览器、字体和 Word/WPS 版本可能存在显示差异，最终页面排版以下载的 DOCX 在 Word/WPS 中打开的结果为准。

## 验证

```powershell
npm run build
npm run test:smoke
python "F:\Skill\MSDS\覆写模块\test_editor.py"
```

`test:smoke` 会读取 CN/EN 模板，执行一次浏览器端 XML/ZIP 往返验证，并确保原始模板包仍可读取。
