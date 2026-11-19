import docx

src_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"
deliv_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"

doc_src = docx.Document(src_path)
doc_deliv = docx.Document(deliv_path)

print(f"Source tables: {len(doc_src.tables)}, Delivered tables: {len(doc_deliv.tables)}")

out = []

for idx in range(min(len(doc_src.tables), len(doc_deliv.tables))):
    t_s = doc_src.tables[idx]
    t_d = doc_deliv.tables[idx]
    
    out.append(f"\n=======================================================")
    out.append(f"SECTION / TABLE {idx}:")
    out.append(f"Source rows: {len(t_s.rows)}, Delivered rows: {len(t_d.rows)}")
    out.append(f"--------------------- SOURCE -------------------------")
    for r_i, r in enumerate(t_s.rows):
        cells = [c.text.strip().replace('\n', ' ') for c in r.cells]
        # dedup
        dedup = []
        for c in cells:
            if not dedup or c != dedup[-1]:
                dedup.append(c)
        out.append(f"  S_R{r_i}: {' || '.join(dedup)}")
        
    out.append(f"------------------- DELIVERED -----------------------")
    for r_i, r in enumerate(t_d.rows):
        cells = [c.text.strip().replace('\n', ' ') for c in r.cells]
        dedup = []
        for c in cells:
            if not dedup or c != dedup[-1]:
                dedup.append(c)
        out.append(f"  D_R{r_i}: {' || '.join(dedup)}")

with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\full_16_sections_comparison.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("Wrote full_16_sections_comparison.txt successfully.")
