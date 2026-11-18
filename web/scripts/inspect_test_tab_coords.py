import fitz # PyMuPDF

doc = fitz.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/test_tab_cn.pdf")
print("Inspecting test_tab_cn.pdf coordinates:")
for page_num in range(len(doc)):
    page = doc[page_num]
    words = page.get_text("words")
    for w in words:
        if 400 <= w[1] <= 800 and w[0] < 150:
            if any(k in w[4] for k in ["9.", "外观", "嗅觉", "pH", "初沸", "闪点", "蒸发", "可燃", "燃烧", "饱和", "相对", "密度", "水溶"]):
                print(f"p={page_num+1}, y0={w[1]:.2f}, x0={w[0]:.2f}, x1={w[2]:.2f}, text={repr(w[4])}")
doc.close()
