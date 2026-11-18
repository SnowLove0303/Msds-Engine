import os, sys
from docx import Document
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

tpl_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates"
files = [f for f in os.listdir(tpl_dir) if f.endswith('.docx') and 'CN' in f]
tpl_path = os.path.join(tpl_dir, files[0])

doc = Document(tpl_path)
print(f"=== OFFICIAL TEMPLATE SECTION 2 & 15: {files[0]} ===")

# Sec 2 is table 2 (idx 1)
t2 = doc.tables[1]
print("\n--- Template Section 2 ---")
for r_idx, r in enumerate(t2.rows):
    for c_idx, c in enumerate(r.cells):
        for p_idx, p in enumerate(c.paragraphs):
            pPr = p._p.get_or_add_pPr()
            pRPr = pPr.find(qn('w:rPr'))
            p_b = pRPr.find(qn('w:b')) if pRPr is not None else None
            p_b_val = p_b.get(qn('w:val')) if p_b is not None else ('present' if p_b is not None else 'None')
            runs_info = []
            for run in p.runs:
                rPr = run._r.get_or_add_rPr()
                b = rPr.find(qn('w:b'))
                b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                sz = rPr.find(qn('w:sz'))
                sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                runs_info.append(f"'{run.text}'[b={b_val},sz={sz_val}]")
            if p.text.strip():
                print(f"  P{p_idx} (p_b={p_b_val}): {' | '.join(runs_info)}")

# Sec 15 is table 15 (idx 14)
t15 = doc.tables[14]
print("\n--- Template Section 15 ---")
for r_idx, r in enumerate(t15.rows):
    for c_idx, c in enumerate(r.cells):
        for p_idx, p in enumerate(c.paragraphs):
            pPr = p._p.get_or_add_pPr()
            pRPr = pPr.find(qn('w:rPr'))
            p_b = pRPr.find(qn('w:b')) if pRPr is not None else None
            p_b_val = p_b.get(qn('w:val')) if p_b is not None else ('present' if p_b is not None else 'None')
            runs_info = []
            for run in p.runs:
                rPr = run._r.get_or_add_rPr()
                b = rPr.find(qn('w:b'))
                b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                sz = rPr.find(qn('w:sz'))
                sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                runs_info.append(f"'{run.text}'[b={b_val},sz={sz_val}]")
            if p.text.strip():
                print(f"  R{r_idx}C{c_idx} P{p_idx} (p_b={p_b_val}): {' | '.join(runs_info)}")
