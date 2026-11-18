import sys
import re
import pymupdf

pdf_path = "E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_CN 冠志.pdf"
doc = pymupdf.open(pdf_path)

print(f"Inspecting coordinates in {pdf_path}:")

for pno, page in enumerate(doc):
    words = page.get_text("words")
    # Search for lines of interest: 8.1, 8.2, 9.1, 11.1, 11.7, 呼吸系统防护, 手部防护
    for w in words:
        txt = w[4]
        if any(kw in txt for kw in ['8.1', '8.2', '9.1', '11.1', '11.7', '呼吸', '手部', '防护手套', '眼面']):
            print(f"p{pno+1}: '{txt}' at x0={w[0]:.2f}, y0={w[1]:.2f}, x1={w[2]:.2f}, y1={w[3]:.2f}")
            # print all words on the same line
            line_words = [ow for ow in words if abs(ow[1] - w[1]) < 3.5]
            line_words.sort(key=lambda x: x[0])
            print("  Full line:", " | ".join(f"'{lw[4]}'({lw[0]:.2f})" for lw in line_words))
