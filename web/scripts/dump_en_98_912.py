import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.pdf")
print("Checking EN Section 9 around 9.8-9.12:")
for p in [3, 4]: # page 4 and 5
    page = doc[p]
    words = page.get_text("words")
    for w in words:
        if w[0] < 120 and ("9." in w[4] or any(k in w[4] for k in ["Heat", "Relative", "Density", "Solubility"])):
            print(f"p={p+1}, y0={w[1]:.2f}, x0={w[0]:.2f}, x1={w[2]:.2f}, text={repr(w[4])}")
doc.close()
