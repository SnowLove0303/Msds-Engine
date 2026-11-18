import fitz # PyMuPDF
import json

cn_pdf = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_CN 冠志.pdf"
en_pdf = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_EN Guanzhi.pdf"

print("=== AUDITING CN PDF ===")
doc_cn = fitz.open(cn_pdf)
print(f"CN PDF Page count: {len(doc_cn)}")
for p_idx, page in enumerate(doc_cn):
    blocks = page.get_text("blocks")
    print(f"\n--- Page {p_idx+1} ({len(blocks)} blocks) ---")
    # Print first 2 blocks (header) and last 2 blocks (footer)
    for b in blocks[:3]:
        print(f"  TOP: {repr(b[4].strip()[:100])}")
    for b in blocks[-2:]:
        print(f"  BOTTOM: {repr(b[4].strip()[:100])}")

print("\n=== AUDITING EN PDF ===")
doc_en = fitz.open(en_pdf)
print(f"EN PDF Page count: {len(doc_en)}")
for p_idx, page in enumerate(doc_en):
    blocks = page.get_text("blocks")
    print(f"\n--- Page {p_idx+1} ({len(blocks)} blocks) ---")
    for b in blocks[:3]:
        print(f"  TOP: {repr(b[4].strip()[:100])}")
    for b in blocks[-2:]:
        print(f"  BOTTOM: {repr(b[4].strip()[:100])}")
