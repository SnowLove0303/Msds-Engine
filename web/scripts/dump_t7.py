import docx

doc_src = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx")
doc_deliv = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx")

print("=== SOURCE TABLE 7 ===")
t_src = doc_src.tables[7]
for r_idx, r in enumerate(t_src.rows):
    row_vals = [c.text.strip().replace("\n", " ") for c in r.cells]
    print(f"R{r_idx} (cols {len(r.cells)}): {' | '.join(row_vals)}")

print("\n=== DELIVERED TABLE 7 ===")
t_deliv = doc_deliv.tables[7]
for r_idx, r in enumerate(t_deliv.rows):
    row_vals = [c.text.strip().replace("\n", " ") for c in r.cells]
    print(f"R{r_idx} (cols {len(r.cells)}): {' | '.join(row_vals)}")
