import docx

doc_cn_gc = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 国彩.docx")
doc_en_gc = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_EN Guocai.docx")

def scan(doc, name):
    print(f"\n=== {name} ===")
    t7 = doc.tables[7]
    print(f"Table 7 R11: {[c.text.strip() for c in t7.rows[11].cells]}")
    t13 = doc.tables[13]
    print(f"Table 13 R2: {[c.text.strip() for c in t13.rows[2].cells]}")
    t8 = doc.tables[8]
    print(f"Table 8 R1: {[c.text.strip() for c in t8.rows[1].cells]}")
    t0 = doc.tables[0]
    print(f"Table 0 R3: {[c.text.strip() for c in t0.rows[3].cells]}")

scan(doc_cn_gc, "CN GUOCAI")
scan(doc_en_gc, "EN GUOCAI")
