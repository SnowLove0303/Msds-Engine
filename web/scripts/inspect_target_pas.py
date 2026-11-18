# -*- coding: utf-8 -*-
import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

def inspect_file(p, label):
    print(f"\n================== {label} ==================")
    doc = docx.Document(p)
    print(f"Tables count: {len(doc.tables)}")
    for rel_id, rel in doc.part.rels.items():
        if "image" in str(rel.target_ref):
            print(f"Image found: rel_id={rel_id}, target={rel.target_ref}")
    
    # Section 2 (table 1)
    if len(doc.tables) > 1:
        t2 = doc.tables[1]
        print(f"\n--- Section 2 (Table 1, {len(t2.rows)} rows) ---")
        for i, row in enumerate(t2.rows):
            cells_text = " | ".join([c.text.strip().replace("\n", " ") for c in row.cells])
            print(f"  Row {i}: {cells_text}")
            
    # Section 3 (table 2)
    if len(doc.tables) > 2:
        t3 = doc.tables[2]
        print(f"\n--- Section 3 (Table 2, {len(t3.rows)} rows) ---")
        for i, row in enumerate(t3.rows):
            cells_text = " | ".join([c.text.strip().replace("\n", " ") for c in row.cells])
            print(f"  Row {i}: {cells_text}")
            
    # Section 11 (table 10)
    if len(doc.tables) > 10:
        t11 = doc.tables[10]
        print(f"\n--- Section 11 (Table 10, {len(t11.rows)} rows) ---")
        for i, row in enumerate(t11.rows):
            cells_text = " | ".join([c.text.strip().replace("\n", " ") for c in row.cells])
            print(f"  Row {i}: {cells_text}")

inspect_file(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-4780\PA-4780 msds_CN 冠志.docx", "PA-4780")
inspect_file(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-4902\PA-4902msds_CN 冠志__.docx", "PA-4902")
