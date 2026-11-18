import os, sys
from docx import Document

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
src_base = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

for m in models:
    print(f"\n==================== TDS CHECK: {m} ====================")
    mdl_dir = os.path.join(base_dir, m)
    
    # Check TDS files
    tds_files = [f for f in os.listdir(mdl_dir) if 'tds' in f]
    print("TDS FILES:", tds_files)
    
    # Read TDS CN Guanzhi
    tds_cn = os.path.join(mdl_dir, f"{m} tds_CN 冠志.docx")
    if os.path.exists(tds_cn):
        doc = Document(tds_cn)
        print(f"  Paragraphs count: {len(doc.paragraphs)}")
        for p in doc.paragraphs[:10]:
            if p.text.strip():
                print(f"    [P] {p.text.strip()}")
        print(f"  Tables count: {len(doc.tables)}")
        for t_idx, t in enumerate(doc.tables):
            print(f"    Table {t_idx+1} ({len(t.rows)} rows):")
            for r in t.rows:
                print(f"      {[c.text.strip() for c in r.cells]}")
    
    # Read Source TDS if exists
    src_tds = os.path.join(mdl_dir, f"[源文件] {m} tds_CN 冠志.docx")
    if not os.path.exists(src_tds):
        src_tds = os.path.join(src_base, m, f"[源文件] {m} tds_CN 冠志.docx")
    if os.path.exists(src_tds):
        sdoc = Document(src_tds)
        print(f"  [SOURCE TDS] Found! Paragraphs: {len(sdoc.paragraphs)}, Tables: {len(sdoc.tables)}")
        for p in sdoc.paragraphs[:10]:
            if p.text.strip():
                print(f"    [SRC P] {p.text.strip()}")
        for t_idx, t in enumerate(sdoc.tables):
            print(f"    [SRC Table {t_idx+1}] ({len(t.rows)} rows):")
            for r in t.rows:
                print(f"      {[c.text.strip() for c in r.cells]}")
