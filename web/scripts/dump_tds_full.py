import os, sys
from docx import Document

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

docx_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 tds_CN 冠志.docx"
doc = Document(docx_path)

print(f"=== {os.path.basename(docx_path)} ===")
for i, p in enumerate(doc.paragraphs):
    print(f"P{i+1}: {p.text}")

for t_idx, t in enumerate(doc.tables):
    print(f"\nTable {t_idx+1}:")
    for r in t.rows:
        print("  ", [c.text.strip() for c in r.cells])
