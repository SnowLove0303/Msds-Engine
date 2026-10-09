"""CN Guanzhi MSDS template overwrite editor.

Non-bold values are editable by default; bold labels can be enabled explicitly
for exceptional corrections (specifically Section 9 physical/chemical property qualifiers).
Tables and paragraphs are never rebuilt; export writes only text into the original runs,
preserving all w:pPr, w:tblPr, w:trPr, w:tcPr, and w:rPr XML styling.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass
import hashlib
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


SOURCE_DIR = Path(r"F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板")
SOURCE_TEMPLATE_CN = SOURCE_DIR / "正式模板_MSDS_CN_冠志(1).docx"
SOURCE_TEMPLATE_EN = SOURCE_DIR / "正式模板_MSDS_EN_冠志(1).docx"

EMBEDDED_DIR = Path(__file__).resolve().parent / "内嵌模板"
EMBEDDED_TEMPLATE_CN = EMBEDDED_DIR / "正式模板_MSDS_CN_冠志(1).docx"
EMBEDDED_TEMPLATE_EN = EMBEDDED_DIR / "正式模板_MSDS_EN_冠志(1).docx"

DEFAULT_TEMPLATE = (
    EMBEDDED_TEMPLATE_CN if EMBEDDED_TEMPLATE_CN.exists() else SOURCE_TEMPLATE_CN
)
TEMPLATE_LIBRARY = {
    "CN 冠志": EMBEDDED_TEMPLATE_CN if EMBEDDED_TEMPLATE_CN.exists() else SOURCE_TEMPLATE_CN,
    "EN 冠志": EMBEDDED_TEMPLATE_EN if EMBEDDED_TEMPLATE_EN.exists() else SOURCE_TEMPLATE_EN,
}


class MutationViolation(PermissionError):
    """Raised when an operation attempts to mutate locked structural elements or illegal labels."""
    pass


NUMBER_RE = re.compile(r"(?<!\d)(\d+(?:\.\d+)+)(?!\d)")
PREFIX_PATTERN = re.compile(r"^(\s*)(\d{1,2})\.(\d{1,2})(\s*)")
SEQUENCE_RE = re.compile(r"^\s*(\d+(?:\.\d+)*)(?:[、）:.]|\s)")

ALLOW_LABEL_EDIT_DEFAULT = False


@dataclass
class Field:
    table_index: int | None
    row_index: int | None
    cell_index: int | None
    cell: object
    label: str
    value: str
    runs: list[object]
    role: str = "value"

    @property
    def is_label(self) -> bool:
        return self.role == "label"

    @property
    def is_value(self) -> bool:
        return self.role == "value"


@dataclass
class CellView:
    cell: object
    start_column: int
    span: int
    label_field: Field | None
    value_field: Field | None
    kind: str

    @property
    def has_label(self) -> bool:
        return self.label_field is not None

    @property
    def has_value(self) -> bool:
        return self.value_field is not None


def unique_cells(row) -> list:
    """Return cells once, even when a Word row contains merged-cell aliases."""
    result = []
    seen = set()
    for cell in row.cells:
        key = id(cell._tc)
        if key not in seen:
            seen.add(key)
            result.append(cell)
    return result


def row_cells_with_spans(row) -> list[tuple[object, int, int]]:
    """Keep horizontal merged-cell spans so the editor mirrors the Word row."""
    result = []
    cells = row.cells
    column = 0
    while column < len(cells):
        cell = cells[column]
        end = column + 1
        while end < len(cells) and id(cells[end]._tc) == id(cell._tc):
            end += 1
        result.append((cell, column, end - column))
        column = end
    return result


def all_runs(container) -> list:
    paragraphs = getattr(container, "paragraphs", None)
    if paragraphs is None:
        return list(getattr(container, "runs", []))
    return [run for paragraph in paragraphs for run in paragraph.runs]


def nonbold_runs(cell) -> list:
    return [run for run in all_runs(cell) if not run.bold]


def bold_runs(cell) -> list:
    return [run for run in all_runs(cell) if run.bold]


def bold_text(cell) -> str:
    return "".join(run.text for run in bold_runs(cell)).strip()


def value_text(cell) -> str:
    parts = []
    for paragraph in cell.paragraphs:
        text = "".join(run.text for run in paragraph.runs if not run.bold)
        parts.append(text)
    return "\n".join(parts).strip("\n")


def visible_text(cell) -> str:
    return "\n".join("".join(run.text for run in paragraph.runs)
                      for paragraph in cell.paragraphs).strip("\n")


def looks_like_unbold_label(cell, row_cell_count: int) -> bool:
    """Handle ordinary DOCX tables whose short label cell lost bold formatting."""
    if row_cell_count <= 1 or bold_runs(cell):
        return False
    text = visible_text(cell).strip()
    return bool(text) and "\n" not in text and len(text) <= 80 and text.endswith((":", "："))


def part_text(cell, runs: list) -> str:
    if not runs:
        return ""
    run_ids = {id(run._r) for run in runs}
    paragraphs = getattr(cell, "paragraphs", [cell])
    parts = []
    for paragraph in paragraphs:
        paragraph_runs = [run for run in paragraph.runs if id(run._r) in run_ids]
        parts.append("".join(run.text for run in paragraph_runs))
    return "\n".join(parts).strip("\n")


def row_label(row, cells: list) -> str:
    for cell in cells:
        label = bold_text(cell)
        if label:
            return label.replace("\n", " ")[:80]
    return "未加粗行"


def row_fields(table_index: int, row_index: int, row, *, include_labels: bool = False) -> list[Field]:
    cells = unique_cells(row)
    label = row_label(row, cells)
    fields = []
    for cell_index, cell in enumerate(cells):
        if include_labels:
            l_runs = bold_runs(cell)
            if l_runs:
                fields.append(
                    Field(table_index, row_index, cell_index, cell, "标签",
                          bold_text(cell), l_runs, role="label")
                )
        v_runs = nonbold_runs(cell)
        if v_runs:
            fields.append(
                Field(table_index, row_index, cell_index, cell,
                      bold_text(cell) or label, value_text(cell), v_runs, role="value")
            )
    return fields


def cell_views(table_index: int, row_index: int, row) -> list[CellView]:
    source_cells = row_cells_with_spans(row)
    row_cell_count = len(source_cells)
    views = []
    for cell, start_column, span in source_cells:
        labels = bold_runs(cell)
        values = nonbold_runs(cell)
        if not labels and values and looks_like_unbold_label(cell, row_cell_count):
            labels, values = values, []
        label_field = Field(table_index, row_index, start_column, cell, "标签",
                            part_text(cell, labels), labels, role="label") if labels else None
        value_field = Field(table_index, row_index, start_column, cell, "值",
                            part_text(cell, values), values, role="value") if values else None
        if label_field and value_field:
            kind = "label-value"
        elif label_field:
            kind = "label-only"
        elif value_field:
            kind = "note" if row_cell_count == 1 else "value-only"
        else:
            kind = "structure"
        views.append(CellView(cell, start_column, span, label_field, value_field, kind))
    return views


def paragraph_fields(document) -> list[Field]:
    fields = []
    for index, paragraph in enumerate(document.paragraphs):
        labels = [run for run in paragraph.runs if run.bold]
        values = [run for run in paragraph.runs if not run.bold]
        if labels:
            fields.append(Field(None, index, None, paragraph, "标签",
                                part_text(paragraph, labels), labels, role="label"))
        if values:
            fields.append(Field(None, index, None, paragraph, "值",
                                part_text(paragraph, values), values, role="value"))
    return fields


def normalize_value_text(text: str) -> str:
    """Normalizes value text by stripping carriage returns and excess trailing newlines."""
    text = str(text or "").replace("\r\n", "\n").replace("\r", "\n")
    return text.strip(" \t\r\n")


def replace_run_text(runs: list, value: str) -> None:
    """Keep existing run properties and distribute new text over those runs without altering rPr."""
    value = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
    if not runs:
        return
    weights = [max(len(run.text or ""), 1) for run in runs]
    total = sum(weights)
    offset = 0
    for index, (run, weight) in enumerate(zip(runs, weights)):
        if index == len(runs) - 1:
            end = len(value)
        else:
            end = offset + round(len(value) * weight / total)
        run.text = value[offset:end]
        offset = end


def _write_s9_qualified_label(cell, label: str) -> None:
    """Change only S9 qualifier text while strictly retaining existing prefix and run styling.

    Preserves '9.n  ' prefix, aligns spacing (prefix_width=5), ensures trailing colon,
    and updates only the property-name runs without altering w:rPr or w:pPr.
    """
    paragraphs = getattr(cell, "paragraphs", None)
    if not paragraphs or not paragraphs[0].runs:
        raise MutationViolation("qualified S9 label requires at least one styled label run")
    paragraph = paragraphs[0]
    full_text = "".join(r.text or "" for r in paragraph.runs)
    prefix_match = re.match(r"^\s*(9\.\d+)(\s*)", full_text)
    if not prefix_match:
        raise MutationViolation("qualified S9 label has no maintained 9.n prefix")

    clean_body = re.sub(r"^\s*9\.\d+\s*", "", str(label or "")).strip()
    if not clean_body:
        raise MutationViolation("S9 label text cannot be empty")

    if not clean_body.endswith(("：", ":")):
        clean_body += "："

    sec_item = prefix_match.group(1)
    separator = " " * max(1, 5 - len(sec_item))
    new_prefix = f"{sec_item}{separator}"
    boundary = prefix_match.end()

    cursor = 0
    body_written = False
    for run in paragraph.runs:
        run_len = len(run.text or "")
        start, end = cursor, cursor + run_len
        old_run_text = run.text or ""

        if end <= boundary:
            if start == 0:
                run.text = new_prefix
            else:
                run.text = ""
        elif start < boundary:
            run.text = new_prefix + clean_body
            body_written = True
        elif not body_written:
            run.text = clean_body
            body_written = True
        else:
            run.text = ""
        cursor = end

    if not body_written and paragraph.runs:
        paragraph.runs[-1].text = (paragraph.runs[-1].text or "") + clean_body


def set_field_value(field: Field, value: str, *,
                    allow_label_edit: bool = False,
                    preserve_prefix: bool = True) -> None:
    """Safe value/label setter enforcing write-time constraints.

    - Values are updated via run text distribution preserving all w:rPr.
    - Labels require allow_label_edit=True; otherwise raises MutationViolation.
    - Section 9 labels preserve the '9.n  ' prefix and width alignment.
    """
    if field.role == "label":
        if not allow_label_edit:
            raise MutationViolation(
                "修改标签已被锁定保护。如需修改标签（如 Section 9 特殊理化特性标签），"
                "请传入 allow_label_edit=True 或调用 set_label_value()。"
            )
        if field.table_index == 8 and hasattr(field.cell, "paragraphs"):
            _write_s9_qualified_label(field.cell, value)
            field.value = visible_text(field.cell)
            return
        if preserve_prefix and hasattr(field.cell, "paragraphs"):
            cell_text = visible_text(field.cell)
            m = PREFIX_PATTERN.match(cell_text)
            if m:
                prefix = cell_text[:m.end()]
                clean_v = re.sub(r"^\s*\d+\.\d+\s*", "", str(value or "")).strip()
                value = prefix + clean_v
        replace_run_text(field.runs, value)
        field.value = value
    else:
        clean_v = normalize_value_text(value)
        replace_run_text(field.runs, clean_v)
        field.value = clean_v


def _write_general_label(cell, new_label: str) -> None:
    """Safely update non-S9 label cell while strictly preserving existing bold/style runs."""
    paragraphs = getattr(cell, "paragraphs", None)
    if not paragraphs:
        cell.add_paragraph()
    p = cell.paragraphs[0]
    bold_runs = [r for r in p.runs if xml_run_is_bold(r._r)] or p.runs
    if bold_runs:
        bold_runs[0].text = new_label
        for r in bold_runs[1:]:
            r.text = ""
    else:
        run = p.add_run(new_label)
        run.bold = True


def set_label_value(target, new_label: str, *,
                    allow_label_edit: bool = True,
                    preserve_prefix: bool = True) -> None:
    """High-level semantic API for safely updating label text (e.g. Section 9 property qualifiers or general labels)."""
    if isinstance(target, Field):
        set_field_value(target, new_label, allow_label_edit=allow_label_edit, preserve_prefix=preserve_prefix)
    elif isinstance(target, CellView):
        if not target.label_field:
            raise MutationViolation("该单元格没有可编辑的标签字段 (label_field is None)")
        set_field_value(target.label_field, new_label, allow_label_edit=allow_label_edit, preserve_prefix=preserve_prefix)
    elif hasattr(target, "paragraphs"):
        text = "".join(r.text or "" for p in getattr(target, "paragraphs", []) for r in p.runs)
        if text.strip().startswith("9.") or re.match(r"^9\.\d+\s*", new_label):
            _write_s9_qualified_label(target, new_label)
        else:
            _write_general_label(target, new_label)
    else:
        raise TypeError(f"Unsupported target type for set_label_value: {type(target)}")


def xml_run_is_bold(run) -> bool:
    rpr = run.find(qn("w:rPr"))
    if rpr is None:
        return False
    bold = rpr.find(qn("w:b"))
    if bold is None:
        return False
    return bold.get(qn("w:val"), "true").lower() not in {"0", "false", "off", "no"}


def clear_nonbold_xml_text(row_element) -> None:
    for run in row_element.iter(qn("w:r")):
        if xml_run_is_bold(run):
            continue
        for child in list(run):
            if child.tag != qn("w:rPr"):
                run.remove(child)


def safe_delete_row(table, row_index: int, *, auto_renumber: bool = True) -> None:
    """Safely delete a row with structure protection guards and automatic continuity renumbering."""
    if row_index == 0:
        raise MutationViolation("禁止删除章节标题行（Row 0 为受保护的结构标题）")
    if len(table.rows) <= 2:
        raise MutationViolation("表格数据行数过少，禁止删除唯一的正文数据行")
    row = table.rows[row_index]
    row._tr.getparent().remove(row._tr)
    if auto_renumber:
        renumber_table(table)


def delete_row(table, row_index: int, *, auto_renumber: bool = True) -> None:
    """Delete row with backwards compatibility, enforcing safe deletion and renumbering."""
    safe_delete_row(table, row_index, auto_renumber=auto_renumber)


def safe_add_row_after(table, row_index: int, *, auto_renumber: bool = True) -> None:
    """Safely clone adjacent row structure and clear non-bold text."""
    row = table.rows[row_index]
    clone = copy.deepcopy(row._tr)
    clear_nonbold_xml_text(clone)
    row._tr.addnext(clone)
    if auto_renumber:
        renumber_table(table)


def add_row_after(table, row_index: int) -> None:
    safe_add_row_after(table, row_index, auto_renumber=True)

def safe_add_note_row_after(table, row_index: int, text: str = "说明：", *, auto_renumber: bool = True) -> None:
    """Safely insert a full-width single-column note row after row_index."""
    target_tr = table.rows[row_index]._tr
    grid_cols = len(table.columns) or 1
    total_width = 0
    tblGrid = table._tbl.tblGrid
    if tblGrid is not None:
        for col in tblGrid.gridCol_lst:
            total_width += int(col.get(qn("w:w"), 0))
    if total_width == 0:
        total_width = 9781

    tr = OxmlElement("w:tr")
    tc = OxmlElement("w:tc")
    tcPr = OxmlElement("w:tcPr")
    tcW = OxmlElement("w:tcW")
    tcW.set(qn("w:w"), str(total_width))
    tcW.set(qn("w:type"), "dxa")
    tcPr.append(tcW)

    if grid_cols > 1:
        gridSpan = OxmlElement("w:gridSpan")
        gridSpan.set(qn("w:val"), str(grid_cols))
        tcPr.append(gridSpan)

    tcBorders = OxmlElement("w:tcBorders")
    for border_name in ("top", "bottom"):
        b = OxmlElement(f"w:{border_name}")
        b.set(qn("w:val"), "dotted")
        b.set(qn("w:color"), "auto")
        b.set(qn("w:sz"), "4")
        b.set(qn("w:space"), "0")
        tcBorders.append(b)
    tcPr.append(tcBorders)
    tc.append(tcPr)

    p = OxmlElement("w:p")
    r = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.text = text
    t.set(qn("xml:space"), "preserve")
    r.append(t)
    p.append(r)
    tc.append(p)

    tr.append(tc)
    target_tr.addnext(tr)

    if auto_renumber:
        renumber_table(table)


def add_note_row_after(table, row_index: int, text: str = "说明：") -> None:
    safe_add_note_row_after(table, row_index, text=text, auto_renumber=True)


def safe_move_row(table, row_index: int, direction: str = "up", *, auto_renumber: bool = True) -> None:
    """Safely move a row up or down within the table."""
    if row_index == 0:
        raise MutationViolation("禁止移动章节标题行（Row 0 为受保护的结构标题）")
    rows = list(table.rows)
    if direction == "up":
        if row_index <= 1:
            raise MutationViolation("该行已处于第一项，无法继续上移")
        current_tr = rows[row_index]._tr
        prev_tr = rows[row_index - 1]._tr
        prev_tr.addprevious(current_tr)
    elif direction == "down":
        if row_index >= len(rows) - 1:
            raise MutationViolation("该行已处于末尾，无法继续下移")
        current_tr = rows[row_index]._tr
        next_tr = rows[row_index + 1]._tr
        next_tr.addnext(current_tr)
    else:
        raise ValueError(f"Unknown direction: {direction}")

    if auto_renumber:
        renumber_table(table)


def move_row(table, row_index: int, direction: str = "up") -> None:
    safe_move_row(table, row_index, direction=direction, auto_renumber=True)


def sequence_runs(row) -> list:
    """Find the sequence runs in the primary label cell (cell 0)."""
    cells = unique_cells(row)
    if not cells:
        return []
    target_cells = cells[:1]
    for cell in target_cells:
        runs = bold_runs(cell)
        if runs and SEQUENCE_RE.search("".join(run.text for run in runs)):
            return runs
    for cell in target_cells:
        runs = nonbold_runs(cell)
        if runs and SEQUENCE_RE.search("".join(run.text for run in runs)):
            return runs
    return []


def first_sequence_run(row):
    runs = sequence_runs(row)
    return runs[0] if runs else None


def sequence_text(row) -> str:
    runs = sequence_runs(row)
    return "".join(run.text for run in runs)


def replace_sequence(row, old: str, new: str) -> None:
    runs = sequence_runs(row)
    if not runs:
        return
    text = sequence_text(row)
    match = SEQUENCE_RE.search(text) or NUMBER_RE.search(text)
    if match and match.group(1) == old:
        replace_run_text(runs, text[:match.start(1)] + new + text[match.end(1):])


def row_prefix(row) -> str | None:
    cells = unique_cells(row)
    if not cells:
        return None
    cell_text = visible_text(cells[0])
    match = PREFIX_PATTERN.match(cell_text)
    if match:
        return match.group(0).strip()
    m_fallback = SEQUENCE_RE.match(cell_text)
    if m_fallback:
        return m_fallback.group(1)
    return None


def get_table_section_number(table) -> int | None:
    """Infer section number (1..16) from the table's Row 0 title."""
    if not getattr(table, "rows", None) or len(table.rows) == 0:
        return None
    r0_text = visible_text(table.rows[0].cells[0]).strip()
    m = re.match(r"^\s*(\d{1,2})\s*[\.、\s]", r0_text)
    return int(m.group(1)) if m else None


def replace_prefix_in_runs(paragraph, sec: int, new_item: int, *, prefix_width: int | None = None) -> bool:
    """Modify only leading numeric prefix characters across runs without touching run formatting."""
    full = "".join(r.text or "" for r in paragraph.runs)
    m = PREFIX_PATTERN.match(full)
    if not m:
        return False
    old_prefix = full[:m.end()]
    separator = m.group(4)
    if prefix_width is not None:
        separator = " " * max(1, prefix_width - len(f"{sec}.{new_item}"))
    elif not separator:
        separator = "  "
    new_prefix = f"{m.group(1)}{sec}.{new_item}{separator}"
    if new_prefix == old_prefix:
        return True
    remain = len(old_prefix)
    first = None
    for r in paragraph.runs:
        t = r.text or ""
        if remain <= 0:
            break
        if first is None and t:
            first = r
        take = min(len(t), remain)
        if take:
            r.text = t[take:]
            remain -= take
    if first is None:
        return False
    first.text = new_prefix + (first.text or "")
    return True


def renumber_table(table, section_number: int | None = None) -> list[tuple[int, str, str, str]]:
    """Renumber surviving sub-items continuously within a section.

    - Preserves Row 0 section title (never touches Row 0).
    - Maintains a continuous item counter across unnumbered intermediate rows.
    - Renumbers all item rows strictly sequentially (1..N), guaranteeing continuity.
    - Dynamically calculates prefix_width=5 in Section 9 so all colons align.
    - Ignores measurements (e.g. 0.03 mg/m3) in non-label columns.
    """
    sec = section_number or get_table_section_number(table)
    rows = list(table.rows)
    if sec is None or len(rows) <= 1:
        return []

    changes = []
    current_new_item = 0
    last_old_item = None
    seen_tcs = set()

    for r_idx in range(1, len(rows)):
        row = rows[r_idx]
        if not row.cells:
            continue
        cell = row.cells[0]
        if cell._tc in seen_tcs:
            continue
        seen_tcs.add(cell._tc)
        text = visible_text(cell)
        m = PREFIX_PATTERN.match(text)
        if not m:
            continue
        row_sec = int(m.group(2))
        if row_sec != sec:
            continue
        old_item = int(m.group(3))
        rest = text[m.end():].strip()
        if not rest or rest[0] in "-+<>=~" or rest[0].isdigit():
            continue

        current_new_item += 1
        new_item = current_new_item
        last_old_item = old_item

        p = cell.paragraphs[0]
        if sec == 9:
            ok = replace_prefix_in_runs(p, sec, new_item, prefix_width=5)
        else:
            ok = replace_prefix_in_runs(p, sec, new_item)

        if ok and old_item != new_item:
            changes.append((r_idx, f"{sec}.{old_item}", f"{sec}.{new_item}", rest[:30]))

    return changes


def renumber_document(document) -> list[tuple[int, int, str, str, str]]:
    """Renumber all 16 tables in the MSDS document, guaranteeing continuity."""
    all_changes = []
    for t_idx, table in enumerate(document.tables):
        sec = t_idx + 1
        table_changes = renumber_table(table, sec)
        for r_idx, old_p, new_p, txt in table_changes:
            all_changes.append((t_idx, r_idx, old_p, new_p, txt))
    return all_changes


def write_cell_value(cell_or_field, text: str, *, allow_label_edit: bool = False) -> None:
    """Unified write-time entrypoint enforcing non-bold text, clean whitespace, and structure protection."""
    if isinstance(cell_or_field, Field):
        set_field_value(cell_or_field, text, allow_label_edit=allow_label_edit)
    elif isinstance(cell_or_field, CellView):
        if cell_or_field.value_field:
            set_field_value(cell_or_field, text, allow_label_edit=allow_label_edit)
        elif cell_or_field.label_field and not allow_label_edit:
            raise MutationViolation(
                "该单元格为标签单元格，修改标签已被锁定保护。若需修改请传入 allow_label_edit=True 或调用 set_label_value()。"
            )
        else:
            clean_v = normalize_value_text(text)
            paragraphs = getattr(cell_or_field.cell, "paragraphs", None)
            if paragraphs:
                if paragraphs[0].runs:
                    paragraphs[0].runs[0].text = clean_v
                else:
                    paragraphs[0].add_run(clean_v)
            else:
                raise MutationViolation("该单元格无段落结构")
    elif hasattr(cell_or_field, "paragraphs"):
        b_runs = bold_runs(cell_or_field)
        v_runs = nonbold_runs(cell_or_field)
        clean_v = normalize_value_text(text)
        if v_runs:
            replace_run_text(v_runs, clean_v)
        elif b_runs and not allow_label_edit:
            raise MutationViolation(
                "该单元格包含加粗标签运行区，修改标签已被锁定保护。若需修改请传入 allow_label_edit=True 或调用 set_label_value()。"
            )
        else:
            paragraphs = getattr(cell_or_field, "paragraphs", None)
            if paragraphs:
                if paragraphs[0].runs:
                    paragraphs[0].runs[0].text = clean_v
                else:
                    paragraphs[0].add_run(clean_v)
            else:
                raise MutationViolation("该单元格无段落结构")
    else:
        raise TypeError(f"Unsupported target: {type(cell_or_field)}")


def write_section9_property(table, prop_key_or_row_idx: str | int, value: str, *,
                            new_label: str | None = None, allow_label_edit: bool = True) -> None:
    """High-level Section 9 property writer adhering to all Section 9 write-time constraints."""
    if isinstance(prop_key_or_row_idx, int):
        target_row = table.rows[prop_key_or_row_idx]
    else:
        key_clean = str(prop_key_or_row_idx).strip().lower()
        target_row = None
        for r in table.rows[1:]:
            if key_clean in visible_text(r.cells[0]).lower():
                target_row = r
                break
        if target_row is None:
            raise KeyError(f"未能在 Section 9 表格中定位到属性: {prop_key_or_row_idx}")

    value_cell = target_row.cells[-1]
    val_runs = nonbold_runs(value_cell)
    if val_runs:
        replace_run_text(val_runs, normalize_value_text(value))
    else:
        target_row.cells[-1].paragraphs[0].runs[0].text = normalize_value_text(value)

    if new_label and allow_label_edit:
        _write_s9_qualified_label(target_row.cells[0], new_label)


def audit_document(document) -> list[str]:
    """Audit the document against all MSDS template mutation whitelist constraints."""
    errors = []
    for t_idx, table in enumerate(document.tables):
        sec = t_idx + 1
        expected = 1
        last_item = None
        for r_idx, row in enumerate(table.rows[1:], 1):
            m = PREFIX_PATTERN.match(visible_text(row.cells[0]))
            if m and int(m.group(2)) == sec:
                item = int(m.group(3))
                if item == last_item:
                    continue
                if sec in {11, 12}:
                    last_item = item
                    continue
                if item != expected:
                    errors.append(f"Section {sec} 序号断号: expected {sec}.{expected}, found {sec}.{item}")
                expected += 1
                last_item = item
    return errors


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def create_work_copy(source: Path, work_dir: Path) -> Path:
    work_dir.mkdir(parents=True, exist_ok=True)
    target = work_dir / source.name
    shutil.copy2(source, target)
    return target


def clean_python_environment() -> dict[str, str]:
    env = os.environ.copy()
    for key in ("PYTHONHOME", "PYTHONPATH"):
        env.pop(key, None)
    return env


def is_row_editable(row) -> bool:
    return bool(row_fields(0, 0, row))




def _update_paragraph_runs(p, new_text: str):
    """Safely updates a paragraph's text while preserving the first run's formatting."""
    if not p.runs:
        p.add_run(new_text)
        return
    p.runs[0].text = new_text
    for r in p.runs[1:]:
        r.text = ""

def extract_header_footer_info(document) -> dict:
    """Extract header and footer metadata from python-docx Document."""
    info = {
        "title": "物料安全数据表",
        "version": "V1.0",
        "model": "",
        "company": "广州冠志新材料科技有限公司",
        "doc_code": "",
        "revision_date": "",
        "language": "CN",
        "entity": "冠志",
    }
    if document is None or not getattr(document, "sections", None):
        return info

    sec = document.sections[0]
    hdr = sec.header
    ftr = sec.footer

    for p in hdr.paragraphs:
        txt = re.sub(r'\\s+', ' ', p.text or '').strip()
        if not txt:
            continue
        if re.search(r"MATERIAL SAFETY DATA SHEET", txt, re.I):
            info["title"] = "MATERIAL SAFETY DATA SHEET"
            info["language"] = "EN"
        elif re.search(r"物料安全数据表", txt):
            info["title"] = "物料安全数据表"
            info["language"] = "CN"

        v_match = re.search(r"Version[:：]\\s*(V[0-9.]+)", txt, re.I)
        if v_match:
            info["version"] = v_match.group(1)

    if hdr.tables and len(hdr.tables) > 0 and hdr.tables[0].rows:
        cell_txt = re.sub(r'\\s+', ' ', hdr.tables[0].rows[0].cells[0].text or '').strip()
        if cell_txt:
            info["model"] = cell_txt

    if ftr.tables and len(ftr.tables) > 0 and ftr.tables[0].rows:
        row0 = ftr.tables[0].rows[0]
        if len(row0.cells) > 0:
            c0_txt = re.sub(r'\\s+', ' ', row0.cells[0].text or '').strip()
            code_m = re.search(r"([A-Za-z0-9_-]+-MSDS)", c0_txt, re.I)
            if code_m:
                info["doc_code"] = code_m.group(1)
                comp_part = c0_txt.replace(code_m.group(1), "").strip()
                if comp_part:
                    info["company"] = comp_part
            elif c0_txt:
                parts = c0_txt.split()
                if len(parts) >= 2:
                    info["company"] = parts[0]
                    info["doc_code"] = parts[1]
                else:
                    info["company"] = c0_txt

            if "国彩" in c0_txt or "GUOCAI" in c0_txt.upper():
                info["entity"] = "国彩"
            elif "冠志" in c0_txt or "GUANZHI" in c0_txt.upper():
                info["entity"] = "冠志"

        if len(row0.cells) > 1:
            c1_txt = re.sub(r'\\s+', ' ', row0.cells[1].text or '').strip()
            date_m = re.search(r"(\\d{4}[年/-]\\d{1,2}[月/-]\\d{1,2}日?)", c1_txt)
            if date_m:
                info["revision_date"] = date_m.group(1)
            else:
                info["revision_date"] = c1_txt.replace("P修订日期：", "").replace("修订日期：", "").strip()

    return info

def update_header_footer_info(document, patch: dict) -> dict:
    """Update header and footer metadata in python-docx Document safely."""
    if document is None or not getattr(document, "sections", None):
        return {}

    sec = document.sections[0]
    hdr = sec.header
    ftr = sec.footer

    # 1. Header Title & Version in paragraphs
    for p in hdr.paragraphs:
        txt = p.text.strip()
        if not txt:
            continue
        if ("物料安全数据表" in txt or "MATERIAL SAFETY" in txt) and "title" in patch:
            _update_paragraph_runs(p, patch["title"])
        elif "Version" in txt and "version" in patch:
            ver = patch["version"]
            if not ver.upper().startswith("V"):
                ver = f"V{ver}"
            _update_paragraph_runs(p, f"Version：{ver}")

    # 2. Header Model in Table 0 Row 0 Cell 0
    if "model" in patch and hdr.tables and len(hdr.tables) > 0 and hdr.tables[0].rows:
        c0 = hdr.tables[0].rows[0].cells[0]
        if c0.paragraphs:
            _update_paragraph_runs(c0.paragraphs[0], patch["model"])
        else:
            c0.text = patch["model"]

    # 3. Footer Table 0
    if ftr.tables and len(ftr.tables) > 0 and ftr.tables[0].rows:
        row0 = ftr.tables[0].rows[0]
        if len(row0.cells) > 0 and ("company" in patch or "model" in patch):
            current_info = extract_header_footer_info(document)
            company = patch.get("company", current_info.get("company", "广州冠志新材料科技有限公司"))
            model = patch.get("model", current_info.get("model", "MSDS"))
            new_c0_text = f"{company} {model}-MSDS".strip()
            c0 = row0.cells[0]
            if c0.paragraphs:
                _update_paragraph_runs(c0.paragraphs[0], new_c0_text)
            else:
                c0.text = new_c0_text

        if len(row0.cells) > 1 and "revision_date" in patch:
            rev_date = patch["revision_date"].strip()
            if rev_date.startswith("P"):
                rev_date = rev_date[1:].strip()
            if not rev_date.startswith("修订日期") and not rev_date.lower().startswith("revision"):
                prefix = "Revision Date: " if patch.get("language") == "EN" else "修订日期："
                new_c1_text = f"{prefix}{rev_date}"
            else:
                new_c1_text = rev_date
            c1 = row0.cells[1]
            if c1.paragraphs:
                _update_paragraph_runs(c1.paragraphs[0], new_c1_text)
            else:
                c1.text = new_c1_text

    return extract_header_footer_info(document)

def extract_product_model_from_doc(document) -> str:
    """Extract product code/model from header or Section 1 table of document."""
    if document is None:
        return ""
    # Try header table first
    try:
        hf = extract_header_footer_info(document)
        if hf.get("model") and hf["model"] != "PEA-4139":
            return hf["model"]
    except Exception:
        pass
    if not getattr(document, "tables", None):
        return ""
    tbl1 = document.tables[0]
    for row in tbl1.rows:
        row_txt = [c.text.strip() for c in row.cells]
        if len(row_txt) >= 2:
            lbl, val = row_txt[0], row_txt[1]
            if any(ph in val for ph in ["此处填写", "待填", "待确定", "待完善", "N/A"]):
                continue
            if re.search(r"产品名称|Product name|Trade name|品名|型号", lbl, re.I):
                m = re.search(r"([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+)", val)
                if m:
                    return m.group(1)
                if len(val) <= 30 and val:
                    return val
            if re.search(r"中文名称|Name of substance", lbl, re.I):
                m = re.search(r"([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+)", val)
                if m:
                    return m.group(1)
    return ""

def extract_model_from_text(text: str) -> str:
    """Extract model code from file stem or arbitrary string."""
    if not text:
        return ""
    clean = Path(text).stem
    stripped = re.sub(
        r"(?:正式模板|模板|msds|tds|CN|EN|冠志|国彩|Guocai|Guanzhi|原件|编辑后|source|converted|test_export|current_matching|\(\d+\))",
        " ",
        clean,
        flags=re.I
    ).strip(" _-\t\r\n")
    m = re.search(r"([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+)", stripped)
    if m:
        return m.group(1)
    parts = stripped.split()
    if parts and len(parts[0]) <= 25 and not re.match(r"^[_-]+$", parts[0]):
        return parts[0]
    return ""

def build_export_docx_name(document=None, source_path=None, template_name: str = "") -> str:
    """Build standardized export DOCX filename: {ProductModel} msds_{CN|EN} {Entity}.docx"""
    src_name = source_path.name if isinstance(source_path, Path) else (str(source_path or ""))
    # 1. Language
    lang = "CN"
    if re.search(r"EN|English", template_name, re.I) or re.search(r"_EN_|_EN\b", src_name, re.I):
        lang = "EN"
    elif document and getattr(document, "tables", None) and document.tables[0].rows:
        sec1_txt = " ".join(c.text for c in document.tables[0].rows[0].cells)
        if "Identification" in sec1_txt:
            lang = "EN"

    # 2. Entity
    entity = "Guanzhi" if (lang == "EN" and "Guanzhi" in template_name) else "冠志"
    if "国彩" in template_name or "Guocai" in template_name or "国彩" in src_name or "Guocai" in src_name:
        entity = "Guocai" if lang == "EN" else "国彩"
    elif document and getattr(document, "tables", None):
        all_text = " ".join(c.text for r in document.tables[0].rows for c in r.cells)
        if "国彩" in all_text:
            entity = "Guocai" if lang == "EN" else "国彩"
        elif "GUOCAI" in all_text:
            entity = "Guocai"

    # 3. Model
    model = ""
    if document:
        model = extract_product_model_from_doc(document)
        if not model:
            hf = extract_header_footer_info(document)
            if hf.get("model") and hf["model"] != "PEA-4139":
                model = hf["model"]
    if not model and src_name:
        model = extract_model_from_text(src_name)
    if model:
        model = model.strip(" _-")
    if not model or model == "_":
        model = "MSDS"

    return f"{model} msds_{lang} {entity}.docx"

class EditorApp:
    def __init__(self, root: tk.Tk, template: Path | None = None):
        self.root = root
        self.root.title("冠志 MSDS 模板快速编辑器")
        self.root.geometry("1200x780")
        self.root.minsize(900, 620)
        self.document = None
        self.source_path: Path | None = None
        self.work_path: Path | None = None
        self.work_dir = Path(tempfile.mkdtemp(prefix="msds-editor-"))
        self.source_hash = ""
        self.dirty = False
        self.current_table = 0
        self.selected_nav_idx = 0
        self.custom_file_name = ""
        self._hf_entries = {}
        self._text_widgets: list[tuple[tk.Text, Field]] = []
        self.allow_label_edit = tk.BooleanVar(value=False)
        self._build_ui()
        if template and template.exists():
            self.load_document(template)
        else:
            self._show_empty("请选择一个 DOCX 模板开始编辑")

    def _build_ui(self):
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        toolbar = ttk.Frame(self.root, padding=(12, 10))
        toolbar.pack(fill="x")
        ttk.Label(toolbar, text="常用模板：").pack(side="left")
        self.template_choice = ttk.Combobox(toolbar, state="readonly", width=14,
                                            values=[*TEMPLATE_LIBRARY, "外部模板"])
        self.template_choice.set("CN 冠志")
        self.template_choice.pack(side="left", padx=(6, 4))
        ttk.Button(toolbar, text="载入", command=self.load_builtin_template).pack(side="left")
        ttk.Button(toolbar, text="打开模板...", command=self.open_dialog).pack(side="left")
        ttk.Button(toolbar, text="导出编辑后 DOCX", command=self.export).pack(side="left", padx=(8, 0))
        ttk.Button(toolbar, text="↺ 恢复整份模板", command=self.reset_entire_template).pack(side="left", padx=(8, 0))
        ttk.Checkbutton(toolbar, text="特殊情况：允许修改标签文本 (常用于 Section 9 理化特性)",
                        variable=self.allow_label_edit,
                        command=self._toggle_label_edit).pack(side="left", padx=(12, 0))
        self.status = ttk.Label(toolbar, text="未载入模板", foreground="#52606d")
        self.status.pack(side="left", padx=18)
        self.dirty_label = ttk.Label(toolbar, text="", foreground="#b54708")
        self.dirty_label.pack(side="right")

        body = ttk.PanedWindow(self.root, orient="horizontal")
        body.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        left = ttk.Frame(body, padding=(0, 0, 10, 0))
        right = ttk.Frame(body)
        body.add(left, weight=1)
        body.add(right, weight=4)

        ttk.Label(left, text="模板章节", font=("Microsoft YaHei UI", 11, "bold")).pack(anchor="w", pady=(0, 8))
        self.section_list = tk.Listbox(left, activestyle="none", exportselection=False, borderwidth=0,
                                       highlightthickness=1, highlightcolor="#2e90fa")
        self.section_list.pack(fill="both", expand=True)
        self.section_list.bind("<<ListboxSelect>>", self._select_section)
        self.help_label = ttk.Label(left, text="序号：始终只读\n标签/子标签：默认只读（可勾选顶部开关解锁，如Section 9）\n值：未加粗文本可编辑\n说明行：未加粗单行值\n\n新增/删除行会自动连续重排序号。",
                                    justify="left", foreground="#667085", wraplength=210)
        self.help_label.pack(fill="x", pady=(12, 0))

        self.canvas = tk.Canvas(right, highlightthickness=0, background="#f8fafc")
        scrollbar = ttk.Scrollbar(right, orient="vertical", command=self.canvas.yview)
        hscrollbar = ttk.Scrollbar(right, orient="horizontal", command=self.canvas.xview)
        self.canvas.configure(yscrollcommand=scrollbar.set, xscrollcommand=hscrollbar.set)
        scrollbar.pack(side="right", fill="y")
        hscrollbar.pack(side="bottom", fill="x")
        self.canvas.pack(side="left", fill="both", expand=True)
        self.form = ttk.Frame(self.canvas, padding=12)
        self.canvas_window = self.canvas.create_window((0, 0), window=self.form, anchor="nw")
        self.form.bind("<Configure>", lambda _: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", self._resize_canvas_content)
        self.canvas.bind_all("<MouseWheel>", self._mousewheel)

    def _resize_canvas_content(self, event):
        self.canvas.itemconfigure(self.canvas_window, width=max(event.width, self.form.winfo_reqwidth()))

    def _mousewheel(self, event):
        if self.document:
            self.canvas.yview_scroll(int(-event.delta / 120), "units")

    def _show_empty(self, text):
        for widget in self.form.winfo_children():
            widget.destroy()
        ttk.Label(self.form, text=text, font=("Microsoft YaHei UI", 14), foreground="#475467").pack(pady=90)

    def _set_dirty(self, dirty=True):
        self.dirty = dirty
        self.dirty_label.configure(text="● 有未保存修改" if dirty else "")
        if self.source_path:
            suffix = "（编辑中）" if self.work_path else ""
            self.status.configure(text=f"已载入：{self.source_path.name}{suffix}")

    def confirm_discard(self) -> bool:
        if not self.dirty:
            return True
        return messagebox.askyesno("未保存修改", "当前有未保存修改，确认放弃并继续？", parent=self.root)

    def open_dialog(self):
        if not self.confirm_discard():
            return
        path = filedialog.askopenfilename(title="选择 DOCX 模板", filetypes=[("Word 文档", "*.docx"), ("所有文件", "*.*")])
        if path:
            self.load_document(Path(path))

    def load_builtin_template(self):
        if not self.confirm_discard():
            return
        if self.template_choice.get() not in TEMPLATE_LIBRARY:
            return
        path = TEMPLATE_LIBRARY[self.template_choice.get()]
        self.load_document(path)

    def load_document(self, path: Path):
        path = path.resolve()
        if not path.is_file():
            messagebox.showerror("模板不存在", f"找不到 DOCX 模板：\n{path}", parent=self.root)
            return
        try:
            work_path = create_work_copy(path, self.work_dir)
            document = Document(str(work_path))
        except Exception as exc:
            messagebox.showerror("模板无法读取", f"无法读取 DOCX：\n{exc}", parent=self.root)
            return
        self.document = document
        self.source_path = path
        self.work_path = work_path
        self.source_hash = file_sha256(path)
        for name, candidate in TEMPLATE_LIBRARY.items():
            if candidate.resolve() == path:
                self.template_choice.set(name)
                break
        else:
            self.template_choice.set("外部模板")
        self._set_dirty(False)
        self.allow_label_edit.set(False)
        self.current_table = 0
        self.selected_nav_idx = 0
        self.custom_file_name = ""
        self._refresh_sections()

    def _toggle_label_edit(self):
        self._sync_texts()
        if self.allow_label_edit.get():
            confirmed = messagebox.askyesno(
                "修改标签模式确认",
                "此开关用于修改特殊标签文本（如 Section 9 的理化特性参数、特定测定条件等）。\n\n"
                "系统会自动保留序号前缀（如 9.n  ）以及所有字体、加粗、单元格与页面格式。\n\n"
                "确认开启标签修改模式？",
                parent=self.root,
            )
            if not confirmed:
                self.allow_label_edit.set(False)
                return
        self._render_current_section()

    def _refresh_sections(self):
        self.section_list.delete(0, tk.END)
        if self.document is None:
            self._show_empty("请选择一个 DOCX 模板开始编辑")
            return
        hf = extract_header_footer_info(self.document)
        model_badge = f"[{hf['model']}]" if hf.get("model") else "[待配置]"
        self.section_list.insert(tk.END, f"第 00 节   页眉与页脚 (Header & Footer)   {model_badge}")
        for index, table in enumerate(self.document.tables, 1):
            fields = sum(
                sum(bool(view.label_field) + bool(view.value_field)
                    for view in cell_views(index - 1, ri, row))
                for ri, row in enumerate(table.rows)
            )
            self.section_list.insert(tk.END, f"第 {index:02d} 节   {len(table.rows)} 行   {fields} 字段")
        body_count = len(paragraph_fields(self.document))
        if body_count:
            self.section_list.insert(tk.END, f"正文段落   {body_count} 处值")
        if self.section_list.size():
            self.section_list.selection_set(min(self.selected_nav_idx, self.section_list.size() - 1))
            self.section_list.event_generate("<<ListboxSelect>>")

    def _select_section(self, _event=None):
        selection = self.section_list.curselection()
        if not selection or self.document is None:
            return
        self.selected_nav_idx = selection[0]
        if self.selected_nav_idx == 0:
            self._render_header_footer()
            return
        self.current_table = self.selected_nav_idx - 1
        self._render_current_section()

    def _sync_header_footer(self):
        if not hasattr(self, "_hf_entries") or not self._hf_entries or self.document is None:
            return
        title = self._hf_entries.get("title").get().strip() if "title" in self._hf_entries else ""
        model = self._hf_entries.get("model").get().strip() if "model" in self._hf_entries else ""
        version = self._hf_entries.get("version").get().strip() if "version" in self._hf_entries else ""
        company = self._hf_entries.get("company").get().strip() if "company" in self._hf_entries else ""
        revision_date = self._hf_entries.get("revision_date").get().strip() if "revision_date" in self._hf_entries else ""
        export_name = self._hf_entries.get("export_name").get().strip() if "export_name" in self._hf_entries else ""

        patch = {}
        if title: patch["title"] = title
        if model: patch["model"] = model
        if version: patch["version"] = version
        if company: patch["company"] = company
        if revision_date: patch["revision_date"] = revision_date

        if patch:
            update_header_footer_info(self.document, patch)
        if export_name:
            self.custom_file_name = export_name

    def _render_header_footer(self):
        for widget in self.form.winfo_children():
            widget.destroy()
        self._text_widgets.clear()
        self._hf_entries.clear()
        if self.document is None:
            return

        hf = extract_header_footer_info(self.document)
        current_export = self.custom_file_name or build_export_docx_name(self.document, self.source_path, self.template_choice.get())

        # Header bar
        sec_header = ttk.Frame(self.form)
        sec_header.pack(fill="x", pady=(0, 6))
        ttk.Label(sec_header, text="第 00 节  ·  全局文档标识与页眉页脚管理",
                  font=("Microsoft YaHei UI", 12, "bold"), foreground="#0f172a").pack(side="left")
        ttk.Button(sec_header, text="↺ 恢复模板初始页眉页脚", command=self._reset_header_footer_to_template).pack(side="right")

        desc = ttk.Label(self.form, text="统一配置产品型号、版本号、公司主体与修订日期，系统自动安全同步至 DOCX 物理页眉页脚并规范导出文件名。",
                         foreground="#64748b", wraplength=760, justify="left")
        desc.pack(anchor="w", pady=(0, 10))

        # Main Cards Frame
        cards_frame = ttk.Frame(self.form)
        cards_frame.pack(fill="x", expand=True)

        # Card 1: Header
        c1 = ttk.LabelFrame(cards_frame, text=" 页眉配置 (Header - word/header1.xml) ", padding=(12, 10))
        c1.pack(fill="x", pady=(0, 10))

        row1 = ttk.Frame(c1)
        row1.pack(fill="x", pady=3)
        ttk.Label(row1, text="文档主标题：", width=14).pack(side="left")
        title_var = tk.StringVar(value=hf.get("title", "物料安全数据表"))
        title_ent = ttk.Entry(row1, textvariable=title_var, width=45)
        title_ent.pack(side="left", padx=4)
        self._hf_entries["title"] = title_var

        row2 = ttk.Frame(c1)
        row2.pack(fill="x", pady=3)
        ttk.Label(row2, text="产品型号 *：", width=14).pack(side="left")
        model_var = tk.StringVar(value=hf.get("model", ""))
        model_ent = ttk.Entry(row2, textvariable=model_var, width=25, font=("Microsoft YaHei UI", 9, "bold"))
        model_ent.pack(side="left", padx=4)
        self._hf_entries["model"] = model_var
        ttk.Label(row2, text="版本号：", width=10).pack(side="left", padx=(16, 0))
        ver_var = tk.StringVar(value=hf.get("version", "V1.0"))
        ver_ent = ttk.Entry(row2, textvariable=ver_var, width=15)
        ver_ent.pack(side="left", padx=4)
        self._hf_entries["version"] = ver_var
        ttk.Label(row2, text="(如 V1.0)", foreground="#94a3b8").pack(side="left", padx=4)

        # Card 2: Footer
        c2 = ttk.LabelFrame(cards_frame, text=" 页脚与发布信息 (Footer - word/footer1.xml) ", padding=(12, 10))
        c2.pack(fill="x", pady=(0, 10))

        row3 = ttk.Frame(c2)
        row3.pack(fill="x", pady=3)
        ttk.Label(row3, text="发布主体公司：", width=14).pack(side="left")
        comp_var = tk.StringVar(value=hf.get("company", "广州冠志新材料科技有限公司"))
        comp_ent = ttk.Entry(row3, textvariable=comp_var, width=38)
        comp_ent.pack(side="left", padx=4)
        self._hf_entries["company"] = comp_var

        ttk.Label(row3, text="MSDS 编号：", width=11).pack(side="left", padx=(16, 0))
        doc_code_lbl = ttk.Label(row3, text=f"{hf.get('model', '...')}-MSDS", foreground="#0284c7", font=("Consolas", 9, "bold"))
        doc_code_lbl.pack(side="left", padx=4)

        row4 = ttk.Frame(c2)
        row4.pack(fill="x", pady=3)
        ttk.Label(row4, text="修订日期：", width=14).pack(side="left")
        rev_var = tk.StringVar(value=hf.get("revision_date", ""))
        rev_ent = ttk.Entry(row4, textvariable=rev_var, width=20)
        rev_ent.pack(side="left", padx=4)
        self._hf_entries["revision_date"] = rev_var

        def _set_today():
            from datetime import date
            today_str = date.today().strftime("%Y年%m月%d日")
            rev_var.set(today_str)
            self._apply_hf_patch()

        ttk.Button(row4, text="📅 设为今日", command=_set_today).pack(side="left", padx=6)
        ttk.Label(row4, text="原生页码域：", width=12).pack(side="left", padx=(16, 0))
        ttk.Label(row4, text="3 / 5  (PAGE / NUMPAGES 字段码保护锁定)", foreground="#16a34a").pack(side="left", padx=4)

        # Card 3: Export file naming
        c3 = ttk.LabelFrame(cards_frame, text=" 导出文件名管理 (File Naming) ", padding=(12, 10))
        c3.pack(fill="x", pady=(0, 10))

        row5 = ttk.Frame(c3)
        row5.pack(fill="x", pady=3)
        ttk.Label(row5, text="导出文件名：", width=14).pack(side="left")
        name_var = tk.StringVar(value=current_export)
        name_ent = ttk.Entry(row5, textvariable=name_var, width=45)
        name_ent.pack(side="left", padx=4)
        self._hf_entries["export_name"] = name_var

        def _reset_std_name():
            self.custom_file_name = ""
            std = build_export_docx_name(self.document, self.source_path, self.template_choice.get())
            name_var.set(std)

        ttk.Button(row5, text="↺ 恢复标准命名", command=_reset_std_name).pack(side="left", padx=6)

        # Bottom actions
        act_row = ttk.Frame(self.form)
        act_row.pack(fill="x", pady=10)
        save_btn = ttk.Button(act_row, text="💾 保存并应用页眉页脚修改", command=self._apply_hf_patch)
        save_btn.pack(side="left")

        # Bind auto-update
        def _on_hf_change(*_args):
            m = model_var.get().strip()
            if m:
                doc_code_lbl.configure(text=f"{m}-MSDS")
                if not self.custom_file_name:
                    name_var.set(build_export_docx_name(self.document, self.source_path, self.template_choice.get()))

        model_var.trace_add("write", _on_hf_change)
        title_var.trace_add("write", lambda *_: self._set_dirty(True))
        ver_var.trace_add("write", lambda *_: self._set_dirty(True))
        comp_var.trace_add("write", lambda *_: self._set_dirty(True))
        rev_var.trace_add("write", lambda *_: self._set_dirty(True))
        name_var.trace_add("write", lambda *_: self._set_dirty(True))

    def _apply_hf_patch(self):
        self._sync_header_footer()
        self._set_dirty(True)
        messagebox.showinfo("页眉页脚已更新", "页眉、页脚及文件名配置已更新并应用至模板。", parent=self.root)
        self._refresh_sections()

    def _reset_header_footer_to_template(self):
        if not messagebox.askyesno("恢复确认", "确认恢复模板原始页眉页脚（PEA-4139、冠志、V1.0）？", parent=self.root):
            return
        update_header_footer_info(self.document, {
            "model": "PEA-4139",
            "company": "广州冠志新材料科技有限公司",
            "version": "V1.0",
            "title": "物料安全数据表",
            "revision_date": "2026年08月05日",
        })
        self.custom_file_name = ""
        self._set_dirty(True)
        self._refresh_sections()

    def _render_current_section(self):
        for widget in self.form.winfo_children():
            widget.destroy()
        self._text_widgets.clear()
        if self.document is None:
            return
        if self.current_table >= len(self.document.tables):
            self._render_body()
            return
        table = self.document.tables[self.current_table]
        title = row_label(table.rows[0], unique_cells(table.rows[0])) if table.rows else ""
        sec_header = ttk.Frame(self.form)
        sec_header.pack(fill="x", pady=(0, 4))
        ttk.Label(sec_header, text=f"Section {self.current_table + 1}  ·  {title}",
                  font=("Microsoft YaHei UI", 12, "bold"), foreground="#344054").pack(side="left")
        ttk.Button(sec_header, text="↺ 恢复本节至模板状态", command=self.reset_current_section).pack(side="right")
        label_mode = "标签编辑模式：已开启（支持修改Section 9等特殊标签，序号与格式依然锁定）" if self.allow_label_edit.get() else "标签锁定只读（仅编辑常规值；特殊标签修改请勾选顶部开关）"
        ttk.Label(self.form, text=label_mode, foreground="#026aa2" if self.allow_label_edit.get() else "#667085").pack(anchor="w", pady=(0, 8))
        grid = tk.Frame(self.form, background="#98a2b3")
        grid.pack(fill="x", expand=True)
        column_count = max(1, len(table.columns))
        grid.columnconfigure(0, weight=0)
        for column in range(column_count):
            width = 120
            try:
                if table.columns[column].width:
                    width = max(72, min(360, int(table.columns[column].width.inches * 96)))
            except (AttributeError, TypeError, ValueError):
                pass
            grid.columnconfigure(column + 1, weight=1, minsize=width)
        for row_index, row in enumerate(table.rows):
            self._render_table_row(grid, table, row_index, row, column_count)

    def _render_body(self):
        fields = paragraph_fields(self.document)
        for field in fields:
            if field.role == "label":
                if self.allow_label_edit.get():
                    self._render_field(self.form, field, bold=True)
                else:
                    self._render_readonly_field(self.form, field)
            else:
                self._render_field(self.form, field)

    def _render_table_row(self, grid, table, row_index, row, column_count):
        header = row_index == 0
        note = bool(row_cells_with_spans(row)) and all(view.kind == "note" for view in cell_views(self.current_table, row_index, row))
        row_background = "#eaf2ff" if header else ("#fffbeb" if note else "#ffffff")
        action = tk.Frame(grid, background="#f8fafc", width=88)
        action.grid(row=row_index, column=0, sticky="nsew", padx=(0, 1), pady=(0, 1))
        sequence = row_prefix(row)
        ttk.Label(action, text=f"行 {row_index + 1}", foreground="#667085").pack(pady=(4, 0))
        if sequence:
            ttk.Label(action, text=f"序 {sequence}", foreground="#98a2b3", font=("Microsoft YaHei UI", 8)).pack()
        if row_index > 0:
            btn_frame = tk.Frame(action, background="#f8fafc")
            btn_frame.pack(pady=1)
            up_btn = ttk.Button(btn_frame, text="↑", command=lambda i=row_index: self.move_row_up(i), width=2)
            if row_index <= 1:
                up_btn.state(["disabled"])
            up_btn.pack(side="left", padx=1)
            down_btn = ttk.Button(btn_frame, text="↓", command=lambda i=row_index: self.move_row_down(i), width=2)
            if row_index >= len(table.rows) - 1:
                down_btn.state(["disabled"])
            down_btn.pack(side="left", padx=1)
        ttk.Button(action, text="增行", command=lambda i=row_index: self.add_row(i), width=6).pack(pady=1)
        if row_index > 0:
            ttk.Button(action, text="+注", command=lambda i=row_index: self.add_note_row(i), width=6).pack(pady=1)
        if row_index > 0 and is_row_editable(row):
            ttk.Button(action, text="删除", command=lambda i=row_index: self.remove_row(i), width=6).pack(pady=1)
        views = cell_views(self.current_table, row_index, row)
        covered = set()
        for view in views:
            for column in range(view.start_column, view.start_column + view.span):
                covered.add(column)
            cell_frame = tk.Frame(grid, background=row_background, relief="solid", borderwidth=1)
            cell_frame.grid(row=row_index, column=view.start_column + 1, columnspan=view.span,
                            sticky="nsew", padx=(0, 1), pady=(0, 1))
            role_title = None
            if len(views) == 3:
                role_title = {0: "标签", 1: "子标签", 2: "值"}.get(view.start_column)
            self._render_cell(cell_frame, view, role_title, row_background)
        for column in range(column_count):
            if column not in covered:
                tk.Frame(grid, background=row_background, relief="solid", borderwidth=1).grid(
                    row=row_index, column=column + 1, sticky="nsew", padx=(0, 1), pady=(0, 1)
                )

    def _render_cell(self, parent, view: CellView, role_title: str | None = None, background: str = "#ffffff"):
        if view.kind == "note":
            ttk.Label(parent, text="说明行", foreground="#b54708", font=("Microsoft YaHei UI", 8)).pack(anchor="e", padx=5, pady=(3, 0))
        if view.label_field:
            if self.allow_label_edit.get():
                self._render_field(parent, view.label_field, bold=True, compact=True, background=background)
            else:
                self._render_readonly_field(parent, view.label_field, bold=True, compact=True, background=background)
        if view.value_field:
            self._render_field(parent, view.value_field, bold=False, compact=True, background=background)

    def _render_readonly_field(self, parent, field: Field, bold: bool = True,
                               compact: bool = False, background: str = "#ffffff"):
        font = ("Microsoft YaHei UI", 10, "bold") if bold else ("Microsoft YaHei UI", 10)
        label = tk.Label(parent, text=field.value, font=font, background=background,
                         foreground="#182230", anchor="w", justify="left", wraplength=720)
        label.pack(fill="x", padx=5 if compact else 0, pady=2 if compact else 4)

    def _render_field(self, parent, field: Field, bold: bool = False, compact: bool = False,
                      background: str = "#ffffff"):
        line = tk.Frame(parent, background=background)
        line.pack(fill="x", padx=5 if compact else 0, pady=2 if compact else 4)
        if not compact:
            ttk.Label(line, text=field.label or "值", width=26, anchor="w").pack(side="left", anchor="n")
        font = ("Microsoft YaHei UI", 10, "bold") if bold else ("Microsoft YaHei UI", 10)
        if "\n" in field.value or len(field.value) > 75:
            text = tk.Text(line, height=min(5, max(2, field.value.count("\n") + 1)), wrap="word", undo=True,
                           font=font, relief="flat", borderwidth=0, highlightthickness=0,
                           background=background)
            text.insert("1.0", field.value)
            text.pack(side="left", fill="x", expand=True)
            text.bind("<KeyRelease>", lambda _e, w=text, f=field: self._text_changed(w, f))
            text.bind("<FocusOut>", lambda _e, w=text, f=field: self._text_changed(w, f))
            self._text_widgets.append((text, field))
        else:
            value = tk.StringVar(value=field.value)
            entry = tk.Entry(line, textvariable=value, font=font, relief="flat", borderwidth=0,
                             highlightthickness=0, background=background)
            entry.pack(side="left", fill="x", expand=True)
            value.trace_add("write", lambda *_args, v=value, f=field: self._value_changed(v.get(), f))

    def _value_changed(self, value, field):
        if self.document is not None and value != field.value:
            try:
                set_field_value(field, value, allow_label_edit=self.allow_label_edit.get())
                self._set_dirty()
            except Exception as exc:
                messagebox.showerror("写入约束拦截", f"{exc}", parent=self.root)

    def _text_changed(self, widget, field):
        value = widget.get("1.0", "end-1c")
        if self.document is not None and value != field.value:
            try:
                set_field_value(field, value, allow_label_edit=self.allow_label_edit.get())
                self._set_dirty()
            except Exception as exc:
                messagebox.showerror("写入约束拦截", f"{exc}", parent=self.root)

    def _sync_texts(self):
        self._sync_header_footer()
        for widget, field in self._text_widgets:
            self._text_changed(widget, field)

    def add_note_row(self, row_index: int = 0, text: str = "说明："):
        if self.document is None:
            return
        self._sync_texts()
        safe_add_note_row_after(self.document.tables[self.current_table], row_index, text=text, auto_renumber=True)
        self._set_dirty()
        self._refresh_sections()

    def move_row_up(self, row_index: int):
        if self.document is None:
            return
        self._sync_texts()
        safe_move_row(self.document.tables[self.current_table], row_index, direction="up", auto_renumber=True)
        self._set_dirty()
        self._refresh_sections()

    def move_row_down(self, row_index: int):
        if self.document is None:
            return
        self._sync_texts()
        safe_move_row(self.document.tables[self.current_table], row_index, direction="down", auto_renumber=True)
        self._set_dirty()
        self._refresh_sections()

    def add_row(self, row_index):
        if self.document is None:
            return
        self._sync_texts()
        safe_add_row_after(self.document.tables[self.current_table], row_index, auto_renumber=True)
        self._set_dirty()
        self._refresh_sections()

    def remove_row(self, row_index):
        if self.document is None:
            return
        table = self.document.tables[self.current_table]
        row = table.rows[row_index]
        if not is_row_editable(row):
            messagebox.showwarning("无法删除", "该行包含受保护的表头或没有可编辑的值，无法删除。", parent=self.root)
            return
        if not messagebox.askyesno("确认删除", f"确认删除第 {row_index + 1} 行？\n（系统将自动保持后续项序号连续）", parent=self.root):
            return
        self._sync_texts()
        try:
            safe_delete_row(table, row_index, auto_renumber=True)
            self._set_dirty()
            self._refresh_sections()
        except Exception as exc:
            messagebox.showerror("删除被拦截", f"受保护结构行约束：\n{exc}", parent=self.root)

    def export(self):
        if self.document is None or self.source_path is None:
            messagebox.showinfo("未载入模板", "请先打开一个 DOCX 模板。", parent=self.root)
            return
        self._sync_texts()
        initial = getattr(self, "custom_file_name", None) or build_export_docx_name(self.document, self.source_path, getattr(self, "current_template_name", "") or self.template_choice.get())
        path = filedialog.asksaveasfilename(title="导出编辑后 DOCX", initialdir=str(self.source_path.parent),
                                            initialfile=initial, defaultextension=".docx",
                                            filetypes=[("Word 文档", "*.docx")])
        if not path:
            return
        output = Path(path).resolve()
        if output == self.source_path:
            messagebox.showerror("禁止覆盖源模板", "请另存为新文件，源模板不会被覆盖。", parent=self.root)
            return
        try:
            renumber_document(self.document)
            if self.work_path is None:
                raise RuntimeError("未建立模板工作副本")
            self.document.save(str(self.work_path))
            shutil.copy2(self.work_path, output)
            self._set_dirty(False)
            messagebox.showinfo("导出成功", f"文件已导出至：\n{output}", parent=self.root)
        except Exception as exc:
            messagebox.showerror("导出失败", f"源模板未被更改。\n\n{exc}", parent=self.root)

    def reset_entire_template(self):
        """恢复整份模板至初始模板状态"""
        if self.document is None or not self.source_path:
            messagebox.showinfo("提示", "当前未载入任何模板。", parent=self.root)
            return
        confirmed = messagebox.askyesno(
            "恢复整份模板",
            f"确认将整份文档恢复至【{self.source_path.name}】初始模板状态？\n\n当前所有章节未导出的修改都将被清空还原。",
            parent=self.root,
        )
        if not confirmed:
            return
        self.load_document(self.source_path)
        messagebox.showinfo("恢复成功", "已将整份模板恢复至初始状态。", parent=self.root)

    def reset_current_section(self):
        """仅将当前选择的 Section 恢复至初始模板状态，保留其他 Section 的修改"""
        if self.document is None or not self.source_path:
            messagebox.showinfo("提示", "当前未载入任何模板。", parent=self.root)
            return
        if self.current_table >= len(self.document.tables):
            messagebox.showinfo("提示", "当前项目不支持单节恢复。", parent=self.root)
            return
        sec_num = self.current_table + 1
        confirmed = messagebox.askyesno(
            "恢复本节至模板状态",
            f"确认仅将【第 {sec_num} 节 (Section {sec_num})】恢复至初始模板状态？\n\n本章节的所有编辑修改将被撤销还原，其他章节的修改仍将完整保留不变。",
            parent=self.root,
        )
        if not confirmed:
            return
        try:
            from copy import deepcopy
            orig_doc = Document(str(self.source_path))
            if self.current_table >= len(orig_doc.tables):
                raise IndexError("初始模板中找不到对应章节表格")
            current_tbl = self.document.tables[self.current_table]._tbl
            new_tbl = deepcopy(orig_doc.tables[self.current_table]._tbl)
            current_tbl.getparent().replace(current_tbl, new_tbl)
            renumber_document(self.document)
            self._set_dirty(True)
            self._render_current_section()
            messagebox.showinfo("恢复成功", f"第 {sec_num} 节已成功恢复至初始模板状态，其他章节修改已保留。", parent=self.root)
        except Exception as exc:
            messagebox.showerror("恢复失败", f"恢复本节失败：\n{exc}", parent=self.root)

    def close(self):
        if self.confirm_discard():
            shutil.rmtree(self.work_dir, ignore_errors=True)
            self.root.destroy()


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    target_path = Path(argv[0]).resolve() if argv else None

    try:
        import tkinter
    except ImportError:
        env = clean_python_environment()
        cmd = ["py", "-3.12", str(Path(__file__).resolve())]
        if target_path:
            cmd.append(str(target_path))
        try:
            import subprocess
            return subprocess.call(cmd, env=env)
        except Exception as exc:
            print(f"Failed to launch with py -3.12: {exc}", file=sys.stderr)
            return 1

    root = tk.Tk()
    app = EditorApp(root, template=target_path)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
