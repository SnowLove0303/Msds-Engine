import os, sys
from docx import Document

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

for lang, suffix in [('CN', 'msds_CN 冠志.docx'), ('EN', 'msds_EN Guanzhi.docx')]:
    doc = Document(rf"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\EP-1501 {suffix}")
    t2 = doc.tables[1]
    print(f"=== EP-1501 {lang} Table 2 ===")
    for r in t2.rows:
        for c in r.cells:
            print(c.text.strip())
