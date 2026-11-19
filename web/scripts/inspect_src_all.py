import docx

doc_src = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx")

print("=== ALL PARAGRAPHS IN SOURCE ===")
for i, p in enumerate(doc_src.paragraphs):
    if p.text.strip():
        print(f"P{i}: {p.text.strip()}")

print("\n=== SOURCE TABLE 7 XML & TEXT ===")
t7 = doc_src.tables[7]
for r_idx, r in enumerate(t7.rows):
    print(f"R{r_idx}: {[c.text.strip() for c in r.cells]}")

print("\n=== ARE THERE OTHER TABLES BETWEEN 6 AND 8? ===")
for i in range(len(doc_src.tables)):
    txt = doc_src.tables[i].rows[0].cells[0].text.strip()
    print(f"Table {i}: {txt[:30]}")
