import os, sys
from docx import Document
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

tpl_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates"
files = [f for f in os.listdir(tpl_dir) if f.endswith('.docx') and 'CN' in f]
if files:
    tpl_path = os.path.join(tpl_dir, files[0])
    print(f"=== OFFICIAL TEMPLATE SECTION 8: {files[0]} ===")
    doc = Document(tpl_path)
    t8 = doc.tables[7]
    for r_idx, r in enumerate(t8.rows):
        cells = r.cells
        label = cells[0].text.strip().replace('\n', ' ')
        val = cells[-1].text.strip().replace('\n', ' ')
        val_runs = []
        for p in cells[-1].paragraphs:
            for run in p.runs:
                rPr = run._r.get_or_add_rPr()
                sz = rPr.find(qn('w:sz'))
                sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                b = rPr.find(qn('w:b'))
                b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                rFonts = rPr.find(qn('w:rFonts'))
                eastAsia = rFonts.get(qn('w:eastAsia')) if rFonts is not None else 'None'
                ascii_f = rFonts.get(qn('w:ascii')) if rFonts is not None else 'None'
                val_runs.append(f"'{run.text}'(sz={sz_val},b={b_val},font={ascii_f}/{eastAsia})")
        print(f"Row {r_idx} [{label}]: {val}")
        if val_runs:
            print("   VAL RUNS:", " | ".join(val_runs))
