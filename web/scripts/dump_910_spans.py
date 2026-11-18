import fitz

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.pdf")
page = doc[4]
blocks = page.get_text("dict")["blocks"]
b = blocks[10] # block 10
for l in b["lines"]:
    for s in l["spans"]:
        print(f"'{s['text']}' (x0={s['bbox'][0]:.2f}, x1={s['bbox'][2]:.2f}, font={s['font']}, sz={s['size']:.1f})")
