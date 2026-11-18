import sys
import pymupdf

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.pdf"
doc = pymupdf.open(pdf_path)

page = doc[2] # Page 3 (0-indexed: 2)
print("=== PAGE 3 OF PDF (SECTION 8 & 9) ===")
for b in page.get_text("dict")["blocks"]:
    if "lines" in b:
        for l in b["lines"]:
            spans = []
            for s in l["spans"]:
                spans.append(f"'{s['text']}' [font={s['font']}, sz={s['size']}, flags={s['flags']}]")
            print("  L:", " | ".join(spans))
