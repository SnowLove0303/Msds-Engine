import docx

doc_deliv = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx")
t_deliv = doc_deliv.tables[7]
for r_idx in range(11, len(t_deliv.rows)):
    r = t_deliv.rows[r_idx]
    row_vals = [c.text.strip().replace("\n", " ") for c in r.cells]
    print(f"R{r_idx}: {' | '.join(row_vals)}")
