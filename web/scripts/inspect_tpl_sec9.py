import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')
doc = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_CN_冠志(1).docx")
t9 = doc.tables[8]
for r_idx in range(5):
    cells = [c.text.strip().replace('\n', ' ') for c in t9.rows[r_idx].cells]
    print(f"Row {r_idx}: {cells}")
