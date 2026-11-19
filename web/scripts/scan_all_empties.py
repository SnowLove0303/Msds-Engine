import docx

doc_cn = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx")
doc_en = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_EN Guanzhi.docx")

def scan_empty_cells(doc, label):
    print(f"\n==================== SCANNING EMPTY / ABNORMAL CELLS: {label} ====================")
    for t_i, t in enumerate(doc.tables):
        for r_i, r in enumerate(t.rows):
            # check if label has empty value
            c_texts = [c.text.strip() for c in r.cells]
            # dedup contiguous
            dedup = []
            for c in c_texts:
                if not dedup or c != dedup[-1]:
                    dedup.append(c)
            
            # if row has only 1 distinct text and it ends with colon or looks like label
            if len(dedup) == 1 and any(dedup[0].endswith(x) for x in [":", "："]):
                print(f"Table {t_i} Row {r_i}: Hanging label without value: '{dedup[0]}'")
            elif len(dedup) >= 2:
                # check if second or last cell is empty
                lbl = dedup[0]
                val = dedup[-1]
                if not val and any(lbl.endswith(x) for x in [":", "："]):
                    print(f"Table {t_i} Row {r_i}: Empty value for label: '{lbl}'")
                elif not val:
                    print(f"Table {t_i} Row {r_i}: Trailing empty cell for: '{lbl}'")

scan_empty_cells(doc_cn, "CN GUANZHI")
scan_empty_cells(doc_en, "EN GUANZHI")
