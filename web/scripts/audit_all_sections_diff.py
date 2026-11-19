import docx
import os
import sys

src_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"
deliv_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"

print(f"SRC EXISTS: {os.path.exists(src_path)}")
print(f"DELIV EXISTS: {os.path.exists(deliv_path)}")

doc_src = docx.Document(src_path)
doc_deliv = docx.Document(deliv_path)

def dump_doc(doc, label):
    print(f"\n==================== {label} ====================")
    print(f"Paragraphs: {len(doc.paragraphs)}")
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t:
            print(f"P{i}: {t}")
    print(f"\nTables: {len(doc.tables)}")
    for t_idx, t in enumerate(doc.tables):
        print(f"\n--- Table {t_idx} (rows: {len(t.rows)}) ---")
        for r_idx, r in enumerate(t.rows):
            cells_txt = [c.text.strip() for c in r.cells]
            # dedup contiguous identical cells if merged
            dedup = []
            for c in cells_txt:
                if not dedup or c != dedup[-1]:
                    dedup.append(c)
            row_str = " || ".join(dedup).replace("\n", " ")
            print(f"  R{r_idx}: {row_str}")

with open("audit_src_dump.txt", "w", encoding="utf-8") as f:
    sys.stdout = f
    dump_doc(doc_src, "SOURCE FILE")
    dump_doc(doc_deliv, "DELIVERED FILE")

sys.stdout = sys.__stdout__
print("Dumped to audit_src_dump.txt successfully.")
