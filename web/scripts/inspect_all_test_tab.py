import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/test_tab_cn.pdf")
print("All rows in Section 9 of test_tab_cn.pdf:")
for page_num in range(len(doc)):
    page = doc[page_num]
    words = page.get_text("words")
    for w in words:
        if w[0] < 120 and ("9." in w[4] or (79 <= w[0] <= 82 and (w[1] > 600 or page_num == 3))):
            print(f"p={page_num+1}, y0={w[1]:.2f}, x0={w[0]:.2f}, text={repr(w[4])}")
doc.close()
