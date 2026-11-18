import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.pdf")
print("Checking CN Section 11:")
for page_num in range(len(doc)):
    page = doc[page_num]
    words = page.get_text("words")
    for w in words:
        if "11." in w[4] or any(k in w[4] for k in ["急性毒性", "刺激", "致敏", "致突变", "致癌", "生殖毒性"]):
            if w[0] < 120:
                print(f"p={page_num+1}, y0={w[1]:.2f}, x0={w[0]:.2f}, x1={w[2]:.2f}, text={repr(w[4])}")
doc.close()
