import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.pdf")

print("Checking PA-3223 msds_CN 冠志.pdf for Section 9:")
for page_num in range(len(doc)):
    page = doc[page_num]
    text_instances = page.get_text("blocks")
    for block in text_instances:
        if "理化特性" in block[4] or "pH" in block[4]:
            print(f"Page {page_num + 1}:")
            # extract words / characters
            words = page.get_text("words")
            # filter words in this area
            for w in words:
                # w = (x0, y0, x1, y1, word, block_no, line_no, word_no)
                if any(k in w[4] for k in ["9.", "外观", "嗅觉", "pH", "燃烧", "饱和"]):
                    print(f"  x0={w[0]:.2f}, x1={w[1]:.2f}, text={w[4]}")
doc.close()
