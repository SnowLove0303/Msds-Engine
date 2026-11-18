import os, sys
from docx import Document
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def get_style_info(p):
    r_infos = []
    pPr = p._p.get_or_add_pPr()
    pRPr = pPr.find(qn('w:rPr'))
    p_b = pRPr.find(qn('w:b')) if pRPr is not None else None
    p_b_str = 'bold' if p_b is not None else 'reg'
    
    for r in p.runs:
        rPr = r._r.get_or_add_rPr()
        sz = rPr.find(qn('w:sz'))
        sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
        b = rPr.find(qn('w:b'))
        b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
        rFonts = rPr.find(qn('w:rFonts'))
        eastAsia = rFonts.get(qn('w:eastAsia')) if rFonts is not None else 'None'
        ascii_f = rFonts.get(qn('w:ascii')) if rFonts is not None else 'None'
        r_infos.append(f"'{r.text}'[sz={sz_val},b={b_val},eastAsia={eastAsia},ascii={ascii_f},p_b={p_b_str}]")
    return " | ".join(r_infos)

for m in models:
    docx_path = os.path.join(base_dir, m, f"{m} msds_CN 冠志.docx")
    doc = Document(docx_path)
    print(f"\n=======================================================")
    print(f"      ALL 16 SECTIONS VALUE FORMATTING: {m}")
    print(f"=======================================================")
    for t_idx, t in enumerate(doc.tables):
        # find value cells in this table
        # print title (row 0)
        title = t.rows[0].cells[0].text.strip()
        print(f"\n--- Table {t_idx+1}: {title} (rows={len(t.rows)}) ---")
        for r_idx in range(1, len(t.rows)):
            r = t.rows[r_idx]
            # usually cell 1 or last cell is value
            c_val = r.cells[-1]
            c_label = r.cells[0].text.strip().replace('\n', ' ')[:30]
            val_styles = [get_style_info(p) for p in c_val.paragraphs if p.text.strip()]
            print(f"  Row {r_idx} [{c_label}]:")
            for vs in val_styles:
                print(f"    VAL: {vs[:160]}")
