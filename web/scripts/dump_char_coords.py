import fitz

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.pdf")
page = doc[4]
blocks = page.get_text("rawdict")["blocks"]
b = blocks[10]
for l in b["lines"]:
    for s in l["spans"]:
        chars = s.get("chars", [])
        char_str = " ".join([f"{c['c']}({c['bbox'][0]:.1f})" for c in chars[:15]])
        print("Chars:", char_str)
