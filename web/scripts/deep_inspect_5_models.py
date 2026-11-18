import os, sys, glob, json
import docx
from docx import Document

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP"
src_base = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP"
models = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def inspect_model(model):
    print(f"\n=======================================================")
    print(f"                INSPECTING {model}")
    print(f"=======================================================")
    mdl_dir = os.path.join(base_dir, model)
    s_dir = os.path.join(src_base, model)
    
    # 1. Check all files in deliverable dir
    print("DELIVERABLE FILES:")
    for f in sorted(os.listdir(mdl_dir)):
        fp = os.path.join(mdl_dir, f)
        print(f"  {f} ({os.path.getsize(fp)} bytes)")

    # 2. Check source files
    print("\nSOURCE FILES:")
    if os.path.exists(s_dir):
        for f in sorted(os.listdir(s_dir)):
            fp = os.path.join(s_dir, f)
            print(f"  {f} ({os.path.getsize(fp)} bytes)")
    else:
        print(f"  SOURCE DIR NOT FOUND: {s_dir}")

    # 3. Read Source MD text if exists
    src_md = os.path.join(s_dir, "源文件_用户提供文本备份.md")
    if not os.path.exists(src_md):
        src_md = os.path.join(s_dir, "源文件_用户提供文本.md")
    if os.path.exists(src_md):
        with open(src_md, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        print(f"\nSOURCE MD FIRST 30 LINES ({src_md}):")
        for line in lines[:30]:
            print("  ", line.strip())
            
    # 4. Check MSDS CN Guanzhi DOCX content summary
    msds_cn = os.path.join(mdl_dir, f"{model} msds_CN 冠志.docx")
    if os.path.exists(msds_cn):
        doc = Document(msds_cn)
        print(f"\nMSDS CN DOCX TABLES: {len(doc.tables)} tables")
        for t_idx, table in enumerate(doc.tables):
            # print first 2 rows of each table
            t_rows = len(table.rows)
            row_samples = []
            for r in table.rows[:3]:
                row_text = [c.text.strip().replace('\n', ' ') for c in r.cells]
                # condense
                row_samples.append(" | ".join(row_text[:4]))
            print(f"  Table {t_idx+1} ({t_rows} rows):")
            for rs in row_samples:
                print(f"    {rs[:120]}")

for m in models:
    inspect_model(m)
