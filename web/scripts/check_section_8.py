import docx

src_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"
deliv_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"

doc_src = docx.Document(src_path)
doc_deliv = docx.Document(deliv_path)

def extract_section_8(doc, name):
    print(f"\n==================== {name} - SECTION 8 ====================")
    for t_idx, t in enumerate(doc.tables):
        full_t = "\n".join([c.text for r in t.rows for c in r.cells])
        if "8.接触控制" in full_t or "8. 接触控制" in full_t or "8.接触控制和个体防护" in full_t or "接触控制" in full_t:
            print(f"Table {t_idx} matched Section 8:")
            for r_idx, r in enumerate(t.rows):
                for c_idx, c in enumerate(r.cells):
                    txt = c.text.strip()
                    if txt:
                        print(f"  [R{r_idx} C{c_idx}]: {txt}")

extract_section_8(doc_src, "SOURCE")
extract_section_8(doc_deliv, "DELIVERED")
