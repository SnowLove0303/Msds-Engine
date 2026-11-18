import fitz # PyMuPDF
import sys

def inspect_pdf_s9(pdf_path, title):
    print(f"\n==================== {title} ====================")
    doc = fitz.open(pdf_path)
    found_s9 = False
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        words = page.get_text("words") # (x0, y0, x1, y1, word, block_no, line_no, word_no)
        # Search for "9." or "9.1"
        s9_words = [w for w in words if w[4].startswith("9.") and len(w[4]) <= 5]
        if s9_words:
            print(f"Page {page_idx + 1}: Found {len(s9_words)} section 9 index items")
            for w in s9_words:
                # find words on the same line (similar y0)
                same_line = [sw for sw in words if abs(sw[1] - w[1]) < 3 and sw[0] >= w[0]]
                same_line.sort(key=lambda x: x[0])
                line_str = " ".join([f"{sw[4]}(x0={sw[0]:.1f})" for sw in same_line[:3]])
                print(f"  {w[4]:<6}: {line_str}")

inspect_pdf_s9("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.pdf", "PU-202A CN PDF")
inspect_pdf_s9("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.pdf", "PU-202A EN PDF")
