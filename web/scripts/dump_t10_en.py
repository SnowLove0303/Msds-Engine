import docx

doc_en = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_EN Guanzhi.docx")
t10_en = doc_en.tables[10]
print(f"EN Table 10 has {len(t10_en.rows)} rows:")
for r_i, r in enumerate(t10_en.rows):
    cells = [c.text.strip().replace('\n', ' ') for c in r.cells]
    dedup = []
    for c in cells:
        if not dedup or c != dedup[-1]:
            dedup.append(c)
    print(f"  R{r_i}: {' || '.join(dedup)}")
