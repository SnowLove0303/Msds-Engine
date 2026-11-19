import docx
import os
import glob

base = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版"
files = glob.glob(base + r"\**\*msds_CN*.docx", recursive=True)
print(f"Found {len(files)} delivered MSDS files:")
for f in files[:8]:
    try:
        doc = docx.Document(f)
        t7 = doc.tables[7]
        print(f"\nFile: {os.path.basename(f)} (Table 7 rows: {len(t7.rows)})")
        for r_i, r in enumerate(t7.rows):
            txt = " || ".join([c.text.strip().replace('\n', ' ') for c in r.cells])
            if any(k in txt for k in ["8.1", "8.2", "工程控制", "工作场所", "物质"]):
                print(f"  R{r_i}: {txt[:100]}")
    except Exception as e:
        print(f"  Error {f}: {e}")
