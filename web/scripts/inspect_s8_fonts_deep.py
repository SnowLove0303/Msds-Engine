import os, sys
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def inspect_fonts(docx_path, model):
    doc = Document(docx_path)
    print(f"\n=================================================================")
    print(f"      FONT INSPECTION: {model} ({os.path.basename(docx_path)})")
    print(f"=================================================================")
    
    # Check Section 4 (Table 4) as reference baseline
    t4 = doc.tables[3]
    print("--- [BASELINE] Section 4 Runs ---")
    for r_idx, r in enumerate(t4.rows):
        for c_idx, c in enumerate(r.cells):
            for p in c.paragraphs:
                for run in p.runs:
                    rPr = run._r.get_or_add_rPr()
                    sz = rPr.find(qn('w:sz'))
                    sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                    b = rPr.find(qn('w:b'))
                    b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                    rFonts = rPr.find(qn('w:rFonts'))
                    eastAsia = rFonts.get(qn('w:eastAsia')) if rFonts is not None else 'None'
                    ascii_f = rFonts.get(qn('w:ascii')) if rFonts is not None else 'None'
                    print(f"  Sec4 R{r_idx}C{c_idx}: text='{run.text[:25]}' | sz={sz_val} | b={b_val} | eastAsia={eastAsia} | ascii={ascii_f}")

    # Check Section 8 (Table 8)
    t8 = doc.tables[7]
    print("\n--- Section 8 Runs ---")
    for r_idx, r in enumerate(t8.rows):
        for c_idx, c in enumerate(r.cells):
            for p in c.paragraphs:
                for run in p.runs:
                    rPr = run._r.get_or_add_rPr()
                    sz = rPr.find(qn('w:sz'))
                    sz_val = sz.get(qn('w:val')) if sz is not None else 'None'
                    b = rPr.find(qn('w:b'))
                    b_val = b.get(qn('w:val')) if b is not None else ('present' if b is not None else 'None')
                    rFonts = rPr.find(qn('w:rFonts'))
                    eastAsia = rFonts.get(qn('w:eastAsia')) if rFonts is not None else 'None'
                    ascii_f = rFonts.get(qn('w:ascii')) if rFonts is not None else 'None'
                    # Also check paragraph w:pPr
                    pPr = p._p.get_or_add_pPr()
                    pRPr = pPr.find(qn('w:rPr'))
                    p_b = pRPr.find(qn('w:b')) if pRPr is not None else None
                    p_b_val = p_b.get(qn('w:val')) if p_b is not None else ('present' if p_b is not None else 'None')
                    print(f"  Sec8 R{r_idx}C{c_idx}: text='{run.text[:30]}' | sz={sz_val} | b={b_val} (p_b={p_b_val}) | eastAsia={eastAsia} | ascii={ascii_f}")

for m in models:
    docx_path = os.path.join(base_dir, m, f"{m} msds_CN 冠志.docx")
    inspect_fonts(docx_path, m)
