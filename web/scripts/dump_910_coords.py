import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_CN 冠志.pdf")
page = doc[3] # 0-indexed page 4
words = page.get_text("words")
for w in words:
    if 600 <= w[1] <= 750 and w[0] < 200:
        print(f"y0={w[1]:.2f}, x0={w[0]:.2f}, x1={w[2]:.2f}, text={repr(w[4])}")
doc.close()
