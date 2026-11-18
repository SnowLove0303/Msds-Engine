import docx
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
dir_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP\EP-1404"
for fname in os.listdir(dir_path):
    if fname.endswith(".docx"):
        p = os.path.join(dir_path, fname)
        doc = docx.Document(p)
        t9 = doc.tables[8]
        cells = [c.text.strip().replace('\n', ' ') for c in t9.rows[1].cells]
        print(f"{fname} -> Row 1: {cells}")
