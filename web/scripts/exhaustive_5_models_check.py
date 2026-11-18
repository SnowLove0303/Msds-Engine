import os, sys, json
import docx
from docx import Document

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
src_base = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def get_docx_text(docx_path):
    if not os.path.exists(docx_path):
        return None
    doc = Document(docx_path)
    full_text = []
    for p in doc.paragraphs:
        if p.text.strip():
            full_text.append(p.text.strip())
    for t in doc.tables:
        for r in t.rows:
            r_text = [c.text.strip() for c in r.cells]
            full_text.append(" | ".join(r_text))
    return full_text

for m in models:
    print(f"\n######################################################################")
    print(f"                     AUDIT CHECK FOR {m}")
    print(f"######################################################################")
    mdl_dir = os.path.join(base_dir, m)
    s_dir = os.path.join(src_base, m)

    # 1. Source files check
    src_md = os.path.join(s_dir, "源文件_用户提供文本备份.md")
    if not os.path.exists(src_md):
        src_md = os.path.join(s_dir, "源文件_用户提供文本.md")
    
    src_content = ""
    if os.path.exists(src_md):
        with open(src_md, 'r', encoding='utf-8', errors='ignore') as f:
            src_content = f.read()
        print(f"[SOURCE MD] Found: {src_md} ({len(src_content)} chars)")
    else:
        print(f"[SOURCE MD] NOT FOUND!")

    # 2. MSDS CN check
    msds_cn_path = os.path.join(mdl_dir, f"{m} msds_CN 冠志.docx")
    if os.path.exists(msds_cn_path):
        doc = Document(msds_cn_path)
        print(f"\n--- [MSDS CN 冠志] Tables: {len(doc.tables)} ---")
        # Table 1: Sec 1
        t1 = doc.tables[0]
        print(f"  Sec 1 rows: {len(t1.rows)}")
        for r in t1.rows[:4]:
            print(f"    {r.cells[0].text.strip()} -> {r.cells[1].text.strip() if len(r.cells)>1 else ''}")
        
        # Table 2: Sec 2
        t2 = doc.tables[1]
        print(f"  Sec 2 rows: {len(t2.rows)}")
        for r in t2.rows:
            print(f"    {r.cells[0].text.strip()[:150]}")

        # Table 3: Sec 3
        t3 = doc.tables[2]
        print(f"  Sec 3 rows: {len(t3.rows)}")
        for r_idx, r in enumerate(t3.rows):
            print(f"    Row {r_idx}: {[c.text.strip() for c in r.cells]}")

        # Table 7: Sec 7
        t7 = doc.tables[6]
        print(f"  Sec 7 rows: {len(t7.rows)}")
        for r_idx, r in enumerate(t7.rows):
            print(f"    Row {r_idx}: {[c.text.strip()[:60] for c in r.cells]}")

        # Table 8: Sec 8
        t8 = doc.tables[7]
        print(f"  Sec 8 rows: {len(t8.rows)}")
        for r_idx, r in enumerate(t8.rows):
            cells = [c.text.strip() for c in r.cells]
            print(f"    Row {r_idx}: {cells[0][:25]} | {cells[1][:25] if len(cells)>1 else ''} | {cells[2][:25] if len(cells)>2 else ''}")

        # Table 9: Sec 9
        t9 = doc.tables[8]
        print(f"  Sec 9 rows: {len(t9.rows)}")
        for r_idx in [0, 1, 2, 3, 4, 17, 18, 19]:
            if r_idx < len(t9.rows):
                r = t9.rows[r_idx]
                print(f"    Row {r_idx}: {[c.text.strip() for c in r.cells]}")

        # Table 11: Sec 11
        t11 = doc.tables[10]
        print(f"  Sec 11 rows: {len(t11.rows)}")
        for r_idx, r in enumerate(t11.rows):
            print(f"    Row {r_idx}: {[c.text.strip() for c in r.cells]}")

        # Table 12: Sec 12
        t12 = doc.tables[11]
        print(f"  Sec 12 rows: {len(t12.rows)}")
        for r_idx, r in enumerate(t12.rows):
            print(f"    Row {r_idx}: {[c.text.strip()[:60] for c in r.cells]}")

    # 3. MSDS EN check
    msds_en_path = os.path.join(mdl_dir, f"{m} msds_EN Guanzhi.docx")
    if os.path.exists(msds_en_path):
        doc_en = Document(msds_en_path)
        print(f"\n--- [MSDS EN Guanzhi] Tables: {len(doc_en.tables)} ---")
        t2_en = doc_en.tables[1]
        print(f"  Sec 2 EN text: {t2_en.rows[1].cells[0].text.strip()[:150] if len(t2_en.rows)>1 else t2_en.rows[0].cells[0].text.strip()[:150]}")
        t3_en = doc_en.tables[2]
        print(f"  Sec 3 EN rows: {len(t3_en.rows)}")
        for r_idx, r in enumerate(t3_en.rows):
            print(f"    Row {r_idx}: {[c.text.strip() for c in r.cells]}")
        t8_en = doc_en.tables[7]
        print(f"  Sec 8 EN rows: {len(t8_en.rows)}")
        for r_idx, r in enumerate(t8_en.rows[:4]):
            cells = [c.text.strip() for c in r.cells]
            print(f"    Row {r_idx}: {cells[0][:25]} | {cells[1][:25] if len(cells)>1 else ''}")

    # 4. TDS Check
    tds_cn_path = os.path.join(mdl_dir, f"{m} tds_CN 冠志.docx")
    if os.path.exists(tds_cn_path):
        tdoc = Document(tds_cn_path)
        print(f"\n--- [TDS CN 冠志] Tables: {len(tdoc.tables)} ---")
        for t_idx, t in enumerate(tdoc.tables):
            print(f"  TDS Table {t_idx+1} ({len(t.rows)} rows):")
            for r in t.rows[:3]:
                print(f"    {[c.text.strip()[:40] for c in r.cells]}")
    else:
        print(f"\n--- [TDS CN 冠志] NOT FOUND ---")
