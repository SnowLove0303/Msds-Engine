import docx

doc = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx")
t7 = doc.tables[7]
print(f"Table 7 has {len(t7.rows)} rows")
for idx, r in enumerate(t7.rows):
    print(f"R{idx} (cells: {len(r.cells)}): {[c.text.strip() for c in r.cells]}")
