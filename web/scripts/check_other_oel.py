import docx
import os
import glob

base = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版"
files = glob.glob(base + r"\**\*msds_CN*.docx", recursive=True)
for f in files:
    try:
        doc = docx.Document(f)
        t7 = doc.tables[7]
        if len(t7.rows) > 12:
            print(f"\nFile: {os.path.basename(f)} (rows: {len(t7.rows)})")
            for r_i in range(11, len(t7.rows)):
                r = t7.rows[r_i]
                txt = " || ".join([c.text.strip().replace('\n', ' ') for c in r.cells])
                print(f"  R{r_i}: {txt}")
    except Exception as e:
        pass
