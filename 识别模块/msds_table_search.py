from __future__ import annotations

import base64
import os
import queue
import re
import shutil
import tempfile
import threading
import tkinter as tk
import tkinter.font as tkfont
import io
import json
from xml.etree import ElementTree
from tkinter import filedialog, messagebox, ttk
from pathlib import Path
import webbrowser

from docx import Document
from docx.oxml.ns import qn


SECTION_RE = re.compile(r"^\s*(?:第\s*)?(1[0-6]|[1-9])\s*[.．、:：]?")
SUPPORTED = {".doc", ".docx", ".pdf"}


def _value(element, tag: str, attribute: str = "val"):
    child = element.find(qn(f"w:{tag}")) if element is not None else None
    return child.get(qn(f"w:{attribute}")) if child is not None else None


def _toggle_value(element, tag: str):
    child = element.find(qn(f"w:{tag}")) if element is not None else None
    if child is None:
        return None
    return child.get(qn("w:val"), "true")


def _direct_ooxml_properties(element) -> dict:
    if element is None:
        return {}
    return {
        child.tag.rsplit("}", 1)[-1]: {
            key.rsplit("}", 1)[-1]: value for key, value in child.attrib.items()
        }
        for child in element
    }


def _run_format(run) -> dict:
    props = run.find(qn("w:rPr"))
    if props is None:
        return {}
    fmt = {}
    if value := _value(props, "rStyle"):
        fmt["style"] = value
    fonts = props.find(qn("w:rFonts"))
    if fonts is not None:
        for key, attr in (("ascii", "ascii"), ("hansi", "hAnsi"), ("east_asia", "eastAsia"), ("complex_script", "cs"),
                          ("ascii_theme", "asciiTheme"), ("hansi_theme", "hAnsiTheme"), ("east_asia_theme", "eastAsiaTheme"),
                          ("complex_script_theme", "csTheme")):
            if value := fonts.get(qn(f"w:{attr}")):
                fmt[f"font_{key}"] = value
    for key, tag in (("size_half_points", "sz"), ("complex_size_half_points", "szCs")):
        if (value := _value(props, tag)) is not None:
            fmt[key] = value
    for key, tag in (("bold", "b"), ("italic", "i"), ("strike", "strike"),
                     ("double_strike", "dstrike"), ("caps", "caps"), ("small_caps", "smallCaps"), ("underline", "u")):
        if (value := _toggle_value(props, tag)) is not None:
            fmt[key] = value
    for key, tag in (("vertical_alignment", "vertAlign"), ("color", "color"), ("highlight", "highlight"),
                     ("language", "lang"), ("character_spacing_twentieth_points", "spacing")):
        if (value := _value(props, tag)) is not None:
            fmt[key] = value
    fmt["ooxml_direct"] = _direct_ooxml_properties(props)
    return fmt


def _paragraph_format(paragraph) -> dict:
    paragraph = getattr(paragraph, "_p", paragraph)
    props = paragraph.find(qn("w:pPr"))
    if props is None:
        return {}
    fmt = {}
    if value := _value(props, "pStyle"):
        fmt["style"] = value
    if (value := _value(props, "jc")) is not None:
        fmt["alignment"] = value
    indent = props.find(qn("w:ind"))
    if indent is not None:
        for key in ("left", "right", "firstLine", "hanging"):
            if (value := indent.get(qn(f"w:{key}"))) is not None:
                fmt[f"indent_{key}_twips"] = value
    spacing = props.find(qn("w:spacing"))
    if spacing is not None:
        for key, attr in (("before_twips", "before"), ("after_twips", "after"), ("line", "line"), ("line_rule", "lineRule")):
            if (value := spacing.get(qn(f"w:{attr}"))) is not None:
                fmt[key] = value
    for key, tag in (("keep_with_next", "keepNext"), ("keep_lines_together", "keepLines"),
                     ("page_break_before", "pageBreakBefore"), ("widow_control", "widowControl")):
        if (value := _toggle_value(props, tag)) is not None:
            fmt[key] = value
    fmt["ooxml_direct"] = _direct_ooxml_properties(props)
    return fmt


def _paragraph_content(paragraph, part) -> tuple[str, list[dict], list[dict]]:
    paragraph = getattr(paragraph, "_p", paragraph)
    segments, images = [], []
    paragraph_fmt = _paragraph_format(paragraph)
    run_formats = {}

    def add_text(text: str, run_fmt: dict):
        if (segments and segments[-1]["type"] == "text"
                and segments[-1].get("run_format", {}) == run_fmt
                and segments[-1].get("paragraph_format", {}) == paragraph_fmt):
            segments[-1]["text"] += text
        else:
            segments.append({"type": "text", "text": text, "run_format": run_fmt, "paragraph_format": paragraph_fmt})

    for node in paragraph.iter():
        run = node
        while run is not None and run.tag != qn("w:r") and run is not paragraph:
            run = run.getparent()
        run_fmt = run_formats.setdefault(id(run), _run_format(run)) if run is not None and run is not paragraph else {}
        if node.tag == qn("w:t"):
            add_text(node.text or "", run_fmt)
        elif node.tag == qn("w:tab"):
            add_text("\t", run_fmt)
        elif node.tag in (qn("w:br"), qn("w:cr")):
            add_text("\n", run_fmt)
        elif node.tag == qn("a:blip"):
            rel_id = node.get(qn("r:embed"))
            if not rel_id or rel_id not in part.related_parts:
                continue
            try:
                image_part = part.related_parts[rel_id]
                drawing = node.getparent()
                while drawing is not None and drawing.tag != qn("w:drawing"):
                    drawing = drawing.getparent()
                properties = drawing.find(".//" + qn("wp:docPr")) if drawing is not None else None
                image = {
                    "data": base64.b64encode(image_part.blob).decode("ascii"),
                    "search_text": " ".join(filter(None, [
                        properties.get("name") if properties is not None else "",
                        properties.get("descr") if properties is not None else "",
                        properties.get("title") if properties is not None else "",
                        str(getattr(image_part, "partname", "")),
                        "GHS 象形图 pictogram 图像",
                    ])),
                }
                images.append(image)
                segments.append({"type": "image", "image": image, "run_format": run_fmt, "paragraph_format": paragraph_fmt})
            except Exception:
                continue
    text = "".join(seg["text"] for seg in segments if seg["type"] == "text").strip()
    if segments and segments[0]["type"] == "text":
        segments[0]["text"] = segments[0]["text"].lstrip()
    if segments and segments[-1]["type"] == "text":
        segments[-1]["text"] = segments[-1]["text"].rstrip()
    return text, images, [seg for seg in segments if seg["type"] == "image" or seg["text"]]


def _cell_content(tc, part) -> tuple[str, list[dict], list[dict], list[dict]]:
    segments, images, paragraphs_content = [], [], []
    paragraphs = tc.findall(".//" + qn("w:p"))
    for index, paragraph in enumerate(paragraphs):
        paragraph_text, paragraph_images, paragraph_segments = _paragraph_content(paragraph, part)
        images.extend(paragraph_images)
        paragraphs_content.append({
            "index": index,
            "text": paragraph_text,
            "paragraph_format": _paragraph_format(paragraph),
            "content": paragraph_segments,
        })
        segments.extend(paragraph_segments)
        if index < len(paragraphs) - 1:
            segments.append({"type": "text", "text": "\n", "run_format": {}, "paragraph_format": _paragraph_format(paragraph)})
    text = "".join(seg["text"] for seg in segments if seg["type"] == "text").strip()
    if segments and segments[0]["type"] == "text":
        segments[0]["text"] = segments[0]["text"].lstrip()
    if segments and segments[-1]["type"] == "text":
        segments[-1]["text"] = segments[-1]["text"].rstrip()
    return text, images, [seg for seg in segments if seg["type"] == "image" or seg["text"]], paragraphs_content


def _field_candidates(rows: list[list[dict]]) -> list[dict]:
    candidates = []

    def cell_is_bold(cell: dict) -> bool:
        text_segments = [segment for segment in cell.get("content", []) if segment["type"] == "text" and segment["text"].strip()]
        return bool(text_segments) and all(
            segment.get("run_format", {}).get("bold", "false").casefold() not in {"0", "false", "off", "none"}
            for segment in text_segments
        )

    for row_index, row in enumerate(rows):
        for pair_index, label_cell in enumerate(row[:-1]):
            value_cell = row[pair_index + 1]
            raw_label = label_cell["text"].strip()
            if not raw_label:
                continue
            bold_label = any(
                segment.get("run_format", {}).get("bold", "false").casefold() not in {"0", "false", "off", "none"}
                for segment in label_cell.get("content", []) if segment["type"] == "text"
            )
            colon = re.match(r"^([^:\n\t]{1,80}[：:])", raw_label)
            if colon:
                label = colon.group(1).strip().rstrip(":：")
                suffix = raw_label[colon.end():].strip()
                if not label:
                    continue
            elif (bold_label and not cell_is_bold(value_cell) and value_cell["text"].strip()
                  and re.search(r"\d", value_cell["text"])
                  and len(raw_label) <= 40 and not re.search(r"[\t\n。；;!?]", raw_label)):
                label = raw_label
                suffix = ""
            else:
                continue
            candidate = {
                "label": label,
                "value": value_cell["text"],
                "method": "adjacent_cells",
                "evidence": {
                    "bold_label": bold_label,
                    "explicit_delimiter": colon.group(1)[-1] if colon else None,
                    "value_cell_not_all_bold": not cell_is_bold(value_cell),
                    "unparsed_label_cell_suffix": suffix or None,
                },
                "source": {
                    "label_cell": {"row": row_index, "column": label_cell["col"]},
                    "value_cell": {"row": row_index, "column": value_cell["col"]},
                },
            }
            if suffix:
                candidate["warnings"] = [{
                    "code": "label_cell_contains_unmapped_text",
                    "message": "冒号后的标签单元格还包含其他文本；该文本保留在原始单元格中，未并入字段值。",
                    "text": suffix,
                    "source": candidate["source"]["label_cell"],
                }]
            candidates.append(candidate)
    for row_index, row in enumerate(rows):
        for cell in row:
            for paragraph in cell.get("paragraphs", []):
                for segment_index, segment in enumerate(paragraph.get("content", [])):
                    if segment["type"] != "text":
                        continue
                    match = re.match(r"^\s*([^：:\n]{1,80}[：:])\s*(.*)$", segment["text"], re.S)
                    if not match or not match.group(1).strip():
                        continue
                    value = match.group(2)
                    if not value and segment_index + 1 < len(paragraph["content"]):
                        following = paragraph["content"][segment_index + 1]
                        if following["type"] == "text":
                            value = following["text"].strip()
                    if not value:
                        continue
                    candidates.append({
                        "label": match.group(1).strip().rstrip(":："),
                        "value": value,
                        "method": "inline_colon",
                        "evidence": {"delimiter": match.group(1)[-1]},
                        "source": {
                            "row": row_index, "column": cell["col"],
                            "paragraph": paragraph["index"], "segment": segment_index,
                        },
                    })
    return candidates


def _border_properties(element, tag: str) -> dict:
    parent = element.find(qn(f"w:{tag}")) if element is not None else None
    if parent is None:
        return {}
    return {
        edge.tag.rsplit("}", 1)[-1]: {
            key: edge.get(qn(f"w:{attr}"))
            for key, attr in (("value", "val"), ("size_eighth_points", "sz"), ("space_points", "space"), ("color", "color"))
            if edge.get(qn(f"w:{attr}")) is not None
        }
        for edge in parent
    }


def _width_properties(element, tag: str) -> dict:
    width = element.find(qn(f"w:{tag}")) if element is not None else None
    if width is None:
        return {}
    return {key: width.get(qn(f"w:{attr}")) for key, attr in (("value", "w"), ("type", "type")) if width.get(qn(f"w:{attr}")) is not None}


def _margin_properties(element, tag: str) -> dict:
    margin = element.find(qn(f"w:{tag}")) if element is not None else None
    if margin is None:
        return {}
    return {
        edge.tag.rsplit("}", 1)[-1]: {
            key: edge.get(qn(f"w:{attr}"))
            for key, attr in (("value", "w"), ("type", "type"))
            if edge.get(qn(f"w:{attr}")) is not None
        }
        for edge in margin
    }


def _table_properties(xml_table) -> dict:
    props = xml_table.tblPr
    result = {}
    for key, tag in (("width", "tblW"), ("indent", "tblInd")):
        if value := _width_properties(props, tag):
            result[key] = value
    for key, tag, attr in (("style", "tblStyle", "val"), ("layout", "tblLayout", "type"), ("alignment", "jc", "val")):
        if value := _value(props, tag, attr):
            result[key] = value
    if value := _margin_properties(props, "tblCellMar"):
        result["cell_margins"] = value
    if value := _border_properties(props, "tblBorders"):
        result["borders"] = value
    result["ooxml_direct"] = _direct_ooxml_properties(props)
    return result


def _row_properties(tr) -> dict:
    props = tr.trPr
    if props is None:
        return {}
    result = {}
    height = props.find(qn("w:trHeight"))
    if height is not None:
        if value := height.get(qn("w:val")):
            result["height_twips"] = value
        if value := height.get(qn("w:hRule")):
            result["height_rule"] = value
    for key, tag in (("repeat_header", "tblHeader"), ("cannot_split", "cantSplit")):
        if (value := _toggle_value(props, tag)) is not None:
            result[key] = value
    result["ooxml_direct"] = _direct_ooxml_properties(props)
    return result


def _cell_properties(tc_pr) -> dict:
    if tc_pr is None:
        return {}
    result = {}
    if value := _width_properties(tc_pr, "tcW"):
        result["width"] = value
    if value := _value(tc_pr, "vAlign"):
        result["vertical_alignment"] = value
    if value := _value(tc_pr, "textDirection"):
        result["text_direction"] = value
    if (value := _toggle_value(tc_pr, "noWrap")) is not None:
        result["no_wrap"] = value
    if value := _margin_properties(tc_pr, "tcMar"):
        result["margins"] = value
    if value := _border_properties(tc_pr, "tcBorders"):
        result["borders"] = value
    shading = tc_pr.find(qn("w:shd"))
    if shading is not None:
        result["shading"] = {key: shading.get(qn(f"w:{attr}")) for key, attr in (("fill", "fill"), ("pattern", "val"), ("color", "color")) if shading.get(qn(f"w:{attr}")) is not None}
    result["ooxml_direct"] = _direct_ooxml_properties(tc_pr)
    return result

def _table_record(table, part, table_number: int, prefix: str = "") -> dict:
    xml_table = table._tbl
    grid = xml_table.tblGrid.gridCol_lst
    grid_count = max(1, len(grid))
    rows = []
    row_properties = []
    row_layout = []
    active_merges = {}
    for row_number, tr in enumerate(xml_table.tr_lst):
        tr_pr = tr.trPr
        row_properties.append(_row_properties(tr))
        before = int(tr_pr.gridBefore.val) if tr_pr is not None and tr_pr.gridBefore is not None else 0
        after = int(tr_pr.gridAfter.val) if tr_pr is not None and tr_pr.gridAfter is not None else 0
        row_layout.append({
            "row": row_number, "grid_before": before, "grid_after": after,
            "properties": _row_properties(tr),
        })
        col = before
        cells = []
        next_merges = {}
        for tc in tr.tc_lst:
            tc_pr = tc.tcPr
            span = int(tc_pr.gridSpan.val) if tc_pr is not None and tc_pr.gridSpan is not None else 1
            span = max(1, span)
            vmerge = tc_pr.vMerge if tc_pr is not None else None
            merge_value = vmerge.val if vmerge is not None else None
            key = (col, span)
            if vmerge is not None and merge_value != "restart" and key in active_merges:
                active_merges[key]["rowspan"] += 1
                next_merges[key] = active_merges[key]
            else:
                text, images, content_segments, paragraphs_content = _cell_content(tc, part)
                shading = tc_pr.find(qn("w:shd")) if tc_pr is not None else None
                fill = shading.get(qn("w:fill")) if shading is not None else None
                cell = {
                    "row": row_number, "col": col, "colspan": span, "rowspan": 1,
                    "text": text, "images": images, "content": content_segments,
                    "paragraphs": paragraphs_content,
                    "background": f"#{fill}" if fill and fill.lower() not in {"auto", "clear"} else None,
                    "format": _cell_properties(tc_pr),
                }
                cells.append(cell)
                if vmerge is not None and merge_value == "restart":
                    next_merges[key] = cell
            col += span
        rows.append(cells)
        active_merges = next_merges

    title = next((cell["text"] for row in rows for cell in row if cell["text"]), f"表格 {table_number}")
    content = " ".join(cell["text"] + " " + " ".join(image["search_text"] for image in cell["images"]) for row in rows for cell in row)
    aliases = []
    if re.search(r"H(?:316|320|332)\b", content, re.I):
        aliases.extend(["GHS07", "感叹号", "刺激", "吸入有害", "有害"])
    if re.search(r"H(?:360|370|373)\b", content, re.I):
        aliases.extend(["GHS08", "健康危害", "生殖毒性", "靶器官"])
    match = SECTION_RE.match(title)
    section = f"第 {match.group(1)} 部分" if match else "未分类"
    label = f"{prefix}{section} · 表格 {table_number} · {title[:48]}"
    if prefix.startswith("第 0 部分"):
        label = f"{prefix} · 表格 {table_number}"
    return {
        "label": label, "kind": "table", "title": title, "rows": rows,
        "columns": grid_count, "page": None, "search_text": content + " " + " ".join(aliases),
        "section": section, "field_candidates": _field_candidates(rows),
        "structure": {
            "grid_widths_twips": [col.get(qn("w:w")) for col in grid],
            "table": _table_properties(xml_table),
            "row_properties": row_properties,
            "row_layout": row_layout,
        },
    }


def _paragraphs_content(paragraphs, part) -> tuple[str, list[dict]]:
    texts, segments = [], []
    for index, paragraph in enumerate(paragraphs):
        text, _, paragraph_segments = _paragraph_content(paragraph, part)
        if text:
            texts.append(text)
        segments.extend(paragraph_segments)
        if index < len(paragraphs) - 1:
            segments.append({"type": "text", "text": "\n", "run_format": {}, "paragraph_format": _paragraph_format(paragraph)})
    return "\n".join(texts).strip(), segments


def _read_docx(path: Path) -> dict:
    document = Document(str(path))
    records = []
    for table_number, table in enumerate(document.tables, 1):
        records.append(_table_record(table, document.part, table_number))

    header_footer = []
    header_footer_segments = []
    furniture_records = []
    for section in document.sections:
        for title, container in (("页眉", section.header), ("页脚", section.footer)):
            text, content = _paragraphs_content(container.paragraphs, container.part)
            if text:
                header_footer.append(f"{title}：{text}")
                header_footer_segments.append({"type": "text", "text": f"{title}：", "run_format": {}, "paragraph_format": {}})
                header_footer_segments.extend(content)
            for table_number, table in enumerate(container.tables, 1):
                record = _table_record(table, container.part, table_number, "第 0 部分：页眉 + 页脚")
                record["section"] = "第 0 部分：页眉 + 页脚"
                furniture_records.append(record)
    body_text, body_segments = _paragraphs_content(document.paragraphs, document.part)
    if body_text:
        records.insert(0, {"label": "文档正文", "kind": "text", "text": body_text, "content": body_segments, "page": None})
    if header_footer:
        furniture_text = "\n".join(header_footer)
        records.insert(0, {"label": "第 0 部分：页眉 + 页脚", "kind": "text", "text": furniture_text, "content": header_footer_segments, "page": None, "section": "第 0 部分：页眉 + 页脚", "search_text": furniture_text})
    records[0:0] = furniture_records
    if not records:
        raise ValueError("文档中没有可读取的表格或文本。")
    source_ooxml = {
        "word/document.xml": document._element.xml,
        "word/styles.xml": document.styles.element.xml,
        "word/settings.xml": document.settings.element.xml,
    }
    try:
        source_ooxml["word/numbering.xml"] = document.part.numbering_part.element.xml
    except (AttributeError, KeyError):
        pass
    for part in document.part.related_parts.values():
        if "theme+xml" in getattr(part, "content_type", ""):
            source_ooxml[str(part.partname).lstrip("/")] = part.blob.decode("utf-8", errors="replace")
        elif str(getattr(part, "partname", "")).startswith("/word/") and "xml" in getattr(part, "content_type", ""):
            source_ooxml[str(part.partname).lstrip("/")] = part.blob.decode("utf-8", errors="replace")
    unsupported_tags = {"instrText", "delText", "sym", "object", "pict"}
    warnings = []
    for local_name in sorted(unsupported_tags):
        count = 0
        for xml in source_ooxml.values():
            try:
                root = ElementTree.fromstring(xml)
                count += sum(1 for node in root.iter() if node.tag.rsplit("}", 1)[-1] == local_name)
            except ElementTree.ParseError:
                continue
        if count:
            warnings.append({
                "code": "source_ooxml_not_normalized",
                "element": f"w:{local_name}", "count": count,
                "message": "元素原样保存在 source_ooxml 中，当前标准化文本视图未解析该元素。",
            })
    body_table_xml_count = sum(1 for node in document._element.iter() if node.tag == qn("w:tbl"))
    normalized_body_table_count = len(document.tables)
    if body_table_xml_count != normalized_body_table_count:
        warnings.append({
            "code": "table_wrapper_not_normalized",
            "source_count": body_table_xml_count,
            "normalized_count": normalized_body_table_count,
            "message": "文档 XML 中存在未被 python-docx 顶层表格集合识别的嵌套或包装表格；原始 XML 已保留。",
        })
    return {
        "schema_version": "1.0", "name": path.name, "source_type": "docx",
        "records": records, "source_ooxml": source_ooxml,
        "recognition_warnings": warnings,
        "coverage": {
            "body_table_xml_count": body_table_xml_count,
            "normalized_body_table_count": normalized_body_table_count,
            "table_count_matches": body_table_xml_count == normalized_body_table_count,
            "normalized_cell_count": sum(len(row) for record in records if record["kind"] == "table" for row in record["rows"]),
        },
    }


def _read_pdf(path: Path) -> dict:
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("读取 PDF 需要安装 pdfplumber：\npy -m pip install -r requirements.txt") from exc

    records = []
    warnings = []
    with pdfplumber.open(str(path)) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            page_text = (page.extract_text() or "").strip()
            tables = page.extract_tables()
            positioned_tables = page.find_tables()
            text_layout = page.extract_words(extra_attrs=["fontname", "size"])
            for table_number, raw_table in enumerate(tables, 1):
                if not raw_table:
                    continue
                positioned_table = positioned_tables[table_number - 1] if table_number <= len(positioned_tables) else None
                positioned_rows = getattr(positioned_table, "rows", []) if positioned_table else []
                width = max((len(row) for row in raw_table if row), default=1)
                rows = []
                for row_number, raw_row in enumerate(raw_table):
                    values = list(raw_row or [])
                    values.extend([""] * (width - len(values)))
                    position_row = positioned_rows[row_number].cells if row_number < len(positioned_rows) else []
                    row_cells = []
                    for col, value in enumerate(values):
                        bbox = position_row[col] if col < len(position_row) else None
                        cell_text = (value or "").strip()
                        if not cell_text and bbox:
                            cell_text = (page.crop(tuple(bbox), strict=False).extract_text() or "").strip()
                        row_cells.append({
                            "row": row_number, "col": col, "colspan": 1, "rowspan": 1,
                            "text": cell_text, "images": [],
                            "source_bbox_pdf_points": list(bbox) if bbox else None,
                        })
                    rows.append(row_cells)
                text_capture_method = "table_extractor"
                if positioned_table and rows and not any(cell["text"] for row in rows for cell in row):
                    x0, top, x1, bottom = positioned_table.bbox
                    nearby_words = [
                        word for word in text_layout
                        if x0 - 2 <= (word["x0"] + word["x1"]) / 2 <= x1 + 2
                        and top - 4 <= word["top"] <= bottom + max(36, (bottom - top) * 0.75)
                    ]
                    lines = []
                    for word in sorted(nearby_words, key=lambda item: (item["top"], item["x0"])):
                        if not lines or abs(word["top"] - lines[-1][0]["top"]) > 2.5:
                            lines.append([])
                        lines[-1].append(word)
                    if len(lines) >= len(rows):
                        text_capture_method = "word_position_fallback"
                        for line_index, line in enumerate(lines):
                            row_index = min(len(rows) - 1, line_index * len(rows) // len(lines))
                            for word in line:
                                center_x = (word["x0"] + word["x1"]) / 2
                                for cell in rows[row_index]:
                                    bbox = cell.get("source_bbox_pdf_points")
                                    if bbox and bbox[0] - 2 <= center_x <= bbox[2] + 2:
                                        cell.setdefault("_fallback_words", []).append(word)
                                        break
                        for row in rows:
                            for cell in row:
                                words = sorted(cell.pop("_fallback_words", []), key=lambda item: (item["top"], item["x0"]))
                                if words:
                                    cell["text"] = "".join(
                                        (" " if index and re.search(r"[A-Za-z0-9]$", words[index - 1]["text"]) and re.match(r"[A-Za-z0-9]", word["text"]) else "") + word["text"]
                                        for index, word in enumerate(words)
                                    )
                                    cell["text_layout"] = words
                if text_capture_method == "word_position_fallback":
                    warnings.append({
                        "code": "pdf_table_text_position_fallback",
                        "page": page_number, "table": table_number,
                        "message": "表格提取器未返回单元格文字，已按字词坐标和检测到的网格回填；请结合 source_bbox 与原始页面复核。",
                    })
                if not positioned_table:
                    warnings.append({
                        "code": "pdf_table_geometry_unavailable",
                        "page": page_number, "table": table_number,
                        "message": "检测到表格文字网格，但未检测到可靠的边界坐标。",
                    })
                title = next((cell["text"] for row in rows for cell in row if cell["text"]), "")
                match = SECTION_RE.match(title)
                section = f"第 {match.group(1)} 部分" if match else "未分类"
                records.append({
                    "label": f"{section} · 第 {page_number} 页 · 表格 {table_number}",
                    "kind": "table", "title": title or f"第 {page_number} 页表格 {table_number}",
                    "rows": rows, "columns": width, "page": page_number,
                    "field_candidates": _field_candidates(rows),
                    "structure": {
                        "row_count": len(rows), "column_count": width,
                        "geometry_available": positioned_table is not None,
                        "source_bbox_pdf_points": list(positioned_table.bbox) if positioned_table else None,
                        "capture_level": "detected_text_grid_with_geometry" if positioned_table else "detected_text_grid_only",
                        "text_capture_method": text_capture_method,
                    },
                })
            if page_text:
                search_text = page_text
                if re.search(r"H(?:316|320|332)\b", page_text, re.I):
                    search_text += " GHS07 感叹号 刺激 吸入有害 有害"
                if re.search(r"H(?:360|370|373)\b", page_text, re.I):
                    search_text += " GHS08 健康危害 生殖毒性 靶器官"
                records.append({
                    "label": f"第 {page_number} 页全文", "kind": "text",
                    "text": page_text, "page": page_number, "pages": [page_number], "search_text": search_text,
                    "text_layout": text_layout,
                })
            if page.images:
                records.append({
                    "label": f"第 {page_number} 页图像提示", "kind": "text",
                    "text": f"本页含 {len(page.images)} 个图像对象（GHS 象形图 / pictogram / 图像）；图像文字不会被表格提取器识别。请打开原文件核对图示或扫描内容。",
                    "page": page_number, "pages": [page_number],
                })
            elif not page_text and not tables:
                records.append({
                    "label": f"第 {page_number} 页未提取到内容", "kind": "text",
                    "text": "本页未检测到可提取的文字或表格，可能是空白页或扫描图片。请打开原文件核对。",
                    "page": page_number,
                })
    if not records:
        raise ValueError("PDF 中没有可读取的文本或表格。")
    return {
        "schema_version": "1.0", "name": path.name, "source_type": "pdf", "records": records,
        "recognition_warnings": warnings + [{
            "code": "pdf_format_inference_limited",
            "message": "PDF 不包含 Word 段落/字符样式语义；text_layout 保留可提取的字词位置、字体名和字号，原始 PDF 页面预览作为版式依据。",
        }],
    }


def _export_word_pdf(path: Path, output: Path) -> None:
    try:
        import win32com.client
    except ImportError as exc:
        raise RuntimeError("Word 原版式预览需要 Windows 和已安装的 Word/WPS（兼容 Word 自动化接口）。") from exc
    app = win32com.client.DispatchEx("Word.Application")
    app.Visible = False
    app.DisplayAlerts = 0
    document = None
    try:
        document = app.Documents.Open(str(path.resolve()), ReadOnly=True, ConfirmConversions=False,
                                      AddToRecentFiles=False, Visible=False)
        document.ExportAsFixedFormat(str(output), 17)
    finally:
        if document is not None:
            document.Close(False)
        app.Quit()


def read_file(path: Path, render_dir: Path | None = None) -> dict:
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED:
        raise ValueError("仅支持 DOC、DOCX 和 PDF 文件。")
    if suffix == ".pdf":
        document = _read_pdf(path)
        document["render_pdf"] = path
        return document
    if suffix == ".docx":
        document = _read_docx(path)
        if render_dir is not None:
            output = render_dir / "native-preview.pdf"
            _export_word_pdf(path, output)
            document["render_pdf"] = output
            _map_record_pages(document, output)
        return document

    try:
        import win32com.client
    except ImportError as exc:
        raise RuntimeError("读取旧版 DOC 需要 Windows 和 Microsoft Word（pywin32）。") from exc

    with tempfile.TemporaryDirectory(prefix="msds_read_") as temp_dir:
        converted = Path(temp_dir) / f"{path.stem}.docx"
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0
        doc = None
        try:
            doc = word.Documents.Open(
                str(path.resolve()), ReadOnly=True, ConfirmConversions=False,
                AddToRecentFiles=False, Visible=False,
            )
            doc.SaveAs2(str(converted), FileFormat=16)
        finally:
            if doc is not None:
                doc.Close(False)
            word.Quit()
        if not converted.exists():
            raise RuntimeError("Microsoft Word 未能将 DOC 转换为可读取格式。")
        document = _read_docx(converted)
        document["name"] = path.name
        document["source_type"] = "doc"
        document["converted_from_doc"] = True
        if render_dir is not None:
            output = render_dir / "native-preview.pdf"
            _export_word_pdf(path, output)
            document["render_pdf"] = output
            _map_record_pages(document, output)
        return document


def _map_record_pages(document: dict, pdf_path: Path) -> None:
    import pdfplumber
    with pdfplumber.open(str(pdf_path)) as pdf:
        pages = [re.sub(r"[ \t]+", " ", page.extract_text() or "").casefold() for page in pdf.pages]
    section_pages = {}
    for index, text in enumerate(pages, 1):
        for match in re.finditer(r"(?m)^\s*(1[0-6]|[1-9])\s*[.．、]\s*", text):
            section_pages.setdefault(f"第 {match.group(1)} 部分", index)
    starts = sorted((page, int(section.split()[1])) for section, page in section_pages.items())
    for record in document["records"]:
        section = record.get("section", "")
        if section.startswith("第 0 部分"):
            record["pages"] = list(range(1, len(pages) + 1))
            continue
        match = re.match(r"第\s*(\d+)\s*部分", section)
        if not match:
            title = re.sub(r"\s+", "", record.get("title", "")).casefold()
            candidates = [i + 1 for i, text in enumerate(pages) if title and title[:18] in re.sub(r"\s+", "", text)]
            record["pages"] = candidates[:1] or [1]
            continue
        number = int(match.group(1))
        start = section_pages.get(f"第 {number} 部分")
        if not start:
            record["pages"] = [1]
            continue
        next_pages = [page for page, num in starts if num > number]
        # ponytail: section previews overlap shared pages; track heading y-coordinates if page-level precision matters.
        next_page = min(next_pages) if next_pages else None
        last_page = len(pages)
        if next_page:
            shared_page = re.search(rf"(?m)^[ \t]*{number}(?:\.\d+)?(?:[ \t]*[.．、]|[ \t]+)", pages[next_page - 1])
            last_page = next_page if shared_page else next_page - 1
        record["pages"] = list(range(start, max(start, last_page) + 1))


class MsdsViewer:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("MSDS 表格检索")
        self.root.geometry("1280x820")
        self.document = None
        self.preview_path = None
        self.preview_root = tempfile.TemporaryDirectory(prefix="msds_preview_")
        self.visible_records = []
        self.images = []
        self.result_queue = queue.Queue()

        top = ttk.Frame(root, padding=(10, 8))
        top.pack(fill="x")
        self.import_button = ttk.Button(top, text="导入 DOC / DOCX / PDF", command=self.choose_file)
        self.import_button.pack(side="left")
        self.source_button = ttk.Button(top, text="打开原文件", command=self.open_source, state="disabled")
        self.source_button.pack(side="left", padx=(6, 0))
        self.export_button = ttk.Button(top, text="导出识别 JSON", command=self.export_json, state="disabled")
        self.export_button.pack(side="left", padx=(6, 0))
        self.filename = ttk.Label(top, text="尚未导入文件")
        self.filename.pack(side="left", padx=12)
        ttk.Label(top, text="检索：").pack(side="left", padx=(18, 4))
        self.query = tk.StringVar()
        entry = ttk.Entry(top, textvariable=self.query, width=34)
        entry.pack(side="left")
        self.query.trace_add("write", lambda *_: self.refresh_list())
        self.status = ttk.Label(top, text="支持本机读取，不会修改原文件")
        self.status.pack(side="right")

        body = ttk.Panedwindow(root, orient="horizontal")
        body.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        nav = ttk.Frame(body, width=330)
        body.add(nav, weight=1)
        ttk.Label(nav, text="章节 / 表格 / 搜索结果").pack(anchor="w", pady=(0, 5))
        self.listbox = tk.Listbox(nav, exportselection=False, activestyle="dotbox")
        list_scroll = ttk.Scrollbar(nav, orient="vertical", command=self.listbox.yview)
        self.listbox.configure(yscrollcommand=list_scroll.set)
        self.listbox.pack(side="left", fill="both", expand=True)
        list_scroll.pack(side="right", fill="y")
        self.listbox.bind("<<ListboxSelect>>", self.show_selected)

        viewer = ttk.Frame(body)
        body.add(viewer, weight=4)
        self.tabs = ttk.Notebook(viewer)
        self.tabs.pack(fill="both", expand=True)
        page_tab = ttk.Frame(self.tabs)
        table_tab = ttk.Frame(self.tabs)
        format_tab = ttk.Frame(self.tabs)
        self.tabs.add(page_tab, text="原版页面（默认）")
        self.tabs.add(table_tab, text="结构化表格")
        self.tabs.add(format_tab, text="格式与表格属性")
        self.page_canvas = tk.Canvas(page_tab, background="#d9dde3", highlightthickness=0)
        page_scroll = ttk.Scrollbar(page_tab, orient="vertical", command=self.page_canvas.yview)
        self.page_canvas.configure(yscrollcommand=page_scroll.set)
        self.page_canvas.pack(side="left", fill="both", expand=True)
        page_scroll.pack(side="right", fill="y")
        self.page_content = ttk.Frame(self.page_canvas)
        self.page_canvas_window = self.page_canvas.create_window((0, 0), window=self.page_content, anchor="n")
        self.page_content.bind("<Configure>", lambda _: self.page_canvas.configure(scrollregion=self.page_canvas.bbox("all")))
        self.page_canvas.bind("<Configure>", lambda event: self.page_canvas.itemconfigure(self.page_canvas_window, width=event.width))
        viewer = table_tab
        self.canvas = tk.Canvas(viewer, background="white", highlightthickness=0)
        vertical = ttk.Scrollbar(viewer, orient="vertical", command=self.canvas.yview)
        horizontal = ttk.Scrollbar(viewer, orient="horizontal", command=self.canvas.xview)
        self.canvas.configure(yscrollcommand=vertical.set, xscrollcommand=horizontal.set)
        self.canvas.grid(row=0, column=0, sticky="nsew")
        vertical.grid(row=0, column=1, sticky="ns")
        horizontal.grid(row=1, column=0, sticky="ew")
        viewer.rowconfigure(0, weight=1)
        viewer.columnconfigure(0, weight=1)
        self.content = ttk.Frame(self.canvas, padding=14)
        self.canvas_window = self.canvas.create_window((0, 0), window=self.content, anchor="nw")
        self.content.bind("<Configure>", lambda _: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.format_view = tk.Text(format_tab, wrap="none", font=("Consolas", 9))
        format_y = ttk.Scrollbar(format_tab, orient="vertical", command=self.format_view.yview)
        format_x = ttk.Scrollbar(format_tab, orient="horizontal", command=self.format_view.xview)
        self.format_view.configure(yscrollcommand=format_y.set, xscrollcommand=format_x.set, state="disabled")
        self.format_view.grid(row=0, column=0, sticky="nsew")
        format_y.grid(row=0, column=1, sticky="ns")
        format_x.grid(row=1, column=0, sticky="ew")
        format_tab.rowconfigure(0, weight=1)
        format_tab.columnconfigure(0, weight=1)

    def choose_file(self):
        filename = filedialog.askopenfilename(
            title="选择 MSDS 文件",
            filetypes=[("MSDS 文件", "*.doc *.docx *.pdf"), ("所有文件", "*.*")],
        )
        if not filename:
            return
        path = Path(filename)
        if path.suffix.lower() not in SUPPORTED:
            messagebox.showerror("不支持的文件", "请选择 DOC、DOCX 或 PDF 文件。")
            return
        self.status.configure(text="正在读取…")
        self.import_button.configure(state="disabled")
        self.source_button.configure(state="disabled")
        self.filename.configure(text=path.name)
        self.document = None
        self.export_button.configure(state="disabled")
        self.listbox.delete(0, "end")
        threading.Thread(target=self._load_worker, args=(path,), daemon=True).start()
        self.root.after(100, self._poll_result)

    def _load_worker(self, path: Path):
        try:
            render_dir = Path(tempfile.mkdtemp(prefix="import_", dir=self.preview_root.name))
            document = read_file(path, render_dir)
            try:
                preview_path = render_dir / path.name
                shutil.copy2(path, preview_path)
            except OSError:
                preview_path = None
            if path.suffix.lower() == ".pdf" and preview_path:
                document["render_pdf"] = preview_path
            self.result_queue.put((document, preview_path, None))
        except Exception as exc:
            self.result_queue.put((None, None, str(exc)))

    def _poll_result(self):
        try:
            document, preview_path, error = self.result_queue.get_nowait()
        except queue.Empty:
            self.root.after(100, self._poll_result)
            return
        if error:
            self.import_button.configure(state="normal")
            self.source_button.configure(state="disabled")
            self.export_button.configure(state="disabled")
            self.preview_path = None
            self.status.configure(text="读取失败")
            self.filename.configure(text="尚未导入文件")
            messagebox.showerror("导入失败", error)
            return
        self.document = document
        self.preview_path = preview_path
        self.import_button.configure(state="normal")
        self.source_button.configure(state="normal" if preview_path else "disabled")
        self.export_button.configure(state="normal")
        self.status.configure(text=f"已读取 {len(document['records'])} 个表格 / 页面条目" if preview_path else "已读取；原版式预览副本创建失败")
        self.refresh_list()
        if self.visible_records:
            self.listbox.selection_set(0)
            self.show_selected()

    def open_source(self):
        if self.preview_path:
            if os.name == "nt":
                os.startfile(str(self.preview_path.resolve()))
            else:
                webbrowser.open(self.preview_path.resolve().as_uri())

    def export_json(self):
        if not self.document:
            return
        filename = filedialog.asksaveasfilename(
            title="导出完整识别结果",
            defaultextension=".json",
            initialfile=f"{Path(self.document['name']).stem}_recognition.json",
            filetypes=[("JSON 文件", "*.json")],
        )
        if not filename:
            return
        export_data = {key: value for key, value in self.document.items() if key != "render_pdf"}
        try:
            Path(filename).write_text(json.dumps(export_data, ensure_ascii=False, indent=2), encoding="utf-8")
        except OSError as exc:
            messagebox.showerror("导出失败", str(exc))
            return
        self.status.configure(text=f"识别结果已导出：{Path(filename).name}")

    @staticmethod
    def _record_text(record: dict) -> str:
        if record["kind"] == "text":
            return record["text"]
        cells = "\n".join(
            cell["text"] for row in record["rows"] for cell in row
        )
        images = " ".join(image.get("search_text", "") for row in record["rows"] for cell in row for image in cell.get("images", []))
        return cells + "\n" + images + "\n" + record.get("search_text", "")

    def refresh_list(self):
        if not self.document:
            return
        query = self.query.get().strip().casefold()
        self.visible_records = []
        self.listbox.delete(0, "end")
        for record in self.document["records"]:
            haystack = (record["label"] + "\n" + self._record_text(record)).casefold()
            if query and query not in haystack:
                continue
            self.visible_records.append(record)
            label = record["label"]
            if query:
                count = haystack.count(query)
                label = f"{label}  ·  命中 {count} 处"
            self.listbox.insert("end", label)
        self.status.configure(text=f"{len(self.visible_records)} 项" + (f"匹配“{query}”" if query else ""))

    def show_selected(self, _event=None):
        selection = self.listbox.curselection()
        if not selection or selection[0] >= len(self.visible_records):
            return
        record = self.visible_records[selection[0]]
        self.show_native_pages(record)
        if record["kind"] == "table":
            metadata = {
                "schema_version": self.document.get("schema_version", "1.0"),
                "source_type": self.document.get("source_type"),
                "recognition_warnings": self.document.get("recognition_warnings", []),
                "field_candidates": record.get("field_candidates", []),
                "table_structure": record.get("structure", {}),
                "rows": record.get("rows", []),
            }
        else:
            metadata = {
                "schema_version": self.document.get("schema_version", "1.0"),
                "source_type": self.document.get("source_type"),
                "recognition_warnings": self.document.get("recognition_warnings", []),
                "record": {key: value for key, value in record.items() if key not in {"text", "search_text"}},
            }
        self.format_view.configure(state="normal")
        self.format_view.delete("1.0", "end")
        self.format_view.insert("1.0", json.dumps(metadata, ensure_ascii=False, indent=2))
        self.format_view.configure(state="disabled")
        for child in self.content.winfo_children():
            child.destroy()
        self.images.clear()
        if record["kind"] == "text":
            ttk.Label(self.content, text=record["label"], font=("Microsoft YaHei UI", 14, "bold")).pack(anchor="w", pady=(0, 10))
            text = tk.Text(self.content, wrap="word", width=100, height=40, font=("Microsoft YaHei UI", 10))
            text.insert("1.0", record["text"])
            text.configure(state="disabled")
            text.pack(fill="both", expand=True)
            return
        rows = record["rows"]
        columns = max(1, record["columns"])
        ttk.Label(
            self.content,
            text=f"{record['label']}   ·   {len(rows)} 行 × {columns} 列",
            font=("Microsoft YaHei UI", 13, "bold"),
        ).grid(row=0, column=0, columnspan=columns, sticky="w", pady=(0, 10))
        grid_widths = record.get("structure", {}).get("grid_widths_twips", [])
        for column in range(columns):
            try:
                min_width = round(int(grid_widths[column]) / 15)
            except (IndexError, TypeError, ValueError):
                min_width = 220
            self.content.columnconfigure(column, weight=0, minsize=max(130, min(420, min_width)))
        table_start = 1
        for row_index, row in enumerate(rows):
            for cell in row:
                cell_frame = tk.Frame(
                    self.content, background="#f5f8fc" if row_index == 0 else "white",
                    relief="solid", borderwidth=1,
                )
                cell_frame.grid(
                    row=table_start + row_index, column=cell["col"],
                    rowspan=cell["rowspan"], columnspan=cell["colspan"],
                    sticky="nsew",
                )
                segments = cell.get("content")
                if segments is None:
                    segments = [{"type": "text", "text": cell["text"]}]
                    segments.extend({"type": "image", "image": image} for image in cell.get("images", []))
                background = "#f5f8fc" if row_index == 0 else "white"
                segment_images = {}
                for segment_index, segment in enumerate(segments):
                    if segment["type"] != "image":
                        continue
                    try:
                        image = tk.PhotoImage(data=segment["image"]["data"])
                        segment_images[segment_index] = image
                        self.images.append(image)
                    except tk.TclError:
                        continue
                base_font = tkfont.Font(root=cell_frame, family="Microsoft YaHei UI", size=9)
                line_spacing = max(1, base_font.metrics("linespace"))
                image_extra_lines = sum(max(0, (image.height() - 1) // line_spacing) for image in segment_images.values())
                text_view = tk.Text(
                    cell_frame, wrap="word", width=1, height=1, font=base_font,
                    background=background, foreground="#111111", borderwidth=0,
                    highlightthickness=0, padx=8, pady=6, cursor="arrow",
                )
                for segment_index, segment in enumerate(segments):
                    if segment["type"] == "text":
                        run_format = segment.get("run_format", {})
                        style = []
                        bold = run_format.get("bold", "true" if row_index == 0 else "false").casefold() not in {"0", "false", "off", "none"}
                        italic = run_format.get("italic", "false").casefold() not in {"0", "false", "off", "none"}
                        if bold:
                            style.append("bold")
                        if italic:
                            style.append("italic")
                        family = run_format.get("font_east_asia") or run_format.get("font_ascii") or "Microsoft YaHei UI"
                        size = max(1, round(int(run_format.get("size_half_points", "18")) / 2))
                        tag = f"run_{segment_index}"
                        text_view.tag_configure(tag, font=(family, size, *style))
                        underline = run_format.get("underline", "false").casefold() not in {"0", "false", "off", "none"}
                        if underline:
                            text_view.tag_configure(tag, underline=True)
                        color = run_format.get("color", "")
                        if re.fullmatch(r"[0-9A-Fa-f]{6}", color):
                            text_view.tag_configure(tag, foreground=f"#{color}")
                        alignment = segment.get("paragraph_format", {}).get("alignment")
                        if alignment in {"center", "right"}:
                            text_view.tag_configure(tag, justify=alignment)
                        text_view.insert("end", segment["text"], tag)
                        continue
                    image = segment_images.get(segment_index)
                    if image is not None:
                        text_view.image_create("end", image=image, align="baseline")
                text_view.configure(state="disabled")
                text_view.pack(fill="both", expand=True)

                def fit_text_height(_event=None, widget=text_view, extra=image_extra_lines):
                    try:
                        # Count through Tk's terminal newline: stopping at end-1c
                        # drops the final display line and clips its lower half.
                        display_lines = widget.count("1.0", "end", "displaylines")
                        lines = display_lines[0] if isinstance(display_lines, tuple) else int(display_lines or 1)
                        height = max(1, lines + extra)
                        if widget.winfo_width() > 1 and int(widget.cget("height")) != height:
                            widget.configure(height=height)
                    except tk.TclError:
                        pass

                text_view.bind("<Configure>", fit_text_height)
                text_view.after_idle(fit_text_height)

    def show_native_pages(self, record: dict):
        for child in self.page_content.winfo_children():
            child.destroy()
        self.page_images = []
        render_pdf = self.document.get("render_pdf") if self.document else None
        if not render_pdf:
            ttk.Label(self.page_content, text="此文件没有可用的原版式页面预览。", padding=20).pack()
            return
        try:
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(str(render_pdf))
            try:
                page_numbers = record.get("pages") or ([record["page"]] if record.get("page") else list(range(1, len(pdf) + 1)))
                for number in page_numbers:
                    if number < 1 or number > len(pdf):
                        continue
                    page = pdf[number - 1]
                    bitmap = page.render(scale=1.25)
                    pil_image = bitmap.to_pil().convert("RGB")
                    image = tk.PhotoImage(data=base64.b64encode(_png_bytes(pil_image)).decode("ascii"))
                    self.page_images.append(image)
                    ttk.Label(self.page_content, text=f"第 {number} 页", image=image, compound="top").pack(pady=10)
                    page.close()
            finally:
                pdf.close()
        except Exception as exc:
            ttk.Label(self.page_content, text=f"原版式预览失败：{exc}", padding=20).pack()

    def close(self):
        self.preview_root.cleanup()


def _png_bytes(image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def main():
    if os.name != "nt":
        print("提示：DOC 文件转换需要 Windows 和 Microsoft Word；DOCX/PDF 可在其他系统上使用。")
    root = tk.Tk()
    viewer = MsdsViewer(root)
    root.protocol("WM_DELETE_WINDOW", lambda: (viewer.close(), root.destroy()))
    root.mainloop()


if __name__ == "__main__":
    main()
