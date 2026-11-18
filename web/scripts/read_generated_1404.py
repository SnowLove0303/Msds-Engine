import fitz
import sys
import docx

sys.stdout.reconfigure(encoding='utf-8')

# Check CN DOCX
cn_docx_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1404\EP-1404 msds_CN 冠志.docx"
doc = docx.Document(cn_docx_path)
print("=== CN DOCX Section 9 ===")
t9 = doc.tables[8] # table 9 is index 8
for r_idx, row in enumerate(t9.rows):
    cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
    if any("外观" in c or "9.1" in c for c in cells):
        print(f"Row {r_idx}: {cells}")

# Check EN DOCX
en_docx_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1404\EP-1404 msds_EN Guanzhi.docx"
doc_en = docx.Document(en_docx_path)
print("\n=== EN DOCX Section 1 ===")
t1_en = doc_en.tables[0]
for r_idx, row in enumerate(t1_en.rows):
    cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
    print(f"Row {r_idx}: {cells}")

print("\n=== EN DOCX Section 9 ===")
t9_en = doc_en.tables[8]
for r_idx, row in enumerate(t9_en.rows):
    cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
    if any("Appearance" in c or "9.1" in c for c in cells):
        print(f"Row {r_idx}: {cells}")
