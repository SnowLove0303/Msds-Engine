import os, sys
from docx import Document
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

docx_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_EN Guanzhi.docx"
doc = Document(docx_path)

print(f"=== ENGLISH ALL SECTIONS RUN SIZES & FONTS ===")
for t_idx, t in enumerate(doc.tables):
    title = t.rows[0].cells[0].text.strip()
    val_runs_summary = []
    for r_idx in range(1, len(t.rows)):
        r = t.rows[r_idx]
        c_val = r.cells[-1]
        for p in c_val.paragraphs:
            for run in p.runs:
                rPr = run._r.get_or_add_rPr()
                sz = rPr.find(qn('w:sz'))
                sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                b = rPr.find(qn('w:b'))
                b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                rFonts = rPr.find(qn('w:rFonts'))
                ascii_f = rFonts.get(qn('w:ascii')) if rFonts is not None else 'None'
                if run.text.strip():
                    val_runs_summary.append((run.text.strip()[:15], sz_val, b_val, ascii_f))
    print(f"Table {t_idx+1}: {title[:30]} -> {len(val_runs_summary)} runs. First 3: {val_runs_summary[:3]}")
