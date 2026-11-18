import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.pdf")
print("Checking EN Section 9:")
for page_num in range(len(doc)):
    page = doc[page_num]
    words = page.get_text("words")
    for w in words:
        if 400 <= w[1] <= 780 and w[0] < 120 and ("9." in w[4] or any(k in w[4] for k in ["Appearance", "Odour", "pH", "Heat", "Saturated", "Density"])):
            print(f"p={page_num+1}, y0={w[1]:.2f}, x0={w[0]:.2f}, x1={w[2]:.2f}, text={repr(w[4])}")
doc.close()
