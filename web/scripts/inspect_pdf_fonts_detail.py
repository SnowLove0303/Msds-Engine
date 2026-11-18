import sys
import pymupdf

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.pdf"
doc = pymupdf.open(pdf_path)

print(f"=== PDF FONT & SIZE INSPECTION: {pdf_path} ===")
for p_no in range(len(doc)):
    page = doc[p_no]
    text_page = page.get_text("dict")
    print(f"\n--- Page {p_no + 1} ---")
    for block in text_page["blocks"]:
        if "lines" in block:
            for line in block["lines"]:
                line_spans = []
                for span in line["spans"]:
                    text = span["text"].strip()
                    if text:
                        font = span["font"]
                        size = round(span["size"], 2)
                        line_spans.append(f"'{text}' (font={font}, sz={size})")
                if line_spans:
                    full_line_text = " ".join([s["text"].strip() for s in line["spans"]])
                    # Print lines relating to Section 4, Section 8, Section 9
                    if any(k in full_line_text for k in ["急救措施", "4.1", "接触控制", "8.1", "8.2", "呼吸", "手套", "374", "穿透", "动力粘度", "9.1", "化学稳定性", "10.1"]):
                        print("  LINE:", " | ".join(line_spans))
