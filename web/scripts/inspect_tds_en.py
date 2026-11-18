import os, sys
from docx import Document

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

for m in ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']:
    p = rf"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\{m}\{m} tds_EN Guanzhi.docx"
    doc = Document(p)
    print(f"\n==================== {m} TDS EN ====================")
    for i, para in enumerate(doc.paragraphs[:8]):
        if para.text.strip():
            print(f"  P{i+1}: {para.text.strip()}")
    if doc.tables:
        t = doc.tables[0]
        for r in t.rows[:4]:
            print("  TBL:", [c.text.strip() for c in r.cells])
