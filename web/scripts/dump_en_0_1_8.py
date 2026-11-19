import docx

doc_en = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_EN Guanzhi.docx")

def check_en_table(idx, label):
    t = doc_en.tables[idx]
    print(f"\n=== EN {label} (Table {idx}) ===")
    for r_i, r in enumerate(t.rows):
        cells = [c.text.strip().replace('\n', ' ') for c in r.cells]
        dedup = []
        for c in cells:
            if not dedup or c != dedup[-1]:
                dedup.append(c)
        print(f"  R{r_i}: {' || '.join(dedup)}")

check_en_table(0, "SECTION 1")
check_en_table(1, "SECTION 2")
check_en_table(8, "SECTION 9")
