import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.pdf")
print("Total pages:", len(doc))
for i, page in enumerate(doc):
    print(f"\n--- PAGE {i+1} ---")
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip().replace('\n', ' ')
        if text:
            print(f"[{b[0]:.1f}, {b[1]:.1f}] {text[:100]}")
