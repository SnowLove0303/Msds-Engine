import os, sys, re
from docx import Document

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
src_base = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def parse_source_md(md_path):
    if not os.path.exists(md_path):
        return None
    with open(md_path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    return text

def parse_docx_tables(docx_path):
    if not os.path.exists(docx_path):
        return None
    doc = Document(docx_path)
    tables_data = []
    for t_idx, t in enumerate(doc.tables):
        rows_data = []
        for r_idx, r in enumerate(t.rows):
            cells_text = [c.text.strip().replace('\r\n', '\n') for c in r.cells]
            rows_data.append(cells_text)
        tables_data.append(rows_data)
    return tables_data

for m in models:
    print(f"\n================================================================================")
    print(f"                      AUDIT ANALYSIS: {m}")
    print(f"================================================================================")
    md_path = os.path.join(src_base, m, "源文件_用户提供文本备份.md")
    if not os.path.exists(md_path):
        md_path = os.path.join(src_base, m, "源文件_用户提供文本.md")
    
    src_text = parse_source_md(md_path)
    cn_docx = os.path.join(base_dir, m, f"{m} msds_CN 冠志.docx")
    en_docx = os.path.join(base_dir, m, f"{m} msds_EN Guanzhi.docx")
    
    cn_tables = parse_docx_tables(cn_docx)
    en_tables = parse_docx_tables(en_docx)
    
    # 1. Compare Section 1
    print(f"\n--- Section 1 ---")
    s1_rows = cn_tables[0]
    print(f"  CN S1 rows: {len(s1_rows)}")
    for r in s1_rows:
        if r[0] != r[-1]:
            print(f"    {r[0]} => {r[-1]}")
            
    # 2. Compare Section 2
    print(f"\n--- Section 2 ---")
    s2_rows = cn_tables[1]
    print(f"  CN S2 text:\n{s2_rows[1][0] if len(s2_rows)>1 else s2_rows[0][0]}")
    s2_en_rows = en_tables[1]
    print(f"  EN S2 text:\n{s2_en_rows[1][0] if len(s2_en_rows)>1 else s2_en_rows[0][0]}")

    # 3. Compare Section 3
    print(f"\n--- Section 3 ---")
    for r in cn_tables[2]:
        print(f"    CN: {r}")
    for r in en_tables[2]:
        print(f"    EN: {r}")

    # 4. Compare Section 8
    print(f"\n--- Section 8 ---")
    for r in cn_tables[7]:
        label = r[0]
        val = r[-1] if len(r)>1 else ''
        if label != val:
            print(f"    CN: {label} => {val}")
        else:
            print(f"    CN: [HEADER] {label}")

    # 5. Compare Section 9
    print(f"\n--- Section 9 ---")
    for r in cn_tables[8]:
        label = r[0]
        val = r[-1] if len(r)>1 else ''
        if label != val:
            print(f"    CN: {label} => {val}")
