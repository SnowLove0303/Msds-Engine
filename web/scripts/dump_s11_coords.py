import pymupdf
import sys

# 强制 utf-8 输出
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.pdf')

for pno, page in enumerate(doc):
    text = page.get_text()
    if '11.toxicological' in text.lower().replace(' ', '') or '11.toxicity' in text.lower().replace(' ', ''):
        print(f"=== PAGE {pno+1} SECTION 11 ===")
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if "lines" in b:
                for l in b["lines"]:
                    for s in l["spans"]:
                        t = s["text"].strip()
                        if t:
                            bbox = s["bbox"]
                            print(f"x0={bbox[0]:6.2f}, y0={bbox[1]:6.2f}, size={s['size']:4.2f}, font={s['font'][:10]}: {t}")
