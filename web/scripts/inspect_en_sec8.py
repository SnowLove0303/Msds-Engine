import os, sys
from docx import Document
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

for m in ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']:
    docx_path = rf"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\{m}\{m} msds_EN Guanzhi.docx"
    doc = Document(docx_path)
    print(f"\n==================== {m} EN SECTION 8 ====================")
    t8 = doc.tables[7]
    for r_idx, r in enumerate(t8.rows):
        label = r.cells[0].text.strip().replace('\n', ' ')
        val = r.cells[-1].text.strip().replace('\n', ' ')
        val_runs = []
        for p in r.cells[-1].paragraphs:
            for run in p.runs:
                rPr = run._r.get_or_add_rPr()
                sz = rPr.find(qn('w:sz'))
                sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                b = rPr.find(qn('w:b'))
                b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                rFonts = rPr.find(qn('w:rFonts'))
                ascii_f = rFonts.get(qn('w:ascii')) if rFonts is not None else 'None'
                val_runs.append(f"'{run.text}'(sz={sz_val},b={b_val},font={ascii_f})")
        print(f"Row {r_idx} [{label}]: {val}")
        if val_runs:
            print("   VAL RUNS:", " | ".join(val_runs))
