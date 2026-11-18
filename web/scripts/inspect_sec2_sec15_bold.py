import os, sys
from docx import Document
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def inspect_sec2_and_sec15(docx_path, model):
    doc = Document(docx_path)
    print(f"\n=======================================================")
    print(f"      INSPECTING {model} ({os.path.basename(docx_path)})")
    print(f"=======================================================")
    
    # Section 2 is Table 2 (index 1)
    t2 = doc.tables[1]
    print("--- Section 2 Paragraphs & Runs ---")
    for r_idx, r in enumerate(t2.rows):
        for c_idx, c in enumerate(r.cells):
            for p_idx, p in enumerate(c.paragraphs):
                pPr = p._p.get_or_add_pPr()
                pRPr = pPr.find(qn('w:rPr'))
                p_b = pRPr.find(qn('w:b')) if pRPr is not None else None
                p_b_val = p_b.get(qn('w:val')) if p_b is not None else ('present' if p_b is not None else 'None')
                runs_info = []
                for r in p.runs:
                    rPr = r._r.get_or_add_rPr()
                    b = rPr.find(qn('w:b'))
                    b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                    sz = rPr.find(qn('w:sz'))
                    sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                    runs_info.append(f"'{r.text}'[b={b_val},sz={sz_val}]")
                if p.text.strip():
                    print(f"  P{p_idx} (p_b={p_b_val}): {' | '.join(runs_info)}")

    # Section 15 is Table 15 (index 14)
    t15 = doc.tables[14]
    print("\n--- Section 15 Paragraphs & Runs ---")
    for r_idx, r in enumerate(t15.rows):
        for c_idx, c in enumerate(r.cells):
            for p_idx, p in enumerate(c.paragraphs):
                pPr = p._p.get_or_add_pPr()
                pRPr = pPr.find(qn('w:rPr'))
                p_b = pRPr.find(qn('w:b')) if pRPr is not None else None
                p_b_val = p_b.get(qn('w:val')) if p_b is not None else ('present' if p_b is not None else 'None')
                runs_info = []
                for r in p.runs:
                    rPr = r._r.get_or_add_rPr()
                    b = rPr.find(qn('w:b'))
                    b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                    sz = rPr.find(qn('w:sz'))
                    sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                    runs_info.append(f"'{r.text}'[b={b_val},sz={sz_val}]")
                if p.text.strip():
                    print(f"  R{r_idx}C{c_idx} P{p_idx} (p_b={p_b_val}): {' | '.join(runs_info)}")

for m in models:
    docx_path = os.path.join(base_dir, m, f"{m} msds_CN 冠志.docx")
    inspect_sec2_and_sec15(docx_path, m)
