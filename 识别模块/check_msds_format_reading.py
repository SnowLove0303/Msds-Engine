from pathlib import Path
import sys
from collections import Counter
from xml.etree import ElementTree

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR))
from msds_table_search import read_file

DEFAULT_SOURCE = Path(r"F:\App Location\Guanzhi Tong\Skill\MSDS Skill\TDS MSDS 预处理\1-1 单组份水性聚氨酯树脂 PU\PU-3011\PU-3011 msds_CN 冠志.docx")
gui_check = "--gui" in sys.argv[1:]
arguments = [argument for argument in sys.argv[1:] if argument != "--gui"]
source = Path(arguments[0]) if arguments else DEFAULT_SOURCE
document = read_file(source)
assert document["schema_version"] == "1.0"
assert document["source_type"] == "docx"
assert document["coverage"]["table_count_matches"], document["coverage"]
assert document["coverage"]["body_table_xml_count"] == 16
assert "word/document.xml" in document["source_ooxml"]
assert "word/styles.xml" in document["source_ooxml"]
tables = [record for record in document["records"] if record["kind"] == "table"]
body_tables = [record for record in tables if not record.get("section", "").startswith("第 0 部分")]
segments = [segment for record in tables for row in record["rows"] for cell in row for segment in cell.get("content", []) if segment["type"] == "text"]
assert len(body_tables) == 16, f"expected 16 body tables, got {len(body_tables)}"
assert all("structure" in table and len(table["rows"]) for table in tables)
assert all("format" in cell for table in tables for row in table["rows"] for cell in row)
assert all("paragraphs" in cell for table in tables for row in table["rows"] for cell in row)
assert all("run_format" in segment and "paragraph_format" in segment for segment in segments)
assert any(segment["run_format"] or segment["paragraph_format"] for segment in segments), "no non-empty formatting properties found"
assert sum(len(cell.get("images", [])) for table in tables for row in table["rows"] for cell in row) == 2
assert len(next(table["rows"] for table in body_tables if table.get("section") == "第 9 部分")) == 24
section10 = next(table for table in body_tables if table.get("section") == "第 10 部分")
fields = section10["field_candidates"]
assert [(field["label"], field["value"]) for field in fields] == [
    ("化学稳定性", "根据规范使用，不会发生分解。"),
    ("危险分解产物", "涂料在干燥/固化时，释放出中和剂。"),
    ("可能的危害反应", "正确储存或操作时，无危害反应。"),
], f"unexpected Section 10 label/value extraction: {fields}"
section3 = next(table for table in body_tables if table.get("section") == "第 3 部分")
section3_fields = section3["field_candidates"]
assert [(field["label"], field["value"]) for field in section3_fields] == [
    ("产品类型", "混合物"),
    ("聚氨酯分散体", "9009-54-5"),
    ("去离子水", "7732-18-5"),
    ("N,N－二甲基乙酰胺(DMAC)", "127-19-5"),
], f"header row was misclassified or ingredient data was lost: {section3_fields}"
assert all(
    field["evidence"].get("explicit_delimiter") or any(char.isdigit() for char in field["value"])
    for table in body_tables for field in table.get("field_candidates", [])
    if field["method"] == "adjacent_cells"
), "a delimiter-free header/label was accepted without numeric data evidence"
assert all(
    not any(char in field["label"] for char in "\t\r\n。；;!?")
    for table in body_tables for field in table.get("field_candidates", [])
), "a mixed or sentence-like cell was recognized as a field label"
section8 = next(table for table in body_tables if table.get("section") == "第 8 部分")
hand_protection = next(field for field in section8["field_candidates"] if field["label"] == "手部防护")
assert hand_protection["value"] == "建议戴上防护手套。", hand_protection
assert hand_protection["evidence"]["unparsed_label_cell_suffix"] == "喷涂过程中要求有呼吸防护设备。", hand_protection
assert hand_protection["warnings"] == [{
    "code": "label_cell_contains_unmapped_text",
    "message": "冒号后的标签单元格还包含其他文本；该文本保留在原始单元格中，未并入字段值。",
    "text": "喷涂过程中要求有呼吸防护设备。",
    "source": {"row": 3, "column": 0},
}], hand_protection
raw_label_cell = section8["rows"][3][0]["text"]
assert "喷涂过程中要求有呼吸防护设备。" in raw_label_cell, "source cell text was modified or lost"
import json
json.dumps(document, ensure_ascii=False)
source_text = []
for part_name, xml in document["source_ooxml"].items():
    if part_name == "word/document.xml" or part_name.startswith(("word/header", "word/footer")):
        root = ElementTree.fromstring(xml)
        source_text.extend(node.text or "" for node in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"))
recognized_text = []
for record in document["records"]:
    if record["kind"] == "table":
        recognized_text.extend(segment["text"] for row in record["rows"] for cell in row for segment in cell.get("content", []) if segment["type"] == "text")
    else:
        recognized_text.extend(segment["text"] for segment in record.get("content", []) if segment["type"] == "text" and segment["text"] not in {"页眉：", "页脚："})
nonspace = lambda value: Counter(char for char in value if not char.isspace())
assert nonspace("".join(source_text)) == nonspace("".join(recognized_text)), "normalized text lost or introduced source characters"
print(f"OK: {len(body_tables)} body tables, {len(tables)} total tables, {len(segments)} formatted segments, {len(fields)} Section 10 pairs, {len(section3_fields)} Section 3 pairs, 2 images; {source.name}")

if gui_check:
    import tkinter as tk
    from msds_table_search import MsdsViewer

    root = tk.Tk()
    root.withdraw()
    viewer = MsdsViewer(root)
    try:
        viewer.document = document
        import tempfile
        import msds_table_search
        with tempfile.TemporaryDirectory(prefix="msds_json_check_") as temp_dir:
            export_path = Path(temp_dir) / "recognition.json"
            original_dialog = msds_table_search.filedialog.asksaveasfilename
            msds_table_search.filedialog.asksaveasfilename = lambda **_: str(export_path)
            try:
                viewer.export_json()
            finally:
                msds_table_search.filedialog.asksaveasfilename = original_dialog
            exported = json.loads(export_path.read_text(encoding="utf-8"))
            assert exported["coverage"]["table_count_matches"]
            assert "word/document.xml" in exported["source_ooxml"]
        for section in ("第 2 部分", "第 8 部分", "第 10 部分", "第 12 部分"):
            table = next(record for record in tables if record.get("section") == section)
            viewer.visible_records = [table]
            viewer.listbox.delete(0, "end")
            viewer.listbox.insert("end", table["label"])
            viewer.listbox.selection_clear(0, "end")
            viewer.listbox.selection_set(0)
            viewer.show_selected()
            root.update()
            metadata = json.loads(viewer.format_view.get("1.0", "end-1c"))
            frames = [child for child in viewer.content.winfo_children() if isinstance(child, tk.Frame)]
            widgets = [child for frame in frames for child in frame.winfo_children() if isinstance(child, tk.Text)]
            assert len(widgets) == sum(len(row) for row in table["rows"]), "expected one text widget per source cell"
            assert all(int(widget.cget("width")) == 1 for widget in widgets), "text widgets must not force oversized table columns"
            for widget in widgets:
                display_lines = widget.count("1.0", "end", "displaylines")
                required_lines = display_lines[0] if isinstance(display_lines, tuple) else int(display_lines or 1)
                assert int(widget.cget("height")) >= required_lines, f"{section} cell is shorter than its rendered text"
            if section == "第 10 部分":
                assert len(metadata["field_candidates"]) == 3, "format view must expose the label/value candidates"
                assert max(frame.winfo_width() for frame in frames) < 800, "source-sized table became excessively wide"
                assert max(int(widget.cget("height")) for widget in widgets) <= 3, "short rows did not shrink to their text height"
            if section == "第 8 部分":
                gui_hand_protection = next(field for field in metadata["field_candidates"] if field["label"] == "手部防护")
                assert gui_hand_protection["value"] == "建议戴上防护手套。"
                assert gui_hand_protection["warnings"][0]["text"] == "喷涂过程中要求有呼吸防护设备。"
            if section == "第 12 部分":
                clipped_candidates = [widget for widget in widgets if widget.count("1.0", "end-1c", "displaylines")]
                assert clipped_candidates, "Section 12 should include wrapped or multi-line text to check clipping"
                assert all(widget.dlineinfo("end-1c") is not None for widget in clipped_candidates), "final display line is outside the cell viewport"
            for cell in (cell for row in table["rows"] for cell in row if cell.get("images")):
                expected = "".join(segment["text"] for segment in cell["content"] if segment["type"] == "text")
                widget = next(widget for widget in widgets if widget.get("1.0", "end-1c") == expected)
                assert len(widget.image_names()) == len(cell["images"]), "inline pictogram count/order was lost"
                assert len(widget.tag_names()) > 1, "formatted text tags were not applied"
        print("OK: Sections 2, 8, 10, and 12 use source-sized tables, unclipped adaptive rows, inline text, field warnings, and pictograms")
    finally:
        viewer.close()
        root.destroy()
