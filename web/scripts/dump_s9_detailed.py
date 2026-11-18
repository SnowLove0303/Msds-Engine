import fitz

def dump_s9_detailed(pdf_path, label):
    print(f"\n==================== {label} ====================")
    doc = fitz.open(pdf_path)
    for pno in range(len(doc)):
        page = doc[pno]
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if "lines" not in b: continue
            # check if any line starts with 9.
            has_s9 = False
            for l in b["lines"]:
                for s in l["spans"]:
                    if s["text"].strip().startswith("9.") and len(s["text"].strip()) <= 5:
                        has_s9 = True
                        break
            if has_s9:
                print(f"\n--- Page {pno+1} Block at ({b['bbox'][0]:.1f}, {b['bbox'][1]:.1f}) ---")
                for l in b["lines"]:
                    line_spans = []
                    for s in l["spans"]:
                        line_spans.append(f"\"{s['text']}\"(x0={s['bbox'][0]:.1f}, x1={s['bbox'][2]:.1f}, sz={s['size']:.1f}, font={s['font']})")
                    print("  Line:", " | ".join(line_spans))

dump_s9_detailed("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.pdf", "PU-202A CN PDF")
dump_s9_detailed("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.pdf", "PU-202A EN PDF")
