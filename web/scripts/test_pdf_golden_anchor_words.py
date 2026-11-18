import pymupdf
import re

doc = pymupdf.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.pdf")

print("Testing words alignment:")
for pno, page in enumerate(doc):
    words = page.get_text("words")
    # 1. Numbered items in Section 8, 9, 11
    seq_words = [w for w in words if w[0] < 75 and re.match(r'^(?:8|9|11)\.\d+', w[4])]
    for sw in seq_words:
        line_words = [w for w in words if abs(w[1] - sw[1]) < 3.5 and w[0] > sw[0] and w[0] < 220]
        if line_words:
            first_text_word = min(line_words, key=lambda w: w[0])
            print(f"p{pno+1} {sw[4]}: '{first_text_word[4]}' at x0={first_text_word[0]:.2f}")

    # 2. Sub-labels without sequence
    sub_words = [w for w in words if any(w[4].startswith(k) for k in ['呼吸系统防护', '手部防护', '防护手套的合适材料', '建议：', '眼睛防护', '身体防护']) and w[0] < 120]
    for sw in sub_words:
        print(f"p{pno+1} sub-label: '{sw[4]}' at x0={sw[0]:.2f}")

    # 3. Wrapped line (性：)
    wrap_words = [w for w in words if w[4] in ['性：', '性:'] and w[0] > 70 and w[0] < 100]
    for ww in wrap_words:
        print(f"p{pno+1} wrapped line: '{ww[4]}' at x0={ww[0]:.2f}")
